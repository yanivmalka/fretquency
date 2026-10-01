// ── learningState.ts — the Premium Teacher's persisted model (local) ─────
//
// localStorage is the immediate / offline source of truth for the Teacher,
// exactly like the rest of the app (history, settings, badges). The cloud
// layer (`learningSync.ts`) sits on top and is best-effort.
//
// One `localStorage['learningState']` key holds a map of instrument id →
// per-instrument state, so a guitar learner and a bass learner never mix:
//
//   { version, instruments: { guitar: {...}, bass: {...} } }
//
// Per instrument we keep:
//   • srs             — NoteItem id → SrsItem (the Leitner schedule; see srs.ts)
//   • intervalSrs     — interval-quality id → SrsItem (P4, a separate lane)
//   • daily           — today's prescribed *note* goal: date, target, completed
//   • intervalDaily   — today's prescribed *interval* goal (0015, separate — OD-5)
//   • intervalHistory — a capped, synced ring buffer of interval answers (0015)
//   • path            — Learning Path checkpoint stars (notes only)
//   • scaleSrs        — (scaleType, position)-item id → SrsItem (P5, a separate
//                        lane — scales-learning-spec.md §10.1)
//   • scaleHistory    — a capped ring buffer of scale-drill answers (§10.3,
//                        §15)
//   • staffSrs        — written-pitch item id → SrsItem (Staff reading, its own
//                        lane — staff-reading-spec.md §8)
//   • staffHistory    — a capped ring buffer of staff-reading answers
//   • staffDaily      — today's staff-reading goal (its own record, like
//                        `intervalDaily`, never the note `daily`)
//   • tabSrs / tabHistory / tabDaily — the Tab reading lane, the same three
//                        pieces again (tab-reading-spec.md §8)
//
// Every field above rides the same synced blob (`learningSync.ts`): the
// scale, staff and tab fields are merged per item like the rest, and the
// scale, staff and tab screens trigger the cloud push after each answer.
//   • updatedAt
//
// This module is pure model + persistence. It does NOT import the sync layer
// (mirrors how `badges.ts` stays independent of `badgeSync.ts`); the hook
// that uses it triggers the cloud push after a local save.

import {
  reviewSrsItem,
  getOrCreate,
  mergeSrsMaps,
  type SrsItem,
  type SrsMap,
} from './srs';
import { noteItemId } from './noteItem';
import { parseScaleItemId } from './scaleItem';
import { parseStaffItemId } from './staffItem';
import { isValidTabItemId } from './tabItem';
import {
  emptyPathProgress,
  normalizePathProgress,
  mergePathProgress,
  foldCheckpointStars,
  type PathProgress,
} from './pathProgress';

export const LEARNING_STORAGE_KEY = 'learningState';

// One Teacher session is roughly this many answered items; the daily goal is
// "do one session".
export const DEFAULT_DAILY_TARGET = 12;

// Interval sessions are shorter (only 11 items, denser questions), so their
// own daily goal starts lower than the note goal. First draft — tune in
// playtest (spec §14.2).
export const DEFAULT_INTERVAL_DAILY_TARGET = 10;

// The interval answer history is a small synced ring buffer per instrument —
// enough for weakness analysis and the Stats board, never the full answer log
// (spec §15.2 / OD-6).
export const INTERVAL_HISTORY_CAP = 200;

// Same idea, scale domain (scales-learning-spec.md §10.3 / §15.2).
export const SCALE_HISTORY_CAP = 200;

// Same idea, staff-reading domain (staff-reading-spec.md §8). A little larger:
// one "read a phrase" session records a row per note (6 phrases × 4 notes).
export const STAFF_HISTORY_CAP = 300;

// One staff-reading session of single notes is 12 questions; the daily goal
// is "do one session" (staff-reading-spec.md §8).
export const DEFAULT_STAFF_DAILY_TARGET = 12;

// Same again for Tab reading (tab-reading-spec.md §8): one riff session
// records a row per note (6 riffs × 5 notes), and the daily goal is one
// session of single notes.
export const TAB_HISTORY_CAP = 300;
export const DEFAULT_TAB_DAILY_TARGET = 12;

export interface DailyGoal {
  /** Local calendar day, `YYYY-MM-DD`. */
  dateISO: string;
  /** Teacher items to answer today. */
  target: number;
  /** Teacher items answered today so far. */
  completed: number;
}

/** One recorded interval-drill answer. A capped, synced ring buffer of these
 *  (`InstrumentLearningState.intervalHistory`) feeds `analyzeIntervalWeakness`
 *  and the interval Stats board. It is NEVER merged into note history / stats
 *  / mastery / badges / leaderboard (spec §15.2, OD-6). */
export interface IntervalHistoryRow {
  /** Interval size in semitones, 1..11 (an `interval:<n>` quality). */
  semitones: number;
  /** Which way the interval was drilled for this question. Not part of the SRS
   *  item — an ascending and a descending M3 both review `interval:4`. */
  dir: 'up' | 'down';
  /** Which exercise produced the answer. */
  form: 'identify' | 'findNote' | 'findPosition';
  /** A timeout folds in here as `false`, matching the SRS treatment. */
  correct: boolean;
  /** Seconds taken; `0` when unknown. */
  seconds: number;
  /** Epoch ms — the dedupe / cap-by-recency key on merge. */
  createdAt: number;
}

