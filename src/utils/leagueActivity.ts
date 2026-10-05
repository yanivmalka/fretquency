// A small device-local "correct answers since this league week started, by
// instrument" counter for every practice source that does NOT write into
// Practice's real per-instrument history: Homework (HomeworkRun.tsx) and the
// Premium Learn domains that keep their own isolated SRS/history — Interval,
// Scale, Staff, Tab (src/hooks/useLearning.ts's interval answers,
// src/components/{Scale,Staff,Tab}PracticeScreen.tsx). The Teacher/notes
// domain needs no entry here: a Teacher session runs through the ordinary
// `useDrillSession` with real `historyOps`, so it already lands in the
// `HistoryEntry` rows `computeLeagueXp` (leagues.ts) reads directly.
//
// Modeled on dailyActivity.ts's shape (a tiny best-effort localStorage log)
// but a deliberately SEPARATE module and storage key: dailyActivity.ts is
// documented to never feed league/leaderboard/mastery, and this counter
// exists for exactly that one purpose, so folding the two together would
// blur a boundary that is spelled out on purpose elsewhere. Nothing here
// talks to Supabase directly — it is only ever added, client-side, into the
// `p_xp` figure `leagues.ts` passes to the `league_sync` RPC (same
// anti-cheat posture as the rest of that file: client-computed, bounds-
// checked server-side only).
//
// How this reaches the server: passively. The two existing places that push
// league XP — a finished Practice round (useRoundEndCelebrations.ts) and
// opening the Leaderboard panel's League tab (LeaderboardPanel.tsx) — add
// this counter into the total they already compute and sync. There is no
// dedicated push from a Homework/Learn screen itself: those screens have no
// spare auth/display-name wiring to call the league RPC on their own, and
// pushing on every single answered question would be far chattier than
// Practice's one-push-per-round. A week spent only on Homework/Learn is
// credited the next time the player checks the league board, or next plays
// a Practice round — same "best effort, not instant" character the rest of
// league sync already has.

import { leagueWeekStart } from './leagueRules';

const STORAGE_KEY = 'leagueActivityLog';

type Log = Record<string, number>; // `${instrumentId}:${weekStart}` -> count

function loadLog(): Log {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLog(log: Log): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    /* private mode / quota — best-effort only */
  }
}

function logKey(instrumentId: string, weekStart: string): string {
  return `${instrumentId}:${weekStart}`;
}

/** Record `count` correct answers (default 1) from a non-Practice source
 *  (Homework, or a Premium Learn domain) toward this instrument's current
 *  league week. Only correct answers count — unit parity with Practice's own
 *  `computeLeagueXp` (1 XP per correct answer, the same weight everywhere, a
 *  deliberate choice so league XP keeps meaning one simple thing instead of a
 *  per-source weighting that would need justifying and maintaining forever).
 *  A caller with a per-question `correct` boolean guards the call itself
 *  (e.g. `if (a.correct) recordLeagueActivity(instrument.id);`); a caller
 *  that only knows a final correct count (HomeworkRun.tsx) passes it as
 *  `count` directly. */
export function recordLeagueActivity(instrumentId: string, count = 1): void {
  if (count <= 0) return;
  const current = leagueWeekStart();
  const log = loadLog();
  const k = logKey(instrumentId, current);
  log[k] = (log[k] ?? 0) + count;
  // Prune every write — few keys ever exist (instrument count × a couple of
  // weeks), unlike dailyActivity.ts's day-count threshold, so there is no
  // need to defer this to a size check.
  const keep = new Set([current, leagueWeekStart(new Date(Date.now() - 7 * 86_400_000))]);
  for (const k2 of Object.keys(log)) {
    if (!keep.has(k2.slice(k2.lastIndexOf(':') + 1))) delete log[k2];
  }
  saveLog(log);
}

/** Correct answers this instrument has logged here since the current league
 *  week started (Monday 00:00 UTC) — the non-Practice half of a player's
 *  league XP. See leagues.ts's `syncLeague` call sites for how this is added
 *  to `computeLeagueXp`'s Practice-only count to form the total pushed to
 *  the `league_sync` RPC. */
export function weeklyLeagueActivity(instrumentId: string, now: Date = new Date()): number {
  const log = loadLog();
  return log[logKey(instrumentId, leagueWeekStart(now))] ?? 0;
}
