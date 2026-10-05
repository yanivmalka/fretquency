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
  normaliseClassCode, HOMEWORK_INSTRUMENTS,
} = await import('../src/teacher/homework.ts');
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

// Codes and invite links.
eq(normaliseClassCode(' ab-c 23 4x '), 'ABC234', 'code normalised and capped');
{
  const url = buildClassInviteUrl('https://example.com/fretquency/', 'ABC234');
  eq(parseClassLink(new URL(url).search), 'ABC234', 'invite link round trip');
  eq(parseClassLink('?class=abc'), null, 'short code rejected');
  eq(parseClassLink('?fotd=guitar'), null, 'other links ignored');
}

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('check-classroom: all checks passed');
