-- 0026_classroom.sql
-- Run in the Supabase SQL Editor or via `supabase db push`.
--
-- Teacher mode, first slice (src/teacher/, ClassroomScreen.tsx): a teacher
-- creates a class with a short join code, students join with the code, the
-- teacher assigns homework (a plain DrillConfig, stored as jsonb) and sees
-- who practised it and how they did.
--
-- Applied to the live database (owner, before 2026-10-06).
--
-- Who is a teacher: self-declared. A signed-in user inserts their own row in
-- `public.teachers` from the Class screen ("I'm a teacher") and can then
-- create classes. That is all self-declaration unlocks — class management is
-- not a paid feature.
--
-- "Premium free for teachers" is now AUTOMATIC, based on real class activity
-- — not a one-time admin check. A teacher gets Premium for free while at
-- least one class they run is "active" (enough students, recently used); see
-- the "Premium for active teachers" section at the bottom for the exact
-- rule, the daily pg_cron re-check that also handles losing it again, and
-- the separate admin-only `verified_at` override this never touches.
--
-- Students must be signed in to join: the teacher's view reads results from
-- the server, and guests never write state to the network anywhere in the
-- app. Joining goes through the `join_class` RPC (security definer) so a
-- client never needs read access to classes it is not in — the code is the
-- only way in, and classes cannot be listed or searched.
--
-- Access model (RLS):
--   teachers          — read own row (admins read all); insert own row with
--                       verified_at null; only admins update (verify).
--   classes           — the owning teacher has full access; members read the
--                       classes they are in. Insert requires a teachers row.
--   class_members     — a member reads their own rows; the class's teacher
--                       reads the roster and may remove a member; a member may
--                       leave. Inserts only through join_class().
--   homework          — the class's teacher has full access; members read.
--   homework_attempts — a member inserts their own result for homework in a
--                       class they belong to; reads: own rows, or the class's
--                       teacher (that is the "who practised" view). No update
--                       or delete — a result, once posted, stays.

-- ── teachers ────────────────────────────────────────────────────────────
create table if not exists public.teachers (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 60),
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.teachers enable row level security;

drop policy if exists teachers_read on public.teachers;
create policy teachers_read on public.teachers
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists teachers_insert_own on public.teachers;
create policy teachers_insert_own on public.teachers
  for insert to authenticated
  with check (user_id = auth.uid() and verified_at is null);

drop policy if exists teachers_admin_update on public.teachers;
create policy teachers_admin_update on public.teachers
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── classes ─────────────────────────────────────────────────────────────
-- Join codes: 6 characters from an alphabet with no look-alikes (no 0/O,
-- 1/I/L), so a code read aloud or copied off a whiteboard survives.
create or replace function public.gen_class_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes where code = candidate);
  end loop;
  return candidate;
end;
$$;

create table if not exists public.classes (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null default auth.uid() references public.teachers (user_id) on delete cascade,
  -- Denormalised so a student sees who runs the class without reading teachers.
  teacher_name text check (teacher_name is null or char_length(teacher_name) <= 60),
  name         text not null check (char_length(name) between 1 and 60),
  code         text not null unique,
  created_at   timestamptz not null default now()
);

-- The default is set after the table exists because gen_class_code() reads it.
alter table public.classes alter column code set default public.gen_class_code();

create index if not exists classes_teacher_idx on public.classes (teacher_id);

-- ── class_members ───────────────────────────────────────────────────────
create table if not exists public.class_members (
  class_id     uuid not null references public.classes (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  -- What the teacher sees on the roster; picked by the student when joining.
  display_name text not null check (char_length(display_name) between 1 and 60),
  joined_at    timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index if not exists class_members_user_idx on public.class_members (user_id);

-- Membership / ownership helpers. SECURITY DEFINER so policies on classes and
-- class_members can consult each other without recursing through RLS.
create or replace function public.is_class_teacher(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.classes where id = cid and teacher_id = auth.uid());
$$;

create or replace function public.is_class_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.class_members where class_id = cid and user_id = auth.uid());
$$;

alter table public.classes       enable row level security;
alter table public.class_members enable row level security;

drop policy if exists classes_teacher_all on public.classes;
create policy classes_teacher_all on public.classes
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.teachers where user_id = auth.uid())
  );

drop policy if exists classes_member_read on public.classes;
create policy classes_member_read on public.classes
  for select to authenticated
  using (public.is_class_member(id));

drop policy if exists class_members_read on public.class_members;
create policy class_members_read on public.class_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_class_teacher(class_id));

drop policy if exists class_members_delete on public.class_members;
create policy class_members_delete on public.class_members
  for delete to authenticated
  using (user_id = auth.uid() or public.is_class_teacher(class_id));

