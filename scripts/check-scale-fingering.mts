// Checks for the box fingering — `fingeringFor` in src/utils/scales.ts
// (scales-learning-spec.md Session 10, product-wishlist Scales item D).
//
//   node --experimental-strip-types scripts/check-scale-fingering.mts
//
// Covers:
//   • published fingerings reproduced exactly (minor pentatonic box 1 and
//     the 5th-string box, major with the root under finger 2, major
//     pentatonic from finger 2) — the rule is the standard one, not invented
//   • every instrument variant, every shipped scale type, every authored
//     box, every root fret the box fits at: every note gets a finger, fretted
//     notes only fingers 1–4, open strings 0, fingers non-decreasing with the
//     fret on each string (and strictly increasing — no two notes of a
//     string under one finger)
//   • "Connect the boxes" (a two-box window) returns null whenever its notes
//     need a hand shift, and a valid fingering otherwise

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

const { SCALE_TYPES, scalePositionsFor, connectBoxesPosition, shapeAtRoot, fingeringFor, scaleTypeById } =
  await import('../src/utils/scales.ts');
const {
  INSTRUMENTS, GUITAR_VARIANTS_BY_TYPE, BASS_VARIANTS, MANDOLIN_VARIANTS, UKULELE_VARIANTS, BANJO_VARIANTS,
} = await import('../src/utils/instruments.ts');

type Pos = { string: number; fret: number };
type Win = { from: number; to: number };

let failures = 0;
let passes = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) { passes++; return; }
  failures++;
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Fingers of `stringNum`, low fret to high, as a "1-4" string. */
function stringFingers(fin: Map<string, number>, stringNum: number): string {
  return [...fin.entries()]
    .map(([k, f]) => ({ s: Number(k.split(':')[0]), fret: Number(k.split(':')[1]), f }))
    .filter((e) => e.s === stringNum)
    .sort((a, b) => a.fret - b.fret)
    .map((e) => e.f)
    .join('-');
}

function boxAt(inst: typeof INSTRUMENTS.guitar, scaleId: string, positionIndex: number, rootName: string) {
  const scale = scaleTypeById(scaleId)!;
  const pos = scalePositionsFor(scaleId, inst.stringCount).find((p: { positionIndex: number }) => p.positionIndex === positionIndex)!;
  const row = inst.notes[pos.rootString - 1];
  const rootFret = row.findIndex((n: string, f: number) => n === rootName && f + pos.window.from >= 0);
  const shape = shapeAtRoot(scale, pos, rootFret, inst.notes)!;
  const win: Win = { from: rootFret + pos.window.from, to: rootFret + pos.window.to };
  return { shape, win, fin: fingeringFor(shape, win) };
}

/** Low string first, like the boards draw them. */
function rows(fin: Map<string, number> | null, stringCount: number): string[] {
  if (!fin) return ['null'];
  return Array.from({ length: stringCount }, (_, i) => stringFingers(fin, stringCount - i));
}

console.log('Published fingerings, guitar in A');
{
  const g = INSTRUMENTS.guitar;
  const expect = (label: string, scaleId: string, box: number, want: string[]) => {
    const got = rows(boxAt(g, scaleId, box, 'A').fin, g.stringCount);
    check(label, got.join(' / ') === want.join(' / '), `got ${got.join(' / ')}`);
    console.log(`  ${label}: ${got.join(' / ')}`);
  };
  expect('minor pentatonic box 1', 'minorPentatonic', 1, ['1-4', '1-3', '1-3', '1-3', '1-4', '1-4']);
  expect('minor pentatonic, root on the 5th string', 'minorPentatonic', 2, ['1-4', '1-4', '1-3', '1-3', '2-4', '1-4']);
  expect('major, root under finger 2', 'major', 1, ['1-2-4', '1-2-4', '1-3-4', '1-3-4', '2-4', '1-2-4']);
  expect('major pentatonic, root under finger 2', 'majorPentatonic', 1, ['2-4', '1-4', '1-4', '1-3', '2-4', '2-4']);
  expect('blues box 1 (b5 under fingers 2 and 4)', 'blues', 1, ['1-4', '1-2-3', '1-3', '1-3-4', '1-2-4', '1-4']);
}

