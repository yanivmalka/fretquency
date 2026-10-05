// The teacher test — client side of supabase/migrations/0027_teacher_exam.sql.
//
// The server generates the questions, holds their answers, runs the clock
// and, on a pass, creates the `teachers` row; this module only calls its
// three RPCs and turns the structured questions into text in the player's
// language and notation. Nothing here can change an outcome.

import { supabase } from '../utils/supabase';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { pitchClassName } from '../utils/staff';
import type { InstrumentId } from '../utils/instruments';

export const EXAM_INSTRUMENTS: InstrumentId[] = ['guitar', 'bass', 'ukulele'];

export type ExamKind = 'neck' | 'staff' | 'interval' | 'key' | 'chord' | 'diatonic';
export const EXAM_KINDS: readonly ExamKind[] = ['neck', 'staff', 'interval', 'key', 'chord', 'diatonic'];

/** A spelled note: letter 0..6 = C D E F G A B, a = -1 flat / 0 / +1 sharp. */
export interface SpelledNote { l: number; a: number }
export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug' | 'dom7' | 'maj7' | 'min7' | 'm7b5';
export interface ChordRef { root: SpelledNote; q: ChordQuality }

export type ExamPrompt =
  | { string: number; fret: number }
  | { clef: 'treble' | 'bass'; pos: number; sign: '' | '#' | 'b' }
  | { from: SpelledNote; to: SpelledNote }
  | { v: 'count'; key: SpelledNote }
  | { v: 'which'; n: number }
  | { v: 'relative'; key: SpelledNote }
  | { v: 'name'; notes: SpelledNote[] }
  | { v: 'notes'; chord: ChordRef }
  | { v: 'chord' | 'degree'; key: SpelledNote; deg: number };

export type ExamOption =
  | { pc: number }
  | SpelledNote
  | { iv: string }
  | { n: number }
  | ChordRef
  | { notes: SpelledNote[] };

export interface ExamQuestion {
  kind: ExamKind;
  limit_ms: number;
  prompt: ExamPrompt;
  options: ExamOption[];
}

export interface ExamStatus {
  isTeacher: boolean;
  isAdmin: boolean;
  /** When the next attempt opens; null = it can be taken now. */
  retryAt: string | null;
  questions: number;
  passMark: number;
}

export type ExamStep =
  | { status: 'already' }
  | { status: 'cooldown'; retryAt: string }
  | {
    status: 'question'; attemptId: string; index: number; total: number;
    question: ExamQuestion;
    /** Whether the previous answer was right; absent for the first question. */
    lastCorrect?: boolean;
  }
  | {
    status: 'finished'; lastCorrect: boolean; score: number; total: number; passMark: number;
    passed: boolean; byKind: Partial<Record<ExamKind, number>>; retryAt: string | null;
  };

interface RawStep {
  status: string; retry_at?: string | null; attempt_id?: string; index?: number; total?: number;
  question?: ExamQuestion; correct?: boolean; score?: number; pass_mark?: number; passed?: boolean;
  by_kind?: Partial<Record<ExamKind, number>>;
}

function toStep(r: RawStep): ExamStep {
  switch (r.status) {
    case 'already': return { status: 'already' };
    case 'cooldown': return { status: 'cooldown', retryAt: r.retry_at ?? '' };
    case 'question':
      return {
        status: 'question', attemptId: r.attempt_id!, index: r.index!, total: r.total!,
        question: r.question!, lastCorrect: r.correct,
      };
    default:
      return {
        status: 'finished', lastCorrect: !!r.correct, score: r.score ?? 0, total: r.total ?? 0,
        passMark: r.pass_mark ?? 0, passed: !!r.passed, byKind: r.by_kind ?? {}, retryAt: r.retry_at ?? null,
      };
  }
}

export async function fetchExamStatus(): Promise<ExamStatus | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('teacher_exam_status');
  if (error) throw error;
  const r = data as { is_teacher: boolean; is_admin: boolean; retry_at: string | null; questions: number; pass_mark: number };
  return { isTeacher: r.is_teacher, isAdmin: r.is_admin, retryAt: r.retry_at, questions: r.questions, passMark: r.pass_mark };
}

/** Admin-only shortcut (0029): become a teacher without taking the test —
 *  admins already hold every paid tier regardless of teacher status. */
export async function skipExamAsAdmin(): Promise<'skipped' | 'already' | 'not_admin'> {
  if (!supabase) throw new Error('offline build');
  const { data, error } = await supabase.rpc('teacher_exam_admin_skip');
  if (error) throw error;
  return (data as { status: 'skipped' | 'already' | 'not_admin' }).status;
}

export async function startExam(instrumentId: InstrumentId, displayName: string | null): Promise<ExamStep> {
  if (!supabase) throw new Error('offline build');
  const { data, error } = await supabase.rpc('teacher_exam_start', {
    p_instrument: instrumentId, p_display_name: displayName ?? '',
  });
  if (error) throw error;
  return toStep(data as RawStep);
}

/** `choice` = the option index, or -1 when the time ran out / the app was left. */
export async function answerExam(attemptId: string, choice: number): Promise<ExamStep> {
  if (!supabase) throw new Error('offline build');
  const { data, error } = await supabase.rpc('teacher_exam_answer', { p_attempt: attemptId, p_choice: choice });
  if (error) throw error;
  return toStep(data as RawStep);
}

