// Focused checks for Scales sequences — "a ladder after Recall"
// (src/learning/scaleSequence.ts, product-wishlist.md 2026-10-03 item 6),
// the `orderSequence` history form (src/learning/learningState.ts) and the
// path step (src/learning/scaleCurriculum.ts).
//
//   node --experimental-strip-types scripts/check-scale-sequence.mts
//
// Covers:
//   • `sequenceIndices` against hand-written groups of 3 / 4 and thirds, up
//     and down, and short lines
//   • on 300 random boxes × guitar/bass × up/down × every pattern: the
//     sequence walks the box's notes in pitch order, every step is a tile of
//     the box with its own pitch, the labels are each note's place in the
//     line, and the section / tiles / Recall `lit` set are unchanged
//   • `orderSequence` rows carry their pattern through record / normalise /
//     merge; a pattern-less one is dropped; they never count toward Recall
//   • the ladder: locked until N good Recall runs in a row, open once any
//     sequence has been played, rungs in order, a passed rung stays passed
//   • the path: the step sits right after "Connect the boxes", and passes
//     only when every rung has

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
const {
  sequenceIndices, sequenceBoard, sequenceLadder, SEQUENCE_PATTERNS, SEQUENCE_PASS_RUNS, SEQUENCE_UNLOCK_RUNS,
} = await import('../src/learning/scaleSequence.ts');
const { recallStreak } = await import('../src/learning/scaleRecall.ts');
const { recordScaleAnswer, normalizeScaleHistory, mergeScaleHistory, getInstrumentState, loadLearningState } =
  await import('../src/learning/learningState.ts');
const { SCALE_PATH, scalePathProgress, sequencePicker } = await import('../src/learning/scaleCurriculum.ts');
const { scaleItemId } = await import('../src/learning/scaleItem.ts');
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

console.log('sequenceIndices');
check('groups of 3 up, 5 notes', sequenceIndices(5, 'groups3', 'up').join() === [0, 1, 2, 1, 2, 3, 2, 3, 4].join());
check('groups of 3 down, 5 notes', sequenceIndices(5, 'groups3', 'down').join() === [4, 3, 2, 3, 2, 1, 2, 1, 0].join());
check('groups of 4 up, 5 notes', sequenceIndices(5, 'groups4', 'up').join() === [0, 1, 2, 3, 1, 2, 3, 4].join());
check('thirds up, 5 notes', sequenceIndices(5, 'thirds', 'up').join() === [0, 2, 1, 3, 2, 4].join());
check('thirds down, 5 notes', sequenceIndices(5, 'thirds', 'down').join() === [4, 2, 3, 1, 2, 0].join());
check('a line too short for the pattern is empty',
  sequenceIndices(3, 'groups4', 'up').length === 0 && sequenceIndices(2, 'thirds', 'up').length === 0);

console.log('sequence boards');
for (const id of ['guitar', 'bass'] as const) {
  const inst = INSTRUMENTS[id];
  const pool = buildScalePool(['minorPentatonic', 'major', 'blues', 'naturalMinor'], inst.stringCount);
  for (const dir of ['up', 'down'] as const) {
    const rng = seeded(dir === 'up' ? 5 : 6);
    let bad = '';
    let lengths = '';
    for (let n = 0; n < 300 && !bad; n++) {
      const q = pickScaleQuestion(pool, inst.notes, inst.stringCount, inst.maxFret, rng, false, dir);
      if (!q) { bad = 'no question'; break; }
      for (const level of [0, 1, 2] as const) {
        const plain = buildOrderBoard(q, inst.openMidi, level);
        const line = [...new Set(plain.runMidi)].sort((a, b) => a - b);
        for (const pattern of SEQUENCE_PATTERNS) {
          const b = sequenceBoard(plain, pattern, q.direction);
          const want = sequenceIndices(line.length, pattern, q.direction).map((i) => line[i]);
          if (b.runMidi.join() !== want.join()) { bad = `${pattern} ${q.direction}: wrong order`; break; }
          if (b.run.some((p, i) => midiAt(p, inst.openMidi) !== b.runMidi[i] || b.tileMidi.get(tileKey(p)) !== b.runMidi[i])) {
            bad = `${pattern}: a step is not a box tile with its pitch`; break;
          }
          if (!b.stepLabels || b.stepLabels.some((l, i) => line[l - 1] !== b.runMidi[i])) { bad = `${pattern}: wrong labels`; break; }
          if (b.fromFret !== plain.fromFret || b.toFret !== plain.toFret || b.tileMidi !== plain.tileMidi || b.lit !== plain.lit) {
            bad = `${pattern}: the section changed`; break;
          }
          if (n === 0 && level === 0) lengths += ` ${pattern}=${b.runMidi.length}`;
        }
        if (bad) break;
      }
    }
    check(`${id} ${dir}: 300 boxes × 3 levels × 3 patterns${lengths}`, !bad, bad);
  }
}

console.log('history form');
const ITEM = scaleItemId('minorPentatonic', 1);
const t0 = 1_700_000_000_000;
let st = getInstrumentState(loadLearningState(t0), 'guitar', t0);
st = recordScaleAnswer(st, ITEM, 'orderSequence', true, 20, t0 + 1, undefined, 'groups4');
const row = st.scaleHistory.at(-1)!;
check('record keeps the pattern', row.form === 'orderSequence' && row.pattern === 'groups4' && row.recallLevel === undefined);
const norm = normalizeScaleHistory([
  row,
  { itemId: ITEM, form: 'orderSequence', correct: true, seconds: 1, createdAt: t0 + 2 },
  { itemId: ITEM, form: 'orderSequence', correct: true, seconds: 1, createdAt: t0 + 3, pattern: 'sixths' },
  { itemId: ITEM, form: 'orderScale', correct: true, seconds: 1, createdAt: t0 + 4, pattern: 'thirds' },
]);
check('normalise keeps a valid row, drops a pattern-less or unknown one',
  norm.length === 2 && norm[0].pattern === 'groups4' && norm[1].form === 'orderScale');
