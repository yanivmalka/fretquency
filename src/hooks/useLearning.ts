// ── useLearning — wires the Premium Teacher model into React ─────────────
//
// Owns the per-instrument learning state (SRS + daily goal), keeps it in
// React state, and derives the two plans the Today card needs:
//   • todayPlan     — the recommended daily session (always present for a
//                     Premium user; falls back to least-practised coverage)
//   • weakSpotsPlan — overdue + weak positions only, or null when there are
//                     none ("Practise my weak spots")
//
// localStorage is written synchronously on every Teacher answer; the cloud
// push is fired right after (best-effort, debounced in learningSync). A
// `learning-synced` event from a background reconcile makes the hook re-read.
//
// For a non-Premium user the hook is inert: it does no work and returns
// empty/null so a caller can mount it unconditionally.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notes, type HistoryEntry, type AccidentalMode, type NotationMode, type OrderMode } from '../utils/music';
import type { InstrumentConfig } from '../utils/instruments';
import {
  loadLearningState,
  saveLearningStateLocal,
  getInstrumentState,
  withInstrumentState,
  recordTeacherAnswer,
  recordPracticeAnswer as recordPracticeAnswerModel,
  recordIntervalAnswer as recordIntervalAnswerModel,
  recordIntervalTeacherAnswer as recordIntervalTeacherAnswerModel,
  recordCheckpointStars,
  rollDailyGoal,
  isDailyGoalComplete,
  type LearningState,
  type InstrumentLearningState,
  type DailyGoal,
} from '../learning/learningState';
import { cloudPushLearning } from '../learning/learningSync';
import { recordDailyActivity } from '../utils/dailyActivity';
import { recordLeagueActivity } from '../utils/leagueActivity';
import {
  buildDailyPlan,
  buildWeakSpotsPlan,
  type TeacherPlan,
  type PlannerOptions,
} from '../learning/planner';
import type { DrillPosition, DrillConfig } from '../drill/DrillConfig';
import { evaluatePath, type PathView } from '../learning/pathProgress';
import { buildIntervalDrill } from '../learning/intervalDrill';
import {
  buildIntervalDailyPlan as buildIntervalDailyPlanModel,
  buildIntervalWeakSpotsPlan as buildIntervalWeakSpotsPlanModel,
  type IntervalTeacherPlan,
} from '../learning/intervalPlanner';
import { parseIntervalItemId } from '../learning/intervalItem';
import type { SrsItem } from '../learning/srs';

/** Distinct interval qualities with an SRS row — legacy quality rows and the
 *  skill × direction rows (up to 6 per quality) count the quality once. */
function distinctIntervalSizes(
  srs: Record<string, SrsItem>,
  pred: (it: SrsItem) => boolean = () => true,
): number {
  const sizes = new Set<number>();
  for (const [id, it] of Object.entries(srs)) {
    const n = parseIntervalItemId(id);
    if (n != null && pred(it)) sizes.add(n);
  }
  return sizes.size;
}
import type { IntervalExercise } from '../utils/intervals';
import {
  buildIntervalBoard,
  masteredSizes,
  INTERVAL_STATS_WINDOW_DAYS,
  type IntervalBoardRow,
} from '../learning/intervalMastery';
import { INTERVAL_CURRICULUM, currentGroupIndex } from '../learning/intervalCurriculum';

/** Headline interval numbers for the Stats & progress "Intervals" section
 *  (spec §15.1). All read-only, derived every render from `intervalSrs` +
 *  `intervalHistory` — no points / XP / streak / badge / star. */
export interface IntervalStatsSummary {
  /** Always 11 — the drilled qualities (m2…M7). */
  inSystem: number;
  /** Qualities ever answered (an `intervalSrs` schedule row exists). */
  started: number;
  /** Started qualities still shaky — low Leitner bucket with a recorded lapse. */
  needsWork: number;
  /** Qualities the §11.1 predicate currently marks mastered (out of 11). */
  mastered: number;
  /** Correct / answered over the recent interval-history window, or `null`
   *  when there are no answers in it yet. */
  accuracy: number | null;
  /** Mean seconds of correct answers in that window, or `null`. */
  avgSeconds: number | null;
  /** i18n key of the current curriculum group — shown only as
   *  "currently learning: <name>" (informational, no lock, no %). */
  currentGroupNameKey: string;
}

