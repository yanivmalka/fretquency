// ── ScaleMeetBoard — the whole-neck view inside "Meet the scale" ─────────
//
// Unlike `ScaleOrderBoard` (one box, every fret shown), this spans the whole
// instrument (fret 0 to `maxFret`) so a beginner sees where a scale's notes
// actually sit across the neck, not just inside one movable box. Only scale
// tones carry a label (their degree, '1' for the root) — a note outside the
// scale is drawn as a bare, unlabelled cell, so 20+ columns of "C# D# F# G#…"
// never compete with the handful of notes that matter.
//
// Same direction rule as every other neck board in the app: permanent
// `dir="ltr"`, mirrored only by the left-handed setting — Hebrew changes text
// direction, never the instrument's physical layout.

import { degreeLabelMap, type ScaleTypeDef } from '../utils/scales';
import type { MeetBox } from '../learning/scaleFingering';
import type { ScaleTermHighlight } from '../learning/scaleTerms';

interface Props {
  scale: ScaleTypeDef;
  rootName: string;
  /** `[string][fret] -> sharp-spelled note name` for the active instrument. */
  noteTable: readonly (readonly string[])[];
  stringCount: number;
  maxFret: number;
  /** A second home note to ring (the relative major/minor's tonic), drawn
   *  apart from the gold root ring. */
  secondRootName?: string;
  /** One box outlined on the neck, a finger number on each of its notes. */
  box?: MeetBox | null;
  /** An open ⓘ word (`ScaleTermHint`): light up the thing it names. */
  hint?: ScaleTermHighlight | null;
}

export default function ScaleMeetBoard({ scale, rootName, noteTable, stringCount, maxFret, secondRootName, box, hint }: Props) {
  const labels = degreeLabelMap(scale, rootName);
  const frets = Array.from({ length: maxFret + 1 }, (_, f) => f);
  // Lowest (thickest) string on top, like every other neck board here.
  const strings = Array.from({ length: stringCount }, (_, i) => stringCount - i);

  return (
    <div className="scale-meet-scroll">
      <div
        className="scale-meet-board"
        dir="ltr"
        style={{ '--meet-frets': frets.length } as React.CSSProperties}
      >
        {strings.map((s) => (
          <div key={s} className={`scale-meet-row${hint === 'lowString' && s === stringCount ? ' scale-term-hl-row' : ''}`}>
            {frets.map((f) => {
              const name = noteTable[s - 1]?.[f] ?? '';
              const label = labels.get(name);
              const isRoot = label === '1';
              let cls = 'scale-meet-tile';
              if (label != null) cls += ' scale-meet-tile-lit';
              if (isRoot) cls += ' scale-meet-tile-root';
              if (secondRootName != null && name === secondRootName) cls += ' scale-meet-tile-root2';
              const finger = box?.fingers.get(`${s}:${f}`);
              if (box && f >= box.from && f <= box.to) cls += ' scale-meet-tile-box';
              if (finger != null) cls += ' scale-meet-tile-fingered';
              if ((hint === 'root' && isRoot) || (hint === 'degree' && label != null)
                || (hint === 'box' && box && f >= box.from && f <= box.to)) cls += ' scale-term-hl';
              return (
                <span key={f} className={cls}>
                  {label != null && <span className="scale-meet-degree">{label}</span>}
                  {finger != null && <span className="scale-finger">{finger}</span>}
                </span>
              );
            })}
          </div>
        ))}
        <div className={`scale-meet-row scale-meet-frets${hint === 'frets' ? ' scale-term-hl-row' : ''}`} aria-hidden="true">
          {frets.map((f) => <span key={f} className="scale-meet-fret">{f}</span>)}
        </div>
      </div>
    </div>
  );
}
