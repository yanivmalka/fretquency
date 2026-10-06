// ── intervalPlanner.ts — turn "what needs work" into one interval drill ──
//
// Intervals Learning spec §13 / §14 / T4. The interval-domain sibling of
// `planner.ts`: it picks a small ordered set of interval *qualities*
// (`interval:<n>`) and emits a `DrillConfig` whose `interval.semitones` pool
// is exactly those qualities, in priority order, so the guided session runs
// through the EXISTING `useDrillSession` / drill engine with no new mechanism.
//
// Split out of `intervalDrill.ts` (which keeps `buildIntervalDrill` for manual
// Selector sessions) because the planning logic is well past the ~150-line
// threshold the spec sets for keeping it inline (§20).
//
// Priority, high to low (spec §13.1):
//   1. overdue SRS qualities        — the standing plan says these are due
//   2. clearly weak qualities       — from `analyzeIntervalWeakness`
//   3. current curriculum group     — the not-yet-mastered qualities the
//                                     group introduces, so new material comes
//                                     in curriculum order (no ladder, no
//                                     stored progress — the group index is
//                                     derived on the fly from `masteredSizes`)
//   4. confuser completion          — if the pool holds one member of a
//                                     current-group confuser pair, pull in the
//                                     other so "tell them apart" always happens
//   5. consolidation                — qualities doing fine (bucket >= 2, not
//                                     due) so a session is not all struggle
//   6. coverage                     — least-practised of the qualities learned
//                                     so far, so a new learner still gets a
//                                     full session
//
// It never touches `planner.ts`, `weakness.ts`, the note `srs` / `daily` /
// `path`, or `src/game/**`. There is no curriculum ladder or stored-progress
// record anywhere — interval progress is `intervalSrs` + `intervalHistory`,
// and the current group is derived every call.

import type { DrillConfig } from '../drill/DrillConfig';
import type { AccidentalMode, NotationMode, OrderMode } from '../utils/music';
import type { IntervalHistoryRow } from './learningState';
import {
  intervalItemId,
  parseIntervalId,
  seedLegacyIntervalSrs,
  type IntervalDir,
  type IntervalSkill,
} from './intervalItem';
import { dueItems, type SrsItem, type SrsMap } from './srs';
import { ALL_INTERVAL_SEMITONES, type IntervalExercise } from '../utils/intervals';
import { intervalDifficulty } from './intervalDrill';
import {
  INTERVAL_CURRICULUM,
  currentGroupIndex,
  sizesThroughGroup,
} from './intervalCurriculum';
import { masteredSizes } from './intervalMastery';
import {
  analyzeIntervalWeakness,
  DEFAULT_INTERVAL_WEAKNESS_CONFIG,
  type IntervalWeaknessConfig,
  type IntervalWeaknessReason,
} from './intervalWeakness';

export type IntervalPlanBucket =
  | 'overdue'
  | 'weak'
  | 'group'
  | 'confuser'
  | 'consolidation'
  | 'coverage';

export interface IntervalPlannedItem {
  /** `interval:<n>`. */
  itemId: string;
  /** Interval size in semitones, 1..11. */
  semitones: number;
  bucket: IntervalPlanBucket;
  /** The skill this session drills (derived from the exercise): the pick was
   *  weighed on THIS skill's SRS + history only. */
  skill: IntervalSkill;
  /** Directions in which this skill is weak / due for the quality (empty for
   *  non-weakness buckets) — lets the UI say "ear is weak for M3 down". */
  weakDirs: IntervalDir[];
  /** Weakness reasons behind the pick (empty for non-weakness buckets). */
  reasons: IntervalWeaknessReason[];
}

export interface IntervalTeacherPlan {
  /** The qualities this session will drill, in priority order. */
  items: IntervalPlannedItem[];
  /** Ready to hand straight to `useDrillSession`. `interval.semitones` is the
   *  ordered pool; everything else is a plain, valid drill config. */
  drill: DrillConfig;
  /** Structured, translation-ready summary of why these were chosen. The UI
   *  turns these counts into a sentence; the planner does no i18n. */
  rationale: {
    overdue: number;
    weak: number;
    /** Not-yet-mastered qualities pulled in from the current curriculum
     *  group (spec §13.1 step 3). */
    group: number;
    /** Qualities added only to complete a current-group confuser pair. */
    confuser: number;
    consolidation: number;
    coverage: number;
    /** The current curriculum group's `id` (derived, never stored). */
    groupId: string;
    /** The final ordered pool (mirror of `drill.interval.semitones`). */
    semitones: number[];
  };
  /** 'weakSpots' = only overdue + weak (the "Practise my weak intervals"
   *  action); 'daily' = the recommended session, padded to a full session. */
  kind: 'daily' | 'weakSpots';
  generatedAt: number;
}

