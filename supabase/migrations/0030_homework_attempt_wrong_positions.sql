-- 0030_homework_attempt_wrong_positions.sql
-- Run in the Supabase SQL Editor or via `supabase db push`, after 0026.
--
-- Teacher mode weak-spots: homework_attempts (0026) so far only records
-- correct/total/seconds for one run — enough for "did they practise" but not
-- "WHICH positions they actually got wrong". This adds one nullable jsonb
-- column, `wrong_positions`, holding the fret positions missed on that run:
-- an array of `{"string": <1-based string number>, "fret": <0-based fret>}`
-- objects, one per question the student did not get right (wrong, skipped,
-- or timed out) — written client-side by HomeworkRun.tsx from the same
-- in-memory history sink `summariseAttempts`'s correct/total already comes
-- from (src/teacher/homework.ts `extractWrongPositions`), mirroring how
-- src/utils/mastery.ts aggregates right/wrong per position for Practice.
--
-- Nullable and additive: existing rows keep `wrong_positions is null` and
-- read back as "no detail available" rather than "nothing was missed" (see
-- `classWeakSpots` in homework.ts, which simply skips null rows). No RLS
-- change needed — it's just another column on a row the existing
-- homework_attempts_insert_own / homework_attempts_read policies already
-- cover.
--
-- Numbered 0030 (not 0027/0029, already teacher-exam; confirmed against both
-- the local checkout and origin/main before writing this file — see the
-- 0021 header for why a collision here would be a real problem, not cosmetic).

alter table public.homework_attempts
  add column if not exists wrong_positions jsonb;

-- Loose shape guard: null is fine (no detail), otherwise must be a jsonb
-- array. Per-element shape is validated by the client, not re-checked here —
-- same trust split as `homework.drill` (0026's comment on that column).
alter table public.homework_attempts drop constraint if exists homework_attempts_wrong_positions_is_array;
alter table public.homework_attempts
  add constraint homework_attempts_wrong_positions_is_array
  check (wrong_positions is null or jsonb_typeof(wrong_positions) = 'array');
