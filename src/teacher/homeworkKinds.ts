// ── Homework beyond Notes: intervals, scales, staff reading, tab reading ──
//
// Pure, no React, no Supabase. `homework.ts` covers the original Notes drill
// (a plain `DrillConfig` stored in `public.homework.drill`). A teacher can also
// assign one drill from each Premium learning domain; this file defines what
// those look like on the wire and validates them on the way back.
//
// Wire format: the Notes drill keeps its old shape (no `kind`, so existing
// rows and old app builds are untouched). Every other kind is a small object
// with a `kind` tag and **no `mode` field** — an old build's
// `parseHomeworkDrill` requires `mode`, so it returns null for these and the
// student sees "Update the app to open this homework" rather than a silently
// wrong Notes drill.
//
// The student side never trusts the stored jsonb: `parseHomework` re-validates
// every field against the instrument and returns null for anything it can't
// run. Display prefs (sharps/flats, note order, notation) are the student's
// own and are overlaid at run time, not stored.
//
// First slice, deliberately narrower than the Learn screens (one exercise
// family per domain, no SRS, nothing written to the learning state — a
// homework run is visible to the teacher only):
//   • intervals — identify the interval / find the target note / find it on
//     the neck, a chosen set of sizes, a direction;
//   • scales    — identify the scale / name the degree, a chosen set of scales;
//   • staff     — name the note / find it on the neck / read a phrase;
//   • tab       — name the note / find it on the neck / read a riff.
// The "write it" exercises (place a note on the staff, write a number in the
// tab), tab chords and tab techniques are deferred — see the wishlist.

import type { DrillConfig } from '../drill/DrillConfig';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import type { AccidentalMode, NotationMode, OrderMode } from '../utils/music';
import { ALL_INTERVAL_SEMITONES, intervalBySemitones, type IntervalExercise } from '../utils/intervals';
import { scalePositionsFor, scaleTypeById, SCALE_TYPES } from '../utils/scales';
import { KEY_IDS, type KeyId } from '../utils/staff';
import { STAFF_RANGES, type StaffRange } from '../learning/staffDrill';
import {
  HOMEWORK_QUESTION_TIME, isHomeworkInstrument, parseHomeworkDrill, describeHomework,
} from './homework';

export type HomeworkKind = 'notes' | 'interval' | 'scale' | 'staff' | 'tab';
export const HOMEWORK_KINDS: readonly HomeworkKind[] = ['notes', 'interval', 'scale', 'staff', 'tab'];

export type Direction = 'up' | 'down' | 'both';
const DIRECTIONS: readonly Direction[] = ['up', 'down', 'both'];

/** Question counts the teacher may pick (same set as Notes homework). */
export const KIND_QUESTION_COUNTS = [10, 20, 30] as const;
/** A phrase / riff is several notes per question, so it asks fewer. */
export const PHRASE_QUESTION_COUNTS = [4, 6, 8] as const;

export const INTERVAL_EXERCISES: readonly IntervalExercise[] = ['identifyInterval', 'findTargetNote', 'findTargetPosition'];
export const SCALE_EXERCISES = ['identifyScale', 'nameDegree'] as const;
export type ScaleHomeworkExercise = (typeof SCALE_EXERCISES)[number];
export const STAFF_EXERCISES = ['nameNote', 'findOnNeck', 'readPhrase'] as const;
export type StaffHomeworkExercise = (typeof STAFF_EXERCISES)[number];
export const TAB_EXERCISES = ['nameNote', 'findOnNeck', 'readRiff'] as const;
export type TabHomeworkExercise = (typeof TAB_EXERCISES)[number];

/** Notes per phrase / riff — the same lengths the Learn screens use. */
export const STAFF_PHRASE_NOTES = 4;
export const TAB_RIFF_NOTES = 5;

export interface IntervalHomework {
  kind: 'interval';
  exercise: IntervalExercise;
  direction: Direction;
  /** Interval sizes in semitones (1–11), at least one. */
  semitones: number[];
  /** 1-based strings the reference note may land on, at least one. */
  strings: number[];
  /** Upper fret of the window (the lower is always the open string). */
  fretTo: number;
  questionCount: number;
}

