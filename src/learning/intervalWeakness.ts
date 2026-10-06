// ── intervalWeakness.ts — which interval qualities need work ─────────────
//
// Intervals Learning spec §10.5 / T4. The interval-domain sibling of
// `weakness.ts`: given the capped, synced interval answer history
// (`InstrumentLearningState.intervalHistory`) and the interval SRS map
// (`intervalSrs`), rank the 11 drilled qualities by how much they need work.
//
// It answers the same question `weakness.ts` answers for note positions —
// "given recent play and the SRS schedule, what should the interval Teacher
// pull into the next session, and why?" — over interval *qualities*
// (`interval:<n>`) instead of `(string, fret)` positions. It never reads the
// note history and never touches `srs` / `weakness.ts` (spec §17.2).
//
// Signals (any one is enough to make a quality a candidate), the same four as
// `weakness.ts`:
//   • low recent accuracy   — a recency-weighted mean, not lifetime
//   • slow correct answers   — recency-weighted mean time of correct answers
//   • repeated recent misses — several wrong/timeouts in the last few tries
//   • overdue SRS review     — its `dueAt` has passed
//
// Because there are only 11 items and interval sessions are short, the evidence
// gate is stricter than the notes one (an effective 4 recent answers vs 3 — a
// short lucky streak over 11 qualities is easy). Recent accuracy is an
// exponential time-decay weighted mean (shared `recency.ts` model, 14-day
// half-life); the recency horizon is a 180-day performance cap, not a window.
// Deterministic: same inputs → same ranked list, ties broken by semitone size.

import type { IntervalHistoryRow } from './learningState';
import {
  intervalSkillItemId,
  parseIntervalId,
  seedLegacyIntervalSrs,
  skillOfForm,
  type IntervalDir,
  type IntervalSkill,
} from './intervalItem';
import { overdueByMs, type SrsItem, type SrsMap } from './srs';
import {
  DAY_MS,
  DEFAULT_HALF_LIFE_DAYS,
  HARD_CAP_DAYS,
  weightedAccuracy,
  weightedMeanSeconds,
} from './recency';

export interface IntervalWeaknessConfig {
  /** Effective sample size (Σ of the decay weights) a quality needs before its
   *  weighted accuracy / speed are trusted, so a couple of unlucky answers
   *  can't brand a quality weak. Stricter than the notes lane (4 vs 3). */
  minEffectiveN: number;
  /** Weighted recent accuracy at or below this (with enough evidence) ⇒ weak. 0–1. */
  lowAccuracy: number;
  /** Weighted mean time (seconds) of recent CORRECT answers at or above this ⇒ weak. */
  slowSeconds: number;
  /** How many of the most recent answers the "repeated misses" check looks at. */
  mistakeLookback: number;
  /** That many wrong/timeout answers within the lookback ⇒ weak. */
  mistakeThreshold: number;
  /** Half-life of the recency decay weight, in days. */
  halfLifeDays: number;
  /** History rows older than this many days are dropped entirely before the
   *  decay model sees them — a performance / storage bound only, never a data
   *  delete. A quality with only stale history (and no live SRS row) drops off
   *  the list; a genuinely due SRS item still surfaces via its schedule. */
  maxAgeDays: number;
}

export const DEFAULT_INTERVAL_WEAKNESS_CONFIG: IntervalWeaknessConfig = {
  minEffectiveN: 4,
  lowAccuracy: 0.7,
  slowSeconds: 5,
  mistakeLookback: 4,
  mistakeThreshold: 2,
  halfLifeDays: DEFAULT_HALF_LIFE_DAYS,
  maxAgeDays: HARD_CAP_DAYS,
};

export type IntervalWeaknessReason =
  | 'lowAccuracy'
  | 'slow'
  | 'recentMistakes'
  | 'overdue';

export interface IntervalWeaknessSignal {
  /** `interval:<n>:<skill>:<dir>` — the SRS id for this quality in one skill
   *  and direction ("ear is weak for M3 down" is one signal). */
  itemId: string;
  skill: IntervalSkill;
  dir: IntervalDir;
  /** Interval size in semitones, 1..11. */
  semitones: number;
  /** Raw count of surviving rows (inside the 180-day cap) for this quality. */
  attempts: number;
  /** Recency-weighted accuracy, 0–1 (0 when there is no usable evidence). */
  weightedAccuracy: number;
  /** Effective sample size — Σ of the decay weights over the surviving rows. */
  effectiveN: number;
  /** Recency-weighted mean seconds of the correct answers (0 if none). */
  avgCorrectSeconds: number;
  /** Wrong + timeout answers within `mistakeLookback`. */
  recentMistakes: number;
  /** SRS `dueAt` has passed. */
  overdue: boolean;
  /** ms overdue (0 when not overdue / no SRS row). */
  overdueByMs: number;
  /** Every signal that fired, in a fixed order. */
  reasons: IntervalWeaknessReason[];
  /** Deterministic priority; higher = more urgent. */
  score: number;
}

