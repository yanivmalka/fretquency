// ── Single-utterance microphone capture with simple VAD ─────────────────
//
// Shared by the voice-calibration screen and the template-matching
// recogniser (`templateSpeechEngine.ts`). Records until a short trailing
// silence (or a hard cap), then resolves with the raw mono PCM.
//
// It can either open its own short-lived microphone, or reuse a long-lived
// `MicSession` (see `openMicSession`) so the recogniser does not tear down
// and re-open getUserMedia + a fresh AudioContext on every keep-alive listen
// turn within one question.
//
// It intentionally does NOT go through the Web Speech API or any network —
// that is the whole point of the personal-profile path.

import { vlog } from './debugLog';

export interface CapturedUtterance {
  pcm: Float32Array;
  sampleRate: number;
}

type MinimalAudioContext = AudioContext & { close(): Promise<void> };

/**
 * A microphone kept open across several `captureUtterance` calls. The
 * template recogniser opens one per question and reuses it for every
 * keep-alive listen turn, instead of re-opening getUserMedia (and a new
 * AudioContext) each turn — which added latency and made the OS microphone
 * indicator flicker on and off.
 */
export interface MicSession {
  ctx: MinimalAudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  sampleRate: number;
  /** Stop the tracks and close the context. Safe to call more than once. */
  close(): void;
}

export interface CaptureOptions {
  /** Give up if speech has not started within this long (ms). */
  onsetTimeoutMs?: number;
  /** Stop this long after speech drops back below the noise gate (ms). */
  trailingSilenceMs?: number;
  /** Absolute cap on recorded speech length (ms). */
  maxSpeechMs?: number;
  /** Abort signal — resolve `null` promptly when it fires. */
  signal?: AbortSignal;
  /** Called once per audio block with the current RMS level (0..~1). */
  onLevel?: (rms: number) => void;
  /**
   * Reuse an already-open microphone instead of opening (and later closing)
   * a fresh one. The session is left open for its owner to close.
   */
  session?: MicSession;
}

const DEFAULTS = {
  onsetTimeoutMs: 4000,
  trailingSilenceMs: 350,
  maxSpeechMs: 2500,
};

/** A capture whose post-onset peak stays under this multiple of the silence gate is a transient, not a word. */
const TRANSIENT_PEAK_OVER_GATE = 2;

/** Post-onset block levels as fractions of the peak, for the `[voice] vad` line. */
function levelStats(levels: number[], peak: number) {
  if (!levels.length || peak <= 0) return {};
  const sorted = [...levels].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  const tailBlocks = levels.slice(-12);
  const tail = tailBlocks.reduce((s, v) => s + v, 0) / tailBlocks.length;
  const rel = (v: number) => +(v / peak).toFixed(3);
  return { p10: rel(at(0.1)), p50: rel(at(0.5)), p90: rel(at(0.9)), tail: rel(tail), blocks: levels.length };
}

function makeAudioContext(): MinimalAudioContext {
  const Ctor: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctor() as MinimalAudioContext;
}

/**
 * Open a microphone that outlives a single utterance. Resolves `null` when
 * the mic is unavailable or permission was refused.
 */
export async function openMicSession(): Promise<MicSession | null> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    return null;
  }
  const ctx = makeAudioContext();
  // A context can come up "suspended" (autoplay policy, backgrounded tab);
  // resume it so `onaudioprocess` actually fires.
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { /* noop */ }
  }
  const source = ctx.createMediaStreamSource(stream);
  let closed = false;
  return {
    ctx,
    stream,
    source,
    sampleRate: ctx.sampleRate,
    close() {
      if (closed) return;
      closed = true;
      try { source.disconnect(); } catch { /* noop */ }
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => { /* noop */ });
    },
  };
}

/** Samples per audio block — the ScriptProcessor buffer size, and the VAD's step. */
export const CAPTURE_BLOCK = 2048;

/** What one block did to an `UtteranceVad`. */
export type VadStep =
  | { kind: 'waiting' }
  | { kind: 'onset' }
  | { kind: 'speech' }
  /** A lone click was dropped; the VAD is waiting for speech again. */
  | { kind: 'transient' }
  | { kind: 'done'; pcm: Float32Array };

/**
 * The endpointing decisions of `captureUtterance`, block by block, with no
 * audio graph and no timers — so the exact same logic can be replayed over a
 * recorded stream offline (`replayCapture`, `scripts/eval-voice-e2e.mts`).
 * The onset timeout is the caller's: live it is a wall-clock timer, offline
 * it is `waitedSamples`.
 */
