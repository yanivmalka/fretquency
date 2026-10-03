// ── scaleLicks.ts — short standard licks per box, played back by ear ─────
//
// Pure, no React, no DOM. The teacher's next step after "I play, you play it
// back" (product-wishlist, Scales, 2026-10-03 item 7): "then a small lick".
// A lick is a fixed phrase. The app demos it, the learner plays it back, all
// through the echo engine (`ScaleEchoCard`, `useScaleOrderEngine`'s
// `layoutBoard`), with the lick as the board's run.
//
// - A lick is stored box-relative: each step is a string (1 = the thinnest)
//   and a scale degree. In a pentatonic or blues box every string holds two
//   or three notes of different degrees, so (string, degree) names exactly
//   one tile of the box, at any root. The box is the one rooted on the 6th
//   string (`LICK_ROOT_STRING`): box 1 on a 6-string, box 2 on a 7-string.
// - Guitar only. On a bass the same string numbers are other strings (G, D,
//   A), so the same steps would be another melody.
// - These are not invented. Every lick is a standard beginner lick taken
//   from a published lesson (the `source` field). Only the plain notes are
//   kept: a bend, a slide or a double stop the app cannot judge yet is left
//   out, and `note` says so on screen. A note picked twice in a row in the
//   source is kept once, since the engine and the guitar listener both take
//   an immediate repeat for the note still ringing.
// - One lick played back is one history row, form `echo`, for the box's own
//   item id. Like a phrase, it does not review the box in `scaleSrs` and does
//   not count toward its mastery (`countsForMastery`).

import type { ScalePoolItem, ScaleQuestion } from './scaleDrill';
import { scalePositionsFor, type NeckPos } from '../utils/scales';
import { midiAt } from './scaleFall';
import { buildOrderBoard, type ScaleOrderBoard } from './scaleOrder';

/** Scale degrees a lick may name, as semitones above the root. `b5` is the
 *  blues note — only a Blues box holds it. */
export const LICK_DEGREES = { '1': 0, b3: 3, '4': 5, b5: 6, '5': 7, b7: 10 } as const;
export type LickDegree = keyof typeof LICK_DEGREES;

export interface LickStep {
  /** 1-based string number, 1 = the thinnest. */
  string: number;
  degree: LickDegree;
}

export interface ScaleLick {
  id: string;
  /** English name (an i18n key). */
  nameKey: string;
  /** One line on how to play it (an i18n key). */
  howKey: string;
  /** What the app left out of the source lick, if anything (an i18n key). */
  noteKey?: string;
  steps: readonly LickStep[];
  /** Where the lick comes from — not shown, kept for review. */
  source: string;
}

const s = (string: number, degree: LickDegree): LickStep => ({ string, degree });

// Box 1 of A minor pentatonic (5th position) for reference, string: fret =
// degree — 1: 5 = 1, 8 = b3 · 2: 5 = 5, 8 = b7 · 3: 5 = b3, 7 = 4 ·
// 4: 5 = b7, 7 = 1 · 5: 5 = 4, 7 = 5 · 6: 5 = 1, 8 = b3.
const BOX1_LICKS: readonly ScaleLick[] = [
  {
    id: 'bluesOpening',
    nameKey: 'The blues opening',
    howKey: 'One note each on strings 3, 2 and 1, ending on the root.',
    noteKey: 'The full version bends the first note up a whole step. Here it is played without the bend.',
    // 12bar.de, "Blues licks", "A typical Blues opening – step by step",
    // basic notes: G7 – B5 – e5 – e5 (A minor pentatonic). Step 2 of the
    // same lesson bends the G7 to the 9th-fret pitch.
    steps: [s(3, '4'), s(2, '5'), s(1, '1')],
    source: 'https://12bar.de/cms/tutorial/blues-licks/ — "A typical Blues opening", basic notes',
  },
  {
    id: 'claptonTurnHome',
    nameKey: 'Turn for home',
    howKey: 'Two notes down string 3, then the root on string 4.',
    noteKey: 'The full version starts the first note bent up and lets it down. Here it is played without the bend.',
    // 12bar.de, "All-Time Standard EC Licks (A Blues Scale)", first lick:
    // G7 (bend-release) – G5 – D7.
    steps: [s(3, '4'), s(3, 'b3'), s(4, '1')],
    source: 'https://12bar.de/cms/tutorial/blues-licks/ — "All-Time Standard EC Licks", lick 1',
  },
  {
    id: 'pageTriplet',
    nameKey: 'The rolling triplet',
    howKey: 'Pull off from the high note to the root on string 1, then string 2 — three notes, twice round.',
    // 12bar.de, "Repeating Pattern Examples", second pattern: e8p5 – B5,
    // repeated (a Page / Clapton-style rock triplet). Two rounds kept.
    steps: [s(1, 'b3'), s(1, '1'), s(2, '5'), s(1, 'b3'), s(1, '1'), s(2, '5')],
    source: 'https://12bar.de/cms/tutorial/blues-licks/ — "Repeating Pattern Examples", pattern 2',
  },
  {
    id: 'pullOffDescent',
    nameKey: 'Pull-offs down the box',
    howKey: 'On strings 1, 2 and 3 in turn, pull off from the high note to the low one.',
    noteKey: 'The full version bends the 5th note up a whole step. Here it is played without the bend.',
    // guitarchalk.com, "10 Easy Blues Guitar Licks for Beginners", lick 4:
    // "a descending pentatonic lick using the first shape. It starts on the
    // E with a pull off from the 8th fret to the 5th, this pattern is then
    // repeated on the B string", then a bend on the 7th fret (G string),
    // ending on the 5th fret: e8p5 – B8p5 – G7 – G5.
    steps: [s(1, 'b3'), s(1, '1'), s(2, 'b7'), s(2, '5'), s(3, '4'), s(3, 'b3')],
    source: 'https://www.guitarchalk.com/blues-guitar-licks-beginners/ — lick 4',
  },
];

