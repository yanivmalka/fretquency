// Focused checks for Scales "short licks per box" (src/learning/scaleLicks.ts),
// played back through the echo engine.
//
//   node --experimental-strip-types scripts/check-scale-licks.mts
//
// Covers:
//   • in A minor pentatonic box 1 (root on the 6th string, 5th fret) every
//     lick comes out as exactly the frets of its published source
//   • every lick resolves in Minor Pentatonic and Blues box 1 at every root
//     that fits, on every guitar variant (6 and 7 strings — box 2 on a
//     7-string; 8 and 9 strings have no box on the 6th string — every fret
//     count)
//   • the board: the box unchanged (section, every tile's pitch), the lick
//     as the run, every run tile on the board with its own pitch; dim lights
//     only the root
//   • no note repeated straight away (the engine would swallow it)
//   • 3–5 licks per box, unique ids, the session order (each lick twice)

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

const { pickScaleQuestion } = await import('../src/learning/scaleDrill.ts');
const { midiAt } = await import('../src/learning/scaleFall.ts');
const { buildOrderBoard, tileKey } = await import('../src/learning/scaleOrder.ts');
const { licksFor, lickPool, resolveLick, lickBoard, lickIndexFor, LICK_TRIES } =
  await import('../src/learning/scaleLicks.ts');
const { GUITAR_VARIANTS_BY_TYPE, INSTRUMENTS } = await import('../src/utils/instruments.ts');

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

console.log('the authored set');
for (const item of lickPool(6)) {
  const licks = licksFor(item.scaleTypeId, item.positionIndex, 6);
  check(`${item.scaleTypeId} box ${item.positionIndex}: 3–5 licks`, licks.length >= 3 && licks.length <= 5, `${licks.length}`);
  check(`${item.scaleTypeId} box ${item.positionIndex}: unique ids`, new Set(licks.map((l) => l.id)).size === licks.length);
  check(`${item.scaleTypeId} box ${item.positionIndex}: every lick has a source`, licks.every((l) => l.source.startsWith('https://')));
}
check('no licks on a box without any', licksFor('major', 1, 6).length === 0 && licksFor('minorPentatonic', 2, 6).length === 0);
check('6-string: box 1 has them', licksFor('minorPentatonic', 1, 6).length > 0 && lickPool(6).every((p) => p.positionIndex === 1));
check('7-string: box 2 (rooted on the 6th string), not box 1', licksFor('minorPentatonic', 1, 7).length === 0 && lickPool(7).length === 2 && lickPool(7).every((p) => p.positionIndex === 2));
check('8- and 9-string: no box on the 6th string, no licks', lickPool(8).length === 0 && lickPool(9).length === 0);
check('bass-sized 4-string: none', lickPool(4).length === 0);

console.log('A minor pentatonic box 1 = the source tabs');
{
  // The sources' frets, string 1 = high e. Root A on the 6th string, 5th fret.
  const want: Record<string, string> = {
    bluesOpening: '3:7 2:5 1:5',
    claptonTurnHome: '3:7 3:5 4:7',
    pageTriplet: '1:8 1:5 2:5 1:8 1:5 2:5',
    pullOffDescent: '1:8 1:5 2:8 2:5 3:7 3:5',
  };
  const inst = INSTRUMENTS.guitar;
  for (const scaleTypeId of ['minorPentatonic', 'blues']) {
    // Draw until the root is A on the 6th string at the 5th fret.
    const rng = seeded(7);
    let q = null;
    for (let n = 0; n < 5000 && !q; n++) {
      const c = pickScaleQuestion([{ scaleTypeId, positionIndex: 1 }], inst.notes, inst.stringCount, inst.maxFret, rng, false, 'up');
      if (c && c.rootString === 6 && c.rootFret === 5) q = c;
    }
    check(`${scaleTypeId}: found the A box at the 5th fret`, q != null);
    if (!q) continue;
    for (const lick of licksFor(scaleTypeId, 1, 6)) {
      const run = resolveLick(lick, q, inst.openMidi);
      const got = run ? run.map((p) => `${p.string}:${p.fret}`).join(' ') : 'null';
      check(`${scaleTypeId} ${lick.id} = ${want[lick.id]}`, got === want[lick.id], got);
    }
  }
}

console.log('every guitar variant, every root');
for (const type of Object.keys(GUITAR_VARIANTS_BY_TYPE) as (keyof typeof GUITAR_VARIANTS_BY_TYPE)[]) {
  for (const inst of GUITAR_VARIANTS_BY_TYPE[type]) {
    const pool = lickPool(inst.stringCount);
    if (pool.length === 0) continue;
    for (const dim of [false, true]) {
      const rng = seeded(inst.stringCount * 100 + inst.maxFret + (dim ? 1 : 0));
      let bad = '';
      let boards = 0;
      for (let n = 0; n < 200 && !bad; n++) {
        const item = pool[n % pool.length];
        const q = pickScaleQuestion([item], inst.notes, inst.stringCount, inst.maxFret, rng, false, 'up');
        if (!q) { bad = 'no question'; break; }
        const box = buildOrderBoard(q, inst.openMidi, dim ? 1 : 0);
        for (const lick of licksFor(item.scaleTypeId, item.positionIndex, inst.stringCount)) {
          const b = lickBoard(q, inst.openMidi, lick, dim);
          if (!b) { bad = `${lick.id} does not fit ${item.scaleTypeId} at fret ${q.rootFret}`; break; }
          boards++;
          if (b.run.length !== lick.steps.length || b.runMidi.length !== lick.steps.length) { bad = `${lick.id}: wrong length`; break; }
          for (let i = 0; i < b.run.length; i++) {
            if (b.run[i].string !== lick.steps[i].string) { bad = `${lick.id}: step ${i} on the wrong string`; break; }
            if (b.tileMidi.get(tileKey(b.run[i])) !== b.runMidi[i]) { bad = `${lick.id}: run tile not on the board`; break; }
            if (midiAt(b.run[i], inst.openMidi) !== b.runMidi[i]) { bad = `${lick.id}: tile / pitch mismatch`; break; }
            if (i > 0 && b.runMidi[i] === b.runMidi[i - 1]) { bad = `${lick.id}: a note repeated straight away`; break; }
          }
          if (b.fromFret !== box.fromFret || b.toFret !== box.toFret) { bad = 'the section changed'; break; }
          if ([...box.tileMidi].some(([k, m]) => b.tileMidi.get(k) !== m) || b.tileMidi.size !== box.tileMidi.size) {
            bad = 'a box tile lost its pitch'; break;
          }
          if (!dim && b.lit !== undefined) { bad = 'lit board should light every tile'; break; }
          if (dim) {
            const tonic = midiAt({ string: q.rootString, fret: q.rootFret }, inst.openMidi) % 12;
            const lit = q.shape.filter((p) => midiAt(p, inst.openMidi) % 12 === tonic).map(tileKey);
            if (!b.lit || b.lit.size !== lit.length || !lit.every((k) => b.lit!.has(k))) { bad = 'dim must light exactly the root'; break; }
          }
        }
      }
      check(`${type} ${inst.stringCount}-string ${inst.maxFret} frets ${dim ? 'dim' : 'lit'}: ${boards} lick boards`, bad === '', bad);
    }
  }
}

console.log('session order');
{
  const order = Array.from({ length: 8 }, (_, n) => lickIndexFor(n, 4)).join('');
  check(`each lick ${LICK_TRIES}× in a row, in order`, order === '00112233', order);
  check('wraps past the last lick', lickIndexFor(8, 4) === 0);
  check('no licks → 0', lickIndexFor(3, 0) === 0);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall scale lick checks passed');