export class UtteranceVad {
  private readonly preRollBlocks: number;
  private readonly preRoll: Float32Array[] = [];
  private readonly speech: Float32Array[] = [];
  private readonly levels: number[] = [];
  private noiseFloor = 0.003;
  private noiseSamples = 0;
  private silenceRun = 0;
  private speechSamples = 0;
  private peak = 0;
  private loudest = 0;
  started = false;
  /** RMS of the last block pushed. */
  lastRms = 0;
  /** Samples heard since listening (re)started with no onset yet. */
  waitedSamples = 0;

  readonly sampleRate: number;
  private readonly trailingSilenceMs: number;
  private readonly maxSpeechMs: number;

  constructor(sampleRate: number, trailingSilenceMs: number, maxSpeechMs: number, blockSize = CAPTURE_BLOCK) {
    this.sampleRate = sampleRate;
    this.trailingSilenceMs = trailingSilenceMs;
    this.maxSpeechMs = maxSpeechMs;
    this.preRollBlocks = Math.ceil((0.15 * sampleRate) / blockSize);
  }

  /**
   * Nothing crossed the onset gate. Whether the speaker was silent or spoke
   * under a gate raised by a contaminated noise floor is only visible from
   * the loudest block against the gate.
   */
  logOnsetTimeout(): void {
    const gate = Math.max(0.012, this.noiseFloor * 3.5);
    vlog('[voice] onset timeout', {
      noiseFloor: +this.noiseFloor.toFixed(4),
      gate: +gate.toFixed(4),
      loudest: +this.loudest.toFixed(4),
      loudestOverGate: +(this.loudest / gate).toFixed(2),
    });
  }

  push(block: Float32Array): VadStep {
    let sumSq = 0;
    for (let i = 0; i < block.length; i++) sumSq += block[i] * block[i];
    const rms = Math.sqrt(sumSq / block.length);
    this.lastRms = rms;

    if (!this.started) {
      this.waitedSamples += block.length;
      if (rms > this.loudest) this.loudest = rms;
      // Noise floor = the quietest block heard so far, not an average of
      // the first ~200ms. Listening restarts ~90ms after a rejected answer,
      // usually while the speaker is already repeating it, so those first
      // blocks are their voice. Averaging them once set the floor to 0.10
      // and the onset gate to 0.36 — above the speaker's own peak of 0.13 —
      // and the turn ended deaf on the onset timeout. A minimum drops back
      // as soon as there is any gap between words.
      this.noiseFloor = this.noiseSamples === 0 ? rms : Math.min(this.noiseFloor, rms);
      this.noiseSamples++;
      this.preRoll.push(new Float32Array(block));
      while (this.preRoll.length > this.preRollBlocks) this.preRoll.shift();

      const gate = Math.max(0.012, this.noiseFloor * 3.5);
      if (rms > gate) {
        this.started = true;
        for (const b of this.preRoll) this.speech.push(b);
        this.speechSamples = this.speech.reduce((n, b) => n + b.length, 0);
        return { kind: 'onset' };
      }
      return { kind: 'waiting' };
    }

    this.speech.push(new Float32Array(block));
    this.speechSamples += block.length;
    if (rms > this.peak) this.peak = rms;
    this.levels.push(rms);

    const gate = Math.max(0.010, this.noiseFloor * 2.5);
    if (rms < gate) {
      this.silenceRun += block.length;
    } else {
      this.silenceRun = 0;
    }

    const trailing = (this.trailingSilenceMs / 1000) * this.sampleRate;
    const cap = (this.maxSpeechMs / 1000) * this.sampleRate;
    if (this.silenceRun >= trailing && this.peak < gate * TRANSIENT_PEAK_OVER_GATE) {
      // Onset fired on a single block (a click, a knock) and nothing after
      // it came close to speech level — no word was spoken. Live rounds
      // took such captures and answered "E" from a 100–140ms segment, at
      // post-onset peaks of 0.7× and 1.0× the silence gate (and a stray
      // tail at 1.3×); every real word in the same logs peaked at 3.9× or
      // more, even in a noisy room. Go back to waiting for real speech
      // instead of handing it to the matcher.
      vlog('[voice] transient ignored', {
        ms: Math.round((this.speechSamples / this.sampleRate) * 1000),
        noiseFloor: +this.noiseFloor.toFixed(4),
        gate: +gate.toFixed(4),
        peak: +this.peak.toFixed(4),
      });
      this.started = false;
      this.speech.length = 0;
      this.preRoll.length = 0;
      this.speechSamples = 0;
      this.silenceRun = 0;
      this.peak = 0;
      this.loudest = 0;
      this.levels.length = 0;
      this.waitedSamples = 0;
      return { kind: 'transient' };
    }
    if (this.silenceRun >= trailing || this.speechSamples >= cap) {
      // Why the recording stopped, and the levels that decided it. Ending
      // on 'cap' means the level never fell below `gate` for long enough —
      // with people talking nearby it never does, and the segmenter is
      // then handed seconds of audio instead of one spoken word.
      vlog('[voice] vad', {
        reason: this.silenceRun >= trailing ? 'silence' : 'cap',
        ms: Math.round((this.speechSamples / this.sampleRate) * 1000),
        noiseFloor: +this.noiseFloor.toFixed(4),
        gate: +gate.toFixed(4),
        peak: +this.peak.toFixed(4),
        peakOverGate: +(this.peak / gate).toFixed(1),
        // The level distribution during the capture, relative to its own
        // peak — what an endpoint "silence = a fraction of the peak" rule
        // would have to sit between. `tail` is the last ~500ms: on a 'cap'
        // stop it is the room noise that kept the recording open.
        ...levelStats(this.levels, this.peak),
      });
      const pcm = new Float32Array(this.speechSamples);
      let off = 0;
      for (const b of this.speech) { pcm.set(b, off); off += b.length; }
      return { kind: 'done', pcm };
    }
    return { kind: 'speech' };
  }
}

