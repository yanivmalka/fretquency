// ── scales.ts — scale music theory for the Scales Learning drill ────────
//
// Pure, no React, no storage. Mirrors intervals.ts's role for the Scales
// domain (scales-learning-spec.md §2, §4): the one place that knows a scale
// type's interval formula, its W/H step pattern, and how a movable neck
// "position" (box) resolves to concrete fret positions for a given root.
// Imports intervals.ts (`noteNameAtSemitones`) rather than duplicating its
// pitch-class math — a scale degree IS an interval above the root.
//
// Holds twelve basic scale types (Minor Pentatonic, Major, natural/harmonic/
// melodic minor, major pentatonic, blues, the five other church modes) plus
// ten more: jazz (diminished, whole tone, lydian dominant, altered), blues
// (major blues) and world colours (phrygian dominant, double harmonic,
// hungarian minor, hirajoshi).
// A new scale type is one more `ScaleTypeDef` row — its two boxes are
// generated from `SCALE_TYPES`, so nothing else in this file changes shape.

import { noteNameAtSemitones } from './intervals';

/** One scale type's interval formula — mirrors `IntervalDef`. */
export interface ScaleTypeDef {
  /** Stable id, used in `scaleItemId` and as the SRS/curriculum key. */
  id: string;
  /** English name; doubles as the i18n lookup key (see `translations.ts`). */
  nameKey: string;
  /** Ascending semitone offsets from the root, root itself omitted (always 0),
   *  octave not included. */
  degrees: number[];
  /** Display label per degree, parallel to `degrees`, e.g. `['b3','4','5','b7']`. */
  degreeLabels: string[];
}

export const SCALE_TYPES: readonly ScaleTypeDef[] = [
  {
    id: 'minorPentatonic',
    nameKey: 'Minor Pentatonic',
    degrees: [3, 5, 7, 10],
    degreeLabels: ['b3', '4', '5', 'b7'],
  },
  {
    id: 'major',
    nameKey: 'Major',
    degrees: [2, 4, 5, 7, 9, 11],
    degreeLabels: ['2', '3', '4', '5', '6', '7'],
  },
  {
    id: 'naturalMinor',
    nameKey: 'Natural Minor',
    degrees: [2, 3, 5, 7, 8, 10],
    degreeLabels: ['2', 'b3', '4', '5', 'b6', 'b7'],
  },
  {
    id: 'majorPentatonic',
    nameKey: 'Major Pentatonic',
    degrees: [2, 4, 7, 9],
    degreeLabels: ['2', '3', '5', '6'],
  },
  {
    id: 'blues',
    nameKey: 'Blues',
    degrees: [3, 5, 6, 7, 10],
    degreeLabels: ['b3', '4', 'b5', '5', 'b7'],
  },
  {
    id: 'harmonicMinor',
    nameKey: 'Harmonic Minor',
    degrees: [2, 3, 5, 7, 8, 11],
    degreeLabels: ['2', 'b3', '4', '5', 'b6', '7'],
  },
  {
    id: 'melodicMinor',
    nameKey: 'Melodic Minor',
    degrees: [2, 3, 5, 7, 9, 11],
    degreeLabels: ['2', 'b3', '4', '5', '6', '7'],
  },
  {
    id: 'dorian',
    nameKey: 'Dorian',
    degrees: [2, 3, 5, 7, 9, 10],
    degreeLabels: ['2', 'b3', '4', '5', '6', 'b7'],
  },
  {
    id: 'phrygian',
    nameKey: 'Phrygian',
    degrees: [1, 3, 5, 7, 8, 10],
    degreeLabels: ['b2', 'b3', '4', '5', 'b6', 'b7'],
  },
  {
    id: 'lydian',
    nameKey: 'Lydian',
    degrees: [2, 4, 6, 7, 9, 11],
    degreeLabels: ['2', '3', '#4', '5', '6', '7'],
  },
  {
    id: 'mixolydian',
    nameKey: 'Mixolydian',
    degrees: [2, 4, 5, 7, 9, 10],
    degreeLabels: ['2', '3', '4', '5', '6', 'b7'],
  },
  {
    id: 'locrian',
    nameKey: 'Locrian',
    degrees: [1, 3, 5, 6, 8, 10],
    degreeLabels: ['b2', 'b3', '4', 'b5', 'b6', 'b7'],
  },
  {
    id: 'phrygianDominant',
    nameKey: 'Phrygian Dominant (Hijaz)',
    degrees: [1, 4, 5, 7, 8, 10],
    degreeLabels: ['b2', '3', '4', '5', 'b6', 'b7'],
  },
  {
    id: 'majorBlues',
    nameKey: 'Major Blues',
    degrees: [2, 3, 4, 7, 9],
    degreeLabels: ['2', 'b3', '3', '5', '6'],
  },
  // The two diminished scales have eight notes, so one letter name carries
  // two degrees. Labels follow the jazz convention: half-whole reads its
  // minor third as #2 (the #9 over a dominant chord), whole-half spells its
  // sixth degree as a plain 6 rather than bb7.
  {
    id: 'halfWholeDiminished',
    nameKey: 'Half-Whole Diminished',
    degrees: [1, 3, 4, 6, 7, 9, 10],
    degreeLabels: ['b2', '#2', '3', '#4', '5', '6', 'b7'],
  },
  {
    id: 'wholeHalfDiminished',
    nameKey: 'Whole-Half Diminished',
    degrees: [2, 3, 5, 6, 8, 9, 11],
    degreeLabels: ['2', 'b3', '4', 'b5', 'b6', '6', '7'],
  },
  {
    id: 'wholeTone',
    nameKey: 'Whole Tone',
    degrees: [2, 4, 6, 8, 10],
    degreeLabels: ['2', '3', '#4', '#5', 'b7'],
  },
  {
    id: 'lydianDominant',
    nameKey: 'Lydian Dominant (Acoustic)',
    degrees: [2, 4, 6, 7, 9, 10],
    degreeLabels: ['2', '3', '#4', '5', '6', 'b7'],
  },
  {
    id: 'altered',
    nameKey: 'Altered (Super Locrian)',
    degrees: [1, 3, 4, 6, 8, 10],
    degreeLabels: ['b2', '#2', '3', 'b5', '#5', 'b7'],
  },
  {
    id: 'doubleHarmonic',
    nameKey: 'Double Harmonic (Arabic)',
    degrees: [1, 4, 5, 7, 8, 11],
    degreeLabels: ['b2', '3', '4', '5', 'b6', '7'],
  },
  {
    id: 'hungarianMinor',
    nameKey: 'Hungarian Minor (Gypsy Minor)',
    degrees: [2, 3, 6, 7, 8, 11],
    degreeLabels: ['2', 'b3', '#4', '5', 'b6', '7'],
  },
  {
    id: 'hirajoshi',
    nameKey: 'Hirajoshi',
    degrees: [2, 3, 7, 8],
    degreeLabels: ['2', 'b3', '5', 'b6'],
  },
] as const;

