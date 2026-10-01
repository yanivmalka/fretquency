// Focused checks for the Scales Learning data layer (slice 1, Minor
// Pentatonic): src/utils/scales.ts and src/learning/scaleItem.ts.
// UI/engine/SRS wiring is not built yet — see scales-learning-spec.md.
//
// No test runner in this repo — run by hand, never part of `npm run build`,
// same spirit as scripts/check-intervals.mts:
//
//   node --experimental-strip-types scripts/check-scales.mts
//
// Covers:
//   • SCALE_TYPES: minor pentatonic's degrees/labels, scaleTypeById lookup
//   • stepPattern derives the W/H/W+H formula from `degrees`, never authored
//     separately (spec §1.4's drift-proof guarantee)
//   • scalePositionsFor resolves position 1 / position 2 to a concrete
//     rootString for guitar (6-string) and bass (4-string) — "lowest string"
//     / "next string up", not a hardcoded string number
//   • shapeAtRoot: every returned position really is a scale tone, the root
//     itself is included, the window is respected, and it returns null when
//     the window would leave the fretboard
//   • scaleItemId / parseScaleItemId round-trip, and never collide with a
//     note or interval item id

import { register } from 'node:module';

// `instruments.ts` reads `import.meta.env.BASE_URL` (Vite-only) for the
// ukulele sample path; stub it so this plain-Node script can still import
// the module (same issue check-intervals.mts's own INSTRUMENTS import hits).
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

const {
  SCALE_TYPES, scaleTypeById, stepPattern, scalePositionsFor, shapeAtRoot,
} = await import('../src/utils/scales.ts');
const { scaleItemId, isScaleItemId, parseScaleItemId } =
  await import('../src/learning/scaleItem.ts');
const { intervalItemId } = await import('../src/learning/intervalItem.ts');
const { parseNoteItemId } = await import('../src/learning/noteItem.ts');
const { INSTRUMENTS } = await import('../src/utils/instruments.ts');

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

const guitar = INSTRUMENTS.guitar;
const bass = INSTRUMENTS.bass;

// ── Scale type table ─────────────────────────────────────────────────
{
  check('SCALE_TYPES holds twenty-two scales with unique ids, minor pentatonic first',
    SCALE_TYPES.length === 22 && SCALE_TYPES[0].id === 'minorPentatonic' &&
    new Set(SCALE_TYPES.map((s: { id: string }) => s.id)).size === 22);
  check('every scale type: degrees strictly ascend inside the octave, one label per degree',
    SCALE_TYPES.every((s: { degrees: number[]; degreeLabels: string[] }) =>
      s.degrees.length === s.degreeLabels.length &&
      s.degrees.every((d, i) => d > (i === 0 ? 0 : s.degrees[i - 1]) && d < 12)));
  check('every scale type: labels are unique within the scale',
    SCALE_TYPES.every((s: { degreeLabels: string[] }) => new Set(s.degreeLabels).size === s.degreeLabels.length));
  const mp = scaleTypeById('minorPentatonic');
  check('minor pentatonic degrees are 3,5,7,10 (b3,4,5,b7)',
    !!mp && mp.degrees.join(',') === '3,5,7,10' &&
    mp.degreeLabels.join(',') === 'b3,4,5,b7');
  check('scaleTypeById returns undefined for an unshipped type',
    scaleTypeById('noSuchScale') === undefined);
}

// ── Step pattern is derived, not authored ────────────────────────────
{
  const mp = scaleTypeById('minorPentatonic')!;
  check('minor pentatonic step formula is W+H W W W+H W',
    stepPattern(mp).join('-') === 'W+H-W-W-W+H-W');

  // Drift-proof guarantee: a hand-built scale with a known formula round-trips.
  const majorLike = { id: 'x', nameKey: 'x', degrees: [2, 4, 5, 7, 9, 11], degreeLabels: [] };
  check('a 7-note W-W-H-W-W-W-H formula (major-scale shape) derives correctly',
    stepPattern(majorLike).join('-') === 'W-W-H-W-W-W-H');
  const naturalMinorLike = { id: 'x', nameKey: 'x', degrees: [2, 3, 5, 7, 8, 10], degreeLabels: [] };
  check('a 7-note W-H-W-W-H-W-W formula (natural-minor shape) derives correctly',
    stepPattern(naturalMinorLike).join('-') === 'W-H-W-W-H-W-W');
  check('hirajoshi derives its two-whole-step gaps as W+W',
    stepPattern(scaleTypeById('hirajoshi')!).join('-') === 'W-H-W+W-H-W+W');
  check('every shipped scale type has a step pattern (no unsupported gap)',
    SCALE_TYPES.every((s: Parameters<typeof stepPattern>[0]) => {
      try { return stepPattern(s).length === s.degrees.length + 1; } catch { return false; }
    }));
}

