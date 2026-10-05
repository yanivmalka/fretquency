// Leaderboard data access. Backed by the public `leaderboard_entries` table
// and its RLS policies in supabase/migrations/0006_leaderboard.sql:
//   - anyone (signed in or not) may read every row
//   - a signed-in user may upsert / delete only their own row
//
// This is a free, open feature: a guest with no account still gets the full
// standings via `fetchLeaderboard`; they just can't appear on it until they
// sign in and their client pushes a row.

import { supabase } from './supabase';
import type { HistoryEntry } from './music';

export type LeaderboardScope = 'allTime' | 'thisWeek';

const WEEKLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  xp: number;
  weeklyXp: number;
  /** This league week's XP (src/utils/leagues.ts) — set only on league rows. */
  leagueXp?: number;
  questions: number;
  accuracy: number; // 0-100
  updatedAt: string;
  /** 1-based position in the returned list, ranked by the requested scope. */
  rank: number;
  /** True when this row belongs to the signed-in viewer. */
  mine: boolean;
}

interface EntryRow {
  user_id: string;
  display_name: string;
  xp: number;
  weekly_xp: number;
  questions: number;
  accuracy: number;
  updated_at: string;
}

export interface MyStats {
  xp: number;
  weeklyXp: number;
  questions: number;
  accuracy: number; // 0-100
}

/**
 * A player's leaderboard figures, derived from their instrument-scoped
 * practice history. XP is simply the count of correct answers — one point
 * each, difficulty-agnostic, so the number is transparent and matches what
 * the Stats screen already shows as lifetime totals. `weeklyXp` is the same
 * count restricted to a trailing 7-day window (rolling, not calendar-week),
 * recomputed from local/synced history each time it's pushed — same
 * best-effort, refresh-on-open cadence as the all-time figure. Legacy rows
 * with no `createdAt` (pre-dating that field) can't be dated, so they're
 * excluded from the weekly count, same precedent as the day-based badges.
 */
export function computeMyStats(instrumentEntries: HistoryEntry[]): MyStats {
  const questions = instrumentEntries.length;
  const correct = instrumentEntries.filter((e) => e.correct === true).length;
  const cutoff = Date.now() - WEEKLY_WINDOW_MS;
  const weeklyXp = instrumentEntries.filter(
    (e) => e.correct === true && e.createdAt && Date.parse(e.createdAt) >= cutoff,
  ).length;
  return {
    xp: correct,
    weeklyXp,
    questions,
    accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0,
  };
}

/** A short, public-facing name from the Google profile (first word only). */
export function leaderboardName(
  profileName: string | null,
  email: string | null,
): string {
  const fromName = (profileName ?? '').trim().split(/\s+/)[0];
  if (fromName) return fromName.slice(0, 40);
  const fromEmail = (email ?? '').split('@')[0].trim();
  if (fromEmail) return fromEmail.slice(0, 40);
  return 'Player';
}

/**
 * Top `limit` rows for an instrument, highest XP first, each tagged with its
 * rank and whether it is the viewer's own. Returns [] when Supabase is not
 * configured (pure guest build).
 */
export async function fetchLeaderboard(
  instrument: string,
  viewerId: string | null,
  scope: LeaderboardScope = 'allTime',
  limit = 100,
): Promise<LeaderboardRow[]> {
  if (!supabase) return [];
  const rankField = scope === 'thisWeek' ? 'weekly_xp' : 'xp';
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('user_id, display_name, xp, weekly_xp, questions, accuracy, updated_at')
    .eq('instrument', instrument)
    .order(rankField, { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r, i) => {
    const row = r as EntryRow;
    return {
      userId: row.user_id,
      displayName: row.display_name,
      xp: row.xp,
      weeklyXp: row.weekly_xp,
      questions: row.questions,
      accuracy: row.accuracy,
      updatedAt: row.updated_at,
      rank: i + 1,
      mine: row.user_id === viewerId,
    };
  });
}

/** The leaderboard rows of specific players (any order; a player with no row
 *  is simply missing). Used to fill in a league group's accuracy / totals. */
export async function fetchLeaderboardRows(
  instrument: string,
  userIds: string[],
  viewerId: string | null,
): Promise<LeaderboardRow[]> {
  if (!supabase || userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('user_id, display_name, xp, weekly_xp, questions, accuracy, updated_at')
    .eq('instrument', instrument)
    .in('user_id', userIds);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as EntryRow;
    return {
      userId: row.user_id,
      displayName: row.display_name,
      xp: row.xp,
      weeklyXp: row.weekly_xp,
      questions: row.questions,
      accuracy: row.accuracy,
      updatedAt: row.updated_at,
      rank: 0,
      mine: row.user_id === viewerId,
    };
  });
}

/** Insert or refresh the signed-in user's row for one instrument. */
export async function upsertMyEntry(
  userId: string,
  instrument: string,
  displayName: string,
  stats: MyStats,
): Promise<void> {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from('leaderboard_entries').upsert(
    {
      user_id: userId,
      instrument,
      display_name: displayName,
      xp: stats.xp,
      weekly_xp: stats.weeklyXp,
      questions: stats.questions,
      accuracy: stats.accuracy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,instrument' },
  );
  if (error) throw error;
}

/** Remove the signed-in user from an instrument's board (opt out). */
export async function deleteMyEntry(
  userId: string,
  instrument: string,
): Promise<void> {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('user_id', userId)
    .eq('instrument', instrument);
  if (error) throw error;
}
