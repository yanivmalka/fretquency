// ── intervalMastery.ts — each interval's status + the flat 11-row board ──
//
// Intervals Learning spec §11 / §12. Pure evaluation: given the interval SRS
// map and the capped interval answer history, decide for each of the 11
// drilled qualities whether it is `notStarted` / `learning` / `mastered`, and
// build the flat status board the interval Stats surface renders.
//
// There is NO interval learning ladder — no stages, no unlock progression, no
// per-stage bars, no stars, no stored progress record. Progress is exactly
// this flat board, mirroring how `src/utils/mastery.ts`'s
// `unplayed / needsWork / known` overlay presents the fretboard. The only
// persisted interval progress is `intervalSrs` (+ the capped `intervalHistory`);
// everything here is derived every render.
//
// The mastery constants are this domain's OWN values — deliberately NOT
// imported from the Notes side (`pathProgress.ts`) so tuning one domain never
// silently moves the other (spec §11.1, §19). They happen to start close to
// the Notes numbers.
//
// Recency model (approved spec — product-wishlist.md, "Recency model:
// exponential time-decay for the practice-statistics windows"). The
// `notStarted` / `learning` / `mastered` classification runs on the weighted
// decay engine in `./recency`: every surviving answer inside the 180-day cap
// gets weight `w = 0.5 ** (ageMs / halfLifeMs)`, the quality's strength is the
// weighted accuracy `Σ(w·correct) / Σ w`, and its evidence weight is
// `effectiveN = Σ w`. Below `INTERVAL_MIN_EFFECTIVE_N` the weighted accuracy is
// discarded as noise and the score is the SRS-bucket mapping alone (0 when
// there is no schedule row); at or above it, the weighted accuracy stands
// alone and a well-scheduled quality with recent struggle CAN lose its status. The board's accuracy bar and the Stats headline are a SEPARATE, plain
// unweighted ratio over `INTERVAL_STATS_WINDOW_DAYS` (45) — so a row's label and
// its bar can legitimately disagree.
//
// This module imports nothing from `src/game/**`.

import type { IntervalHistoryRow } from './learningState';
import type { SrsMap } from './srs';
import {
  INTERVAL_DIRS,
  INTERVAL_SKILLS,
  intervalItemId,
  intervalSkillItemId,
  seedLegacyIntervalSrs,
  skillOfForm,
  type IntervalDir,
  type IntervalSkill,
} from './intervalItem';
import { INTERVALS, ALL_INTERVAL_SEMITONES } from '../utils/intervals';
import { INTERVAL_CURRICULUM, sizesThroughGroup } from './intervalCurriculum';
import {
  DAY_MS,
  DEFAULT_HALF_LIFE_DAYS,
  HARD_CAP_DAYS,
  weightedAccuracy,
  positionScore,
} from './recency';

// ── Constants (own values — see the header note) ───────────────────────

/** SRS bucket at or above which a quality counts as mastered (same start
 *  point as notes, tuned independently). */
export const INTERVAL_MASTERED_BUCKET = 3;
/** Weighted recent accuracy at or above which a quality counts as mastered.
 *  Lowered from 0.85 to 0.80 (recency-decay plan §3 item 6): now that the SRS
 *  bucket no longer backstops a well-scheduled quality once `effectiveN` clears
 *  the gate, 0.85 would drop a genuinely-known quality to "learning" on a single
 *  recent slip (4 of 5). The thin-evidence bucket-3 floor stays 0.85, so a
 *  quality at bucket >= `INTERVAL_MASTERED_BUCKET` with little recent history
 *  still reads as mastered. */
export const INTERVAL_MASTERED_ACCURACY = 0.8;
/** Minimum `effectiveN` (weighted answer count) inside the decay cap before the
 *  weighted accuracy is trusted on its own — one more than notes, because there
 *  are only 11 qualities and more chance to fluke a short streak (spec §11.1,
 *  recency-decay plan §3 item 3). Below this, `positionScore` discards the
 *  weighted accuracy and uses the SRS bucket mapping alone. */
export const INTERVAL_MIN_EFFECTIVE_N = 4;
/** History rows older than this are excluded from the decay engine entirely —
 *  a performance / storage bound only, never a data delete. Matches the shared
 *  {@link HARD_CAP_DAYS} used across the learning layer. */
