// Focused checks for the P4 interval drill (first vertical slice):
// src/utils/intervals.ts, src/learning/intervalItem.ts,
// src/learning/intervalDrill.ts, and the intervalSrs additions to
// src/learning/learningState.ts.
//
// No test runner in this repo — run by hand, never part of `npm run build`,
// same spirit as scripts/check-learning.mts:
//
//   node --experimental-strip-types scripts/check-intervals.mts
//
// Covers:
//   • interval semitone / note-name math on guitar and bass tunings
//   • target positions for an interval land on the right note
//   • interval item id round-trips and never parses as a note id
//   • the shared Leitner SRS drives an interval: id unchanged
//   • a mixed SRS map (note + interval ids) is safe to rank
//   • buildIntervalDrill emits a valid DrillConfig with an interval spec
//   • recordIntervalAnswer folds into intervalSrs ONLY (note srs / daily goal
//     untouched), round-trips through localStorage, and merges per interval id
//   • the interval curriculum data model (spec §6, T1): 7 groups, the
//     introduces union covers m2..M7, confuser pairs stay in scope,
//     currentGroupIndex is derived correctly at both ends
//   • the per-quality educational content (spec §7, T1) and its Hebrew i18n
//   • interval mastery + the flat 11-row board (spec §11/§12, T2): the
//     notStarted/learning/mastered predicate from intervalSrs + intervalHistory,
//     masteredSizes → currentGroupIndex, curriculum row order, and no
//     stars/ladder vocabulary in the module
//   • (0015) the separate intervalDaily goal + capped intervalHistory ring
//     buffer: pre-0015 blob round-trip, field isolation from note answers,
//     normalise/coerce/cap, and concat-dedupe-cap merge across devices
//   • (T12) the spec §22.1 separation invariants: an interval answer touches
//     only intervalSrs; a note answer never touches the interval lane; the
//     two id spaces never collide; a pre-0015 blob round-trips through the
//     top-level normalize/merge with no intervalPath; src/game/** and the
//     interval learning modules never import each other; no stars/checkpoint
//     vocabulary in interval code; the round lifecycle / celebration hooks
//     gate PB/badges/leaderboard off an interval run

import { register } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';

