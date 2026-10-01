// ── useScaleSelector — the Scales Selector's picks + derived pool/envelope ─
//
// The Scales-domain counterpart of `useIntervalSelector.ts` (scales-learning-
// spec.md §5, Session 2 plan step 2) — but simpler, because Scales doesn't
// build a `DrillConfig` (it runs its own dedicated engines, see
// `useScaleFallEngine.ts` / `useScaleChipEngine.ts`'s header comments). This
// hook owns the picks + persistence and derives the `ScalePoolItem[]` pool
// plus the question envelope (count/time/option-count/root-bias) those
// engines consume. Wired into `ScalePracticeScreen.tsx`, which renders a
// minimal segmented-button UI for each control (not yet the richer
// `IntervalSelectorPanel`-style layout).
//
// §5.2 ("scale selection") is built in its simplest form now that a second
// scale type ships: one scale, or all shipped scales. `SHIPPED_SCALE_TYPE_IDS`
// is the one place to widen when the next scale type ships.
//
// Position (§5.3) and Difficulty (§5.4) ARE built: two positions already
// exist per shipped scale type (§4.3's generative "box 1" / "box 2"), so
// "this position vs. all positions" is a real, useful choice today.

import { useMemo, useState } from 'react';
import { loadSetting, saveSetting } from '../utils/settings';
import { buildScalePool, type ScalePoolItem, type ScaleDirection } from '../learning/scaleDrill';
import { scalePositionsFor, SCALE_TYPES, type ScalePositionDef } from '../utils/scales';
import type { ScaleChipExercise } from './useScaleChipEngine';
import type { FallSpeed } from '../learning/scaleFall';

/** Every row in `SCALE_TYPES` is offered — adding a scale type there is all
 *  it takes for the Selector to show it. */
const SHIPPED_SCALE_TYPE_IDS: readonly string[] = SCALE_TYPES.map((s) => s.id);

/** Which scale(s) a session draws from: one scale type id, or every shipped one. */
export type ScaleChoice = 'all' | string;

export type ScaleExercise = 'buildScale' | 'orderScale' | ScaleChipExercise;
export type ScalePositionMode = 'one' | 'all';
export type ScaleDifficulty = 'focused' | 'mixed' | 'full';

const EXERCISES: readonly ScaleExercise[] = ['buildScale', 'orderScale', 'identifyScale', 'nameDegree'];
const POSITION_MODES: readonly ScalePositionMode[] = ['one', 'all'];
const DIFFICULTIES: readonly ScaleDifficulty[] = ['focused', 'mixed', 'full'];
const DIRECTIONS: readonly ScaleDirection[] = ['up', 'down', 'both'];

function loadOneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const raw = loadSetting<string>(key, fallback);
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

/** The §9.2 envelope table, tuned separately for Exercise A (tap N
 *  positions, needs more time) vs. the chip exercises (one tap). Concrete
 *  numbers are a starting point, same as Intervals' own "tune in playtest"
 *  note (§9.3 there). */
export interface ScaleEnvelope {
  questionCount: number;
  timeLimit: number;
  optionCount: number;
  /** §9.1's "root bias": naturals-only at `focused`, any root otherwise. */
  naturalsOnlyRoot: boolean;
  /** Exercise A only: how fast the rows fall (rows/second) and how quickly
   *  that ramps up over a session — `timeLimit` has no meaning there. */
  fallSpeed: FallSpeed;
}

/** How Exercise A shows the distance to the next note: in tones (a half tone
 *  is ½) or in frets (a half tone is one fret, a tone is two). */
export const DISTANCE_UNITS = ['tones', 'frets'] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

/** Exercise A's fall-speed dial, slow (1) to fast (5). 3 is the difficulty's
 *  own tuned speed; the others scale start, cap and ramp together. */
export const FALL_SPEED_LEVELS = [1, 2, 3, 4, 5] as const;
export type FallSpeedLevel = (typeof FALL_SPEED_LEVELS)[number];
const FALL_SPEED_FACTOR: Record<FallSpeedLevel, number> = { 1: 0.5, 2: 0.75, 3: 1, 4: 1.35, 5: 1.8 };