/** The five most basic scales, shown straight on the Scales screen; every
 *  other `SCALE_TYPES` row lives on the "More scales" page. */
export const BASIC_SCALE_TYPE_IDS: readonly string[] = [
  'major', 'naturalMinor', 'minorPentatonic', 'majorPentatonic', 'blues',
];

/** How the "More scales" page groups everything outside the basic five.
 *  `titleKey` doubles as the i18n lookup key. */
export const MORE_SCALE_GROUPS: readonly { titleKey: string; ids: readonly string[] }[] = [
  { titleKey: 'Modes', ids: ['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'] },
  { titleKey: 'Minor variations', ids: ['harmonicMinor', 'melodicMinor', 'hungarianMinor'] },
  { titleKey: 'Blues & jazz', ids: ['majorBlues', 'lydianDominant', 'altered', 'halfWholeDiminished', 'wholeHalfDiminished', 'wholeTone'] },
  { titleKey: 'World', ids: ['phrygianDominant', 'doubleHarmonic', 'hirajoshi'] },
];

const BY_ID = new Map(SCALE_TYPES.map((s) => [s.id, s]));

export function scaleTypeById(id: string): ScaleTypeDef | undefined {
  return BY_ID.get(id);
}

/** The W/H step pattern between consecutive degrees (root → d1 → d2 → … →
 *  octave), derived from `degrees` — never authored separately, so the
 *  formula shown to the learner (spec §1.4) can never drift from the
 *  semitone data the engine actually drills. `'W'` = 2 semitones, `'H'` = 1,
 *  `'W+H'` = 3 (a step-and-a-half, e.g. pentatonic/blues), `'W+W'` = 4 (two
 *  whole steps, e.g. Hirajoshi's 3→5 and b6→octave). */
export type ScaleStep = 'W' | 'H' | 'W+H' | 'W+W';

const STEP_BY_GAP: Record<number, ScaleStep> = { 1: 'H', 2: 'W', 3: 'W+H', 4: 'W+W' };

export function stepPattern(scale: ScaleTypeDef): ScaleStep[] {
  const bounds = [0, ...scale.degrees, 12];
  return bounds.slice(1).map((n, i) => {
    const step = STEP_BY_GAP[n - bounds[i]];
    if (!step) throw new Error(`stepPattern: unsupported ${n - bounds[i]}-semitone gap in ${scale.id}`);
    return step;
  });
}

