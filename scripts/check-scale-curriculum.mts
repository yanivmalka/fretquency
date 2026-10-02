// Checks for the guided Scales beginner path — src/learning/scaleCurriculum.ts
// (scales-learning-spec.md Session 10, product-wishlist.md Scales item C).
//
//   node --experimental-strip-types scripts/check-scale-curriculum.mts
//
// Covers, on guitar and bass:
//   • the relative box of Major Pentatonic / Major is exactly the relative
//     minor's box 1 (same frets, same strings) — only the home note differs
//   • 300 random relative-box questions per instrument/direction are
//     well-formed: the tonic is in the shape, the run starts and ends on it,
//     the item id round-trips at RELATIVE_BOX_INDEX
//   • the path's order and the unlock/pass rules, derived from scaleSrs /
//     scaleHistory only (recordScaleAnswer is the only writer used)

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

const { scaleTypeById, scalePositionsFor, shapeAtRoot } = await import('../src/utils/scales.ts');
const {
  SCALE_PATH, RELATIVE_BOX_INDEX, RELATIVE_MINOR_OF, relativeBoxPosition, pickRelativeBoxQuestion,
  pickConnectFromPool, scalePathProgress,
} = await import('../src/learning/scaleCurriculum.ts');
const { tonicRun, midiAt } = await import('../src/learning/scaleFall.ts');
const { scaleItemId, parseScaleItemId } = await import('../src/learning/scaleItem.ts');
const { emptyInstrumentState, recordScaleAnswer } = await import('../src/learning/learningState.ts');
const { noteNameAtSemitones } = await import('../src/utils/intervals.ts');
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

const key = (p: { string: number; fret: number }) => `${p.string}:${p.fret}`;

console.log('relativeBoxPosition: same box as the relative minor box 1');
for (const id of ['guitar', 'bass'] as const) {
  const inst = INSTRUMENTS[id];
  for (const [majorId, minorId] of Object.entries(RELATIVE_MINOR_OF)) {
    const major = scaleTypeById(majorId)!;
    const minor = scaleTypeById(minorId)!;
    const rel = relativeBoxPosition(majorId, inst.stringCount);
    const minorBox1 = scalePositionsFor(minorId, inst.stringCount).find((p) => p.positionIndex === 1)!;
    check(`${id} ${majorId}: relative position exists`, rel != null);
    if (!rel) continue;
    check(`${id} ${majorId}: reserved index`, rel.positionIndex === RELATIVE_BOX_INDEX);
    check(`${id} ${majorId}: same root string as ${minorId} box 1`, rel.rootString === minorBox1.rootString);
    let compared = 0;
    let mismatches = 0;
    for (let minorFret = 0; minorFret <= inst.maxFret - 3; minorFret++) {
      const minorShape = shapeAtRoot(minor, minorBox1, minorFret, inst.notes);
      const majorShape = shapeAtRoot(major, rel, minorFret + 3, inst.notes);
      if (!minorShape || !majorShape) {
        if ((minorShape == null) !== (majorShape == null)) mismatches++;
        continue;
      }
      compared++;
      const a = minorShape.map(key).sort().join(' ');
      const b = majorShape.map(key).sort().join(' ');
      if (a !== b) mismatches++;
      // The major root really is the minor root's relative major.
      const minorRoot = inst.notes[minorBox1.rootString - 1][minorFret];
      const majorRoot = inst.notes[rel.rootString - 1][minorFret + 3];
      if (noteNameAtSemitones(minorRoot, 3) !== majorRoot) mismatches++;
    }
    check(`${id} ${majorId}: identical frets to ${minorId} box 1 at every root (${compared} roots)`, compared > 5 && mismatches === 0, `${mismatches} mismatches`);
  }
  check(`${id}: no relative box for a type without a relative minor`, relativeBoxPosition('blues', inst.stringCount) == null);
}

console.log('pickRelativeBoxQuestion: well-formed runs');
for (const id of ['guitar', 'bass'] as const) {
  const inst = INSTRUMENTS[id];
  for (const direction of ['up', 'down'] as const) {
    const rng = seeded(id === 'guitar' ? 11 : 23);
    let bad = 0;
    let n = 0;
    for (let i = 0; i < 300; i++) {
      const q = pickRelativeBoxQuestion(
        [{ scaleTypeId: 'majorPentatonic', positionIndex: RELATIVE_BOX_INDEX }],
        inst.notes, inst.stringCount, inst.maxFret, rng, i % 2 === 0, direction,
      );
      if (!q) { bad++; continue; }
      n++;
      const root = { string: q.rootString, fret: q.rootFret };
      const inShape = q.shape.some((p) => p.string === root.string && p.fret === root.fret);
      const run = tonicRun(q.shape, inst.openMidi, q.direction, root);
      const rootMidi = midiAt(root, inst.openMidi);
      const okRun = run.length > 0 && midiAt(run[0], inst.openMidi) === rootMidi
        && midiAt(run[run.length - 1], inst.openMidi) === rootMidi;
      const okFrets = q.shape.every((p) => p.fret >= 0 && p.fret <= inst.maxFret);
      if (!inShape || !okRun || !okFrets || q.positionIndex !== RELATIVE_BOX_INDEX || q.direction !== direction) bad++;
    }
    check(`${id} ${direction}: 300 questions well-formed`, bad === 0 && n === 300, `${bad} bad`);
  }
}
check('pickRelativeBoxQuestion: null for an empty pool',
  pickRelativeBoxQuestion([], INSTRUMENTS.guitar.notes, 6, 22, seeded(1)) == null);
