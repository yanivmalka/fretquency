// ── scalePicking — the picking hand's stroke per step of a run (pure) ────
//
// The teacher's rule from the first lesson: alternate picking — down, up,
// down, up — from the first note, not all downstrokes. `pickStrokes` gives
// the stroke for every step of a run; `ScaleOrderBoard` draws it as ↓ / ↑ on
// each tile beside the finger dot.
//
// The app hears which note was played, never how it was picked, so nothing
// here is ever checked against the learner — it is a written instruction.
// With the metronome at 2 notes per click (`scaleTiming.ts`), every down
// stroke falls on a click and every up stroke between two, which is what
// makes the hand alternate evenly.
//
// No React, no DOM — checked by `scripts/check-scale-picking.mts`.

export type PickStroke = 'down' | 'up';

/** The stroke per step of `run`: alternate, starting with a down stroke. */
export function pickStrokes(run: readonly unknown[]): PickStroke[] {
  return run.map((_, i) => (i % 2 === 0 ? 'down' : 'up'));
}

/** The stroke a tile shows, for the pitch `midi` with `step` steps found:
 *  the step being demoed or found keeps its own stroke (`shownStep`, ≥ 0);
 *  otherwise the stroke of the next step still to play that pitch, else of
 *  the last one that played it. A plain up-and-down run plays each pitch on
 *  the same stroke both ways (step k and 2(n−1)−k share a parity); a
 *  sequence may not, so the tile follows the run. `null` when the run never
 *  plays the pitch. */
export function tileStroke(
  runMidi: readonly number[], strokes: readonly PickStroke[], midi: number, step: number, shownStep: number,
): PickStroke | null {
  if (shownStep >= 0) return strokes[shownStep] ?? null;
  for (let i = Math.max(0, step); i < runMidi.length; i++) if (runMidi[i] === midi) return strokes[i] ?? null;
  for (let i = Math.min(step, runMidi.length) - 1; i >= 0; i--) if (runMidi[i] === midi) return strokes[i] ?? null;
  return null;
}
