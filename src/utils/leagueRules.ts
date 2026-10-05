// Pure weekly-league rules and constants — no Supabase import, so this stays
// safe to pull into a hand-run check script (scripts/check-leagues.mts)
// without crashing on `import.meta.env` outside a Vite build (the same
// reason src/teacher/classJoinError.ts was split out of classroom.ts).
// leagues.ts re-exports everything here for its existing callers; new code
// should keep importing from leagues.ts unless it specifically needs to stay
// Supabase-free (like leagueActivity.ts does).
//
// Backed by `league_groups` / `league_members` and the `league_sync` function
// in supabase/migrations/0025_leaderboard_leagues.sql (read that header for
// the full mechanic). The constants below must stay in step with that
// function.
//
// A league week runs Monday 00:00 UTC to the next Monday; a player's league
// XP is the correct answers they played since Monday (a calendar week,
// unlike the board's rolling 7-day "This week" figure).

import type { HistoryEntry } from './music';

/** Most players one group holds. */
export const LEAGUE_GROUP_SIZE = 30;
/** Below this many players a group isn't shown (the board falls back to the
 *  global "This week" standings) and its week moves nobody up or down. */
export const LEAGUE_MIN_PLAYERS = 5;
/** Demotion only applies in a group at least this big. */
export const LEAGUE_DEMOTE_MIN_SIZE = 10;

export const LEAGUE_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const;
export type LeagueTier = 0 | 1 | 2 | 3 | 4;

/** Tier accent colors, low → high, reused by the board's League tab and the
 *  end-of-round card's league line. */
export const LEAGUE_TIER_COLOR: Record<LeagueTier, string> = {
  0: '#cd7f32', 1: '#c8d0e0', 2: 'var(--gold)', 3: '#7fd1e0', 4: '#b79cff',
};

export interface LeagueMembership {
  groupId: number;
  tier: LeagueTier;
}

/** Monday 00:00 UTC of the week containing `now`, as `YYYY-MM-DD`. */
export function leagueWeekStart(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return d.toISOString().slice(0, 10);
}

/** Correct answers since this week's Monday 00:00 UTC, from Practice's own
 *  per-instrument `HistoryEntry` rows only. Undated legacy rows don't count,
 *  same as the board's weekly figure. This is the Practice-only half of a
 *  player's league XP — see leagues.ts's `syncLeague` call sites for how
 *  `leagueActivity.ts`'s separate weekly counter (Homework + the Premium
 *  Learn domains, none of which write into Practice's real history) is added
 *  on top to form the total. Unit: 1 XP per correct answer, the same weight
 *  for every source — a deliberate choice so league XP keeps meaning one
 *  simple thing instead of a per-source weighting that would need
 *  justifying and maintaining forever. */
export function computeLeagueXp(instrumentEntries: HistoryEntry[], now: Date = new Date()): number {
  const cutoff = Date.parse(`${leagueWeekStart(now)}T00:00:00Z`);
  return instrumentEntries.filter(
    (e) => e.correct === true && e.createdAt && Date.parse(e.createdAt) >= cutoff,
  ).length;
}

/** Where a final rank lands at the week's end: same rule as `league_sync`. */
export function leagueZone(rank: number, size: number, tier: LeagueTier): 'up' | 'down' | null {
  if (size < LEAGUE_MIN_PLAYERS) return null;
  const move = Math.max(1, Math.floor(size / 5));
  if (rank <= move && tier < 4) return 'up';
  if (size >= LEAGUE_DEMOTE_MIN_SIZE && rank > size - move && tier > 0) return 'down';
  return null;
}

/** The share of a group that moves up (and, in a big enough group, down). */
export function leagueMoveCount(size: number): number {
  return Math.max(1, Math.floor(size / 5));
}
