// ── Spoken-answer vocabulary & normalisation ─────────────────────────────
//
// WP-1 of the voice-recognition feature. Pure, dependency-free string work:
// take the raw transcript a speech engine produced and turn it into a
// canonical note name (sharp spelling, e.g. "C#") or a fret number.
//
// The canonical note strings returned here are the same ones used in
// `music.ts`'s `notes` table, so callers should feed the result straight
// into `notesMatch()` rather than comparing strings directly — that keeps
// all enharmonic/notation handling in one place.

export type SpeechNotation = 'alpha' | 'solfege' | 'german';

// ── Base-note token tables ──────────────────────────────────────────────
//
// Every key is a lowercased single token that a speech engine might emit
// for the given natural note. Includes common homophones and mis-hearings
// (English) plus a few Hebrew transliterations. Ambiguity between the two
// tables (e.g. "si" = Hebrew C in alpha, but Si = B in solfege) is resolved
// by consulting the table matching the active notation first.

const LETTER_TOKENS: Record<string, string> = {
  a: 'A', ay: 'A', aye: 'A', eh: 'A', hey: 'A', hay: 'A',
  b: 'B', be: 'B', bee: 'B', bea: 'B', bi: 'B',
  c: 'C', see: 'C', sea: 'C', ci: 'C', cee: 'C', si: 'C',
  d: 'D', dee: 'D', de: 'D', di: 'D', the: 'D', thee: 'D',
  e: 'E', ee: 'E', ea: 'E',
  // "F" ("eff") is the weakest letter for speech recognition — an isolated
  // utterance is routinely heard as one of these. None is a note name or an
  // accidental word, so mapping them all to F is safe.
  f: 'F', ef: 'F', eff: 'F', effe: 'F', efe: 'F', ff: 'F',
  if: 'F', of: 'F', off: 'F', half: 'F',
  g: 'G', gee: 'G', jee: 'G', ji: 'G', ji_: 'G',
  // Hebrew letter-name transliterations (best-effort)
  'אֵי': 'A', 'איי': 'A',
  'בי': 'B',
  'סי': 'C',
  'די': 'D',
  'אף': 'F', 'אפ': 'F', 'עף': 'F', 'אפף': 'F',
};

const SOLFEGE_TOKENS: Record<string, string> = {
  do: 'C', doe: 'C', dough: 'C', doh: 'C', 'דו': 'C',
  re: 'D', ray: 'D', rey: 'D', 'רה': 'D', 'רא': 'D',
  mi: 'E', me: 'E', mee: 'E', 'מי': 'E',
  fa: 'F', fah: 'F', far: 'F', 'פה': 'F', 'פא': 'F',
  sol: 'G', so: 'G', soul: 'G', sole: 'G', 'סול': 'G',
  la: 'A', lah: 'A', 'לה': 'A', 'לא': 'A',
  si: 'B', ti: 'B', tea: 'B', tee: 'B', 'סי': 'B',
  // Japanese (katakana / hiragana, plus the long vowel a speaker often adds)
  'ド': 'C', 'ドー': 'C',
  'レ': 'D', 'レー': 'D',
  'ミ': 'E', 'ミー': 'E',
  'ファ': 'F', 'ファー': 'F',
  'ソ': 'G', 'ソー': 'G',
  'ラ': 'A', 'ラー': 'A',
  'シ': 'B', 'シー': 'B',
};

// Japanese letter names (イー = E, ジー = G, …). Consulted as the secondary
// table in solfège mode, where the syllable table above wins on "シー".
const JAPANESE_LETTER_TOKENS: Record<string, string> = {
  'エー': 'A', 'ビー': 'B', 'シー': 'C', 'ディー': 'D', 'イー': 'E', 'エフ': 'F', 'ジー': 'G',
};

Object.assign(LETTER_TOKENS, JAPANESE_LETTER_TOKENS);

// German letter names, spoken in a German recogniser ("zeh", "ha", "be").
// German notation is the only place these are read: there "H" is B natural
// and "B" is B flat, so the entries carry the whole note (sharp spelling).
const GERMAN_NOTE_TOKENS: Record<string, string> = {
  a: 'A', ah: 'A',
  h: 'B', ha: 'B', hah: 'B',
  b: 'A#', be: 'A#', beh: 'A#', bee: 'A#',
  c: 'C', ce: 'C', ze: 'C', zeh: 'C', tse: 'C', tze: 'C', se: 'C',
  d: 'D', de: 'D', deh: 'D',
  e: 'E', eh: 'E',
  f: 'F', ef: 'F', eff: 'F', effe: 'F',
  g: 'G', ge: 'G', geh: 'G',
  // Spoken with the ending, as German musicians say them ("cis", "des", …).
  cis: 'C#', dis: 'D#', eis: 'F', fis: 'F#', gis: 'G#', ais: 'A#', his: 'C',
  ces: 'B', des: 'C#', es: 'D#', fes: 'E', ges: 'F#', as: 'G#',
};

