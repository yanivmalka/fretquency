-- Adds a "This week" scope to the leaderboard (0006_leaderboard.sql): a
-- second XP figure covering only the trailing 7 days, recomputed and pushed
-- by the client on the same cadence as the all-time `xp` column (best-effort,
-- refreshed whenever a signed-in player opens the board). Same anti-cheat
-- posture as the rest of the table — client-computed, bounds-checked only.

alter table public.leaderboard_entries
  add column if not exists weekly_xp integer not null default 0
    check (weekly_xp between 0 and 5000000);

-- Serves the "This week" top-N query, mirroring the all-time rank index.
create index if not exists leaderboard_entries_weekly_rank_idx
  on public.leaderboard_entries (instrument, weekly_xp desc);
