// ── scaleMastery.ts — each (scaleType, position)'s status + the flat board ─
//
// scales-learning-spec.md §11 / §12. Mirrors `intervalMastery.ts` exactly,
// one level down: given the scale SRS map and the capped scale answer
// history, decide for each shipped (scaleType, position) pair whether it is
// `notStarted` / `learning` / `mastered`, and build the flat status board
// §12 describes (grouped by scale type — the caller's `pool` order already
// groups by type, since `buildScalePool` iterates scale types outer, then
// positions).
//
// No Scale Learning Path, no stages, no stars — the only persisted scale
// progress is `scaleSrs` (+ the capped `scaleHistory`); everything here is
// derived every render, exactly like Intervals.
//
// Own constants, deliberately NOT imported from `intervalMastery.ts` or
// `pathProgress.ts` (spec §11, §19) so tuning one domain never silently
// moves another. Same recency-decay engine (`./recency`) as Notes/Intervals.
//
// This module imports nothing from `src/game/**`.

import type { ScaleHistoryRow } from './learningState';
import type { SrsMap } from './srs';
import type { ScalePoolItem } from './scaleDrill';
import { scaleItemId } from './scaleItem';
import { scaleTypeById } from '../utils/scales';
import {
  DAY_MS,
  DEFAULT_HALF_LIFE_DAYS,
  HARD_CAP_DAYS,
  weightedAccuracy,
  positionScore,
} from './recency';

// ── Constants (own values — see the header note) ───────────────────────

/** SRS bucket at or above which an item counts as mastered (same start point
 *  as Notes/Intervals, tuned independently). */
export const SCALE_MASTERED_BUCKET = 3;
/** Weighted recent accuracy at or above which an item counts as mastered. */
export const SCALE_MASTERED_ACCURACY = 0.8;
/** Minimum `effectiveN` (weighted answer count) inside the decay cap before
 *  the weighted accuracy is trusted on its own. Below this, `positionScore`
 *  discards the weighted accuracy and uses the SRS bucket mapping alone. */
export const SCALE_MIN_EFFECTIVE_N = 4;
/** History rows older than this are excluded from the decay engine entirely
 *  — a performance / storage bound only, never a data delete. */
export const SCALE_MASTERY_MAX_AGE_DAYS = HARD_CAP_DAYS;
/** The plain (unweighted) display window, in days, behind the board's
 *  accuracy bar — independent of the 180-day decay cap. */
export const SCALE_STATS_WINDOW_DAYS = 45;

const HALF_LIFE_MS = DEFAULT_HALF_LIFE_DAYS * DAY_MS;

export type ScaleStatus = 'notStarted' | 'learning' | 'mastered';

// ── Weighted recent stats for one item (the classification engine) ─────

/** An `echo` phrase ("I play, you play it back", 2–4 notes by ear) is kept
 *  in the box's history but is not evidence that the whole box is known, so
 *  it never counts toward the box's mastery (or a path step it gates). */
export function countsForMastery(r: ScaleHistoryRow): boolean {
  return r.form !== 'echo';
}

interface WeightedStats {
  accuracy: number;
  effectiveN: number;
  attempts: number;
}

function weightedStats(
  historyRows: readonly ScaleHistoryRow[],
  itemId: string,
  now: number,
): WeightedStats {
  const cutoff = now - SCALE_MASTERY_MAX_AGE_DAYS * DAY_MS;
  const rows = historyRows.filter((r) => r.itemId === itemId && r.createdAt >= cutoff && countsForMastery(r));
  const { accuracy, effectiveN } = weightedAccuracy(
    rows.map((r) => ({ correct: r.correct === true, atMs: r.createdAt })),
    now,
    HALF_LIFE_MS,
  );
  return { accuracy, effectiveN, attempts: rows.length };
}

/** An item's continuous 0..1 strength: the weighted accuracy once there is
 *  enough fresh evidence, otherwise the SRS bucket floor. */
function scaleStrength(
  itemId: string,
  scaleSrs: SrsMap,
  historyRows: readonly ScaleHistoryRow[],
  now: number,
): number {
  const srsItem = scaleSrs[itemId];
  const { accuracy, effectiveN } = weightedStats(historyRows, itemId, now);
  return positionScore(accuracy, effectiveN, srsItem ? srsItem.bucket : null, SCALE_MIN_EFFECTIVE_N);
}

