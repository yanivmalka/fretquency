// ── scaleRecall.ts — Recall mode's history form + auto level-up ──────────
//
// Pure, no React. "Tap the scale in order" played from memory: at level 1
// only the tonic is lit, at level 2 the neck is empty (the board side lives
// in `scaleOrder.ts`'s `buildOrderBoard`). A run at level 0 is recorded as
// the ordinary `orderScale` form; a run at level 1/2 as `orderRecall` with
// its level, so a level-1 run never counts toward level 2 and vice versa.
//
// Auto level-up: once the last `RECALL_PROMOTE_RUNS` runs of one item at the
// current level are all correct (the app's own `isScaleCorrect` judge), the
// learner moves to the next level. Only runs since the level was last set
// (`since`) count, so dropping back a level by hand doesn't bounce straight
// back up on an old streak.

import type { ScaleHistoryRow } from './learningState';
import type { RecallLevel } from './scaleOrder';

export const RECALL_PROMOTE_RUNS = 3;

/** English source strings (i18n keys) naming each level. */
export const RECALL_LEVEL_LABEL: Record<RecallLevel, string> = {
  0: 'All notes lit',
  1: 'Only the root lit',
  2: 'Empty neck',
};

export function recallFormFor(level: RecallLevel): 'orderScale' | 'orderRecall' {
  return level === 0 ? 'orderScale' : 'orderRecall';
}

function playedAt(row: ScaleHistoryRow, level: RecallLevel): boolean {
  return level === 0 ? row.form === 'orderScale' : row.form === 'orderRecall' && row.recallLevel === level;
}

/** Correct runs in a row (most recent first) of `itemId` at `level`, played
 *  at or after `since`. */
export function recallStreak(
  history: readonly ScaleHistoryRow[], itemId: string, level: RecallLevel, since: number,
): number {
  let n = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i];
    if (r.createdAt < since) break;
    if (r.itemId !== itemId || !playedAt(r, level)) continue;
    if (!r.correct) break;
    n++;
  }
  return n;
}

/** The English source string (i18n key) announcing an automatic level-up. */
export function recallLevelUpText(level: RecallLevel): string {
  return level === 2 ? 'Level up — the neck is empty now' : 'Level up — only the root is lit now';
}

/** The level to move up to after the latest run, or `null` to stay. */
export function recallPromotion(
  history: readonly ScaleHistoryRow[], itemId: string, level: RecallLevel, since: number,
): RecallLevel | null {
  if (level >= 2) return null;
  return recallStreak(history, itemId, level, since) >= RECALL_PROMOTE_RUNS ? ((level + 1) as RecallLevel) : null;
}