function scaleFallSpeed(speed: FallSpeed, level: FallSpeedLevel): FallSpeed {
  const k = FALL_SPEED_FACTOR[level];
  return { start: speed.start * k, max: speed.max * k, accel: speed.accel * k };
}

function envelopeFor(
  difficulty: ScaleDifficulty, isChipExercise: boolean, speedLevel: FallSpeedLevel,
): ScaleEnvelope {
  const env = baseEnvelopeFor(difficulty, isChipExercise);
  return { ...env, fallSpeed: scaleFallSpeed(env.fallSpeed, speedLevel) };
}

function baseEnvelopeFor(difficulty: ScaleDifficulty, isChipExercise: boolean): ScaleEnvelope {
  switch (difficulty) {
    case 'focused':
      return {
        questionCount: isChipExercise ? 8 : 6, timeLimit: 12, optionCount: 2, naturalsOnlyRoot: true,
        fallSpeed: { start: 1.0, max: 3.0, accel: 0.04 },
      };
    case 'full':
      return {
        questionCount: isChipExercise ? 12 : 10, timeLimit: 8, optionCount: 4, naturalsOnlyRoot: false,
        fallSpeed: { start: 1.6, max: 5.0, accel: 0.07 },
      };
    case 'mixed':
    default:
      return {
        questionCount: isChipExercise ? 10 : 8, timeLimit: 10, optionCount: 4, naturalsOnlyRoot: false,
        fallSpeed: { start: 1.3, max: 4.0, accel: 0.05 },
      };
  }
}