export interface IntervalPlannerOptions {
  /** The interval SRS map for ONE instrument (`intervalSrs`). */
  intervalSrs: SrsMap;
  /** The instrument's capped, synced interval answer history. */
  history: readonly IntervalHistoryRow[];
  now: number;
  maxFret: number;
  /** All drillable string numbers (1..stringCount). */
  allStrings: number[];
  accidental: AccidentalMode;
  order: OrderMode;
  /** Note-name notation — rides the `interval` spec so the engine's interval
   *  feedback matches `IntervalPrompt`'s spelling (#6). */
  notation?: NotationMode;
  /** Which exercise the guided session runs (spec §13.1 / OD-7 — one exercise
   *  per session, chosen on the Today card). */
  exercise: IntervalExercise;
  /** Ascending, descending, or a per-question mix. Default `'both'` — guided
   *  sessions drill both directions (§5.3). */
  direction?: 'up' | 'down' | 'both';
  /** Distinct qualities to aim for. Default 6 (spec §13.5 — the pool is 11
   *  qualities, not hundreds of positions). */
  sessionSize?: number;
  /** Questions the drill asks. Default 15 (the `mixed` tier — §9.3). */
  questionCount?: number;
  /** Base per-question seconds. Default 8 (the `mixed` tier — §9.3). */
  timeLimit?: number;
  /** Upper fret for the reference / target window the engine uses only to
   *  *sound* notes (not a difficulty-facing control — §9.3). Default
   *  min(12, maxFret). */
  fretTo?: number;
  weaknessCfg?: IntervalWeaknessConfig;
  /** Passed through to `currentGroupIndex` (spec §6.3 — tune in playtest). */
  readyRatio?: number;
}

const DEFAULT_SESSION_SIZE = 6;
const DEFAULT_FRET_TO = 12;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Build the recommended daily interval session. Always returns a plan with a
 * non-empty pool (falls back to current-group / coverage qualities when there
 * is nothing weak or due).
 */
export function buildIntervalDailyPlan(opts: IntervalPlannerOptions): IntervalTeacherPlan {
  return build(opts, 'daily');
}

/**
 * Build a "practise my weak intervals" session: overdue + weak qualities only
 * (spec §13.2). Returns `null` when nothing qualifies, so the Today card can
 * say "no weak intervals yet" rather than drilling arbitrary qualities.
 */
export function buildIntervalWeakSpotsPlan(
  opts: IntervalPlannerOptions,
): IntervalTeacherPlan | null {
  const plan = build(opts, 'weakSpots');
  return plan.items.length > 0 ? plan : null;
}