// ── Accidental tokens ──────────────────────────────────────────────────

// Diacritics are stripped before lookup (see `tokenize`), so "dièse" and
// "bémol" are listed without their accents.
const SHARP_TOKENS = new Set([
  'sharp', 'sharpe', 'sharps', 'diez', 'diese', 'diesis', 'sostenido', 'sostenida', 'sustenido',
  'kreuz',
  'シャープ', 'しゃーぷ', '嬰',
  'דיאז', 'דייז', 'שארפ',
]);
const FLAT_TOKENS = new Set([
  'flat', 'flatt', 'flats', 'bemol', 'bemolle', 'bmol',
  'フラット', 'ふらっと', '変',
  'במול', 'פלאט',
]);
const NATURAL_TOKENS = new Set([
  'natural', 'naturale', 'naturel', 'nacional', 'ナチュラル', 'בקר', 'טבעי',
]);

// Words a speaker may pad the answer with — dropped before parsing.
// Deliberately excludes short strings that collide with note tokens
// ("a", "the", "so", "me", …).
const FILLER_TOKENS = new Set([
  'note', 'is', 'its', 'um', 'uh', 'er', 'the', 'answer',
  'i', 'think', 'maybe', 'like',
  'אה', 'זה', 'התו', 'הוא', 'נראה', 'לי',
  // Japanese particles / copula around a spoken note or fret
  'の', 'です', 'は', 'フレット', 'ふれっと',
  // "fret" in each language, and German "is"/"the" padding
  'fret', 'traste', 'casa', 'case', 'frette', 'tasto', 'bund', 'ist', 'der', 'die', 'das',
]);

// Enharmonic collapse: letter + accidental → canonical sharp spelling
// used by the `notes` table.
export const FLAT_TO_SHARP: Record<string, string> = {
  A: 'G#', B: 'A#', C: 'B', D: 'C#', E: 'D#', F: 'E', G: 'F#',
};
export const SHARP_WRAP: Record<string, string> = {
  'E#': 'F', 'B#': 'C',
};

// ── Number tokens (fret answers) ───────────────────────────────────────

const ONES: Record<string, number> = {
  zero: 0, oh: 0, nought: 0, open: 0, 'אפס': 0, 'פתוח': 0, 'פתוחה': 0,
  one: 1, won: 1, 'אחת': 1, 'אחד': 1,
  two: 2, to: 2, too: 2, 'שתיים': 2, 'שתים': 2, 'שניים': 2,
  three: 3, tree: 3, 'שלוש': 3, 'שלושה': 3,
  four: 4, for: 4, fore: 4, 'ארבע': 4, 'ארבעה': 4,
  five: 5, 'חמש': 5, 'חמישה': 5,
  six: 6, sicks: 6, 'שש': 6, 'שישה': 6,
  seven: 7, 'שבע': 7, 'שבעה': 7,
  eight: 8, ate: 8, 'שמונה': 8,
  nine: 9, 'תשע': 9, 'תשעה': 9,
  // Spanish
  cero: 0, abierta: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  // Portuguese
  solta: 0, um: 1, dois: 2, quatro: 4, sete: 7, oito: 8,
  // French
  vide: 0, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9,
  // Italian
  vuoto: 0, vuota: 0, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8,
  // German
  null: 0, leer: 0, eins: 1, ein: 1, zwei: 2, drei: 3, vier: 4, funf: 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
  // Japanese (kanji, kana and katakana)
  'ゼロ': 0, 'れい': 0, '零': 0, '〇': 0, '開放': 0, 'かいほう': 0, 'オープン': 0,
  '一': 1, 'いち': 1, '二': 2, '三': 3, 'さん': 3, '四': 4, 'よん': 4,
  '五': 5, '六': 6, 'ろく': 6, '七': 7, 'なな': 7, 'しち': 7, '八': 8, 'はち': 8,
  '九': 9, 'きゅう': 9,
};
const TEENS: Record<string, number> = {
  ten: 10, 'עשר': 10, 'עשרה': 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  // Spanish (veinte is a single word, handled as a ten below)
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  // Portuguese
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  // French (dix-sept … dix-neuf arrive as "dix" + a digit word, see the tens branch)
  dix: 10, douze: 12, treize: 13, quinze: 15, seize: 16,
  // Italian
  dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16,
  diciassette: 17, diciotto: 18, diciannove: 19,
  // German
  zehn: 10, elf: 11, zwolf: 12, zwoelf: 12, dreizehn: 13, vierzehn: 14, funfzehn: 15, fuenfzehn: 15,
  sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
  // Japanese
  '十': 10, 'じゅう': 10, '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, 'じゅういち': 11, 'じゅうに': 12,
};
const TENS: Record<string, number> = {
  twenty: 20, veinte: 20, vinte: 20, venti: 20, vingt: 20, zwanzig: 20,
  '二十': 20, 'にじゅう': 20,
};
// Spanish / Italian / German spell 21–24 as one word; Japanese as 二十 + digit.
Object.assign(TEENS, {
  veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  ventuno: 21, ventidue: 22, ventitre: 23, ventiquattro: 24,
  einundzwanzig: 21, zweiundzwanzig: 22, dreiundzwanzig: 23, vierundzwanzig: 24,
  '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24,
});
// Linking word between a ten and a one ("vingt et un", "vinte e um", "veinte y uno").
const TEN_LINKS = new Set(['et', 'e', 'y']);

