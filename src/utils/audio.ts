import type { SampleRegion } from './ukuleleSamples';
import { detectPitch } from '../tuner/pitchDetect';
import { frequencyToNote } from '../tuner/noteUtils';
import { vlog, verror } from './debugLog';

// Active instrument's tuning + sample source. Swapped by setAudioInstrument()
// when the user switches instrument; defaults to the standard 6-string guitar.
let openMidi = [64, 59, 55, 50, 45, 40];
let baseUrl = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_guitar_nylon-mp3/';
let stringCount = 6;
let maxFret = 21;

// When set, notes are generated in real time by synthesizeMandolinPluck()
// below instead of being fetched as samples — see the comment on
// InstrumentConfig.synth in utils/instruments.ts for why (no properly
// licensed sampled mandolin exists anywhere).
type SynthKind = 'none' | 'mandolin' | 'ukuleleBaritone';
let synthKind: SynthKind = 'none';

// When set, this instrument's samples aren't one-exact-file-per-note — see
// the comment on InstrumentConfig.sampleMap in utils/instruments.ts and
// utils/ukuleleSamples.ts. null for every instrument with a full chromatic
// sample set (guitar, bass, banjo).
let sampleMap: SampleRegion[] | null = null;

export function setAudioInstrument(cfg: {
  openMidi: number[];
  soundfontUrl: string;
  stringCount: number;
  maxFret: number;
  synth?: SynthKind;
  sampleMap?: SampleRegion[];
}): void {
  openMidi = cfg.openMidi;
  baseUrl = cfg.soundfontUrl;
  stringCount = cfg.stringCount;
  maxFret = cfg.maxFret;
  synthKind = cfg.synth ?? 'none';
  sampleMap = cfg.sampleMap ?? null;
}

// Silent mode: mutes the drill's *content* audio (the question note and the
// beep). UI clicks, haptics and on-screen celebrations are unaffected — those
// live in feedback.ts and keep their own flag. Toggled from App.tsx.
let _silent = false;
export function setSilent(v: boolean) { _silent = v; }

// Keyed by soundfont URL + note name: two instruments can need the same pitch
// from different soundfonts, so the URL must be part of the key.
const cache: Record<string, AudioBuffer> = {};
// AudioScheduledSourceNode is the interface both AudioBufferSourceNode
// (sampled notes) and OscillatorNode (synthesized notes) implement, so
// stopPlayback() can stop either kind without caring which one is active.
let activeSources: AudioScheduledSourceNode[] = [];
let soundEndTime = 0;
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** The app's one playback context, for sound scheduled on the audio clock
 *  (the metronome). */
export function getAudioContext(): AudioContext {
  return getCtx();
}

// The soundfont MP3 samples are mastered quiet, so every drill note runs
// through a shared makeup-gain stage: a boost (>1×) followed by a limiter that
// catches the peaks the boost would otherwise clip. Route note playback into
// masterOut() instead of ctx.destination; the limiter keeps even the top of the
// range from distorting.
//
// The boost the user picks in Settings (`pref_noteVolume`) is one of five
// discrete levels. An earlier build exposed the raw multiplier on a continuous
// 1–10× slider, which surfaced meaningless readouts ("38%" … "385%"); five
// clearly-spaced steps replace it. Spacing is roughly geometric (~+4 dB per
// step) so each level is an audible jump. Level 2 is the long-standing default;
// true silence is the separate Silent mode toggle, not level 1.
export const NOTE_VOLUME_LEVELS: readonly number[] = [1.6, 2.6, 4, 6.3, 10];
export const NOTE_VOLUME_MIN = NOTE_VOLUME_LEVELS[0];
export const NOTE_VOLUME_MAX = NOTE_VOLUME_LEVELS[NOTE_VOLUME_LEVELS.length - 1];
export const NOTE_VOLUME_DEFAULT = NOTE_VOLUME_LEVELS[1];

