// ── scaleEcho.ts — "I play, you play it back" (call and response by ear) ──
//
// Pure, no React, no DOM. The teacher's day-two method (product-wishlist,
// Scales, 2026-10-03 item 4): the app plays a short fragment from the current
// box, the learner plays it back on the guitar or taps it. It ties the sound
// to the shape, and it is the first taste of making music with the box.
//
// - A fragment is 2–4 notes of the box, starting on the home note (the
//   question's root tile), mostly by step along the box's own notes, now and
//   then a skip of one note. It never repeats a note straight away.
// - It is judged by `useScaleOrderEngine` unchanged: `echoBoard` is
//   `buildOrderBoard` with the fragment as the run. The whole box stays on
//   the board (any tile with the right pitch answers), lit, or dim with only
//   the home note lit (Recall's `lit` set, level 1).
// - The length grows after clean answers and shrinks after a missed one
//   (`nextEchoLength`). The first length comes from how well the box is
//   known (`echoStartLength`, its SRS bucket), and which box of the pool is
//   asked is weighted by the scale SRS too (`pickEchoItem`): a due or new box
//   comes up more often than one that is not due.
// - One fragment is one history row for the box's own item id, form `echo`.
//   It does not review the box in `scaleSrs` and does not count toward its
//   mastery (`countsForMastery` in scaleMastery.ts): a short phrase by ear is
//   not evidence that the whole box is known, so it must not pass a path
//   step on its own.

import type { ScaleQuestion, ScalePoolItem } from './scaleDrill';
import type { NeckPos } from '../utils/scales';
import { midiAt } from './scaleFall';
import { buildOrderBoard, type ScaleOrderBoard } from './scaleOrder';
import { scaleItemId } from './scaleItem';
import { isDue, type SrsMap } from './srs';

export const ECHO_MIN_LENGTH = 2;
export const ECHO_MAX_LENGTH = 4;
/** Clean answers in a row that add one note to the fragment. */
export const ECHO_GROW_AFTER = 2;
/** Chance that a move skips one note of the box instead of stepping. */
export const ECHO_SKIP_CHANCE = 0.2;
/** Chance that the melody turns around instead of carrying on its way. */
export const ECHO_TURN_CHANCE = 0.3;
/** SRS bucket from which a box starts at 3 notes rather than 2. */
export const ECHO_LONGER_START_BUCKET = 3;

export interface EchoNote {
  pos: NeckPos;
  midi: number;
}

/** The box's notes low to high, one per pitch. A pitch the box holds on two
 *  strings is kept on the thicker one, like a run through the box. */
export function boxLadder(shape: readonly NeckPos[], openMidi: readonly number[]): EchoNote[] {
  const byMidi = new Map<number, NeckPos>();
  for (const p of shape) {
    const m = midiAt(p, openMidi);
    const had = byMidi.get(m);
    if (!had || p.string > had.string) byMidi.set(m, p);
  }
  return [...byMidi.entries()].sort((a, b) => a[0] - b[0]).map(([midi, pos]) => ({ pos, midi }));
}

/** A fragment of `length` notes over `ladder`, starting at index `start`.
 *  Moves are one note of the box (a step) or, now and then, two (a skip);
 *  the melody keeps its way and sometimes turns, and it turns at either end
 *  of the box. Never the same note twice in a row. */
export function echoFragment(
  ladder: readonly EchoNote[], start: number, length: number, rng: () => number = Math.random,
): EchoNote[] {
  if (ladder.length === 0 || start < 0 || start >= ladder.length) return [];
  const out: EchoNote[] = [ladder[start]];
  if (ladder.length === 1) return out;
  let at = start;
  let dir: 1 | -1 = rng() < 0.5 ? 1 : -1;
  for (let i = 1; i < length; i++) {
    if (i > 1 && rng() < ECHO_TURN_CHANCE) dir = dir === 1 ? -1 : 1;
    let size = rng() < ECHO_SKIP_CHANCE ? 2 : 1;
    if (at + dir * size < 0 || at + dir * size >= ladder.length) {
      // Off the end of the box: turn around, or take a step if the skip is
      // what overshot.
      if (size === 2 && at + dir >= 0 && at + dir < ladder.length) size = 1;
      else dir = dir === 1 ? -1 : 1;
    }
    let next = at + dir * size;
    if (next < 0 || next >= ladder.length) next = at + dir;
    if (next < 0 || next >= ladder.length) break; // a one-note box
    at = next;
    out.push(ladder[at]);
  }
  return out;
}

/** The board for one fragment: the question's box, laid out as for "Tap the
 *  scale in order", with the fragment as the run. `dim` lights only the home
 *  note (Recall level 1); every box tile still answers its pitch. */
export function echoBoard(
  q: ScaleQuestion, openMidi: readonly number[], length: number, dim: boolean,
  rng: () => number = Math.random,
): ScaleOrderBoard {
  const base = buildOrderBoard(q, openMidi, dim ? 1 : 0);
  const ladder = boxLadder(q.shape, openMidi);
  const rootMidi = midiAt({ string: q.rootString, fret: q.rootFret }, openMidi);
  const start = Math.max(0, ladder.findIndex((n) => n.midi === rootMidi));
  const fragment = echoFragment(ladder, start, clampEchoLength(length), rng);
  return { ...base, run: fragment.map((n) => n.pos), runMidi: fragment.map((n) => n.midi) };
}

export function clampEchoLength(n: number): number {
  if (!Number.isFinite(n)) return ECHO_MIN_LENGTH;
  return Math.max(ECHO_MIN_LENGTH, Math.min(ECHO_MAX_LENGTH, Math.round(n)));
}

/** The first fragment length for a box: 3 notes once its SRS bucket shows it
 *  is known, else 2. */
export function echoStartLength(srs: SrsMap, itemId: string): number {
  const item = srs[itemId];
  return item && item.bucket >= ECHO_LONGER_START_BUCKET ? ECHO_MIN_LENGTH + 1 : ECHO_MIN_LENGTH;
}

export interface EchoGrowth {
  length: number;
  /** Clean answers in a row at this length. */
  streak: number;
}

/** After one fragment: clean (no slip) twice in a row adds a note; a missed
 *  one (`correct` false) takes a note off; a slip that still passed keeps
 *  the length and restarts the count. */
export function nextEchoLength(g: EchoGrowth, clean: boolean, correct: boolean): EchoGrowth {
  if (!correct) return { length: clampEchoLength(g.length - 1), streak: 0 };
  if (!clean) return { length: clampEchoLength(g.length), streak: 0 };
  const streak = g.streak + 1;
  if (streak >= ECHO_GROW_AFTER && g.length < ECHO_MAX_LENGTH) return { length: g.length + 1, streak: 0 };
  return { length: clampEchoLength(g.length), streak };
}

/** How much a box of the pool is wanted next: due 3, never practised 2,
 *  not due 1. */
export function echoItemWeight(srs: SrsMap, itemId: string, now: number): number {
  const item = srs[itemId];
  if (!item) return 2;
  return isDue(item, now) ? 3 : 1;
}

/** One pool item, drawn with `echoItemWeight`. */
export function pickEchoItem(
  pool: readonly ScalePoolItem[], srs: SrsMap, now: number, rng: () => number = Math.random,
): ScalePoolItem | null {
  if (pool.length === 0) return null;
  const weights = pool.map((p) => echoItemWeight(srs, scaleItemId(p.scaleTypeId, p.positionIndex), now));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}