/**
 * Run `captureUtterance`'s endpointing over an already-recorded stream, the
 * way it would have run live on that audio: the same blocks, the same onset
 * timeout (counted in samples). Resolves the captured PCM or `null` for an
 * onset timeout. A stream that ends mid-word is padded with silence.
 */
export function replayCapture(
  stream: Float32Array,
  sampleRate: number,
  opts: Pick<CaptureOptions, 'onsetTimeoutMs' | 'trailingSilenceMs' | 'maxSpeechMs'> = {},
  blockSize = CAPTURE_BLOCK,
): Float32Array | null {
  const cfg = { ...DEFAULTS, ...opts };
  const vad = new UtteranceVad(sampleRate, cfg.trailingSilenceMs, cfg.maxSpeechMs, blockSize);
  const onsetSamples = (cfg.onsetTimeoutMs / 1000) * sampleRate;
  const silent = new Float32Array(blockSize);
  const maxBlocks = Math.ceil(stream.length / blockSize)
    + Math.ceil(((cfg.maxSpeechMs + cfg.onsetTimeoutMs) / 1000) * sampleRate / blockSize);
  for (let b = 0; b < maxBlocks; b++) {
    const off = b * blockSize;
    let block: Float32Array = silent;
    if (off + blockSize <= stream.length) {
      block = stream.subarray(off, off + blockSize);
    } else if (off < stream.length) {
      // The last partial block, zero-padded to a full one.
      block = new Float32Array(blockSize);
      block.set(stream.subarray(off));
    }
    const step = vad.push(block);
    if (step.kind === 'done') return step.pcm;
    if (!vad.started && vad.waitedSamples >= onsetSamples) {
      vad.logOnsetTimeout();
      return null;
    }
  }
  return null;
}

/**
 * Record one spoken word. Resolves `null` if nothing was said before the
 * onset timeout, or if the capture was aborted, or if the mic is
 * unavailable.
 */
