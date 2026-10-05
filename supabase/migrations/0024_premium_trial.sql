-- The reverse Premium trial's cross-device anchor (src/utils/trial.ts).
--
-- The trial itself is a client-side convenience, exactly like devSimulateTier:
-- it never grants anything through `public.entitlements` (that table stays
-- admin/webhook-write-only, see 0007). This table holds only WHEN a given
-- account's 7-day trial started, so it can't be restarted by signing out and
-- back in, reinstalling, or switching devices. The client computes "is the
-- trial still active" itself from `started_at` + 7 days — nothing here is
-- trusted as an entitlement grant, so a normal authenticated client write
-- policy is fine.
--
-- One row per user, write-once in practice: the client inserts its own local
-- start date the first time it syncs for an account, and every later sync
-- just reads whichever date got there first (first writer wins). No update
-- policy on purpose — a client should never move its own start date later.
create table if not exists public.premium_trial (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.premium_trial enable row level security;

drop policy if exists premium_trial_read_own on public.premium_trial;
create policy premium_trial_read_own on public.premium_trial
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists premium_trial_insert_own on public.premium_trial;
create policy premium_trial_insert_own on public.premium_trial
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- No update / delete policy: a trial's start date, once recorded, never moves.

grant usage on schema public to authenticated;
grant select, insert on public.premium_trial to authenticated;
