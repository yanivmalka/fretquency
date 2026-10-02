// Focused checks for Scales Recall mode ("play the box from memory") —
// `buildOrderBoard`'s fade levels (src/learning/scaleOrder.ts), the
// `orderRecall` history form (src/learning/learningState.ts) and the auto
// level-up rule (src/learning/scaleRecall.ts).
//
//   node --experimental-strip-types scripts/check-scale-recall.mts
//
// Covers:
//   • level 0 draws every shape tile lit (no `lit` set — unchanged boards)
//   • level 1 lights exactly the tonic's tiles (every octave), level 2 none
//   • at every level the run and every tile's pitch are unchanged, so a dim
//     shape tile still answers its step (by tap or by pitch)
//   • `orderRecall` rows carry their level through record / normalise / merge,
//     and a level-less `orderRecall` row is dropped as malformed
//   • the level-up rule: N good runs in a row of one item, at the current
//     level, since the level was set; a miss, another level or an older run
//     don't count

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
const { midiAt } = await import('../src/learning/scaleFall.ts');
const { buildOrderBoard, tileKey } = await import('../src/learning/scaleOrder.ts');
const { recallFormFor, recallStreak, recallPromotion, RECALL_PROMOTE_RUNS } = await import('../src/learning/scaleRecall.ts');
const { recordScaleAnswer, normalizeScaleHistory, mergeScaleHistory, getInstrumentState, loadLearningState } =
  await import('../src/learning/learningState.ts');
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

console.log('board fade levels');
for (const id of ['guitar', 'bass'] as const) {
  const inst = INSTRUMENTS[id];
  for (const dir of ['up', 'down'] as const) {
    const pool = buildScalePool(['minorPentatonic', 'major', 'blues'], inst.stringCount);
    const rng = seeded(11);
    let bad = '';
    for (let n = 0; n < 300 && !bad; n++) {
      const q = pickScaleQuestion(pool, inst.notes, inst.stringCount, inst.maxFret, rng, false, dir);
      if (!q) { bad = 'no question'; break; }
      const b0 = buildOrderBoard(q, inst.openMidi);
      const b0x = buildOrderBoard(q, inst.openMidi, 0);
      const b1 = buildOrderBoard(q, inst.openMidi, 1);
      const b2 = buildOrderBoard(q, inst.openMidi, 2);
      if (b0.lit !== undefined || b0x.lit !== undefined) { bad = 'level 0 should leave every tile lit'; break; }
      const tonicClass = midiAt({ string: q.rootString, fret: q.rootFret }, inst.openMidi) % 12;
      const tonicKeys = q.shape.filter((p) => midiAt(p, inst.openMidi) % 12 === tonicClass).map(tileKey);
      if (!b1.lit || b1.lit.size !== tonicKeys.length || !tonicKeys.every((k) => b1.lit!.has(k))) {
        bad = 'level 1 must light exactly the tonic tiles'; break;
      }
      if (!b1.lit.has(tileKey({ string: q.rootString, fret: q.rootFret }))) { bad = 'level 1 misses the starting tonic'; break; }
      if (!b2.lit || b2.lit.size !== 0) { bad = 'level 2 must light nothing'; break; }
      for (const b of [b1, b2]) {
        if (b.runMidi.join() !== b0.runMidi.join()) bad = 'the run changed with the level';
        if (b.fromFret !== b0.fromFret || b.toFret !== b0.toFret) bad = 'the section changed with the level';
        if (b.tileMidi.size !== b0.tileMidi.size || [...b0.tileMidi].some(([k, m]) => b.tileMidi.get(k) !== m)) {
          bad = 'a dim shape tile lost its pitch (would no longer answer its step)';
        }
      }
    }
    check(`${id} ${dir}: 300 random boards fade correctly at levels 0/1/2`, bad === '', bad);
  }
}

