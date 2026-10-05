// Hand-run diagnostic for Teacher mode's pure homework logic
// (src/teacher/homework.ts, src/teacher/classLink.ts): the teacher's picks
// round-trip through the stored DrillConfig, a hostile or stale stored drill
// is rejected rather than run, the student's display prefs win, attempt
// summaries pick the best score, and invite links parse back to the code.
//   node --experimental-strip-types scripts/check-classroom.mts
import { register } from 'node:module';

register(
  'data:text/javascript,' + encodeURIComponent(
    "export async function resolve(s,c,n){" +
    "if((s.startsWith('./')||s.startsWith('../'))&&!/\\.(m?ts|m?js|json|node)$/i.test(s)){" +
    "try{return await n(s+'.ts',c);}catch{}}" +
    "return n(s,c);}",
  ),
  import.meta.url,
);

// src modules import each other without extensions; resolve them to .ts.
const {
  buildHomeworkDrill, parseHomeworkDrill, defaultHomeworkPicks, summariseAttempts,
  HOMEWORK_INSTRUMENTS, extractWrongPositions, classWeakSpots,
} = await import('../src/teacher/homework.ts');
const {
  normaliseClassCode, isJoinableCode, classCodeProblem, suggestClassCode,
} = await import('../src/teacher/classCode.ts');
const { classActivityStatus } = await import('../src/teacher/classActivity.ts');
const { buildClassInviteUrl, parseClassLink } = await import('../src/teacher/classLink.ts');
const { getInstrument } = await import('../src/utils/instruments.ts');

let failed = 0;
const fail = (msg: string) => { failed++; console.error('FAIL', msg); };
const eq = (a: unknown, b: unknown, msg: string) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${msg}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
};
const display = { accidental: 'flats', order: 'alpha' } as const;

// Round trip for every assignable instrument's default picks.
for (const id of HOMEWORK_INSTRUMENTS) {
  const drill = buildHomeworkDrill(defaultHomeworkPicks(id));
  // Simulate the jsonb round trip.
  const stored = JSON.parse(JSON.stringify(drill));
  const parsed = parseHomeworkDrill(stored, id, display);
  if (!parsed) { fail(`${id}: default picks do not parse back`); continue; }
  eq(parsed.strings, drill.strings, `${id} strings`);
  eq([parsed.fretFrom, parsed.fretTo], [drill.fretFrom, drill.fretTo], `${id} frets`);
  eq(parsed.accidental, 'flats', `${id} student accidental wins`);
  eq(parsed.order, 'alpha', `${id} student order wins`);
  if (parsed.fretTo > getInstrument(id).maxFret) fail(`${id}: fretTo past the neck`);
}

// Multi-string, reversed fret window, duplicate strings.
{
  const d = buildHomeworkDrill({ instrumentId: 'guitar', strings: [6, 5, 6], fretFrom: 7, fretTo: 3, naturalsOnly: false, questionCount: 20 });
  eq(d.strings, [5, 6], 'dedupe + sort strings');
  eq(d.isMulti, true, 'multi when >1 string');
  eq([d.fretFrom, d.fretTo], [3, 7], 'window normalised');
  eq(d.primaryString, 5, 'primary = first string');
}

// Rejections: everything the client must refuse to run.
const good = buildHomeworkDrill(defaultHomeworkPicks('guitar'));
const bad: Array<[string, unknown, unknown]> = [
  ['unknown instrument', good, 'theremin'],
  ['Pro-only instrument', good, 'mandolin'],
  ['null drill', null, 'guitar'],
  ['byNote (not in this slice)', { ...good, mode: 'byNote' }, 'guitar'],
  ['string 7 on a 6-string', { ...good, strings: [7] }, 'guitar'],
  ['string 0', { ...good, strings: [0] }, 'guitar'],
  ['no strings', { ...good, strings: [] }, 'guitar'],
  ['string as text', { ...good, strings: ['6'] }, 'guitar'],
  ['fret past the neck', { ...good, fretTo: 40 }, 'guitar'],
  ['negative fret', { ...good, fretFrom: -1 }, 'guitar'],
  ['reversed window', { ...good, fretFrom: 9, fretTo: 2 }, 'guitar'],
  ['fractional fret', { ...good, fretTo: 4.5 }, 'guitar'],
  ['zero questions', { ...good, questionCount: 0 }, 'guitar'],
  ['1000 questions', { ...good, questionCount: 1000 }, 'guitar'],
  ['ukulele string 5', { ...good, strings: [5] }, 'ukulele'],
];
for (const [name, drill, inst] of bad) {
  if (parseHomeworkDrill(drill, inst, display) !== null) fail(`accepted: ${name}`);
}
// A crafted timeLimit/candidates in the row are ignored, not trusted.
{
  const p = parseHomeworkDrill({ ...good, timeLimit: 9999, candidates: [{ string: 1, fret: 99 }] }, 'guitar', display);
  if (!p) fail('extra fields should not reject');
  else {
    if (p.timeLimit === 9999) fail('stored timeLimit trusted');
    if (p.candidates) fail('stored candidates trusted');
  }
}

