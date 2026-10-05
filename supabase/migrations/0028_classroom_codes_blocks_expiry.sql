-- 0028_classroom_codes_blocks_expiry.sql
-- Run in the Supabase SQL Editor or via `supabase db push`, after 0026 and 0027.
--
-- Teacher mode, second slice (owner decisions 2026-10-05):
--
-- 1. Teacher-chosen join codes. The teacher picks the code (and may change
--    it later): 6–10 Latin letters and digits, at least one of each, CASE-
--    SENSITIVE ("Guitar7" and "guitar7" are two different codes). A code is
--    unique across the whole system, and so is a class name (compared
--    case-insensitively, ignoring outer spaces) — two classes can never share
--    a name or a code. The server no longer generates codes; the old
--    generated codes (6 upper-case characters, maybe no digit) keep working,
--    because the format rule is a trigger that runs only when a code is SET.
--
-- 2. Blocking. A teacher removes a student, optionally blocking them. A
--    block belongs to the student's ACCOUNT in that class, not to the code:
--    changing the code does not let a blocked student back in. The teacher
--    sees the blocked list and can unblock. Removal (with or without a
--    block) goes through remove_class_member() so the two writes are atomic.
--
-- 3. Inactive classes are deleted, so names and codes don't stay taken
--    forever. `last_activity_at` moves on a homework attempt, a student
--    joining, or the teacher assigning homework (the owner's definition of
--    "activity"). A class with no activity for 6 months is deleted by a daily
--    pg_cron job, with its homework and results. The app warns the teacher
--    from 5 months on (one month ahead) and shows a weekly-idle notice from 7
--    days — computed client-side from `last_activity_at`
--    (src/teacher/classActivity.ts). Server push for those notices is NOT
--    built yet (see the wishlist); it would read the same column.
--
-- 4. Join throttling. Codes are now human-chosen and so more guessable, so
--    join_class() refuses a user after 10 wrong codes within 10 minutes.
--
-- pg_cron: same as 0026 — if the extension isn't enabled yet, the DO block at
-- the bottom only RAISEs the exact schedule call to run by hand later.

-- ── 1. Codes and names ──────────────────────────────────────────────────
alter table public.classes alter column code drop default;

-- The format rule is a trigger that fires only when the code is SET, not a
-- CHECK constraint: Postgres re-checks even a NOT VALID constraint on every
-- update of a row, so an old generated code (often no digit) would make
-- ANY later update of that class fail — including the activity clock that
-- touch_class_activity() moves on every homework attempt. The error keeps
-- the name `classes_code_format` and SQLSTATE 23514 (check_violation),
-- which is what src/teacher/classroom.ts maps to "code not valid".
create or replace function public.check_class_code_format()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.code is distinct from old.code then
    if new.code is null
       or new.code !~ '^[A-Za-z0-9]{6,10}$'
       or new.code !~ '[A-Za-z]'
       or new.code !~ '[0-9]' then
      raise exception 'new row for relation "classes" violates classes_code_format'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists classes_code_format on public.classes;
create trigger classes_code_format
  before insert or update of code on public.classes
  for each row execute function public.check_class_code_format();

-- 0026 is live, so two existing classes may already share a name. Keep the
-- oldest one as it is and give each later one a " (2)", " (3)" … suffix
-- (trimmed to the 60-character limit), so the unique index below can be built.
-- The teacher sees the new name in the app.
with ranked as (
  select id, name,
         row_number() over (partition by lower(btrim(name)) order by created_at, id) as n
  from public.classes
)
update public.classes c
set name = left(btrim(r.name), 60 - char_length(' (' || r.n || ')')) || ' (' || r.n || ')'
from ranked r
where c.id = r.id and r.n > 1;

create unique index if not exists classes_name_unique
  on public.classes (lower(btrim(name)));

-- ── 3. Activity column (here, before the functions that use it) ─────────
alter table public.classes
  add column if not exists last_activity_at timestamptz not null default now();

-- Backfill from what already happened, so an existing quiet class isn't
-- handed six fresh months by the column default.
update public.classes c set last_activity_at = greatest(
  c.created_at,
  coalesce((select max(created_at) from public.homework_attempts a where a.class_id = c.id), c.created_at),
  coalesce((select max(joined_at)  from public.class_members m     where m.class_id = c.id), c.created_at),
  coalesce((select max(created_at) from public.homework h          where h.class_id = c.id), c.created_at)
);

-- A teacher may change only the name and the code of a class they own — not
-- last_activity_at (which would keep a dead class alive), not teacher_id.
-- The row-level policy from 0026 still decides WHICH rows.
revoke insert, update on public.classes from authenticated;
grant insert (name, code, teacher_name) on public.classes to authenticated;
grant update (name, code) on public.classes to authenticated;

