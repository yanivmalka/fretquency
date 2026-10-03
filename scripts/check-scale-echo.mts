// Focused checks for Scales "I play, you play it back" (call and response by
// ear) — the phrase generator and growth rule (src/learning/scaleEcho.ts) and
// the `echo` history form (src/learning/learningState.ts).
//
//   node --experimental-strip-types scripts/check-scale-echo.mts
//
// Covers:
//   • the box ladder: one note per pitch, low to high, the thicker string kept
//   • every phrase starts on the question's root, has the asked length (2–4),
//     stays in the box, never repeats a note straight away, and moves one or
//     two notes of the box at a time — mostly one
//   • the board: the box unchanged (same section, every tile's pitch), the
//     phrase as the run, every run tile on the board with its own pitch; dim
//     lights only the tonic (Recall level 1)
//   • the judge: a 2–4-note phrase with any slip is a miss (`isScaleCorrect`)
//   • growth: two clean phrases add a note, a miss takes one off, 2…4
//   • SRS: the first length from the box's bucket; the box drawn by weight
//   • `echo` rows survive record / normalise / merge, same item id as the box
//   • echo rows never review the box's SRS, master it, or rank its weakness

import { register } from 'node:module';

register(
  'data:text/javascript,' + encodeURIComponent(
    "export async function resolve(s,c,n){" +
    "if((s.startsWith('./')||s.startsWith('../'))&&!/\\.(m?ts|m?js|json|node)$/i.test(s)){" +
    "try{return await n(s+'.ts',c);}catch{}}" +
    "return n(s,c);}" +
    "export async function load(u,c,n){" +
    "const r=await n(u,c);" +
    "const s=r.source==null?null:r.source.toString();" +
    "if(s!==null&&s.includes('import.meta.env')){" +
    "return {...r, source: s.split('import.meta.env').join('({BASE_URL:\"/\"})')};" +
    "}return r;}",
  ),
  import.meta.url,
);

const { buildScalePool, pickScaleQuestion } = await import('../src/learning/scaleDrill.ts');
const { midiAt, isScaleCorrect } = await import('../src/learning/scaleFall.ts');
const { buildOrderBoard, tileKey } = await import('../src/learning/scaleOrder.ts');
const {
  boxLadder, echoFragment, echoBoard, nextEchoLength, echoStartLength, pickEchoItem, echoItemWeight,
  clampEchoLength, ECHO_MIN_LENGTH, ECHO_MAX_LENGTH, ECHO_GROW_AFTER, ECHO_LONGER_START_BUCKET,
} = await import('../src/learning/scaleEcho.ts');
const { recordScaleAnswer, normalizeScaleHistory, mergeScaleHistory, getInstrumentState, loadLearningState } =
  await import('../src/learning/learningState.ts');
const { isScaleMastered, scaleStatus } = await import('../src/learning/scaleMastery.ts');
const { analyzeScaleWeakness } = await import('../src/learning/scaleWeakness.ts');
const { SCALE_TYPES } = await import('../src/utils/scales.ts');
const { INSTRUMENTS } = await import('../src/utils/instruments.ts');

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

console.log('box ladder');
{
  const inst = INSTRUMENTS.guitar;
  const pool = buildScalePool(SCALE_TYPES.map((s) => s.id), inst.stringCount);
  const rng = seeded(3);
  let bad = '';
  for (let n = 0; n < 500 && !bad; n++) {
    const q = pickScaleQuestion(pool, inst.notes, inst.stringCount, inst.maxFret, rng, false, 'up');
    if (!q) { bad = 'no question'; break; }
    const ladder = boxLadder(q.shape, inst.openMidi);
    const pitches = new Set(q.shape.map((p) => midiAt(p, inst.openMidi)));
    if (ladder.length !== pitches.size) bad = 'not one note per pitch';
    for (let i = 1; i < ladder.length; i++) if (ladder[i].midi <= ladder[i - 1].midi) bad = 'not strictly low to high';
    for (const n2 of ladder) {
      if (midiAt(n2.pos, inst.openMidi) !== n2.midi) bad = 'a ladder tile has the wrong pitch';
      const thicker = q.shape.filter((p) => midiAt(p, inst.openMidi) === n2.midi).every((p) => p.string <= n2.pos.string);
      if (!thicker) bad = 'a pitch on two strings did not keep the thicker one';
    }
  }
  check('500 random boxes of every scale type', bad === '', bad);
}