/** Licks per scale type. Minor Pentatonic and Blues for now: the Blues box
 *  is the pentatonic box plus the blues note, so every lick sits in it too. */
const LICKS_BY_SCALE: Readonly<Record<string, readonly ScaleLick[]>> = {
  minorPentatonic: BOX1_LICKS,
  blues: BOX1_LICKS,
};

/** The licks are written for the box rooted on the 6th string (the low E of
 *  a standard guitar): box 1 on a 6-string, box 2 on a 7-string, whose box 1
 *  sits on the low B with its top strings in other places. An 8- or 9-string
 *  has no authored box on the 6th string. */
export const LICK_ROOT_STRING = 6;

/** The licks of one box on a `stringCount`-string guitar — none for a box
 *  that isn't the one rooted on the 6th string. */
export function licksFor(scaleTypeId: string, positionIndex: number, stringCount: number): readonly ScaleLick[] {
  const pos = scalePositionsFor(scaleTypeId, stringCount).find((p) => p.positionIndex === positionIndex);
  if (!pos || pos.rootString !== LICK_ROOT_STRING) return [];
  return LICKS_BY_SCALE[scaleTypeId] ?? [];
}

/** Every box that has licks on a `stringCount`-string guitar, as pool items. */
export function lickPool(stringCount: number): ScalePoolItem[] {
  return Object.keys(LICKS_BY_SCALE).flatMap((scaleTypeId) =>
    scalePositionsFor(scaleTypeId, stringCount)
      .filter((p) => p.rootString === LICK_ROOT_STRING)
      .map((p) => ({ scaleTypeId, positionIndex: p.positionIndex })));
}

/** The lick's tiles in the box of `q`, step by step, or `null` if a step has
 *  no tile there (another tuning, a box that doesn't hold the degree). */
export function resolveLick(
  lick: ScaleLick, q: ScaleQuestion, openMidi: readonly number[],
): NeckPos[] | null {
  const rootClass = midiAt({ string: q.rootString, fret: q.rootFret }, openMidi) % 12;
  const out: NeckPos[] = [];
  for (const step of lick.steps) {
    const want = (rootClass + LICK_DEGREES[step.degree]) % 12;
    const tiles = q.shape.filter((p) => p.string === step.string && midiAt(p, openMidi) % 12 === want);
    if (tiles.length !== 1) return null;
    out.push(tiles[0]);
  }
  return out;
}

/** The board for one lick: the question's box laid out as for "Tap the
 *  scale in order", with the lick as the run. `dim` lights only the root
 *  (Recall level 1); every box tile still answers its pitch. `null` when the
 *  lick doesn't fit this box. */
export function lickBoard(
  q: ScaleQuestion, openMidi: readonly number[], lick: ScaleLick, dim: boolean,
): ScaleOrderBoard | null {
  const run = resolveLick(lick, q, openMidi);
  if (!run) return null;
  const base = buildOrderBoard(q, openMidi, dim ? 1 : 0);
  return { ...base, run, runMidi: run.map((p) => midiAt(p, openMidi)) };
}

/** Tries per lick in a session: hear it and learn it, then play it again. */
export const LICK_TRIES = 2;

/** Which lick the `n`th question of a session (0-based) asks: each lick
 *  `LICK_TRIES` times in a row, in the authored order. */
export function lickIndexFor(n: number, lickCount: number): number {
  if (lickCount <= 0) return 0;
  return Math.floor(Math.max(0, n) / LICK_TRIES) % lickCount;
}