// A timeout is folded into `intervalHistory` as `correct: false` (spec §10.2),
// so a miss is simply a non-correct row — no `null` case as in `HistoryEntry`.
function isMiss(r: IntervalHistoryRow): boolean {
  return r.correct !== true;
}

/**
 * Rank every interval quality that has recent history OR an SRS row by how
 * much it needs work. Qualities with no signal at all are omitted.
 * Deterministic.
 *
 * @param rows  the instrument's `intervalHistory` (already capped / synced).
 * @param intervalSrs  the interval SRS map for the same instrument.
 * @param now   epoch ms — injected so the function stays pure / testable.
 * @param skill when given, only that skill's items are ranked (a guided
 *              session drills one exercise = one skill, so it should weigh
 *              that skill's weaknesses, not another's).
 */
export function analyzeIntervalWeakness(
  rows: readonly IntervalHistoryRow[],
  intervalSrs: SrsMap,
  now: number,
  cfg: IntervalWeaknessConfig = DEFAULT_INTERVAL_WEAKNESS_CONFIG,
  skill?: IntervalSkill,
): IntervalWeaknessSignal[] {
  // Legacy quality-only SRS rows seed the fine ids (read-side migration).
  const srsView = seedLegacyIntervalSrs(intervalSrs);
  // Group rows by quality, dropping anything past the hard cap (a performance
  // bound, not a data delete) before the decay model sees it.
  const cutoff = now - cfg.maxAgeDays * DAY_MS;
  const halfLifeMs = cfg.halfLifeDays * DAY_MS;
  const byItem = new Map<string, IntervalHistoryRow[]>();
  for (const r of rows) {
    if (!(r.semitones >= 1 && r.semitones <= 11)) continue;
    if (!Number.isFinite(r.createdAt) || r.createdAt < cutoff) continue;
    const id = intervalSkillItemId(r.semitones, skillOfForm(r.form), r.dir);
    const list = byItem.get(id);
    if (list) list.push(r);
    else byItem.set(id, [r]);
  }

  // Every id we might report on: seen in history, or tracked by SRS.
  const ids = new Set<string>([...byItem.keys(), ...Object.keys(srsView)]);

  const signals: IntervalWeaknessSignal[] = [];
  for (const id of ids) {
    const parsed = parseIntervalId(id);
    if (parsed == null || parsed.skill == null || parsed.dir == null) continue;
    if (skill && parsed.skill !== skill) continue;
    const { semitones } = parsed;

    const sorted = (byItem.get(id) ?? []).slice().sort((a, b) => a.createdAt - b.createdAt);
    const attempts = sorted.length;
    const { accuracy: weightedAcc, effectiveN } = weightedAccuracy(
      sorted.map((r) => ({ correct: r.correct === true, atMs: r.createdAt })),
      now,
      halfLifeMs,
    );
    const correct = sorted.filter((r) => r.correct === true);
    const avgCorrectSeconds = weightedMeanSeconds(
      correct.map((r) => ({
        seconds: Number.isFinite(r.seconds) ? r.seconds : 0,
        atMs: r.createdAt,
      })),
      now,
      halfLifeMs,
    );
    // The "repeated recent misses" trigger stays a raw, unweighted count over
    // the last few chronological answers, so a quality the learner just bombed
    // still surfaces immediately.
    const recentMistakes = sorted.slice(-cfg.mistakeLookback).filter(isMiss).length;

    const srsItem: SrsItem | undefined = srsView[id];
    const odMs = srsItem ? overdueByMs(srsItem, now) : 0;
    const overdue = odMs > 0;

    const reasons: IntervalWeaknessReason[] = [];
    const hasEvidence = effectiveN >= cfg.minEffectiveN;
    if (hasEvidence && weightedAcc <= cfg.lowAccuracy) {
      reasons.push('lowAccuracy');
    }
    if (hasEvidence && avgCorrectSeconds >= cfg.slowSeconds) {
      reasons.push('slow');
    }
    if (recentMistakes >= cfg.mistakeThreshold) {
      reasons.push('recentMistakes');
    }
    if (overdue) {
      reasons.push('overdue');
    }
    if (reasons.length === 0) continue;

    // Deterministic priority, matching `weakness.ts`: overdue dominates (SRS
    // is the standing plan), then the accuracy gap, then repeated misses,
    // then slowness.
    let score = 0;
    if (overdue) score += 100 + Math.min(odMs / DAY_MS, 30);
    if (reasons.includes('lowAccuracy')) {
      score += (cfg.lowAccuracy - weightedAcc) * 120 + 20;
    }
    if (reasons.includes('recentMistakes')) score += recentMistakes * 15;
    if (reasons.includes('slow')) score += (avgCorrectSeconds - cfg.slowSeconds) * 8 + 8;

    signals.push({
      itemId: id,
      skill: parsed.skill,
      dir: parsed.dir,
      semitones,
      attempts,
      weightedAccuracy: weightedAcc,
      effectiveN,
      avgCorrectSeconds,
      recentMistakes,
      overdue,
      overdueByMs: odMs,
      reasons,
      score,
    });
  }

  return signals.sort((a, b) => b.score - a.score || a.semitones - b.semitones || (a.itemId < b.itemId ? -1 : 1));
}
