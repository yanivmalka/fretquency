// ── scaleCurriculum.ts — the guided Scales beginner path ─────────────────
//
// scales-learning-spec.md §6 + product-wishlist.md (Scales, 2026-10-02 review,
// item C). A fixed, ordered list of steps a beginner walks through instead of
// choosing from every scale type at once:
//
//   Minor Pentatonic box 1 → box 2 → connect the boxes → "one shape, two names"
//   → Major Pentatonic in that SAME box (only the home note moves) → Blues
//   box 1 → Natural Minor box 1 → Major box 1.
//
// Every practice step is a "Tap the scale in order" run, judged and recorded
// like any other scale answer. A step passes when its item is mastered
// (`isScaleMastered`), so progress is derived from `scaleSrs` / `scaleHistory`
// alone — nothing new is persisted. The explanation step gates nothing.
//
// The relative-major step needs a shape no authored box gives: the relative
// minor's box 1, counted from the major root (three semitones above the minor
// root on the same string). `relativeBoxPosition` builds it as a synthetic
// position, the way `connectBoxesPosition` builds "connect the boxes", and it
// is tracked as its own item under the reserved `RELATIVE_BOX_INDEX`.

import { scaleTypeById, scalePositionsFor, shapeAtRoot, type ScalePositionDef } from '../utils/scales';
import { pickConnectQuestion, type ScaleDirection, type ScalePoolItem, type ScaleQuestion } from './scaleDrill';
import { isScaleMastered } from './scaleMastery';
import { scaleItemId } from './scaleItem';
import type { ScaleHistoryRow } from './learningState';
import type { SrsMap } from './srs';

/** Reserved `positionIndex` for "the relative minor's box 1, from the major
 *  root". Kept clear of 1–7 so it never collides with a future authored box
 *  (5 CAGED boxes, 7 three-notes-per-string positions) or with `0`
 *  ("connect the boxes"). */
export const RELATIVE_BOX_INDEX = 9;

/** Major-side scale type → the minor scale type whose box it borrows. */
export const RELATIVE_MINOR_OF: Readonly<Record<string, string>> = {
  majorPentatonic: 'minorPentatonic',
  major: 'naturalMinor',
};

/** Semitones from a minor root up to its relative major root. */
const RELATIVE_MAJOR_SEMITONES = 3;

/** The relative minor's box 1 window, re-anchored on the major root on the
 *  same string: the major root sits 3 frets above the minor root, so the
 *  window shifts down by 3. `null` when `majorTypeId` has no relative minor
 *  or its box 1 does not exist on this instrument. */
export function relativeBoxPosition(majorTypeId: string, stringCount: number): ScalePositionDef | null {
  const minorId = RELATIVE_MINOR_OF[majorTypeId];
  if (!minorId) return null;
  const minorBox1 = scalePositionsFor(minorId, stringCount).find((p) => p.positionIndex === 1);
  if (!minorBox1) return null;
  return {
    scaleTypeId: majorTypeId,
    positionIndex: RELATIVE_BOX_INDEX,
    rootString: minorBox1.rootString,
    window: {
      from: minorBox1.window.from - RELATIVE_MAJOR_SEMITONES,
      to: minorBox1.window.to - RELATIVE_MAJOR_SEMITONES,
    },
  };
}

