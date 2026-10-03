// Focused checks for the picking hand (wishlist update 2026-10-03, item 8):
// src/learning/scalePicking.ts (stroke per run step, stroke per tile) and the
// 2-notes-per-click grid in src/learning/scaleTiming.ts.
//
//   node --experimental-strip-types scripts/check-scale-picking.mts
//
// Covers:
//   • pickStrokes alternates from a down stroke, for any run length
//   • on real runs (every instrument, scale type and direction), each pitch is played on
//     one stroke both ways (so a tile's mark never contradicts itself)
//   • tileStroke follows the run on a sequence-like run that replays a pitch
//     on the other stroke
//   • subdivideBeats: halfway points, the extrapolated next click, 1 = unchanged
//   • judging at 2 per click: a note on the "and" is on time, a note a quarter
//     of a half-beat off is early/late, and the 1-per-click verdict is unchanged

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
const { buildOrderBoard } = await import('../src/learning/scaleOrder.ts');
const { INSTRUMENTS } = await import('../src/utils/instruments.ts');
const { SCALE_TYPES } = await import('../src/utils/scales.ts');
const { pickStrokes, tileStroke } = await import('../src/learning/scalePicking.ts');
const T = await import('../src/learning/scaleTiming.ts');

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log('pickStrokes');
check('empty run → no strokes', pickStrokes([]).length === 0);
check('one note → down', pickStrokes([0]).join() === 'down');
{
  const s = pickStrokes(Array.from({ length: 23 }, (_, i) => i));
  check('23 steps alternate from down', s.every((x, i) => x === (i % 2 === 0 ? 'down' : 'up')));
}

console.log('tileStroke');
{
  // A run like a sequence: pitch 62 on step 1 (up) and again on step 4 (down).
  const runMidi = [60, 62, 64, 60, 62, 64];
  const strokes = pickStrokes(runMidi);
  check('unfound tile: next step still to play', tileStroke(runMidi, strokes, 62, 0, -1) === 'up');
  check('unfound tile after its first step: the later step', tileStroke(runMidi, strokes, 62, 2, -1) === 'down');
  check('found tile keeps its own step', tileStroke(runMidi, strokes, 62, 3, 1) === 'up');
  check('pitch already played, none left: last step', tileStroke(runMidi, strokes, 64, 6, -1) === 'up');
  check('pitch never played → null', tileStroke(runMidi, strokes, 99, 0, -1) === null);
}

console.log('real runs: one stroke per pitch');
{
  // A plain run (tonic → one end → the other end → tonic) plays each pitch
  // at steps of one parity, so a tile's mark never contradicts itself.
  let runs = 0, bad = '';
  for (const id of Object.keys(INSTRUMENTS)) {
    const inst = INSTRUMENTS[id];
    const pool = buildScalePool(SCALE_TYPES.map((t: { id: string }) => t.id), inst.stringCount);
    for (const dir of ['up', 'down', 'both'] as const) {
      const rng = seeded(11);
      for (let n = 0; n < 300 && !bad; n++) {
        const q = pickScaleQuestion(pool, inst.notes, inst.stringCount, inst.maxFret, rng, false, dir);
        if (!q) continue;
        const b = buildOrderBoard(q, inst.openMidi);
        const strokes = pickStrokes(b.run);
        const seen = new Map<number, string>();
        b.runMidi.forEach((m: number, i: number) => {
          const prev = seen.get(m);
          if (prev && prev !== strokes[i] && !bad) bad = `${id} ${q.scaleTypeId} box ${q.positionIndex} ${dir}: pitch ${m}`;
          seen.set(m, strokes[i]);
        });
        runs++;
      }
    }
  }
  check(`no pitch played on two strokes (${runs} runs, every instrument and scale type)`, runs > 0 && bad === '', bad);
}

console.log('subdivideBeats');
{
  const beats = [1000, 2000, 3000];
  check('1 per click → unchanged', T.subdivideBeats(beats, 1, 1000).join() === beats.join());
  check('2 per click → halves + next click', T.subdivideBeats(beats, 2, 1000).join() === '1000,1500,2000,2500,3000,3500,4000');
  check('one click → fallback gap', T.subdivideBeats([1000], 2, 800).join() === '1000,1400,1800');
  check('no clicks → empty', T.subdivideBeats([], 2, 800).length === 0);
  check('normalizeNotesPerClick', T.normalizeNotesPerClick(2) === 2 && T.normalizeNotesPerClick('2') === 1 && T.normalizeNotesPerClick(undefined) === 1);
}

console.log('judging at 2 notes per click');
{
  const beatMs = T.beatMsFor(60); // 1000 ms
  const beats = [0, 1000, 2000, 3000];
  const grid = T.subdivideBeats(beats, 2, beatMs);
  const judge = (at: number) => T.judgeNote(at, grid, beatMs / 2);
  check('on the click → on time', judge(1000)?.verdict === 'onTime');
  check('on the "and" → on time', judge(1500)?.verdict === 'onTime');
  check('the "and" just inside ±⅙ half-beat → on time', judge(1500 + 80)?.verdict === 'onTime');
  check('a quarter half-beat late → late', judge(1500 + 125)?.verdict === 'late');
  check('a quarter half-beat early → early', judge(1500 - 125)?.verdict === 'early');
  check('offset reads in half-beats', Math.abs((judge(1625)?.offsetBeats ?? 0) - 0.25) < 1e-9);
  check('after the last click: judged on the extrapolated "and"', judge(3500)?.verdict === 'onTime');
  // The same "and" at 1 per click is half a beat off.
  check('1 per click: the "and" is not on time', T.judgeNote(1500, beats, beatMs)?.verdict !== 'onTime');
}

if (failures > 0) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nAll picking checks passed.');