/** One recorded scale-drill answer (scales-learning-spec.md §10.3). A capped
 *  ring buffer of these (`InstrumentLearningState.scaleHistory`) feeds
 *  `analyzeScaleWeakness` and `scaleMastery.ts`'s board. It is NEVER merged
 *  into note/interval history, mastery, badges, leaderboard, or personal-best
 *  (§19). */
export interface ScaleHistoryRow {
  /** `scale:<type>:<position>` — the item this answer reviews. */
  itemId: string;
  /** Which exercise produced the answer (§8; `connectBoxes` is Session 8's
   *  "Connect the boxes", itemId's positionIndex always `0`). */
  form: 'buildScale' | 'orderScale' | 'identifyScale' | 'nameDegree' | 'connectBoxes';
  /** A timeout folds in here as `false`, matching the SRS treatment. */
  correct: boolean;
  /** Seconds taken; `0` when unknown. */
  seconds: number;
  /** Epoch ms — the dedupe / cap-by-recency key on merge. */
  createdAt: number;
}

export type StaffForm = 'nameNote' | 'findOnNeck' | 'findOnStaff' | 'readPhrase';
const STAFF_FORMS: readonly StaffForm[] = ['nameNote', 'findOnNeck', 'findOnStaff', 'readPhrase'];

/** One recorded staff-reading answer (staff-reading-spec.md §8). Never merged
 *  into note/interval/scale history, mastery, badges or the leaderboard. */
export interface StaffHistoryRow {
  /** `staff:<midi>` — the written pitch this answer reviews. */
  itemId: string;
  /** Which exercise produced the answer (§6). */
  form: StaffForm;
  correct: boolean;
  seconds: number;
  createdAt: number;
}

export type TabForm =
  | 'nameNote' | 'findOnNeck' | 'writeTab' | 'readRiff'
  // Slice 2: chords and technique symbols (tab-reading-spec.md §13)
  | 'nameChord' | 'playChord' | 'nameTechnique' | 'techniqueNote';
const TAB_FORMS: readonly TabForm[] = [
  'nameNote', 'findOnNeck', 'writeTab', 'readRiff', 'nameChord', 'playChord', 'nameTechnique', 'techniqueNote',
];

/** One recorded tab-reading answer (tab-reading-spec.md §8). Never merged
 *  into note/interval/scale/staff history, mastery, badges or the leaderboard. */
export interface TabHistoryRow {
  /** `tab:<string>:<fret>`, `tab:chord:<frets>` or `tab:tech:<technique>` —
   *  the tab item this answer reviews. */
  itemId: string;
  /** Which exercise produced the answer (§6). */
  form: TabForm;
  correct: boolean;
  seconds: number;
  createdAt: number;
}

export interface InstrumentLearningState {
  srs: SrsMap;
  /** Leitner schedule for interval *qualities* (P4). A separate map from `srs`
   *  so the notes-only planner / weakness / path code never sees interval ids.
   *  Keyed by `intervalItemId(semitones)` ("interval:<n>"). Absent in a pre-P4
   *  blob ⇒ `{}`. */
  intervalSrs: SrsMap;
  daily: DailyGoal;
  /** Interval practice has its OWN daily goal, separate from `daily` (OD-5):
   *  interval reviews never tick the note goal and note reviews never tick
   *  this one. Same `DailyGoal` shape, rolled / merged with the same helpers.
   *  Absent in a pre-`0015` blob ⇒ a fresh goal. */
  intervalDaily: DailyGoal;
  /** Capped (`INTERVAL_HISTORY_CAP`) ring buffer of interval-drill answers,
   *  stored and synced in this same blob (OD-6). Read only by
   *  `analyzeIntervalWeakness` and the interval Stats section — never mixed
   *  into note history. Absent in a pre-`0015` blob ⇒ `[]`. */
  intervalHistory: IntervalHistoryRow[];
  /** Learning Path progress: best star tier reached per checkpoint (P3).
   *  Added to the same blob rather than a new table — P2 already established
   *  "one learning-state blob, merged per key" (SRS + daily goal together),
   *  and Path progress follows that precedent. Absent in a pre-P3 blob ⇒ an
   *  empty record. */
  path: PathProgress;
  /** Leitner schedule for `(scaleType, position)` items (P5). A separate map
   *  from `srs`/`intervalSrs` so notes/intervals code never sees scale ids.
   *  Keyed by `scaleItemId(type, position)`. Absent in a pre-P5 blob ⇒ `{}`. */
  scaleSrs: SrsMap;
  /** Capped (`SCALE_HISTORY_CAP`) ring buffer of scale-drill answers.
   *  Absent in a pre-P5 blob ⇒ `[]`. */
  scaleHistory: ScaleHistoryRow[];
  /** Leitner schedule for written pitches (Staff reading). A separate map so
   *  no other domain ever sees staff ids. Absent in an older blob ⇒ `{}`. */
  staffSrs: SrsMap;
  /** Capped (`STAFF_HISTORY_CAP`) ring buffer of staff-reading answers.
   *  Absent in an older blob ⇒ `[]`. */
  staffHistory: StaffHistoryRow[];
  /** Today's staff-reading goal — its own record, like `intervalDaily`.
   *  Absent in an older blob ⇒ a fresh goal for today. */
  staffDaily: DailyGoal;
  /** Leitner schedule for tab positions (Tab reading). A separate map so no
   *  other domain ever sees tab ids. Absent in an older blob ⇒ `{}`. */
  tabSrs: SrsMap;
  /** Capped (`TAB_HISTORY_CAP`) ring buffer of tab-reading answers.
   *  Absent in an older blob ⇒ `[]`. */
  tabHistory: TabHistoryRow[];
  /** Today's tab-reading goal — its own record, like `staffDaily`.
   *  Absent in an older blob ⇒ a fresh goal for today. */
  tabDaily: DailyGoal;
  /** Epoch ms of the last Teacher answer, for merge tie-breaking. */
  lastAnswerAt: number;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}