// ── Rendering ───────────────────────────────────────────────────────────
// Theory questions are about spelling (C→G♯ is an augmented 5th, C→A♭ a
// minor 6th), so a spelled note keeps its own sharp/flat whatever the
// sharps/flats preference — the same way a key signature decides spelling on
// the staff screens. The A-B-C / Do-Re-Mi preference always applies. The one
// question that asks only for a pitch (the neck) follows the preference too.

const LETTERS = 'CDEFGAB';

export function noteLabel(n: SpelledNote, notation: NotationMode): string {
  const ascii = LETTERS[n.l] + (n.a === 1 ? '#' : n.a === -1 ? 'b' : '');
  // Force the ASCII spelling through unchanged (`displayNote`'s sharps/flats
  // mode would otherwise respell e.g. a theory-correct E♯ as F): this is a
  // spelling question, not the sharps/flats *preference*, which only governs
  // enharmonic choice for an unspelled pitch class (see `pitchLabel`).
  return displayNote(ascii, n.a === -1 ? 'flats' : 'sharps', notation);
}

export function pitchLabel(pc: number, accidental: AccidentalMode, notation: NotationMode): string {
  return displayNote(pitchClassName(pc), accidental, notation);
}

const CHORD_SUFFIX: Record<ChordQuality, string> = {
  maj: '', min: 'm', dim: 'dim', aug: 'aug', dom7: '7', maj7: 'maj7', min7: 'm7', m7b5: 'm7♭5',
};

export function chordLabel(c: ChordRef, notation: NotationMode): string {
  const suffix = CHORD_SUFFIX[c.q];
  return noteLabel(c.root, notation) + (suffix && notation === 'solfege' ? ' ' : '') + suffix;
}

export function notesLabel(notes: SpelledNote[], notation: NotationMode): string {
  return notes.map((n) => noteLabel(n, notation)).join(' – ');
}

const INTERVAL_NAMES: Record<string, string> = {
  m2: 'Minor 2nd', M2: 'Major 2nd', m3: 'Minor 3rd', M3: 'Major 3rd', P4: 'Perfect 4th',
  A4: 'Augmented 4th', d5: 'Diminished 5th', P5: 'Perfect 5th', A5: 'Augmented 5th',
  m6: 'Minor 6th', M6: 'Major 6th', m7: 'Minor 7th', M7: 'Major 7th',
};

/** "3♯" / "2♭" / "none" — a signed key-signature count. */
export function signatureLabel(n: number, t: (s: string) => string): string {
  if (n === 0) return t('No sharps or flats');
  return `${Math.abs(n)}${n > 0 ? '♯' : '♭'}`;
}

export function keyLabel(tonic: SpelledNote, notation: NotationMode, t: (s: string) => string): string {
  return t('{note} major').replace('{note}', noteLabel(tonic, notation));
}

export function questionText(q: ExamQuestion, notation: NotationMode, t: (s: string) => string): string {
  const p = q.prompt;
  switch (q.kind) {
    case 'neck': return t('Which note is marked on the neck?');
    case 'staff': return t('Which note is written?');
    case 'interval': {
      const { from, to } = p as { from: SpelledNote; to: SpelledNote };
      return t('From {a} up to {b} — which interval?')
        .replace('{a}', noteLabel(from, notation)).replace('{b}', noteLabel(to, notation));
    }
    case 'key': {
      if ('n' in p) return t('Which major key has {sig}?').replace('{sig}', signatureLabel((p as { n: number }).n, t));
      const k = p as { v: 'count' | 'relative'; key: SpelledNote };
      return (k.v === 'count' ? t('How many sharps or flats does {key} have?') : t('What is the relative minor of {key}?'))
        .replace('{key}', keyLabel(k.key, notation, t));
    }
    case 'chord': {
      if ('notes' in p) return t('Which chord is {notes}?').replace('{notes}', notesLabel(p.notes, notation));
      return t('Which notes make up {chord}?').replace('{chord}', chordLabel((p as { chord: ChordRef }).chord, notation));
    }
    case 'diatonic': {
      const d = p as { v: 'chord' | 'degree'; key: SpelledNote; deg: number };
      return (d.v === 'chord' ? t('In {key}, which chord is built on degree {n}?') : t('In {key}, which note is degree {n}?'))
        .replace('{key}', keyLabel(d.key, notation, t)).replace('{n}', String(d.deg));
    }
  }
}

export function optionLabel(
  q: ExamQuestion, o: ExamOption, accidental: AccidentalMode, notation: NotationMode, t: (s: string) => string,
): string {
  if ('pc' in o) return pitchLabel(o.pc, accidental, notation);
  if ('iv' in o) return t(INTERVAL_NAMES[o.iv] ?? o.iv);
  if ('n' in o) return signatureLabel(o.n, t);
  if ('notes' in o) return notesLabel(o.notes, notation);
  if ('root' in o) {
    if (q.kind === 'key') return t('{note} minor').replace('{note}', noteLabel(o.root, notation));
    return chordLabel(o, notation);
  }
  if (q.kind === 'key') return keyLabel(o, notation, t);
  return noteLabel(o, notation);
}

export const EXAM_KIND_LABEL: Record<ExamKind, string> = {
  neck: 'Notes on the neck',
  staff: 'Reading the staff',
  interval: 'Intervals',
  key: 'Key signatures',
  chord: 'Chords',
  diatonic: 'Harmony in a key',
};
