// ── useReadingEngine — the drill runner for the reading domains ───────────
//
// staff-reading-spec.md §6, tab-reading-spec.md §6. One small engine shared
// by Staff reading and Tab reading: a written prompt (a note on the staff, a
// number on a tab line) is read and answered one of four ways —
//   • by name     — pick the note's name from a chip row (`selectName`);
//   • on the neck — tap a place on the neck (`tapPosition`): any place that
//                   plays the pitch (staff), or exactly the written place
//                   (tab, `exactPosition`);
//   • in writing  — a place on the neck is marked (`markPosition`) and the
//                   learner writes it: on the staff (`answerPitch`) or in
//                   the tab (`answerPosition`);
//   • a phrase    — several notes in a row, each named in order;
//   • judged by the screen — a chord named or played, a technique read
//                   (`answerWith`): the screen decides and plays the sound.
// A sibling of `useScaleChipEngine`, not a branch of the shared
// `useGameEngine`: the prompt is written notation, not a fret or a note name.
// What differs between the domains — which items a question holds — comes in
// through `pickItems`; the running, timing, scoring and recording are one.
//
// A question holds one note, or a phrase of several; each note is its own
// answer (its own SRS review, its own score), and the question is over once
// every note is answered or the time runs out.
//
// Reuses `useScoring` / `audio.ts` / `feedback.ts` like every other quiz
// surface. Timer refs, not state, back the countdown (CLAUDE.md "Conventions").

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StaffPosition } from '../learning/staffDrill';
import type { SrsMap } from '../learning/srs';
import { pitchClassName } from '../utils/staff';
import { playNoteSingle, beep } from '../utils/audio';
import { haptic, playCorrectChime } from '../utils/feedback';
import { useScoring } from './useScoring';
import { noteRoundEnded, noteRoundStarted } from '../utils/adPacing';

/** What a reading question is made of: one reviewable item that sounds a
 *  pitch and lives at one or more places on the neck. */
export interface ReadingItem {
  itemId: string;
  /** Sounding pitch. */
  midi: number;
  /** Every place (inside the range) that plays it; `[0]` is the one played
   *  back. A tab item has exactly one — the written place. */
  positions: StaffPosition[];
}

export interface ReadingAnswer<F extends string> {
  itemId: string;
  form: F;
  correct: boolean;
  seconds: number;
}

export interface ReadingQuestion<T extends ReadingItem> {
  /** One note, or the notes of a phrase in reading order. */
  items: T[];
  /** The place on the neck the question points at (the "write it" exercises). */
  marked: StaffPosition | null;
}

export interface ReadingNoteResult {
  correct: boolean;
  /** Named answers: the chip picked (absent on a timeout). */
  picked?: string;
}

export interface ReadingEngineOptions<F extends string, T extends ReadingItem> {
  exercise: F;
  /** The items of the next question — one, or a phrase. `previous` is the
   *  last item of the question before, so a picker can avoid repeating it. */
  pickItems: (srs: SrsMap, previous: T | null, now: number) => T[];
  /** MIDI of each open string, `[0]` = string 1 (the highest-pitched). */
  openMidi: readonly number[];
  questionCount: number;
  /** Notes per question — above 1 only for a phrase (used for scoring). */
  notesPerQuestion: number;
  /** Seconds per note. */
  timeLimit: number;
  /** Mark one of the first item's places on the neck (the "write it" exercises). */
  markPosition: boolean;
  /** A neck tap must be the item's own place, not merely the same pitch (tab). */
  exactPosition?: boolean;
  /** `hear` requires the exact octave, not just the pitch class (staff: the
   *  exercise is reading a specific written octave). Off by default — an
   *  octave either way still counts, since pitch detection on a low string
   *  often reads the octave above (tab: a place, not a pitch, so the octave
   *  the written fret happens to sound is not itself what's being tested). */
  pitchOctaveStrict?: boolean;
  /** Read fresh on every pick, so the answers of this session steer the rest of it. */
  getSrs: () => SrsMap;
  onComplete?: () => void;
  onAnswer?: (answer: ReadingAnswer<F>) => void;
}

const PHRASE_NOTE_GAP_MS = 420;

