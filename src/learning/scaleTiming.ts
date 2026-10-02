// ── scaleTiming — judging a played note against the metronome (pure) ────
//
// "Tap the scale in order" with the metronome on: every note the learner
// plays is compared with the nearest click. Within ±⅙ of a beat it is on
// time; otherwise early or late. A run is "clean" when no step slipped and
// nearly every note was on time — and only a clean run raises the tempo, by
// `TEMPO_STEP`, the slow-and-steady method a teacher uses with a click.
//
// All times are milliseconds on one clock (`performance.now()` in the app).
// No React, no Web Audio — checked by `scripts/check-scale-timing.mts`.

export const TEMPO_MIN = 40;
export const TEMPO_MAX = 160;
export const TEMPO_STEP = 4;
export const TEMPO_DEFAULT = 60;

/** Half-width of the "on time" window, as a fraction of one beat. */
export const ON_TIME_BEATS = 1 / 6;
/** A clean run needs at least this share of its notes on time (one stray
 *  reading in ten is forgiven — pitch onsets are estimated, not exact). */
export const CLEAN_ON_TIME_SHARE = 0.9;
/** Mean offset (in beats) past which the summary names a tendency. */
export const TENDENCY_BEATS = 1 / 12;

export type TimingVerdict = 'onTime' | 'early' | 'late';

export interface TimingJudgement {
  /** When the beat this note was judged against was heard. */
  beatAt: number;
  /** Note time minus beat time: negative = early, positive = late. */
  offsetMs: number;
  /** `offsetMs` in beats, in (−½, ½]. */
  offsetBeats: number;
  verdict: TimingVerdict;
}

export function clampTempo(bpm: number): number {
  if (!Number.isFinite(bpm)) return TEMPO_DEFAULT;
  return Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, Math.round(bpm)));
}

export function beatMsFor(bpm: number): number {
  return 60000 / clampTempo(bpm);
}

/** The tempo for the next run: up a step after a clean run, else unchanged. */
export function nextTempo(bpm: number, clean: boolean): number {
  return clean ? clampTempo(bpm + TEMPO_STEP) : clampTempo(bpm);
}

/** Judge one note at `at` against the click times in `beats` (ascending).
 *  The beat length is the gap to the neighbouring click, so a tempo change
 *  mid-session is judged by the tempo actually heard; `fallbackBeatMs` is
 *  used when only one click is known. `null` when there are no clicks. */
export function judgeNote(
  at: number,
  beats: readonly number[],
  fallbackBeatMs: number,
  toleranceBeats: number = ON_TIME_BEATS,
): TimingJudgement | null {
  if (beats.length === 0 || !Number.isFinite(at)) return null;
  let best = 0;
  for (let i = 1; i < beats.length; i++) {
    if (Math.abs(beats[i] - at) < Math.abs(beats[best] - at)) best = i;
  }
  const beatAt = beats[best];
  const offsetMs = at - beatAt;
  // The beat on the side the note fell on sets the beat length.
  const neighbour = offsetMs >= 0 ? beats[best + 1] : beats[best - 1];
  const beatMs = neighbour != null ? Math.abs(neighbour - beatAt) : fallbackBeatMs;
  const offsetBeats = beatMs > 0 ? offsetMs / beatMs : 0;
  const verdict: TimingVerdict = Math.abs(offsetBeats) <= toleranceBeats + 1e-9
    ? 'onTime'
    : offsetBeats < 0 ? 'early' : 'late';
  return { beatAt, offsetMs, offsetBeats, verdict };
}

export interface TimingSummary {
  total: number;
  onTime: number;
  early: number;
  late: number;
  /** Average offset in beats over every judged note (0 when none). */
  meanOffsetBeats: number;
  /** 'rushing' / 'dragging' when the average leans that way, else null. */
  tendency: 'rushing' | 'dragging' | null;
}

export function summarizeTiming(judgements: readonly TimingJudgement[]): TimingSummary {
  let onTime = 0, early = 0, late = 0, sum = 0;
  for (const j of judgements) {
    if (j.verdict === 'onTime') onTime += 1;
    else if (j.verdict === 'early') early += 1;
    else late += 1;
    sum += j.offsetBeats;
  }
  const total = judgements.length;
  const meanOffsetBeats = total > 0 ? sum / total : 0;
  const tendency = total === 0 ? null
    : meanOffsetBeats <= -TENDENCY_BEATS ? 'rushing'
    : meanOffsetBeats >= TENDENCY_BEATS ? 'dragging'
    : null;
  return { total, onTime, early, late, meanOffsetBeats, tendency };
}

/** A clean run: every step of the run played (`notes` judged out of
 *  `runLength`), none slipped, and at least `CLEAN_ON_TIME_SHARE` on time. */
export function isCleanRun(summary: TimingSummary, runLength: number, slipped: number): boolean {
  if (runLength <= 0 || slipped > 0) return false;
  if (summary.total < runLength) return false;
  return summary.onTime >= Math.ceil(summary.total * CLEAN_ON_TIME_SHARE);
}

// ── Stored tempo per scale/box ───────────────────────────────────────────
// One map, `item id → bpm`, keyed like the SRS (`scale:<type>:<position>`).

export type TempoMap = Record<string, number>;

export function normalizeTempoMap(raw: unknown): TempoMap {
  const out: TempoMap = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k === 'string' && k.startsWith('scale:') && typeof v === 'number' && Number.isFinite(v)) {
      out[k] = clampTempo(v);
    }
  }
  return out;
}

export function tempoFor(map: TempoMap, itemId: string, fallback: number = TEMPO_DEFAULT): number {
  return clampTempo(map[itemId] ?? fallback);
}
