-- Public read for earned badges: lets the leaderboard show "view achievements"
-- for ANY player, not just yourself (product-owner request, 2026-10-01).
-- Badges are not sensitive (same spirit as leaderboard_entries, already
-- world-readable) — this only adds a second, public SELECT policy alongside
-- the existing self-only `user_badges_own` policy from 0008_user_badges.sql,
-- which still governs insert/update/delete.

drop policy if exists user_badges_read_all on public.user_badges;
create policy user_badges_read_all on public.user_badges
  for select
  to anon, authenticated
  using (true);

-- ── Data API exposure ────────────────────────────────────────────────────
grant select on public.user_badges to anon;