export function useReadingEngine<F extends string, T extends ReadingItem>({
  exercise, pickItems, openMidi, questionCount, notesPerQuestion, timeLimit, markPosition, exactPosition = false,
  pitchOctaveStrict = false, getSrs, onComplete, onAnswer,
}: ReadingEngineOptions<F, T>) {
  const { session, reset, beginRun, onCorrect, onWrong, onTimeout, getQuestionTime } = useScoring();

  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState<ReadingQuestion<T> | null>(null);
  /** Index of the note being answered (a phrase moves it along). */
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<(ReadingNoteResult | null)[]>([]);
  /** A neck tap: the place tapped, and whether it was right. */
  const [tapped, setTapped] = useState<(StaffPosition & { correct: boolean }) | null>(null);
  const [answered, setAnswered] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [questionTime, setQuestionTime] = useState(timeLimit);
  const [questionStart, setQuestionStart] = useState(() => Date.now());

  const runningRef = useRef(false);
  const sessionRef = useRef(0);
  const countRef = useRef(0);
  const answeredRef = useRef(false);
  const questionRef = useRef<ReadingQuestion<T> | null>(null);
  const cursorRef = useRef(0);
  const resultsRef = useRef<(ReadingNoteResult | null)[]>([]);
  /** When the current note became the one to answer. */
  const noteStartRef = useRef(0);
  const noteTimeRef = useRef(timeLimit);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextQuestionRef = useRef<(mySession: number) => void>(() => {});
  const onAnswerRef = useRef(onAnswer);
  const getSrsRef = useRef(getSrs);
  useEffect(() => {
    onAnswerRef.current = onAnswer;
    getSrsRef.current = getSrs;
  }, [onAnswer, getSrs]);

  const clearCountdown = useCallback(() => {
    if (timeoutRef.current != null) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  const finish = useCallback(() => {
    setRunning(false); runningRef.current = false;
    clearCountdown();
    noteRoundEnded();
    onComplete?.();
  }, [clearCountdown, onComplete]);

  const scheduleNext = useCallback((mySession: number, delay: number) => {
    setTimeout(() => {
      if (runningRef.current && sessionRef.current === mySession) nextQuestionRef.current(mySession);
    }, delay);
  }, []);

  const setResultsBoth = useCallback((next: (ReadingNoteResult | null)[]) => {
    resultsRef.current = next;
    setResults(next);
  }, []);

  /** Play a phrase back note by note, so the learner hears what they read. */
  const playPhrase = useCallback((items: readonly T[], mySession: number) => {
    items.forEach((it, i) => {
      setTimeout(() => {
        const pos = it.positions[0];
        if (sessionRef.current === mySession && pos) void playNoteSingle(pos.string, pos.fret);
      }, i * PHRASE_NOTE_GAP_MS);
    });
  }, []);

  const nextQuestion = useCallback((mySession: number) => {
    if (!runningRef.current || sessionRef.current !== mySession) return;
    if (countRef.current >= questionCount) { finish(); return; }
    const prev = questionRef.current;
    const items = pickItems(getSrsRef.current(), prev ? prev.items[prev.items.length - 1] : null, Date.now());
    if (items.length === 0) { finish(); return; }
    const marked = markPosition
      ? items[0].positions[Math.floor(Math.random() * items[0].positions.length)] ?? null
      : null;
    const q: ReadingQuestion<T> = { items, marked };

    countRef.current += 1;
    setQuestionNumber(countRef.current);
    setTapped(null);
    setAnswered(false);
    answeredRef.current = false;
    cursorRef.current = 0;
    setCursor(0);
    setResultsBoth(items.map(() => null));
    questionRef.current = q;
    setQuestion(q);

    const perNote = getQuestionTime(timeLimit);
    const total = perNote * items.length;
    noteTimeRef.current = perNote;
    setQuestionTime(total);
    noteStartRef.current = Date.now();
    setQuestionStart(noteStartRef.current);

    clearCountdown();
    timeoutRef.current = setTimeout(() => {
      if (answeredRef.current || sessionRef.current !== mySession) return;
      answeredRef.current = true;
      setAnswered(true);
      beep();
      onTimeout();
      // Every note not answered yet counts as missed.
      const next = [...resultsRef.current];
      next.forEach((r, i) => {
        if (r != null) return;
        next[i] = { correct: false };
        onAnswerRef.current?.({ itemId: items[i].itemId, form: exercise, correct: false, seconds: perNote });
      });
      setResultsBoth(next);
      if (items.length > 1) playPhrase(items, mySession);
      scheduleNext(mySession, items.length > 1 ? 1800 + items.length * PHRASE_NOTE_GAP_MS : 1800);
    }, total * 1000);
  }, [exercise, pickItems, markPosition, questionCount, getQuestionTime, timeLimit, onTimeout, finish, clearCountdown, scheduleNext, setResultsBoth, playPhrase]);
  useEffect(() => { nextQuestionRef.current = nextQuestion; }, [nextQuestion]);

  const start = useCallback(() => {
    reset();
    sessionRef.current += 1;
    noteRoundStarted();
    const mySession = sessionRef.current;
    runningRef.current = true;
    setRunning(true);
    countRef.current = 0;
    questionRef.current = null;
    beginRun(timeLimit, questionCount * notesPerQuestion);
    nextQuestion(mySession);
  }, [reset, beginRun, timeLimit, questionCount, notesPerQuestion, nextQuestion]);

  // Leaving the screen mid-round ends the round as far as the ad strip goes.
  useEffect(() => () => { if (runningRef.current) noteRoundEnded(); }, []);

  const stop = useCallback(() => {
    // A round stopped part-way still counts toward the ad pacing.
    if (runningRef.current) noteRoundEnded();
    sessionRef.current += 1;
    runningRef.current = false;
    setRunning(false);
    clearCountdown();
  }, [clearCountdown]);

  /** Answer the note under the cursor: score, record, feedback, move on. */
  const resolve = useCallback((correct: boolean, extra: Omit<ReadingNoteResult, 'correct'> = {}) => {
    const q = questionRef.current;
    if (!q) return;
    const i = cursorRef.current;
    const item = q.items[i];
    const mySession = sessionRef.current;
    const now = Date.now();
    const elapsed = (now - noteStartRef.current) / 1000;
    onAnswerRef.current?.({ itemId: item.itemId, form: exercise, correct, seconds: elapsed });
    const next = [...resultsRef.current];
    next[i] = { correct, ...extra };
    setResultsBoth(next);
    const isPhrase = q.items.length > 1;
    if (correct) {
      onCorrect(elapsed, noteTimeRef.current);
      if (isPhrase) haptic.tap(); else { playCorrectChime(); haptic.correct(); }
    } else {
      onWrong();
      haptic.wrong();
    }

    if (i + 1 < q.items.length) {
      cursorRef.current = i + 1;
      setCursor(i + 1);
      noteStartRef.current = now;
      return;
    }
    answeredRef.current = true;
    setAnswered(true);
    clearCountdown();
    if (isPhrase) {
      const allRight = next.every((r) => r?.correct);
      if (allRight) playCorrectChime();
      playPhrase(q.items, mySession);
      scheduleNext(mySession, 1500 + q.items.length * PHRASE_NOTE_GAP_MS);
    } else {
      scheduleNext(mySession, correct ? 900 : 1800);
    }
  }, [exercise, clearCountdown, onCorrect, onWrong, scheduleNext, setResultsBoth, playPhrase]);

  /** A name chip was picked for the current note. */
  const selectName = useCallback((value: string) => {
    const q = questionRef.current;
    if (!runningRef.current || answeredRef.current || !q) return;
    const item = q.items[cursorRef.current];
    // A single note plays after the answer, so the written note, its name and
    // its sound connect; a phrase plays back as a whole at the end.
    if (q.items.length === 1) {
      const pos = item.positions[0];
      if (pos) void playNoteSingle(pos.string, pos.fret);
    }
    resolve(value === pitchClassName(item.midi), { picked: value });
  }, [resolve]);

  /** A note was heard on the guitar (answer by playing, `usePitchStream`).
   *  Mirrors `useScaleOrderEngine.hear`: nothing is played back (the
   *  learner's own guitar already sounded it), and the note just answered,
   *  still ringing, is never scored as a mistake. */
  const hear = useCallback((midi: number) => {
    const q = questionRef.current;
    if (!runningRef.current || answeredRef.current || !q) return;
    const i = cursorRef.current;
    const matches = (a: number, b: number) => pitchOctaveStrict ? a === b : a === b || Math.abs(a - b) === 12;
    if (i > 0 && matches(midi, q.items[i - 1].midi)) return;
    resolve(matches(midi, q.items[i].midi));
  }, [resolve, pitchOctaveStrict]);

  /** A place on the neck was tapped for the (single) written note. */
  const tapPosition = useCallback((string: number, fret: number) => {
    const q = questionRef.current;
    void playNoteSingle(string, fret);
    if (!runningRef.current || answeredRef.current || !q) return;
    const item = q.items[0];
    const correct = exactPosition
      ? item.positions.some((p) => p.string === string && p.fret === fret)
      : (openMidi[string - 1] ?? NaN) + fret === item.midi;
    setTapped({ string, fret, correct });
    resolve(correct);
  }, [openMidi, exactPosition, resolve]);

  /** The learner wrote the marked note on the staff (its sounding pitch). */
  const answerPitch = useCallback((soundingMidi: number) => {
    const q = questionRef.current;
    if (!runningRef.current || answeredRef.current || !q) return;
    const pos = q.marked ?? q.items[0].positions[0];
    if (pos) void playNoteSingle(pos.string, pos.fret);
    resolve(soundingMidi === q.items[0].midi);
  }, [resolve]);

  /** The learner wrote the marked note in the tab (a line and a number). */
  const answerPosition = useCallback((string: number, fret: number) => {
    const q = questionRef.current;
    if (!runningRef.current || answeredRef.current || !q) return;
    const pos = q.marked ?? q.items[0].positions[0];
    if (pos) void playNoteSingle(pos.string, pos.fret);
    resolve(pos != null && pos.string === string && pos.fret === fret);
  }, [resolve]);

  /** An answer the screen judged itself (it also plays the sound). */
  const answerWith = useCallback((correct: boolean, picked?: string) => {
    if (!runningRef.current || answeredRef.current || !questionRef.current) return;
    resolve(correct, picked != null ? { picked } : {});
  }, [resolve]);

  return {
    running, question, cursor, results, tapped, answered,
    questionNumber, questionCount, questionTime, questionStart,
    session, start, stop, selectName, tapPosition, answerPitch, answerPosition, answerWith, hear,
  };
}
