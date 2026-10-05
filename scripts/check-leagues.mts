// Hand-run diagnostic for the weekly league's pure rules (src/utils/leagueRules.ts)
// and the cross-source weekly XP counter (src/utils/leagueActivity.ts) that
// lets Homework and the Premium Learn domains (Interval/Scale/Staff/Tab —
// none of which write into Practice's real per-instrument history) move a
// player's league standing the same way a Practice round always has.
// Neither of these two modules imports supabase.ts, unlike leagues.ts itself
// (which reads `import.meta.env` and only works inside a Vite build) — that
// is exactly why the pure rules were split out of leagues.ts into their own
// file; see leagueRules.ts's header.
//   node --experimental-strip-types scripts/check-leagues.mts

import { register } from 'node:module';

class MemoryStorage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}
(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();

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
  leagueWeekStart, computeLeagueXp, leagueZone, leagueMoveCount,
} = await import('../src/utils/leagueRules.ts');
const { recordLeagueActivity, weeklyLeagueActivity } = await import('../src/utils/leagueActivity.ts');

let failed = 0;
const fail = (msg: string) => { failed++; console.error('FAIL', msg); };
const eq = (a: unknown, b: unknown, msg: string) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${msg}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
};

// ── leagueWeekStart: Monday 00:00 UTC of the containing week ─────────────
eq(leagueWeekStart(new Date('2026-10-06T00:00:00Z')), '2026-10-05', 'Tuesday rolls back to Monday');
eq(leagueWeekStart(new Date('2026-10-05T00:00:00Z')), '2026-10-05', 'Monday itself is its own week start');
eq(leagueWeekStart(new Date('2026-10-11T23:59:59Z')), '2026-10-05', 'Sunday night is still the same week');
eq(leagueWeekStart(new Date('2026-10-12T00:00:00Z')), '2026-10-12', 'next Monday 00:00 starts a new week');

// ── computeLeagueXp: Practice-only, correct-answers-since-Monday ─────────
{
  const monday = '2026-10-05T00:00:00Z';
  const now = new Date('2026-10-07T12:00:00Z');
  const entries = [
    { correct: true, createdAt: '2026-10-06T10:00:00Z' },   // this week, correct
    { correct: true, createdAt: '2026-10-04T10:00:00Z' },   // last week — excluded
    { correct: false, createdAt: '2026-10-06T10:00:00Z' },  // wrong — excluded
    { correct: null, createdAt: '2026-10-06T10:00:00Z' },   // timeout — excluded
    { correct: true, createdAt: undefined },                // undated legacy row — excluded
    { correct: true, createdAt: monday },                   // exactly at the boundary — included
  ] as never;
  eq(computeLeagueXp(entries, now), 2, 'only this-week correct, dated rows count');
}

// ── leagueZone / leagueMoveCount: same thresholds as the league_sync RPC ──
eq(leagueMoveCount(30), 6, '30-player group moves 1/5 = 6');
eq(leagueMoveCount(4), 1, 'moveCount floors at 1 even for a tiny group');
eq(leagueZone(1, 4, 0), null, 'below LEAGUE_MIN_PLAYERS (5): no movement');
eq(leagueZone(1, 30, 0), 'up', 'top of a 30-player group promotes');
eq(leagueZone(30, 30, 4), 'down', 'last place still demotes even out of the top tier');
eq(leagueZone(30, 30, 1), 'down', 'bottom of a big-enough group demotes');
eq(leagueZone(10, 10, 1), 'down', 'right at LEAGUE_DEMOTE_MIN_SIZE still demotes');
eq(leagueZone(9, 9, 1), null, 'one below LEAGUE_DEMOTE_MIN_SIZE: no demotion');
eq(leagueZone(5, 30, 0), 'up', 'tier 0 (Bronze) can still promote up to Silver');
eq(leagueZone(30, 30, 0), null, 'tier 0 (Bronze): nothing below it to demote to');

// ── leagueActivity: the cross-source weekly counter ───────────────────────
// recordLeagueActivity always logs against the real current week (same
// convention as recordDailyActivity — no injectable clock on the write
// side), so these reads use the real "now" too rather than a fixed date.
localStorage.clear();
eq(weeklyLeagueActivity('guitar'), 0, 'nothing logged yet');
recordLeagueActivity('guitar'); // default count = 1
recordLeagueActivity('guitar', 2);
eq(weeklyLeagueActivity('guitar'), 3, 'counts accumulate within the same week');
eq(weeklyLeagueActivity('bass'), 0, 'counter is per instrument');
recordLeagueActivity('guitar', 0);
recordLeagueActivity('guitar', -5);
eq(weeklyLeagueActivity('guitar'), 3, 'zero/negative counts are ignored, same as recordDailyActivity');

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('check-leagues: all checks passed');
