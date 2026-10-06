// Background beats — a quiet drum groove under a Practice round, to keep a
// steady pace. Off by default (Settings → Background beats).
//
// A small step sequencer rather than a fixed loop file: each style is a bar of
// steps per drum, and a look-ahead scheduler (the same "two clocks" scheme as
// metronome.ts — a 25 ms timer tops up the hits due in the next 120 ms on the
// audio clock) plays pre-rendered one-shot hits. Because the hits are scheduled
// one by one, the tempo can change between any two steps without the drums
// changing pitch — that is what lets the groove follow the round's pace.
//
// The hits (kick, snare, rim, hi-hat) are synthesized in code; there is no
// audio asset. Noise comes from a fixed-seed generator so every load sounds
// the same.
//
// Everything plays into one bed gain straight to the destination, NOT through
// the note makeup gain — the volume ladder boosts quiet samples, and the bed
// must stay under the question note at every step. Whether it plays at all
// (the setting, the feedback mode, the answer mode, running vs paused) is
// decided by useBackgroundBeat; this module only starts, stops and retunes it.
import { getAudioContext } from './audio';

export type BeatStyle = 'rock' | 'shuffle' | 'hiphop' | 'bossa';
export const BEAT_STYLES: readonly BeatStyle[] = ['rock', 'shuffle', 'hiphop', 'bossa'];
export const BEAT_STYLE_DEFAULT: BeatStyle = 'rock';

type Drum = 'kick' | 'snare' | 'rim' | 'hat';

interface Groove {
  /** Tempo at the round's starting pace. */
  bpm: number;
  /** Grid steps per beat: 4 = sixteenths, 3 = triplets (swing). */
  stepsPerBeat: number;
  /** One bar per drum, one character per step: X loud, x normal, o soft, . rest. */
  bars: Partial<Record<Drum, string>>;
}

const GROOVES: Record<BeatStyle, Groove> = {
  // Straight eighths: kick on 1 and 3 (+ a pickup), backbeat on 2 and 4.
  rock: {
    bpm: 90, stepsPerBeat: 4,
    bars: {
      kick:  'X.......X.x.....',
      snare: '....X.......X...',
      hat:   'x.o.x.o.x.o.x.o.',
    },
  },
  // Triplet grid, hats on the first and last of each triplet — the swung feel.
  shuffle: {
    bpm: 84, stepsPerBeat: 3,
    bars: {
      kick:  'X.....X.....',
      snare: '...X.....X..',
      hat:   'x.ox.ox.ox.o',
    },
  },
  // Boom-bap: a lazy kick, a heavy backbeat, soft hats.
  hiphop: {
    bpm: 84, stepsPerBeat: 4,
    bars: {
      kick:  'X......x..X.....',
      snare: '....X.......X...',
      hat:   'o.o.o.o.o.o.o.o.',
    },
  },
  // Bossa nova: the surdo-style kick and a rim click on the 3-2 clave.
  bossa: {
    bpm: 100, stepsPerBeat: 4,
    bars: {
      kick:  'X..xX..xX..xX..x',
      rim:   'x..x..x...x..x..',
      hat:   'o.o.o.o.o.o.o.o.',
    },
  },
};

const LEVEL: Record<string, number> = { X: 1, x: 0.7, o: 0.4 };
const DRUM_GAIN: Record<Drum, number> = { kick: 1, snare: 0.6, rim: 0.45, hat: 0.35 };

const BED_GAIN = 0.16;
const FADE_S = 0.08;
const LOOKAHEAD_S = 0.12;
const TIMER_MS = 25;
/** The pace multiplier is clamped so a long streak never turns the groove frantic. */
const MAX_PACE = 1.6;

// ── One-shot hits ────────────────────────────────────────────────────────

function makeNoise(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x80000000 - 1;
  };
}