check('normalise strips a pattern from another form', norm[1].pattern === undefined);
const merged = mergeScaleHistory([row], [row]);
check('merge dedupes and keeps the pattern', merged.length === 1 && merged[0].pattern === 'groups4');

type Row = Parameters<typeof normalizeScaleHistory>[0] extends unknown ? ReturnType<typeof normalizeScaleHistory>[number] : never;
let clock = t0 + 100;
const recall = (correct: boolean, level: 1 | 2 = 1): Row =>
  ({ itemId: ITEM, form: 'orderRecall', correct, seconds: 5, createdAt: clock++, recallLevel: level });
const seq = (pattern: 'groups3' | 'groups4' | 'thirds', correct: boolean, itemId = ITEM): Row =>
  ({ itemId, form: 'orderSequence', correct, seconds: 5, createdAt: clock++, pattern });

check('sequence rows never count toward Recall',
  recallStreak([recall(true), seq('groups3', true), seq('groups3', false), recall(true)], ITEM, 1, 0) === 2);

console.log('ladder');
{
  const h: Row[] = [];
  let l = sequenceLadder(h, ITEM);
  check('no history: locked', !l.unlocked && l.current === null && !l.done && l.recallStreak === 0);
  h.push(recall(true), recall(true));
  check(`${SEQUENCE_UNLOCK_RUNS - 1} good Recall runs: still locked`, !sequenceLadder(h, ITEM).unlocked);
  h.push(recall(false), recall(true), recall(true));
  check('a miss restarts the Recall count', !sequenceLadder(h, ITEM).unlocked && sequenceLadder(h, ITEM).recallStreak === 2);
  h.push(recall(true, 2));
  l = sequenceLadder(h, ITEM);
  check('N good Recall runs in a row (any level ≥ 1): open on groups of 3', l.unlocked && l.current === 'groups3');
  h.push(seq('groups3', true), recall(false));
  check('once a sequence is played, a Recall miss does not lock it again', sequenceLadder(h, ITEM).unlocked);
  h.push(seq('groups3', true), seq('groups3', false), seq('groups3', true));
  l = sequenceLadder(h, ITEM);
  check('a miss resets the rung streak', l.current === 'groups3' && l.rungs[0].streak === 1);
  h.push(seq('groups3', true), seq('groups3', true, scaleItemId('minorPentatonic', 2)), seq('groups3', true));
  l = sequenceLadder(h, ITEM);
  check(`${SEQUENCE_PASS_RUNS} good runs in a row pass the rung (another box's runs ignored)`,
    l.rungs[0].passed && l.current === 'groups4');
  h.push(seq('groups3', false));
  check('a passed rung stays passed', sequenceLadder(h, ITEM).rungs[0].passed);
  h.push(seq('groups4', true), seq('groups4', true), seq('groups4', true));
  h.push(seq('thirds', true), seq('thirds', true));
  l = sequenceLadder(h, ITEM);
  check('rungs climb in order', l.rungs[1].passed && !l.rungs[2].passed && l.current === 'thirds' && !l.done);
  h.push(seq('thirds', true));
  l = sequenceLadder(h, ITEM);
  check('every rung passed: done', l.done && l.current === null);
}

console.log('path');
{
  const i = SCALE_PATH.findIndex((s) => s.kind === 'sequence');
  check('the step comes right after "Connect the boxes"', i > 0 && SCALE_PATH[i - 1].kind === 'connect');
  check('it is box 1 of the minor pentatonic, gating',
    SCALE_PATH[i].itemId === ITEM && SCALE_PATH[i].gating);
  const counter = { current: 0 };
  const pick = sequencePicker(counter);
  const inst = INSTRUMENTS.guitar;
  const pool = [{ scaleTypeId: 'minorPentatonic', positionIndex: 1 }];
  const dirs = [0, 1, 2, 3].map(() => pick(pool, inst.notes, inst.stringCount, inst.maxFret, seeded(3), true, 'up')?.direction);
  check('the picker alternates up and down', dirs.join() === 'up,down,up,down');
  const all: Row[] = [];
  for (let k = 0; k < SEQUENCE_UNLOCK_RUNS; k++) all.push(recall(true));
  for (const p of SEQUENCE_PATTERNS) for (let k = 0; k < SEQUENCE_PASS_RUNS; k++) all.push(seq(p, true));
  const full = scalePathProgress({}, all, clock, inst.stringCount).entries.find((e) => e.step.kind === 'sequence');
  // Like any later step practised early, it shows ✓ but unlocks nothing before it.
  check('on the full path, every rung passed shows done', full?.status === 'done');
  const short = scalePathProgress({}, all.slice(0, -1), clock, inst.stringCount).entries.find((e) => e.step.kind === 'sequence');
  check('on the full path, one rung short waits behind the steps before it', short?.status === 'locked');
  const done = scalePathProgress({}, all, clock, inst.stringCount, [SCALE_PATH[i]]);
  const notDone = scalePathProgress({}, all.slice(0, -1), clock, inst.stringCount, [SCALE_PATH[i]]);
  check('alone on a path: done with every rung, current one short', done.entries[0].status === 'done'
    && notDone.entries[0].status === 'current');
}

if (failures > 0) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall sequence checks passed');