/** Nearest level index (0-based) for an arbitrary stored gain multiplier. */
export function noteVolumeLevelIndex(v: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : NOTE_VOLUME_DEFAULT;
  let best = 0;
  let bestDist = Infinity;
  NOTE_VOLUME_LEVELS.forEach((lvl, i) => {
    const d = Math.abs(lvl - n);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

let _boost = NOTE_VOLUME_DEFAULT;
let masterGain: GainNode | null = null;

/** Set the makeup-gain multiplier for drill-note playback (persisted as `pref_noteVolume`). */
export function setNoteVolume(boost: number): void {
  const b = Number.isFinite(boost) ? boost : NOTE_VOLUME_DEFAULT;
  _boost = Math.min(NOTE_VOLUME_MAX, Math.max(NOTE_VOLUME_MIN, b));
  if (masterGain) {
    const ctx = masterGain.context;
    masterGain.gain.setTargetAtTime(_boost, ctx.currentTime, 0.02);
  }
}

function masterOut(ctx: AudioContext): AudioNode {
  if (masterGain && masterGain.context === ctx) return masterGain;
  masterGain = ctx.createGain();
  masterGain.gain.value = _boost;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  masterGain.connect(limiter);
  limiter.connect(ctx.destination);
  return masterGain;
}

/** Call on first user gesture to unlock the AudioContext */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

function midiName(midi: number): string {
  const n = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  return n[midi % 12] + (Math.floor(midi / 12) - 1);
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ── Played-pitch debug check ─────────────────────────────────────────────
// Users have reported drill notes occasionally sounding a bit sharp/flat
// across every instrument. Rather than a fix built on guessing why, this taps
// the raw source (sample or synth oscillator) that was just scheduled and,
// once it's had a moment to actually sound, runs the tuner's own
// autocorrelation pitch detector (src/tuner/pitchDetect.ts) against it —
// turning "sounds off" into a measured cents figure in the debug log
// (utils/debugLog.ts, viewable via DebugLogPanel with no DevTools needed).
//
// The tap is a dead-end AnalyserNode routed through a silent gain into
// destination (an AnalyserNode with nothing downstream doesn't reliably get
// pulled each render quantum otherwise) so it can never be heard or change
// what's actually played.
const PITCH_CHECK_FFT_SIZE = 4096;
const PITCH_CHECK_DELAY_MS = 120; // let the attack transient settle before sampling
const PITCH_CHECK_TOLERANCE_CENTS = 25; // about a quarter-tone

let silentSink: GainNode | null = null;
function getSilentSink(ctx: AudioContext): GainNode {
  if (silentSink && silentSink.context === ctx) return silentSink;
  silentSink = ctx.createGain();
  silentSink.gain.value = 0;
  silentSink.connect(ctx.destination);
  return silentSink;
}

function schedulePitchCheck(
  ctx: AudioContext, tap: AudioNode, midi: number, label: string, extraDelayMs = 0,
): void {
  try {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = PITCH_CHECK_FFT_SIZE;
    tap.connect(analyser);
    analyser.connect(getSilentSink(ctx));
    const buf = new Float32Array(analyser.fftSize);
    setTimeout(() => {
      analyser.getFloatTimeDomainData(buf);
      analyser.disconnect();
      const expectedFreq = midiToFreq(midi);
      const result = detectPitch(buf, ctx.sampleRate);
      if (!result) {
        vlog('[audio-pitch-check]', { label, expectedFreq: Math.round(expectedFreq * 10) / 10, detected: 'no clear pitch' });
        return;
      }
      const cents = Math.round(1200 * Math.log2(result.frequency / expectedFreq));
      const entry = {
        label,
        expectedNote: midiName(midi),
        expectedFreq: Math.round(expectedFreq * 10) / 10,
        detectedFreq: Math.round(result.frequency * 10) / 10,
        detectedNote: frequencyToNote(result.frequency).name,
        cents,
        clarity: Math.round(result.clarity * 100) / 100,
      };
      if (Math.abs(cents) > PITCH_CHECK_TOLERANCE_CENTS) verror('[audio-pitch-check] deviation', entry);
      else vlog('[audio-pitch-check]', entry);
    }, extraDelayMs + PITCH_CHECK_DELAY_MS);
  } catch { /* diagnostic only — never let it break playback */ }
}

// ── Mandolin synthesis ───────────────────────────────────────────────────
// No properly-licensed sampled mandolin exists in any free soundfont set (see
// the comment on InstrumentConfig.synth in utils/instruments.ts), so mandolin
// notes are synthesized here instead of loaded. The goal is a bright, quickly
// decaying plucked-string tone with the characteristic "double string" shimmer
// of a mandolin course (two strings tuned to the same pitch, never perfectly
// in tune with each other):
//
//   - two detuned oscillators (±5 cents) approximate the paired course
//   - a bandpass filter centred a few harmonics up brightens the tone —
//     mandolins sound thinner/more nasal than a guitar because of the short
//     scale length and metal strings
//   - a short filtered noise burst at note-on approximates the pick "chick"
//     transient that plucked-with-a-plectrum instruments have and a bowed or
//     sample-less oscillator tone otherwise lacks entirely
//   - fast attack, exponential decay — mandolin notes ring far more briefly
//     than a sustained sample
//
// Returns every node that needs to be started/stopped so the caller can push
// them onto `activeSources` (for stopPlayback()) exactly like a sampled note.
function synthesizeMandolinPluck(
  ctx: AudioContext, dest: AudioNode, midi: number,
  when: number, dur: number, peak: number,
): AudioScheduledSourceNode[] {
  const freq = midiToFreq(midi);
  const t0 = ctx.currentTime + when;
  const nodes: AudioScheduledSourceNode[] = [];

  // Body filter: emphasise the 3rd–5th harmonic region for that bright,
  // slightly nasal mandolin timbre rather than a guitar's rounder tone.
  const body = ctx.createBiquadFilter();
  body.type = 'bandpass';
  body.frequency.value = freq * 4;
  body.Q.value = 1.3;

  const tone = ctx.createGain();
  tone.connect(body);
  body.connect(dest);

  // Two oscillators a few cents apart, standing in for the two strings of one
  // course — never perfectly unison, which is what gives a real mandolin its
  // characteristic shimmer/beating.
  [-5, 5].forEach((cents) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = cents;
    osc.connect(tone);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    nodes.push(osc);
  });

  // Fast attack (2 ms, avoids a click) then an exponential pluck decay.
  // exponentialRamp can't target 0 directly, so it ramps to a small epsilon.
  tone.gain.setValueAtTime(0, t0);
  tone.gain.linearRampToValueAtTime(peak, t0 + 0.002);
  tone.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  // Pick-attack transient: a short burst of highpassed noise right at note-on.
  const noiseDur = 0.02;
  const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseDur), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 2500;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(peak * 0.5, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + noiseDur);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t0);
  noise.stop(t0 + noiseDur);
  nodes.push(noise);

  return nodes;
}

// ── Baritone ukulele synthesis ───────────────────────────────────────────
// No free/CC0-licensed baritone ukulele sample library exists anywhere
// (checked FreePats — the project's only ukulele bank is the standard
// reentrant-tuning one already used for soprano/concert/tenor; there is no
// separate baritone patch). Its D-G-B-E tuning also falls well below the
// pitch range that existing UKULELE_SAMPLES was verified against (see the
// comment on InstrumentConfig.synth and the ukulele variants block in
// utils/instruments.ts). Same situation as mandolin, same fix: synthesize
// instead of sample.
//
// Distinct from the mandolin voice on purpose — a baritone uke is a single
// nylon string per course (no paired-string shimmer), warmer and rounder
// than a mandolin's bright metal-string tone:
//   - a single oscillator (no detuned pair — nothing to shimmer against)
//   - a lowpass filter (not bandpass) for a mellow, rounded nylon tone
//   - a softer, shorter pick-noise transient (finger/thumb pluck, not a
//     hard plectrum attack) and a slightly slower attack
//   - longer decay than mandolin (nylon strings sustain more than a
//     mandolin's short, percussive ring)
function synthesizeUkuleleBaritonePluck(
  ctx: AudioContext, dest: AudioNode, midi: number,
  when: number, dur: number, peak: number,
): AudioScheduledSourceNode[] {
  const freq = midiToFreq(midi);
  const t0 = ctx.currentTime + when;
  const nodes: AudioScheduledSourceNode[] = [];

  // Body filter: a mellow lowpass a couple of octaves above the fundamental,
  // rather than mandolin's bright bandpass — nylon strings roll off the
  // upper harmonics much faster than metal ones.
  const body = ctx.createBiquadFilter();
  body.type = 'lowpass';
  body.frequency.value = freq * 3;
  body.Q.value = 0.7;

  const tone = ctx.createGain();
  tone.connect(body);
  body.connect(dest);

  const osc = ctx.createOscillator();
  osc.type = 'triangle'; // softer harmonic content than mandolin's sawtooth
  osc.frequency.value = freq;
  osc.connect(tone);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  nodes.push(osc);

  // Slightly slower attack (finger pluck, not a hard plectrum strike) and a
  // longer exponential decay — nylon strings ring noticeably longer.
  tone.gain.setValueAtTime(0, t0);
  tone.gain.linearRampToValueAtTime(peak, t0 + 0.006);
  tone.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 1.3);

  // Soft, brief noise burst at note-on for the finger/thumb attack —
  // lower-passed and quieter than mandolin's pick "chick".
  const noiseDur = 0.015;
  const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseDur), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1200;
  noiseFilter.Q.value = 0.8;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(peak * 0.25, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + noiseDur);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t0);
  noise.stop(t0 + noiseDur);
  nodes.push(noise);

  return nodes;
}