export function useScaleSelector(stringCount: number) {
  // Defaults favour a new learner's first run (product-owner request,
  // 2026-10-01): "Tap the scale in order" in its demo-first learning mode, on
  // the single most basic scale, one position — not the old "every exercise/
  // scale/position" wide-open defaults. An existing player's own stored picks
  // are untouched; this only changes what a fresh install lands on.
  const [exercise, setExerciseState] = useState<ScaleExercise>(
    () => loadOneOf('ssel_exercise', EXERCISES, 'orderScale'),
  );
  const [scaleChoiceStored, setScaleChoiceState] = useState<ScaleChoice>(() => {
    const raw = loadSetting<string>('ssel_scale', 'minorPentatonic');
    return raw === 'all' || SHIPPED_SCALE_TYPE_IDS.includes(raw) ? raw : 'minorPentatonic';
  });
  const [positionModeStored, setPositionModeState] = useState<ScalePositionMode>(
    () => loadOneOf('ssel_position_mode', POSITION_MODES, 'one'),
  );
  const [positionIndex, setPositionIndexState] = useState<number>(
    () => loadSetting<number>('ssel_position_index', 1),
  );
  const [difficultyStored, setDifficultyState] = useState<ScaleDifficulty>(
    () => loadOneOf('ssel_difficulty', DIFFICULTIES, 'mixed'),
  );

  const [speedLevel, setSpeedLevelState] = useState<FallSpeedLevel>(() => {
    const raw = loadSetting<number>('ssel_fall_speed', 3);
    return (FALL_SPEED_LEVELS as readonly number[]).includes(raw) ? (raw as FallSpeedLevel) : 3;
  });

  // Direction is stored as 'up' | 'down' | 'both' but presented as two
  // independent tiles, exactly like the Intervals selector: either or both,
  // never neither.
  const [dirUp, setDirUpState] = useState<boolean>(() => {
    const d = loadOneOf('ssel_direction', DIRECTIONS, 'up');
    return d === 'up' || d === 'both';
  });
  const [dirDown, setDirDownState] = useState<boolean>(() => {
    const d = loadOneOf('ssel_direction', DIRECTIONS, 'up');
    return d === 'down' || d === 'both';
  });
  const direction: ScaleDirection = dirUp && dirDown ? 'both' : dirDown ? 'down' : 'up';
  const toggleDirection = (which: 'up' | 'down') => {
    const nextUp = which === 'up' ? !dirUp : dirUp;
    const nextDown = which === 'down' ? !dirDown : dirDown;
    if (!nextUp && !nextDown) return;
    setDirUpState(nextUp);
    setDirDownState(nextDown);
    saveSetting('ssel_direction', nextUp && nextDown ? 'both' : nextDown ? 'down' : 'up');
  };

  const activeScaleTypeIds = useMemo<readonly string[]>(
    () => (scaleChoiceStored === 'all' ? SHIPPED_SCALE_TYPE_IDS : [scaleChoiceStored]),
    [scaleChoiceStored],
  );
  // One entry per box number: with several scales active, "Box 1" means box 1
  // of every one of them.
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>(
    () => loadOneOf('ssel_distance_unit', DISTANCE_UNITS, 'tones'),
  );

  const availablePositions = useMemo<ScalePositionDef[]>(() => {
    const all = activeScaleTypeIds.flatMap((id) => scalePositionsFor(id, stringCount));
    return all.filter((p, i) => all.findIndex((q) => q.positionIndex === p.positionIndex) === i);
  }, [activeScaleTypeIds, stringCount]);
  // "This position / all positions" is only a meaningful choice once a scale
  // type actually has more than one authored position on this instrument.
  const positionChoiceAvailable = availablePositions.length > 1;
  const positionMode: ScalePositionMode = positionChoiceAvailable ? positionModeStored : 'all';
  // Picking a single position IS the "focused pool" idea (§9.1's position-
  // spread dimension) — clamped exactly like Intervals clamps difficulty to
  // `focused` when "One scale" is picked (§5.4).
  const difficulty: ScaleDifficulty = positionMode === 'one' ? 'focused' : difficultyStored;

  const setExercise = (e: ScaleExercise) => { setExerciseState(e); saveSetting('ssel_exercise', e); };
  const setScaleChoice = (c: ScaleChoice) => { setScaleChoiceState(c); saveSetting('ssel_scale', c); };
  const setPositionMode = (m: ScalePositionMode) => { setPositionModeState(m); saveSetting('ssel_position_mode', m); };
  const setPositionIndex = (i: number) => { setPositionIndexState(i); saveSetting('ssel_position_index', i); };
  const setDifficulty = (d: ScaleDifficulty) => { setDifficultyState(d); saveSetting('ssel_difficulty', d); };

  // "Tap the scale in order"'s learning mode: the app plays each scale first,
  // lighting its notes in turn, and the learner plays it after.
  const [orderDemo, setOrderDemoState] = useState<boolean>(() => loadSetting<boolean>('ssel_order_demo', true) === true);
  const setOrderDemo = (on: boolean) => { setOrderDemoState(on); saveSetting('ssel_order_demo', on); };
  // "Tap the scale in order" answered by playing the guitar (pitch detection)
  // instead of tapping. The screen offers it wherever the device can listen.
  const [orderGuitar, setOrderGuitarState] = useState<boolean>(() => loadSetting<boolean>('ssel_order_guitar', false) === true);
  const setOrderGuitar = (on: boolean) => { setOrderGuitarState(on); saveSetting('ssel_order_guitar', on); };

  const setSpeedLevel = (l: FallSpeedLevel) => { setSpeedLevelState(l); saveSetting('ssel_fall_speed', l); };
  const setDistanceUnit = (u: DistanceUnit) => { setDistanceUnitState(u); saveSetting('ssel_distance_unit', u); };

  const pool = useMemo<ScalePoolItem[]>(() => {
    const full = buildScalePool(activeScaleTypeIds, stringCount);
    if (positionMode === 'one') {
      const chosen = full.filter((p) => p.positionIndex === positionIndex);
      return chosen.length > 0 ? chosen : full;
    }
    return full;
  }, [activeScaleTypeIds, stringCount, positionMode, positionIndex]);

  const buildEnvelope = (isChipExercise: boolean): ScaleEnvelope => envelopeFor(difficulty, isChipExercise, speedLevel);

  return {
    direction, dirUp, dirDown, toggleDirection,
    speedLevel, setSpeedLevel,
    distanceUnit, setDistanceUnit,
    orderDemo, setOrderDemo,
    orderGuitar, setOrderGuitar,
    exercise, setExercise,
    scaleChoice: scaleChoiceStored, setScaleChoice, shippedScaleTypeIds: SHIPPED_SCALE_TYPE_IDS,
    positionMode, setPositionMode, positionChoiceAvailable,
    positionIndex, setPositionIndex, availablePositions,
    difficulty, difficultyStored, setDifficulty,
    pool,
    buildEnvelope,
  };
}
