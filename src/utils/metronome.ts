// ── metronome — a Web Audio click track ──────────────────────────────────
//
// Look-ahead scheduling ("a tale of two clocks"): a 25 ms timer tops up the
// clicks due in the next 120 ms on the audio clock, so the click stays steady
// however busy the page is. The first beat of each bar is accented.
//
// The click must never be heard as an answer by the guitar listener
// (`usePitchStream`). It is therefore not a tone but a short burst of
// high-passed noise: it has no pitch for the detector to lock onto (noise
// fails its periodicity test), and its energy sits above `LOW_BAND_HZ`, the
// band the listener filters to and measures plucks in. `renderClick` is pure
// so `scripts/check-scale-timing.mts` can run the real detector over exactly
// the samples that are played.
//
// Beat times are reported on the `performance.now()` clock, as *heard*
// (output latency included where the browser reports it), so a played note's
// onset can be compared with them directly.

import { applyBiquad, biquad } from './biquad';

/** Clicks are scheduled this far ahead on the audio clock. */
const LOOKAHEAD_S = 0.12;
const TIMER_MS = 25;
/** How many past beat times are kept for judging late-reported notes. */
const BEAT_MEMORY = 48;
const CLICK_MS = 30;

export interface ClickSpec {
  highpassHz: number;
  decayMs: number;
  peak: number;
}

export const CLICK_ACCENT: ClickSpec = { highpassHz: 2500, decayMs: 8, peak: 0.9 };
export const CLICK_BEAT: ClickSpec = { highpassHz: 4000, decayMs: 5, peak: 0.5 };

/** The click's samples: seeded white noise through two biquad high-passes
 *  and a fast exponential decay. Deterministic for a given sample rate. */
export function renderClick(sampleRate: number, accent: boolean): Float32Array {
  const spec = accent ? CLICK_ACCENT : CLICK_BEAT;
  const n = Math.round((CLICK_MS / 1000) * sampleRate);
  const out = new Float32Array(n);
  let seed = accent ? 0x9e3779b9 : 0x85ebca6b;
  const rand = () => {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5; seed >>>= 0;
    return (seed / 0xffffffff) * 2 - 1;
  };
  for (let i = 0; i < n; i++) out[i] = rand();
  // Two high-pass stages: 24 dB/oct below the click's band.
  out.set(applyBiquad(out, biquad('highpass', spec.highpassHz, sampleRate), 2));
  let peak = 0;
  for (let i = 0; i < n; i++) {
    out[i] *= Math.exp(-(i / sampleRate) * 1000 / spec.decayMs);
    peak = Math.max(peak, Math.abs(out[i]));
  }
  if (peak > 0) for (let i = 0; i < n; i++) out[i] *= spec.peak / peak;
  return out;
}

export interface MetronomeBeat {
  /** 0-based beat count since start. */
  index: number;
  accent: boolean;
  /** When the click is heard, on the `performance.now()` clock. */
  at: number;
}

/** Audio-clock time → `performance.now()` time at which it is heard. */
function heardAt(ctx: AudioContext, t: number): number {
  const ts = typeof ctx.getOutputTimestamp === 'function' ? ctx.getOutputTimestamp() : null;
  if (ts && ts.contextTime != null && ts.performanceTime != null && ts.performanceTime > 0) {
    return ts.performanceTime + (t - ts.contextTime) * 1000;
  }
  const latency = (ctx as AudioContext & { outputLatency?: number }).outputLatency || ctx.baseLatency || 0;
  return performance.now() + (t - ctx.currentTime + latency) * 1000;
}

export class Metronome {
  private readonly getCtx: () => AudioContext;
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private bpm = 60;
  private beatsPerBar = 4;
  private nextTime = 0;
  private nextIndex = 0;
  private beats: MetronomeBeat[] = [];
  private pending: { src: AudioBufferSourceNode; time: number }[] = [];
  private uiTimeouts = new Set<ReturnType<typeof setTimeout>>();
  private listeners = new Set<(beat: MetronomeBeat) => void>();
  private clickBuffers: { rate: number; accent: AudioBuffer; beat: AudioBuffer } | null = null;