// ── Position resolution — "lowest string" / "next string up", per instrument ─
{
  const guitarPositions = scalePositionsFor('minorPentatonic', guitar.stringCount);
  check('guitar (6-string): position 1 roots on string 6 (lowest), position 2 on string 5',
    guitarPositions.length === 2 &&
    guitarPositions[0].rootString === 6 && guitarPositions[1].rootString === 5);

  const bassPositions = scalePositionsFor('minorPentatonic', bass.stringCount);
  check('bass (4-string): position 1 roots on string 4 (lowest), position 2 on string 3',
    bassPositions.length === 2 &&
    bassPositions[0].rootString === 4 && bassPositions[1].rootString === 3);

  check('an unshipped scale type resolves to no positions',
    scalePositionsFor('noSuchScale', guitar.stringCount).length === 0);
}

// ── shapeAtRoot ───────────────────────────────────────────────────────
{
  const mp = scaleTypeById('minorPentatonic')!;
  const [pos1] = scalePositionsFor('minorPentatonic', guitar.stringCount);

  // A minor pentatonic rooted at fret 5 on string 6 (low E -> A) — a
  // textbook "A minor pentatonic, box 1" shape.
  const rootFret = 5;
  const shape = shapeAtRoot(mp, pos1, rootFret, guitar.notes);
  check('shapeAtRoot returns a non-empty shape for a valid root', !!shape && shape.length > 0,
    JSON.stringify(shape));

  const rootName = guitar.notes[pos1.rootString - 1][rootFret];
  check('the root position itself is included in the shape',
    !!shape && shape.some((p: { string: number; fret: number }) =>
      p.string === pos1.rootString && p.fret === rootFret),
    rootName);

  const { noteNameAtSemitones } = await import('../src/utils/intervals.ts');
  const expectedTones = new Set([0, ...mp.degrees].map((s) => noteNameAtSemitones(rootName, s)));
  check('shapeAtRoot: every position\'s note is one of the 5 expected pitch classes',
    !!shape && shape.every((p: { string: number; fret: number }) =>
      expectedTones.has(guitar.notes[p.string - 1][p.fret])));

  check('shapeAtRoot respects the window (every fret within [rootFret-1, rootFret+3])',
    !!shape && shape.every((p: { string: number; fret: number }) =>
      p.fret >= rootFret + pos1.window.from && p.fret <= rootFret + pos1.window.to));

  check('shapeAtRoot returns null when the window would go below fret 0',
    shapeAtRoot(mp, pos1, 0, guitar.notes) === null);

  check('shapeAtRoot returns null for a string with no note at that fret (bad root)',
    shapeAtRoot(mp, { ...pos1, rootString: 999 }, 5, guitar.notes) === null);

  // Different root, same shape (movable): the pitch-class set is transposed.
  const shape2 = shapeAtRoot(mp, pos1, 7, guitar.notes)!;
  const rootName2 = guitar.notes[pos1.rootString - 1][7];
  const expectedTones2 = new Set([0, ...mp.degrees].map((s) => noteNameAtSemitones(rootName2, s)));
  check('a different root produces a different (correctly transposed) pitch-class set',
    rootName2 !== rootName &&
    shape2.every((p: { string: number; fret: number }) => expectedTones2.has(guitar.notes[p.string - 1][p.fret])));

  // Works for bass too, not just guitar.
  const [bassPos1] = scalePositionsFor('minorPentatonic', bass.stringCount);
  const bassShape = shapeAtRoot(mp, bassPos1, 5, bass.notes);
  check('shapeAtRoot works on bass\'s note table (different tuning/string count)',
    !!bassShape && bassShape.length > 0);
}

// ── Scale item identity ──────────────────────────────────────────────
{
  check('scaleItemId round-trips',
    (() => {
      const id = scaleItemId('minorPentatonic', 1);
      const parsed = parseScaleItemId(id);
      return id === 'scale:minorPentatonic:1' && isScaleItemId(id) &&
        parsed?.scaleTypeId === 'minorPentatonic' && parsed?.positionIndex === 1;
    })());
  check('parseScaleItemId rejects junk',
    // 0 is reserved for "Connect the boxes" (scales-learning-spec.md Session
    // 8, connectBoxesPosition) — a valid id now, covered by
    // check-scale-connect.mts instead of here.
    parseScaleItemId('scale:minorPentatonic:-1') === null &&
    parseScaleItemId('scale:minorPentatonic:') === null &&
    parseScaleItemId('scale:') === null &&
    parseScaleItemId('6:3') === null);
  check('a note-id parser never accepts a scale id',
    parseNoteItemId(scaleItemId('minorPentatonic', 1)) === null);
  check('a scale id and an interval id never collide',
    scaleItemId('minorPentatonic', 1) !== intervalItemId(1) &&
    !isScaleItemId(intervalItemId(4)));
}

console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
