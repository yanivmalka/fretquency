// A single device-local "did the player practise on local day X" record,
// shared by every practice source — Practice (and Fret of the Day, which
// writes through the same `addEntry`), Homework (HomeworkRun.tsx, which
// otherwise only writes an in-memory history sink), and every Premium Learn
// domain (Teacher notes, Intervals, Scales, Staff, Tabs). The home screen's
// `DailyStreakBar` reads this instead of Practice's own per-instrument
// history (product review 2026-10-05 §3ב items 6–7 / §4 item 3): a student
// who only did homework, or a Premium learner who only practises Staff
// reading, must still see their streak and daily goal move.
//
// Local day, not UTC (review §3ב item 5) — `localDay()` reads the device's
// own calendar fields, so a player's "today" never flips at a UTC boundary
// that doesn't match their timezone. Cross-instrument by design (the log
// carries no instrument id): switching instrument must not reset the streak.
//
// Device-local only — never synced to Supabase, never read by Practice's
// history / mastery / personal-best / leaderboard / SRS, and not a
// replacement for `src/utils/progress.ts` (which stays the Stats screen's
// Practice-only, per-instrument view). Best-effort; a write that throws
// (private mode, full quota) is silently dropped, same as every other
// localStorage-backed module here.

const STORAGE_KEY = 'dailyActivityLog';
const MAX_DAYS_KEPT = 400;
const UPDATE_EVENT = 'daily-activity-updated';

/** Local calendar day as `YYYY-MM-DD`, from the device's own date fields —
 *  deliberately not `toISOString()`, which reads UTC and can disagree with
 *  the player's local day by several hours. */
export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadLog(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLog(log: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    /* private mode / quota — best-effort only */
  }
}

/** Record one answered question toward today's local-day activity log. Call
 *  this from every practice source's own "one question was answered" choke
 *  point — never from a sync/merge/restore path, which must not count as
 *  practice. Fires a `daily-activity-updated` window event so a mounted
 *  `DailyStreakBar` / reminder hook can react without re-reading on a timer. */
export function recordDailyActivity(count = 1): void {
  if (count <= 0) return;
  const day = localDay();
  const log = loadLog();
  log[day] = (log[day] ?? 0) + count;
  const days = Object.keys(log).sort();
  if (days.length > MAX_DAYS_KEPT) {
    for (const d of days.slice(0, days.length - MAX_DAYS_KEPT)) delete log[d];
  }
  saveLog(log);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }
}

export function onDailyActivityUpdated(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(UPDATE_EVENT, cb);
  return () => window.removeEventListener(UPDATE_EVENT, cb);
}

/** Today's recorded count, across every source and instrument. */
export function todayActivityCount(): number {
  return loadLog()[localDay()] ?? 0;
}

export interface ActivityStreak {
  current: number;
  longest: number;
}

function parseLocalDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0); // noon dodges DST edges
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseLocalDay(b).getTime() - parseLocalDay(a).getTime()) / 86_400_000);
}

/** Monday-anchored week key for a local day, so "one freeze per week" means
 *  one per real calendar week rather than a rolling 7-day window. */
function weekKeyOf(day: string): string {
  const d = parseLocalDay(day);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return localDay(d);
}

/** Consecutive-day streak over the activity log, local-day based and
 *  instrument-agnostic, bridging at most one missed day per calendar week
 *  when `freezeEnabled` (product review §4 item 4 — "one streak freeze per
 *  week"). A bridged day does not itself count toward `current`/`longest`,
 *  it just keeps the chain from breaking. */
export function activityStreak(freezeEnabled = true): ActivityStreak {
  const log = loadLog();
  const days = Object.keys(log).filter((d) => log[d] > 0).sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  const longestFreezeUsed = new Set<string>();
  for (let i = 1; i < days.length; i++) {
    const gap = daysBetween(days[i - 1], days[i]);
    if (gap === 1) {
      run++;
    } else if (freezeEnabled && gap === 2 && !longestFreezeUsed.has(weekKeyOf(days[i]))) {
      longestFreezeUsed.add(weekKeyOf(days[i]));
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  const today = localDay();
  const last = days[days.length - 1];
  const gapToToday = daysBetween(last, today);
  let current = 0;
  if (gapToToday <= 1) {
    current = 1;
    const freezeUsed = new Set<string>();
    for (let i = days.length - 1; i > 0; i--) {
      const gap = daysBetween(days[i - 1], days[i]);
      if (gap === 1) current++;
      else if (freezeEnabled && gap === 2 && !freezeUsed.has(weekKeyOf(days[i]))) {
        freezeUsed.add(weekKeyOf(days[i]));
        current++;
      } else break;
    }
  }

  return { current, longest: Math.max(longest, current) };
}
