-- 0019_app_updates.sql
-- Run in the Supabase SQL Editor or via `supabase db push`.
--
-- Private distribution of the Android APK for the in-app self-update
-- (src/utils/appUpdate.ts + android-overrides/AppUpdaterPlugin.java).
--
-- The repo is public, so GitHub Releases would make every APK a public
-- download. Instead the Android workflow uploads each build to the PRIVATE
-- Storage bucket `app-releases`:
--   apk/app-<versionCode>.apk   the signed APK
--   latest.json                 {"versionCode": N, "versionName": "1.0.N", "path": "apk/app-N.apk"}
-- (written with the service-role key, which bypasses RLS — no client write
-- policy exists).
--
-- Who may download: admins (public.admins, 0005) and the accounts listed in
-- public.apk_testers. Everyone else — guests, other signed-in users, the open
-- internet — gets nothing: the bucket is not public, and the only read policy
-- below checks can_download_apk(). The app signs a short-lived URL for the
-- APK only after that policy lets it read latest.json.
--
-- Add a tester (they must have signed in once so the auth.users row exists):
--   insert into public.apk_testers (user_id)
--   select id from auth.users where email = 'someone@example.com'
--   on conflict do nothing;
-- To open downloads to every signed-in user later, change the policy's
-- `using` to `bucket_id = 'app-releases'`.

insert into storage.buckets (id, name, public)
values ('app-releases', 'app-releases', false)
on conflict (id) do update set public = false;

create table if not exists public.apk_testers (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.apk_testers enable row level security;

-- apk_testers: a user may see only their own row; writes are SQL-Editor only.
drop policy if exists apk_testers_select_own on public.apk_testers;
create policy apk_testers_select_own on public.apk_testers
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.can_download_apk()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (select 1 from public.apk_testers where user_id = auth.uid());
$$;

revoke all on function public.can_download_apk() from public;
grant execute on function public.can_download_apk() to authenticated;
grant select on public.apk_testers to authenticated;

-- storage.objects: read (download + createSignedUrl) for allowed accounts only.
drop policy if exists app_releases_read on storage.objects;
create policy app_releases_read on storage.objects
  for select
  to authenticated
  using (bucket_id = 'app-releases' and public.can_download_apk());