console.log('phrases and boards');
let steps = 0;
let skips = 0;
for (const id of ['guitar', 'bass'] as const) {
  const inst = INSTRUMENTS[id];
  const pool = buildScalePool(SCALE_TYPES.map((s) => s.id), inst.stringCount);
  for (const dim of [false, true]) {
    const rng = seeded(id === 'guitar' ? 21 : 22);
    let bad = '';
    for (let n = 0; n < 600 && !bad; n++) {
      const q = pickScaleQuestion(pool, inst.notes, inst.stringCount, inst.maxFret, rng, false, 'up');
      if (!q) { bad = 'no question'; break; }
      const length = ECHO_MIN_LENGTH + (n % (ECHO_MAX_LENGTH - ECHO_MIN_LENGTH + 1));
      const b = echoBoard(q, inst.openMidi, length, dim, rng);
      const box = buildOrderBoard(q, inst.openMidi, dim ? 1 : 0);
      const ladder = boxLadder(q.shape, inst.openMidi);
      const rootMidi = midiAt({ string: q.rootString, fret: q.rootFret }, inst.openMidi);
      if (b.runMidi.length !== length) { bad = `asked ${length} notes, got ${b.runMidi.length}`; break; }
      if (b.runMidi[0] !== rootMidi) { bad = 'does not start on the root'; break; }
      if (b.run.length !== b.runMidi.length) { bad = 'run and runMidi differ in length'; break; }
      for (let i = 0; i < b.run.length; i++) {
        const k = tileKey(b.run[i]);
        if (b.tileMidi.get(k) !== b.runMidi[i]) { bad = 'a run tile is not on the board with its pitch'; break; }
        if (midiAt(b.run[i], inst.openMidi) !== b.runMidi[i]) { bad = 'run tile / pitch mismatch'; break; }
      }
      for (let i = 1; i < b.runMidi.length; i++) {
        if (b.runMidi[i] === b.runMidi[i - 1]) { bad = 'a note repeated straight away'; break; }
        const a = ladder.findIndex((x) => x.midi === b.runMidi[i - 1]);
        const c = ladder.findIndex((x) => x.midi === b.runMidi[i]);
        const move = Math.abs(c - a);
        if (a < 0 || c < 0 || move < 1 || move > 2) { bad = `a move of ${move} notes of the box`; break; }
        if (move === 1) steps++; else skips++;
      }
      if (b.fromFret !== box.fromFret || b.toFret !== box.toFret) { bad = 'the section changed'; break; }
      if (b.tileMidi.size !== box.tileMidi.size || [...box.tileMidi].some(([k, m]) => b.tileMidi.get(k) !== m)) {
        bad = 'a box tile lost its pitch'; break;
      }
      if (!dim && b.lit !== undefined) { bad = 'lit board should light every tile'; break; }
      if (dim) {
        const tonic = rootMidi % 12;
        const want = q.shape.filter((p) => midiAt(p, inst.openMidi) % 12 === tonic).map(tileKey);
        if (!b.lit || b.lit.size !== want.length || !want.every((k) => b.lit!.has(k))) { bad = 'dim must light exactly the tonic'; break; }
      }
    }
    check(`${id} ${dim ? 'dim' : 'lit'}: 600 phrases of 2–4 notes, every scale type`, bad === '', bad);
  }
}
check('mostly stepwise (≥ 70% of moves are one note of the box)', steps / (steps + skips) >= 0.7,
  `${steps} steps, ${skips} skips`);
check('skips do happen', skips > 0);
check('a one-note ladder gives a one-note phrase', echoFragment([{ pos: { string: 1, fret: 0 }, midi: 64 }], 0, 3).length === 1);
check('a bad start gives no phrase', echoFragment([{ pos: { string: 1, fret: 0 }, midi: 64 }], 4, 3).length === 0);
{
  // At the top of the box the phrase turns down instead of leaving it.
  const ladder = [60, 62, 64].map((midi, i) => ({ pos: { string: 1, fret: i * 2 }, midi }));
  let ok = true;
  const rng = seeded(5);
  for (let n = 0; n < 200; n++) {
    const f = echoFragment(ladder, 2, 4, rng);
    if (f.length !== 4 || f.some((x) => !ladder.includes(x))) ok = false;
  }
  check('starting at the top of a 3-note box still gives 4 notes inside it', ok);
}

console.log('judging a phrase (isScaleCorrect)');
for (let len = ECHO_MIN_LENGTH; len <= ECHO_MAX_LENGTH; len++) {
  check(`${len} notes: clean is correct, one slip is a miss`, isScaleCorrect(len, 0) && !isScaleCorrect(len, 1));
}

console.log('growth');
check('clamp 2…4', clampEchoLength(1) === 2 && clampEchoLength(9) === 4 && clampEchoLength(Number.NaN) === 2);
check(`ECHO_GROW_AFTER is 2`, ECHO_GROW_AFTER === 2);
let g = { length: 2, streak: 0 };
g = nextEchoLength(g, true, true);
check('one clean phrase: same length, streak 1', g.length === 2 && g.streak === 1);
g = nextEchoLength(g, true, true);
check('two clean phrases: a note longer, streak restarts', g.length === 3 && g.streak === 0);
g = nextEchoLength(nextEchoLength(g, true, true), true, true);
check('two more: 4 notes', g.length === 4);
g = nextEchoLength(nextEchoLength(g, true, true), true, true);
check('never past 4', g.length === 4);
g = nextEchoLength(g, false, false);
check('a miss: a note shorter', g.length === 3 && g.streak === 0);
g = nextEchoLength({ length: 3, streak: 1 }, false, true);
check('a slip that still passed: same length, streak restarts', g.length === 3 && g.streak === 0);
check('never under 2', nextEchoLength({ length: 2, streak: 0 }, false, false).length === 2);