export async function captureUtterance(
  opts: CaptureOptions = {},
): Promise<CapturedUtterance | null> {
  const cfg = { ...DEFAULTS, ...opts };
  if (opts.signal?.aborted) return null;

  const owned = !opts.session;
  const session = opts.session ?? (await openMicSession());
  if (!session) return null;
  if (opts.signal?.aborted) {
    if (owned) session.close();
    return null;
  }

  const { ctx, source, sampleRate } = session;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { /* noop */ }
  }

  const processor = ctx.createScriptProcessor(CAPTURE_BLOCK, 1, 1);
  const vad = new UtteranceVad(sampleRate, cfg.trailingSilenceMs, cfg.maxSpeechMs, CAPTURE_BLOCK);

  return await new Promise<CapturedUtterance | null>((resolve) => {
    let done = false;
    // ScriptProcessor needs a sink to pump; route to a muted gain so it is
    // silent. Created per capture and disconnected in `cleanup` so a shared
    // session does not accumulate orphan nodes.
    const sink = ctx.createGain();

    const cleanup = () => {
      if (done) return;
      done = true;
      clearTimeout(onsetTimer);
      opts.signal?.removeEventListener('abort', onAbort);
      // Drop this capture's graph. `source` belongs to the session, so only
      // the edge into our processor is removed, not the source itself.
      try { source.disconnect(processor); } catch { /* noop */ }
      try { processor.disconnect(); } catch { /* noop */ }
      try { sink.disconnect(); } catch { /* noop */ }
      // Only a session we opened ourselves is torn down here; a shared
      // MicSession outlives the capture and is closed by its owner.
      if (owned) session.close();
    };

    const finish = (value: CapturedUtterance | null) => {
      cleanup();
      resolve(value);
    };

    const onAbort = () => finish(null);
    opts.signal?.addEventListener('abort', onAbort);

    const onOnsetTimeout = () => {
      if (vad.started) return;
      vad.logOnsetTimeout();
      finish(null);
    };
    let onsetTimer = setTimeout(onOnsetTimeout, cfg.onsetTimeoutMs);

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (done) return;
      const step = vad.push(e.inputBuffer.getChannelData(0));
      opts.onLevel?.(vad.lastRms);
      if (step.kind === 'onset') {
        clearTimeout(onsetTimer);
      } else if (step.kind === 'transient') {
        onsetTimer = setTimeout(onOnsetTimeout, cfg.onsetTimeoutMs);
      } else if (step.kind === 'done') {
        finish({ pcm: step.pcm, sampleRate });
      }
    };

    source.connect(processor);
    sink.gain.value = 0;
    processor.connect(sink);
    sink.connect(ctx.destination);
  });
}

// ── Post-capture segmentation ─────────────────────────────────────────
//
// The segmented personal-profile recogniser (`templateSpeechEngine.ts`)
// needs the spoken answer split into its words: "C" on its own, or
// "C" + "sharp". `captureUtterance` hands back one PCM blob covering the
// whole answer; this splits it on the internal silence between words.
//
// When the speaker runs the two words together with no real gap only one
// voiced run is found. If that run is clearly longer than a single word it
// is force-split at its quietest interior frame so "Csharp" still yields
// two segments.

const SEG_FRAME_MS = 20;
/** A silence gap shorter than this is within one word; longer splits words. */
const SEG_SPLIT_GAP_MS = 110;
/** A lone voiced run longer than this is force-split (assumed letter+accidental). */
const SEG_LONG_WORD_MS = 480;
/** Padding kept around each extracted segment. */
const SEG_PAD_MS = 30;

export function segmentUtterance(
  pcm: Float32Array,
  sampleRate: number,
  opts: { split?: 'auto' | 'never' | 'always' } = {},
): Float32Array[] {
  const frame = Math.max(1, Math.round((SEG_FRAME_MS / 1000) * sampleRate));
  const nFrames = Math.floor(pcm.length / frame);
  if (nFrames < 2) return pcm.length ? [pcm] : [];

  const rms = new Float32Array(nFrames);
  for (let f = 0; f < nFrames; f++) {
    let sumSq = 0;
    const base = f * frame;
    for (let i = 0; i < frame; i++) { const s = pcm[base + i]; sumSq += s * s; }
    rms[f] = Math.sqrt(sumSq / frame);
  }

  // Noise floor: 20th-percentile frame energy.
  const sorted = [...rms].sort((a, b) => a - b);
  const noiseFloor = sorted[Math.floor(sorted.length * 0.2)] || 0;
  const gate = Math.max(0.010, noiseFloor * 2.5);

  // Contiguous voiced frame runs.
  const runs: [number, number][] = [];
  let start = -1;
  for (let f = 0; f < nFrames; f++) {
    if (rms[f] > gate) {
      if (start < 0) start = f;
    } else if (start >= 0) {
      runs.push([start, f]);
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, nFrames]);
  if (!runs.length) return [pcm];

  // Merge runs separated by a gap shorter than SEG_SPLIT_GAP_MS.
  const splitGap = Math.round(SEG_SPLIT_GAP_MS / SEG_FRAME_MS);
  const merged: [number, number][] = [[runs[0][0], runs[0][1]]];
  for (let i = 1; i < runs.length; i++) {
    const prev = merged[merged.length - 1];
    if (runs[i][0] - prev[1] < splitGap) prev[1] = runs[i][1];
    else merged.push([runs[i][0], runs[i][1]]);
  }

  let segFrames: [number, number][];
  const longWord = Math.round(SEG_LONG_WORD_MS / SEG_FRAME_MS);
  if (merged.length >= 2) {
    segFrames = merged.slice(0, 2);
  } else {
    const [s, e] = merged[0];
    segFrames = [[s, e]];
    const mode = opts.split ?? 'auto';
    // Split at the quietest interior frame (middle 60%).
    //
    // 'auto' only does so for a run longer than SEG_LONG_WORD_MS whose
    // quietest interior frame is near the noise floor. That test cannot
    // actually tell one word from two: a measured session had single letters
    // running 380-400ms and a fluent "F sharp" 480-600ms, so the length
    // threshold sits inside the overlap, and a fluent pair has no interior
    // near-silence to find. Both fluent "F sharp" takes therefore came back
    // whole and were matched against single-letter templates, which cannot
    // fit — the letter scored 23-24 against 10.7 for the same words spoken
    // with a pause.
    //
    // 'always' ignores both tests, so the caller can score the split reading
    // as a hypothesis of its own rather than trusting a threshold to choose.
    if (mode === 'always' || (mode === 'auto' && e - s > longWord)) {
      const lo = s + Math.floor((e - s) * 0.2);
      const hi = e - Math.floor((e - s) * 0.2);
      let cut = lo;
      let min = Infinity;
      for (let f = lo; f < hi; f++) if (rms[f] < min) { min = rms[f]; cut = f; }
      if (mode === 'always' || min <= gate * 1.2) segFrames = [[s, cut], [cut, e]];
    }
  }

  const pad = Math.round((SEG_PAD_MS / 1000) * sampleRate);
  return segFrames.map(([s, e]) => {
    const a = Math.max(0, s * frame - pad);
    const b = Math.min(pcm.length, e * frame + pad);
    return pcm.slice(a, b);
  });
}