const MAX_FRET = 24;

// ── Tokeniser ─────────────────────────────────────────────────────────

// Every Japanese-script word the tables know, longest first, so an unspaced
// transcript ("ドシャープ", "7フレット") can be cut into words before parsing.
const JAPANESE_SCRIPT = /[぀-ヿ一-鿿〇]/;
const JAPANESE_WORDS: string[] = (() => {
  const words = new Set<string>();
  for (const table of [SOLFEGE_TOKENS, LETTER_TOKENS, ONES, TEENS, TENS]) {
    for (const k of Object.keys(table)) if (JAPANESE_SCRIPT.test(k)) words.add(k);
  }
  for (const set of [SHARP_TOKENS, FLAT_TOKENS, NATURAL_TOKENS, FILLER_TOKENS]) {
    for (const k of set) if (JAPANESE_SCRIPT.test(k)) words.add(k);
  }
  return [...words].sort((x, y) => y.length - x.length);
})();
const JAPANESE_WORD_RE = new RegExp(JAPANESE_WORDS.join('|'), 'g');

function tokenize(raw: string): string[] {
  return raw
    .toLowerCase()
    // drop Latin accents ("dièse" → "diese", "fünf" → "funf") but leave
    // kana voicing marks and Hebrew points alone, then recompose
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    // keep letters (any script), marks, digits and the sharp sign; everything
    // else becomes a separator
    .replace(/[^\p{L}\p{M}\p{N}#]+/gu, ' ')
    // "c#" → "c #"
    .replace(/#/g, ' # ')
    // "7フレット" → "7 フレット"; Japanese has no spaces, so cut it into the words we know
    .replace(/(\d)(?=\p{L})/gu, '$1 ')
    .replace(/(\p{L})(?=\d)/gu, '$1 ')
    .replace(JAPANESE_WORD_RE, ' $& ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return 2; // caller only cares about <= 1
  const prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
    }
  }
  return prev[n];
}

// Resolve one token to a base letter, trying `primary` table first then the
// other, with a length-guarded fuzzy fallback for words (>= 3 chars).
function resolveBase(token: string, notation: SpeechNotation): string | null {
  const primary = notation === 'solfege' ? SOLFEGE_TOKENS : LETTER_TOKENS;
  const secondary = notation === 'solfege' ? LETTER_TOKENS : SOLFEGE_TOKENS;
  if (primary[token]) return primary[token];
  if (secondary[token]) return secondary[token];
  if (token.length >= 3) {
    for (const table of [primary, secondary]) {
      for (const key of Object.keys(table)) {
        if (key.length >= 3 && levenshtein(token, key) <= 1) return table[key];
      }
    }
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────

// German letters: "H" is B natural, "B" is B flat, "cis"/"des" carry their
// accidental, and a lone "is"/"es" after a letter sharpens/flattens it.
function parseGermanNote(tokens: string[]): string | null {
  let note: string | null = null;
  for (const token of tokens) {
    const isNatural = note !== null && /^[A-G]$/.test(note);
    if (isNatural && (token === 'is' || token === '#' || SHARP_TOKENS.has(token))) {
      const sharp: string = `${note}#`;
      note = SHARP_WRAP[sharp] || sharp;
      continue;
    }
    if (isNatural && (token === 'es' || FLAT_TOKENS.has(token))) {
      note = FLAT_TO_SHARP[note!] || note;
      continue;
    }
    if (note) continue; // first letter wins, like the other notations
    note = GERMAN_NOTE_TOKENS[token] ?? resolveBase(token, 'alpha');
  }
  return note;
}

/**
 * Parse a spoken note answer into a canonical note name ("C", "F#", …),
 * or `null` if nothing note-like was heard. Accepts either token order
 * ("c sharp" / "sharp c") and ignores filler words.
 */
export function parseSpokenNote(
  transcript: string,
  notation: SpeechNotation = 'alpha',
): string | null {
  // "is" is English padding but also the German sharp ending ("c is" = Cis).
  const tokens = tokenize(transcript).filter(t => !FILLER_TOKENS.has(t) || (notation === 'german' && t === 'is'));
  if (notation === 'german') return parseGermanNote(tokens);
  let base: string | null = null;
  let accidental: '' | '#' | 'b' | 'natural' = '';

  for (const token of tokens) {
    if (token === '#' || SHARP_TOKENS.has(token)) { accidental = '#'; continue; }
    if (FLAT_TOKENS.has(token)) { accidental = 'b'; continue; }
    if (NATURAL_TOKENS.has(token)) { accidental = 'natural'; continue; }
    const b = resolveBase(token, notation);
    if (b && !base) base = b;
  }

  if (!base) return null;
  if (accidental === '' || accidental === 'natural') return base;
  if (accidental === '#') {
    const sharp = `${base}#`;
    return SHARP_WRAP[sharp] || sharp;
  }
  // flat
  return FLAT_TO_SHARP[base] || base;
}

/**
 * Parse a spoken fret answer into an integer in [0, MAX_FRET], or `null`.
 * Handles digits ("7"), number words ("seven"), "open"/"פתוח" for 0, and
 * two-word compounds ("twenty one").
 */
export function parseSpokenFret(transcript: string): number | null {
  const tokens = tokenize(transcript).filter(t => !FILLER_TOKENS.has(t));

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (/^\d{1,2}$/.test(t)) {
      const n = parseInt(t, 10);
      if (n >= 0 && n <= MAX_FRET) return n;
      continue;
    }
    // French "dix-sept/huit/neuf" arrive as "dix" + a digit word
    if (t === 'dix' && tokens[i + 1] && tokens[i + 1] in ONES && ONES[tokens[i + 1]] >= 7 && ONES[tokens[i + 1]] <= 9) {
      return 10 + ONES[tokens[i + 1]];
    }
    if (t in ONES) return ONES[t];
    if (t in TEENS) return TEENS[t];
    if (t in TENS) {
      let next = tokens[i + 1];
      if (next && TEN_LINKS.has(next)) next = tokens[i + 2];
      if (next && next in ONES && ONES[next] >= 1 && ONES[next] <= 9) {
        return TENS[t] + ONES[next];
      }
      return TENS[t];
    }
  }
  return null;
}

// ── Vocabulary export (for SpeechGrammarList / diagnostics) ────────────

// The sharp / flat words a recogniser should expect, by spoken language.
const ACCIDENTAL_WORDS: Record<string, [string, string]> = {
  es: ['sostenido', 'bemol'],
  pt: ['sustenido', 'bemol'],
  fr: ['dièse', 'bémol'],
  it: ['diesis', 'bemolle'],
  de: ['is', 'es'],
  ja: ['シャープ', 'フラット'],
};

/**
 * Flat list of every phrase the recogniser should bias towards. `locale` is
 * the BCP-47 tag the engine will listen in; it picks the sharp/flat words.
 */
export function speechVocabulary(notation: SpeechNotation, locale?: string): string[] {
  const table = notation === 'solfege' ? SOLFEGE_TOKENS
    : notation === 'german' ? GERMAN_NOTE_TOKENS
    : LETTER_TOKENS;
  const bases = Object.keys(table).filter(k => !/[֐-׿]/.test(k));
  const accidentals = ACCIDENTAL_WORDS[(locale ?? '').slice(0, 2)] ?? ['sharp', 'flat'];
  const phrases = new Set<string>(bases);
  for (const base of bases) {
    for (const acc of accidentals) phrases.add(`${base} ${acc}`);
  }
  for (let f = 0; f <= MAX_FRET; f++) phrases.add(String(f));
  phrases.add('open');
  return [...phrases];
}

export { MAX_FRET as SPEECH_MAX_FRET };
