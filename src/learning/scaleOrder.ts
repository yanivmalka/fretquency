// ── scaleOrder.ts — the still neck section behind "Tap the scale in order" ─
//
// Pure, no React, no DOM. The fourth Scales exercise: a section of the neck
// (the box's own frets, every string) is shown still, with every note of the
// scale lit. The learner taps them in the order the scale is played — the
// same `tonicRun` Exercise A uses: from the tonic to one end of the box, to
// the other end, and back to the tonic.
//
// A step of the run is a pitch, not a tile: the run passes most notes twice
// (once each way), and a pitch the box holds on two strings (the G–B major
// third) can be answered by either tile.

import type { ScaleQuestion } from './scaleDrill';
import type { NeckPos } from '../utils/scales';
import { midiAt, tonicRun } from './scaleFall';

export interface ScaleOrderBoard {
  /** First and last fret shown, inclusive. */
  fromFret: number;
  toFret: number;
  /** The run in the order it must be tapped — one tile per step (for a
   *  pitch on two strings, the one on the thicker string). */
  run: NeckPos[];
  /** The run's pitches in the order they must be tapped. */
  runMidi: number[];
  /** `"<string>:<fret>"` → that tile's pitch. Only scale notes are in the
   *  map; every other tile of the section is dim. */
  tileMidi: Map<string, number>;
  /** Recall mode: the shape tiles still drawn lit. Absent = every shape tile.
   *  A shape tile left out looks like a non-scale tile but still answers its
   *  step (`tileMidi` is unchanged). */
  lit?: ReadonlySet<string>;
  /** Sequences (`scaleSequence.ts`): per run step, the number a found tile
   *  shows — the note's place in the box, low to high. Absent = the step's
   *  own number. */
  stepLabels?: readonly number[];
}

/** Recall mode ("play the box from memory"): 0 = every note of the box lit,
 *  1 = only the tonic lit, 2 = an empty neck. */
export type RecallLevel = 0 | 1 | 2;
export const RECALL_LEVELS: readonly RecallLevel[] = [0, 1, 2];

export function tileKey(pos: NeckPos): string {
  return `${pos.string}:${pos.fret}`;
}

/** Lays out one question as a still board: the section spans the shape's
 *  frets, and each shape tile carries its pitch. `fadeLevel` only changes
 *  which shape tiles are drawn lit, never what answers a step. */
export function buildOrderBoard(
  q: ScaleQuestion, openMidi: readonly number[], fadeLevel: RecallLevel = 0,
): ScaleOrderBoard {
  const run = tonicRun(q.shape, openMidi, q.direction, { string: q.rootString, fret: q.rootFret });
  const tileMidi = new Map<string, number>();
  for (const p of q.shape) tileMidi.set(tileKey(p), midiAt(p, openMidi));
  const frets = q.shape.map((p) => p.fret);
  const board: ScaleOrderBoard = {
    fromFret: Math.min(...frets),
    toFret: Math.max(...frets),
    run,
    runMidi: run.map((p) => midiAt(p, openMidi)),
    tileMidi,
  };
  if (fadeLevel === 0) return board;
  const tonicClass = midiAt({ string: q.rootString, fret: q.rootFret }, openMidi) % 12;
  const lit = new Set<string>();
  if (fadeLevel === 1) {
    for (const [key, midi] of tileMidi) if (midi % 12 === tonicClass) lit.add(key);
  }
  return { ...board, lit };
}

/** The last step before `step` that played `midi`, or `-1` — which number a
 *  found tile shows (the run passes most notes twice). */
export function lastStepOf(runMidi: readonly number[], midi: number, step: number): number {
  for (let i = Math.min(step, runMidi.length) - 1; i >= 0; i--) if (runMidi[i] === midi) return i;
  return -1;
}