-- ── 2. Blocks ───────────────────────────────────────────────────────────
create table if not exists public.class_blocks (
  class_id     uuid not null references public.classes (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  -- The name the student had on the roster, so the teacher knows who it is.
  display_name text not null check (char_length(display_name) between 1 and 60),
  blocked_at   timestamptz not null default now(),
  primary key (class_id, user_id)
);

alter table public.class_blocks enable row level security;

-- The class's teacher reads and lifts blocks. Writes go through
-- remove_class_member(); nobody inserts directly. A blocked student never
-- reads this table (join_class tells them).
drop policy if exists class_blocks_teacher_read on public.class_blocks;
create policy class_blocks_teacher_read on public.class_blocks
  for select to authenticated
  using (public.is_class_teacher(class_id));

drop policy if exists class_blocks_teacher_delete on public.class_blocks;
create policy class_blocks_teacher_delete on public.class_blocks
  for delete to authenticated
  using (public.is_class_teacher(class_id));

grant select, delete on public.class_blocks to authenticated;

create or replace function public.remove_class_member(cid uuid, member uuid, block boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  member_name text;
begin
  if not public.is_class_teacher(cid) then
    raise exception 'not your class';
  end if;
  select display_name into member_name
  from public.class_members where class_id = cid and user_id = member;
  if block then
    insert into public.class_blocks (class_id, user_id, display_name)
    values (cid, member, coalesce(member_name, '?'))
    on conflict (class_id, user_id) do nothing;
  end if;
  delete from public.class_members where class_id = cid and user_id = member;
end;
$$;

revoke all on function public.remove_class_member(uuid, uuid, boolean) from public;
grant execute on function public.remove_class_member(uuid, uuid, boolean) to authenticated;

-- ── 4. Join throttling ──────────────────────────────────────────────────
create table if not exists public.class_join_failures (
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists class_join_failures_user_idx on public.class_join_failures (user_id, at);
-- RLS on with no policies: only the security-definer functions touch it.
alter table public.class_join_failures enable row level security;

-- join_class, revised: exact (case-sensitive) code match, the block check,
-- and the throttle. Same signature and return shape as 0026's version.
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
  if (select count(*) from public.class_join_failures f
      where f.user_id = auth.uid() and f.at > now() - interval '10 minutes') >= 10 then
    raise exception 'too many attempts';
  end if;
  select * into target from public.classes c where c.code = btrim(join_code);
  if not found then
    insert into public.class_join_failures (user_id) values (auth.uid());
    return;
  end if;
  if target.teacher_id = auth.uid() then
    raise exception 'own class';
  end if;
  if exists (select 1 from public.class_blocks b
             where b.class_id = target.id and b.user_id = auth.uid()) then
    raise exception 'blocked';
  end if;
  insert into public.class_members (class_id, user_id, display_name)
  values (target.id, auth.uid(), clean_name)
  on conflict (class_id, user_id) do update set display_name = excluded.display_name;
  return query select target.id, target.name, target.teacher_name, target.code;
end;
$$;

revoke all on function public.join_class(text, text) from public;
grant execute on function public.join_class(text, text) to authenticated;

-- ── 3. Activity tracking and the purge ──────────────────────────────────
-- SECURITY DEFINER: a student's attempt/join must move the class's clock
-- although students cannot update classes. A rejoin (ON CONFLICT DO UPDATE)
-- fires no AFTER INSERT trigger, so it does not count — it isn't new activity.
create or replace function public.touch_class_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.classes set last_activity_at = now() where id = new.class_id;
  return new;
end;
$$;

drop trigger if exists homework_attempts_touch_class on public.homework_attempts;
create trigger homework_attempts_touch_class
  after insert on public.homework_attempts
  for each row execute function public.touch_class_activity();

drop trigger if exists class_members_touch_class on public.class_members;
create trigger class_members_touch_class
  after insert on public.class_members
  for each row execute function public.touch_class_activity();

drop trigger if exists homework_touch_class on public.homework;
create trigger homework_touch_class
  after insert on public.homework
  for each row execute function public.touch_class_activity();

-- Daily: delete classes idle for 6 months (cascades to members, blocks,
-- homework and attempts), re-check their teachers' automatic Premium right
-- away instead of waiting for 0026's sweep, and drop old join failures.
-- Keep the 6 months in step with CLASS_DELETE_AFTER_MONTHS in
-- src/teacher/classActivity.ts.
create or replace function public.purge_inactive_classes()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  teacher_ids uuid[];
  tid uuid;
begin
  -- Collected into an array first: a data-modifying CTE can't drive a
  -- FOR loop's cursor directly.
  with gone as (
    delete from public.classes
    where last_activity_at < now() - interval '6 months'
    returning teacher_id
  )
  select array_agg(distinct teacher_id) into teacher_ids from gone;
  foreach tid in array coalesce(teacher_ids, '{}'::uuid[]) loop
    perform public.sync_teacher_premium(tid);
  end loop;
  delete from public.class_join_failures where at < now() - interval '1 day';
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'purge_inactive_classes_daily') then
      perform cron.unschedule('purge_inactive_classes_daily');
    end if;
    perform cron.schedule(
      'purge_inactive_classes_daily', '30 2 * * *', 'select public.purge_inactive_classes();'
    );
  else
    raise notice 'pg_cron extension is not enabled — enable it via the Supabase dashboard '
      '(Database > Extensions), then run by hand: select cron.schedule(''purge_inactive_classes_daily'', '
      '''30 2 * * *'', ''select public.purge_inactive_classes();'');';
  end if;
end $$;
