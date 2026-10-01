// ── Plain-language blurbs for the "More scales" page ──────────────────────
//
// One short explanation per scale type, shown when the learner taps the "?"
// beside a row. Written for someone who has never met the scale: how it
// differs from a scale they already know, and what it sounds like. Every
// string is also an i18n key (English source = lookup key), so each needs a
// `he` entry in `translations.ts`.

export const SCALE_BLURBS: Record<string, string> = {
  major:
    'The scale behind most pop, folk and classical music. It sounds bright and happy, and every other scale is easiest to understand by comparing it to this one.',
  naturalMinor:
    'The basic minor scale. Compared to major, its 3rd, 6th and 7th are one fret lower, which gives it a sad, serious sound.',
  minorPentatonic:
    'Five notes: the minor scale without its 2nd and 6th. It is the most common scale for rock and blues solos, and easy to play because it has no awkward notes.',
  majorPentatonic:
    'Five notes: the major scale without its 4th and 7th. It sounds sweet and open, and is common in country, pop and rock solos.',
  blues:
    'The minor pentatonic scale plus one extra "blue note", the flat 5th, which adds a gritty, bluesy tension.',
  dorian:
    'Like natural minor, but with a major 6th instead of a flat 6th. It sounds minor yet lighter and more open — common in funk, jazz and rock.',
  phrygian:
    'Like natural minor, but the 2nd note sits just one fret above the root. It sounds dark and tense, with a Spanish flavour — common in flamenco and metal.',
  lydian:
    'Like the major scale, but with a raised 4th. It sounds bright, dreamy and floating — common in film music.',
  mixolydian:
    'Like the major scale, but with a flat 7th. It sounds relaxed and bluesy — common in rock, blues and folk.',
  locrian:
    'The most unstable of the modes: it has both a flat 2nd and a flat 5th. It is rarely used as a home key and mostly heard over half-diminished chords.',
  harmonicMinor:
    'Natural minor with a raised 7th, so the 7th sits one fret below the root. That gives a strong pull back home and a dramatic, classical sound.',
  melodicMinor:
    'A minor scale (flat 3rd) that keeps the major 6th and 7th. It sounds smooth and jazzy.',
  hungarianMinor:
    'Harmonic minor with a raised 4th. It has two wide gaps of a step and a half, which gives it a dramatic, exotic sound.',
  majorBlues:
    'The major pentatonic scale plus the flat 3rd "blue note". It sounds sunny, with a country and blues feel.',
  lydianDominant:
    'A major scale with a raised 4th and a flat 7th. It sounds bright but bluesy, and jazz players use it over dominant 7th chords.',
  altered:
    'It bends every colour note of a dominant chord: it has both a flat and a raised 2nd, and both a flat and a raised 5th. It sounds very tense, and is played right before resolving to the next chord.',
  halfWholeDiminished:
    'Eight notes, alternating a half step and a whole step. It is symmetrical and tense, and jazz players use it over dominant 7th chords.',
  wholeHalfDiminished:
    'Eight notes, alternating a whole step and a half step. It is symmetrical, and is used over diminished chords.',
  wholeTone:
    'Six notes, every step a whole tone. With no half steps it has no clear home note, so it sounds dreamy and floating.',
  phrygianDominant:
    'Phrygian with a major 3rd. It is the classic Middle-Eastern sound, common in flamenco, klezmer and Arabic music.',
  doubleHarmonic:
    'A major-sounding scale with a flat 2nd and a flat 6th, so it has two gaps of a step and a half. It has a rich Middle-Eastern flavour.',
  hirajoshi:
    'A five-note Japanese scale with wide gaps between its notes. It sounds sparse and haunting, like a koto.',
};

/** Pro/trade-off copy for the two starting-scale picks on the Scales home
 *  screen (product-owner request, 2026-10-01) — a beginner choosing between
 *  Minor Pentatonic and Major sees *why* each is a reasonable first pick, not
 *  just what it sounds like (`SCALE_BLURBS` above). Deliberately separate
 *  from `SCALE_BLURBS`: this is about choosing a starting point, not
 *  describing the scale in general, so only these two ids are covered. */
export const START_SCALE_TRADEOFFS: Record<string, string> = {
  minorPentatonic:
    'Fewer notes (5) and no awkward fingerings — the most common first scale for guitar, and you can solo with it right away. Trade-off: it skips two notes of the full scale, so it won’t teach you scale-degree theory on its own.',
  major:
    'The foundation scale — every other scale and key gets explained by comparing it to this one. Trade-off: seven notes means a bit more to remember, and a slightly bigger stretch for the fingers than the five-note pentatonic.',
};