export interface UseLearningResult {
  /** Today's goal, rolled to the current calendar day. */
  dailyGoal: DailyGoal;
  goalComplete: boolean;
  /** The recommended session. Null only for a non-Premium user. */
  todayPlan: TeacherPlan | null;
  /** Overdue + weak positions only. Null when nothing qualifies. */
  weakSpotsPlan: TeacherPlan | null;
  /** How many distinct positions the SRS schedule is currently tracking. */
  trackedCount: number;
  /** The Learning Path: every checkpoint's mastered %, star rating, unlock
   *  state, and which one is current. `null` for a non-Premium user. */
  pathView: PathView | null;
  /** Feed one answered Teacher question back into the model. Safe to call
   *  from inside the drill's history sink. Stable identity. */
  recordAnswer: (entry: HistoryEntry) => void;
  /** Feed one ordinary Selector (by-fret) answer into the SRS schedule only —
   *  no daily-goal tick. Lets the Teacher learn from all note practice, not
   *  just Teacher sessions. No-op for non-Premium users. Stable identity. */
  recordPracticeAnswer: (entry: HistoryEntry) => void;
  /** Distinct interval qualities the interval SRS schedule is tracking (P4). */
  intervalTrackedCount: number;
  /** Fold one interval-drill answer into the interval SRS schedule (P4).
   *  `itemId` is the `intervalItemId(...)` the engine tagged the row with.
   *  The non-guided path — SRS only, no goal tick, no history append.
   *  No-op for non-Premium users. Stable identity. */
  recordIntervalAnswer: (itemId: string, correct: boolean) => void;
  /** Fold one *guided* Interval Today answer into the model (spec §13 / T9):
   *  the interval SRS schedule, the separate `intervalDaily` goal, and the
   *  capped `intervalHistory`. Reads the interval tags off the drill row.
   *  No-op for non-Premium users. Stable identity. */
  recordIntervalTeacherAnswer: (entry: HistoryEntry) => void;
  /** Build the DrillConfig for a manual interval session in the given
   *  exercise, or `null` for a non-Premium user (P4). */
  buildIntervalPlan: (exercise: IntervalExercise) => DrillConfig | null;
  /** The recommended guided interval session (spec §13.1). Non-null for a
   *  Premium user (falls back to current-group / coverage qualities). The
   *  pool / rationale are exercise-independent; this value is built with the
   *  default exercise for display — `buildIntervalTodayPlan` rebuilds it for
   *  the exercise the learner picks on the card. */
  intervalTodayPlan: IntervalTeacherPlan | null;
  /** Overdue + weak interval qualities only (spec §13.2), or `null` when
   *  nothing qualifies (the card then shows "no weak intervals yet"). */
  intervalWeakSpotsPlan: IntervalTeacherPlan | null;
  /** Rebuild the daily / weak-spots interval plan for a specific exercise —
   *  called on the card's Start button. `null` for a non-Premium user, and
   *  the weak-spots build is `null` when nothing qualifies. */
  buildIntervalTodayPlan: (exercise: IntervalExercise) => IntervalTeacherPlan | null;
  buildIntervalWeakSpotsPlan: (exercise: IntervalExercise) => IntervalTeacherPlan | null;
  /** Today's *interval* goal (separate from `dailyGoal` — OD-5), rolled to
   *  the current calendar day. */
  intervalDailyGoal: DailyGoal;
  intervalGoalComplete: boolean;
  /** The flat 11-interval status board (spec §12) — one row per quality with
   *  its `notStarted` / `learning` / `mastered` status and recent accuracy,
   *  in curriculum order. Empty for a non-Premium user. */
  intervalBoard: IntervalBoardRow[];
  /** Headline interval numbers for the Stats section (spec §15.1), or `null`
   *  for a non-Premium user. */
  intervalStats: IntervalStatsSummary | null;
}