function renderHit(drum: Drum, rate: number): Float32Array {
  const len = Math.round({ kick: 0.32, snare: 0.18, rim: 0.05, hat: 0.05 }[drum] * rate);
  const out = new Float32Array(len);
  if (drum === 'kick') {
    // A sine sweeping from ~120Hz down to ~45Hz under a fast decay.
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      phase += (2 * Math.PI * (45 + 75 * Math.exp(-t * 28))) / rate;
      out[i] = Math.sin(phase) * Math.exp(-t * 11);
    }
  } else if (drum === 'snare') {
    // A short 180Hz body plus a longer band of high-passed noise (the wires).
    const noise = makeNoise(0x51a7e);
    let prevIn = 0, prevOut = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      const x = noise();
      prevOut = 0.8 * (prevOut + x - prevIn);
      prevIn = x;
      out[i] = 0.55 * Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 35)
        + 0.6 * prevOut * Math.exp(-t * 22);
    }
  } else if (drum === 'rim') {
    // A woody click: two high partials that die almost at once.
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      out[i] = (Math.sin(2 * Math.PI * 1700 * t) + 0.5 * Math.sin(2 * Math.PI * 2500 * t)) * Math.exp(-t * 90);
    }
  } else {
    // A closed hi-hat: high-passed noise with a very short decay.
    const noise = makeNoise(0x2f6b1d);
    let prevIn = 0, prevOut = 0;
    for (let i = 0; i < len; i++) {
      const x = noise();
      prevOut = 0.86 * (prevOut + x - prevIn);
      prevIn = x;
      out[i] = prevOut * Math.exp(-(i / rate) * 70);
    }
  }
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < len; i++) out[i] /= peak;
  return out;
}

let _hits: { rate: number; buf: Record<Drum, AudioBuffer> } | null = null;
function hitBuffers(ctx: AudioContext): Record<Drum, AudioBuffer> {
  if (!_hits || _hits.rate !== ctx.sampleRate) {
    const make = (d: Drum) => {
      const samples = renderHit(d, ctx.sampleRate);
      const b = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      b.getChannelData(0).set(samples);
      return b;
    };
    _hits = {
      rate: ctx.sampleRate,
      buf: { kick: make('kick'), snare: make('snare'), rim: make('rim'), hat: make('hat') },
    };
  }
  return _hits.buf;
}

// ── The sequencer ────────────────────────────────────────────────────────

interface Playing {
  ctx: AudioContext;
  bed: GainNode;
  groove: Groove;
  style: BeatStyle;
  pace: number;
  step: number;
  nextTime: number;
  timer: ReturnType<typeof setInterval>;
  pending: { src: AudioBufferSourceNode; time: number }[];
  stopTimer: ReturnType<typeof setTimeout> | null;
  /** A two-bar Settings preview, not a round's groove. */
  preview: boolean;
}

let _play: Playing | null = null;

const clampPace = (p: number) => (Number.isFinite(p) ? Math.min(MAX_PACE, Math.max(1, p)) : 1);

function stepSeconds(p: Playing): number {
  return 60 / (p.groove.bpm * p.pace) / p.groove.stepsPerBeat;
}

function tick(p: Playing): void {
  const { ctx } = p;
  // Audio clock frozen (tab hidden, context suspended): skip the backlog
  // rather than fire it in a burst on resume.
  if (p.nextTime < ctx.currentTime - 0.05) {
    const behind = Math.ceil((ctx.currentTime - p.nextTime) / stepSeconds(p));
    p.nextTime += behind * stepSeconds(p);
    p.step += behind;
  }
  p.pending = p.pending.filter((x) => x.time > ctx.currentTime - 0.1);
  const bufs = hitBuffers(ctx);
  while (p.nextTime < ctx.currentTime + LOOKAHEAD_S) {
    for (const [drum, bar] of Object.entries(p.groove.bars) as [Drum, string][]) {
      const level = LEVEL[bar[p.step % bar.length]];
      if (!level) continue;
      const g = ctx.createGain();
      g.gain.value = level * DRUM_GAIN[drum];
      g.connect(p.bed);
      const src = ctx.createBufferSource();
      src.buffer = bufs[drum];
      src.connect(g);
      src.start(p.nextTime);
      src.onended = () => g.disconnect();
      p.pending.push({ src, time: p.nextTime });
    }
    p.nextTime += stepSeconds(p);
    p.step += 1;
  }
}

/** Start the groove (fades in). If it is already playing, just switches the
 *  style / pace in place. `pace` 1 = the style's own tempo; a faster round
 *  passes more (clamped to 1–1.6). */