export const INTERVAL_MASTERY_MAX_AGE_DAYS = HARD_CAP_DAYS;
/** The plain (unweighted) display window, in days, behind the board's accuracy
 *  bar and the interval Stats headline numbers. Deliberately narrower than the
 *  180-day decay cap and independent of it (recency-decay plan §3 item 4) so
 *  the headline numbers stay stable while the classification engine changes. */
export const INTERVAL_STATS_WINDOW_DAYS = 45;

const HALF_LIFE_MS = DEFAULT_HALF_LIFE_DAYS * DAY_MS;

export type IntervalStatus = 'notStarted' | 'learning' | 'mastered';

// ── Weighted recent stats for one quality (the classification engine) ──

interface WeightedStats {
  /** Weighted accuracy `Σ(w·correct) / Σ w` over the surviving rows, 0–1. */
  accuracy: number;
  /** Effective sample size `Σ w` — the evidence weight. */
  effectiveN: number;
  /** Raw count of rows that survived the 180-day cap (display only). */
  attempts: number;
}

// `IntervalHistoryRow.createdAt` is epoch ms; `normalizeIntervalHistory`
// already drops rows with a non-positive timestamp.
function weightedStats(
  historyRows: readonly IntervalHistoryRow[],
  size: number,
  now: number,
  cell?: { skill: IntervalSkill; dir: IntervalDir },
): WeightedStats {
  const cutoff = now - INTERVAL_MASTERY_MAX_AGE_DAYS * DAY_MS;
  const rows = historyRows.filter(
    (r) =>
      r.semitones === size &&
      r.createdAt >= cutoff &&
      (!cell || (skillOfForm(r.form) === cell.skill && r.dir === cell.dir)),
  );
  const { accuracy, effectiveN } = weightedAccuracy(
    rows.map((r) => ({ correct: r.correct === true, atMs: r.createdAt })),
    now,
    HALF_LIFE_MS,
  );
  return { accuracy, effectiveN, attempts: rows.length };
}

/** A quality's continuous 0..1 strength: the weighted accuracy once there is
 *  enough fresh evidence, otherwise the SRS bucket floor. */
function intervalStrength(
  size: number,
  intervalSrs: SrsMap,
  historyRows: readonly IntervalHistoryRow[],
  now: number,
): number {
  const srsItem = intervalSrs[intervalItemId(size)];
  const { accuracy, effectiveN } = weightedStats(historyRows, size, now);
  return positionScore(
    accuracy,
    effectiveN,
    srsItem ? srsItem.bucket : null,
    INTERVAL_MIN_EFFECTIVE_N,
  );
}

// ── Plain unweighted display window (the board bar + Stats headline) ───

interface DisplayStats {
  /** Answers inside the 45-day display window. */
  attempts: number;
  /** Correct / attempts over that window, 0–1 (0 when attempts === 0). */
  accuracy: number;
}

function displayStats(
  historyRows: readonly IntervalHistoryRow[],
  size: number,
  now: number,
): DisplayStats {
  const cutoff = now - INTERVAL_STATS_WINDOW_DAYS * DAY_MS;
  const rows = historyRows.filter(
    (r) => r.semitones === size && r.createdAt >= cutoff,
  );
  if (rows.length === 0) return { attempts: 0, accuracy: 0 };
  const correct = rows.filter((r) => r.correct === true).length;
  return { attempts: rows.length, accuracy: correct / rows.length };
}

// ── Per-skill cells (quality × skill × direction) ─────────────────────
//
// "Mastered" is only meaningful per skill: calculating the target note says
// nothing about hearing it. A cell is one (quality, skill, direction); a skill
// is its two direction cells; the board row shows the three skills.

function cellStrength(
  size: number,
  skill: IntervalSkill,
  dir: IntervalDir,
  srsView: SrsMap,
  historyRows: readonly IntervalHistoryRow[],
  now: number,
): number {
  const srsItem = srsView[intervalSkillItemId(size, skill, dir)];
  const { accuracy, effectiveN } = weightedStats(historyRows, size, now, { skill, dir });
  return positionScore(accuracy, effectiveN, srsItem ? srsItem.bucket : null, INTERVAL_MIN_EFFECTIVE_N);
}

