// ── scaleSequence.ts — sequences: a ladder after Recall ──────────────────
//
// Pure, no React. product-wishlist.md (Scales, 2026-10-03 dialogue, item 6):
// once a box can be played from memory, the next step is not "faster" but
// sequences — groups of 3, groups of 4, thirds — so the learner knows each
// note's neighbour, not only the whole line. "Sequences on a shaky box just
// confuse", so a box's sequences unlock only after it is played from memory
// (Recall level ≥ 1, `scaleRecall.ts`) a few times in a row.
//
// - `sequenceRun` turns a box's run into a sequence: the box's notes in
//   pitch order (the "line"), then the pattern over that line, going up from
//   the lowest note or down from the highest. `sequenceBoard` swaps it into
//   an order board; `tileMidi` / `lit` are untouched, so the board, the
//   fingers and the guitar answer mode work the same.
// - A sequence run is recorded as its own history form, `orderSequence` with
//   its `pattern`, on the box's own item id (the same item, reviewed a harder
//   way — Recall's precedent). It never counts toward Recall's streak.
// - The ladder is fixed: groups of 3 → groups of 4 → thirds. A rung passes
//   after `SEQUENCE_PASS_RUNS` good runs of it in a row; once passed it stays
//   passed.

import type { ScaleHistoryRow } from './learningState';
import type { ScaleOrderBoard } from './scaleOrder';
import type { NeckPos } from '../utils/scales';
import { RECALL_PROMOTE_RUNS } from './scaleRecall';

export type SequencePattern = 'groups3' | 'groups4' | 'thirds';

/** The ladder, in order. */
export const SEQUENCE_PATTERNS: readonly SequencePattern[] = ['groups3', 'groups4', 'thirds'];

export function isSequencePattern(v: unknown): v is SequencePattern {
  return v === 'groups3' || v === 'groups4' || v === 'thirds';
}

/** English source strings (i18n keys) naming each pattern. */
export const SEQUENCE_LABEL: Record<SequencePattern, string> = {
  groups3: 'Groups of 3',
  groups4: 'Groups of 4',
  thirds: 'Thirds',
};

/** English source strings (i18n keys): what to play, in one sentence. */
export const SEQUENCE_HOW: Record<SequencePattern, string> = {
  groups3: 'Play 1-2-3, then 2-3-4, then 3-4-5… one note further each time.',
  groups4: 'Play 1-2-3-4, then 2-3-4-5… one note further each time.',
  thirds: 'Skip a note, then step back: 1-3, 2-4, 3-5…',
};

/** Good runs in a row that pass a rung. */
export const SEQUENCE_PASS_RUNS = 3;
/** Good Recall runs in a row (level ≥ 1) that open a box's sequences —
 *  the same count as Recall's own level-up. */
export const SEQUENCE_UNLOCK_RUNS = RECALL_PROMOTE_RUNS;

/** Indices into a line of `n` notes, low to high, for `pattern`. Going up it
 *  starts on the lowest note; going down it is the mirror image, starting on
 *  the highest. Empty when the line is too short for the pattern. */
export function sequenceIndices(n: number, pattern: SequencePattern, direction: 'up' | 'down'): number[] {
  const size = pattern === 'groups4' ? 4 : 3;
  const up: number[] = [];
  for (let i = 0; i + size - 1 < n; i++) {
    if (pattern === 'thirds') up.push(i, i + 2);
    else for (let k = 0; k < size; k++) up.push(i + k);
  }
  return direction === 'up' ? up : up.map((i) => n - 1 - i);
}

export interface SequenceRun {
  run: NeckPos[];
  runMidi: number[];
  /** Per step, the note's place in the box's line (1 = the lowest note) —
   *  what the board shows on a found tile, so the learner sees 1-2-3, 2-3-4. */
  labels: number[];
}

/** A box's run (`tonicRun`, with its pitches) re-ordered as `pattern`. The
 *  line is every distinct pitch of the run, low to high, each on the tile the
 *  run already uses for it. */
export function sequenceRun(
  run: readonly NeckPos[], runMidi: readonly number[], pattern: SequencePattern, direction: 'up' | 'down',
): SequenceRun {
  const tileOf = new Map<number, NeckPos>();
  run.forEach((p, i) => { if (!tileOf.has(runMidi[i])) tileOf.set(runMidi[i], p); });
  const line = [...tileOf.keys()].sort((a, b) => a - b);
  const idx = sequenceIndices(line.length, pattern, direction);
  return {
    run: idx.map((i) => tileOf.get(line[i])!),
    runMidi: idx.map((i) => line[i]),
    labels: idx.map((i) => i + 1),
  };
}

/** `board` with its run swapped for the sequence. Everything else — the
 *  section, `tileMidi`, Recall's `lit` — is unchanged. */
export function sequenceBoard(board: ScaleOrderBoard, pattern: SequencePattern, direction: 'up' | 'down'): ScaleOrderBoard {
  const s = sequenceRun(board.run, board.runMidi, pattern, direction);
  if (s.run.length === 0) return board;
  return { ...board, run: s.run, runMidi: s.runMidi, stepLabels: s.labels };
}

// ── The ladder's state, from history alone ──────────────────────────────

/** Good Recall runs (level ≥ 1) of `itemId` in a row, most recent first. */
export function recallRunStreak(history: readonly ScaleHistoryRow[], itemId: string): number {
  let n = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i];
    if (r.itemId !== itemId || r.form !== 'orderRecall') continue;
    if (!r.correct) break;
    n++;
  }
  return n;
}

/** Whether `pattern` has ever had `SEQUENCE_PASS_RUNS` good runs in a row
 *  on `itemId`, and the current streak toward it. */
function rungState(history: readonly ScaleHistoryRow[], itemId: string, pattern: SequencePattern) {
  let streak = 0;
  let passed = false;
  for (const r of history) {
    if (r.itemId !== itemId || r.form !== 'orderSequence' || r.pattern !== pattern) continue;
    streak = r.correct ? streak + 1 : 0;
    if (streak >= SEQUENCE_PASS_RUNS) passed = true;
  }
  return { passed, streak: Math.min(streak, SEQUENCE_PASS_RUNS) };
}

export interface SequenceRung {
  pattern: SequencePattern;
  passed: boolean;
  /** Good runs in a row toward passing (capped at `SEQUENCE_PASS_RUNS`). */
  streak: number;
}

export interface SequenceLadder {
  /** The box is played from memory well enough to start sequences. Once any
   *  sequence has been played on it, it stays open. */
  unlocked: boolean;
  /** Good Recall runs in a row toward unlocking (capped). */
  recallStreak: number;
  rungs: SequenceRung[];
  /** The first rung not passed — what to play next — or `null` when the
   *  ladder is locked or complete. */
  current: SequencePattern | null;
  done: boolean;
}

/** The ladder for one box (`itemId` = the box's own item). */
export function sequenceLadder(history: readonly ScaleHistoryRow[], itemId: string): SequenceLadder {
  const streak = recallRunStreak(history, itemId);
  const started = history.some((r) => r.itemId === itemId && r.form === 'orderSequence');
  const unlocked = started || streak >= SEQUENCE_UNLOCK_RUNS;
  const rungs = SEQUENCE_PATTERNS.map((pattern) => ({ pattern, ...rungState(history, itemId, pattern) }));
  const done = rungs.every((r) => r.passed);
  return {
    unlocked,
    recallStreak: Math.min(streak, SEQUENCE_UNLOCK_RUNS),
    rungs,
    current: unlocked ? (rungs.find((r) => !r.passed)?.pattern ?? null) : null,
    done,
  };
}