console.log('SRS weighting');
const T = 1_800_000_000_000;
const item = 'scale:minorPentatonic:1';
const item2 = 'scale:minorPentatonic:2';
const srsItem = (bucket: number, dueAt: number) => ({ itemId: item, bucket, dueAt, lastReviewedAt: T - 1, reps: 3, lapses: 0 });
check('a new box starts at 2 notes', echoStartLength({}, item) === 2);
check('a shaky box starts at 2 notes', echoStartLength({ [item]: srsItem(ECHO_LONGER_START_BUCKET - 1, T) }, item) === 2);
check('a known box starts at 3 notes', echoStartLength({ [item]: srsItem(ECHO_LONGER_START_BUCKET, T) }, item) === 3);
check('weights: due 3, new 2, not due 1',
  echoItemWeight({ [item]: srsItem(1, T - 1) }, item, T) === 3
  && echoItemWeight({}, item, T) === 2
  && echoItemWeight({ [item]: srsItem(1, T + 1e9) }, item, T) === 1);
{
  const pool = [{ scaleTypeId: 'minorPentatonic', positionIndex: 1 }, { scaleTypeId: 'minorPentatonic', positionIndex: 2 }];
  const srs = { [item]: srsItem(1, T - 1), [item2]: { ...srsItem(1, T + 1e9), itemId: item2 } };
  const rng = seeded(9);
  let due = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) if (pickEchoItem(pool, srs, T, rng)?.positionIndex === 1) due++;
  check('the due box comes up ~3× as often as the not-due one', Math.abs(due / N - 0.75) < 0.03, `${due}/${N}`);
  check('empty pool → null', pickEchoItem([], srs, T) === null);
}

console.log('echo history form');
const fresh = getInstrumentState(loadLearningState(T), 'guitar', T);
let st = recordScaleAnswer(fresh, item, 'echo', true, 4, T);
const row = st.scaleHistory[st.scaleHistory.length - 1];
check('recordScaleAnswer stores an echo row on the box\'s own item', row.form === 'echo' && row.itemId === item);
check('an echo answer does not review the box in scaleSrs', st.scaleSrs[item] === undefined);
{
  // Only echo phrases, all clean: the box is still not mastered, so no path
  // step passes on ear practice alone. The same answers as orderScale runs do.
  let e = getInstrumentState(loadLearningState(T), 'guitar', T);
  let o = e;
  for (let i = 0; i < 8; i++) {
    e = recordScaleAnswer(e, item, 'echo', true, 4, T + i * 4000);
    o = recordScaleAnswer(o, item, 'orderScale', true, 4, T + i * 4000);
  }
  check('8 clean echo phrases do not master the box', !isScaleMastered(item, e.scaleSrs, e.scaleHistory, T + 40000));
  check('…and its status stays "not started"', scaleStatus(item, e.scaleSrs, e.scaleHistory, T + 40000) === 'notStarted');
  check('8 clean orderScale runs still do (unchanged)', isScaleMastered(item, o.scaleSrs, o.scaleHistory, T + 40000));
  check('echo rows are left out of weakness ranking',
    analyzeScaleWeakness(e.scaleHistory, e.scaleSrs, T + 40000).every((s) => s.itemId !== item));
}
st = recordScaleAnswer(st, item, 'echo', false, 6, T + 1);
check('a missed echo answer is kept as a miss', st.scaleHistory[st.scaleHistory.length - 1].correct === false);
const norm = normalizeScaleHistory([
  { itemId: item, form: 'echo', correct: true, seconds: 3, createdAt: T },
  { itemId: item, form: 'echo', correct: false, seconds: 3, createdAt: T + 1, recallLevel: 1 },
  { itemId: item, form: 'echoo', correct: true, seconds: 3, createdAt: T + 2 },
]);
check('normalise keeps echo rows', norm.filter((r) => r.form === 'echo').length === 2);
check('normalise strips a stray recall level from an echo row', norm.every((r) => r.recallLevel === undefined));
check('normalise still drops an unknown form', norm.length === 2);
const merged = mergeScaleHistory(norm, [{ itemId: item, form: 'echo', correct: true, seconds: 1, createdAt: T + 9 }]);
check('merge keeps both devices\' echo rows', merged.length === 3 && merged.every((r) => r.form === 'echo'));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall scale echo checks passed');
