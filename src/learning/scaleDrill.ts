// ── scaleDrill.ts — question picking for all three Scales exercises ──────
//
// Pure, no React. Exercise A (§8.1, "build the scale") needs a genuinely new
// answer surface (a full-screen Piano Tiles stream, one lane per string — see
// `scaleFall.ts` / `ScaleFallBoard.tsx` / `useScaleFallEngine.ts`), NOT the single-string
// `FretGrid` byNote flow the spec originally assumed: `FretGrid` renders one
// string per question, but a scale shape spans several. Exercises B (§8.2,
// "identify the scale") and C (§8.3, "name the degree") are the cheap reuse
// case the spec calls out: both answer through a chip row, and C's option
// building is `intervals.ts`'s `buildTargetNoteOptions` unchanged — a scale
// degree IS an interval above the root. Mirrors `intervalDrill.ts`'s role
// for Intervals, minus the `DrillConfig` plumbing (Scales isn't wired
// through `useGameEngine`/`DrillConfig` — see this file's engines).

import { scaleTypeById, scalePositionsFor, connectBoxesPosition, shapeAtRoot, SCALE_TYPES } from '../utils/scales';
import type { NeckPos } from '../utils/scales';
import { buildTargetNoteOptions, noteNameAtSemitones } from '../utils/intervals';

function shuffled<T>(xs: readonly T[], rng: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** One (scale type, position) pair a session may draw questions from. */
export interface ScalePoolItem {
  scaleTypeId: string;
  positionIndex: number;
}

/** Every authored position of `scaleTypeIds`, resolved against a concrete
 *  instrument's string count — the pool a session picks questions from. */
export function buildScalePool(scaleTypeIds: readonly string[], stringCount: number): ScalePoolItem[] {
  return scaleTypeIds.flatMap((id) =>
    scalePositionsFor(id, stringCount).map((p) => ({ scaleTypeId: id, positionIndex: p.positionIndex })),
  );
}

/** Which way a scale is played: up from its lowest note, down from its highest,
 *  or (in a Selector pick only) a per-question random mix. */
export type ScaleDirection = 'up' | 'down' | 'both';

/** One "build the scale" question: a concrete root + the full shape (incl.
 *  the root) the learner must tap every position of. */
export interface ScaleQuestion {
  scaleTypeId: string;
  positionIndex: number;
  rootString: number;
  rootFret: number;
  /** Sharp-spelled root note name. */
  rootName: string;
  /** Every position of the shape at this root, including the root itself. */
  shape: NeckPos[];
  /** The way this particular scale is run — already resolved from a `'both'`
   *  pick. */
  direction: 'up' | 'down';
}

function isNaturalName(name: string): boolean {
  return !name.includes('#') && !name.includes('b');
}

/** Pick a random (scaleType, position) from `pool` and a root fret it fits at
 *  (i.e. the position's window stays on the fretboard), and resolve the
 *  concrete shape. Returns `null` for an empty pool, an unknown scale
 *  type/position, or an instrument too short for any position in the pool to
 *  fit at any root. `rng` is injectable for deterministic tests.
 *
 *  `naturalsOnly` (§9.1's "root bias" dimension, `focused` tier) restricts
 *  the candidate root frets to natural-note roots when at least one exists
 *  in range, falling back to any root rather than ever returning `null` just
 *  because no natural root happens to fit. */
export function pickScaleQuestion(
  pool: readonly ScalePoolItem[],
  noteTable: readonly (readonly string[])[],
  stringCount: number,
  maxFret: number,
  rng: () => number = Math.random,
  naturalsOnly = false,
  direction: ScaleDirection = 'up',
): ScaleQuestion | null {
  if (pool.length === 0) return null;
  const order = shuffled(pool, rng);
  for (const item of order) {
    const scaleType = scaleTypeById(item.scaleTypeId);
    if (!scaleType) continue;
    const position = scalePositionsFor(item.scaleTypeId, stringCount)
      .find((p) => p.positionIndex === item.positionIndex);
    if (!position) continue;
    const lo = Math.max(0, -position.window.from);
    const hi = maxFret - position.window.to;
    if (lo > hi) continue;
    const row = noteTable[position.rootString - 1];
    if (!row) continue;
    // Every root fret in [lo, hi] keeps the whole window on the fretboard.
    // A root higher up would leave the box cut off at the last fret (e.g. G at
    // fret 22 showing only frets 21–22), a scale with notes missing — the
    // same root always fits lower down the neck instead.
    let candidateFrets = shuffled(
      Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), rng,
    );
    if (naturalsOnly) {
      const naturals = candidateFrets.filter((f) => isNaturalName(row[f] ?? ''));
      if (naturals.length > 0) candidateFrets = naturals;
    }
    for (const rootFret of candidateFrets) {
      const shape = shapeAtRoot(scaleType, position, rootFret, noteTable);
      if (!shape || shape.length === 0) continue;
      const rootName = row[rootFret];
      if (!rootName) continue;
      return {
        scaleTypeId: item.scaleTypeId,
        positionIndex: item.positionIndex,
        rootString: position.rootString,
        rootFret,
        rootName,
        shape,
        direction: direction === 'both' ? (rng() < 0.5 ? 'up' : 'down') : direction,
      };
    }
  }
  return null;
}

