// ── scaleTerms — the beginner's words, each in one plain sentence ──────────
//
// Wishlist "Update 2026-10-03" item 1 ("Plain words, in place"): the words a
// first-time learner meets on the Scales screens — box, root, degree, the
// string numbers, fret — each get a tappable ⓘ (`ScaleTermHint.tsx`). The
// sentence is an English source string (the i18n lookup key); `highlight`
// names what a neck board lights up while that term is open, when the screen
// has a board. No logic, no persistence.

export type ScaleTermId = 'box' | 'root' | 'degree' | 'string' | 'fret';

/** What a board emphasises while a term is open: the root tiles, the box's
 *  frets, the degree labels, the thickest string's row, the fret numbers. */
export type ScaleTermHighlight = 'root' | 'box' | 'degree' | 'lowString' | 'frets';

export interface ScaleTermDef {
  /** The word itself, as the screens already spell it (an i18n key). */
  labelKey: string;
  /** One plain sentence (an i18n key). */
  sentenceKey: string;
  highlight: ScaleTermHighlight;
}

export const SCALE_TERMS: Record<ScaleTermId, ScaleTermDef> = {
  box: {
    labelKey: 'Box',
    sentenceKey: 'A box is one hand-sized patch of the neck where the whole scale fits under your four fingers without moving your hand — its number says which patch, not a finger or a fret.',
    highlight: 'box',
  },
  root: {
    labelKey: 'Root',
    sentenceKey: 'The root is the scale’s home note, the one it is named after — it has the gold ring.',
    highlight: 'root',
  },
  degree: {
    labelKey: 'Degree',
    sentenceKey: 'A degree is a note’s place in the scale, counted up from the root, which is 1 — a “b” before the number means one fret lower.',
    highlight: 'degree',
  },
  string: {
    labelKey: 'String',
    sentenceKey: 'Strings are numbered from the thinnest (1) to the thickest, so the thickest string — the lit row on top — has the highest number.',
    highlight: 'lowString',
  },
  fret: {
    labelKey: 'Fret',
    sentenceKey: 'A fret is one numbered slot along the neck — press just behind its metal wire; the numbers under the board are the frets.',
    highlight: 'frets',
  },
};

/** The highlight a board should draw for the open term, or `null`. */
export function termHighlight(term: ScaleTermId | null): ScaleTermHighlight | null {
  return term ? SCALE_TERMS[term].highlight : null;
}
