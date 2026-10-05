// Weekly leagues — data access + the pure rules the board draws with. Backed
// by `league_groups` / `league_members` and the `league_sync` function in
// supabase/migrations/0025_leaderboard_leagues.sql (read that header for the
// full mechanic). The constants below must stay in step with that function.
//
// A league week runs Monday 00:00 UTC to the next Monday; a player's league XP
// is the correct answers they played since Monday (a calendar week, unlike the
// board's rolling 7-day "This week" figure). Every Supabase helper no-ops
// when `supabase` is null.

import { supabase } from './supabase';
import type { HistoryEntry } from './music';
import { fetchLeaderboardRows, type LeaderboardRow } from './leaderboard';

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

/** Correct answers since this week's Monday 00:00 UTC. Undated legacy rows
 *  don't count, same as the board's weekly figure. */
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

/**
 * Push the signed-in player's week XP and get their group back (joining one
 * if they have XP this week and aren't in one yet). `null` = not in a league
 * this week, or no backend.
 */
export async function syncLeague(
  instrument: string,
  displayName: string,
  leagueXp: number,
): Promise<LeagueMembership | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('league_sync', {
    p_instrument: instrument,
    p_week_start: leagueWeekStart(),
    p_display_name: displayName,
    p_xp: leagueXp,
  });
  if (error) throw error;
  const row = (data as { group_id: number; tier: number }[] | null)?.[0];
  return row ? { groupId: row.group_id, tier: row.tier as LeagueTier } : null;
}

/**
 * Everyone in one group, best week first, as ordinary leaderboard rows (so the
 * board's podium / list / profile card render them unchanged) with `leagueXp`
 * set. Accuracy / answered come from each player's leaderboard row.
 */
export async function fetchLeagueGroup(
  groupId: number,
  instrument: string,
  viewerId: string | null,
): Promise<LeaderboardRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('league_members')
    .select('user_id, display_name, xp, updated_at')
    .eq('group_id', groupId)
    .order('xp', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(LEAGUE_GROUP_SIZE + 5);
  if (error) throw error;
  const members = (data ?? []) as { user_id: string; display_name: string; xp: number; updated_at: string }[];
  const boards = await fetchLeaderboardRows(instrument, members.map((m) => m.user_id), viewerId);
  const byId = new Map(boards.map((b) => [b.userId, b]));
  return members.map((m, i) => {
    const b = byId.get(m.user_id);
    return {
      userId: m.user_id,
      displayName: m.display_name,
      xp: b?.xp ?? 0,
      weeklyXp: b?.weeklyXp ?? 0,
      leagueXp: m.xp,
      questions: b?.questions ?? 0,
      accuracy: b?.accuracy ?? 0,
      updatedAt: m.updated_at,
      rank: i + 1,
      mine: m.user_id === viewerId,
    };
  });
}

interface LastSeenLeagueTier {
  week: string;
  tier: LeagueTier;
  /** Whether the group met `LEAGUE_MIN_PLAYERS` at that sync — a quiet,
   *  no-network badge (e.g. on the home screen) reads this instead of
   *  re-fetching the group just to decide whether to show itself. */
  inLeague: boolean;
}

function lastSeenLeagueTierKey(instrument: string): string {
  return `leagueLastSeen:${instrument}`;
}

/** The tier + week this device last saw the signed-in player's league result
 *  at, so a later sync can tell a promotion/demotion apart from "unchanged
 *  since last week" and surface it once, and so a quiet UI element can show
 *  the current tier without its own network round-trip. `null` if never
 *  recorded here. */
export function loadLastSeenLeagueTier(instrument: string): LastSeenLeagueTier | null {
  try {
    const raw = localStorage.getItem(lastSeenLeagueTierKey(instrument));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastSeenLeagueTier>;
    if (typeof parsed.week !== 'string' || typeof parsed.tier !== 'number') return null;
    return { week: parsed.week, tier: parsed.tier as LeagueTier, inLeague: parsed.inLeague !== false };
  } catch {
    return null;
  }
}

export function saveLastSeenLeagueTier(instrument: string, week: string, tier: LeagueTier, inLeague: boolean): void {
  try {
    localStorage.setItem(lastSeenLeagueTierKey(instrument), JSON.stringify({ week, tier, inLeague }));
  } catch { /* best effort */ }
}