/** "Connect the boxes" (scales-learning-spec.md Session 8): the same
 *  `ScaleQuestion` shape as `pickScaleQuestion`, but the shape comes from
 *  `connectBoxesPosition` — a section spanning box 1 and box 2 of the same
 *  scale type and root, not a single authored box. `positionIndex` on the
 *  returned question is always `0` (the reserved "connect" item id, see
 *  `scaleItem.ts`). `scaleTypeIds` plays the role `pool` plays for
 *  `pickScaleQuestion`; there is no position to choose between. */
export function pickConnectQuestion(
  scaleTypeIds: readonly string[],
  noteTable: readonly (readonly string[])[],
  stringCount: number,
  maxFret: number,
  rng: () => number = Math.random,
  naturalsOnly = false,
  direction: ScaleDirection = 'up',
): ScaleQuestion | null {
  if (scaleTypeIds.length === 0) return null;
  const order = shuffled(scaleTypeIds, rng);
  for (const scaleTypeId of order) {
    const scaleType = scaleTypeById(scaleTypeId);
    if (!scaleType) continue;
    const position = connectBoxesPosition(scaleTypeId, stringCount);
    if (!position) continue;
    const lo = Math.max(0, -position.window.from);
    const hi = maxFret - position.window.to;
    if (lo > hi) continue;
    const row = noteTable[position.rootString - 1];
    if (!row) continue;
    let candidateFrets = shuffled(
      Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), rng,
    );
    if (naturalsOnly) {
      const naturals = candidateFrets.filter((f) => isNaturalName(row[f] ?? ''));
      if (naturals.length > 0) candidateFrets = naturals;
    }
    for (const rootFret of candidateFrets) {
      const shape = shapeAtRoot(scaleType, position, rootFret, noteTable);
      if (!shape || shape.length === 0) continue;
      const rootName = row[rootFret];
      if (!rootName) continue;
      return {
        scaleTypeId,
        positionIndex: position.positionIndex,
        rootString: position.rootString,
        rootFret,
        rootName,
        shape,
        direction: direction === 'both' ? (rng() < 0.5 ? 'up' : 'down') : direction,
      };
    }
  }
  return null;
}

/** One "identify the scale" question (§8.2): a root position plus the frets
 *  to play in sequence, root to top (OD-S1, one string — a fret step is
 *  exactly a semitone, so this reuses `playNoteSequence` unchanged), and a
 *  chip-row option list of scale-type ids the learner picks from. */
export interface ScaleIdentifyQuestion {
  scaleTypeId: string;
  positionIndex: number;
  rootString: number;
  rootFret: number;
  rootName: string;
  /** Frets on `rootString` to play in sequence: root to top going up, top to
   *  root going down. */
  playFrets: number[];
  direction: 'up' | 'down';
  /** Scale-type ids, shuffled, always includes `scaleTypeId`. */
  options: string[];
}

