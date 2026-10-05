-- 0031_classroom_join_requires_pro.sql
-- Run in the Supabase SQL Editor or via `supabase db push`, after 0026/0028.
--
-- Owner decision (2026-10-06), interim child-safety/consent mechanism for the
-- student join path — NOT a full COPPA compliance solution. Full legal
-- review is explicitly deferred to the Google Play publishing phase; this is
-- only the base layer the owner wants shipped now (see the wishlist entry
-- added alongside this migration). The reasoning: a paid tier implies an
-- adult's payment method was involved somewhere, which is a real
-- COPPA-recognized consent signal, paired with an explicit self-certification
-- checkbox at the moment of joining.
--
-- Two new server-side requirements on `join_class`, both enforced in the RPC
-- (never trust the client-side checkbox alone):
--   1. The joining account must be Pro or Premium (or mid the reverse Premium
--      trial, which floors a signed-in user at Premium — see
--      src/utils/trial.ts `syncTrialStart` / `public.premium_trial`, 0024 —
--      even though such a user has no `public.entitlements` row). Free
--      Premium via the teacher-activity grant (`entitlements.source =
--      'teacher'`) also qualifies: it is still tier >= 'pro'.
--   2. The caller must pass `self_certified = true` (the UI disables the Join
--      button until its checkbox is checked). On success, the exact moment is
--      stamped on the new membership row (`class_members.age_certified_at`)
--      as an audit trail.
--
-- Both failures raise a distinguishable exception so the client can show an
-- upsell / re-prompt instead of the generic "something went wrong":
--   'requires_pro'            — tier check failed
--   'certification required'  — checkbox not passed as true
--
-- Does NOT touch class creation (teacher side stays ungated) and does NOT
-- retroactively touch existing `class_members` rows — a pre-existing member's
-- `age_certified_at` stays null, meaning "joined before this requirement".

alter table public.class_members
  add column if not exists age_certified_at timestamptz;

-- 7 days here must stay in step with TRIAL_DAYS in src/utils/trial.ts — it is
-- not read from anywhere else, so a future change to TRIAL_DAYS needs a
-- matching edit to the literal below.
create or replace function public.join_class(join_code text, member_name text, self_certified boolean)
returns table (id uuid, name text, teacher_name text, code text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  target public.classes%rowtype;
  clean_name text := left(btrim(coalesce(member_name, '')), 60);
  qualifies_pro boolean;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if coalesce(self_certified, false) is not true then
    raise exception 'certification required';
  end if;

  select
    exists (
      select 1 from public.entitlements
      where user_id = auth.uid()
        and tier in ('pro', 'premium')
        and (expires_at is null or expires_at > now())
    )
    or exists (
      select 1 from public.premium_trial
      where user_id = auth.uid()
        and started_at > now() - interval '7 days' -- TRIAL_DAYS, src/utils/trial.ts
    )
  into qualifies_pro;
  if not qualifies_pro then
    raise exception 'requires_pro';
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
  insert into public.class_members (class_id, user_id, display_name, age_certified_at)
  values (target.id, auth.uid(), clean_name, now())
  on conflict (class_id, user_id) do update
    set display_name = excluded.display_name,
        age_certified_at = coalesce(public.class_members.age_certified_at, excluded.age_certified_at);
  return query select target.id, target.name, target.teacher_name, target.code;
end;
$$;

-- The old 2-argument overload would otherwise stay callable (and un-gated)
-- side by side with the new 3-argument one.
drop function if exists public.join_class(text, text);

revoke all on function public.join_class(text, text, boolean) from public;
grant execute on function public.join_class(text, text, boolean) to authenticated;