-- Join a class by its code. Returns the class row (id, name, teacher_name,
-- code), or nothing when the code matches no class. Re-joining an existing
-- membership just updates the display name. A teacher cannot join their own
-- class as a student (nothing useful happens, and it would muddle the roster).
create or replace function public.join_class(join_code text, member_name text)
returns table (id uuid, name text, teacher_name text, code text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  target public.classes%rowtype;
  clean_name text := left(btrim(coalesce(member_name, '')), 60);
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if clean_name = '' then
    raise exception 'name required';
  end if;
  select * into target from public.classes c where c.code = upper(btrim(join_code));
  if not found then
    return;
  end if;
  if target.teacher_id = auth.uid() then
    raise exception 'own class';
  end if;
  insert into public.class_members (class_id, user_id, display_name)
  values (target.id, auth.uid(), clean_name)
  on conflict (class_id, user_id) do update set display_name = excluded.display_name;
  return query select target.id, target.name, target.teacher_name, target.code;
end;
$$;

revoke all on function public.join_class(text, text) from public;
grant execute on function public.join_class(text, text) to authenticated;

-- ── homework ────────────────────────────────────────────────────────────
create table if not exists public.homework (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 80),
  instrument_id text not null check (char_length(instrument_id) <= 20),
  -- A src/drill/DrillConfig, validated again by the client on read
  -- (src/teacher/homework.ts `parseHomeworkDrill`) — never trusted as-is.
  drill         jsonb not null,
  due_on        date,
  created_at    timestamptz not null default now()
);

create index if not exists homework_class_idx on public.homework (class_id, created_at desc);

alter table public.homework enable row level security;

drop policy if exists homework_teacher_all on public.homework;
create policy homework_teacher_all on public.homework
  for all to authenticated
  using (public.is_class_teacher(class_id))
  with check (public.is_class_teacher(class_id));

drop policy if exists homework_member_read on public.homework;
create policy homework_member_read on public.homework
  for select to authenticated
  using (public.is_class_member(class_id));