export interface ScaleHomework {
  kind: 'scale';
  exercise: ScaleHomeworkExercise;
  /** `SCALE_TYPES` ids, at least one. */
  scaleTypeIds: string[];
  /** Which way "identify the scale" plays it; "name the degree" ignores it. */
  direction: Direction;
  questionCount: number;
}

export interface StaffHomework {
  kind: 'staff';
  exercise: StaffHomeworkExercise;
  range: StaffRange;
  key: KeyId;
  /** Only the notes of the key (naturals in C) or every note. */
  inKeyOnly: boolean;
  /** Questions — a phrase counts as one question of `STAFF_PHRASE_NOTES` notes. */
  questionCount: number;
}

export interface TabHomework {
  kind: 'tab';
  exercise: TabHomeworkExercise;
  range: StaffRange;
  naturalsOnly: boolean;
  /** Questions — a riff counts as one question of `TAB_RIFF_NOTES` notes. */
  questionCount: number;
}

/** A validated, runnable homework. `notes` carries the engine's DrillConfig. */
export type HomeworkSpec =
  | { kind: 'notes'; drill: DrillConfig }
  | IntervalHomework
  | ScaleHomework
  | StaffHomework
  | TabHomework;

export type NonNotesSpec = Exclude<HomeworkSpec, { kind: 'notes' }>;

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isOneOf = <T extends string>(allowed: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v);
const validCount = (v: unknown): v is number => isInt(v) && v >= 1 && v <= 50;
const uniqueInts = (v: unknown): number[] | null => {
  if (!Array.isArray(v) || v.length === 0 || !v.every(isInt)) return null;
  const out = [...new Set(v as number[])];
  return out.length === v.length ? out.sort((a, b) => a - b) : null;
};

// ── Defaults (what the assign form starts from) ─────────────────────────

export function defaultHomeworkSpec(kind: Exclude<HomeworkKind, 'notes'>, instrumentId: InstrumentId): NonNotesSpec {
  const cfg = getInstrument(instrumentId);
  switch (kind) {
    case 'interval':
      return {
        kind, exercise: 'identifyInterval', direction: 'up',
        semitones: [3, 4, 5, 7], strings: [cfg.stringCount], fretTo: Math.min(12, cfg.maxFret), questionCount: 10,
      };
    case 'scale':
      return { kind, exercise: 'identifyScale', scaleTypeIds: ['major', 'naturalMinor'], direction: 'up', questionCount: 10 };
    case 'staff':
      return { kind, exercise: 'nameNote', range: 'open', key: 'C', inKeyOnly: true, questionCount: 10 };
    case 'tab':
      return { kind, exercise: 'nameNote', range: 'open', naturalsOnly: true, questionCount: 10 };
  }
}

/** Carry a non-Notes spec over to another instrument: keep the teacher's
 *  picks where they still fit, fall back to the instrument's defaults where
 *  they don't (a 6th string on a 4-string bass, a fret past its last). */
export function retargetHomeworkSpec(spec: NonNotesSpec, instrumentId: InstrumentId): NonNotesSpec {
  const base = defaultHomeworkSpec(spec.kind, instrumentId);
  if (spec.kind === 'interval' && base.kind === 'interval') {
    const cfg = getInstrument(instrumentId);
    const strings = spec.strings.filter((s) => s <= cfg.stringCount);
    return { ...spec, strings: strings.length > 0 ? strings : base.strings, fretTo: Math.min(spec.fretTo, cfg.maxFret) };
  }
  if (spec.kind === 'scale') {
    const cfg = getInstrument(instrumentId);
    const ids = spec.scaleTypeIds.filter((id) => scaleFitsInstrument(id, cfg.stringCount));
    return { ...spec, scaleTypeIds: ids.length > 0 ? ids : (base as ScaleHomework).scaleTypeIds };
  }
  return spec;
}

/** A scale is drillable on an instrument when it has at least one authored
 *  box for that string count. */
export function scaleFitsInstrument(scaleTypeId: string, stringCount: number): boolean {
  return scaleTypeById(scaleTypeId) != null && scalePositionsFor(scaleTypeId, stringCount).length > 0;
}

export function homeworkScaleChoices(instrumentId: InstrumentId): string[] {
  const { stringCount } = getInstrument(instrumentId);
  return SCALE_TYPES.map((s) => s.id).filter((id) => scaleFitsInstrument(id, stringCount));
}

// ── Wire format ─────────────────────────────────────────────────────────

