-- 0023_app_events.sql
-- Run in the Supabase SQL Editor or via `supabase db push`.
--
-- Basic first-party usage measurement (src/utils/analytics.ts). No
-- third-party analytics SDK and no personal data: `install_id` is a random
-- uuid generated on-device and stored only in localStorage, never linked to
-- an auth account or email. Clients may INSERT their own events and nothing
-- else — no select/update/delete policy exists for anon/authenticated, so an
-- install can never read another install's events, let alone the whole
-- table. Only admins (public.admins, see 0005) can read the table, via the
-- policy below or the SQL Editor directly.
--
-- NOT APPLIED YET — this still needs to be run against the live database.
--
-- Example admin query (counts per event, last 7 days):
--   select event, count(*) from public.app_events
--   where created_at > now() - interval '7 days'
--   group by event order by count(*) desc;

create table if not exists public.app_events (
  id         bigint generated always as identity primary key,
  install_id uuid not null,
  event      text not null,
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_events_event_created_at_idx
  on public.app_events (event, created_at);

alter table public.app_events enable row level security;

-- Anyone (including anon) may insert their own event row; no other access.
drop policy if exists app_events_insert_any on public.app_events;
create policy app_events_insert_any on public.app_events
  for insert
  to anon, authenticated
  with check (true);

-- Admins may read everything, for the counts query above or a future
-- admin-only dashboard.
drop policy if exists app_events_select_admin on public.app_events;
create policy app_events_select_admin on public.app_events
  for select
  to authenticated
  using (public.is_admin());