function build(
  opts: IntervalPlannerOptions,
  kind: 'daily' | 'weakSpots',
): IntervalTeacherPlan {
  const {
    intervalSrs,
    history,
    now,
    maxFret,
    allStrings,
    accidental,
    order,
    notation,
    exercise,
    direction = 'both',
    sessionSize = DEFAULT_SESSION_SIZE,
    weaknessCfg = DEFAULT_INTERVAL_WEAKNESS_CONFIG,
    readyRatio,
  } = opts;

  const cap = Math.max(1, Math.round(sessionSize));

  // One exercise = one skill: weigh only that skill's schedule and history, so
  // "mastered by calculation" never hides "weak by ear".
  const skill: IntervalSkill =
    exercise === 'identifyInterval' ? 'ear' : exercise === 'findTargetPosition' ? 'neck' : 'calc';
  const srsView = seedLegacyIntervalSrs(intervalSrs);
  const skillSrs: SrsMap = {};
  for (const [id, item] of Object.entries(srsView)) {
    if (parseIntervalId(id)?.skill === skill) skillSrs[id] = item;
  }

  // The current curriculum group — derived on the fly, nothing stored (§6.4).
  const mastered = masteredSizes(intervalSrs, history, now);
  const groupIdx = currentGroupIndex(mastered, readyRatio);
  const group = INTERVAL_CURRICULUM[groupIdx];

  const picked: IntervalPlannedItem[] = [];
  const seen = new Set<number>();
  // Returns true only when the quality was actually added, so callers that
  // keep their own tally count real picks, not attempts.
  const add = (
    size: number,
    bucket: IntervalPlanBucket,
    reasons: IntervalWeaknessReason[],
  ): boolean => {
    if (!(size >= 1 && size <= 11)) return false;
    if (seen.has(size) || picked.length >= cap) return false;
    seen.add(size);
    const weakDirs = (dirsBySize.get(size) ?? []) as IntervalDir[];
    picked.push({
      itemId: intervalItemId(size),
      semitones: size,
      bucket,
      skill,
      weakDirs: bucket === 'overdue' || bucket === 'weak' ? weakDirs : [],
      reasons,
    });
    return true;
  };

  const signals = analyzeIntervalWeakness(history, intervalSrs, now, weaknessCfg, skill);
  // Per quality: the strongest signal (both directions folded) + which
  // directions fired.
  const signalBySize = new Map<number, (typeof signals)[number]>();
  const dirsBySize = new Map<number, IntervalDir[]>();
  for (const sg of signals) {
    if (!signalBySize.has(sg.semitones)) signalBySize.set(sg.semitones, sg);
    const d = dirsBySize.get(sg.semitones) ?? [];
    if (!d.includes(sg.dir)) d.push(sg.dir);
    dirsBySize.set(sg.semitones, d);
  }

  // 1 — overdue SRS qualities, most overdue first.
  for (const it of dueItems(skillSrs, now)) {
    const size = parseIntervalId(it.itemId)?.semitones;
    if (size == null) continue;
    if (!dirsBySize.has(size)) dirsBySize.set(size, []);
    const d = dirsBySize.get(size)!;
    const dir = parseIntervalId(it.itemId)!.dir!;
    if (!d.includes(dir)) d.push(dir);
    add(size, 'overdue', signalBySize.get(size)?.reasons ?? ['overdue']);
  }

  // 2 — weak qualities not already pulled in as overdue.
  for (const sig of signals) {
    if (sig.overdue) continue; // already handled above (its quality is picked)
    add(sig.semitones, 'weak', sig.reasons);
  }

  let groupCount = 0;
  let confuserCount = 0;
  let consolidation = 0;
  let coverage = 0;

  if (kind === 'daily') {
    // 3 — current curriculum group: the qualities it introduces that are not
    // mastered yet, in the group's own order. This is what "introduce new
    // material in curriculum order" means — no ladder, no unlock gate, just
    // the next group, derived from `masteredSizes` (§13.1 step 3).
    for (const size of group.introduces) {
      if (picked.length >= cap) break;
      if (!mastered.has(size) && add(size, 'group', [])) groupCount++;
    }

    // 4 — confuser completion: if the pool holds one member of a current-group
    // confuser pair, pull in the other so the learner always practises telling
    // them apart (§13.5). Weak-spots plans stay strictly overdue ∪ weak
    // (§13.2), so this runs for the daily plan only.
    for (const [a, b] of group.confusers) {
      if (picked.length >= cap) break;
      if (seen.has(a) && !seen.has(b) && add(b, 'confuser', [])) confuserCount++;
      if (picked.length >= cap) break;
      if (seen.has(b) && !seen.has(a) && add(a, 'confuser', [])) confuserCount++;
    }

    if (picked.length < cap) {
      // 5 — consolidation: interval SRS qualities doing fine (bucket >= 2, not
      // due), most recently reviewed first, so a session ends on solid ground.
      const strong: { size: number; item: SrsItem }[] = [];
      for (const item of Object.values(skillSrs)) {
        if (!(item.bucket >= 2 && item.dueAt > now)) continue;
        const size = parseIntervalId(item.itemId)?.semitones;
        if (size == null || seen.has(size)) continue;
        strong.push({ size, item });
      }
      strong.sort(
        (a, b) => b.item.lastReviewedAt - a.item.lastReviewedAt || a.size - b.size,
      );
      for (const { size } of strong) {
        if (picked.length >= cap) break;
        if (add(size, 'consolidation', [])) consolidation++;
      }
    }

    if (picked.length < cap) {
      // 6 — coverage: least-practised of the qualities learned so far (the
      // curriculum's introduced-through-current set), so a new learner always
      // has a full session. When nothing is introduced yet, fall back to all
      // 11 so the pool is never empty.
      const learned = sizesThroughGroup(groupIdx);
      const coveragePool = learned.length > 0 ? learned : [...ALL_INTERVAL_SEMITONES];
      for (const size of leastPractised(history, coveragePool)) {
        if (picked.length >= cap) break;
        if (add(size, 'coverage', [])) coverage++;
      }
    }
  }

  const overdue = picked.filter((p) => p.bucket === 'overdue').length;
  const weak = picked.filter((p) => p.bucket === 'weak').length;

  const semitones = picked.map((p) => p.semitones);
  const strings = allStrings.length > 0 ? [...allStrings] : [1];
  const fretTo = Math.max(3, Math.min(opts.fretTo ?? DEFAULT_FRET_TO, maxFret));

  // A guided session ALWAYS runs the fixed `mixed` envelope (§13.1 / §13.5) —
  // both directions, the current group's in-pool confuser pairs completed. The
  // planner never picks `focused` / `full`; a learner who wants those uses the
  // Selector. `opts.questionCount` / `opts.timeLimit` still override for tests.
  const env = intervalDifficulty('mixed', semitones, group, mastered);
  const baseCount = opts.questionCount ?? env.questionCount;
  const baseTime = opts.timeLimit ?? env.timeLimit;

  // Light, predictable adaptivity (mirror `planner.ts`'s `clusterAcc` nudge):
  // if the chosen pool's recent accuracy is low, give a touch more time; if it
  // is already strong, a touch less.
  const clusterAcc = averageRecentAccuracy(semitones, signalBySize);
  const nudgedTime =
    clusterAcc != null && clusterAcc < 0.6
      ? baseTime + 1
      : clusterAcc != null && clusterAcc > 0.9
        ? baseTime - 1
        : baseTime;

  const drill: DrillConfig = {
    strings,
    primaryString: strings[0],
    isMulti: strings.length > 1,
    // The two chip-row exercises answer through the by-fret flow; *find on the
    // neck* answers with a fret tap on `FretGrid`, i.e. the by-note flow.
    mode: exercise === 'findTargetPosition' ? 'byNote' : 'byFret',
    fretFrom: 0,
    fretTo,
    wholeToneOnly: false,
    dotsOnly: false,
    questionCount: clamp(baseCount, Math.max(4, semitones.length), 30),
    timeLimit: clamp(nudgedTime, 4, 12),
    accidental,
    order,
    interval: {
      semitones,
      direction,
      exercise,
      notation,
      optionCount: env.optionCount,
      firstNoteBias: env.firstNoteBias,
      registerSpread: env.registerSpread,
      optionPolicy: env.optionPolicy,
      confuserPairs: env.confuserPairs,
    },
  };

  return {
    items: picked,
    drill,
    rationale: {
      overdue,
      weak,
      group: groupCount,
      confuser: confuserCount,
      consolidation,
      coverage,
      groupId: group.id,
      semitones,
    },
    kind,
    generatedAt: now,
  };
}

/** Sizes from `pool`, fewest lifetime answers first; ties by semitone size.
 *  The interval-quality analogue of `weakness.ts`'s `leastPractisedPositions`. */
function leastPractised(
  rows: readonly IntervalHistoryRow[],
  pool: number[],
): number[] {
  const attempts = new Map<number, number>();
  for (const r of rows) {
    if (r.semitones >= 1 && r.semitones <= 11) {
      attempts.set(r.semitones, (attempts.get(r.semitones) ?? 0) + 1);
    }
  }
  return [...pool].sort(
    (a, b) => (attempts.get(a) ?? 0) - (attempts.get(b) ?? 0) || a - b,
  );
}

function averageRecentAccuracy(
  sizes: number[],
  signalBySize: Map<number, { weightedAccuracy: number; attempts: number }>,
): number | null {
  const accs: number[] = [];
  for (const size of sizes) {
    const s = signalBySize.get(size);
    if (s && s.attempts > 0) accs.push(s.weightedAccuracy);
  }
  if (accs.length === 0) return null;
  return accs.reduce((a, b) => a + b, 0) / accs.length;
}