const variants = [
  ...Object.values(GUITAR_VARIANTS_BY_TYPE).flat(),
  ...BASS_VARIANTS, ...MANDOLIN_VARIANTS, ...UKULELE_VARIANTS, ...BANJO_VARIANTS,
];

function validate(label: string, shape: readonly Pos[], fin: Map<string, number>): void {
  check(`${label}: one finger per note`, shape.every((p) => fin.has(`${p.string}:${p.fret}`)) && fin.size === shape.length);
  for (const p of shape) {
    const f = fin.get(`${p.string}:${p.fret}`)!;
    if (p.fret === 0) check(`${label}: open string ${p.string} is 0`, f === 0, `got ${f}`);
    else check(`${label}: ${p.string}:${p.fret} finger in 1–4`, Number.isInteger(f) && f >= 1 && f <= 4, `got ${f}`);
  }
  const strings = new Set(shape.map((p) => p.string));
  for (const s of strings) {
    const onString = shape.filter((p) => p.string === s && p.fret > 0).sort((a, b) => a.fret - b.fret);
    for (let i = 1; i < onString.length; i++) {
      const a = fin.get(`${s}:${onString[i - 1].fret}`)!;
      const b = fin.get(`${s}:${onString[i].fret}`)!;
      check(`${label}: string ${s} non-decreasing`, b >= a, `${onString[i - 1].fret}→${a}, ${onString[i].fret}→${b}`);
      check(`${label}: string ${s} strictly increasing`, b > a, `${onString[i - 1].fret}→${a}, ${onString[i].fret}→${b}`);
    }
  }
}

console.log(`Every box, every root fret (${variants.length} instrument variants × ${SCALE_TYPES.length} scale types)`);
let boxes = 0;
let openBoxes = 0;
for (const inst of variants) {
  for (const scale of SCALE_TYPES) {
    for (const pos of scalePositionsFor(scale.id, inst.stringCount)) {
      for (let rootFret = 0; rootFret <= inst.maxFret; rootFret++) {
        const shape = shapeAtRoot(scale, pos, rootFret, inst.notes);
        if (!shape || rootFret + pos.window.to > inst.maxFret) continue;
        const win: Win = { from: rootFret + pos.window.from, to: rootFret + pos.window.to };
        const label = `${inst.id}/${inst.stringCount}str ${scale.id} box${pos.positionIndex} @${rootFret}`;
        const fin = fingeringFor(shape, win);
        check(`${label}: a box always has a fingering`, fin != null);
        if (!fin) continue;
        validate(label, shape, fin);
        boxes++;
        if (shape.some((p: Pos) => p.fret === 0)) openBoxes++;
      }
    }
  }
}
console.log(`  ${boxes} boxes fingered (${openBoxes} with open strings)`);
check('some boxes include open strings (the 0 path is exercised)', openBoxes > 0);

console.log('Connect the boxes (two-box window)');
let connectNull = 0;
let connectFingered = 0;
for (const inst of [INSTRUMENTS.guitar, INSTRUMENTS.bass]) {
  for (const scale of SCALE_TYPES) {
    const pos = connectBoxesPosition(scale.id, inst.stringCount);
    if (!pos) continue;
    for (let rootFret = 1; rootFret + pos.window.to <= inst.maxFret; rootFret++) {
      const shape = shapeAtRoot(scale, pos, rootFret, inst.notes);
      if (!shape) continue;
      const fretted = shape.filter((p: Pos) => p.fret > 0).map((p: Pos) => p.fret);
      const span = Math.max(...fretted) - Math.min(...fretted);
      const fin = fingeringFor(shape, { from: rootFret + pos.window.from, to: rootFret + pos.window.to });
      if (span > 5) {
        check(`${inst.id} ${scale.id} connect @${rootFret}: null when a shift is needed`, fin === null);
        connectNull++;
      } else {
        check(`${inst.id} ${scale.id} connect @${rootFret}: fingered when it fits one hand`, fin != null);
        if (fin) validate(`${inst.id} ${scale.id} connect @${rootFret}`, shape, fin);
        connectFingered++;
      }
    }
  }
}
console.log(`  ${connectNull} need a shift (no fingers), ${connectFingered} fit one hand`);

console.log(failures === 0 ? `\nAll ${passes} checks passed.` : `\n${failures} check(s) FAILED (${passes} passed).`);
if (failures > 0) process.exit(1);
