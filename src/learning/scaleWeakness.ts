// ── scaleWeakness.ts — which (scaleType, position) items need work ───────
//
// scales-learning-spec.md §10.5. The scale-domain sibling of
// `intervalWeakness.ts` (which itself mirrors `weakness.ts`): given the
// capped, scale-tagged answer history (`InstrumentLearningState.scaleHistory`)
// and the scale SRS map (`scaleSrs`), rank every item that has recent history
// or an SRS row by how much it needs work. It never reads note or interval
// history and never touches `srs.ts` / `weakness.ts` / `intervalWeakness.ts`
// (spec §19).
//
// Same four signals as `intervalWeakness.ts` (any one makes an item a
// candidate): low recent accuracy, slow correct answers, repeated recent
// misses, overdue SRS review. Same recency-decay engine (`./recency`,
// 14-day half-life, 180-day hard cap). Deterministic: same inputs → same
// ranked list, ties broken by item id.

import type { ScaleHistoryRow } from './learningState';
import { parseScaleItemId } from './scaleItem';
import { overdueByMs, type SrsItem, type SrsMap } from './srs';
import {
  DAY_MS,
  DEFAULT_HALF_LIFE_DAYS,
  HARD_CAP_DAYS,
  weightedAccuracy,
  weightedMeanSeconds,
} from './recency';

export interface ScaleWeaknessConfig {
  minEffectiveN: number;
  lowAccuracy: number;
  slowSeconds: number;
  mistakeLookback: number;
  mistakeThreshold: number;
  halfLifeDays: number;
  maxAgeDays: number;
}

export const DEFAULT_SCALE_WEAKNESS_CONFIG: ScaleWeaknessConfig = {
  minEffectiveN: 4,
  lowAccuracy: 0.7,
  slowSeconds: 8,
  mistakeLookback: 4,
  mistakeThreshold: 2,
  halfLifeDays: DEFAULT_HALF_LIFE_DAYS,
  maxAgeDays: HARD_CAP_DAYS,
};

export type ScaleWeaknessReason = 'lowAccuracy' | 'slow' | 'recentMistakes' | 'overdue';

export interface ScaleWeaknessSignal {
  /** `scale:<type>:<position>` — the SRS / mastery id for this item. */
  itemId: string;
  scaleTypeId: string;
  positionIndex: number;
  attempts: number;
  weightedAccuracy: number;
  effectiveN: number;
  avgCorrectSeconds: number;
  recentMistakes: number;
  overdue: boolean;
  overdueByMs: number;
  reasons: ScaleWeaknessReason[];
  /** Deterministic priority; higher = more urgent. */
  score: number;
}

// A timeout is folded into `scaleHistory` as `correct: false`, so a miss is
// simply a non-correct row — no `null` case as in `HistoryEntry`.
function isMiss(r: ScaleHistoryRow): boolean {
  return r.correct !== true;
}

/**
 * Rank every `(scaleType, position)` item that has recent history OR an SRS
 * row by how much it needs work. Items with no signal at all are omitted.
 * Deterministic.
 *
 * @param rows       the instrument's `scaleHistory` (already capped).
 * @param scaleSrs   the scale SRS map for the same instrument.
 * @param now        epoch ms — injected so the function stays pure / testable.
 */
export function analyzeScaleWeakness(
  rows: readonly ScaleHistoryRow[],
  scaleSrs: SrsMap,
  now: number,
  cfg: ScaleWeaknessConfig = DEFAULT_SCALE_WEAKNESS_CONFIG,
): ScaleWeaknessSignal[] {
  const cutoff = now - cfg.maxAgeDays * DAY_MS;
  const halfLifeMs = cfg.halfLifeDays * DAY_MS;
  const byItem = new Map<string, ScaleHistoryRow[]>();
  for (const r of rows) {
    if (parseScaleItemId(r.itemId) == null) continue;
    // Echo phrases are ear practice, not a box review (`countsForMastery`).
    if (r.form === 'echo') continue;
    if (!Number.isFinite(r.createdAt) || r.createdAt < cutoff) continue;
    const list = byItem.get(r.itemId);
    if (list) list.push(r);
    else byItem.set(r.itemId, [r]);
  }

  const ids = new Set<string>([...byItem.keys(), ...Object.keys(scaleSrs)]);

  const signals: ScaleWeaknessSignal[] = [];
  for (const id of ids) {
    const parsed = parseScaleItemId(id);
    if (parsed == null) continue;

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
    const recentMistakes = sorted.slice(-cfg.mistakeLookback).filter(isMiss).length;

    const srsItem: SrsItem | undefined = scaleSrs[id];
    const odMs = srsItem ? overdueByMs(srsItem, now) : 0;
    const overdue = odMs > 0;

    const reasons: ScaleWeaknessReason[] = [];
    const hasEvidence = effectiveN >= cfg.minEffectiveN;
    if (hasEvidence && weightedAcc <= cfg.lowAccuracy) reasons.push('lowAccuracy');
    if (hasEvidence && avgCorrectSeconds >= cfg.slowSeconds) reasons.push('slow');
    if (recentMistakes >= cfg.mistakeThreshold) reasons.push('recentMistakes');
    if (overdue) reasons.push('overdue');
    if (reasons.length === 0) continue;

    let score = 0;
    if (overdue) score += 100 + Math.min(odMs / DAY_MS, 30);
    if (reasons.includes('lowAccuracy')) score += (cfg.lowAccuracy - weightedAcc) * 120 + 20;
    if (reasons.includes('recentMistakes')) score += recentMistakes * 15;
    if (reasons.includes('slow')) score += (avgCorrectSeconds - cfg.slowSeconds) * 8 + 8;

    signals.push({
      itemId: id,
      scaleTypeId: parsed.scaleTypeId,
      positionIndex: parsed.positionIndex,
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

  return signals.sort((a, b) => b.score - a.score || a.itemId.localeCompare(b.itemId));
}