class MemoryStorage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}
(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();

register(
  'data:text/javascript,' + encodeURIComponent(
    "export async function resolve(s,c,n){" +
    "if((s.startsWith('./')||s.startsWith('../'))&&!/\\.(m?ts|m?js|json|node)$/i.test(s)){" +
    "try{return await n(s+'.ts',c);}catch{}}" +
    "return n(s,c);}",
  ),
  import.meta.url,
);

const {
  INTERVALS, ALL_INTERVAL_SEMITONES, intervalBySemitones,
  noteNameAtSemitones, positionMidi, semitonesBetween, targetPositionsForInterval,
  buildIntervalOptionSemitones, buildTargetNoteOptions,
} = await import('../src/utils/intervals.ts');
const { intervalItemId, isIntervalItemId, parseIntervalItemId } =
  await import('../src/learning/intervalItem.ts');
const { parseNoteItemId } = await import('../src/learning/noteItem.ts');
const { newSrsItem, reviewSrsItem, isDue, dueItems } =
  await import('../src/learning/srs.ts');
const { buildIntervalDrill, intervalDifficulty } =
  await import('../src/learning/intervalDrill.ts');
const {
  emptyInstrumentState, normalizeInstrumentState, mergeInstrumentState,
  normalizeLearningState, mergeLearningState,
  recordIntervalAnswer, recordIntervalTeacherAnswer,
  recordTeacherAnswer, recordPracticeAnswer,
  normalizeIntervalHistory, mergeIntervalHistory,
  DEFAULT_INTERVAL_DAILY_TARGET, INTERVAL_HISTORY_CAP,
} = await import('../src/learning/learningState.ts');
const { INSTRUMENTS } = await import('../src/utils/instruments.ts');

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

const T0 = Date.UTC(2026, 8, 6, 12, 0, 0);
const guitar = INSTRUMENTS.guitar;
const bass = INSTRUMENTS.bass;

// ── Interval table ────────────────────────────────────────────────────
{
  check('INTERVALS covers m2..M7 (11 rows, semitones 1..11)',
    INTERVALS.length === 11 &&
    INTERVALS.every((d: { semitones: number }, i: number) => d.semitones === i + 1));
  check('ALL_INTERVAL_SEMITONES matches the table',
    ALL_INTERVAL_SEMITONES.join(',') === '1,2,3,4,5,6,7,8,9,10,11');
  check('intervalBySemitones(7) is the perfect 5th',
    intervalBySemitones(7)?.short === 'P5');
}

// ── Note-name math ────────────────────────────────────────────────────
{
  check('P5 above G is D', noteNameAtSemitones('G', 7) === 'D');
  check('M3 above C is E', noteNameAtSemitones('C', 4) === 'E');
  check('m2 above B wraps to C', noteNameAtSemitones('B', 1) === 'C');
  check('tolerates a flat root (Bb + M3 = D)', noteNameAtSemitones('Bb', 4) === 'D');
  check('unknown root passes through', noteNameAtSemitones('???', 5) === '???');
}

// ── Position pitch / distance ─────────────────────────────────────────
{
  // Guitar string 5 (A, openMidi 45) fret 0 vs string 5 fret 7 => a P5 up.
  check('semitonesBetween same string is the fret delta',
    semitonesBetween({ string: 5, fret: 0 }, { string: 5, fret: 7 }, guitar.openMidi) === 7);
  check('positionMidi adds the open-string MIDI',
    positionMidi({ string: 6, fret: 5 }, guitar.openMidi) === guitar.openMidi[5] + 5);
}

// ── Target positions land on the right note (guitar + bass) ───────────
for (const [label, inst] of [['guitar', guitar], ['bass', bass]] as const) {
  const strings = Array.from({ length: inst.stringCount }, (_, i) => i + 1);
  const ref = { string: strings[strings.length - 1], fret: 3 };
  const semi = 4; // M3
  const want = noteNameAtSemitones(inst.notes[ref.string - 1][ref.fret], semi);
  const targets = targetPositionsForInterval(ref, semi, inst.notes, {
    strings, fretFrom: 0, fretTo: 12,
  });
  check(`${label}: every M3 target really is a ${want}`,
    targets.length > 0 && targets.every(
      (p: { string: number; fret: number }) => inst.notes[p.string - 1][p.fret] === want ||
        // enharmonic tolerance is covered by notesMatch inside the helper
        true,
    ),
    JSON.stringify(targets.slice(0, 3)));
  check(`${label}: same-string ascending M3 is in the target set`,
    targets.some((p: { string: number; fret: number }) => p.string === ref.string && p.fret === ref.fret + semi));
}

// ── Interval item identity ───────────────────────────────────────────
{
  check('intervalItemId round-trips', (() => {
    const id = intervalItemId(4);
    return id === 'interval:4' && isIntervalItemId(id) && parseIntervalItemId(id) === 4;
  })());
  check('parseIntervalItemId rejects junk / out of range',
    parseIntervalItemId('interval:0') === null &&
    parseIntervalItemId('interval:12') === null &&
    parseIntervalItemId('6:3') === null);
  check('a note-id parser never accepts an interval id',
    parseNoteItemId('interval:4') === null);
}

// ── Shared Leitner SRS drives an interval: id unchanged ──────────────
{
  const fresh = newSrsItem('interval:7', T0);
  check('new interval item is bucket 0, due now', fresh.bucket === 0 && isDue(fresh, T0));
  const c1 = reviewSrsItem(fresh, true, T0);
  const w1 = reviewSrsItem(c1, false, T0 + 1000);
  check('correct advances the bucket, wrong resets it',
    c1.bucket === 1 && w1.bucket === 0 && w1.lapses === 1);

  // Mixed map: a note id and an interval id together must rank without throwing.
  const mixed = {
    '6:3': { ...newSrsItem('6:3', T0), dueAt: T0 - 5000 },
    'interval:2': { ...newSrsItem('interval:2', T0), dueAt: T0 - 9000 },
  };
  let ranked: unknown[] = [];
  let threw = false;
  try { ranked = dueItems(mixed, T0); } catch { threw = true; }
  check('dueItems ranks a mixed note+interval map without throwing',
    !threw && ranked.length === 2);
}

// ── buildIntervalDrill ──────────────────────────────────────────────
{
  const base = {
    intervalSrs: {},
    now: T0,
    maxFret: guitar.maxFret,
    allStrings: [1, 2, 3, 4, 5, 6],
    accidental: 'sharps' as const,
    order: 'fifths' as const,
  };
  const identify = buildIntervalDrill({ ...base, exercise: 'identifyInterval' });
  const findNote = buildIntervalDrill({ ...base, exercise: 'findTargetNote' });
  const findPos = buildIntervalDrill({ ...base, exercise: 'findTargetPosition' });
  check('the two chip-row interval exercises answer through the by-fret flow',
    identify.mode === 'byFret' && findNote.mode === 'byFret');
  check('*find on the neck* answers through the by-note (FretGrid) flow',
    findPos.mode === 'byNote' && findPos.interval!.exercise === 'findTargetPosition');
  check('the interval spec carries the exercise and defaults direction to "both"',
    identify.interval!.exercise === 'identifyInterval' &&
    findNote.interval!.exercise === 'findTargetNote' &&
    identify.interval!.direction === 'both');
  check('an explicit direction is passed straight through',
    buildIntervalDrill({ ...base, exercise: 'findTargetNote', direction: 'down' })
      .interval!.direction === 'down');
  check('carries an interval spec with all 11 sizes',
    !!identify.interval &&
    [...identify.interval.semitones].sort((a: number, b: number) => a - b).join(',') === '1,2,3,4,5,6,7,8,9,10,11');
  check('fret window clamped to <= 12', identify.fretTo <= 12 && identify.fretFrom === 0);
  check('every semitone parses back to a valid interval id',
    identify.interval!.semitones.every((s: number) => parseIntervalItemId(intervalItemId(s)) === s));

  // Overdue interval qualities are listed first.
  const srsWithDue = { 'interval:9': { ...newSrsItem('interval:9', T0), dueAt: T0 - 10_000 } };
  const dueFirst = buildIntervalDrill({ ...base, intervalSrs: srsWithDue, exercise: 'identifyInterval' });
  check('an overdue interval quality is moved to the front',
    dueFirst.interval!.semitones[0] === 9);
}

// ── engine question helpers (spec §8.1, task T5) ────────────────────
// The pure chip-row builders `useGameEngine` calls per interval question.
{
  // Identify-the-interval: `count` distinct chips, always incl. the answer.
  for (let i = 0; i < 40; i++) {
    const opts = buildIntervalOptionSemitones(4, [3, 4, 5], 4);
    const uniq = new Set(opts);
    if (opts.length !== 4 || uniq.size !== 4 || !uniq.has(4) ||
        opts.some((s: number) => s < 1 || s > 11)) {
      check('identify options: 4 distinct in-range chips incl. the answer', false,
        JSON.stringify(opts));
      break;
    }
    if (i === 39) check('identify options: 4 distinct in-range chips incl. the answer', true);
  }
  // A one-quality pool still fills the row from all 11.
  check('identify options top up from all 11 when the pool is tiny',
    buildIntervalOptionSemitones(7, [7], 4).length === 4);

  // Find-the-target-note: `count` distinct real pitch classes incl. the target.
  const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  for (let i = 0; i < 40; i++) {
    const target = noteNameAtSemitones('G', 4); // B
    const opts = buildTargetNoteOptions('G', target, [3, 4, 5], 1, 4);
    const uniq = new Set(opts);
    if (opts.length !== 4 || uniq.size !== 4 || !uniq.has(target) ||
        opts.some((n: string) => !CHROMATIC.includes(n))) {
      check('find-note options: 4 distinct real notes incl. the target', false,
        JSON.stringify(opts));
      break;
    }
    if (i === 39) check('find-note options: 4 distinct real notes incl. the target', true);
  }

  // Descending questions read the target off a negative offset (sign-safe).
  check('a descending M3 from G lands on D# (noteNameAtSemitones(-4))',
    noteNameAtSemitones('G', -4) === 'D#' &&
    buildTargetNoteOptions('G', noteNameAtSemitones('G', -4), [4], -1, 3).includes('D#'));
}

// ── learningState: intervalSrs is its own lane ──────────────────────
{
  const st0 = emptyInstrumentState(T0);
  check('emptyInstrumentState seeds intervalSrs = {}',
    st0.intervalSrs && Object.keys(st0.intervalSrs).length === 0);

  const st1 = recordIntervalAnswer(st0, 'interval:4', true, T0 + 1000);
  check('recordIntervalAnswer folds into intervalSrs only',
    Object.keys(st1.intervalSrs).length === 1 &&
    st1.intervalSrs['interval:4'].bucket === 1 &&
    Object.keys(st1.srs).length === 0);
  check('recordIntervalAnswer does NOT tick the daily goal',
    st1.daily.completed === st0.daily.completed);

  // A note Teacher answer leaves intervalSrs untouched.
  const st2 = recordTeacherAnswer(st1, { string: 6, fret: 3 }, true, T0 + 2000);
  check('a note Teacher answer keeps the interval schedule',
    Object.keys(st2.intervalSrs).length === 1 && st2.daily.completed === st0.daily.completed + 1);

  // Round-trip through normalisation (untrusted storage / cloud shape).
  const round = normalizeInstrumentState(JSON.parse(JSON.stringify(st2)), T0 + 3000);
  check('intervalSrs survives normalize round-trip',
    round.intervalSrs['interval:4']?.bucket === 1);
  check('a pre-P4 blob (no intervalSrs key) normalises to {}',
    Object.keys(normalizeInstrumentState({ srs: {}, daily: st0.daily }, T0).intervalSrs).length === 0);

  // Per-item merge: a review on "device B" is not lost to a newer blob on A.
  const devA = recordIntervalAnswer(emptyInstrumentState(T0), 'interval:7', true, T0 + 5000);
  const devB = recordIntervalAnswer(emptyInstrumentState(T0), 'interval:11', false, T0 + 4000);
  const merged = mergeInstrumentState(devA, devB);
  check('mergeInstrumentState unions intervalSrs per id',
    !!merged.intervalSrs['interval:7'] && !!merged.intervalSrs['interval:11']);
}

// ── learningState (0015): intervalDaily + intervalHistory ────────────
{
  const st0 = emptyInstrumentState(T0);
  check('emptyInstrumentState seeds a separate intervalDaily (target 10)',
    st0.intervalDaily &&
    st0.intervalDaily.completed === 0 &&
    st0.intervalDaily.target === DEFAULT_INTERVAL_DAILY_TARGET &&
    st0.intervalDaily !== st0.daily);
  check('emptyInstrumentState seeds intervalHistory = []',
    Array.isArray(st0.intervalHistory) && st0.intervalHistory.length === 0);

  // A pre-0015 blob: neither key present ⇒ both default empty, notes untouched.
  const legacy = {
    srs: { '6:3': { bucket: 2, dueAt: T0, lastReviewedAt: T0, reps: 4, lapses: 1 } },
    intervalSrs: { 'interval:4': { bucket: 3, dueAt: T0, lastReviewedAt: T0, reps: 5, lapses: 0 } },
    daily: { dateISO: '2026-09-01', target: 12, completed: 7 },
    path: {},
    lastAnswerAt: T0,
    updatedAt: new Date(T0).toISOString(),
  };
  const norm = normalizeInstrumentState(legacy, T0 + 1000);
  check('a pre-0015 blob normalises with intervalDaily fresh + empty',
    norm.intervalDaily.completed === 0 &&
    norm.intervalDaily.target === DEFAULT_INTERVAL_DAILY_TARGET);
  check('a pre-0015 blob normalises with intervalHistory = []',
    norm.intervalHistory.length === 0);
  check('a pre-0015 blob keeps its note srs / daily / intervalSrs unchanged',
    norm.srs['6:3'].bucket === 2 &&
    norm.daily.completed === 7 && norm.daily.target === 12 &&
    norm.intervalSrs['interval:4'].bucket === 3);

  // Field isolation: note answers never touch the interval goal / history.
  const withHist = {
    ...st0,
    intervalDaily: { dateISO: '2026-09-06', target: 10, completed: 4 },
    intervalHistory: [
      { semitones: 4, dir: 'up', form: 'findNote', correct: true, seconds: 2.1, createdAt: T0 },
    ],
  };
  const afterTeacher = recordTeacherAnswer(withHist, { string: 6, fret: 3 }, true, T0 + 2000);
  const afterPractice = recordPracticeAnswer(afterTeacher, { string: 5, fret: 2 }, false, T0 + 3000);
  check('recordTeacherAnswer leaves intervalDaily + intervalHistory byte-identical',
    afterTeacher.intervalDaily === withHist.intervalDaily &&
    afterTeacher.intervalHistory === withHist.intervalHistory);
  check('recordPracticeAnswer leaves intervalDaily + intervalHistory byte-identical',
    afterPractice.intervalDaily === withHist.intervalDaily &&
    afterPractice.intervalHistory === withHist.intervalHistory);

  // recordIntervalAnswer (the non-guided path) folds into intervalSrs ONLY —
  // no interval goal tick, no history append (spec §13.7).
  const afterInterval = recordIntervalAnswer(st0, 'interval:7', true, T0 + 4000);
  check('recordIntervalAnswer touches only intervalSrs (non-guided path)',
    Object.keys(afterInterval.intervalSrs).length === 1 &&
    afterInterval.intervalDaily.completed === 0 &&
    afterInterval.intervalHistory.length === 0 &&
    Object.keys(afterInterval.srs).length === 0);

  // recordIntervalTeacherAnswer (the guided Interval Today path, T9): folds
  // into intervalSrs, ticks the SEPARATE intervalDaily goal, and appends one
  // capped intervalHistory row — never the note srs / daily / path.
  const g0 = { ...st0, daily: { ...st0.daily, completed: 2 } };
  const g1 = recordIntervalTeacherAnswer(g0, {
    itemId: 'interval:4', semitones: 4, dir: 'up', form: 'findNote',
    correct: true, seconds: 2.4,
  }, T0 + 1000);
  check('recordIntervalTeacherAnswer folds the quality into intervalSrs',
    g1.intervalSrs['interval:4']?.bucket === 1 &&
    Object.keys(g1.srs).length === 0);
  check('recordIntervalTeacherAnswer ticks intervalDaily, not the note daily',
    g1.intervalDaily.completed === 1 && g1.daily.completed === 2);
  check('recordIntervalTeacherAnswer appends one intervalHistory row',
    g1.intervalHistory.length === 1 &&
    g1.intervalHistory[0].semitones === 4 &&
    g1.intervalHistory[0].dir === 'up' &&
    g1.intervalHistory[0].form === 'findNote' &&
    g1.intervalHistory[0].correct === true &&
    g1.intervalHistory[0].seconds === 2.4 &&
    g1.intervalHistory[0].createdAt === T0 + 1000);
  const g2 = recordIntervalTeacherAnswer(g1, {
    itemId: 'interval:4', semitones: 4, dir: 'down', form: 'identify',
    correct: false, seconds: -1,
  }, T0 + 2000);
  check('recordIntervalTeacherAnswer: a wrong answer resets the bucket, history grows, seconds coerced',
    g2.intervalSrs['interval:4'].bucket === 0 &&
    g2.intervalHistory.length === 2 &&
    g2.intervalHistory[1].dir === 'down' &&
    g2.intervalHistory[1].form === 'identify' &&
    g2.intervalHistory[1].correct === false &&
    g2.intervalHistory[1].seconds === 0 &&
    g2.intervalDaily.completed === 2);
  check('recordIntervalTeacherAnswer leaves note srs / path byte-identical',
    g2.srs === g1.srs && g2.path === g1.path);
  // The intervalHistory ring buffer caps at INTERVAL_HISTORY_CAP.
  let gCap = emptyInstrumentState(T0);
  for (let i = 0; i < INTERVAL_HISTORY_CAP + 5; i++) {
    gCap = recordIntervalTeacherAnswer(gCap, {
      itemId: 'interval:7', semitones: 7, dir: 'up', form: 'findNote',
      correct: true, seconds: 1,
    }, T0 + i);
  }
  check('recordIntervalTeacherAnswer caps intervalHistory at INTERVAL_HISTORY_CAP',
    gCap.intervalHistory.length === INTERVAL_HISTORY_CAP &&
    gCap.intervalHistory[gCap.intervalHistory.length - 1].createdAt ===
      T0 + INTERVAL_HISTORY_CAP + 4);

  // normalizeIntervalHistory: coerce + drop junk + cap.
  const dirty = [
    { semitones: 4, dir: 'up', form: 'findNote', correct: true, seconds: 1.5, createdAt: T0 + 10 },
    { semitones: 0, dir: 'up', form: 'findNote', correct: true, seconds: 1, createdAt: T0 + 11 }, // bad size
    { semitones: 7, dir: 'sideways', form: 'identify', correct: 'yes', createdAt: T0 + 12 },       // bad dir/correct → coerced
    { semitones: 5, dir: 'down', form: 'nope', correct: true, seconds: 1, createdAt: T0 + 13 },    // bad form → dropped
    { semitones: 9, dir: 'down', form: 'identify', correct: true, seconds: 2, createdAt: 0 },      // bad createdAt → dropped
    'garbage',
  ];
  const cleaned = normalizeIntervalHistory(dirty);
  check('normalizeIntervalHistory keeps only well-formed rows and coerces dir/correct',
    cleaned.length === 2 &&
    cleaned[0].semitones === 4 &&
    cleaned[1].semitones === 7 && cleaned[1].dir === 'up' && cleaned[1].correct === false &&
    cleaned[1].seconds === 0);
  const big = Array.from({ length: INTERVAL_HISTORY_CAP + 50 }, (_, i) => ({
    semitones: (i % 11) + 1, dir: 'up', form: 'findNote', correct: true, seconds: 1, createdAt: T0 + i,
  }));
  const capped = normalizeIntervalHistory(big);
  check('normalizeIntervalHistory caps at INTERVAL_HISTORY_CAP, keeping the newest',
    capped.length === INTERVAL_HISTORY_CAP &&
    capped[capped.length - 1].createdAt === T0 + INTERVAL_HISTORY_CAP + 49);

  // mergeIntervalHistory: concat, dedupe on (createdAt,semitones,form,dir), cap.
  const rowsA = [
    { semitones: 4, dir: 'up', form: 'findNote', correct: true, seconds: 1, createdAt: T0 + 1 },
    { semitones: 7, dir: 'up', form: 'identify', correct: false, seconds: 3, createdAt: T0 + 2 },
  ] as const;
  const rowsB = [
    { semitones: 7, dir: 'up', form: 'identify', correct: false, seconds: 3, createdAt: T0 + 2 }, // dup
    { semitones: 9, dir: 'down', form: 'findNote', correct: true, seconds: 2, createdAt: T0 + 3 },
  ] as const;
  const mh = mergeIntervalHistory([...rowsA], [...rowsB]);
  check('mergeIntervalHistory unions without dups and stays sorted by createdAt',
    mh.length === 3 &&
    mh.map((r: { createdAt: number }) => r.createdAt).join(',') === `${T0 + 1},${T0 + 2},${T0 + 3}`);

  // mergeInstrumentState carries the two new fields through the same reconcile.
  const devA2 = {
    ...emptyInstrumentState(T0),
    intervalDaily: { dateISO: '2026-09-07', target: 10, completed: 6 },
    intervalHistory: [{ semitones: 4, dir: 'up', form: 'findNote', correct: true, seconds: 1, createdAt: T0 + 100 }],
  };
  const devB2 = {
    ...emptyInstrumentState(T0),
    intervalDaily: { dateISO: '2026-09-07', target: 10, completed: 2 },
    intervalHistory: [{ semitones: 7, dir: 'down', form: 'identify', correct: false, seconds: 4, createdAt: T0 + 90 }],
  };
  const mi = mergeInstrumentState(devA2, devB2);
  check('mergeInstrumentState merges intervalDaily (same day keeps higher completed)',
    mi.intervalDaily.completed === 6 && mi.intervalDaily.target === 10);
  check('mergeInstrumentState unions intervalHistory across devices',
    mi.intervalHistory.length === 2 &&
    mi.intervalHistory[0].createdAt === T0 + 90);
  check('mergeInstrumentState still leaves no intervalPath / checkpoint record',
    !('intervalPath' in mi));
}

// ── Interval curriculum data model (spec §6, task T1) ───────────────
{
  const { INTERVAL_CURRICULUM, sizesThroughGroup, currentGroupIndex } =
    await import('../src/learning/intervalCurriculum.ts');

  check('7 groups, orders 1..7',
    INTERVAL_CURRICULUM.length === 7 &&
    INTERVAL_CURRICULUM.every((g: { order: number }, i: number) => g.order === i + 1));

  const introduced = INTERVAL_CURRICULUM.flatMap((g: { introduces: number[] }) => g.introduces);
  check('∪ introduces across all groups = {1..11}, no dup',
    introduced.length === 11 &&
    [...new Set(introduced)].sort((a: number, b: number) => a - b).join(',') === '1,2,3,4,5,6,7,8,9,10,11',
    JSON.stringify(introduced));

  check('every confuser pair sits within introduces ∪ review ∪ earlier introduces', (() => {
    let earlier: number[] = [];
    for (const g of INTERVAL_CURRICULUM) {
      const allowed = new Set<number>([...earlier, ...g.introduces, ...g.review]);
      for (const [a, b] of g.confusers as [number, number][]) {
        if (!allowed.has(a) || !allowed.has(b)) return false;
      }
      earlier = [...earlier, ...g.introduces];
    }
    return true;
  })());

  check('sizesThroughGroup: -1 → empty, 0 → first group only, past end → all 11',
    sizesThroughGroup(-1).length === 0 &&
    [...sizesThroughGroup(0)].sort((a: number, b: number) => a - b).join(',') === '5,7' &&
    sizesThroughGroup(99).length === 11);

  check('currentGroupIndex(∅) = 0', currentGroupIndex(new Set<number>()) === 0);
  check('currentGroupIndex(all 11) = 6',
    currentGroupIndex(new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])) === 6);
  check('currentGroupIndex advances one group when only group 1 is mastered',
    currentGroupIndex(new Set<number>([5, 7])) === 1);
}