/** Picks a root the same way `pickScaleQuestion` does, then builds the
 *  ascending playback + a multiple-choice scale-name option list. The option
 *  list is only as wide as the shipped catalogue (§4.2's phased rollout) —
 *  with one scale type shipped it degenerates to a single, always-correct
 *  chip; it grows on its own as more scale types ship, no code change here. */
export function pickScaleIdentifyQuestion(
  pool: readonly ScalePoolItem[],
  noteTable: readonly (readonly string[])[],
  stringCount: number,
  maxFret: number,
  optionCount = 4,
  rng: () => number = Math.random,
  naturalsOnly = false,
  direction: ScaleDirection = 'up',
): ScaleIdentifyQuestion | null {
  const base = pickScaleQuestion(pool, noteTable, stringCount, maxFret, rng, naturalsOnly, direction);
  if (!base) return null;
  const scaleType = scaleTypeById(base.scaleTypeId);
  if (!scaleType) return null;

  const playFrets = [0, ...scaleType.degrees].map((s) => base.rootFret + s);
  if (base.direction === 'down') playFrets.reverse();

  const poolTypeIds = [...new Set(pool.map((p) => p.scaleTypeId))];
  const allTypeIds = [...new Set(SCALE_TYPES.map((s) => s.id))];
  const chips = new Set<string>([base.scaleTypeId]);
  for (const id of shuffled(poolTypeIds, rng)) {
    if (chips.size >= optionCount) break;
    chips.add(id);
  }
  for (const id of shuffled(allTypeIds, rng)) {
    if (chips.size >= optionCount) break;
    chips.add(id);
  }

  return {
    scaleTypeId: base.scaleTypeId,
    positionIndex: base.positionIndex,
    rootString: base.rootString,
    rootFret: base.rootFret,
    rootName: base.rootName,
    playFrets,
    direction: base.direction,
    options: shuffled([...chips], rng),
  };
}

/** One "name the degree" question (§8.3): a root + one of the scale's
 *  degrees (not the root itself, which is a trivial "same note" question),
 *  plus a note-chip option list built by `buildTargetNoteOptions` exactly as
 *  Intervals Exercise B does — a scale degree IS an interval above the
 *  root, and `poolSemitones` = the scale's own degrees makes the distractors
 *  other real degrees of the same scale (a natural confuser set). */
export interface ScaleDegreeQuestion {
  scaleTypeId: string;
  positionIndex: number;
  rootString: number;
  rootFret: number;
  rootName: string;
  /** Index into the scale type's `degrees`/`degreeLabels` arrays. */
  degreeIndex: number;
  degreeLabel: string;
  /** Sharp-spelled correct note name. */
  targetNote: string;
  /** Note names, shuffled, always includes `targetNote`. */
  options: string[];
}

export function pickScaleDegreeQuestion(
  pool: readonly ScalePoolItem[],
  noteTable: readonly (readonly string[])[],
  stringCount: number,
  maxFret: number,
  optionCount = 4,
  rng: () => number = Math.random,
  naturalsOnly = false,
): ScaleDegreeQuestion | null {
  const base = pickScaleQuestion(pool, noteTable, stringCount, maxFret, rng, naturalsOnly);
  if (!base) return null;
  const scaleType = scaleTypeById(base.scaleTypeId);
  if (!scaleType || scaleType.degrees.length === 0) return null;

  const degreeIndex = Math.floor(rng() * scaleType.degrees.length);
  const semitones = scaleType.degrees[degreeIndex];
  const targetNote = noteNameAtSemitones(base.rootName, semitones);
  const options = buildTargetNoteOptions(
    base.rootName, targetNote, scaleType.degrees, 1, optionCount, undefined, semitones,
  );

  return {
    scaleTypeId: base.scaleTypeId,
    positionIndex: base.positionIndex,
    rootString: base.rootString,
    rootFret: base.rootFret,
    rootName: base.rootName,
    degreeIndex,
    degreeLabel: scaleType.degreeLabels[degreeIndex] ?? '',
    targetNote,
    options,
  };
}