// ── Plain unweighted display window (the board bar) ─────────────────────

interface DisplayStats {
  attempts: number;
  accuracy: number;
}

function displayStats(
  historyRows: readonly ScaleHistoryRow[],
  itemId: string,
  now: number,
): DisplayStats {
  const cutoff = now - SCALE_STATS_WINDOW_DAYS * DAY_MS;
  const rows = historyRows.filter((r) => r.itemId === itemId && r.createdAt >= cutoff && countsForMastery(r));
  if (rows.length === 0) return { attempts: 0, accuracy: 0 };
  const correct = rows.filter((r) => r.correct === true).length;
  return { attempts: rows.length, accuracy: correct / rows.length };
}

// ── Public predicates ───────────────────────────────────────────────────

/** Is this (scaleType, position) mastered? Pure; deterministic. Mirrors
 *  {@link import('./intervalMastery').isIntervalMastered}. */
export function isScaleMastered(
  itemId: string,
  scaleSrs: SrsMap,
  historyRows: readonly ScaleHistoryRow[],
  now: number,
): boolean {
  return scaleStrength(itemId, scaleSrs, historyRows, now) >= SCALE_MASTERED_ACCURACY;
}

/** The three-state status for one (scaleType, position) item. */
export function scaleStatus(
  itemId: string,
  scaleSrs: SrsMap,
  historyRows: readonly ScaleHistoryRow[],
  now: number,
): ScaleStatus {
  if (isScaleMastered(itemId, scaleSrs, historyRows, now)) return 'mastered';
  const hasSchedule = scaleSrs[itemId] != null;
  const { attempts } = weightedStats(historyRows, itemId, now);
  return hasSchedule || attempts > 0 ? 'learning' : 'notStarted';
}

/** The set of item ids (from `pool`) that are currently mastered. */
export function masteredScaleItems(
  pool: readonly ScalePoolItem[],
  scaleSrs: SrsMap,
  historyRows: readonly ScaleHistoryRow[],
  now: number,
): Set<string> {
  const out = new Set<string>();
  for (const p of pool) {
    const id = scaleItemId(p.scaleTypeId, p.positionIndex);
    if (isScaleMastered(id, scaleSrs, historyRows, now)) out.add(id);
  }
  return out;
}

// ── The flat board (§12), one row per pool item ─────────────────────────

export interface ScaleBoardRow {
  itemId: string;
  scaleTypeId: string;
  positionIndex: number;
  /** The scale type's i18n name key, e.g. `Minor Pentatonic`. */
  nameKey: string;
  status: ScaleStatus;
  /** Plain unweighted accuracy over the 45-day display window, 0–1. */
  recentAccuracy: number;
  attempts: number;
  /** The continuous 0..1 strength score behind `status`. */
  strength: number;
}

export interface ScaleBoardOptions {
  /** Every shipped `(scaleType, position)` pair, in display order — pass
   *  `buildScalePool(SCALE_TYPES.map(s => s.id), stringCount)` for "every
   *  shipped type", which already groups by scale type then position. */
  pool: readonly ScalePoolItem[];
  scaleSrs: SrsMap;
  historyRows: readonly ScaleHistoryRow[];
  now: number;
}

/** Build the flat scale status board: one row per `pool` item, in the pool's
 *  own order (grouped by scale type, §12). Pure — derived entirely from
 *  `scaleSrs` + `scaleHistory`; no storage of its own. */
export function buildScaleBoard(opts: ScaleBoardOptions): ScaleBoardRow[] {
  const { pool, scaleSrs, historyRows, now } = opts;
  return pool.map((p) => {
    const id = scaleItemId(p.scaleTypeId, p.positionIndex);
    const display = displayStats(historyRows, id, now);
    return {
      itemId: id,
      scaleTypeId: p.scaleTypeId,
      positionIndex: p.positionIndex,
      nameKey: scaleTypeById(p.scaleTypeId)?.nameKey ?? p.scaleTypeId,
      status: scaleStatus(id, scaleSrs, historyRows, now),
      recentAccuracy: display.accuracy,
      attempts: display.attempts,
      strength: scaleStrength(id, scaleSrs, historyRows, now),
    };
  });
}