-- ── homework_attempts ───────────────────────────────────────────────────
create table if not exists public.homework_attempts (
  id          uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  -- Denormalised from homework so the RLS checks below need no join.
  class_id    uuid not null references public.classes (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  correct     integer not null check (correct >= 0),
  total       integer not null check (total > 0 and correct <= total),
  seconds     integer not null check (seconds >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists homework_attempts_homework_idx on public.homework_attempts (homework_id);
create index if not exists homework_attempts_class_idx on public.homework_attempts (class_id);

alter table public.homework_attempts enable row level security;

drop policy if exists homework_attempts_insert_own on public.homework_attempts;
create policy homework_attempts_insert_own on public.homework_attempts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_class_member(class_id)
    and exists (
      select 1 from public.homework h
      where h.id = homework_attempts.homework_id and h.class_id = homework_attempts.class_id
    )
  );

drop policy if exists homework_attempts_read on public.homework_attempts;
create policy homework_attempts_read on public.homework_attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_class_teacher(class_id));

grant usage on schema public to authenticated;
grant select, insert on public.teachers to authenticated;
grant update (verified_at) on public.teachers to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, delete on public.class_members to authenticated;
grant select, insert, update, delete on public.homework to authenticated;
grant select, insert on public.homework_attempts to authenticated;

-- ── Premium for active teachers ─────────────────────────────────────────
-- A teacher gets Premium for free, automatically, while at least one class
-- they run is "active": >= MIN_ACTIVE_STUDENTS members AND a homework_attempts
-- row within the last ACTIVE_WINDOW_DAYS days (see the literals inside
-- class_qualifies_for_premium() below — 6 students / 30 days are first
-- guesses, easy to retune, not load-bearing constants elsewhere).
--
-- `verified_at` above is a SEPARATE, admin-only override for a manual grant
-- (e.g. a partnership deal) — every function below skips a teacher whose
-- verified_at is set, so the automatic rule and an admin's manual call never
-- fight over the same public.entitlements row. Un-verifying falls back to
-- the automatic rule immediately (see sync_teacher_entitlement below) rather
-- than leaving the teacher with nothing until the next cron tick.
--
-- Losing the grant needs no new event (a class can simply go quiet), so a
-- daily pg_cron job re-evaluates every self-declared teacher and revokes
-- anyone who no longer qualifies. Gaining it is also pushed by a trigger on
-- homework_attempts / class_members insert, so crossing the threshold grants
-- immediately instead of waiting for the next cron run — the cron run is
-- only needed for the decay case.
--
-- *** pg_cron must be enabled by hand first (one-time, outside any
-- migration): Supabase dashboard → Database → Extensions → enable "pg_cron".
-- The DO block below detects whether that has happened yet; if not, it skips
-- scheduling and RAISEs the exact `cron.schedule(...)` call to run by hand
-- afterwards — it does not fail the rest of this migration. ***

alter table public.entitlements drop constraint if exists entitlements_source_check;
alter table public.entitlements
  add constraint entitlements_source_check
  check (source in ('manual', 'promo', 'revenuecat', 'stripe', 'play', 'comp', 'teacher'));

-- Does this one class currently meet the activity bar on its own?
create or replace function public.class_qualifies_for_premium(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.class_members where class_id = cid) >= 6  -- MIN_ACTIVE_STUDENTS
    and exists (
      select 1 from public.homework_attempts
      where class_id = cid and created_at > now() - interval '30 days'     -- ACTIVE_WINDOW_DAYS
    );
$$;

-- Grants/revokes the automatic 'teacher' Premium row for one teacher, based
-- on whether any class they run currently qualifies. No-ops for a teacher
-- with a manual verified_at override — that row belongs to the admin path.
-- The upsert's WHERE clause means it only ever touches a row this function
-- (or the manual-override trigger, same source) wrote — a paid/comp
-- entitlement of any other source is left alone either way.
create or replace function public.sync_teacher_premium(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  qualifies boolean;
begin
  if exists (select 1 from public.teachers where user_id = uid and verified_at is not null) then
    return;
  end if;
  select exists (
    select 1 from public.classes c
    where c.teacher_id = uid and public.class_qualifies_for_premium(c.id)
  ) into qualifies;
  if qualifies then
    insert into public.entitlements (user_id, tier, source, expires_at)
    values (uid, 'premium', 'teacher', null)
    on conflict (user_id) do update
      set tier = 'premium', expires_at = null, updated_at = now()
      where public.entitlements.source = 'teacher';
  else
    delete from public.entitlements where user_id = uid and source = 'teacher';
  end if;
end;
$$;

-- Daily sweep for the decay case: a class that went quiet needs no insert to
-- notice it lost Premium. Skips verified teachers for the same reason as
-- sync_teacher_premium (cheaper to filter here than call in per row).
create or replace function public.sync_all_teacher_premium()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
begin
  for t in select user_id from public.teachers where verified_at is null loop
    perform public.sync_teacher_premium(t.user_id);
  end loop;
end;
$$;

-- Immediate gain case: a homework_attempts/class_members insert that pushes a
-- class over the bar grants Premium right away instead of waiting for the
-- next cron tick. Both tables carry class_id directly (homework_attempts is
-- denormalised for this exact reason), so one trigger function serves both.
create or replace function public.trigger_sync_teacher_premium_for_class()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  select teacher_id into tid from public.classes where id = new.class_id;
  if tid is not null then
    perform public.sync_teacher_premium(tid);
  end if;
  return new;
end;
$$;

drop trigger if exists homework_attempts_sync_premium on public.homework_attempts;
create trigger homework_attempts_sync_premium
  after insert on public.homework_attempts
  for each row execute function public.trigger_sync_teacher_premium_for_class();

drop trigger if exists class_members_sync_premium on public.class_members;
create trigger class_members_sync_premium
  after insert on public.class_members
  for each row execute function public.trigger_sync_teacher_premium_for_class();

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'sync_teacher_premium_daily') then
      perform cron.unschedule('sync_teacher_premium_daily');
    end if;
    perform cron.schedule(
      'sync_teacher_premium_daily', '0 3 * * *', 'select public.sync_all_teacher_premium();'
    );
  else
    raise notice 'pg_cron extension is not enabled — enable it via the Supabase dashboard '
      '(Database > Extensions), then run by hand: select cron.schedule(''sync_teacher_premium_daily'', '
      '''0 3 * * *'', ''select public.sync_all_teacher_premium();'');';
  end if;
end $$;

-- ── Premium for the admin-verified override ─────────────────────────────
-- Separate from the automatic rule above: an admin may still grant Premium
-- to a specific teacher by hand (e.g. a partnership), independent of class
-- activity. This never fights the automatic rule — see the note at the top
-- of this section.
create or replace function public.sync_teacher_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verified_at is not null then
    insert into public.entitlements (user_id, tier, source, expires_at)
    values (new.user_id, 'premium', 'teacher', null)
    on conflict (user_id) do update
      set tier = 'premium', expires_at = null, updated_at = now()
      where public.entitlements.source = 'teacher';
  else
    delete from public.entitlements where user_id = new.user_id and source = 'teacher';
    -- Falling back from the manual override to the automatic rule: re-grant
    -- right away if an active class already qualifies, instead of leaving
    -- the teacher without Premium until the next cron tick.
    perform public.sync_teacher_premium(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists teachers_entitlement on public.teachers;
create trigger teachers_entitlement
  after insert or update of verified_at on public.teachers
  for each row execute function public.sync_teacher_entitlement();

-- Admin: grant the manual override (independent of class activity):
--   update public.teachers set verified_at = now()
--   where user_id = (select id from auth.users where lower(email) = 'someone@example.com');
-- Clear it with `verified_at = null` to fall back to the automatic rule.
