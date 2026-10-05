-- Weekly leagues on top of the leaderboard (0006 / 0020): each calendar week
-- (Monday 00:00 UTC) a player who has practised that week is placed into a
-- group of at most 30 players on the same instrument and the same league tier
-- (0 Bronze, 1 Silver, 2 Gold, 3 Platinum, 4 Diamond), ranked by the correct
-- answers they've played since Monday. When they first sync in a new week the
-- previous week's group decides their tier: the top fifth move up a tier, the
-- bottom fifth move down (only in a group of 10+), everyone else stays.
-- Missing a week keeps the last tier. The client (src/utils/leagues.ts) holds
-- the same constants to draw the move-up / move-down zones.
--
-- No cron: everything happens lazily inside `league_sync`, which the client
-- calls whenever it already pushes its leaderboard row (board open, end of a
-- run). A group below LEAGUE_MIN_PLAYERS (5) is never shown — the client falls
-- back to the global "This week" board — and such a group's week does not move
-- anyone up or down either, so nobody is promoted out of a league they never
-- saw.
--
-- Same anti-cheat posture as 0006: the week's XP is client-computed from the
-- player's own history and only bounds-checked here. Unlike leaderboard_entries
-- the tables are NOT client-writable — group and tier are assigned only by the
-- security-definer function, so a client can't pick its own league. Rows from
-- past weeks are kept (one row per player per instrument per week, tiny); they
-- are what the next week's tier is computed from.
--
-- Run in the Supabase SQL Editor or via `supabase db push`.

create table if not exists public.league_groups (
  id          bigint generated always as identity primary key,
  instrument  text not null,
  week_start  date not null,
  tier        smallint not null check (tier between 0 and 4),
  created_at  timestamptz not null default now()
);

create index if not exists league_groups_slot_idx
  on public.league_groups (instrument, week_start, tier);

create table if not exists public.league_members (
  user_id       uuid not null references auth.users (id) on delete cascade,
  instrument    text not null,
  week_start    date not null,
  group_id      bigint not null references public.league_groups (id) on delete cascade,
  tier          smallint not null check (tier between 0 and 4),
  display_name  text not null check (char_length(display_name) between 1 and 40),
  xp            integer not null check (xp between 0 and 5000000),
  updated_at    timestamptz not null default now(),
  primary key (user_id, instrument, week_start)
);

-- Serves "everyone in my group, best first" and the group-size count.
create index if not exists league_members_group_idx
  on public.league_members (group_id, xp desc);

-- ── Row Level Security ──────────────────────────────────────────────────
alter table public.league_groups enable row level security;
alter table public.league_members enable row level security;

-- select — everyone, like the leaderboard itself.
drop policy if exists league_groups_read_all on public.league_groups;
create policy league_groups_read_all on public.league_groups
  for select to anon, authenticated using (true);

drop policy if exists league_members_read_all on public.league_members;
create policy league_members_read_all on public.league_members
  for select to anon, authenticated using (true);

-- delete — a signed-in user may remove their own membership rows (opt-out).
-- No insert / update policy: writes go through league_sync only.
drop policy if exists league_members_delete_own on public.league_members;
create policy league_members_delete_own on public.league_members
  for delete to authenticated using (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.league_groups to anon, authenticated;
grant select on public.league_members to anon, authenticated;
grant delete on public.league_members to authenticated;

-- ── league_sync ─────────────────────────────────────────────────────────
-- Refresh the caller's XP for this week's league on one instrument, joining
-- a group first if they aren't in one yet (only once they have XP > 0 this
-- week). Returns the caller's group id + tier, or no row when they haven't
-- joined. `p_week_start` is the client's idea of the current week; a stale
-- client (e.g. syncing a few seconds after Monday 00:00 UTC with last week's
-- count) writes nothing.
create or replace function public.league_sync(
  p_instrument   text,
  p_week_start   date,
  p_display_name text,
  p_xp           integer
)
returns table (group_id bigint, tier smallint)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  c_group_size constant integer := 30;  -- LEAGUE_GROUP_SIZE
  c_min_players constant integer := 5;  -- LEAGUE_MIN_PLAYERS
  c_demote_min constant integer := 10;  -- LEAGUE_DEMOTE_MIN_SIZE
  c_top_tier constant smallint := 4;
  v_uid uuid := auth.uid();
  v_week date := (date_trunc('week', now() at time zone 'utc'))::date;
  v_name text := left(coalesce(nullif(btrim(p_display_name), ''), 'Player'), 40);
  v_xp integer := least(greatest(coalesce(p_xp, 0), 0), 5000000);
  v_prev public.league_members%rowtype;
  v_tier smallint := 0;
  v_size integer;
  v_rank integer;
  v_move integer;
  v_group bigint;
begin
  if v_uid is null then
    raise exception 'league_sync: not signed in';
  end if;
  if p_week_start is distinct from v_week then
    return;
  end if;

  -- Already in this week's league: just refresh the figures.
  update public.league_members m
     set xp = v_xp, display_name = v_name, updated_at = now()
   where m.user_id = v_uid and m.instrument = p_instrument and m.week_start = v_week
  returning m.group_id, m.tier into v_group, v_tier;
  if found then
    return query select v_group, v_tier;
    return;
  end if;

  -- Not practised this week yet: don't drop them into a league.
  if v_xp <= 0 then
    return;
  end if;

  -- Tier carries over from the latest earlier week; last week's finish moves it.
  select * into v_prev
    from public.league_members m
   where m.user_id = v_uid and m.instrument = p_instrument and m.week_start < v_week
   order by m.week_start desc
   limit 1;
  if found then
    v_tier := v_prev.tier;
    if v_prev.week_start = v_week - 7 then
      select count(*), 1 + count(*) filter (where m.xp > v_prev.xp)
        into v_size, v_rank
        from public.league_members m
       where m.group_id = v_prev.group_id;
      if v_size >= c_min_players then
        v_move := greatest(1, v_size / 5);
        if v_rank <= v_move and v_prev.xp > 0 then
          v_tier := least(v_tier + 1, c_top_tier);
        elsif v_size >= c_demote_min and v_rank > v_size - v_move then
          v_tier := greatest(v_tier - 1, 0);
        end if;
      end if;
    end if;
  end if;

  -- Fill the fullest open group in this slot (serialised per slot so two
  -- players joining at once can't both take the 30th seat).
  perform pg_advisory_xact_lock(hashtext('league:' || p_instrument || ':' || v_week::text || ':' || v_tier::text));
  select g.id into v_group
    from public.league_groups g
   where g.instrument = p_instrument and g.week_start = v_week and g.tier = v_tier
     and (select count(*) from public.league_members m where m.group_id = g.id) < c_group_size
   order by (select count(*) from public.league_members m where m.group_id = g.id) desc, g.id
   limit 1;
  if v_group is null then
    insert into public.league_groups (instrument, week_start, tier)
    values (p_instrument, v_week, v_tier)
    returning id into v_group;
  end if;

  insert into public.league_members (user_id, instrument, week_start, group_id, tier, display_name, xp)
  values (v_uid, p_instrument, v_week, v_group, v_tier, v_name, v_xp)
  on conflict (user_id, instrument, week_start) do nothing;

  -- A concurrent call of our own may have won the insert; report the real row.
  return query
    select m.group_id, m.tier
      from public.league_members m
     where m.user_id = v_uid and m.instrument = p_instrument and m.week_start = v_week;
end;
$$;

revoke all on function public.league_sync(text, date, text, integer) from public, anon;
grant execute on function public.league_sync(text, date, text, integer) to authenticated;