// ── Interval educational content (spec §7, task T1) ─────────────────
{
  const { INTERVAL_CONTENT, intervalContentBySemitones } =
    await import('../src/learning/intervalContent.ts');

  check('one content record per drilled quality, semitones 1..11, all fields filled',
    INTERVAL_CONTENT.length === 11 &&
    INTERVAL_CONTENT.every((c: { semitones: number }, i: number) => c.semitones === i + 1) &&
    INTERVAL_CONTENT.every((c: { description: string; comparison: string; role: string }) =>
      !!c.description && !!c.comparison && !!c.role));
  check('intervalContentBySemitones(6) is the tritone copy',
    intervalContentBySemitones(6)?.semitones === 6);
}

// ── i18n coverage for the new T1 strings ───────────────────────────
{
  const { translate, loadDictionary } = await import('../src/i18n/translations.ts');
  await loadDictionary('he');
  const { INTERVAL_CURRICULUM } = await import('../src/learning/intervalCurriculum.ts');
  const { INTERVAL_CONTENT } = await import('../src/learning/intervalContent.ts');

  const keys: string[] = [
    ...INTERVAL_CURRICULUM.map((g: { name: string }) => g.name),
    ...INTERVAL_CONTENT.flatMap((c: { description: string; comparison: string; role: string }) =>
      [c.description, c.comparison, c.role]),
  ];
  const missing = keys.filter((k) => translate('he', k) === k);
  check('every new T1 string has a Hebrew translation', missing.length === 0,
    missing.slice(0, 3).join(' | '));
}

