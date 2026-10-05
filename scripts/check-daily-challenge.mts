// Checks for src/utils/dailyChallenge.ts (Fret of the Day / Challenge a
// friend). No test runner in this repo — run by hand:
//
//   node --experimental-strip-types scripts/check-daily-challenge.mts
//
// Verifies the one invariant both features depend on: same instrument + same
// seed key ⇒ same positions, every time, on every device — plus that the
// positions actually land inside each instrument's real tuning/fret range.

import { register } from 'node:module';

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
  buildChallengeCandidates, buildDailyCandidates, buildChallengeDrillConfig,
  dailyChallengeNumber, emojiResultLine, buildShareCaption, CHALLENGE_POSITIONS,
} = await import('../src/utils/dailyChallenge.ts');
const { getInstrument } = await import('../src/utils/instruments.ts');
const { groupCandidateFrets } = await import('../src/drill/candidates.ts');

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const INSTRUMENTS = ['guitar', 'bass', 'mandolin', 'banjo', 'ukulele'] as const;

// ── Determinism: same instrument + seed ⇒ identical positions ─────────────
for (const id of INSTRUMENTS) {
  const a = buildChallengeCandidates(id, 'day:2026-10-05');
  const b = buildChallengeCandidates(id, 'day:2026-10-05');
  check(`${id}: same seed → identical run`, JSON.stringify(a) === JSON.stringify(b));

  const c = buildChallengeCandidates(id, 'day:2026-10-06');
  check(`${id}: different seed → different run`, JSON.stringify(a) !== JSON.stringify(c));
}

// ── Count + validity: every position is real on the instrument's base config ─
for (const id of INSTRUMENTS) {
  const cfg = getInstrument(id);
  const positions = buildDailyCandidates(id, '2026-10-05');
  check(`${id}: yields ${CHALLENGE_POSITIONS} unique positions`, positions.length === CHALLENGE_POSITIONS,
    String(positions.length));
  const unique = new Set(positions.map((p: { string: number; fret: number }) => `${p.string}:${p.fret}`));
  check(`${id}: no duplicate positions`, unique.size === positions.length);

  const grouped = groupCandidateFrets(positions, cfg.notes);
  const validCount = [...grouped.values()].reduce((n, frets) => n + frets.length, 0);
  check(`${id}: every position validates against the real note table`, validCount === positions.length,
    `${validCount}/${positions.length}`);

  const minFrets = cfg.minFrets ?? [];
  const belowMin = positions.some((p: { string: number; fret: number }) =>
    p.fret < (minFrets[p.string - 1] ?? 0));
  check(`${id}: respects per-string minimum fret (e.g. banjo's drone string)`, !belowMin);
}

// ── A DrillConfig built from the candidates only ever asks those strings ───
{
  const positions = buildDailyCandidates('guitar', '2026-10-05');
  const config = buildChallengeDrillConfig('guitar', positions, { accidental: 'sharps', order: 'fifths' });
  const expectedStrings = [...new Set(positions.map((p: { string: number }) => p.string))].sort((a: number, b: number) => a - b);
  check('DrillConfig.strings matches the candidate strings',
    JSON.stringify(config.strings) === JSON.stringify(expectedStrings));
  check('DrillConfig.questionCount matches the candidate count', config.questionCount === positions.length);
  check('DrillConfig.candidates is the exact list passed in',
    JSON.stringify(config.candidates) === JSON.stringify(positions));
}

// ── Puzzle number: monotonic, 1 on ship day ────────────────────────────────
{
  check('puzzle #1 on 2026-10-05 (ship date)', dailyChallengeNumber('2026-10-05') === 1);
  check('puzzle #2 the next day', dailyChallengeNumber('2026-10-06') === 2);
  check('one week later is +7', dailyChallengeNumber('2026-10-12') === 8);
}

// ── Share text helpers ─────────────────────────────────────────────────────
{
  const line = emojiResultLine([true, true, false, true]);
  check('emoji line: green/red per answer', line === '🟩🟩🟥🟩');
  const caption = buildShareCaption({
    dayNumber: 142, instrumentEmoji: '🎸', correct: 9, total: 10, seconds: 31, emojiLine: '🟩🟩🟥',
  });
  check('caption includes puzzle number, score and time',
    caption.startsWith('Fretquency #142 🎸 9/10 · 31s'));
}

console.log(failures === 0
  ? '\nAll daily-challenge checks passed.'
  : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