// ── Sparse sample maps (e.g. ukulele) ───────────────────────────────────
// For an instrument whose sampleMap is set, one recorded file covers several
// neighbouring semitones instead of every note having its own exact
// recording — see the comment on InstrumentConfig.sampleMap in
// utils/instruments.ts and utils/ukuleleSamples.ts for where this data and
// approach comes from (it mirrors that release's own SFZ instrument mapping).
function resolveRegion(midi: number): SampleRegion | null {
  if (!sampleMap) return null;
  return sampleMap.find(r => midi >= r.lokey && midi <= r.hikey) ?? null;
}

// Extra playback-rate multiplier so a region's sample lands exactly on
// `midi` (1 for every plain, one-sample-per-note instrument, or for a note
// that IS the mapped sample's own recorded pitch).
function pitchRatio(midi: number): number {
  const region = resolveRegion(midi);
  if (!region) return 1;
  const semitones = (midi - region.keycenter) + region.tuneCents / 100;
  return Math.pow(2, semitones / 12);
}

async function loadSample(midi: number): Promise<AudioBuffer | null> {
  if (synthKind !== 'none') return null;
  const region = resolveRegion(midi);
  const name = region ? region.file : midiName(midi);
  const key = baseUrl + name;
  if (cache[key]) return cache[key];
  try {
    const buf = await (await fetch(baseUrl + name + '.mp3')).arrayBuffer();
    cache[key] = await getCtx().decodeAudioData(buf);
    return cache[key];
  } catch { return null; }
}