export interface LearningState {
  version: 1;
  instruments: Record<string, InstrumentLearningState>;
}

// ── Local day helper ───────────────────────────────────────────────────
export function localDayISO(now: number): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function freshDaily(now: number, target = DEFAULT_DAILY_TARGET): DailyGoal {
  return { dateISO: localDayISO(now), target, completed: 0 };
}

export function emptyInstrumentState(now: number): InstrumentLearningState {
  return {
    srs: {},
    intervalSrs: {},
    daily: freshDaily(now),
    intervalDaily: freshDaily(now, DEFAULT_INTERVAL_DAILY_TARGET),
    intervalHistory: [],
    path: emptyPathProgress(),
    scaleSrs: {},
    scaleHistory: [],
    staffSrs: {},
    staffHistory: [],
    staffDaily: freshDaily(now, DEFAULT_STAFF_DAILY_TARGET),
    tabSrs: {},
    tabHistory: [],
    tabDaily: freshDaily(now, DEFAULT_TAB_DAILY_TARGET),
    lastAnswerAt: 0,
    updatedAt: new Date(now).toISOString(),
  };
}

function emptyState(): LearningState {
  return { version: 1, instruments: {} };
}

// ── Normalisation (untrusted input from storage / cloud) ────────────────

function normalizeSrsItem(id: string, raw: unknown): SrsItem | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const bucket = Math.max(0, Math.round(num(r.bucket, 0)));
  return {
    itemId: id,
    bucket,
    dueAt: num(r.dueAt, 0),
    lastReviewedAt: num(r.lastReviewedAt, 0),
    reps: Math.max(0, Math.round(num(r.reps, 0))),
    lapses: Math.max(0, Math.round(num(r.lapses, 0))),
  };
}

function normalizeDaily(
  raw: unknown,
  now: number,
  defaultTarget: number = DEFAULT_DAILY_TARGET,
): DailyGoal {
  if (raw == null || typeof raw !== 'object') return freshDaily(now, defaultTarget);
  const r = raw as Record<string, unknown>;
  const dateISO = typeof r.dateISO === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.dateISO)
    ? r.dateISO
    : localDayISO(now);
  const target =
    typeof r.target === 'number' && r.target > 0 ? Math.round(r.target) : defaultTarget;
  const completed =
    typeof r.completed === 'number' && r.completed >= 0 ? Math.round(r.completed) : 0;
  return { dateISO, target, completed };
}

/** Coerce untrusted storage / cloud input into a valid `IntervalHistoryRow[]`:
 *  drop malformed rows, then keep the most recent `INTERVAL_HISTORY_CAP` by
 *  `createdAt`. A missing key (pre-`0015` blob) ⇒ `[]`. */
export function normalizeIntervalHistory(raw: unknown): IntervalHistoryRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: IntervalHistoryRow[] = [];
  for (const v of raw) {
    if (v == null || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    const semitones =
      typeof r.semitones === 'number' && Number.isFinite(r.semitones)
        ? Math.round(r.semitones)
        : NaN;
    if (!(semitones >= 1 && semitones <= 11)) continue;
    const createdAt =
      typeof r.createdAt === 'number' && Number.isFinite(r.createdAt) && r.createdAt > 0
        ? Math.round(r.createdAt)
        : NaN;
    if (!Number.isFinite(createdAt)) continue;
    const form =
      r.form === 'identify' || r.form === 'findNote' || r.form === 'findPosition'
        ? r.form
        : null;
    if (form == null) continue;
    const dir = r.dir === 'down' ? 'down' : 'up';
    const seconds =
      typeof r.seconds === 'number' && Number.isFinite(r.seconds) && r.seconds >= 0
        ? r.seconds
        : 0;
    rows.push({ semitones, dir, form, correct: r.correct === true, seconds, createdAt });
  }
  rows.sort((a, b) => a.createdAt - b.createdAt);
  return rows.length > INTERVAL_HISTORY_CAP
    ? rows.slice(rows.length - INTERVAL_HISTORY_CAP)
    : rows;
}

/** Coerce untrusted storage input into a valid `ScaleHistoryRow[]`: drop
 *  malformed rows, then keep the most recent `SCALE_HISTORY_CAP` by
 *  `createdAt`. A missing key (pre-P5 blob) ⇒ `[]`. Mirrors
 *  `normalizeIntervalHistory`. */
