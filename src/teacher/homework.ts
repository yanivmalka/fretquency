// ── Homework = a DrillConfig a teacher assigns to a class ─────────────────
//
// Pure, no React, no Supabase. The teacher picks a small Notes drill (which
// strings, a fret window, naturals only or not, how many questions) on one of
// the free instruments; `buildHomeworkDrill` turns those picks into a plain
// `DrillConfig` — the same seam Practice, Fret of the Day and the Teacher
// planner use — and that config is what `public.homework.drill` stores.
//
// The stored jsonb comes back from the network, so the student side never
// trusts it: `parseHomeworkDrill` re-validates every field against the
// instrument and returns null for anything it can't run. The display prefs
// (sharps/flats, note order) are the student's own, overlaid at run time.
//
// First slice: by-fret Notes drills only (a fret is shown, name the note).
// By-note, intervals, scales and reading drills are deferred — see the
// wishlist's Teacher mode entry.

import type { DrillConfig } from '../drill/DrillConfig';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import type { AccidentalMode, OrderMode } from '../utils/music';

/** Instruments a teacher may assign. Mandolin and banjo are Pro-only for a
 *  student, so homework on them could lock a Free student out. */
export const HOMEWORK_INSTRUMENTS: InstrumentId[] = ['guitar', 'bass', 'ukulele'];

export const HOMEWORK_QUESTION_COUNTS = [10, 20, 30] as const;
export const HOMEWORK_QUESTION_TIME = 10;

export interface HomeworkPicks {
  instrumentId: InstrumentId;
  /** 1-based string numbers (1 = highest-pitched), at least one. */
  strings: number[];
  fretFrom: number;
  fretTo: number;
  naturalsOnly: boolean;
  questionCount: number;
}

export function defaultHomeworkPicks(instrumentId: InstrumentId = 'guitar'): HomeworkPicks {
  const cfg = getInstrument(instrumentId);
  return {
    instrumentId,
    strings: [cfg.stringCount],
    fretFrom: 0,
    fretTo: Math.min(12, cfg.maxFret),
    naturalsOnly: true,
    questionCount: 10,
  };
}

/** The teacher's picks → the DrillConfig stored on the homework row. The
 *  accidental/order fields are placeholders; the student's own prefs replace
 *  them in `parseHomeworkDrill`. */
export function buildHomeworkDrill(p: HomeworkPicks): DrillConfig {
  const strings = [...new Set(p.strings)].sort((a, b) => a - b);
  return {
    strings,
    primaryString: strings[0] ?? 1,
    isMulti: strings.length > 1,
    mode: 'byFret',
    fretFrom: Math.min(p.fretFrom, p.fretTo),
    fretTo: Math.max(p.fretFrom, p.fretTo),
    wholeToneOnly: p.naturalsOnly,
    dotsOnly: false,
    questionCount: p.questionCount,
    timeLimit: HOMEWORK_QUESTION_TIME,
    accidental: 'sharps',
    order: 'fifths',
  };
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

export function isHomeworkInstrument(v: unknown): v is InstrumentId {
  return typeof v === 'string' && (HOMEWORK_INSTRUMENTS as string[]).includes(v);
}

/** Validates a stored homework drill for this instrument. Returns a runnable
 *  DrillConfig with the student's display prefs, or null when the row can't
 *  be run on this build (unknown instrument, out-of-range strings/frets, a
 *  mode this slice doesn't play). */
export function parseHomeworkDrill(
  raw: unknown,
  instrumentId: unknown,
  display: { accidental: AccidentalMode; order: OrderMode },
): DrillConfig | null {
  if (!isHomeworkInstrument(instrumentId)) return null;
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const cfg = getInstrument(instrumentId);

  if (r.mode !== 'byFret') return null;
  if (!Array.isArray(r.strings) || r.strings.length === 0) return null;
  const strings = [...new Set(r.strings)].filter(isInt).filter((s) => s >= 1 && s <= cfg.stringCount);
  if (strings.length !== r.strings.length) return null;
  strings.sort((a, b) => a - b);

  if (!isInt(r.fretFrom) || !isInt(r.fretTo)) return null;
  if (r.fretFrom < 0 || r.fretTo > cfg.maxFret || r.fretFrom > r.fretTo) return null;
  if (!isInt(r.questionCount) || r.questionCount < 1 || r.questionCount > 50) return null;

  return {
    strings,
    primaryString: strings[0],
    isMulti: strings.length > 1,
    mode: 'byFret',
    fretFrom: r.fretFrom,
    fretTo: r.fretTo,
    wholeToneOnly: r.wholeToneOnly === true,
    dotsOnly: false,
    questionCount: r.questionCount,
    timeLimit: HOMEWORK_QUESTION_TIME,
    accidental: display.accidental,
    order: display.order,
  };
}

/** A short human summary of a homework drill: "Strings 5–6 · frets 0–12 ·
 *  naturals · 10 questions". Callers translate the pieces. */
export function describeHomework(
  drill: DrillConfig,
  t: (s: string) => string,
): string {
  const s = drill.strings;
  const strings = s.length === 1
    ? t('String {n}').replace('{n}', String(s[0]))
    : t('Strings {list}').replace('{list}', s.join(', '));
  const frets = t('frets {from}–{to}')
    .replace('{from}', String(drill.fretFrom)).replace('{to}', String(drill.fretTo));
  const parts = [strings, frets];
  if (drill.wholeToneOnly) parts.push(t('naturals only'));
  parts.push(t('{n} questions').replace('{n}', String(drill.questionCount)));
  return parts.join(' · ');
}

/** Per-student summary of a homework's attempts, for the teacher's list. */
export interface StudentResult {
  attempts: number;
  bestCorrect: number;
  bestTotal: number;
  lastAt: string;
}

export function summariseAttempts(
  attempts: Array<{ user_id: string; correct: number; total: number; created_at: string }>,
): Map<string, StudentResult> {
  const out = new Map<string, StudentResult>();
  for (const a of attempts) {
    const prev = out.get(a.user_id);
    if (!prev) {
      out.set(a.user_id, { attempts: 1, bestCorrect: a.correct, bestTotal: a.total, lastAt: a.created_at });
      continue;
    }
    prev.attempts += 1;
    if (a.correct / a.total > prev.bestCorrect / prev.bestTotal) {
      prev.bestCorrect = a.correct;
      prev.bestTotal = a.total;
    }
    if (a.created_at > prev.lastAt) prev.lastAt = a.created_at;
  }
  return out;
}

export const CLASS_CODE_LENGTH = 6;

/** Normalises what a student types as a code: upper case, spaces/dashes
 *  dropped. The server's alphabet has no 0/O or 1/I/L, so none of those can
 *  be mistyped into a different valid code. */
export function normaliseClassCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CLASS_CODE_LENGTH);
}
