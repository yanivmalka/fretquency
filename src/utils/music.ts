// Master [string][fret] -> note-name table for the standard 6-string guitar
// (string index 0 = high E). `notes` below is a *live binding* that points at
// this table by default and is swapped to the bass table by setActiveInstrument
// (see utils/instruments.ts) — always read `notes`/`activeMaxFret`/
// `activeDotFrets` at call time rather than copying them at module load.
export const GUITAR_NOTES: string[][] = [
  ['E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','C#'],
  ['B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E','F','F#','G','G#'],
  ['G','G#','A','A#','B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E'],
  ['D','D#','E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
  ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E','F','F#'],
  ['E','F','F#','G','G#','A','A#','B','C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','C#'],
];

export const GUITAR_DOT_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21];

// ── Active instrument (mutable) ──────────────────────────────────────────
// Guitar by default; App.tsx calls setActiveInstrument() before first paint
// and again whenever the user switches instrument in the hamburger menu.
export let notes: string[][] = GUITAR_NOTES;
export let activeMaxFret = 21;
export let activeDotFrets: number[] = GUITAR_DOT_FRETS;
// Per-string lowest playable fret (see InstrumentConfig.minFrets in
// utils/instruments.ts) — empty for every instrument without a restricted
// string; `activeMinFrets[i] ?? 0` at every read site covers that case and
// also a string index past the end of a shorter array.
export let activeMinFrets: number[] = [];

export function setActiveInstrument(cfg: {
  notes: string[][];
  maxFret: number;
  dotFrets: number[];
  minFrets?: number[];
}): void {
  notes = cfg.notes;
  activeMaxFret = cfg.maxFret;
  activeDotFrets = cfg.dotFrets;
  activeMinFrets = cfg.minFrets ?? [];
}

export const cofNotesSharp = ['C','G','D','A','E','B','F#','C#','G#','D#','A#','F'];
export const cofNotesFlat = ['C','G','D','A','E','B','Gb','Db','Ab','Eb','Bb','F'];
export const alphaNotesSharp = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
export const alphaNotesFlat = ['A','Bb','B','C','Db','D','Eb','E','F','Gb','G','Ab'];
export const wholeTonesFifths = ['C','G','D','A','E','B','F'];
export const wholeTonesAlpha = ['A','B','C','D','E','F','G'];
export const wholeTones = ['C','D','E','F','G','A','B'];