// Attempt summary: best ratio, count, latest date, per student.
{
  const s = summariseAttempts([
    { user_id: 'a', correct: 6, total: 10, created_at: '2026-10-01T10:00:00Z' },
    { user_id: 'a', correct: 9, total: 10, created_at: '2026-10-02T10:00:00Z' },
    { user_id: 'a', correct: 7, total: 10, created_at: '2026-10-03T10:00:00Z' },
    { user_id: 'b', correct: 3, total: 10, created_at: '2026-10-02T09:00:00Z' },
  ]);
  eq(s.get('a'), { attempts: 3, bestCorrect: 9, bestTotal: 10, lastAt: '2026-10-03T10:00:00Z' }, 'student a summary');
  eq(s.get('b')?.attempts, 1, 'student b count');
  eq(s.has('c'), false, 'no row for a student who never practised');
}

// Weak spots: which positions a student missed, and the class-wide ranking.
{
  const mkEntry = (string: number, fret: number, correct: boolean | null, skipped = false) =>
    ({ note: 'x', fret, string, seconds: 1, skipped, correct });
  const history = [
    mkEntry(1, 0, true),
    mkEntry(2, 5, false),
    mkEntry(2, 5, false),
    mkEntry(3, 7, null), // timeout
    mkEntry(4, 2, false, true), // skipped
  ];
  const wrong = extractWrongPositions(history as never);
  eq(wrong.length, 4, 'only the non-correct questions are kept');
  eq(wrong.every((p) => typeof p.string === 'number' && typeof p.fret === 'number'), true, 'shape is {string, fret}');

  const attempts = [
    { wrongPositions: [{ string: 2, fret: 5 }, { string: 3, fret: 7 }] },
    { wrongPositions: [{ string: 2, fret: 5 }] },
    { wrongPositions: null }, // pre-0030 row, must not count as "nothing missed"
  ];
  const spots = classWeakSpots(attempts, 5);
  eq(spots[0], { string: 2, fret: 5, missed: 2 }, 'most-missed position ranks first');
  eq(spots[1], { string: 3, fret: 7, missed: 1 }, 'second place');
  eq(spots.length, 2, 'null-detail attempt contributes nothing');
  eq(classWeakSpots([{ wrongPositions: [] }, { wrongPositions: null }]), [], 'no misses => empty list');
  eq(classWeakSpots(
    [{ wrongPositions: Array.from({ length: 10 }, (_, i) => ({ string: 1, fret: i })) }],
    3,
  ).length, 3, 'limit caps the list');
}

// Codes and invite links.
// Codes are case-sensitive (0028): normalising keeps case, drops junk, caps at 10.
eq(normaliseClassCode(' Gu-it ar 7 '), 'Guitar7', 'code normalised, case kept');
eq(normaliseClassCode('abcdefghij12'), 'abcdefghij', 'code capped at 10');
eq(normaliseClassCode('גיטרה7'), '7', 'non-Latin letters dropped');
eq(classCodeProblem('Guitar7'), null, 'valid teacher code');
eq(classCodeProblem('guitar7'), null, 'lower case alone is fine');
eq(classCodeProblem('Gt7'), 'length', 'too short');
eq(classCodeProblem('Guitar7890X'), 'length', 'too long');
eq(classCodeProblem('GUITARS'), 'needsDigit', 'letters only refused');
eq(classCodeProblem('1234567'), 'needsLetter', 'digits only refused');
eq(classCodeProblem('Gui tar7'), 'chars', 'space refused');
eq(isJoinableCode('ABCDEF'), true, 'an old generated code (no digit) still joinable');
eq(isJoinableCode('ABC'), false, 'short code not joinable');
for (let i = 0; i < 200; i++) {
  const c = suggestClassCode();
  if (classCodeProblem(c) !== null) { fail(`suggested code ${c} is invalid`); break; }
}
{
  const url = buildClassInviteUrl('https://example.com/fretquency/', 'Guitar7');
  eq(parseClassLink(new URL(url).search), 'Guitar7', 'invite link round trip keeps case');
  eq(parseClassLink('?class=abc'), null, 'short code rejected');
  eq(parseClassLink('?fotd=guitar'), null, 'other links ignored');
}

// Idle-class notices: 7 days → idle, 5 months → expiring with the 6-month date.
{
  const now = new Date('2026-10-06T12:00:00Z');
  eq(classActivityStatus('2026-10-01T12:00:00Z', now).kind, 'active', '5 days idle is active');
  const idle = classActivityStatus('2026-09-29T12:00:00Z', now);
  eq(idle, { kind: 'idle', idleDays: 7 }, '7 days idle');
  const almost = classActivityStatus('2026-05-07T12:00:00Z', now);
  eq(almost.kind, 'idle', 'one day short of 5 months is still idle');
  const exp = classActivityStatus('2026-05-06T12:00:00Z', now);
  eq(exp.kind, 'expiring', '5 months idle is expiring');
  if (exp.kind === 'expiring') eq(exp.deletesOn.toISOString(), '2026-11-06T12:00:00.000Z', 'deletes 6 months after last activity');
  eq(classActivityStatus('not a date', now).kind, 'active', 'bad timestamp ignored');
}

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('check-classroom: all checks passed');