console.log('orderRecall history form');
const T = 1_800_000_000_000;
const item = 'scale:minorPentatonic:1';
const other = 'scale:minorPentatonic:2';
const fresh = getInstrumentState(loadLearningState(T), 'guitar', T);
check('recallFormFor: level 0 is orderScale', recallFormFor(0) === 'orderScale');
check('recallFormFor: levels 1/2 are orderRecall', recallFormFor(1) === 'orderRecall' && recallFormFor(2) === 'orderRecall');
let st = recordScaleAnswer(fresh, item, 'orderRecall', true, 12, T, 2);
const row = st.scaleHistory[st.scaleHistory.length - 1];
check('recordScaleAnswer stores the recall level', row.form === 'orderRecall' && row.recallLevel === 2);
st = recordScaleAnswer(st, item, 'orderScale', true, 10, T + 1, 2);
check('a non-recall row never carries a level', st.scaleHistory[st.scaleHistory.length - 1].recallLevel === undefined);
check('a recall answer still reviews the item in scaleSrs', (st.scaleSrs[item]?.reps ?? 0) >= 2);
const norm = normalizeScaleHistory([
  { itemId: item, form: 'orderRecall', correct: true, seconds: 3, createdAt: T, recallLevel: 1 },
  { itemId: item, form: 'orderRecall', correct: true, seconds: 3, createdAt: T + 1 },
  { itemId: item, form: 'orderRecall', correct: true, seconds: 3, createdAt: T + 2, recallLevel: 3 },
  { itemId: item, form: 'orderScale', correct: true, seconds: 3, createdAt: T + 3, recallLevel: 1 },
]);
check('normalise keeps a valid orderRecall row with its level', norm.some((r) => r.createdAt === T && r.recallLevel === 1));
check('normalise drops an orderRecall row with no / a bad level', norm.length === 2);
check('normalise strips a level from a non-recall row', norm.find((r) => r.createdAt === T + 3)?.recallLevel === undefined);
const merged = mergeScaleHistory(norm, [{ itemId: item, form: 'orderRecall', correct: false, seconds: 1, createdAt: T + 9, recallLevel: 2 }]);
check('merge keeps both devices\' recall rows and their levels',
  merged.length === 3 && merged.find((r) => r.createdAt === T + 9)?.recallLevel === 2);

console.log('auto level-up');
type Row = Parameters<typeof recallStreak>[0][number];
const r = (createdAt: number, correct: boolean, level: 0 | 1 | 2, itemId = item): Row =>
  level === 0
    ? { itemId, form: 'orderScale', correct, seconds: 5, createdAt }
    : { itemId, form: 'orderRecall', correct, seconds: 5, createdAt, recallLevel: level };
check('RECALL_PROMOTE_RUNS is 3', RECALL_PROMOTE_RUNS === 3);
check('3 good level-0 runs → level 1', recallPromotion([r(1, true, 0), r(2, true, 0), r(3, true, 0)], item, 0, 0) === 1);
check('2 good runs are not enough', recallPromotion([r(1, true, 0), r(2, true, 0)], item, 0, 0) === null);
check('a miss breaks the streak', recallPromotion([r(1, true, 0), r(2, false, 0), r(3, true, 0), r(4, true, 0)], item, 0, 0) === null);
check('an older miss before 3 good runs does not block', recallPromotion([r(1, false, 0), r(2, true, 0), r(3, true, 0), r(4, true, 0)], item, 0, 0) === 1);
check('3 good level-1 runs → level 2', recallPromotion([r(1, true, 1), r(2, true, 1), r(3, true, 1)], item, 1, 0) === 2);
check('level 2 is the top', recallPromotion([r(1, true, 2), r(2, true, 2), r(3, true, 2)], item, 2, 0) === null);
check('runs at another level do not count', recallPromotion([r(1, true, 0), r(2, true, 0), r(3, true, 1)], item, 1, 0) === null);
check('runs at another level do not break the streak either',
  recallStreak([r(1, true, 1), r(2, false, 0), r(3, true, 1)], item, 1, 0) === 2);
check('another item\'s runs do not count', recallPromotion([r(1, true, 0, other), r(2, true, 0), r(3, true, 0)], item, 0, 0) === null);
check('another item\'s runs do not break the streak', recallStreak([r(1, true, 0), r(2, false, 0, other), r(3, true, 0)], item, 0, 0) === 2);
check('runs before the level was set do not count', recallPromotion([r(1, true, 1), r(2, true, 1), r(3, true, 1)], item, 1, 2) === null);
check('streak counts only runs since the level was set', recallStreak([r(1, true, 1), r(2, true, 1), r(3, true, 1)], item, 1, 2) === 2);
// End to end through the real recorder: three good recall runs at level 1.
let e2e = getInstrumentState(loadLearningState(T), 'guitar', T);
for (let i = 0; i < 3; i++) e2e = recordScaleAnswer(e2e, item, 'orderRecall', true, 9, T + 100 + i, 1);
check('three recorded good level-1 runs promote to level 2', recallPromotion(e2e.scaleHistory, item, 1, T) === 2);

if (failures > 0) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall checks passed');