  constructor(getCtx: () => AudioContext) {
    this.getCtx = getCtx;
  }

  get running(): boolean {
    return this.timer != null;
  }

  get tempo(): number {
    return this.bpm;
  }

  start(bpm: number, beatsPerBar = 4): void {
    this.stop();
    const ctx = this.getCtx();
    this.ctx = ctx;
    if (ctx.state === 'suspended') void ctx.resume();
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;
    this.nextIndex = 0;
    this.beats = [];
    this.nextTime = ctx.currentTime + 0.1;
    this.tick();
    this.timer = setInterval(() => this.tick(), TIMER_MS);
  }

  /** Change the tempo from the next click not yet scheduled. */
  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  stop(): void {
    if (this.timer != null) clearInterval(this.timer);
    this.timer = null;
    const now = this.ctx?.currentTime ?? 0;
    for (const p of this.pending) {
      if (p.time > now) { try { p.src.stop(); } catch { /* never started */ } }
    }
    this.pending = [];
    this.uiTimeouts.forEach(clearTimeout);
    this.uiTimeouts.clear();
  }

  /** Recent clicks as heard (ascending, `performance.now()` ms) — the
   *  already-scheduled next one included. */
  heardBeats(): number[] {
    return this.beats.map((b) => b.at);
  }

  /** Milliseconds from now to the first click heard at least `minMs` from
   *  now — to start something (the demo) on a beat. */
  msToBeatAfter(minMs: number): number {
    const now = performance.now();
    const beatMs = 60000 / this.bpm;
    const last = this.beats[this.beats.length - 1];
    if (!last) return minMs;
    let at = last.at;
    while (at < now + minMs) at += beatMs;
    while (at - beatMs >= now + minMs) at -= beatMs;
    return at - now;
  }

  /** Called on every click, at the moment it is heard (for a visual pulse). */
  subscribe(fn: (beat: MetronomeBeat) => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private buffers(ctx: AudioContext) {
    if (!this.clickBuffers || this.clickBuffers.rate !== ctx.sampleRate) {
      const make = (accent: boolean) => {
        const samples = renderClick(ctx.sampleRate, accent);
        const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
        buf.getChannelData(0).set(samples);
        return buf;
      };
      this.clickBuffers = { rate: ctx.sampleRate, accent: make(true), beat: make(false) };
    }
    return this.clickBuffers;
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    // Audio clock frozen (tab hidden, context suspended): nothing to do; a
    // backlog is skipped rather than fired in a burst on resume.
    if (this.nextTime < ctx.currentTime - 0.05) {
      const beatS = 60 / this.bpm;
      const behind = Math.ceil((ctx.currentTime - this.nextTime) / beatS);
      this.nextTime += behind * beatS;
      this.nextIndex += behind;
    }
    const nowS = ctx.currentTime;
    this.pending = this.pending.filter((p) => p.time > nowS - 0.1);
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      this.schedule(ctx, this.nextTime, this.nextIndex);
      this.nextTime += 60 / this.bpm;
      this.nextIndex += 1;
    }
  }

  private schedule(ctx: AudioContext, time: number, index: number): void {
    const accent = index % this.beatsPerBar === 0;
    const { accent: accentBuf, beat: beatBuf } = this.buffers(ctx);
    const src = ctx.createBufferSource();
    src.buffer = accent ? accentBuf : beatBuf;
    src.connect(ctx.destination);
    src.start(time);
    this.pending.push({ src, time });
    const beat: MetronomeBeat = { index, accent, at: heardAt(ctx, time) };
    this.beats.push(beat);
    if (this.beats.length > BEAT_MEMORY) this.beats.shift();
    const delay = Math.max(0, beat.at - performance.now());
    const id = setTimeout(() => {
      this.uiTimeouts.delete(id);
      this.listeners.forEach((fn) => fn(beat));
    }, delay);
    this.uiTimeouts.add(id);
  }
}
