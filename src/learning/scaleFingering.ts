// ── scaleFingering.ts — which box a board shows, and its fingering ────────
//
// Pure, no React. Resolves a box (scale type + box number + root fret) to
// its absolute fret window and hands it to `fingeringFor` (scales.ts), for
// "Tap the scale in order"'s board and the box drawn on "Meet the scale".

import type { ScaleQuestion } from './scaleDrill';
import {
  connectBoxesPosition, fingeringFor, scalePositionsFor, scaleTypeById, shapeAtRoot,
  type ScalePositionDef,
} from '../utils/scales';

function positionFor(scaleTypeId: string, positionIndex: number, stringCount: number): ScalePositionDef | null {
  if (positionIndex === 0) return connectBoxesPosition(scaleTypeId, stringCount);
  return scalePositionsFor(scaleTypeId, stringCount).find((p) => p.positionIndex === positionIndex) ?? null;
}

/** The fingering of a question's box, keyed `"<string>:<fret>"`, or `null`
 *  when one hand position cannot hold it (a "Connect the boxes" run). */
export function questionFingering(q: ScaleQuestion, stringCount: number): Map<string, number> | null {
  const pos = positionFor(q.scaleTypeId, q.positionIndex, stringCount);
  if (!pos) return null;
  return fingeringFor(q.shape, { from: q.rootFret + pos.window.from, to: q.rootFret + pos.window.to });
}

export interface MeetBox {
  /** The box's frets, inclusive. */
  from: number;
  to: number;
  fingers: Map<string, number>;
}

/** Box `positionIndex` of a scale at the lowest root fret named `rootName`
 *  on the box's root string where the whole window fits the neck — the box a
 *  whole-neck view outlines. `null` if it fits nowhere. */
export function meetBox(
  scaleTypeId: string,
  positionIndex: number,
  rootName: string,
  noteTable: readonly (readonly string[])[],
  stringCount: number,
  maxFret: number,
): MeetBox | null {
  const scale = scaleTypeById(scaleTypeId);
  const pos = positionFor(scaleTypeId, positionIndex, stringCount);
  if (!scale || !pos) return null;
  const row = noteTable[pos.rootString - 1] ?? [];
  for (let rootFret = 0; rootFret <= maxFret; rootFret++) {
    if (row[rootFret] !== rootName) continue;
    const from = rootFret + pos.window.from;
    const to = rootFret + pos.window.to;
    if (from < 0 || to > maxFret) continue;
    const shape = shapeAtRoot(scale, pos, rootFret, noteTable);
    const fingers = shape && fingeringFor(shape, { from, to });
    if (fingers) return { from, to, fingers };
  }
  return null;
}