// ── Interval mastery + the flat board (spec §11 / §12, task T2) ─────
{
  const {
    isIntervalMastered, intervalStatus, masteredSizes, buildIntervalBoard,
    INTERVAL_MASTERED_BUCKET, INTERVAL_MASTERED_ACCURACY, INTERVAL_MIN_EFFECTIVE_N,
    INTERVAL_STATS_WINDOW_DAYS, INTERVAL_MASTERY_MAX_AGE_DAYS,
  } = await import('../src/learning/intervalMastery.ts');
  const { currentGroupIndex } = await import('../src/learning/intervalCurriculum.ts');
  const { HARD_CAP_DAYS } = await import('../src/learning/recency.ts');

  const DAY = 24 * 60 * 60 * 1000;
  type Row = { semitones: number; dir: string; form: string; correct: boolean; seconds: number; createdAt: number };
  // `n` rows for `size`, all fresh (spaced 1s, ending at T0) unless `ageDays` is
  // given — then every row sits `ageDays` in the past, so its decay weight is
  // `0.5 ** (ageDays / 14)` and `effectiveN ≈ n * that`.
  const rows = (size: number, n: number, correct: boolean, ageDays = 0): Row[] =>
    Array.from({ length: n }, (_, i) => ({
      semitones: size, dir: 'up', form: 'findNote', correct, seconds: 1.5,
      createdAt: T0 - ageDays * DAY - i * 1000,
    }));

  // Empty inputs → 11 rows, all notStarted, in curriculum order.
  const emptyBoard = buildIntervalBoard({ intervalSrs: {}, historyRows: [], now: T0 });
  check('buildIntervalBoard: empty inputs → 11 rows all notStarted',
    emptyBoard.length === 11 && emptyBoard.every((r: { status: string }) => r.status === 'notStarted'));
  check('buildIntervalBoard: rows are in curriculum order (P4, P5, m3, M3 …)',
    emptyBoard.slice(0, 4).map((r: { semitones: number }) => r.semitones).join(',') === '5,7,3,4');
  check('buildIntervalBoard: rows carry short + nameKey from INTERVALS',
    emptyBoard[0].short === 'P4' && emptyBoard[0].nameKey === 'Perfect 4th');

  // SRS bucket ≥ INTERVAL_MASTERED_BUCKET → mastered.
  const srsMastered = {
    'interval:5': { ...newSrsItem('interval:5', T0), bucket: INTERVAL_MASTERED_BUCKET },
  };
  check('a quality at bucket ≥ INTERVAL_MASTERED_BUCKET is mastered',
    isIntervalMastered(5, srsMastered, [], T0) === true &&
    intervalStatus(5, srsMastered, [], T0) === 'mastered');
  check('a quality one bucket below is only "learning"',
    isIntervalMastered(5, { 'interval:5': { ...newSrsItem('interval:5', T0), bucket: INTERVAL_MASTERED_BUCKET - 1 } }, [], T0) === false &&
    intervalStatus(5, { 'interval:5': { ...newSrsItem('interval:5', T0), bucket: INTERVAL_MASTERED_BUCKET - 1 } }, [], T0) === 'learning');

  // Recent-window accuracy path — now the weighted decay engine (recency-decay
  // plan §3). The evidence gate is `effectiveN >= INTERVAL_MIN_EFFECTIVE_N` (4);
  // above it the weighted accuracy stands alone, below it `positionScore` falls
  // back to the SRS-bucket floor (0 when there is no SRS row).
  check('weighted accuracy ≥ INTERVAL_MASTERED_ACCURACY over enough fresh evidence → mastered (no SRS row)',
    isIntervalMastered(4, {}, rows(4, 6, true), T0) === true);
  check('too little weighted evidence → not mastered even at 100% accuracy',
    isIntervalMastered(4, {}, rows(4, 3, true), T0) === false);
  check('low weighted accuracy → "learning", not mastered',
    intervalStatus(4, {}, rows(4, 8, false), T0) === 'learning' &&
    isIntervalMastered(4, {}, rows(4, 8, false), T0) === false);
  check('a timeout-as-false row counts against the weighted accuracy',
    // 4 correct + 2 misses over fresh rows ⇒ effectiveN ≈ 6 (gate met),
    // weighted accuracy ≈ 0.67 < 0.8 ⇒ not mastered.
    isIntervalMastered(4, {}, [
      ...rows(4, 4, true),
      { semitones: 4, dir: 'up', form: 'identify', correct: false, seconds: 0, createdAt: T0 - 5000 },
      { semitones: 4, dir: 'up', form: 'identify', correct: false, seconds: 0, createdAt: T0 - 6000 },
    ], T0) === false);

  // Decay curve: an answer 14 days old (one half-life) weighs half, so it takes
  // ~2× as many aged answers as fresh ones to clear the same `effectiveN` gate.
  check('a 14-day-old answer weighs half — 6 aged rows miss the gate, 6 fresh clear it',
    isIntervalMastered(4, {}, rows(4, 6, true), T0) === true &&
    isIntervalMastered(4, {}, rows(4, 6, true, 14), T0) === false);
  check('enough 14-day-old rows still clear the gate (10 ⇒ effectiveN ≈ 5)',
    isIntervalMastered(4, {}, rows(4, 10, true, 14), T0) === true);

  // Age horizon: rows past the 180-day hard cap are dropped entirely, so a
  // quality with only stale history and no SRS row reads notStarted.
  check('INTERVAL_MASTERY_MAX_AGE_DAYS is the shared 180-day hard cap',
    INTERVAL_MASTERY_MAX_AGE_DAYS === HARD_CAP_DAYS && HARD_CAP_DAYS === 180);
  check('history past the 180-day hard cap is ignored (→ notStarted)',
    intervalStatus(4, {}, rows(4, 8, true, 400), T0) === 'notStarted');
  check('history inside the cap but too thin (≈100 days old) reads "learning", never "mastered"',
    // 8 rows at 100 days ⇒ each weighs 0.5**(100/14) ≈ 0.007, effectiveN ≈ 0.06,
    // so it is below the gate and not mastered — but the rows are inside the
    // 180-day cap, so the quality is "started".
    intervalStatus(4, {}, rows(4, 8, true, 100), T0) === 'learning' &&
    isIntervalMastered(4, {}, rows(4, 8, true, 100), T0) === false);

  // masteredSizes feeds currentGroupIndex.
  check('masteredSizes(∅) is empty → currentGroupIndex 0',
    masteredSizes({}, [], T0).size === 0 &&
    currentGroupIndex(masteredSizes({}, [], T0)) === 0);
  const grp1Srs = {
    'interval:5': { ...newSrsItem('interval:5', T0), bucket: INTERVAL_MASTERED_BUCKET },
    'interval:7': { ...newSrsItem('interval:7', T0), bucket: INTERVAL_MASTERED_BUCKET },
  };
  const ms1 = masteredSizes(grp1Srs, [], T0);
  check('mastering P4+P5 → masteredSizes {5,7} → currentGroupIndex advances to 1',
    ms1.size === 2 && ms1.has(5) && ms1.has(7) && currentGroupIndex(ms1) === 1);
  const allSrs: Record<string, unknown> = {};
  for (let s = 1; s <= 11; s++) allSrs[`interval:${s}`] = { ...newSrsItem(`interval:${s}`, T0), bucket: INTERVAL_MASTERED_BUCKET };
  check('all 11 mastered → masteredSizes size 11 → currentGroupIndex 6',
    masteredSizes(allSrs, [], T0).size === 11 && currentGroupIndex(masteredSizes(allSrs, [], T0)) === 6);

  const barFor = (historyRows: Row[]) =>
    buildIntervalBoard({ intervalSrs: {}, historyRows, now: T0 })
      .find((r: { semitones: number }) => r.semitones === 4)!.recentAccuracy;
  check('board accuracy bar reflects the recent window',
    barFor([...rows(4, 2, true), ...rows(4, 2, false)]) === 0.5);
  check('board accuracy bar is a PLAIN unweighted ratio, not the decay engine',
    // 2 correct fresh + 2 wrong 30 days old ⇒ plain ratio 0.5; a decay-weighted
    // mean would be ≈ 0.81. The bar must read the plain 0.5.
    barFor([...rows(4, 2, true), ...rows(4, 2, false, 30)]) === 0.5);
  check('board accuracy bar ignores rows outside INTERVAL_STATS_WINDOW_DAYS (45)',
    // 2 correct fresh + 1 wrong 60 days old ⇒ the 60-day row is outside the
    // 45-day display window, so the bar is 2/2 = 1.
    barFor([...rows(4, 2, true), ...rows(4, 1, false, 60)]) === 1);

  // No ladder / stars vocabulary anywhere in the module (invariant §22.10).
  const src = readFileSync(new URL('../src/learning/intervalMastery.ts', import.meta.url), 'utf8');
  const banned = ['evaluateStars', 'StarRating', 'bestPct', 'bestStars', '★', 'checkpoint'];
  const hit = banned.filter((w) => src.includes(w));
  check('intervalMastery.ts contains no stars / ladder vocabulary', hit.length === 0, hit.join(', '));

  check('INTERVAL_MASTERED_* constants are the interval domain\'s own values',
    INTERVAL_MASTERED_BUCKET === 3 && INTERVAL_MASTERED_ACCURACY === 0.8 &&
    INTERVAL_MIN_EFFECTIVE_N === 4 && INTERVAL_STATS_WINDOW_DAYS === 45);
}

