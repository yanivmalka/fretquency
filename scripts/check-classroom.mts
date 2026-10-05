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
  HOMEWORK_INSTRUMENTS, extractWrongPositions, classWeakSpots, studentWeakSpots,
} = await import('../src/teacher/homework.ts');
const {
  normaliseClassCode, isJoinableCode, classCodeProblem, suggestClassCode,
} = await import('../src/teacher/classCode.ts');
const { classActivityStatus } = await import('../src/teacher/classActivity.ts');
const { buildClassInviteUrl, parseClassLink } = await import('../src/teacher/classLink.ts');
const { getInstrument } = await import('../src/utils/instruments.ts');
const { classifyJoinError } = await import('../src/teacher/classJoinError.ts');
// Not imported from src/utils/trial.ts: that module pulls in utils/supabase.ts,
// which reads import.meta.env and crashes outside a Vite build. Keep this
// literal in step with trial.ts's TRIAL_DAYS by hand.
const TRIAL_DAYS = 7;

let failed = 0;
const fail = (msg: string) => { failed++; console.error('FAIL', msg); };
const eq = (a: unknown, b: unknown, msg: string) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${msg}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
};
const display = { accidental: 'flats', order: 'alpha' } as const;

// Round trip for every assignable instrument's default picks, both directions.
for (const id of HOMEWORK_INSTRUMENTS) {
  for (const mode of ['byFret', 'byNote'] as const) {
    const drill = buildHomeworkDrill({ ...defaultHomeworkPicks(id), mode });
    eq(drill.mode, mode, `${id}/${mode}: buildHomeworkDrill sets mode`);
    // Simulate the jsonb round trip.
    const stored = JSON.parse(JSON.stringify(drill));
    const parsed = parseHomeworkDrill(stored, id, display);
    if (!parsed) { fail(`${id}/${mode}: default picks do not parse back`); continue; }
    eq(parsed.mode, mode, `${id}/${mode}: mode round-trips`);
    eq(parsed.strings, drill.strings, `${id}/${mode} strings`);
    eq([parsed.fretFrom, parsed.fretTo], [drill.fretFrom, drill.fretTo], `${id}/${mode} frets`);
    eq(parsed.accidental, 'flats', `${id}/${mode} student accidental wins`);
    eq(parsed.order, 'alpha', `${id}/${mode} student order wins`);
    if (parsed.fretTo > getInstrument(id).maxFret) fail(`${id}/${mode}: fretTo past the neck`);
  }
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
  ['unknown mode', { ...good, mode: 'byChord' }, 'guitar'],
  ['missing mode', { ...good, mode: undefined }, 'guitar'],
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

// Per-student weak spots: same ranking as classWeakSpots, scoped to one user.
{
  const attempts = [
    { user_id: 'a', wrongPositions: [{ string: 2, fret: 5 }, { string: 3, fret: 7 }] },
    { user_id: 'a', wrongPositions: [{ string: 2, fret: 5 }] },
    { user_id: 'b', wrongPositions: [{ string: 3, fret: 7 }] },
    { user_id: 'a', wrongPositions: null }, // pre-0030 row, must not count
  ];
  const aSpots = studentWeakSpots(attempts, 'a', 5);
  eq(aSpots[0], { string: 2, fret: 5, missed: 2 }, 'student a: most-missed position ranks first');
  eq(aSpots[1], { string: 3, fret: 7, missed: 1 }, 'student a: second place');
  eq(aSpots.length, 2, 'student a: only their own attempts counted, null skipped');
  const bSpots = studentWeakSpots(attempts, 'b', 5);
  eq(bSpots, [{ string: 3, fret: 7, missed: 1 }], 'student b: filtered to their own attempts only');
  eq(studentWeakSpots(attempts, 'c', 5), [], 'a student with no attempts gets an empty list');
  eq(studentWeakSpots(
    [{ user_id: 'a', wrongPositions: Array.from({ length: 10 }, (_, i) => ({ string: 1, fret: i })) }],
    'a',
    3,
  ).length, 3, 'limit caps the per-student list too');
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

// join_class RPC error mapping (migrations 0026/0028/0031): classifyJoinError
// is the pure string-matching half of joinClass(), testable without a live
// Supabase client.
eq(classifyJoinError('own class'), 'ownClass', 'own-class exception mapped');
eq(classifyJoinError('The teacher of this class removed you and you are blocked'), 'blocked', 'blocked exception mapped');
eq(classifyJoinError('too many attempts'), 'tooManyAttempts', 'throttle exception mapped');
eq(classifyJoinError('requires_pro'), 'requiresPro', '0031 tier-gate exception mapped');
eq(classifyJoinError('not signed in'), null, 'not-signed-in stays a generic error, not a named outcome');
eq(classifyJoinError('name required'), null, 'name-required stays a generic error');
eq(classifyJoinError('certification required'), null, '0031 checkbox-missing stays a generic error (should never fire — client disables Join until checked)');
eq(classifyJoinError(null), null, 'no message => no mapping');

// 0031's tier-gate math, mirrored here so a change to this logic or to
// TRIAL_DAYS is caught by eye even though the real check runs in Postgres
// (supabase/migrations/0031_classroom_join_requires_pro.sql's join_class).
// Kept intentionally independent of src/utils/entitlement.ts / trial.ts
// internals — this is the SQL's `exists (...) or exists (...)` restated.
function qualifiesForClassroomJoin(
  entitlement: { tier: 'free' | 'pro' | 'premium'; expiresAt: string | null } | null,
  trialStartedAt: string | null,
  now: Date,
): boolean {
  const entitlementLive = !!entitlement
    && entitlement.tier !== 'free'
    && (entitlement.expiresAt === null || new Date(entitlement.expiresAt) > now);
  const trialLive = !!trialStartedAt
    && new Date(trialStartedAt).getTime() > now.getTime() - TRIAL_DAYS * 86_400_000;
  return entitlementLive || trialLive;
}
{
  const now = new Date('2026-10-06T12:00:00Z');
  eq(qualifiesForClassroomJoin(null, null, now), false, 'free, no trial: refused');
  eq(qualifiesForClassroomJoin({ tier: 'pro', expiresAt: null }, null, now), true, 'non-expiring Pro: allowed');
  eq(qualifiesForClassroomJoin({ tier: 'premium', expiresAt: null }, null, now), true, 'Premium (incl. source=teacher): allowed');
  eq(qualifiesForClassroomJoin({ tier: 'pro', expiresAt: '2026-01-01T00:00:00Z' }, null, now), false, 'expired Pro row: refused');
  eq(qualifiesForClassroomJoin({ tier: 'pro', expiresAt: '2027-01-01T00:00:00Z' }, null, now), true, 'not-yet-expired Pro row: allowed');
  eq(qualifiesForClassroomJoin(null, '2026-10-05T12:00:00Z', now), true, 'day-1 of trial, no entitlements row: allowed');
  eq(qualifiesForClassroomJoin(null, new Date(now.getTime() - (TRIAL_DAYS - 1) * 86_400_000).toISOString(), now), true, 'last day of trial: still allowed');
  eq(qualifiesForClassroomJoin(null, new Date(now.getTime() - (TRIAL_DAYS + 1) * 86_400_000).toISOString(), now), false, 'trial expired: refused');
}

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('check-classroom: all checks passed');