export const sharpToFlat: Record<string, string> = {'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb'};
export const flatToSharp: Record<string, string> = {'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};

// Solfege mapping (using Italian/Spanish standard: Do Re Mi Fa Sol La Si).
// Each flat spelling maps to its OWN degree with a flat sign (Db → Re♭, not
// Do♭), so a flat-spelled enharmonic in solfège reads as "Re♭" once the
// `accidental` preference is set to flats.
const alphaToSolfege: Record<string, string> = {
  'C':'Do', 'C#':'Do#', 'Db':'Re♭',
  'D':'Re', 'D#':'Re#', 'Eb':'Mi♭',
  'E':'Mi',
  'F':'Fa', 'F#':'Fa#', 'Gb':'Sol♭',
  'G':'Sol', 'G#':'Sol#', 'Ab':'La♭',
  'A':'La', 'A#':'La#', 'Bb':'Si♭',
  'B':'Si',
};

// Accented syllables per UI language; the table above uses the unaccented
// Italian/Spanish spelling. French writes "Ré"; Brazilian Portuguese writes
// "Dó", "Ré", "Fá" and "Lá". Display-only, like the rest of `displayNote`:
// set from the UI language by `LanguageProvider`, so every note label follows
// the language without threading it through each call site. Parsing
// (`speechVocab`) and note comparison never see it.
const SOLFEGE_ACCENTS: Record<string, Record<string, string>> = {
  fr: { Re: 'Ré' },
  'pt-BR': { Do: 'Dó', Re: 'Ré', Fa: 'Fá', La: 'Lá' },
  ja: { Do: 'ド', Re: 'レ', Mi: 'ミ', Fa: 'ファ', Sol: 'ソ', La: 'ラ', Si: 'シ' },
};
let solfegeAccents: Record<string, string> = {};
export function setSolfegeLanguage(lang: string): void {
  solfegeAccents = SOLFEGE_ACCENTS[lang] ?? {};
}

// "Do Re Mi" in the active language's spelling — the label of the solfège
// option wherever note names are picked.
export function solfegeSample(): string {
  return ['C', 'D', 'E'].map(n => displayNote(n, 'sharps', 'solfege')).join(' ');
}

export type AccidentalMode = 'sharps' | 'flats';
export type OrderMode = 'fifths' | 'alphabet';
// 'german' is the letter system German-speaking musicians use: B is written H
// and B♭ is written B (everything else is as in 'alpha').
export type NotationMode = 'alpha' | 'solfege' | 'german';

export interface HistoryEntry {
  note: string;
  fret: number;
  string: number;
  seconds: number;
  skipped: boolean;
  correct: boolean | null;
  // Assigned by useHistory when the entry is recorded (older localStorage
  // rows predate these). Used to sync/merge with the cloud per account.
  id?: string;
  createdAt?: string;
  // Set only by the interval drill's engine branch, and read only by the
  // interval drill's in-memory history sink (which routes it to the interval
  // SRS schedule). No stats / mastery / leaderboard / personal-best code path
  // looks at it, so an ordinary note row never carries it. The minimal form of
  // premium-product-plan.md §5's "nullable itemId" generalisation.
  intervalItemId?: string;
  // Which interval exercise / direction produced the row (intervals-learning
  // spec §8.3 / §10.3). Carried for Stats and possible future per-form /
  // per-direction tracking — neither changes which SRS item is reviewed.
  intervalForm?: 'identify' | 'findNote' | 'findPosition';
  intervalDir?: 'up' | 'down';
}

export function getCofNotes(accidental: AccidentalMode, order: OrderMode, wholeToneOnly: boolean): string[] {
  if (order === 'alphabet') {
    const base = wholeToneOnly ? wholeTonesAlpha : (accidental === 'sharps' ? alphaNotesSharp : alphaNotesFlat);
    return base;
  }
  const base = wholeToneOnly ? wholeTonesFifths : (accidental === 'sharps' ? cofNotesSharp : cofNotesFlat);
  return base;
}

// Returns the index in cofList that should appear at 12 o'clock for the given string
export function getStringStartIndex(accidental: AccidentalMode, order: OrderMode, wholeToneOnly: boolean, stringIdx: number): number {
  const base = getCofNotes(accidental, order, wholeToneOnly);
  // Guard the brief render right after an instrument switch, when a stale
  // (larger) string number can still be passed against the new note table.
  const openNote = notes[stringIdx]?.[0] ?? notes[notes.length - 1][0];
  const idx = base.findIndex(n => notesMatch(n, openNote));
  return idx >= 0 ? idx : 0;
}

// Turn the ASCII accidental spelling used inside the `notes` table ("C#",
// "Db") into the musical signs the player should actually see ("C♯", "D♭").
// Internal note strings stay ASCII everywhere else — this is display-only,
// applied at the very end of `displayNote`. The trailing-`b` match is safe:
// only a flat spelling ends in a lowercase `b` (natural names are a single
// uppercase letter).
export function withAccidentalGlyphs(name: string): string {
  return name.replace(/#/g, '♯').replace(/b$/, '♭');
}

export function displayNote(note: string, mode: AccidentalMode, notation: NotationMode = 'alpha'): string {
  // First resolve accidental
  let resolved = note;
  if (mode === 'flats') resolved = sharpToFlat[note] || note;
  if (mode === 'sharps') resolved = flatToSharp[note] || note;
  // German letters: B♮ is H and B♭ (A♯) is B — the only two names that differ.
  if (notation === 'german') {
    if (resolved === 'B') return 'H';
    if (resolved === 'Bb' || resolved === 'A#') return 'B';
  }
  // Then apply notation
  let named = notation === 'solfege' ? (alphaToSolfege[resolved] || resolved) : resolved;
  if (notation === 'solfege') named = named.replace(/^[A-Z][a-z]+?(?=[#♭]|$)/, s => solfegeAccents[s] ?? s);
  // Finally swap ASCII #/b for the ♯/♭ signs.
  return withAccidentalGlyphs(named);
}

export function notesMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (sharpToFlat[a] === b || sharpToFlat[b] === a) return true;
  if (flatToSharp[a] === b || flatToSharp[b] === a) return true;
  return false;
}

export function getCorrectCofNote(correctNote: string, cofList: string[]): string {
  return cofList.find(n => notesMatch(n, correctNote)) || correctNote;
}

export function getValidFrets(stringIdx: number, fromFret: number, toFret: number, wholeToneOnly: boolean, dotsOnly?: boolean): number[] {
  const dotAndOpenFrets = [0, ...activeDotFrets];
  // Fall back to the lowest string if a stale out-of-range index slips through
  // during an instrument switch (see getStringStartIndex).
  const row = notes[stringIdx] ?? notes[notes.length - 1];
  // A physically-shorter string (e.g. a banjo's 5th drone string) can't sound
  // below its own minimum fret regardless of the caller's requested window.
  const floor = Math.max(fromFret, activeMinFrets[stringIdx] ?? 0);
  const valid: number[] = [];
  for (let f = floor; f <= toFret; f++) {
    if (dotsOnly && !dotAndOpenFrets.includes(f)) continue;
    if (!wholeToneOnly || wholeTones.includes(row[f])) valid.push(f);
  }
  return valid.length > 0 ? valid : [floor];
}
