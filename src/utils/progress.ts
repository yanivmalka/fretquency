// All-time, cross-settings aggregation for the Progress screen. Everything
// here is a pure function over the `allHistory` map (every `historyKey`
// bucket flattened together) plus the per-key `best_<key>` records. It never
// writes — StatsPanel stays the owner of per-session/per-combination display,
// this module answers "am I improving over time?".

import type { HistoryEntry } from './music';
import { noteMasteryMap, instrumentOfKey } from './mastery';
import { loadAllBests, type PersonalBest } from './personalBest';
import { FREE_HISTORY_DAYS } from './features';

// The trailing slice of practice history a free user is shown in the Stats &
// Progress screen (spec free-pro-tiering §5.1). This is a *view filter* only:
// every row is still recorded, synced to Supabase and restored to every
// device, and XP / badges / the leaderboard all keep reading the full set.
// Entries without a `createdAt` (localStorage rows that predate timestamp
// stamping) fall outside the window — the same treatment `dailyStats` gives
// them. `ProgressPanel` is the only caller; nothing else applies the window.
export function withinFreeWindow(entries: HistoryEntry[]): HistoryEntry[] {
  const cut = Date.now() - FREE_HISTORY_DAYS * 864e5;
  return entries.filter(e => e.createdAt && Date.parse(e.createdAt) >= cut);
}

export interface DayStat {
  date: string; // YYYY-MM-DD
  count: number;
  accuracy: number; // 0-1 over all recorded questions that day
  avgSeconds: number; // mean answer time of correct answers, 0 if none
}

// One row per calendar day that has history, oldest first. Rows without a
// `createdAt` (localStorage entries that predate id/timestamp stamping) can't
// be placed on the timeline and are skipped here — the lifetime totals below
// still count them.
export function dailyStats(entries: HistoryEntry[]): DayStat[] {
  const byDay = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    if (!e.createdAt) continue;
    const day = e.createdAt.slice(0, 10);
    const list = byDay.get(day);
    if (list) list.push(e);
    else byDay.set(day, [e]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, es]) => {
      const correct = es.filter(e => e.correct === true);
      const avgSeconds = correct.length > 0
        ? correct.reduce((s, e) => s + e.seconds, 0) / correct.length
        : 0;
      return {
        date,
        count: es.length,
        accuracy: es.length > 0 ? correct.length / es.length : 0,
        avgSeconds,
      };
    });
}

export interface StreakInfo {
  current: number; // consecutive practice days ending today or yesterday
  longest: number;
}

function isNextDay(a: string, b: string): boolean {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return db - da === 86_400_000;
}

export function practiceStreak(days: DayStat[]): StreakInfo {
  const dates = days.map(d => d.date); // sorted asc, unique
  if (dates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (isNextDay(dates[i - 1], dates[i])) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const last = dates[dates.length - 1];
  let current = 0;
  if (last === today || isNextDay(last, today)) {
    current = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      if (isNextDay(dates[i - 1], dates[i])) current++;
      else break;
    }
  }

  return { current, longest: Math.max(longest, current) };
}

// Free, every-tier home-screen goal (not the Premium Teacher's per-domain
// `DailyGoal` in learningState.ts — this one needs no SRS plan, just "answer
// this many questions today", so it's derived straight from history with no
// new persistence, same as the streak above.
export const DAILY_GOAL_TARGET = 10;

/** Today's question count from an already-computed `DayStat[]` (oldest
 *  first, one row per day that has history) — 0 if nothing is recorded yet
 *  today. */
export function todayCount(days: DayStat[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const last = days[days.length - 1];
  return last && last.date === today ? last.count : 0;
}

export interface LifetimeTotals {
  totalQuestions: number;
  accuracy: number; // 0-1
  avgSeconds: number;
  bestSeconds: number;
  daysPracticed: number;
}

export function lifetimeTotals(entries: HistoryEntry[], days: DayStat[]): LifetimeTotals {
  const correct = entries.filter(e => e.correct === true);
  return {
    totalQuestions: entries.length,
    accuracy: entries.length > 0 ? correct.length / entries.length : 0,
    avgSeconds: correct.length > 0
      ? correct.reduce((s, e) => s + e.seconds, 0) / correct.length
      : 0,
    bestSeconds: correct.length > 0 ? Math.min(...correct.map(e => e.seconds)) : 0,
    daysPracticed: days.length,
  };
}

export interface WeakSpot {
  label: string; // raw note name — caller formats via displayNote
  accuracy: number; // 0-1
}

// The weakest note names across all-time history (mastery level 'needsWork'),
// worst first. Reuses the same categorisation as the fretboard equalizer.
export function weakNotes(entries: HistoryEntry[], noteNames: string[], limit = 6): WeakSpot[] {
  const map = noteMasteryMap(entries, noteNames);
  return Object.entries(map)
    .filter(([, s]) => s.level === 'needsWork')
    .sort(([, a], [, b]) => a.accuracy - b.accuracy)
    .slice(0, limit)
    .map(([label, s]) => ({ label, accuracy: s.accuracy }));
}

// ── Adaptive difficulty suggestion ──────────────────────────────
// Pure read over one settings combination's recent history: is the drill now
// too easy or too hard for the player? The caller (App) turns a 'harder' /
// 'easier' verdict into a concrete Selector change (a difficulty step) and
// shows a one-off banner with an "apply" button. This is a suggestion layered
// over the Selector model — it does NOT revive the old Stage sequence.

// Look at the last N answered questions for the combination…
export const SUGGEST_WINDOW = 20;
// …but never suggest on fewer than this, so a handful of lucky/unlucky
// answers can't move someone.
export const SUGGEST_MIN_SAMPLE = 15;
// accuracy ≥ this over the window ⇒ ready for something harder.
export const SUGGEST_HARDER_AT = 0.9;
// accuracy ≤ this ⇒ drop back to something easier.
export const SUGGEST_EASIER_AT = 0.6;

export type Adjustment = 'harder' | 'easier';

// `entries` must already be scoped to a single `historyKey` (App passes
// `getEntriesForKey(histKey)`). Accuracy is `correct / total` over the trailing
// window, counting timeouts and skips against the player exactly the way
// `mastery.ts` and `dailyStats` do — those are the "I don't know" signal that
// should pull a suggestion toward 'easier'.
export function suggestAdjustment(entries: HistoryEntry[]): Adjustment | null {
  const recent = entries.slice(-SUGGEST_WINDOW);
  if (recent.length < SUGGEST_MIN_SAMPLE) return null;
  const correct = recent.filter(e => e.correct === true).length;
  const accuracy = correct / recent.length;
  if (accuracy >= SUGGEST_HARDER_AT) return 'harder';
  if (accuracy <= SUGGEST_EASIER_AT) return 'easier';
  return null;
}

export interface BestSummary {
  key: string; // historyKey the record is scoped to
  best: PersonalBest;
}

// `instrumentId` (optional) restricts the list to personal bests recorded on
// that instrument — the `best_<key>` records share the `historyKey` shape, so
// the same prefix convention identifies the instrument.
export function allBestsSummary(instrumentId?: string): BestSummary[] {
  return Object.entries(loadAllBests())
    .filter(([key]) => !instrumentId || instrumentOfKey(key) === instrumentId)
    .map(([key, best]) => ({ key, best }))
    .sort((a, b) => b.best.score - a.best.score);
}