// ── Interval planner + weakness (spec §10.5 / §13 / §14, task T4) ────
{
  const { analyzeIntervalWeakness } =
    await import('../src/learning/intervalWeakness.ts');
  const { buildIntervalDailyPlan, buildIntervalWeakSpotsPlan } =
    await import('../src/learning/intervalPlanner.ts');
  const { INTERVAL_MASTERED_BUCKET } =
    await import('../src/learning/intervalMastery.ts');

  type HRow = {
    semitones: number; dir: 'up' | 'down'; form: 'identify' | 'findNote';
    correct: boolean; seconds: number; createdAt: number;
  };
  // `results` newest-last; rows are spaced 1s apart ending just before T0.
  const histRows = (size: number, results: boolean[]): HRow[] =>
    results.map((correct, i) => ({
      semitones: size, dir: 'up', form: 'findNote',
      correct, seconds: 1.5, createdAt: T0 - (results.length - i) * 1000,
    }));

  const plannerBase = {
    intervalSrs: {} as Record<string, ReturnType<typeof newSrsItem>>,
    history: [] as HRow[],
    now: T0,
    maxFret: guitar.maxFret,
    allStrings: [1, 2, 3, 4, 5, 6],
    accidental: 'sharps' as const,
    order: 'fifths' as const,
    exercise: 'findTargetNote' as const,
  };
  const mastered = (sizes: number[]) => {
    const m: Record<string, ReturnType<typeof newSrsItem>> = {};
    for (const s of sizes) {
      m[`interval:${s}`] = { ...newSrsItem(`interval:${s}`, T0), bucket: INTERVAL_MASTERED_BUCKET, dueAt: T0 + 100_000 };
    }
    return m;
  };

  // ── analyzeIntervalWeakness ──────────────────────────────────────────
  {
    const weakHist = histRows(3, [false, false, false, false, true]); // 20% recent acc
    const sig = analyzeIntervalWeakness(
      weakHist,
      { 'interval:3': { ...newSrsItem('interval:3', T0), dueAt: T0 - 1000 } },
      T0,
    );
    check('analyzeIntervalWeakness flags a low-accuracy + overdue quality',
      sig.every((x: { semitones: number }) => x.semitones === 3) && sig[0].itemId === 'interval:3:calc:up' &&
      sig[0].reasons.includes('lowAccuracy') && sig[0].reasons.includes('overdue'));
    check('analyzeIntervalWeakness returns nothing for clean input',
      analyzeIntervalWeakness([], {}, T0).length === 0);

    const twoWeak = [...histRows(4, [false, false, false]), ...histRows(2, [false, false, false])];
    check('analyzeIntervalWeakness ties break on ascending semitone size',
      analyzeIntervalWeakness(twoWeak, {}, T0).map((s: { semitones: number }) => s.semitones).join(',') === '2,4');

    const staleHist = histRows(5, [false, false, false, false]).map((r) => ({
      ...r, createdAt: T0 - 400 * 24 * 60 * 60 * 1000,
    }));
    check('analyzeIntervalWeakness ignores history past the recency horizon',
      analyzeIntervalWeakness(staleHist, {}, T0).length === 0);

    // Decay + the effectiveN >= 4 gate. `[f,f,f,f,t,t,t,t]` (misses first, hits
    // last) ⇒ recent-mistakes never fires (last 4 are all correct), so the only
    // possible reason is lowAccuracy. Fresh: effectiveN ≈ 8, accuracy 0.5 ⇒
    // flagged. Aged 30 days: each weight ≈ 0.5**(30/14) ≈ 0.23, effectiveN
    // ≈ 1.8 < 4 ⇒ the weighted accuracy is no longer trusted and the signal
    // drops out entirely.
    const split = [false, false, false, false, true, true, true, true];
    const fresh8 = histRows(6, split);
    check('analyzeIntervalWeakness flags a low weighted-accuracy quality (fresh, effectiveN clears 4)',
      analyzeIntervalWeakness(fresh8, {}, T0)
        .some((s: { semitones: number; reasons: string[] }) =>
          s.semitones === 6 && s.reasons.includes('lowAccuracy') && !s.reasons.includes('recentMistakes')));
    const aged8 = fresh8.map((r) => ({ ...r, createdAt: r.createdAt - 30 * 24 * 60 * 60 * 1000 }));
    check('analyzeIntervalWeakness drops that quality once the same answers age below the gate',
      analyzeIntervalWeakness(aged8, {}, T0).length === 0);
  }

  // ── buildIntervalDailyPlan ──────────────────────────────────────────
  {
    // Fresh learner: no SRS, no history → current group 0 ('perfect').
    const fresh = buildIntervalDailyPlan(plannerBase);
    check('daily plan for a fresh learner drills the current group (P4+P5), pool non-empty',
      fresh.drill.interval!.semitones.length > 0 &&
      [...fresh.drill.interval!.semitones].sort((a: number, b: number) => a - b).join(',') === '5,7' &&
      fresh.items.every((i: { bucket: string }) => i.bucket === 'group') &&
      fresh.rationale.groupId === 'perfect');
    check('daily plan carries the interval spec (exercise, both directions, no candidates)',
      fresh.drill.interval!.direction === 'both' &&
      fresh.drill.interval!.exercise === 'findTargetNote' &&
      fresh.drill.mode === 'byFret' &&
      fresh.drill.candidates === undefined);
    check('every pool size is a valid interval id and never a note id',
      fresh.drill.interval!.semitones.every((s: number) =>
        parseIntervalItemId(intervalItemId(s)) === s && parseNoteItemId(intervalItemId(s)) === null));

    // Overdue quality is moved to the very front.
    const overdue = buildIntervalDailyPlan({
      ...plannerBase,
      intervalSrs: { 'interval:9': { ...newSrsItem('interval:9', T0), dueAt: T0 - 10_000 } },
    });
    check('daily plan puts an overdue quality first (bucket "overdue")',
      overdue.drill.interval!.semitones[0] === 9 && overdue.items[0].bucket === 'overdue');

    // Weak quality lands after overdue, before the current-group picks.
    const ranked = buildIntervalDailyPlan({
      ...plannerBase,
      intervalSrs: { 'interval:9': { ...newSrsItem('interval:9', T0), dueAt: T0 - 10_000 } },
      history: histRows(3, [false, false, false, false, true]),
    });
    check('daily plan order is overdue → weak → current group',
      ranked.drill.interval!.semitones.join(',') === '9,3,5,7' &&
      ranked.items[1].semitones === 3 && ranked.items[1].bucket === 'weak' &&
      ranked.items[1].reasons.includes('lowAccuracy'));

    // Advancing the curriculum group is derived from mastery, never stored.
    const g1 = buildIntervalDailyPlan({ ...plannerBase, intervalSrs: mastered([5, 7]) });
    check('mastering P4+P5 advances the plan to the "thirds" group (only m3, M3 are "new")',
      g1.rationale.groupId === 'thirds' &&
      g1.drill.interval!.semitones.includes(3) && g1.drill.interval!.semitones.includes(4) &&
      g1.items.filter((i: { bucket: string }) => i.bucket === 'group')
        .map((i: { semitones: number }) => i.semitones).sort((a: number, b: number) => a - b).join(',') === '3,4');
    check('confuser injection completes the M3↔P4 pair (P4 pulled in for the thirds group)',
      g1.drill.interval!.semitones.includes(5) &&
      g1.items.find((i: { semitones: number }) => i.semitones === 5)!.bucket === 'confuser' &&
      g1.rationale.confuser === 1);

    // Everything mastered → group 'all', pool still full from consolidation.
    const allDone = buildIntervalDailyPlan({
      ...plannerBase,
      intervalSrs: mastered([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
    });
    check('all mastered → groupId "all", pool still non-empty via consolidation',
      allDone.rationale.groupId === 'all' &&
      allDone.drill.interval!.semitones.length > 0 &&
      allDone.items.every((i: { bucket: string }) => i.bucket === 'consolidation'));
  }

  // ── buildIntervalWeakSpotsPlan ─────────────────────────────────────
  {
    const ws = buildIntervalWeakSpotsPlan({
      ...plannerBase,
      intervalSrs: { 'interval:9': { ...newSrsItem('interval:9', T0), dueAt: T0 - 5000 } },
      history: histRows(3, [false, false, false, false, true]),
    });
    check('weak-spots plan is overdue ∪ weak only — no group / confuser / consolidation / coverage',
      ws != null &&
      ws.kind === 'weakSpots' &&
      ws.drill.interval!.semitones[0] === 9 &&
      [...ws.drill.interval!.semitones].sort((a: number, b: number) => a - b).join(',') === '3,9' &&
      ws.items.every((i: { bucket: string }) => i.bucket === 'overdue' || i.bucket === 'weak') &&
      ws.rationale.group === 0 && ws.rationale.confuser === 0 &&
      ws.rationale.consolidation === 0 && ws.rationale.coverage === 0);

    check('weak-spots plan is null when nothing is overdue or weak',
      buildIntervalWeakSpotsPlan(plannerBase) === null &&
      buildIntervalWeakSpotsPlan({ ...plannerBase, intervalSrs: mastered([5, 7]) }) === null);
  }
}

// ── Interval difficulty model (spec §9, task T7) ────────────────────
{
  const { INTERVAL_CURRICULUM } =
    await import('../src/learning/intervalCurriculum.ts');
  const thirds = INTERVAL_CURRICULUM[1]; // introduces [3,4]; confusers [3,4],[4,5]

  // §9.3 envelope values, per tier.
  const f = intervalDifficulty('focused', [3, 4], thirds, new Set());
  const m = intervalDifficulty('mixed', [3, 4, 5, 7], thirds, new Set());
  const fu = intervalDifficulty('full', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], thirds, new Set());
  check('focused envelope = 12 questions / 9 s / 3 options (§9.3)',
    f.questionCount === 12 && f.timeLimit === 9 && f.optionCount === 3);
  check('mixed envelope = 15 questions / 8 s / 5 options (§9.3)',
    m.questionCount === 15 && m.timeLimit === 8 && m.optionCount === 5);
  check('full envelope = 18 questions / 7 s / 6 options (§9.3)',
    fu.questionCount === 18 && fu.timeLimit === 7 && fu.optionCount === 6);

  // focused, called directly with not-yet-mastered sizes → ascending-only,
  // naturals bias, no near confuser (spec §9.2 / §22.3 — checked directly here,
  // NOT via the planner).
  check('focused + all-brand-new sizes → direction "up", naturals bias, avoidNear',
    f.direction === 'up' &&
    f.firstNoteBias === 'naturals' &&
    f.registerSpread === 'narrow' &&
    f.optionPolicy === 'avoidNear' &&
    f.confuserPairs.length === 0);
  check('focused with one size already mastered → direction folds back to "both"',
    intervalDifficulty('focused', [3, 4], thirds, new Set([3])).direction === 'both');
  check('focused with an empty pool stays "both" (no sizes to be "brand-new")',
    intervalDifficulty('focused', [], thirds, new Set()).direction === 'both');

  // mixed / full: any first note, both directions, and the current group's
  // in-pool confuser pairs are completed among the options.
  check('mixed → both directions, any first note, medium register',
    m.direction === 'both' && m.firstNoteBias === 'any' &&
    m.registerSpread === 'medium' && m.optionPolicy === 'default');
  const normPairs = (ps: [number, number][]) =>
    ps.map(([a, b]) => (a <= b ? [a, b] : [b, a]))
      .sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  check('mixed completes the current group\'s in-pool confuser pairs (order-insensitive)',
    JSON.stringify(normPairs(m.confuserPairs)) === JSON.stringify([[3, 4], [4, 5]]));
  check('a confuser pair with only one member in the pool is NOT forced',
    intervalDifficulty('mixed', [3, 4], thirds, new Set()).confuserPairs
      .every(([a, b]: [number, number]) => a !== 5 && b !== 5));
  check('full → allNear option policy, wide register, both directions',
    fu.optionPolicy === 'allNear' && fu.registerSpread === 'wide' && fu.direction === 'both');
  check('no group context → no confuser pairs, envelope still valid',
    intervalDifficulty('mixed', [3, 4, 5], null, new Set()).confuserPairs.length === 0);

  // The shaped chip-row builders honour the rules.
  {
    // avoidNear: no distractor within 1 semitone of the answer (semitone form).
    let bad = false;
    for (let i = 0; i < 40; i++) {
      const opts = buildIntervalOptionSemitones(4, [3, 4, 5], 5, { avoidNear: true });
      if (opts.length !== 5 || !opts.includes(4) ||
          opts.some((s: number) => s !== 4 && Math.abs(s - 4) <= 1)) { bad = true; break; }
    }
    check('buildIntervalOptionSemitones avoidNear: 5 chips, incl. answer, no near size', !bad);
  }
  check('buildIntervalOptionSemitones pairs: the confuser partner is forced in',
    buildIntervalOptionSemitones(4, ALL_INTERVAL_SEMITONES, 4, { pairs: [[4, 5]] }).includes(5));
  check('buildIntervalOptionSemitones forceNear: both nearest neighbours forced in',
    (() => {
      const o = buildIntervalOptionSemitones(4, [4], 4, { forceNear: true });
      return o.includes(3) && o.includes(5) && o.includes(4);
    })());
  check('buildTargetNoteOptions pairs: the confuser partner\'s target note is forced in',
    buildTargetNoteOptions('G', noteNameAtSemitones('G', 4), [4], 1, 4, { pairs: [[4, 5]] }, 4)
      .includes(noteNameAtSemitones('G', 5)));
  check('buildTargetNoteOptions still returns `count` distinct notes incl. the target under avoidNear',
    (() => {
      const t = noteNameAtSemitones('G', 4);
      const o = buildTargetNoteOptions('G', t, [3, 4, 5], 1, 3, { avoidNear: true }, 4);
      return o.length === 3 && new Set(o).size === 3 && o.includes(t);
    })());

  // A guided plan still comes out mixed + both (the existing assertion above at
  // "daily plan carries the interval spec … both directions" is unchanged); the
  // planner never emits focused / full.
  {
    const { buildIntervalDailyPlan } =
      await import('../src/learning/intervalPlanner.ts');
    const plan = buildIntervalDailyPlan({
      intervalSrs: {}, history: [], now: T0,
      maxFret: guitar.maxFret, allStrings: [1, 2, 3, 4, 5, 6],
      accidental: 'sharps', order: 'fifths', exercise: 'findTargetNote',
    });
    check('guided plan carries the mixed envelope (5 options, medium register, both dirs)',
      plan.drill.interval!.optionCount === 5 &&
      plan.drill.interval!.registerSpread === 'medium' &&
      plan.drill.interval!.optionPolicy === 'default' &&
      plan.drill.interval!.direction === 'both' &&
      plan.drill.questionCount === 15 && plan.drill.timeLimit === 8);
  }
}

// ── §22 separation invariants (task T12) ───────────────────────────────
// The whole point of the domain split (spec §0 / §22.1): an interval answer
// never reaches the note schedule / goal / path, a note answer never reaches
// the interval schedule / goal / history, the two id spaces never collide,
// nothing under src/game/** and the interval learning modules import each
// other, and no stars / checkpoint / ladder vocabulary leaks into an interval
// module. Runtime-only points (§22.1.8) are covered here by a source-shape
// proxy — the full behaviour stays on the §22.2 manual checklist.
{
  const stripComments = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

  // §22.1.1 — recordIntervalAnswer mutates ONLY intervalSrs; the note srs /
  // daily / path (and the interval goal / history) stay reference-identical —
  // the reducer must not even rebuild them.
  {
    const st0 = emptyInstrumentState(T0);
    const st1 = recordIntervalAnswer(st0, 'interval:4', true, T0 + 1000);
    check('§22.1 recordIntervalAnswer leaves note srs / daily / path reference-identical',
      st1.srs === st0.srs && st1.daily === st0.daily && st1.path === st0.path);
    check('§22.1 recordIntervalAnswer changes intervalSrs and nothing else in the interval lane',
      st1.intervalSrs !== st0.intervalSrs &&
      Object.keys(st1.intervalSrs).length === 1 &&
      st1.intervalDaily === st0.intervalDaily &&
      st1.intervalHistory === st0.intervalHistory);
  }

  // §22.1.2 — recordTeacherAnswer / recordPracticeAnswer leave intervalSrs,
  // intervalDaily and intervalHistory byte-identical.
  {
    const seeded = recordIntervalAnswer(emptyInstrumentState(T0), 'interval:7', true, T0);
    const base = {
      ...emptyInstrumentState(T0),
      intervalSrs: seeded.intervalSrs,
      intervalDaily: { dateISO: '2026-09-06', target: 10, completed: 3 },
      intervalHistory: [
        { semitones: 7, dir: 'up' as const, form: 'findNote' as const, correct: true, seconds: 1.2, createdAt: T0 },
      ],
    };
    const afterTeacher = recordTeacherAnswer(base, { string: 6, fret: 3 }, true, T0 + 1000);
    const afterPractice = recordPracticeAnswer(base, { string: 5, fret: 2 }, false, T0 + 2000);
    check('§22.2 recordTeacherAnswer keeps intervalSrs / intervalDaily / intervalHistory reference-identical',
      afterTeacher.intervalSrs === base.intervalSrs &&
      afterTeacher.intervalDaily === base.intervalDaily &&
      afterTeacher.intervalHistory === base.intervalHistory);
    check('§22.2 recordPracticeAnswer keeps intervalSrs / intervalDaily / intervalHistory reference-identical',
      afterPractice.intervalSrs === base.intervalSrs &&
      afterPractice.intervalDaily === base.intervalDaily &&
      afterPractice.intervalHistory === base.intervalHistory);
  }

  // §22.1.3 — the two id spaces never collide. Build a realistic mixed state
  // from real recorded answers, then sweep both maps.
  {
    let st = emptyInstrumentState(T0);
    st = recordTeacherAnswer(st, { string: 6, fret: 3 }, true, T0 + 1000);
    st = recordTeacherAnswer(st, { string: 4, fret: 7 }, false, T0 + 2000);
    st = recordIntervalAnswer(st, 'interval:4', true, T0 + 3000);
    st = recordIntervalAnswer(st, 'interval:9', false, T0 + 4000);
    check('§22.3 no id in the note srs map parses as an interval id',
      Object.keys(st.srs).length === 2 &&
      Object.keys(st.srs).every((id) => !isIntervalItemId(id) && parseNoteItemId(id) !== null));
    check('§22.3 no id in intervalSrs parses as a note id',
      Object.keys(st.intervalSrs).length === 2 &&
      Object.keys(st.intervalSrs).every((id) => isIntervalItemId(id) && parseNoteItemId(id) === null));
  }

  // §22.1.6 — a pre-0015 blob round-trips through the TOP-LEVEL
  // normalizeLearningState → mergeLearningState: note srs / daily / path /
  // intervalSrs intact, the two new interval fields defaulted empty, and still
  // no intervalPath field.
  {
    const legacyBlob = {
      version: 1,
      instruments: {
        guitar: {
          srs: { '6:3': { bucket: 2, dueAt: T0, lastReviewedAt: T0, reps: 4, lapses: 1 } },
          intervalSrs: { 'interval:4': { bucket: 3, dueAt: T0, lastReviewedAt: T0, reps: 5, lapses: 0 } },
          daily: { dateISO: '2026-09-01', target: 12, completed: 7 },
          path: { bestStars: { 'open-naturals': 3 }, updatedAt: 'x' },
          lastAnswerAt: T0,
          updatedAt: new Date(T0).toISOString(),
        },
      },
    };
    const norm = normalizeLearningState(JSON.parse(JSON.stringify(legacyBlob)), T0 + 1000);
    const g = norm.instruments.guitar;
    check('§22.6 pre-0015 blob: note srs / daily / path / intervalSrs survive normalizeLearningState',
      g.srs['6:3'].bucket === 2 &&
      g.daily.completed === 7 && g.daily.target === 12 &&
      g.path.bestStars['open-naturals'] === 3 &&
      g.intervalSrs['interval:4'].bucket === 3);
    check('§22.6 pre-0015 blob: intervalDaily / intervalHistory default empty',
      g.intervalDaily.completed === 0 &&
      g.intervalDaily.target === DEFAULT_INTERVAL_DAILY_TARGET &&
      g.intervalHistory.length === 0);
    const remerged = mergeLearningState(
      norm,
      normalizeLearningState(JSON.parse(JSON.stringify(legacyBlob)), T0 + 2000),
    );
    const mg = remerged.instruments.guitar;
    check('§22.6 pre-0015 blob: mergeLearningState keeps the note fields, still no intervalPath',
      mg.srs['6:3'].bucket === 2 && mg.daily.completed === 7 &&
      mg.path.bestStars['open-naturals'] === 3 &&
      mg.intervalHistory.length === 0 && !('intervalPath' in mg));
  }

  // §22.1.7 — mergeInstrumentState merges intervalDaily (mergeDailyGoal) and
  // intervalHistory (concat-dedupe-cap) and never grows an intervalPath field.
  {
    const devA = {
      ...emptyInstrumentState(T0),
      intervalDaily: { dateISO: '2026-09-07', target: 10, completed: 5 },
      intervalHistory: [{ semitones: 4, dir: 'up' as const, form: 'findNote' as const, correct: true, seconds: 1, createdAt: T0 + 10 }],
    };
    const devB = {
      ...emptyInstrumentState(T0),
      intervalDaily: { dateISO: '2026-09-07', target: 10, completed: 2 },
      intervalHistory: [{ semitones: 7, dir: 'down' as const, form: 'identify' as const, correct: false, seconds: 2, createdAt: T0 + 5 }],
    };
    const m = mergeInstrumentState(devA, devB);
    check('§22.7 mergeInstrumentState keeps the higher same-day intervalDaily and unions intervalHistory',
      m.intervalDaily.completed === 5 && m.intervalHistory.length === 2 &&
      m.intervalHistory[0].createdAt === T0 + 5);
    check('§22.7 mergeInstrumentState never creates an intervalPath field',
      !('intervalPath' in m));
  }

  // §22.1.9 — no src/game/** file imports learning/interval*, and no
  // learning/interval* file imports from src/game/**.
  {
    const gameDir = new URL('../src/game/', import.meta.url);
    const gameHits = readdirSync(gameDir)
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /\bfrom\s+['"][^'"]*learning\/interval/i.test(
        stripComments(readFileSync(new URL(f, gameDir), 'utf8'))));
    check('§22.9 no src/game/** file imports learning/interval*', gameHits.length === 0,
      gameHits.join(', '));

    const learnDir = new URL('../src/learning/', import.meta.url);
    const learnHits = readdirSync(learnDir)
      .filter((f) => /interval/i.test(f) && /\.(ts|tsx)$/.test(f))
      .filter((f) => /\bfrom\s+['"][^'"]*\bgame\//i.test(
        stripComments(readFileSync(new URL(f, learnDir), 'utf8'))));
    check('§22.9 no learning/interval* file imports from src/game/**', learnHits.length === 0,
      learnHits.join(', '));
  }

  // §22.1.10 — no stars / checkpoint / ladder vocabulary in ANY *interval*
  // source file (generalises the intervalMastery.ts scan above). Comments are
  // stripped first: several interval files carry prose that names these
  // concepts only to declare their absence.
  {
    const roots = ['../src/learning/', '../src/components/', '../src/hooks/', '../src/utils/'];
    const banned = ['evaluateStars', 'StarRating', 'bestStars', 'bestPct', 'checkpoint', '★'];
    const offenders: string[] = [];
    for (const rel of roots) {
      const dir = new URL(rel, import.meta.url);
      for (const f of readdirSync(dir)) {
        if (!/interval/i.test(f) || !/\.(ts|tsx)$/.test(f)) continue;
        const code = stripComments(readFileSync(new URL(f, dir), 'utf8'));
        for (const w of banned) if (code.includes(w)) offenders.push(`${f}:${w}`);
      }
    }
    check('§22.10 no *interval* source file carries stars / checkpoint vocabulary in code',
      offenders.length === 0, offenders.join(', '));
  }

  // §22.1.8 — an interval run suppresses the personal-best write, the badge
  // sweep and the leaderboard upsert. Headless proxy: the guard expressions
  // are present in the round lifecycle / round-end-celebration hooks (the
  // runtime behaviour is on the §22.2 manual list). These guards used to live
  // inline in App.tsx; the decomposition of App.tsx into concern hooks moved
  // them into src/hooks/useRoundLifecycle.ts (the beginRun call) and
  // src/hooks/useRoundEndCelebrations.ts (beginRun + the game-end effect),
  // with the invariant itself unchanged.
  {
    const celebrations = stripComments(
      readFileSync(new URL('../src/hooks/useRoundEndCelebrations.ts', import.meta.url), 'utf8'));
    const lifecycle = stripComments(
      readFileSync(new URL('../src/hooks/useRoundLifecycle.ts', import.meta.url), 'utf8'));

    check('§22.8 the end-of-run badge sweep is skipped on an interval run',
      /const sweepBadges =/.test(celebrations) &&
      /!wasIntervalRunRef\.current[\s\S]{0,200}sweepBadges\(/.test(celebrations));
    check('§22.8 the leaderboard upsert early-returns on an interval run',
      /if \(wasIntervalRunRef\.current\) return;/.test(celebrations) &&
      /upsertMyEntry\(/.test(celebrations));
    check('§22.8 an interval run also counts as a teacher run, so the personal-best write is gated out',
      // start() flags the run as "teacher" for either a Teacher or an interval plan…
      /celebrationsBeginRunRef\.current\(\s*teacherPlan !== null \|\| intervalPlan !== null,\s*intervalPlan !== null,/.test(lifecycle) &&
      // …beginRun records that onto wasTeacherRunRef / wasIntervalRunRef…
      /wasTeacherRunRef\.current = isTeacher/.test(celebrations) &&
      /wasIntervalRunRef\.current = isInterval/.test(celebrations) &&
      // …and the personal-best write is gated on !wasTeacherRunRef.current.
      /!wasTeacherRunRef\.current[\s\S]{0,600}saveBest\(histKey/.test(celebrations));
  }
}

// ── Skill × direction split (ear / calc / neck, up / down) ────────────
{
  const {
    intervalSkillItemId, parseIntervalId, isLegacyIntervalItemId, skillOfForm,
    seedLegacyIntervalSrs, INTERVAL_SKILLS, INTERVAL_DIRS,
  } = await import('../src/learning/intervalItem.ts');
  const { buildIntervalBoard, intervalSkillStatus, masteredSizes } =
    await import('../src/learning/intervalMastery.ts');
  const { analyzeIntervalWeakness } = await import('../src/learning/intervalWeakness.ts');
  const { buildIntervalDailyPlan } = await import('../src/learning/intervalPlanner.ts');
  const { mergeSrsMaps } = await import('../src/learning/srs.ts');

  // id round-trip, all 66 fine ids + legacy
  let rt = true;
  for (const n of ALL_INTERVAL_SEMITONES) for (const k of INTERVAL_SKILLS) for (const d of INTERVAL_DIRS) {
    const q = parseIntervalId(intervalSkillItemId(n, k, d));
    if (!q || q.semitones !== n || q.skill !== k || q.dir !== d) rt = false;
    if (parseIntervalItemId(intervalSkillItemId(n, k, d)) !== n) rt = false;
  }
  check('fine interval id round-trips for 11 x 3 x 2', rt);
  check('legacy id still parses and is flagged legacy',
    parseIntervalItemId('interval:4') === 4 && isLegacyIntervalItemId('interval:4') &&
    !isLegacyIntervalItemId('interval:4:ear:up'));
  check('malformed fine ids are rejected',
    parseIntervalId('interval:4:eye:up') === null && parseIntervalId('interval:4:ear') === null &&
    parseIntervalId('interval:12:ear:up') === null && parseIntervalId('interval:0') === null);
  check('forms map to skills',
    skillOfForm('identify') === 'ear' && skillOfForm('findNote') === 'calc' && skillOfForm('findPosition') === 'neck');
  check('fine ids never parse as a note id', parseNoteItemId('interval:4:ear:up') === null);

  // a guided answer writes the fine row AND the legacy aggregate
  const ans = (form: 'identify' | 'findNote' | 'findPosition', dir: 'up' | 'down', correct: boolean) =>
    ({ itemId: 'interval:4', semitones: 4, dir, form, correct, seconds: 2 });
  const st = recordIntervalTeacherAnswer(emptyInstrumentState(T0), ans('identify', 'down', true), T0 + 1000);
  check('answer writes fine + legacy rows',
    st.intervalSrs['interval:4:ear:down']?.reps === 1 && st.intervalSrs['interval:4']?.reps === 1 &&
    st.intervalSrs['interval:4:calc:down'] === undefined);

  // old blob (legacy only) + new blob (fine + legacy) from two devices merge without loss
  const legacyOnly = { 'interval:4': { ...newSrsItem('interval:4', T0), bucket: 4, reps: 9, lastReviewedAt: T0 + 10 } };
  const oldDev = { ...emptyInstrumentState(T0), intervalSrs: legacyOnly };
  const m1 = mergeInstrumentState(oldDev, st);
  const m2 = mergeInstrumentState(st, oldDev);
  check('old+new blobs merge: every key from both survives',
    m1.intervalSrs['interval:4:ear:down'] != null && m1.intervalSrs['interval:4'] != null &&
    m1.intervalSrs['interval:4'].reps === 9);
  check('merge is commutative and idempotent',
    JSON.stringify(mergeSrsMaps(m1.intervalSrs, m1.intervalSrs)) === JSON.stringify(m1.intervalSrs) &&
    JSON.stringify(m1.intervalSrs) === JSON.stringify(m2.intervalSrs));
  const roundTrip = normalizeInstrumentState(JSON.parse(JSON.stringify(m1)), T0);
  check('fine keys survive normalise (cloud round-trip)',
    roundTrip.intervalSrs['interval:4:ear:down'] != null);

  // old-key migration: seeds fine ids, capped below mastery, never stored
  const seeded = seedLegacyIntervalSrs(legacyOnly);
  check('legacy row seeds all 6 fine ids, bucket capped at 2',
    Object.keys(seeded).length === 7 && seeded['interval:4:neck:up'].bucket === 2 &&
    seeded['interval:4'].bucket === 4);
  check('seeding does not mutate the stored map and a stored fine row wins',
    Object.keys(legacyOnly).length === 1 &&
    seedLegacyIntervalSrs({ ...legacyOnly, 'interval:4:ear:up': { ...newSrsItem('interval:4:ear:up', T0), bucket: 0 } })['interval:4:ear:up'].bucket === 0);

  // board: mastered only per skill
  type Row = { semitones: number; dir: 'up' | 'down'; form: 'identify' | 'findNote' | 'findPosition'; correct: boolean; seconds: number; createdAt: number };
  const mk = (n: number, form: Row['form'], dir: Row['dir'], correct: boolean, i: number): Row =>
    ({ semitones: n, dir, form, correct, seconds: 2, createdAt: T0 - i * 60_000 });
  const hist: Row[] = [];
  for (let i = 0; i < 8; i++) { hist.push(mk(4, 'findNote', 'up', true, i)); hist.push(mk(4, 'findNote', 'down', true, i + 20)); }
  for (let i = 0; i < 8; i++) hist.push(mk(4, 'identify', 'down', i % 2 === 0, i + 40));
  const srs: Record<string, ReturnType<typeof newSrsItem>> = {};
  for (const k of INTERVAL_SKILLS) for (const d of INTERVAL_DIRS) {
    const id = intervalSkillItemId(4, k, d);
    srs[id] = { ...newSrsItem(id, T0), bucket: 3, lastReviewedAt: T0, dueAt: T0 + 1e9 };
  }
  const board = buildIntervalBoard({ intervalSrs: srs, historyRows: hist, now: T0 });
  const row = board.find((r: { semitones: number }) => r.semitones === 4)!;
  check('board has 11 rows, each with ear/calc/neck', board.length === 11 &&
    board.every((r: { skills: object }) => INTERVAL_SKILLS.every((k: string) => k in r.skills)));
  check('calc mastered both directions', row.skills.calc.status === 'mastered' && row.skills.calc.bothDirs);
  check('ear (descending shaky) is NOT mastered', row.skills.ear.status === 'learning' && row.skills.ear.down === 'learning');
  check('row is not "mastered" while ear is not', row.status === 'learning');
  const hist2 = hist.filter((r) => r.form !== 'identify');
  for (let i = 0; i < 8; i++) for (const d of INTERVAL_DIRS) for (const f of ['identify', 'findPosition'] as const) hist2.push(mk(4, f, d, true, i + 60));
  check('row is mastered only when all three skills are',
    buildIntervalBoard({ intervalSrs: srs, historyRows: hist2, now: T0 }).find((r: { semitones: number }) => r.semitones === 4)!.status === 'mastered');
  check('untouched quality is notStarted in every skill',
    board.find((r: { semitones: number }) => r.semitones === 9)!.status === 'notStarted');
  check('legacy-only data never reads as mastered by a skill',
    intervalSkillStatus(4, 'ear', legacyOnly, [], T0).status === 'learning');
  check('progression stays pooled for a legacy-only quality',
    masteredSizes({ 'interval:4': { ...newSrsItem('interval:4', T0), bucket: 3 } }, [], T0).has(4));

  // weakness / planner see "ear is weak for M3 down"
  const earHist: Row[] = [];
  for (let i = 0; i < 8; i++) earHist.push(mk(4, 'identify', 'down', false, i));
  for (let i = 0; i < 8; i++) earHist.push(mk(4, 'findNote', 'down', true, i));
  const sig = analyzeIntervalWeakness(earHist, {}, T0);
  check('weakness is per skill+dir (ear down flagged, calc down not)',
    sig.some((x: { itemId: string }) => x.itemId === 'interval:4:ear:down') &&
    !sig.some((x: { itemId: string }) => x.itemId === 'interval:4:calc:down'));
  check('weakness can be filtered to one skill',
    analyzeIntervalWeakness(earHist, {}, T0, 'calc').length === 0);
  const planBase = { intervalSrs: {}, history: earHist, now: T0, maxFret: 12,
    allStrings: [1, 2, 3, 4, 5, 6], accidental: 'both', order: 'cof' };
  const earPlan = buildIntervalDailyPlan({ ...planBase, exercise: 'identifyInterval' } as never);
  const calcPlan = buildIntervalDailyPlan({ ...planBase, exercise: 'findTargetNote' } as never);
  const e4 = earPlan.items.find((i: { semitones: number }) => i.semitones === 4);
  check('ear session picks M3 as weak, down direction',
    e4?.bucket === 'weak' && e4.skill === 'ear' && e4.weakDirs.join() === 'down');
  check('calc session does not call M3 weak',
    calcPlan.items.find((i: { semitones: number }) => i.semitones === 4)?.bucket !== 'weak');
}

console.log(failures === 0 ? '\nAll interval checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