check('pickConnectFromPool: delegates to the connect picker',
  pickConnectFromPool([{ scaleTypeId: 'minorPentatonic', positionIndex: 0 }], INSTRUMENTS.guitar.notes, 6, INSTRUMENTS.guitar.maxFret, seeded(3))?.positionIndex === 0);

const relId = scaleItemId('majorPentatonic', RELATIVE_BOX_INDEX);
const parsed = parseScaleItemId(relId);
check('relative item id round-trips', parsed?.scaleTypeId === 'majorPentatonic' && parsed.positionIndex === RELATIVE_BOX_INDEX);

console.log('SCALE_PATH: order');
const ids = SCALE_PATH.map((s) => s.id);
check('step ids are unique', new Set(ids).size === ids.length);
check('every step names a real scale type', SCALE_PATH.every((s) => scaleTypeById(s.scaleTypeId) != null));
check('starts on Minor Pentatonic box 1',
  SCALE_PATH[0].scaleTypeId === 'minorPentatonic' && SCALE_PATH[0].positionIndex === 1 && SCALE_PATH[0].kind === 'box');
const order = SCALE_PATH.map((s) => `${s.kind}:${s.scaleTypeId}:${s.positionIndex}`);
check('order: box1 → box2 → connect → explain → relative major pent → blues → natural minor → major',
  order.join(',') === [
    'box:minorPentatonic:1', 'box:minorPentatonic:2', 'connect:minorPentatonic:0',
    `explain:majorPentatonic:${RELATIVE_BOX_INDEX}`, `relativeBox:majorPentatonic:${RELATIVE_BOX_INDEX}`,
    'box:blues:1', 'box:naturalMinor:1', 'box:major:1',
  ].join(','), order.join(','));
check('only the explanation step is non-gating', SCALE_PATH.every((s) => s.gating === (s.kind !== 'explain')));
check('the explanation points at the relative practice step',
  SCALE_PATH[3].itemId === SCALE_PATH[4].itemId);

console.log('scalePathProgress: unlock + pass rules');
const t0 = Date.UTC(2026, 9, 2, 12);
let st = emptyInstrumentState(t0);
let clock = t0;
const master = (itemId: string) => {
  for (let i = 0; i < 3; i++) { clock += 60_000; st = recordScaleAnswer(st, itemId, 'orderScale', true, 20, clock); }
};
const prog = () => scalePathProgress(st.scaleSrs, st.scaleHistory, clock, 6);
const statuses = () => prog().entries.map((e) => e.status).join(',');

let p = prog();
check('fresh: step 1 current, the rest locked', statuses() === 'current,locked,locked,locked,locked,locked,locked,locked', statuses());
check('fresh: 0 / 7 passed', p.passed === 0 && p.total === 7 && p.currentIndex === 0);

clock += 60_000;
st = recordScaleAnswer(st, scaleItemId('minorPentatonic', 1), 'orderScale', true, 20, clock);
check('one correct run does not pass a step', prog().entries[0].status === 'current');

master(scaleItemId('minorPentatonic', 1));
check('box 1 mastered → box 2 current', statuses() === 'done,current,locked,locked,locked,locked,locked,locked', statuses());
master(scaleItemId('minorPentatonic', 2));
master(scaleItemId('minorPentatonic', 0));
check('connect mastered → explanation current, relative step available (explanation gates nothing)',
  statuses() === 'done,done,done,current,available,locked,locked,locked', statuses());

clock += 60_000;
st = recordScaleAnswer(st, relId, 'orderScale', false, 30, clock);
check('a first relative answer → explanation done, relative current',
  statuses() === 'done,done,done,done,current,locked,locked,locked', statuses());

const afterMiss = prog().entries[4].status;
master(relId);
check('a miss then three clean runs still passes the relative step', afterMiss === 'current' && prog().entries[4].status === 'done', statuses());

master(scaleItemId('major', 1));
check('a later step practised early shows done but does not unlock the ones before it',
  statuses() === 'done,done,done,done,done,current,locked,done', statuses());

master(scaleItemId('blues', 1));
master(scaleItemId('naturalMinor', 1));
p = prog();
check('everything mastered → complete', p.currentIndex === -1 && p.passed === 7 && p.entries.every((e) => e.status === 'done'));

const free = scalePathProgress(st.scaleSrs, st.scaleHistory, clock, 6);
check('derived only from the inputs (pure)', JSON.stringify(free) === JSON.stringify(p));

check('a one-string instrument drops the steps it cannot draw',
  scalePathProgress({}, [], clock, 1).entries.every((e) => e.step.positionIndex === 1 || e.step.positionIndex === RELATIVE_BOX_INDEX));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall scale curriculum checks passed');