/**
 * The single spoken word inside a calibration take, trimmed the same way a
 * question-time segment is.
 *
 * A stored template and the live utterance it is compared against must go
 * through identical preprocessing, or DTW pays a distance penalty that has
 * nothing to do with which word was spoken. Calibration used to store the
 * MFCC of the whole capture — the word plus the trailing silence that ends
 * it — while `templateSpeechEngine` matches against energy-trimmed
 * segments. Every stored template therefore carried several hundred
 * milliseconds of silence the query did not, adding a large label-independent
 * cost to all of them: in a captured session, matching a speaker against
 * their own recordings scored 21-30, the same range as matching against
 * synthetic templates of a different voice entirely, and one label won
 * almost every turn regardless of what was said.
 *
 * Force-splitting is disabled here: at question time a long voiced run is
 * split because it may be "C sharp", but a calibration take is one word by
 * construction and splitting it would store half a word.
 */
export function isolateWord(pcm: Float32Array, sampleRate: number): Float32Array {
  const segments = segmentUtterance(pcm, sampleRate, { split: 'never' });
  if (!segments.length) return pcm;
  // Normally exactly one; a stray noise burst can add another, so keep the
  // longest, which is the word.
  return segments.reduce((best, s) => (s.length > best.length ? s : best));
}

/**
 * Trim leading / trailing silence off a whole question-time capture, keeping
 * every word inside it — unlike `isolateWord`, which keeps only the longest
 * run and so drops the "sharp" of a paused "F … sharp". Gate is relative to
 * the capture's own peak (15%, floor 0.015) with 30ms padding.
 *
 * Kept identical to `trimSilence` in `scripts/wav-lib.mts`: the whole-utterance
 * accidental match in `templateSpeechEngine` was measured offline through that
 * function (`scripts/eval-accidental-split.mts`), and `isolateWord` in its
 * place lost most of the gain (sharps 13 → 9 of 30).
 */
export function trimToVoice(pcm: Float32Array, sampleRate: number): Float32Array {
  const win = Math.max(1, Math.round(sampleRate * 0.02));
  const rmsAt = (start: number) => {
    let acc = 0;
    const end = Math.min(pcm.length, start + win);
    for (let i = start; i < end; i++) acc += pcm[i] * pcm[i];
    return Math.sqrt(acc / (end - start));
  };
  let peak = 0;
  for (let i = 0; i < pcm.length; i += win) peak = Math.max(peak, rmsAt(i));
  const gate = Math.max(0.015, peak * 0.15);
  let first = 0;
  for (let i = 0; i < pcm.length; i += win) { if (rmsAt(i) > gate) { first = i; break; } }
  let last = pcm.length;
  for (let i = pcm.length - win; i >= 0; i -= win) { if (rmsAt(i) > gate) { last = i + win; break; } }
  const pad = Math.round(sampleRate * 0.03);
  return pcm.subarray(Math.max(0, first - pad), Math.min(pcm.length, last + pad));
}