/** The jsonb stored on the homework row. */
export function homeworkToStored(spec: HomeworkSpec): unknown {
  return spec.kind === 'notes' ? spec.drill : spec;
}

/** Validates a stored homework for this instrument. Returns null when it can't
 *  be run on this build (unknown kind, instrument, out-of-range pick). */
export function parseHomework(
  raw: unknown,
  instrumentId: unknown,
  display: { accidental: AccidentalMode; order: OrderMode },
): HomeworkSpec | null {
  if (!isHomeworkInstrument(instrumentId)) return null;
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.kind === undefined) {
    const drill = parseHomeworkDrill(raw, instrumentId, display);
    return drill ? { kind: 'notes', drill } : null;
  }
  const cfg = getInstrument(instrumentId);
  if (!validCount(r.questionCount)) return null;

  switch (r.kind) {
    case 'interval': {
      if (!isOneOf(INTERVAL_EXERCISES, r.exercise) || !isOneOf(DIRECTIONS, r.direction)) return null;
      const semitones = uniqueInts(r.semitones);
      const strings = uniqueInts(r.strings);
      if (!semitones || !strings) return null;
      if (!semitones.every((s) => intervalBySemitones(s) != null)) return null;
      if (!strings.every((s) => s >= 1 && s <= cfg.stringCount)) return null;
      if (!isInt(r.fretTo) || r.fretTo < 3 || r.fretTo > cfg.maxFret) return null;
      return {
        kind: 'interval', exercise: r.exercise, direction: r.direction, semitones, strings,
        fretTo: r.fretTo, questionCount: r.questionCount,
      };
    }
    case 'scale': {
      if (!isOneOf(SCALE_EXERCISES, r.exercise) || !isOneOf(DIRECTIONS, r.direction)) return null;
      if (!Array.isArray(r.scaleTypeIds) || r.scaleTypeIds.length === 0) return null;
      const ids = [...new Set(r.scaleTypeIds)];
      if (ids.length !== r.scaleTypeIds.length) return null;
      if (!ids.every((id): id is string => typeof id === 'string' && scaleFitsInstrument(id, cfg.stringCount))) return null;
      return { kind: 'scale', exercise: r.exercise, scaleTypeIds: ids, direction: r.direction, questionCount: r.questionCount };
    }
    case 'staff': {
      if (!isOneOf(STAFF_EXERCISES, r.exercise) || !isOneOf(STAFF_RANGES, r.range) || !isOneOf(KEY_IDS, r.key)) return null;
      return {
        kind: 'staff', exercise: r.exercise, range: r.range, key: r.key,
        inKeyOnly: r.inKeyOnly === true, questionCount: r.questionCount,
      };
    }
    case 'tab': {
      if (!isOneOf(TAB_EXERCISES, r.exercise) || !isOneOf(STAFF_RANGES, r.range)) return null;
      return {
        kind: 'tab', exercise: r.exercise, range: r.range,
        naturalsOnly: r.naturalsOnly === true, questionCount: r.questionCount,
      };
    }
    default:
      return null;
  }
}

// ── Running an interval homework ────────────────────────────────────────

/** The interval homework → the engine's DrillConfig, with the student's own
 *  display prefs. `findTargetPosition` answers by tapping a fret, so it runs
 *  through the by-note flow (as `buildIntervalDrill` does). */
export function intervalHomeworkDrill(
  hw: IntervalHomework,
  display: { accidental: AccidentalMode; order: OrderMode; notation: NotationMode },
): DrillConfig {
  return {
    strings: hw.strings,
    primaryString: hw.strings[0],
    isMulti: hw.strings.length > 1,
    mode: hw.exercise === 'findTargetPosition' ? 'byNote' : 'byFret',
    fretFrom: 0,
    fretTo: hw.fretTo,
    wholeToneOnly: false,
    dotsOnly: false,
    questionCount: hw.questionCount,
    timeLimit: HOMEWORK_QUESTION_TIME + 2,
    accidental: display.accidental,
    order: display.order,
    interval: {
      semitones: hw.semitones,
      direction: hw.direction,
      exercise: hw.exercise,
      notation: display.notation,
      optionCount: 4,
      firstNoteBias: 'any',
      registerSpread: 'wide',
      optionPolicy: 'default',
    },
  };
}

