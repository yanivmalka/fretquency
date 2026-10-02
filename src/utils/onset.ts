// ── onset — when did the note start? (pure) ─────────────────────────────
//
// The pitch detector needs a few ticks of a steady pitch before it names a
// note, so the moment a note is *reported* lags the moment it was *plucked*
// by a tenth of a second or more, and jitters by a whole tick. Fine for "which
// note", far too coarse for "was it on the beat". This module finds the pluck
// itself: a jump in the energy of the low band (where guitar notes live —
// the metronome's click is kept above it, see `metronome.ts`), located to the
// sample inside the newest analysis window.
//
// No Web Audio here — `usePitchStream` feeds it analyser frames; checked by
// `scripts/check-scale-timing.mts`.

import { applyBiquad, biquad } from './biquad';
import { detectPitch } from '../tuner/pitchDetect';
import { frequencyToNote } from '../tuner/noteUtils';

/** Guitar/bass fundamentals stay below this; the click stays above it. */
export const LOW_BAND_HZ = 1500;
/** Samples per energy window (~21 ms at 48 kHz). */
export const ONSET_WINDOW = 1024;

export interface LowBandFrame {
  /** RMS of the low-passed newest window. */
  rms: number;
  /** How long ago (ms) the attack inside that window began. */
  attackAgeMs: number;
}

/** Shortest segment either side of a candidate attack, in samples. */
const MIN_SEGMENT = 64;

/** Low-pass the newest `window` samples of `buffer` (two biquad stages,
 *  warmed up on the samples just before) and measure them: their RMS, and
 *  where the energy steps up — the attack, when this window holds one. */
export function lowBandFrame(
  buffer: ArrayLike<number>,
  sampleRate: number,
  window: number = ONSET_WINDOW,
  cutoffHz: number = LOW_BAND_HZ,
): LowBandFrame {
  const n = buffer.length;
  const win = Math.min(window, n);
  // The attack is searched for over two windows: a pluck whose first frame
  // rose just short of the trigger ratio is caught one frame later, by when
  // it has slid out of the newest window.
  const span = Math.min(2 * win, n);
  const warm = Math.min(n - span, 512);
  const all = applyBiquad(buffer, biquad('lowpass', cutoffHz, sampleRate), 2, n - span - warm);
  const filtered = all.subarray(warm);
  const prefix = new Float64Array(span + 1);
  for (let i = 0; i < span; i++) prefix[i + 1] = prefix[i] + filtered[i] * filtered[i];
  const total = prefix[span];
  // The attack is the split that best explains the span as "quieter, then
  // louder": the variance change-point, each side's log-energy weighted by
  // its length — so a short stretch that happens to sit on a slow wave's zero
  // crossing can't pass for the quiet part.
  const edge = Math.min(MIN_SEGMENT, Math.floor(span / 4));
  let attack = 0;
  let bestCost = Infinity;
  for (let k = edge; k <= span - edge; k++) {
    const before = prefix[k] / k;
    const after = (total - prefix[k]) / (span - k);
    if (after <= before) continue;
    const cost = k * Math.log(before + 1e-12) + (span - k) * Math.log(after + 1e-12);
    if (cost < bestCost) { bestCost = cost; attack = k; }
  }
  const recent = total - prefix[span - win];
  return {
    rms: win > 0 ? Math.sqrt(recent / win) : 0,
    attackAgeMs: ((span - attack) / sampleRate) * 1000,
  };
}

export interface OnsetTrackerOptions {
  /** The energy must jump by this factor over the frames before it. */
  ratio?: number;
  /** …and reach at least this RMS (quieter is room noise). */
  minRms?: number;
  /** Two onsets closer than this are one pluck rising over two frames. */
  refractoryMs?: number;
}

export interface OnsetTracker {
  /** Feed one frame taken at `now`; returns the onset time when this frame
   *  holds a new pluck, else null. */
  push(now: number, frame: LowBandFrame): number | null;
  /** Forget the energy history (after the mic was blanked). */
  reset(): void;
}

export function createOnsetTracker({
  ratio = 1.8, minRms = 0.006, refractoryMs = 70,
}: OnsetTrackerOptions = {}): OnsetTracker {
  // The two previous frames — an attack can straddle two windows, so the
  // jump is measured from the quieter of them.
  let prev1 = Infinity;
  let prev2 = Infinity;
  let lastOnset = -Infinity;
  return {
    push(now, frame) {
      const reference = Math.min(prev1, prev2);
      prev2 = prev1;
      prev1 = frame.rms;
      if (frame.rms < minRms) return null;
      if (!(frame.rms > reference * ratio)) return null;
      const at = now - frame.attackAgeMs;
      if (at - lastOnset < refractoryMs) return null;
      lastOnset = at;
      return at;
    },
    reset() {
      prev1 = Infinity;
      prev2 = Infinity;
    },
  };
}