/** Freeze all scheduled/playing audio in place (Web Audio has no per-source pause). */
export function pauseAudioContext() {
  const ctx = audioCtx;
  if (ctx && ctx.state === 'running') ctx.suspend();
}

/** Resume audio exactly where it was frozen. */
export function resumeAudioContext() {
  const ctx = audioCtx;
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function stopPlayback() {
  activeSources.forEach(s => { try { s.stop(); } catch { /* source already stopped */ } });
  activeSources = [];
  soundEndTime = 0;
}

export function isSoundPlaying(): boolean {
  return Date.now() < soundEndTime;
}

/** Milliseconds until the currently-scheduled note playback has finished (0 if idle). */
export function soundRemainingMs(): number {
  return Math.max(0, soundEndTime - Date.now());
}

export async function playNote(stringNum: number, fret: number, rate = 1) {
  if (_silent) return;
  stopPlayback();
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const midi = openMidi[stringNum - 1] + fret;
  const buffer = synthKind === 'none' ? await loadSample(midi) : null;
  if (synthKind === 'none' && !buffer) return;
  // The pluck *cadence* scales with `rate` — grain offsets and envelope
  // durations compress by 1/rate so a faster question compresses the whole
  // note event — but the sample's own playbackRate is NOT multiplied by
  // `rate`. It used to be: `src.playbackRate.value = rate * pitchRatio(midi)`,
  // which meant the pitch drifted with question speed too — and pitch is
  // brutally sensitive to that in 12-TET (a mere 6% rate bump is already a
  // full semitone, per 1200*log2(rate)), so even a modest timing-ramp
  // speedup could make the sample sound like a different note than the one
  // being quizzed. Pitch now stays locked to the target note at any speed;
  // only the note's timing/cadence compresses.
  //
  // As the run's timing ramp accelerates (rate climbs above 1×) the note is
  // also plucked fewer times — three plucks at normal speed, two once the
  // questions tighten, then a single pluck when it's fastest — so a fast
  // question stays short and clear instead of a rushed triplet. Each pluck
  // keeps its full ring-out (only the 1/rate compression applies).
  const offsets = rate >= 1.9 ? [0] : rate >= 1.35 ? [0, 0.4] : [0, 0.4, 0.8];
  const lastIdx = offsets.length - 1;
  offsets.forEach((t, i) => {
    const offset = t / rate;
    const dur = (i < lastIdx ? 0.4 : 0.8) / rate;
    if (synthKind === 'mandolin' || synthKind === 'ukuleleBaritone') {
      const nodes = synthKind === 'mandolin'
        ? synthesizeMandolinPluck(ctx, masterOut(ctx), midi, offset, dur, 0.7)
        : synthesizeUkuleleBaritonePluck(ctx, masterOut(ctx), midi, offset, dur, 0.7);
      activeSources.push(...nodes);
      if (i === 0) schedulePitchCheck(ctx, nodes[0], midi, `${stringNum}/${fret}`);
      return;
    }
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    src.playbackRate.value = pitchRatio(midi);
    src.connect(gain);
    gain.connect(masterOut(ctx));
    if (i === 0) schedulePitchCheck(ctx, src, midi, `${stringNum}/${fret}`);
    // Anchor each pluck's decay to ITS OWN offset — without this, every
    // ramp implicitly starts from the current gain value at the moment
    // this call executes (t=0, all 3 plucks scheduled in the same tick),
    // not from when its own source actually starts sounding. That left the
    // 2nd/3rd plucks starting already ~90% decayed with no attack, which is
    // what read as a smeared echo instead of a clean note.
    gain.gain.setValueAtTime(1, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + dur);
    src.start(ctx.currentTime + offset);
    src.stop(ctx.currentTime + offset + dur);
    activeSources.push(src);
  });
  soundEndTime = Date.now() + (offsets[lastIdx] + 0.8) * 1000 / rate;
}

export function beep() {
  if (_silent) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 440;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export async function playNoteSingle(stringNum: number, fret: number, rate = 1) {
  if (_silent) return;
  stopPlayback();
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const midi = openMidi[stringNum - 1] + fret;
  if (synthKind === 'mandolin' || synthKind === 'ukuleleBaritone') {
    const dur = 0.4 / rate;
    const nodes = synthKind === 'mandolin'
      ? synthesizeMandolinPluck(ctx, masterOut(ctx), midi, 0, dur, 0.6)
      : synthesizeUkuleleBaritonePluck(ctx, masterOut(ctx), midi, 0, dur, 0.6);
    activeSources.push(...nodes);
    schedulePitchCheck(ctx, nodes[0], midi, `${stringNum}/${fret}`);
    soundEndTime = Date.now() + dur * 1000;
    return;
  }
  const buffer = await loadSample(midi);
  if (!buffer) return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  src.playbackRate.value = pitchRatio(midi);
  src.connect(gain);
  gain.connect(masterOut(ctx));
  schedulePitchCheck(ctx, src, midi, `${stringNum}/${fret}`);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
  src.start();
  src.stop(ctx.currentTime + 0.4);
  activeSources.push(src);
  soundEndTime = Date.now() + 400;
}

export async function playNoteSequence(stringNum: number, frets: number[], totalMs: number) {
  if (_silent) return;
  stopPlayback();
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const slotSec = totalMs / frets.length / 1000;
  if (synthKind === 'mandolin' || synthKind === 'ukuleleBaritone') {
    frets.forEach((f, i) => {
      const offset = i * slotSec;
      const dur = Math.min(slotSec * 0.9, 0.6);
      const midi = openMidi[stringNum - 1] + f;
      const nodes = synthKind === 'mandolin'
        ? synthesizeMandolinPluck(ctx, masterOut(ctx), midi, offset, dur, 0.6)
        : synthesizeUkuleleBaritonePluck(ctx, masterOut(ctx), midi, offset, dur, 0.6);
      activeSources.push(...nodes);
      schedulePitchCheck(ctx, nodes[0], midi, `${stringNum}/${f}`, offset * 1000);
    });
    soundEndTime = Date.now() + totalMs;
    return;
  }
  const buffers = await Promise.all(frets.map(f => loadSample(openMidi[stringNum - 1] + f)));
  frets.forEach((f, i) => {
    const buffer = buffers[i];
    if (!buffer) return;
    const offset = i * slotSec;
    const dur = Math.min(slotSec * 0.9, 0.6);
    const midi = openMidi[stringNum - 1] + f;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    src.playbackRate.value = pitchRatio(midi);
    src.connect(gain);
    gain.connect(masterOut(ctx));
    schedulePitchCheck(ctx, src, midi, `${stringNum}/${f}`, offset * 1000);
    gain.gain.setValueAtTime(0.6, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + dur);
    src.start(ctx.currentTime + offset);
    src.stop(ctx.currentTime + offset + dur);
    activeSources.push(src);
  });
  soundEndTime = Date.now() + totalMs;
}

/** Strum several places at once (a chord read off a tab): each note starts
 *  `gapMs` after the one before and all of them ring together. */
export async function playChordStrum(places: readonly { string: number; fret: number }[], gapMs = 35) {
  if (_silent || places.length === 0) return;
  stopPlayback();
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const dur = 1.2;
  const midis = places.map((p) => openMidi[p.string - 1] + p.fret);
  const buffers = synthKind === 'none' ? await Promise.all(midis.map((m) => loadSample(m))) : [];
  midis.forEach((midi, i) => {
    const offset = (i * gapMs) / 1000;
    if (synthKind === 'mandolin' || synthKind === 'ukuleleBaritone') {
      const nodes = synthKind === 'mandolin'
        ? synthesizeMandolinPluck(ctx, masterOut(ctx), midi, offset, dur, 0.45)
        : synthesizeUkuleleBaritonePluck(ctx, masterOut(ctx), midi, offset, dur, 0.45);
      activeSources.push(...nodes);
      return;
    }
    const buffer = buffers[i];
    if (!buffer) return;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    src.playbackRate.value = pitchRatio(midi);
    src.connect(gain);
    gain.connect(masterOut(ctx));
    gain.gain.setValueAtTime(0.45, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + dur);
    src.start(ctx.currentTime + offset);
    src.stop(ctx.currentTime + offset + dur);
    activeSources.push(src);
  });
  soundEndTime = Date.now() + (midis.length * gapMs) + dur * 1000;
}

/** One picked note that glides to another fret on the same string — a slide
 *  or a bend read off a tab. The sampled instruments glide the pitch after
 *  `holdMs`; the synthesized ones play the two notes one after the other. */
export async function playNoteGlide(stringNum: number, fromFret: number, toFret: number, holdMs = 220, glideMs = 180) {
  if (_silent) return;
  if (synthKind !== 'none') {
    await playNoteSequence(stringNum, [fromFret, toFret], 2 * (holdMs + glideMs));
    return;
  }
  stopPlayback();
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const from = openMidi[stringNum - 1] + fromFret;
  const to = openMidi[stringNum - 1] + toFret;
  const buffer = await loadSample(from);
  if (!buffer) return;
  const dur = (holdMs + glideMs) / 1000 + 0.6;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  const startRate = pitchRatio(from);
  const t0 = ctx.currentTime;
  src.playbackRate.setValueAtTime(startRate, t0 + holdMs / 1000);
  src.playbackRate.linearRampToValueAtTime(startRate * 2 ** ((to - from) / 12), t0 + (holdMs + glideMs) / 1000);
  src.connect(gain);
  gain.connect(masterOut(ctx));
  gain.gain.setValueAtTime(0.8, t0);
  gain.gain.exponentialRampToValueAtTime(0.01, t0 + dur);
  src.start(t0);
  src.stop(t0 + dur);
  activeSources.push(src);
  soundEndTime = Date.now() + dur * 1000;
}

export async function preloadAllSamples(): Promise<void> {
  if (synthKind !== 'none') return;
  const promises: Promise<unknown>[] = [];
  const topFret = Math.min(maxFret, 18);
  for (let s = 0; s < stringCount; s++)
    for (let f = 0; f <= topFret; f++)
      promises.push(loadSample(openMidi[s] + f));
  await Promise.allSettled(promises);
}