function cellStatus(
  size: number,
  skill: IntervalSkill,
  dir: IntervalDir,
  srsView: SrsMap,
  historyRows: readonly IntervalHistoryRow[],
  now: number,
): IntervalStatus {
  if (cellStrength(size, skill, dir, srsView, historyRows, now) >= INTERVAL_MASTERED_ACCURACY) {
    return 'mastered';
  }
  const started =
    srsView[intervalSkillItemId(size, skill, dir)] != null ||
    weightedStats(historyRows, size, now, { skill, dir }).attempts > 0;
  return started ? 'learning' : 'notStarted';
}

export interface IntervalSkillStatus {
  /** `mastered` only when EVERY direction practised so far is mastered
   *  (and at least one has been practised). */
  status: IntervalStatus;
  up: IntervalStatus;
  down: IntervalStatus;
  /** Both directions have been practised — "mastered" on the board needs this. */
  bothDirs: boolean;
}

/** One skill's status for one quality (ear / calc / neck). */
export function intervalSkillStatus(
  size: number,
  skill: IntervalSkill,
  intervalSrs: SrsMap,
  historyRows: readonly IntervalHistoryRow[],
  now: number,
): IntervalSkillStatus {
  const view = seedLegacyIntervalSrs(intervalSrs);
  const [up, down] = INTERVAL_DIRS.map((d) =>
    cellStatus(size, skill, d, view, historyRows, now),
  );
  const started = [up, down].filter((x) => x !== 'notStarted');
  const status: IntervalStatus =
    started.length === 0
      ? 'notStarted'
      : started.every((x) => x === 'mastered')
        ? 'mastered'
        : 'learning';
  return { status, up, down, bothDirs: started.length === 2 };
}

// Does this quality have any stored fine-grained SRS row? If not, it is a
// pre-split account for that quality and curriculum progression keeps the old
// pooled rule, so an existing learner's group never moves backwards.
function hasFineSrs(size: number, intervalSrs: SrsMap): boolean {
  return INTERVAL_SKILLS.some((k) =>
    INTERVAL_DIRS.some((d) => intervalSrs[intervalSkillItemId(size, k, d)] != null),
  );
}

// ── Public predicates ────────────────────────────────────────────────

/**
 * Is this interval quality mastered? True when its continuous strength score is
 * at or above {@link INTERVAL_MASTERED_ACCURACY}. That score is the weighted
 * recent accuracy once `effectiveN >= `{@link INTERVAL_MIN_EFFECTIVE_N}; below
 * that gate it falls back to the SRS bucket floor, so a bucket at or above
 * {@link INTERVAL_MASTERED_BUCKET} (whose floor is 0.85) still reads as
 * mastered while recent evidence is thin. Pure; deterministic.
 */
export function isIntervalMastered(
  size: number,
  intervalSrs: SrsMap,
  historyRows: readonly IntervalHistoryRow[],
  now: number,
): boolean {
  if (!hasFineSrs(size, intervalSrs)) {
    return (
      intervalStrength(size, intervalSrs, historyRows, now) >=
      INTERVAL_MASTERED_ACCURACY
    );
  }
  // Curriculum progression ("ready for the next group"): every skill the
  // learner has started is mastered. A learner who only ever drills one
  // exercise still progresses; the BOARD (below) is what shows the other
  // skills as not yet proven.
  const skills = INTERVAL_SKILLS.map(
    (k) => intervalSkillStatus(size, k, intervalSrs, historyRows, now).status,
  ).filter((x) => x !== 'notStarted');
  return skills.length > 0 && skills.every((x) => x === 'mastered');
}

/**
 * The three-state status for one interval quality:
 *   • `mastered`   — {@link isIntervalMastered} holds;
 *   • `notStarted` — no schedule row AND no history inside the decay cap;
 *   • `learning`   — anything in between.
 * Same three-level idea as `utils/mastery.ts`'s `unplayed / needsWork / known`.
 */