/** A movable neck "position" (guitarists' box 1 / box 2) for one scale type —
 *  a window of frets around the root, on every string, rather than a
 *  hand-authored fret chart (spec §4.3). Generative, so the same definition
 *  works on every instrument without per-instrument authoring. */
export interface ScalePositionDef {
  scaleTypeId: string;
  /** 1-based; which occurrence of the root, low to high. */
  positionIndex: number;
  /** Which string this position's root sits on — this, not a fret chart, is
   *  what makes "position 1" different from "position 2". */
  rootString: number;
  /** Fret window around the root fret, inclusive, e.g. `{ from: -1, to: 3 }`. */
  window: { from: number; to: number };
}

/** Position 1 roots on the instrument's lowest string (highest index in the
 *  `notes` table); position 2 on the next string up — same window shape,
 *  applied to a different `rootString` (spec §17 OD-S4). `rootString` here is
 *  a *count from the lowest string*, resolved against the active instrument's
 *  `stringCount` by `scalePositionsFor`, since string count varies by
 *  instrument/variant. */
export interface ScalePositionSpec {
  scaleTypeId: string;
  positionIndex: number;
  /** 0 = the lowest string, 1 = the next string up, … */
  fromLowestString: number;
  window: { from: number; to: number };
}

/** Every scale type gets the same two boxes: position 1 rooted on the lowest
 *  string, position 2 on the next string up. */
export const SCALE_POSITION_SPECS: readonly ScalePositionSpec[] = SCALE_TYPES.flatMap((t) => [
  { scaleTypeId: t.id, positionIndex: 1, fromLowestString: 0, window: { from: -1, to: 3 } },
  { scaleTypeId: t.id, positionIndex: 2, fromLowestString: 1, window: { from: -1, to: 3 } },
]);

/** Resolve every `ScalePositionSpec` for `scaleTypeId` against a concrete
 *  `stringCount` into 1-based `rootString` values (string 1 = highest-pitched,
 *  matching `InstrumentConfig.notes` row order). */
export function scalePositionsFor(scaleTypeId: string, stringCount: number): ScalePositionDef[] {
  return SCALE_POSITION_SPECS
    .filter((s) => s.scaleTypeId === scaleTypeId)
    .map((s) => ({
      scaleTypeId: s.scaleTypeId,
      positionIndex: s.positionIndex,
      rootString: stringCount - s.fromLowestString,
      window: s.window,
    }))
    .filter((p) => p.rootString >= 1 && p.rootString <= stringCount);
}

/** Every pitch class of `scale` rooted at `rootName`, mapped to its degree
 *  label ('1' for the root itself) — the lookup a whole-neck "meet the
 *  scale" view needs, as opposed to `shapeAtRoot`'s single fretted position.
 *  Octave-independent: a note name maps to the same label everywhere it
 *  appears on the neck. */
export function degreeLabelMap(scale: ScaleTypeDef, rootName: string): Map<string, string> {
  const map = new Map<string, string>([[rootName, '1']]);
  scale.degrees.forEach((semitones, i) => {
    map.set(noteNameAtSemitones(rootName, semitones), scale.degreeLabels[i]);
  });
  return map;
}

export interface NeckPos {
  /** 1-based string number. */
  string: number;
  /** Fret number, 0 = open. */
  fret: number;
}

/** Every neck position inside `position`'s window, at the given root fret,
 *  whose note is one of `scale`'s pitch classes above `rootFret`'s note.
 *  `noteTable` is the active `[string-1][fret] -> name` table
 *  (`InstrumentConfig.notes`), exactly as `targetPositionsForInterval` takes
 *  it. Returns `null` if the window would leave the fretboard (root fret too
 *  low), so the question generator tries a different root. */
export function shapeAtRoot(
  scale: ScaleTypeDef,
  position: ScalePositionDef,
  rootFret: number,
  noteTable: readonly (readonly string[])[],
): NeckPos[] | null {
  const rootRow = noteTable[position.rootString - 1];
  const rootName = rootRow?.[rootFret];
  if (!rootName) return null;
  const lo = rootFret + position.window.from;
  const hi = rootFret + position.window.to;
  if (lo < 0) return null;
  const scaleTones = new Set(
    [0, ...scale.degrees].map((s) => noteNameAtSemitones(rootName, s)),
  );
  const out: NeckPos[] = [];
  for (let s = 1; s <= noteTable.length; s++) {
    const row = noteTable[s - 1];
    if (!row) continue;
    for (let f = Math.max(0, lo); f <= hi && f < row.length; f++) {
      if (scaleTones.has(row[f])) out.push({ string: s, fret: f });
    }
  }
  return out;
}