export function normalizeScaleHistory(raw: unknown): ScaleHistoryRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: ScaleHistoryRow[] = [];
  for (const v of raw) {
    if (v == null || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    const itemId = typeof r.itemId === 'string' ? r.itemId : '';
    if (parseScaleItemId(itemId) == null) continue;
    const createdAt =
      typeof r.createdAt === 'number' && Number.isFinite(r.createdAt) && r.createdAt > 0
        ? Math.round(r.createdAt)
        : NaN;
    if (!Number.isFinite(createdAt)) continue;
    const form =
      r.form === 'buildScale' || r.form === 'orderScale' || r.form === 'identifyScale'
        || r.form === 'nameDegree' || r.form === 'connectBoxes'
        ? r.form
        : null;
    if (form == null) continue;
    const seconds =
      typeof r.seconds === 'number' && Number.isFinite(r.seconds) && r.seconds >= 0
        ? r.seconds
        : 0;
    rows.push({ itemId, form, correct: r.correct === true, seconds, createdAt });
  }
  rows.sort((a, b) => a.createdAt - b.createdAt);
  return rows.length > SCALE_HISTORY_CAP
    ? rows.slice(rows.length - SCALE_HISTORY_CAP)
    : rows;
}

/** Coerce untrusted storage input into a valid `StaffHistoryRow[]`. Mirrors
 *  `normalizeScaleHistory`. */
export function normalizeStaffHistory(raw: unknown): StaffHistoryRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: StaffHistoryRow[] = [];
  for (const v of raw) {
    if (v == null || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    const itemId = typeof r.itemId === 'string' ? r.itemId : '';
    if (parseStaffItemId(itemId) == null) continue;
    const createdAt =
      typeof r.createdAt === 'number' && Number.isFinite(r.createdAt) && r.createdAt > 0
        ? Math.round(r.createdAt)
        : NaN;
    if (!Number.isFinite(createdAt)) continue;
    const form = STAFF_FORMS.find((f) => f === r.form);
    if (form == null) continue;
    const seconds =
      typeof r.seconds === 'number' && Number.isFinite(r.seconds) && r.seconds >= 0
        ? r.seconds
        : 0;
    rows.push({ itemId, form, correct: r.correct === true, seconds, createdAt });
  }
  rows.sort((a, b) => a.createdAt - b.createdAt);
  return rows.length > STAFF_HISTORY_CAP
    ? rows.slice(rows.length - STAFF_HISTORY_CAP)
    : rows;
}

/** Coerce untrusted storage input into a valid `TabHistoryRow[]`. Mirrors
 *  `normalizeStaffHistory`. */
export function normalizeTabHistory(raw: unknown): TabHistoryRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: TabHistoryRow[] = [];
  for (const v of raw) {
    if (v == null || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    const itemId = typeof r.itemId === 'string' ? r.itemId : '';
    if (!isValidTabItemId(itemId)) continue;
    const createdAt =
      typeof r.createdAt === 'number' && Number.isFinite(r.createdAt) && r.createdAt > 0
        ? Math.round(r.createdAt)
        : NaN;
    if (!Number.isFinite(createdAt)) continue;
    const form = TAB_FORMS.find((f) => f === r.form);
    if (form == null) continue;
    const seconds =
      typeof r.seconds === 'number' && Number.isFinite(r.seconds) && r.seconds >= 0
        ? r.seconds
        : 0;
    rows.push({ itemId, form, correct: r.correct === true, seconds, createdAt });
  }
  rows.sort((a, b) => a.createdAt - b.createdAt);
  return rows.length > TAB_HISTORY_CAP
    ? rows.slice(rows.length - TAB_HISTORY_CAP)
    : rows;
}

export function normalizeInstrumentState(
  raw: unknown,
  now: number,
): InstrumentLearningState {
  if (raw == null || typeof raw !== 'object') return emptyInstrumentState(now);
  const r = raw as Record<string, unknown>;
  const readSrsMap = (src: unknown): SrsMap => {
    const out: SrsMap = {};
    if (src != null && typeof src === 'object') {
      for (const [id, v] of Object.entries(src as Record<string, unknown>)) {
        const item = normalizeSrsItem(id, v);
        if (item) out[id] = item;
      }
    }
    return out;
  };
  return {
    srs: readSrsMap(r.srs),
    intervalSrs: readSrsMap(r.intervalSrs),
    daily: normalizeDaily(r.daily, now),
    intervalDaily: normalizeDaily(r.intervalDaily, now, DEFAULT_INTERVAL_DAILY_TARGET),
    intervalHistory: normalizeIntervalHistory(r.intervalHistory),
    path: normalizePathProgress(r.path),
    scaleSrs: readSrsMap(r.scaleSrs),
    scaleHistory: normalizeScaleHistory(r.scaleHistory),
    staffSrs: readSrsMap(r.staffSrs),
    staffHistory: normalizeStaffHistory(r.staffHistory),
    staffDaily: normalizeDaily(r.staffDaily, now, DEFAULT_STAFF_DAILY_TARGET),
    tabSrs: readSrsMap(r.tabSrs),
    tabHistory: normalizeTabHistory(r.tabHistory),
    tabDaily: normalizeDaily(r.tabDaily, now, DEFAULT_TAB_DAILY_TARGET),
    lastAnswerAt:
      typeof r.lastAnswerAt === 'number' && Number.isFinite(r.lastAnswerAt)
        ? r.lastAnswerAt
        : 0,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date(now).toISOString(),
  };
}