function shuffled<T>(xs: readonly T[], rng: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const isNaturalName = (name: string) => !name.includes('#') && !name.includes('b');

/** `pickScaleQuestion`'s signature, so it plugs into `useScaleOrderEngine`'s
 *  `pickQuestion`: a run over the relative box of a major-side scale type
 *  from `pool`. `positionIndex` on the question is `RELATIVE_BOX_INDEX`. */
export function pickRelativeBoxQuestion(
  pool: readonly ScalePoolItem[],
  noteTable: readonly (readonly string[])[],
  stringCount: number,
  maxFret: number,
  rng: () => number = Math.random,
  naturalsOnly = false,
  direction: ScaleDirection = 'up',
): ScaleQuestion | null {
  const typeIds = shuffled([...new Set(pool.map((p) => p.scaleTypeId))], rng);
  for (const scaleTypeId of typeIds) {
    const scaleType = scaleTypeById(scaleTypeId);
    const position = relativeBoxPosition(scaleTypeId, stringCount);
    if (!scaleType || !position) continue;
    const lo = Math.max(0, -position.window.from);
    const hi = maxFret - position.window.to;
    const row = noteTable[position.rootString - 1];
    if (lo > hi || !row) continue;
    let frets = shuffled(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), rng);
    if (naturalsOnly) {
      const naturals = frets.filter((f) => isNaturalName(row[f] ?? ''));
      if (naturals.length > 0) frets = naturals;
    }
    for (const rootFret of frets) {
      const shape = shapeAtRoot(scaleType, position, rootFret, noteTable);
      const rootName = row[rootFret];
      if (!shape || shape.length === 0 || !rootName) continue;
      return {
        scaleTypeId,
        positionIndex: RELATIVE_BOX_INDEX,
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

/** "Connect the boxes" behind `pickScaleQuestion`'s signature. */
export const pickConnectFromPool: typeof pickRelativeBoxQuestion = (pool, ...rest) =>
  pickConnectQuestion([...new Set(pool.map((p) => p.scaleTypeId))], ...rest);

export type ScalePathStepKind = 'box' | 'connect' | 'explain' | 'relativeBox';

export interface ScalePathStep {
  /** Stable id (not shown). */
  id: string;
  kind: ScalePathStepKind;
  scaleTypeId: string;
  /** 1/2 = an authored box, 0 = connect the boxes, `RELATIVE_BOX_INDEX` =
   *  the relative minor's box. For an `explain` step, the step it explains. */
  positionIndex: number;
  /** The item whose mastery passes this step. An `explain` step points at the
   *  item of the practice step it introduces. */
  itemId: string;
  /** One-line "what and why" for a beginner (English source = i18n key). */
  whyKey: string;
  /** Whether later steps wait for this one. */
  gating: boolean;
}

function step(
  id: string, kind: ScalePathStepKind, scaleTypeId: string, positionIndex: number, whyKey: string,
): ScalePathStep {
  return { id, kind, scaleTypeId, positionIndex, itemId: scaleItemId(scaleTypeId, positionIndex), whyKey, gating: kind !== 'explain' };
}

export const SCALE_PATH: readonly ScalePathStep[] = [
  step('minorPent-box1', 'box', 'minorPentatonic', 1,
    'Five notes in one small box near the root — the shape most solos start from. Watch it once, then play it back.'),
  step('minorPent-box2', 'box', 'minorPentatonic', 2,
    'The same five notes, one box further: the root moves to the next string.'),
  step('minorPent-connect', 'connect', 'minorPentatonic', 0,
    'One run that crosses from box 1 into box 2 and back, so the two boxes become one stretch of the neck.'),
  step('pent-relative-explain', 'explain', 'majorPentatonic', RELATIVE_BOX_INDEX,
    'The box you know is also a major pentatonic — only the home note changes.'),
  step('majorPent-relative', 'relativeBox', 'majorPentatonic', RELATIVE_BOX_INDEX,
    'Play the box you already know, but start and end on its major home note — three frets above the minor root on the thickest string.'),
  step('blues-box1', 'box', 'blues', 1,
    'Box 1 of the minor pentatonic plus one extra note — the flat 5th, the "blue note".'),
  step('naturalMinor-box1', 'box', 'naturalMinor', 1,
    'The full seven-note minor scale: the minor pentatonic box with two more notes filled in.'),
  step('major-box1', 'box', 'major', 1,
    'The seven-note major scale — the one every other scale is compared to.'),
];

export type ScalePathStatus = 'done' | 'current' | 'available' | 'locked';

export interface ScalePathEntry {
  step: ScalePathStep;
  status: ScalePathStatus;
}

export interface ScalePathProgress {
  entries: ScalePathEntry[];
  /** Index into `entries` of the first step not done, or -1 when all are. */
  currentIndex: number;
  /** Practice (gating) steps passed / total — the explanation is not counted. */
  passed: number;
  total: number;
}

/** Whether a step's practice could even be drawn on this instrument. */
function stepAvailable(s: ScalePathStep, stringCount: number): boolean {
  if (s.positionIndex === RELATIVE_BOX_INDEX) return relativeBoxPosition(s.scaleTypeId, stringCount) != null;
  if (s.positionIndex === 0) return scalePositionsFor(s.scaleTypeId, stringCount).length >= 2;
  return scalePositionsFor(s.scaleTypeId, stringCount).some((p) => p.positionIndex === s.positionIndex);
}

/** The path's state, derived from the scale SRS + history only. A gating step
 *  is done when its item is mastered; the explanation is done once its
 *  practice step has any answer. A step is unlocked when every gating step
 *  before it is done; the first unlocked step not yet done is `current`. */
export function scalePathProgress(
  scaleSrs: SrsMap,
  historyRows: readonly ScaleHistoryRow[],
  now: number,
  stringCount: number,
  path: readonly ScalePathStep[] = SCALE_PATH,
): ScalePathProgress {
  const steps = path.filter((s) => stepAvailable(s, stringCount));
  const entries: ScalePathEntry[] = [];
  let blocked = false;
  let currentIndex = -1;
  for (const s of steps) {
    const done = s.kind === 'explain'
      ? scaleSrs[s.itemId] != null || historyRows.some((r) => r.itemId === s.itemId)
      : isScaleMastered(s.itemId, scaleSrs, historyRows, now);
    let status: ScalePathStatus;
    if (done) status = 'done';
    else if (blocked) status = 'locked';
    else if (currentIndex < 0) status = 'current';
    else status = 'available';
    if (status === 'current') currentIndex = entries.length;
    entries.push({ step: s, status });
    if (s.gating && !done) blocked = true;
  }
  const gating = entries.filter((e) => e.step.gating);
  return {
    entries,
    currentIndex,
    passed: gating.filter((e) => e.status === 'done').length,
    total: gating.length,
  };
}
