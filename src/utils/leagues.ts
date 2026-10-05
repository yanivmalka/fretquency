// Weekly leagues — Supabase data access. The pure rules (week boundary, XP
// counting, promotion/demotion zones) live in leagueRules.ts, re-exported
// below unchanged, so that Supabase-free code (leagueActivity.ts, this
// file's own check script) can depend on them without pulling in
// `./supabase` (which reads `import.meta.env` and only works inside Vite).
// Every Supabase helper in this file no-ops when `supabase` is null.

import { supabase } from './supabase';
import { fetchLeaderboardRows, type LeaderboardRow } from './leaderboard';
import {
  LEAGUE_GROUP_SIZE, LEAGUE_MIN_PLAYERS, LEAGUE_DEMOTE_MIN_SIZE, LEAGUE_TIERS, LEAGUE_TIER_COLOR,
  leagueWeekStart, computeLeagueXp, leagueZone, leagueMoveCount,
  type LeagueTier, type LeagueMembership,
} from './leagueRules';

export {
  LEAGUE_GROUP_SIZE, LEAGUE_MIN_PLAYERS, LEAGUE_DEMOTE_MIN_SIZE, LEAGUE_TIERS, LEAGUE_TIER_COLOR,
  leagueWeekStart, computeLeagueXp, leagueZone, leagueMoveCount,
  type LeagueTier, type LeagueMembership,
};

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