export function normalizeLearningState(raw: unknown, now: number): LearningState {
  if (raw == null || typeof raw !== 'object') return emptyState();
  const r = raw as Record<string, unknown>;
  const out = emptyState();
  const instruments = r.instruments;
  if (instruments != null && typeof instruments === 'object') {
    for (const [id, v] of Object.entries(instruments as Record<string, unknown>)) {
      out.instruments[id] = normalizeInstrumentState(v, now);
    }
  }
  return out;
}

// ── Load / save (localStorage) ─────────────────────────────────────────

export function loadLearningState(now: number = Date.now()): LearningState {
  try {
    const raw = localStorage.getItem(LEARNING_STORAGE_KEY);
    if (!raw) return emptyState();
    return normalizeLearningState(JSON.parse(raw), now);
  } catch {
    return emptyState();
  }
}

/** Write the whole state to localStorage. Best-effort. */
export function saveLearningStateLocal(state: LearningState): void {
  try {
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — best-effort only */
  }
}

/**
 * Drop the on-device learning blob entirely. Called on sign-out so one
 * account's SRS schedule can never be merged into the next account's cloud
 * row on a shared device (the sync reconcile always merges local ∪ cloud).
 * A signed-out user is always Free, and the Teacher never reads this key
 * while Free, so there is nothing live to lose.
 */
