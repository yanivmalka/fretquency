-- 0029_teacher_exam_admin_skip_student_visibility.sql
-- Run in the Supabase SQL Editor or via `supabase db push`.
--
-- Two product-owner requests on top of 0027_teacher_exam.sql:
--
-- 1. Admins skip the teacher test. They already hold Premium (and every
--    paid feature) regardless of teacher status, so making them actually
--    learn the music theory to unlock Class-teaching gains nothing. The
--    client's "Skip (admin)" button calls `teacher_exam_admin_skip()`,
--    which inserts the `teachers` row directly — gated on `is_admin()`
--    server-side, exactly like every other admin-only write in this app.
--    A non-admin calling it gets nothing (silently returns 'not_admin'),
--    so it is harmless to leave callable.
--
-- 2. The Teacher badge is always public (any viewer sees it on another
--    player's profile — a teacher *wants* to be recognisable to prospective
--    students); the Student badge is opt-in (a student may not want
--    classmates or strangers on the leaderboard to see which class they are
--    in). `public.user_badges` (0008/0022) is already fully public-read, so
--    the opt-in has to live there too and be enforced where the row is READ
--    for another player, not by the client: `student_visible` defaults to
--    false, and `fetchPublicBadges` (badgeSync.ts) strips the 'student' key
--    from what it returns unless that flag is true. The owner's own wall
--    never calls `fetchPublicBadges` on themselves — it reads the local/
--    synced store directly — so hiding it from others never hides it from
--    its own owner.

alter table public.user_badges
  add column if not exists student_visible boolean not null default false;

-- ── Admin skip ──────────────────────────────────────────────────────────
create or replace function public.teacher_exam_admin_skip()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not public.is_admin() then
    return jsonb_build_object('status', 'not_admin');
  end if;
  if exists (select 1 from public.teachers where user_id = uid) then
    return jsonb_build_object('status', 'already');
  end if;
  insert into public.teachers (user_id, display_name) values (uid, null);
  return jsonb_build_object('status', 'skipped');
end;
$$;

revoke all on function public.teacher_exam_admin_skip() from public, anon, authenticated;
grant execute on function public.teacher_exam_admin_skip() to authenticated;