/** Does this homework need to be heard? (Silent mode makes it unanswerable.) */
export function homeworkNeedsSound(spec: HomeworkSpec): boolean {
  return (spec.kind === 'interval' && spec.exercise === 'identifyInterval')
    || (spec.kind === 'scale' && spec.exercise === 'identifyScale');
}

/** Answers that make up the run's score: a phrase / riff scores each note. */
export function homeworkTotal(spec: HomeworkSpec): number {
  if (spec.kind === 'staff' && spec.exercise === 'readPhrase') return spec.questionCount * STAFF_PHRASE_NOTES;
  if (spec.kind === 'tab' && spec.exercise === 'readRiff') return spec.questionCount * TAB_RIFF_NOTES;
  return spec.kind === 'notes' ? spec.drill.questionCount : spec.questionCount;
}

// ── Describing ──────────────────────────────────────────────────────────

const EXERCISE_LABEL: Record<string, string> = {
  identifyInterval: 'Identify the interval',
  findTargetNote: 'Find the note',
  findTargetPosition: 'Find on the neck',
  identifyScale: 'Identify the scale',
  nameDegree: 'Name the degree',
  nameNote: 'Name the note',
  findOnNeck: 'Find it on the neck',
  readPhrase: 'Read a phrase',
  readRiff: 'Read a riff',
};
export const exerciseLabel = (exercise: string): string => EXERCISE_LABEL[exercise] ?? exercise;

export const KIND_LABEL: Record<HomeworkKind, string> = {
  notes: 'Notes',
  interval: 'Intervals',
  scale: 'Scales',
  staff: 'Staff reading',
  tab: 'Tab reading',
};

const RANGE_LABEL: Record<Exclude<StaffRange, 'high'>, string> = {
  open: 'Frets 0–3',
  low: 'Frets 0–5',
  twelve: 'Frets 0–12',
};
export function homeworkRangeLabel(range: StaffRange, maxFret: number, t: (s: string) => string): string {
  return range === 'high' ? `${t('Frets')} 12–${maxFret}` : t(RANGE_LABEL[range]);
}

/** One-line summary for the teacher's list and the student's run header. */
export function describeHomeworkSpec(spec: HomeworkSpec, instrumentId: InstrumentId, t: (s: string) => string): string {
  if (spec.kind === 'notes') return describeHomework(spec.drill, t);
  const cfg = getInstrument(instrumentId);
  const count = t('{n} questions').replace('{n}', String(spec.questionCount));
  const dir = (d: Direction) => (d === 'up' ? t('Ascending') : d === 'down' ? t('Descending') : t('Both'));
  switch (spec.kind) {
    case 'interval': {
      const sizes = spec.semitones.map((s) => intervalBySemitones(s)?.short ?? String(s)).join(' ');
      const parts = [t(KIND_LABEL.interval), t(exerciseLabel(spec.exercise)), sizes];
      if (spec.exercise !== 'identifyInterval' || spec.direction !== 'both') parts.push(dir(spec.direction));
      return [...parts, count].join(' · ');
    }
    case 'scale': {
      const names = spec.scaleTypeIds.map((id) => t(scaleTypeById(id)?.nameKey ?? id)).join(', ');
      const parts = [t(KIND_LABEL.scale), t(exerciseLabel(spec.exercise)), names];
      if (spec.exercise === 'identifyScale') parts.push(dir(spec.direction));
      return [...parts, count].join(' · ');
    }
    case 'staff': {
      const parts = [t(KIND_LABEL.staff), t(exerciseLabel(spec.exercise)), homeworkRangeLabel(spec.range, cfg.maxFret, t)];
      if (spec.key !== 'C') parts.push(`${t('Key signature')} ${spec.key}`);
      parts.push(spec.inKeyOnly ? t(spec.key === 'C' ? 'naturals only' : 'Notes of the key only') : t('With accidentals'));
      return [...parts, count].join(' · ');
    }
    case 'tab': {
      const parts = [t(KIND_LABEL.tab), t(exerciseLabel(spec.exercise)), homeworkRangeLabel(spec.range, cfg.maxFret, t)];
      if (spec.naturalsOnly) parts.push(t('naturals only'));
      return [...parts, count].join(' · ');
    }
  }
}

export { ALL_INTERVAL_SEMITONES };