export interface UseLearningOptions {
  instrument: InstrumentConfig;
  /** History rows already scoped to this instrument
   *  (`historyForInstrument(allHistory, instrument.id)`). */
  entries: HistoryEntry[];
  isPremium: boolean;
  accidental: AccidentalMode;
  order: OrderMode;
  /** Note-name notation — threaded into the interval planners / drill builder
   *  so the guided "Today" interval session's feedback matches the prompt's
   *  spelling (#6). */
  notation: NotationMode;
}

export function useLearning(opts: UseLearningOptions): UseLearningResult {
  const { instrument, entries, isPremium, accidental, order, notation } = opts;
  const instrumentId = instrument.id;

  const [state, setState] = useState<LearningState>(() =>
    isPremium ? loadLearningState() : { version: 1, instruments: {} },
  );

  // "Now", as render-stable state (calling Date.now() during render is impure).
  // Refreshed on a slow tick so SRS due-times / the day roll-over stay current
  // without a re-render storm, and immediately on the events that matter.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isPremium) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [isPremium]);

  // Re-read after a background cloud reconcile, and when Premium turns on.
  useEffect(() => {
    if (!isPremium) return;
    const reread = () => { setState(loadLearningState()); setNow(Date.now()); };
    reread();
    window.addEventListener('learning-synced', reread);
    return () => window.removeEventListener('learning-synced', reread);
  }, [isPremium]);

  // Roll the daily goals to today once per mount / day change, and persist them
  // so the rolled-over goals survive a reload even before the first answer. The
  // note goal (`daily`) and the separate interval goal (`intervalDaily` — OD-5)
  // roll together but stay independent records.
  useEffect(() => {
    if (!isPremium) return;
    const ts = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => {
      const st = getInstrumentState(prev, instrumentId, ts);
      const rolledDaily = rollDailyGoal(st.daily, ts, st.daily.target);
      const rolledIntervalDaily = rollDailyGoal(
        st.intervalDaily, ts, st.intervalDaily.target,
      );
      if (rolledDaily === st.daily && rolledIntervalDaily === st.intervalDaily) {
        return prev;
      }
      const next = withInstrumentState(prev, instrumentId, {
        ...st, daily: rolledDaily, intervalDaily: rolledIntervalDaily,
      });
      saveLearningStateLocal(next);
      cloudPushLearning();
      return next;
    });
  }, [isPremium, instrumentId]);

  const instState = useMemo(
    () => getInstrumentState(state, instrumentId, now),
    [state, instrumentId, now],
  );

  const dailyGoal = useMemo(
    () => rollDailyGoal(instState.daily, now, instState.daily.target),
    [instState, now],
  );

  // Today's *interval* goal — a separate record from `dailyGoal` (OD-5):
  // interval answers never tick the note goal and note answers never tick this.
  const intervalDailyGoal = useMemo(
    () => rollDailyGoal(instState.intervalDaily, now, instState.intervalDaily.target),
    [instState, now],
  );

  // One code path for "fold this answer into the model"; `apply` is the pure
  // transition — `recordTeacherAnswer` (SRS + daily goal) for a Teacher
  // session, `recordPracticeAnswer` (SRS only) for ordinary Selector play.
  const foldAnswer = useCallback(
    (
      entry: HistoryEntry,
      apply: (
        st: InstrumentLearningState,
        pos: { string: number; fret: number },
        correct: boolean,
        now: number,
      ) => InstrumentLearningState,
    ) => {
      if (!isPremium) return;
      if (!Number.isInteger(entry.string) || !Number.isInteger(entry.fret)) return;
      const ts = Date.now();
      setNow(ts);
      setState((prev) => {
        const st = getInstrumentState(prev, instrumentId, ts);
        const nextSt = apply(
          st,
          { string: entry.string, fret: entry.fret },
          entry.correct === true,
          ts,
        );
        const next = withInstrumentState(prev, instrumentId, nextSt);
        saveLearningStateLocal(next);
        cloudPushLearning();
        return next;
      });
    },
    [isPremium, instrumentId],
  );

  const recordAnswer = useCallback(
    (entry: HistoryEntry) => foldAnswer(entry, recordTeacherAnswer),
    [foldAnswer],
  );
  const recordPracticeAnswer = useCallback(
    (entry: HistoryEntry) => foldAnswer(entry, recordPracticeAnswerModel),
    [foldAnswer],
  );

  // ── Interval drill (P4) ──────────────────────────────────────────────
  // Interval answers fold into their OWN SRS map (`intervalSrs`), never the
  // note schedule or the daily goal. Same offline-first save + best-effort
  // cloud push as every other learning write.
  const recordIntervalAnswer = useCallback(
    (itemId: string, correct: boolean) => {
      if (!isPremium || !itemId) return;
      const ts = Date.now();
      setNow(ts);
      setState((prev) => {
        const st = getInstrumentState(prev, instrumentId, ts);
        const next = withInstrumentState(
          prev,
          instrumentId,
          recordIntervalAnswerModel(st, itemId, correct, ts),
        );
        saveLearningStateLocal(next);
        cloudPushLearning();
        return next;
      });
      // Interval drill is its own isolated history sink (never Practice's
      // real history) — without this, a day spent only on Intervals would
      // never move the home-screen streak/goal.
      recordDailyActivity();
      // Same reasoning for weekly league XP (leagueActivity.ts).
      if (correct) recordLeagueActivity(instrumentId);
    },
    [isPremium, instrumentId],
  );

  const buildIntervalPlan = useCallback(
    (exercise: IntervalExercise): DrillConfig | null => {
      if (!isPremium) return null;
      return buildIntervalDrill({
        intervalSrs: instState.intervalSrs ?? {},
        now: Date.now(),
        maxFret: instrument.maxFret,
        allStrings: Array.from({ length: instrument.stringCount }, (_, i) => i + 1),
        accidental,
        order,
        notation,
        exercise,
      });
    },
    [isPremium, instState.intervalSrs, instrument.maxFret, instrument.stringCount, accidental, order, notation],
  );

  // ── Guided Interval Today answer (spec §13 / §14 / T9) ────────────────
  // The interval sibling of `recordAnswer`: folds into `intervalSrs`, ticks
  // the SEPARATE `intervalDaily` goal, and appends to the capped
  // `intervalHistory` — never the note schedule / goal / history. Reads the
  // interval tags the engine stamped on the drill row.
  const recordIntervalTeacherAnswer = useCallback(
    (entry: HistoryEntry) => {
      if (!isPremium || !entry.intervalItemId) return;
      const semitones = parseIntervalItemId(entry.intervalItemId);
      if (semitones == null) return;
      const itemId = entry.intervalItemId;
      const ts = Date.now();
      setNow(ts);
      setState((prev) => {
        const st = getInstrumentState(prev, instrumentId, ts);
        const next = withInstrumentState(
          prev,
          instrumentId,
          recordIntervalTeacherAnswerModel(st, {
            itemId,
            semitones,
            dir: entry.intervalDir ?? 'up',
            form: entry.intervalForm ?? 'findNote',
            correct: entry.correct === true,
            seconds:
              typeof entry.seconds === 'number' && entry.seconds >= 0 ? entry.seconds : 0,
          }, ts),
        );
        saveLearningStateLocal(next);
        cloudPushLearning();
        return next;
      });
      recordDailyActivity();
      if (entry.correct === true) recordLeagueActivity(instrumentId);
    },
    [isPremium, instrumentId],
  );

  // ── Guided interval plans (spec §13.1 / §13.2) ───────────────────────
  // The interval planner picks an ordered pool of qualities (overdue → weak →
  // current curriculum group → confuser completion → consolidation →
  // coverage). The pool / rationale do not depend on the exercise — only the
  // emitted `drill.interval.exercise` does — so the memoised values below
  // (built with the default exercise) drive the card's display, and
  // `buildIntervalTodayPlan` / `buildIntervalWeakSpotsPlan` rebuild the drill
  // for whichever exercise the learner picks on the card.
  const intervalPlannerBase = useMemo(() => {
    if (!isPremium) return null;
    return {
      intervalSrs: instState.intervalSrs ?? {},
      history: instState.intervalHistory ?? [],
      maxFret: instrument.maxFret,
      allStrings: Array.from({ length: instrument.stringCount }, (_, i) => i + 1),
      accidental,
      order,
      notation,
    };
  }, [
    isPremium, instState.intervalSrs, instState.intervalHistory,
    instrument.maxFret, instrument.stringCount, accidental, order, notation,
  ]);

  const { intervalTodayPlan, intervalWeakSpotsPlan } = useMemo<{
    intervalTodayPlan: IntervalTeacherPlan | null;
    intervalWeakSpotsPlan: IntervalTeacherPlan | null;
  }>(() => {
    if (!intervalPlannerBase) {
      return { intervalTodayPlan: null, intervalWeakSpotsPlan: null };
    }
    const base = { ...intervalPlannerBase, now, exercise: 'findTargetNote' as const };
    return {
      intervalTodayPlan: buildIntervalDailyPlanModel(base),
      intervalWeakSpotsPlan: buildIntervalWeakSpotsPlanModel(base),
    };
  }, [intervalPlannerBase, now]);

  const buildIntervalTodayPlan = useCallback(
    (exercise: IntervalExercise): IntervalTeacherPlan | null => {
      if (!intervalPlannerBase) return null;
      return buildIntervalDailyPlanModel({ ...intervalPlannerBase, now: Date.now(), exercise });
    },
    [intervalPlannerBase],
  );
  const buildIntervalWeakSpotsPlan = useCallback(
    (exercise: IntervalExercise): IntervalTeacherPlan | null => {
      if (!intervalPlannerBase) return null;
      return buildIntervalWeakSpotsPlanModel({ ...intervalPlannerBase, now: Date.now(), exercise });
    },
    [intervalPlannerBase],
  );

  // ── Interval progress board + Stats (spec §12 / §15.1) ───────────────
  // Pure, read-only. Derived every render from the interval SRS map and the
  // capped interval answer history — nothing here is stored (there is no
  // interval path / checkpoint record). Empty / null for a non-Premium user.
  const { intervalBoard, intervalStats } = useMemo<{
    intervalBoard: IntervalBoardRow[];
    intervalStats: IntervalStatsSummary | null;
  }>(() => {
    if (!isPremium) return { intervalBoard: [], intervalStats: null };
    const srsMap = instState.intervalSrs ?? {};
    const history = instState.intervalHistory ?? [];
    const board = buildIntervalBoard({ intervalSrs: srsMap, historyRows: history, now });

    const cutoff = now - INTERVAL_STATS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const recent = history.filter((r) => r.createdAt >= cutoff);
    const correct = recent.filter((r) => r.correct === true);
    const timed = correct.filter((r) => r.seconds > 0);

    const stats: IntervalStatsSummary = {
      inSystem: 11,
      started: distinctIntervalSizes(srsMap),
      needsWork: distinctIntervalSizes(srsMap, (it) => it.bucket < 2 && it.lapses > 0),
      mastered: board.filter((r) => r.status === 'mastered').length,
      accuracy: recent.length > 0 ? correct.length / recent.length : null,
      avgSeconds: timed.length > 0
        ? timed.reduce((sum, r) => sum + r.seconds, 0) / timed.length
        : null,
      currentGroupNameKey:
        INTERVAL_CURRICULUM[currentGroupIndex(masteredSizes(srsMap, history, now))].name,
    };
    return { intervalBoard: board, intervalStats: stats };
  }, [isPremium, instState.intervalSrs, instState.intervalHistory, now]);

  // ── Learning Path (P3) ───────────────────────────────────────────────
  // Every checkpoint's mastered %, star rating and unlock state, derived from
  // the SAME history + SRS the Teacher already reads. Pure; `now` injected.
  const pathView = useMemo<PathView | null>(() => {
    if (!isPremium) return null;
    return evaluatePath({
      entries,
      srs: instState.srs,
      instrument: { stringCount: instrument.stringCount, maxFret: instrument.maxFret },
      noteTable: notes,
      progress: instState.path,
      now,
    });
  }, [isPremium, entries, instState.srs, instState.path, instrument.stringCount, instrument.maxFret, now]);

  // Persist a checkpoint's stars the moment its live rating first passes the
  // stored best (monotonic — see `pathProgress.foldCheckpointStars`). Keeps
  // "finishing a checkpoint visibly advances them" true across a reload even
  // if later accuracy dips. Guarded by a signature so it runs only on a real
  // rise, never in a loop.
  const lastFoldSigRef = useRef('');
  useEffect(() => {
    if (!isPremium || !pathView) return;
    const risen = pathView.checkpoints.filter(
      (c) => c.liveStars > (instState.path.bestStars[c.checkpoint.id] ?? 0),
    );
    if (risen.length === 0) return;
    const sig = risen.map((c) => `${c.checkpoint.id}:${c.liveStars}`).join(',');
    if (sig === lastFoldSigRef.current) return;
    lastFoldSigRef.current = sig;
    const ts = Date.now();
    setState((prev) => {
      let st = getInstrumentState(prev, instrumentId, ts);
      for (const c of risen) {
        st = recordCheckpointStars(st, c.checkpoint.id, c.liveStars, ts);
      }
      const next = withInstrumentState(prev, instrumentId, st);
      saveLearningStateLocal(next);
      cloudPushLearning();
      return next;
    });
  }, [isPremium, pathView, instState.path, instrumentId]);

  // Positions from the current checkpoint that are not mastered yet — the
  // planner folds these in after overdue + weak (P3: "the planner now respects
  // Path position"). Capped so the Path never dominates a session.
  const pathItems = useMemo<DrillPosition[]>(() => {
    if (!pathView) return [];
    const cur = pathView.checkpoints[pathView.currentIndex];
    if (!cur || !cur.unlocked) return [];
    return cur.items
      .filter((it) => !it.mastered)
      .slice(0, 6)
      .map((it) => ({ string: it.string, fret: it.fret }));
  }, [pathView]);

  // ── Plans ────────────────────────────────────────────────────────────
  // Rebuilt when history, the SRS map, or the day changes. `now` is read
  // once here; the planner/weakness functions themselves take it explicitly
  // so they stay pure and testable.
  const plannerBase: Omit<PlannerOptions, 'now'> | null = useMemo(() => {
    if (!isPremium) return null;
    return {
      entries,
      srs: instState.srs,
      maxFret: instrument.maxFret,
      allStrings: Array.from({ length: instrument.stringCount }, (_, i) => i + 1),
      accidental,
      order,
      pathItems,
    };
  }, [isPremium, entries, instState.srs, instrument.maxFret, instrument.stringCount, accidental, order, pathItems]);

  const { todayPlan, weakSpotsPlan } = useMemo(() => {
    if (!plannerBase) return { todayPlan: null, weakSpotsPlan: null };
    return {
      todayPlan: buildDailyPlan({ ...plannerBase, now }),
      weakSpotsPlan: buildWeakSpotsPlan({ ...plannerBase, now }),
    };
  }, [plannerBase, now]);

  return {
    dailyGoal,
    goalComplete: isDailyGoalComplete(dailyGoal),
    todayPlan,
    weakSpotsPlan,
    trackedCount: Object.keys(instState.srs).length,
    pathView,
    recordAnswer,
    recordPracticeAnswer,
    intervalTrackedCount: distinctIntervalSizes(instState.intervalSrs ?? {}),
    recordIntervalAnswer,
    recordIntervalTeacherAnswer,
    buildIntervalPlan,
    intervalTodayPlan,
    intervalWeakSpotsPlan,
    buildIntervalTodayPlan,
    buildIntervalWeakSpotsPlan,
    intervalDailyGoal,
    intervalGoalComplete: isDailyGoalComplete(intervalDailyGoal),
    intervalBoard,
    intervalStats,
  };
}
