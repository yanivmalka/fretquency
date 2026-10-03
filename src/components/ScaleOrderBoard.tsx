// ── ScaleOrderBoard — "Tap the scale in order"'s still neck section ──────
//
// One row per string (the lowest string on top, like every other neck in the
// app), one column per fret of the box, fret numbers underneath. Every
// note of the scale is lit; the learner taps them in the order of the run.
// The notes outside the scale show their names too, dimmed, so the learner
// sees the whole section of the neck. A found note turns green and shows its
// number in the run; the scale's tonic keeps a gold ring. In learning mode the note the app is playing right now
// is lit brighter and numbered, so the learner can follow the run.
//
// The grid carries `dir="ltr"` permanently — Hebrew changes text direction
// only, never the instrument's layout; mirroring is the left-handed setting's
// job (`[data-hand="left"]` in 27-left-handed.css).

import { lastStepOf, type ScaleOrderBoard as Board } from '../learning/scaleOrder';
import type { OrderTile } from '../hooks/useScaleOrderEngine';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import type { ScaleTermHighlight } from '../learning/scaleTerms';
import { tileStroke, type PickStroke } from '../learning/scalePicking';

interface Props {
  board: Board;
  /** Steps of the run already found. */
  step: number;
  /** Steps that slipped — a wrong tap while they were being looked for. */
  slips: readonly boolean[];
  wrongTile: OrderTile | null;
  /** Learning mode: the run step the app is playing now, or `null`. */
  demoStep: number | null;
  rootName: string;
  /** `[string][fret] -> sharp-spelled note name` for the active instrument. */
  noteTable: readonly (readonly string[])[];
  stringCount: number;
  accidental: AccidentalMode;
  notation: NotationMode;
  onTap: (string: number, fret: number) => void;
  /** Finger per scale note (`"<string>:<fret>"`, 0 = open), or none. */
  fingers?: ReadonlyMap<string, number> | null;
  /** An open ⓘ word (`ScaleTermHint`): light up the thing it names. */
  hint?: ScaleTermHighlight | null;
  /** The picking hand (wishlist item 8): the stroke per run step
   *  (`pickStrokes`), drawn ↓ / ↑ in each scale tile's bottom-end corner
   *  beside the finger dot. Absent = no strokes. */
  strokes?: readonly PickStroke[] | null;
}

export default function ScaleOrderBoard({
  board, step, slips, wrongTile, demoStep, rootName, noteTable, stringCount, accidental, notation, onTap, fingers, hint, strokes,
}: Props) {
  const frets: number[] = [];
  for (let f = board.fromFret; f <= board.toFret; f++) frets.push(f);
  // Lowest (thickest) string on top — string `stringCount` first.
  const strings = Array.from({ length: stringCount }, (_, i) => stringCount - i);

  return (
    <div
      className={`scale-order-board${hint === 'box' ? ' scale-term-hl-box' : ''}`}
      dir="ltr"
      style={{ '--order-frets': frets.length } as React.CSSProperties}
    >
      {strings.map((s) => (
        <div key={s} className={`scale-order-row${hint === 'lowString' && s === stringCount ? ' scale-term-hl-row' : ''}`}>
          <span className="scale-order-string">
            {displayNote(noteTable[s - 1]?.[0] ?? '', accidental, notation)}
          </span>
          {frets.map((f) => {
            const name = noteTable[s - 1]?.[f] ?? '';
            const midi = board.tileMidi.get(`${s}:${f}`);
            const lit = midi != null;
            const demoing = lit && demoStep != null && board.runMidi[demoStep] === midi;
            // The number shown: the step now being demoed, or the latest step
            // already played on this pitch.
            const tileStep = !lit ? -1 : demoing ? demoStep : lastStepOf(board.runMidi, midi, step);
            const found = lit && !demoing && tileStep >= 0;
            // Recall mode: a shape tile outside `board.lit` is drawn dim but
            // still answers its step.
            const shown = lit && (board.lit?.has(`${s}:${f}`) ?? true);
            let cls = 'scale-order-tile';
            if (shown) cls += ' scale-order-tile-lit';
            if (shown && name === rootName) cls += ' scale-order-tile-root';
            if (found) cls += ' scale-order-tile-found';
            if (demoing) cls += ' scale-order-tile-demo';
            if (found && slips[tileStep]) cls += ' scale-order-tile-slip';
            if (wrongTile && wrongTile.string === s && wrongTile.fret === f) cls += ' scale-order-tile-wrong';
            if (hint === 'root' && shown && name === rootName) cls += ' scale-term-hl';
            const stroke = lit && strokes ? tileStroke(board.runMidi, strokes, midi, step, found || demoing ? tileStep : -1) : null;
            return (
              <button
                key={f}
                type="button"
                className={cls}
                onClick={() => onTap(s, f)}
              >
                <span className="scale-order-note">{displayNote(name, accidental, notation)}</span>
                {(found || demoing) && <span className="scale-order-step">{board.stepLabels?.[tileStep] ?? tileStep + 1}</span>}
                {lit && fingers?.has(`${s}:${f}`) && <span className="scale-finger">{fingers.get(`${s}:${f}`)}</span>}
                {stroke && <span className={`scale-stroke scale-stroke-${stroke}`}>{stroke === 'down' ? '↓' : '↑'}</span>}
              </button>
            );
          })}
        </div>
      ))}
      <div className={`scale-order-row scale-order-frets${hint === 'frets' ? ' scale-term-hl-row' : ''}`} aria-hidden="true">
        <span className="scale-order-string" />
        {frets.map((f) => <span key={f} className="scale-order-fret">{f}</span>)}
      </div>
    </div>
  );
}
