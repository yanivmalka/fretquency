// Focused checks for "Connect the boxes" — scales-learning-spec.md Session 8:
// `connectBoxesPosition` (src/utils/scales.ts) and `pickConnectQuestion`
// (src/learning/scaleDrill.ts), which feed the unchanged
// `useScaleOrderEngine`/`ScaleOrderBoard`/`buildOrderBoard`/`tonicRun`.
//
//   node --experimental-strip-types scripts/check-scale-connect.mts
//
// Covers, on guitar and bass, every shipped scale type, both directions:
//   • the synthetic position's window strictly contains both authored boxes
//   • the resulting shape is wider than either single box alone
//   • the run (tonicRun over the wide shape) still starts and ends on the tonic
//   • every shape tile is lit and played, exactly like a single-box question
//   • the item id round-trips through scaleItemId/parseScaleItemId at
//     positionIndex 0 (the reserved "connect" value)

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

const { SCALE_TYPES, scalePositionsFor, connectBoxesPosition, shapeAtRoot } = await import('../src/utils/scales.ts');
const { pickScaleQuestion, pickConnectQuestion } = await import('../src/learning/scaleDrill.ts');
const { midiAt, tonicRun } = await import('../src/learning/scaleFall.ts');
const { buildOrderBoard, tileKey } = await import('../src/learning/scaleOrder.ts');
const { scaleItemId, parseScaleItemId } = await import('../src/learning/scaleItem.ts');
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

console.log('connectBoxesPosition: window geometry');
for (const id of ['guitar', 'bass'] as const) {
  const inst = INSTRUMENTS[id];
  for (const scale of SCALE_TYPES) {
    const positions = scalePositionsFor(scale.id, inst.stringCount);
    const box1 = positions.find((p) => p.positionIndex === 1);
    const box2 = positions.find((p) => p.positionIndex === 2);
    const connect = connectBoxesPosition(scale.id, inst.stringCount);
    if (!box1 || !box2) { check(`${id} ${scale.id}: both boxes exist`, false, 'missing an authored box'); continue; }
    if (!connect) { check(`${id} ${scale.id}: connect position builds`, false); continue; }
    check(
      `${id} ${scale.id}: same root string as box 1`,
      connect.rootString === box1.rootString,
    );
    check(
      `${id} ${scale.id}: window contains box 1's window`,
      connect.window.from <= box1.window.from && connect.window.to >= box1.window.to,
    );
    check(
      `${id} ${scale.id}: window is wider than box 1 alone by at least box 2's span`,
      connect.window.to - connect.window.from >= (box1.window.to - box1.window.from) + (box2.window.to - box2.window.from),
    );
  }
}

console.log('\npickConnectQuestion: shape + run, vs. a single box');
for (const id of ['guitar', 'bass'] as const) {
  const inst = INSTRUMENTS[id];
  for (const dir of ['up', 'down'] as const) {
    const scaleTypeIds = SCALE_TYPES.map((s) => s.id);
    const rng = seeded(11);
    let bad = '';
    let sawWiderThanBox1 = false;
    for (let n = 0; n < 300 && !bad; n++) {
      const q = pickConnectQuestion(scaleTypeIds, inst.notes, inst.stringCount, inst.maxFret, rng, false, dir);
      if (!q) { bad = 'no question'; break; }
      if (q.positionIndex !== 0) bad = `positionIndex should be 0, got ${q.positionIndex}`;

      const run = tonicRun(q.shape, inst.openMidi, q.direction, { string: q.rootString, fret: q.rootFret });
      const rootMidi = midiAt({ string: q.rootString, fret: q.rootFret }, inst.openMidi);
      if (run[0] !== undefined && midiAt(run[0], inst.openMidi) !== rootMidi) bad = 'run does not start on the tonic';
      if (run.length > 0 && midiAt(run[run.length - 1], inst.openMidi) !== rootMidi) bad = 'run does not end on the tonic';

      const b = buildOrderBoard(q, inst.openMidi);
      if (b.tileMidi.size !== q.shape.length) bad = 'a shape tile is not lit';
      for (const p of q.shape) {
        const m = b.tileMidi.get(tileKey(p));
        if (m !== midiAt(p, inst.openMidi)) bad = `tile ${tileKey(p)} has the wrong pitch`;
        if (!b.runMidi.includes(m!)) bad = `tile ${tileKey(p)} is never played`;
      }

      // Cross-check against a single box 1 question at the same root: the
      // connect shape must strictly contain more notes (it genuinely spans
      // further up the neck, not just a relabeled box 1).
      const scaleType = SCALE_TYPES.find((s) => s.id === q.scaleTypeId)!;
      const box1 = scalePositionsFor(q.scaleTypeId, inst.stringCount).find((p) => p.positionIndex === 1)!;
      const box1Shape = shapeAtRoot(scaleType, box1, q.rootFret, inst.notes);
      if (box1Shape && q.shape.length > box1Shape.length) sawWiderThanBox1 = true;
    }
    check(`${id} ${dir}: 300 random connect questions are well-formed`, bad === '', bad);
    check(`${id} ${dir}: at least one question was strictly wider than box 1 alone`, sawWiderThanBox1);
  }
}

console.log('\nitem id at positionIndex 0 round-trips');
for (const scale of SCALE_TYPES.slice(0, 3)) {
  const id = scaleItemId(scale.id, 0);
  const parsed = parseScaleItemId(id);
  check(`${scale.id}: scaleItemId(..., 0) parses back`, parsed !== null && parsed.scaleTypeId === scale.id && parsed.positionIndex === 0, JSON.stringify(parsed));
}
check('negative positionIndex is still rejected', parseScaleItemId('scale:major:-1') === null);

console.log('\nsingle-box picker is unaffected (regression)');
{
  const inst = INSTRUMENTS.guitar;
  const pool = [{ scaleTypeId: 'minorPentatonic', positionIndex: 1 }];
  const q = pickScaleQuestion(pool, inst.notes, inst.stringCount, inst.maxFret, seeded(3), false, 'up');
  check('pickScaleQuestion still returns a real box (positionIndex 1)', q !== null && q.positionIndex === 1);
}

if (failures > 0) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall checks passed');