export function startBackgroundBeat(style: BeatStyle = BEAT_STYLE_DEFAULT, pace = 1): void {
  if (_play && _play.stopTimer == null && !_play.preview) {
    setBackgroundBeatStyle(style);
    setBackgroundBeatPace(pace);
    return;
  }
  if (_play) hardStop(_play);
  let ctx: AudioContext;
  try { ctx = getAudioContext(); } catch { return; }
  if (ctx.state === 'suspended') void ctx.resume();
  const bed = ctx.createGain();
  bed.gain.setValueAtTime(0, ctx.currentTime);
  bed.gain.linearRampToValueAtTime(BED_GAIN, ctx.currentTime + FADE_S);
  bed.connect(ctx.destination);
  const p: Playing = {
    ctx, bed, style, groove: GROOVES[style] ?? GROOVES[BEAT_STYLE_DEFAULT], pace: clampPace(pace),
    step: 0, nextTime: ctx.currentTime + 0.05, timer: 0 as unknown as ReturnType<typeof setInterval>,
    pending: [], stopTimer: null, preview: false,
  };
  p.timer = setInterval(() => tick(p), TIMER_MS);
  _play = p;
  tick(p);
}

/** Switch the style from the next bar line, so the groove never stumbles. */
export function setBackgroundBeatStyle(style: BeatStyle): void {
  const p = _play;
  if (!p || p.style === style) return;
  const next = GROOVES[style];
  if (!next) return;
  // Finish the current bar on the old groove, then start the new one at its step 0.
  const oldLen = p.groove.stepsPerBeat * 4;
  const left = (oldLen - (p.step % oldLen)) % oldLen;
  const switchAt = p.nextTime + left * stepSeconds(p);
  p.style = style;
  setTimeout(() => {
    if (_play !== p) return;
    // Hits up to the bar line are already scheduled on the old grid; drop any
    // scheduled beyond it and resume on the new one.
    for (const x of p.pending) if (x.time >= switchAt - 1e-4) { try { x.src.stop(); } catch { /* not started */ } }
    p.pending = p.pending.filter((x) => x.time < switchAt - 1e-4);
    p.groove = next;
    p.step = 0;
    p.nextTime = Math.max(switchAt, p.ctx.currentTime + 0.02);
    tick(p);
  }, Math.max(0, (switchAt - p.ctx.currentTime - LOOKAHEAD_S) * 1000));
}

/** Follow the round's pace: applied from the next step not yet scheduled. */
export function setBackgroundBeatPace(pace: number): void {
  if (_play) _play.pace = clampPace(pace);
}

function hardStop(p: Playing): void {
  clearInterval(p.timer);
  if (p.stopTimer) clearTimeout(p.stopTimer);
  for (const x of p.pending) { try { x.src.stop(); } catch { /* not started */ } }
  p.pending = [];
  p.bed.disconnect();
  if (_play === p) _play = null;
}

/** Stop the groove with a short fade (no-op if it isn't playing). */
export function stopBackgroundBeat(): void {
  const p = _play;
  if (!p || p.stopTimer != null) return;
  clearInterval(p.timer);
  const now = p.ctx.currentTime;
  p.bed.gain.cancelScheduledValues(now);
  p.bed.gain.setValueAtTime(p.bed.gain.value, now);
  p.bed.gain.linearRampToValueAtTime(0, now + FADE_S);
  p.stopTimer = setTimeout(() => hardStop(p), FADE_S * 1000 + 30);
}

/** Play two bars of a style at its own tempo — the Settings preview. Replaces
 *  whatever is playing. Returns a cancel function. */
export function previewBackgroundBeat(style: BeatStyle): () => void {
  if (_play) hardStop(_play);
  startBackgroundBeat(style, 1);
  const p = _play as Playing | null;
  if (p) p.preview = true;
  if (!p) return () => {};
  const g = GROOVES[style];
  const ms = (2 * 4 * 60 * 1000) / g.bpm;
  const id = setTimeout(() => { if (_play === p) stopBackgroundBeat(); }, ms);
  return () => { clearTimeout(id); if (_play === p) stopBackgroundBeat(); };
}