/** When did the note at `freqHz` take over from whatever sounded before it?
 *  For a new note about as loud as the one it replaces, where the energy
 *  doesn't jump. A comb `x[i] − x[i−period]` tuned to the new note is near
 *  zero once it sounds and large while a different pitch sounded, so the
 *  residual steps down one period after the switch. Searches the newest
 *  `lookbackMs`; returns how long ago (ms) the note started, or null when
 *  there is no clear switch (silence before it — the energy onset covers
 *  that — or the same pitch throughout). */
export function locatePitchStart(
  buffer: ArrayLike<number>,
  sampleRate: number,
  freqHz: number,
  lookbackMs = PLAUSIBLE_BEFORE_MS,
): number | null {
  const n = buffer.length;
  const period = Math.round(sampleRate / freqHz);
  const span = Math.min(n - period, Math.round((lookbackMs / 1000) * sampleRate));
  if (period < 2 || span < 4 * period) return null;
  const from = n - span;
  const prefix = new Float64Array(span + 1);
  let signal = 0;
  for (let i = 0; i < span; i++) {
    const x = buffer[from + i];
    const e = x - buffer[from + i - period];
    prefix[i + 1] = prefix[i] + e * e;
    signal += x * x;
  }
  const total = prefix[span];
  const edge = Math.max(MIN_SEGMENT, period);
  let switchAt = -1;
  let bestCost = Infinity;
  let bestRatio = 0;
  for (let k = edge; k <= span - edge; k++) {
    const before = prefix[k] / k;
    const after = (total - prefix[k]) / (span - k);
    if (before <= after) continue;
    const cost = k * Math.log(before + 1e-12) + (span - k) * Math.log(after + 1e-12);
    if (cost < bestCost) { bestCost = cost; switchAt = k; bestRatio = before / (after + 1e-12); }
  }
  // A real switch: the comb residual drops several-fold, and what came before
  // was more than near-silence.
  if (switchAt < 0 || bestRatio < 4) return null;
  if (prefix[switchAt] / switchAt < (signal / span) * 0.05) return null;
  const start = Math.max(0, switchAt - period);
  return ((span - start) / sampleRate) * 1000;
}

/** Samples of the newest stretch a reading must also hold over (~85 ms). */
export const RECENT_SAMPLES = 4096;

/** Does the newest stretch of `history` read as `midi` (or an octave of it)?
 *  The detector's ~170 ms window, while one note hands over to the next,
 *  holds both — and two notes a minor third apart share a period two octaves
 *  and a fifth lower, a note nobody played. The newest ~85 ms holds only the
 *  new note, so a reading that disagrees with it is a hand-over, not a note. */
export function agreesWithRecent(history: Float32Array<ArrayBuffer>, sampleRate: number, midi: number): boolean {
  const recent = detectPitch(history.subarray(history.length - RECENT_SAMPLES), sampleRate);
  if (!recent) return false;
  const m = frequencyToNote(recent.frequency).midi;
  return m === midi || Math.abs(m - midi) === 12;
}

/** How a note's start time was found. */
export type OnsetSource = 'energy' | 'pitch' | 'report';

/** Pick the start time of a note just reported by the pitch detector.
 *  - `energyOnset`: the latest energy onset (`createOnsetTracker`), if any;
 *  - `pitchStart`: `locatePitchStart`'s answer as a time, if any;
 *  - `firstSeenAt`: when the detector first read this pitch.
 *  An energy onset is sample-accurate, so it wins when it is plausible for
 *  this note; the comb comes next; the detector's own time is the fallback. */
export function chooseNoteOnset(
  energyOnset: number | null,
  pitchStart: number | null,
  firstSeenAt: number,
): { at: number; source: OnsetSource } {
  const plausible = (t: number | null): t is number => t != null && t >= firstSeenAt - PLAUSIBLE_BEFORE_MS && t <= firstSeenAt + 20;
  if (plausible(energyOnset) && (!plausible(pitchStart) || Math.abs(energyOnset - pitchStart) <= 40)) {
    return { at: energyOnset, source: 'energy' };
  }
  if (plausible(pitchStart)) return { at: pitchStart, source: 'pitch' };
  return { at: firstSeenAt - REPORT_LAG_MS, source: 'report' };
}

/** A note is first read by the detector within its ~170 ms window, a
 *  120 ms tick and one more tick held back at a hand-over (`agreesWithRecent`)
 *  after the pluck, plus slack: an earlier time is another note. */
export const PLAUSIBLE_BEFORE_MS = 450;
/** Typical delay from a pluck to the detector first reading its pitch. */
export const REPORT_LAG_MS = 60;