export function clearLocalLearningState(): void {
  try {
    localStorage.removeItem(LEARNING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getInstrumentState(
  state: LearningState,
  instrumentId: string,
  now: number,
): InstrumentLearningState {
  return state.instruments[instrumentId] ?? emptyInstrumentState(now);
}

export function withInstrumentState(
  state: LearningState,
  instrumentId: string,
  next: InstrumentLearningState,
): LearningState {
  return {
    version: 1,
    instruments: { ...state.instruments, [instrumentId]: next },
  };
}

// ── Daily goal roll-over ───────────────────────────────────────────────
//
// If the stored day is not today, start a fresh goal for today. Pure — the
// caller decides whether to persist the result.
export function rollDailyGoal(
  daily: DailyGoal,
  now: number,
  target: number = DEFAULT_DAILY_TARGET,
): DailyGoal {
  const today = localDayISO(now);
  if (daily.dateISO === today) return daily;
  return { dateISO: today, target, completed: 0 };
}

export function isDailyGoalComplete(daily: DailyGoal): boolean {
  return daily.completed >= daily.target;
}

// ── Apply one Teacher answer ──────────────────────────────────────────
//
// Updates the position's SRS schedule and bumps today's completed count.
// `correct` folds a timeout in as incorrect (the caller passes
// `entry.correct === true`). Pure.
export function recordTeacherAnswer(
  st: InstrumentLearningState,
  pos: { string: number; fret: number },
  correct: boolean,
  now: number,
): InstrumentLearningState {
  const id = noteItemId(pos.string, pos.fret);
  const srsItem = getOrCreate(st.srs, id, now);
  const nextItem = reviewSrsItem(srsItem, correct, now);
  const daily = rollDailyGoal(st.daily, now, st.daily.target);
  return {
    srs: { ...st.srs, [id]: nextItem },
    intervalSrs: st.intervalSrs,
    daily: { ...daily, completed: daily.completed + 1 },
    intervalDaily: st.intervalDaily,
    intervalHistory: st.intervalHistory,
    path: st.path,
    scaleSrs: st.scaleSrs,
    scaleHistory: st.scaleHistory,
    staffSrs: st.staffSrs,
    staffHistory: st.staffHistory,
    staffDaily: st.staffDaily,
    tabSrs: st.tabSrs,
    tabHistory: st.tabHistory,
    tabDaily: st.tabDaily,
    lastAnswerAt: now,
    updatedAt: new Date(now).toISOString(),
  };
}

// ── Apply one ordinary Selector answer (Premium only) ─────────────────
//
// Same SRS transition as a Teacher answer so the schedule learns from *all*
// note practice, not only Teacher sessions — but it does NOT touch the daily
// goal: that goal is the prescribed Teacher session, and free-drilling the
// Selector must not tick it off. The daily record is still rolled to today so
// a stale day never lingers. Pure.
export function recordPracticeAnswer(
  st: InstrumentLearningState,
  pos: { string: number; fret: number },
  correct: boolean,
  now: number,
): InstrumentLearningState {
  const id = noteItemId(pos.string, pos.fret);
  const srsItem = getOrCreate(st.srs, id, now);
  const nextItem = reviewSrsItem(srsItem, correct, now);
  return {
    srs: { ...st.srs, [id]: nextItem },
    intervalSrs: st.intervalSrs,
    daily: rollDailyGoal(st.daily, now, st.daily.target),
    intervalDaily: st.intervalDaily,
    intervalHistory: st.intervalHistory,
    path: st.path,
    scaleSrs: st.scaleSrs,
    scaleHistory: st.scaleHistory,
    staffSrs: st.staffSrs,
    staffHistory: st.staffHistory,
    staffDaily: st.staffDaily,
    tabSrs: st.tabSrs,
    tabHistory: st.tabHistory,
    tabDaily: st.tabDaily,
    lastAnswerAt: now,
    updatedAt: new Date(now).toISOString(),
  };
}

// ── Apply one interval-drill answer (Premium only, P4) ────────────────
//
// Updates only the interval quality's own SRS schedule (`intervalSrs`). It
// does NOT touch the note schedule, the daily goal (that goal is the
// prescribed *note* Teacher session), the interval goal / history, or the
// Learning Path. `correct` folds a timeout in as incorrect. The note daily
// record is still rolled to today so a stale day never lingers. Pure.
//
// This is the *non-guided* path (kept for a future free interval Selector,
// spec §13.7). A guided Interval Today session goes through
// `recordIntervalTeacherAnswer` below, which additionally ticks `intervalDaily`
// and appends to `intervalHistory`.
export function recordIntervalAnswer(
  st: InstrumentLearningState,
  itemId: string,
  correct: boolean,
  now: number,
): InstrumentLearningState {
  const srsItem = getOrCreate(st.intervalSrs, itemId, now);
  const nextItem = reviewSrsItem(srsItem, correct, now);
  return {
    ...st,
    intervalSrs: { ...st.intervalSrs, [itemId]: nextItem },
    daily: rollDailyGoal(st.daily, now, st.daily.target),
    lastAnswerAt: now,
    updatedAt: new Date(now).toISOString(),
  };
}

/** One recorded answer from a guided Interval Today session — everything
 *  `recordIntervalTeacherAnswer` needs to fold it into the model. `correct`
 *  already has any timeout folded in as `false` by the caller. */
export interface RecordedIntervalAnswer {
  /** `intervalItemId(semitones)` the engine tagged the row with. */
  itemId: string;
  /** Interval size in semitones, 1..11. */
  semitones: number;
  dir: 'up' | 'down';
  form: 'identify' | 'findNote' | 'findPosition';
  correct: boolean;
  /** Seconds taken; `0` when unknown. */
  seconds: number;
}

// ── Apply one guided Interval Today answer (Premium only) ─────────────
//
// The interval-domain sibling of `recordTeacherAnswer` (spec §13 / §14 / T9):
//   • folds the quality into `intervalSrs` (like `recordIntervalAnswer`);
//   • appends a capped row to `intervalHistory` (OD-6);
//   • ticks the SEPARATE `intervalDaily` goal — never the note `daily` (OD-5).
// The note `srs` / `daily` / `path` are byte-identical to the input (the note
// daily record is still rolled to today for stale-day hygiene, a no-op within
// the same day). Pure.
export function recordIntervalTeacherAnswer(
  st: InstrumentLearningState,
  answer: RecordedIntervalAnswer,
  now: number,
): InstrumentLearningState {
  const srsItem = getOrCreate(st.intervalSrs, answer.itemId, now);
  const nextItem = reviewSrsItem(srsItem, answer.correct, now);
  const intervalDaily = rollDailyGoal(
    st.intervalDaily,
    now,
    st.intervalDaily.target,
  );
  const row: IntervalHistoryRow = {
    semitones: answer.semitones,
    dir: answer.dir,
    form: answer.form,
    correct: answer.correct,
    seconds: Number.isFinite(answer.seconds) && answer.seconds >= 0 ? answer.seconds : 0,
    createdAt: now,
  };
  const history = [...st.intervalHistory, row];
  return {
    ...st,
    intervalSrs: { ...st.intervalSrs, [answer.itemId]: nextItem },
    intervalDaily: { ...intervalDaily, completed: intervalDaily.completed + 1 },
    intervalHistory:
      history.length > INTERVAL_HISTORY_CAP
        ? history.slice(history.length - INTERVAL_HISTORY_CAP)
        : history,
    daily: rollDailyGoal(st.daily, now, st.daily.target),
    lastAnswerAt: now,
    updatedAt: new Date(now).toISOString(),
  };
}

// ── Apply one scale-drill answer (Premium only, P5) ────────────────────
//
// The scale-domain sibling of `recordIntervalTeacherAnswer` — but Scales has
// only ONE recording path (no free-vs-guided split like Intervals', since
// there is no guided Scale Today session yet, spec §13/§14 not built):
// every scale answer, from any of the three exercises, folds the item into
// `scaleSrs` and appends a capped row to `scaleHistory` (§10.3). Does NOT
// touch a `scaleDaily` goal — that field doesn't exist yet (§14 is a later
// increment). The note `srs` / `daily` / `path` and the interval fields are
// byte-identical to the input (the note daily record is still rolled to
// today for stale-day hygiene, a no-op within the same day). Pure.
export function recordScaleAnswer(
  st: InstrumentLearningState,
  itemId: string,
  form: ScaleHistoryRow['form'],
  correct: boolean,
  seconds: number,
  now: number,
): InstrumentLearningState {
  const srsItem = getOrCreate(st.scaleSrs, itemId, now);
  const nextItem = reviewSrsItem(srsItem, correct, now);
  const row: ScaleHistoryRow = {
    itemId,
    form,
    correct,
    seconds: Number.isFinite(seconds) && seconds >= 0 ? seconds : 0,
    createdAt: now,
  };
  const history = [...st.scaleHistory, row];
  return {
    ...st,
    scaleSrs: { ...st.scaleSrs, [itemId]: nextItem },
    scaleHistory:
      history.length > SCALE_HISTORY_CAP
        ? history.slice(history.length - SCALE_HISTORY_CAP)
        : history,
    daily: rollDailyGoal(st.daily, now, st.daily.target),
    lastAnswerAt: now,
    updatedAt: new Date(now).toISOString(),
  };
}

// ── Apply one staff-reading answer (Premium only) ──────────────────────
//
// The staff-domain sibling of `recordScaleAnswer`: folds the written pitch
// into `staffSrs`, appends a capped row to `staffHistory` and ticks the
// SEPARATE `staffDaily` goal (never the note `daily`, which is only rolled to
// today for stale-day hygiene). Every other domain's fields are left as they
// are. Pure.
export function recordStaffAnswer(
  st: InstrumentLearningState,
  itemId: string,
  form: StaffHistoryRow['form'],
  correct: boolean,
  seconds: number,
  now: number,
): InstrumentLearningState {
  const srsItem = getOrCreate(st.staffSrs, itemId, now);
  const staffDaily = rollDailyGoal(st.staffDaily, now, st.staffDaily.target);
  const nextItem = reviewSrsItem(srsItem, correct, now);
  const row: StaffHistoryRow = {
    itemId,
    form,
    correct,
    seconds: Number.isFinite(seconds) && seconds >= 0 ? seconds : 0,
    createdAt: now,
  };
  const history = [...st.staffHistory, row];
  return {
    ...st,
    staffSrs: { ...st.staffSrs, [itemId]: nextItem },
    staffHistory:
      history.length > STAFF_HISTORY_CAP
        ? history.slice(history.length - STAFF_HISTORY_CAP)
        : history,
    staffDaily: { ...staffDaily, completed: staffDaily.completed + 1 },
    daily: rollDailyGoal(st.daily, now, st.daily.target),
    lastAnswerAt: now,
    updatedAt: new Date(now).toISOString(),
  };
}

// ── Apply one tab-reading answer (Premium only) ────────────────────────
//
// The tab-domain sibling of `recordStaffAnswer`: folds the tab position into
// `tabSrs`, appends a capped row to `tabHistory` and ticks the SEPARATE
// `tabDaily` goal. Every other domain's fields are left as they are (the
// note `daily` is only rolled to today). Pure.
export function recordTabAnswer(
  st: InstrumentLearningState,
  itemId: string,
  form: TabHistoryRow['form'],
  correct: boolean,
  seconds: number,
  now: number,
): InstrumentLearningState {
  const srsItem = getOrCreate(st.tabSrs, itemId, now);
  const tabDaily = rollDailyGoal(st.tabDaily, now, st.tabDaily.target);
  const nextItem = reviewSrsItem(srsItem, correct, now);
  const row: TabHistoryRow = {
    itemId,
    form,
    correct,
    seconds: Number.isFinite(seconds) && seconds >= 0 ? seconds : 0,
    createdAt: now,
  };
  const history = [...st.tabHistory, row];
  return {
    ...st,
    tabSrs: { ...st.tabSrs, [itemId]: nextItem },
    tabHistory:
      history.length > TAB_HISTORY_CAP
        ? history.slice(history.length - TAB_HISTORY_CAP)
        : history,
    tabDaily: { ...tabDaily, completed: tabDaily.completed + 1 },
    daily: rollDailyGoal(st.daily, now, st.daily.target),
    lastAnswerAt: now,
    updatedAt: new Date(now).toISOString(),
  };
}

// ── Fold Learning Path checkpoint stars (Premium only) ────────────────
//
// Monotonic per checkpoint (see `pathProgress.foldCheckpointStars`). Returns
// the same state reference when nothing rose, so a caller can skip a save.
export function recordCheckpointStars(
  st: InstrumentLearningState,
  checkpointId: string,
  stars: 0 | 1 | 2 | 3,
  now: number,
): InstrumentLearningState {
  const nextPath = foldCheckpointStars(
    st.path, checkpointId, stars, new Date(now).toISOString(),
  );
  if (nextPath === st.path) return st;
  return { ...st, path: nextPath, updatedAt: new Date(now).toISOString() };
}

// ── Merge (per-instrument, per-item) for sync ─────────────────────────
//
// NOT last-writer-wins: SRS maps merge item-by-item (`mergeSrsMaps`), so a
// review made on one device is never dropped because the other device wrote
// the blob more recently. The daily goal is a single small record — for the
// SAME day, keep the higher `completed` and `target` (progress only moves
// forward within a day); for different days, the later date wins.
export function mergeDailyGoal(a: DailyGoal, b: DailyGoal): DailyGoal {
  if (a.dateISO === b.dateISO) {
    return {
      dateISO: a.dateISO,
      target: Math.max(a.target, b.target),
      completed: Math.max(a.completed, b.completed),
    };
  }
  return a.dateISO >= b.dateISO ? a : b;
}

/**
 * Merge two interval-history buffers: concatenate, drop rows that duplicate on
 * (`createdAt`, `semitones`, `form`, `dir`), then keep the most recent
 * `INTERVAL_HISTORY_CAP` by `createdAt`. Like the SRS maps this is a real
 * union, never last-writer-wins (spec §17.2) — a session recorded on one
 * device is not lost to a newer blob written on the other.
 */
export function mergeIntervalHistory(
  a: IntervalHistoryRow[],
  b: IntervalHistoryRow[],
): IntervalHistoryRow[] {
  const seen = new Set<string>();
  const out: IntervalHistoryRow[] = [];
  for (const row of [...a, ...b]) {
    const key = `${row.createdAt}|${row.semitones}|${row.form}|${row.dir}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  out.sort((x, y) => x.createdAt - y.createdAt);
  return out.length > INTERVAL_HISTORY_CAP
    ? out.slice(out.length - INTERVAL_HISTORY_CAP)
    : out;
}

/**
 * Merge two scale-history buffers: concatenate, drop rows that duplicate on
 * (`createdAt`, `itemId`, `form`), then keep the most recent
 * `SCALE_HISTORY_CAP` by `createdAt`. Mirrors `mergeIntervalHistory` — a real
 * union, never last-writer-wins.
 */
export function mergeScaleHistory(
  a: ScaleHistoryRow[],
  b: ScaleHistoryRow[],
): ScaleHistoryRow[] {
  const seen = new Set<string>();
  const out: ScaleHistoryRow[] = [];
  for (const row of [...a, ...b]) {
    const key = `${row.createdAt}|${row.itemId}|${row.form}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  out.sort((x, y) => x.createdAt - y.createdAt);
  return out.length > SCALE_HISTORY_CAP
    ? out.slice(out.length - SCALE_HISTORY_CAP)
    : out;
}

/** Merge two tab-history buffers. Mirrors `mergeStaffHistory`. */
export function mergeTabHistory(
  a: TabHistoryRow[],
  b: TabHistoryRow[],
): TabHistoryRow[] {
  const seen = new Set<string>();
  const out: TabHistoryRow[] = [];
  for (const row of [...a, ...b]) {
    const key = `${row.createdAt}|${row.itemId}|${row.form}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  out.sort((x, y) => x.createdAt - y.createdAt);
  return out.length > TAB_HISTORY_CAP
    ? out.slice(out.length - TAB_HISTORY_CAP)
    : out;
}

/** Merge two staff-history buffers. Mirrors `mergeScaleHistory`. */
export function mergeStaffHistory(
  a: StaffHistoryRow[],
  b: StaffHistoryRow[],
): StaffHistoryRow[] {
  const seen = new Set<string>();
  const out: StaffHistoryRow[] = [];
  for (const row of [...a, ...b]) {
    const key = `${row.createdAt}|${row.itemId}|${row.form}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  out.sort((x, y) => x.createdAt - y.createdAt);
  return out.length > STAFF_HISTORY_CAP
    ? out.slice(out.length - STAFF_HISTORY_CAP)
    : out;
}

export function mergeInstrumentState(
  a: InstrumentLearningState,
  b: InstrumentLearningState,
): InstrumentLearningState {
  return {
    srs: mergeSrsMaps(a.srs, b.srs),
    intervalSrs: mergeSrsMaps(a.intervalSrs ?? {}, b.intervalSrs ?? {}),
    daily: mergeDailyGoal(a.daily, b.daily),
    intervalDaily: mergeDailyGoal(
      a.intervalDaily ?? freshDaily(0, DEFAULT_INTERVAL_DAILY_TARGET),
      b.intervalDaily ?? freshDaily(0, DEFAULT_INTERVAL_DAILY_TARGET),
    ),
    intervalHistory: mergeIntervalHistory(a.intervalHistory ?? [], b.intervalHistory ?? []),
    path: mergePathProgress(a.path, b.path),
    scaleSrs: mergeSrsMaps(a.scaleSrs ?? {}, b.scaleSrs ?? {}),
    scaleHistory: mergeScaleHistory(a.scaleHistory ?? [], b.scaleHistory ?? []),
    staffSrs: mergeSrsMaps(a.staffSrs ?? {}, b.staffSrs ?? {}),
    staffHistory: mergeStaffHistory(a.staffHistory ?? [], b.staffHistory ?? []),
    staffDaily: mergeDailyGoal(
      a.staffDaily ?? freshDaily(0, DEFAULT_STAFF_DAILY_TARGET),
      b.staffDaily ?? freshDaily(0, DEFAULT_STAFF_DAILY_TARGET),
    ),
    tabSrs: mergeSrsMaps(a.tabSrs ?? {}, b.tabSrs ?? {}),
    tabHistory: mergeTabHistory(a.tabHistory ?? [], b.tabHistory ?? []),
    tabDaily: mergeDailyGoal(
      a.tabDaily ?? freshDaily(0, DEFAULT_TAB_DAILY_TARGET),
      b.tabDaily ?? freshDaily(0, DEFAULT_TAB_DAILY_TARGET),
    ),
    lastAnswerAt: Math.max(a.lastAnswerAt, b.lastAnswerAt),
    updatedAt: a.updatedAt >= b.updatedAt ? a.updatedAt : b.updatedAt,
  };
}

export function mergeLearningState(a: LearningState, b: LearningState): LearningState {
  const out: LearningState = { version: 1, instruments: { ...a.instruments } };
  for (const [id, st] of Object.entries(b.instruments)) {
    const cur = out.instruments[id];
    out.instruments[id] = cur ? mergeInstrumentState(cur, st) : st;
  }
  return out;
}