export function intervalStatus(
  size: number,
  intervalSrs: SrsMap,
  historyRows: readonly IntervalHistoryRow[],
  now: number,
): IntervalStatus {
  if (isIntervalMastered(size, intervalSrs, historyRows, now)) return 'mastered';
  const hasSchedule = intervalSrs[intervalItemId(size)] != null;
  const { attempts } = weightedStats(historyRows, size, now);
  return hasSchedule || attempts > 0 ? 'learning' : 'notStarted';
}

/**
 * The set of semitone sizes that are currently mastered. This is the input the
 * curriculum's `currentGroupIndex` consumes to decide the Teacher's current
 * group (spec §6.3, §11.1) — nothing is stored.
 */
export function masteredSizes(
  intervalSrs: SrsMap,
  historyRows: readonly IntervalHistoryRow[],
  now: number,
): Set<number> {
  const out = new Set<number>();
  for (const size of ALL_INTERVAL_SEMITONES) {
    if (isIntervalMastered(size, intervalSrs, historyRows, now)) out.add(size);
  }
  return out;
}

// ── The flat 11-interval board ───────────────────────────────────────

export interface IntervalBoardRow {
  /** Interval size in semitones, 1..11. */
  semitones: number;
  /** Short label, e.g. `M3` (from `INTERVALS`). */
  short: string;
  /** Full-name i18n key, e.g. `Major 3rd` (from `INTERVALS`). */
  nameKey: string;
  /** Overall: `mastered` ONLY when all three skills are mastered in both
   *  directions; `learning` once any skill started; else `notStarted`. */
  status: IntervalStatus;
  /** Per-skill breakdown — what the board shows so "mastered" is never claimed
   *  for a quality that is only known in one skill. */
  skills: Record<IntervalSkill, IntervalSkillStatus>;
  /** Plain unweighted accuracy over the 45-day display window, 0–1 (0 when no
   *  recent answers) — the thin bar. Independent of `status`, so the two can
   *  legitimately disagree (recency-decay plan §7 item 5). */
  recentAccuracy: number;
  /** Answers counted in the 45-day display window. */
  attempts: number;
  /** The continuous 0..1 strength score behind `status` (weighted accuracy, or
   *  the SRS bucket floor while evidence is thin). No UI consumes it yet. */
  strength: number;
}

export interface IntervalBoardOptions {
  intervalSrs: SrsMap;
  historyRows: readonly IntervalHistoryRow[];
  now: number;
}

// The 11 sizes in curriculum introduction order (spec §12.1), not semitone
// order — `sizesThroughGroup` past the last group yields every introduced size
// in that order.
const CURRICULUM_ORDER: readonly number[] = sizesThroughGroup(
  INTERVAL_CURRICULUM.length - 1,
);

/**
 * Build the flat 11-interval status board: one row per quality, in curriculum
 * order. `status` / `strength` come from the weighted 180-day decay engine;
 * `recentAccuracy` / `attempts` are the plain unweighted 45-day display window.
 * Pure — derived entirely from `intervalSrs` + `intervalHistory`; no storage of
 * its own.
 */
export function buildIntervalBoard(opts: IntervalBoardOptions): IntervalBoardRow[] {
  const { intervalSrs, historyRows, now } = opts;
  return CURRICULUM_ORDER.map((size) => {
    const def = INTERVALS.find((d) => d.semitones === size)!;
    const display = displayStats(historyRows, size, now);
    const skills = Object.fromEntries(
      INTERVAL_SKILLS.map((k) => [k, intervalSkillStatus(size, k, intervalSrs, historyRows, now)]),
    ) as Record<IntervalSkill, IntervalSkillStatus>;
    const all = INTERVAL_SKILLS.map((k) => skills[k]);
    const status: IntervalStatus = all.every((x) => x.status === 'mastered' && x.bothDirs)
      ? 'mastered'
      : all.some((x) => x.status !== 'notStarted')
        ? 'learning'
        : 'notStarted';
    return {
      semitones: size,
      short: def.short,
      nameKey: def.nameKey,
      status,
      skills,
      recentAccuracy: display.accuracy,
      attempts: display.attempts,
      strength: intervalStrength(size, intervalSrs, historyRows, now),
    };
  });
}
