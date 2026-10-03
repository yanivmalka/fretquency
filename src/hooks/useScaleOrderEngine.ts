// ── useScaleOrderEngine — "Tap the scale in order" drill runner ──────────
//
// The fourth Scales exercise (see `scaleOrder.ts`): a still neck section with
// every note of the scale lit; the learner taps them in the order of the run.
// No falling, no countdown — the order is the whole question.
//
// - The run starts and ends on the tonic and covers the whole box
//   (`tonicRun`), so most notes come up twice. A tap on a tile with the next
//   step's pitch is a hit: it plays, turns green and shows its number in the
//   run (the latest one, for a note played twice).
// - Any other tile — a lit note out of order, or a dim note that isn't in the
//   scale — is a wrong tap: it still plays, flashes red, penalises, and the
//   step being looked for slips. The scale keeps going.
// - One scale is one SRS answer, judged like Exercise A: correct when at most
//   one note in five slipped (`isScaleCorrect`).
// - Learning mode (`demo`): before each scale the app plays it itself,
//   lighting each note in turn, and only then hands over — the learner plays
//   it after the app. Taps during the demo are ignored, and the time taken is
//   measured from the end of the demo.
// - Answer by playing: `hear(midi)` takes a note played on the guitar (from
//   `usePitchStream`) the way `tap` takes a tile — same hit/miss rules, judged
//   by pitch instead of by place.
//
// Timer-read values live in refs, state only for rendering (CLAUDE.md
// "Conventions").

import { useCallback, useEffect, useRef, useState } from 'react';
import { pickScaleQuestion, type ScaleQuestion, type ScalePoolItem, type ScaleDirection } from '../learning/scaleDrill';
import { buildOrderBoard, type ScaleOrderBoard, type RecallLevel } from '../learning/scaleOrder';
import { isScaleCorrect } from '../learning/scaleFall';
import { sequenceBoard, type SequencePattern } from '../learning/scaleSequence';
import { playNoteSingle } from '../utils/audio';
import { haptic, playCorrectChime } from '../utils/feedback';
import { useScoring } from './useScoring';
import { noteRoundEnded, noteRoundStarted } from '../utils/adPacing';

/** Milliseconds a wrong tap stays red. */
const WRONG_FLASH_MS = 350;
/** Pause after a scale's last note before the next scale appears. */
const NEXT_SCALE_MS = 900;
/** Learning mode: a pause before the demo starts, and the time each note of
 *  the demo is lit and sounding. */
const DEMO_LEAD_MS = 500;
const DEMO_NOTE_MS = 550;

export interface ScaleOrderInstrument {
  notes: readonly (readonly string[])[];
  stringCount: number;
  maxFret: number;
  openMidi: readonly number[];
}

export interface ScaleOrderAnswer {
  scaleTypeId: string;
  positionIndex: number;
  correct: boolean;
  seconds: number;
  /** Recall mode level this scale was played at. */
  fadeLevel: RecallLevel;
  /** The sequence this scale was played as, or `null` for the plain run. */
  pattern: SequencePattern | null;
}

export interface ScaleOrderOptions {
  instrument: ScaleOrderInstrument;
  pool: ScalePoolItem[];
  questionCount: number;
  /** Seconds per note that still earn a speed bonus. */
  noteTime: number;
  /** Learning mode: the app plays each scale first, then the learner. */
  demo?: boolean;
  naturalsOnly?: boolean;
  direction?: ScaleDirection;
  /** Override question picking — "Connect the boxes" (`pickConnectQuestion`)
   *  reuses this engine/board unchanged by swapping only this. Defaults to
   *  the single-box picker every other caller already used. */
  pickQuestion?: typeof pickScaleQuestion;
  /** Recall mode: how many of the box's notes are drawn lit (`scaleOrder.ts`).
   *  Read when each scale is laid out, so a change applies from the next one. */
  fadeLevel?: RecallLevel;
  /** Sequences (`scaleSequence.ts`): play the box as this pattern instead of
   *  the plain run, up or down per the question's direction. Read when each
   *  scale is laid out, like `fadeLevel`. */
  sequence?: SequencePattern | null;
  onComplete?: () => void;
  onAnswer?: (answer: ScaleOrderAnswer) => void;
}

export interface OrderTile {
  string: number;
  fret: number;
}

/** One step of the run answered — for the metronome's timing judgement. */
export interface ScaleStepHit {
  /** The step just answered (0-based) and the run's length. */
  step: number;
  runLength: number;
  /** When the note was played, on the `performance.now()` clock: the tap
   *  itself, or the pluck's start as `usePitchStream` timed it. */
  at: number;
  source: 'tap' | 'guitar';
  /** Steps of this run that have slipped so far. */
  slipped: number;
}

/** Metronome options, all optional — without them the engine is unchanged. */
export interface ScaleOrderTimingOptions {
  /** Every answered step. */
  onStepHit?: (hit: ScaleStepHit) => void;
  /** Each new scale, as it is laid out (before any demo). */
  onQuestionStart?: (question: ScaleQuestion, runLength: number) => void;
  /** Learning mode in time: asked as each demo starts — the wait before its
   *  first note and the gap between notes. `null` keeps the default pace. */
  demoTiming?: () => { leadMs: number; noteMs: number } | null;
}

export function useScaleOrderEngine({
  instrument, pool, questionCount, noteTime, demo = false, naturalsOnly = false, direction = 'up',
  pickQuestion = pickScaleQuestion, fadeLevel = 0, onComplete, onAnswer,
  onStepHit, onQuestionStart, demoTiming, sequence = null,
}: ScaleOrderOptions & ScaleOrderTimingOptions) {
  const sequenceRef = useRef<SequencePattern | null>(sequence);
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  /** The sequence the scale on screen was laid out as. */
  const boardPatternRef = useRef<SequencePattern | null>(null);
  const [boardPattern, setBoardPattern] = useState<SequencePattern | null>(null);

  const onStepHitRef = useRef(onStepHit);
  useEffect(() => { onStepHitRef.current = onStepHit; }, [onStepHit]);
  const onQuestionStartRef = useRef(onQuestionStart);
  useEffect(() => { onQuestionStartRef.current = onQuestionStart; }, [onQuestionStart]);
  const demoTimingRef = useRef(demoTiming);
  useEffect(() => { demoTimingRef.current = demoTiming; }, [demoTiming]);

  const fadeLevelRef = useRef<RecallLevel>(fadeLevel);
  useEffect(() => { fadeLevelRef.current = fadeLevel; }, [fadeLevel]);
  /** The level the scale on screen was laid out at. */
  const boardLevelRef = useRef<RecallLevel>(0);

  const { session, reset, beginRun, onCorrect, onWrong } = useScoring();

  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState<ScaleQuestion | null>(null);
  const [board, setBoard] = useState<ScaleOrderBoard | null>(null);
  /** How many steps of the run are done — the next step to tap. */
  const [step, setStep] = useState(0);
  /** Steps that slipped (a wrong tap while they were the one looked for). */
  const [slips, setSlips] = useState<boolean[]>([]);
  const [wrongTile, setWrongTile] = useState<OrderTile | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  /** Learning mode: the run step the demo is lighting now, `-1` in the
   *  pause before it starts, `null` when it's the learner's turn. */
  const [demoStep, setDemoStep] = useState<number | null>(null);

  const runningRef = useRef(false);
  const sessionRef = useRef(0);
  const countRef = useRef(0);
  const questionRef = useRef<ScaleQuestion | null>(null);
  const boardRef = useRef<ScaleOrderBoard | null>(null);
  const stepRef = useRef(0);
  const slipsRef = useRef<boolean[]>([]);
  const questionStartRef = useRef(0);
  const lastHitRef = useRef(0);
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoRunningRef = useRef(false);

  const onAnswerRef = useRef(onAnswer);
  useEffect(() => { onAnswerRef.current = onAnswer; }, [onAnswer]);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const clearTimers = useCallback(() => {
    if (wrongTimeoutRef.current != null) { clearTimeout(wrongTimeoutRef.current); wrongTimeoutRef.current = null; }
    if (nextTimeoutRef.current != null) { clearTimeout(nextTimeoutRef.current); nextTimeoutRef.current = null; }
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    demoRunningRef.current = false;
  }, []);

  const finish = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
    noteRoundEnded();
    onCompleteRef.current?.();
  }, [clearTimers]);

  const nextQuestion = useCallback(() => {
    if (!runningRef.current) return;
    if (countRef.current >= questionCount) { finish(); return; }
    const q = pickQuestion(
      pool, instrument.notes, instrument.stringCount, instrument.maxFret, Math.random, naturalsOnly, direction,
    );
    if (!q) { finish(); return; }
    countRef.current += 1;
    setQuestionNumber(countRef.current);
    boardLevelRef.current = fadeLevelRef.current;
    boardPatternRef.current = sequenceRef.current;
    setBoardPattern(boardPatternRef.current);
    const laid = buildOrderBoard(q, instrument.openMidi, boardLevelRef.current);
    const b = boardPatternRef.current ? sequenceBoard(laid, boardPatternRef.current, q.direction) : laid;
    questionRef.current = q;
    boardRef.current = b;
    stepRef.current = 0;
    slipsRef.current = [];
    setQuestion(q);
    setBoard(b);
    setStep(0);
    setSlips([]);
    setWrongTile(null);
    questionStartRef.current = Date.now();
    lastHitRef.current = questionStartRef.current;

    onQuestionStartRef.current?.(q, b.runMidi.length);

    if (!demo) { setDemoStep(null); return; }
    // Learning mode: light and play each note of the run in turn, then hand
    // over. The clock for this scale starts when the demo ends. With the
    // metronome on, the demo plays one note per click.
    const paced = demoTimingRef.current?.() ?? null;
    const leadMs = paced?.leadMs ?? DEMO_LEAD_MS;
    const noteMs = paced?.noteMs ?? DEMO_NOTE_MS;
    const mySession = sessionRef.current;
    const later = (ms: number, fn: () => void) => {
      demoTimeoutsRef.current.push(setTimeout(() => { if (sessionRef.current === mySession) fn(); }, ms));
    };
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    demoRunningRef.current = true;
    setDemoStep(-1);
    b.run.forEach((p, i) => later(leadMs + i * noteMs, () => {
      setDemoStep(i);
      playNoteSingle(p.string, p.fret);
    }));
    later(leadMs + b.run.length * noteMs, () => {
      demoRunningRef.current = false;
      demoTimeoutsRef.current = [];
      setDemoStep(null);
      questionStartRef.current = Date.now();
      lastHitRef.current = questionStartRef.current;
    });
  }, [questionCount, pool, instrument, naturalsOnly, direction, demo, pickQuestion, finish]);

  const start = useCallback(() => {
    clearTimers();
    reset();
    sessionRef.current += 1;
    noteRoundStarted();
    countRef.current = 0;
    runningRef.current = true;
    setRunning(true);
    beginRun(noteTime, questionCount);
    nextQuestion();
  }, [clearTimers, reset, beginRun, noteTime, questionCount, nextQuestion]);

  // Leaving the screen mid-round ends the round as far as the ad strip goes.
  useEffect(() => () => { if (runningRef.current) noteRoundEnded(); }, []);

  const stop = useCallback(() => {
    // A round stopped part-way still counts toward the ad pacing.
    if (runningRef.current) noteRoundEnded();
    sessionRef.current += 1;
    runningRef.current = false;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  /** The step being looked for was answered — played at `at`
   *  (`performance.now()` clock). */
  const hit = useCallback((at: number, source: ScaleStepHit['source']) => {
    const q = questionRef.current;
    const b = boardRef.current;
    if (!q || !b) return;
    const total = b.runMidi.length;
    const now = Date.now();
    onCorrect((now - lastHitRef.current) / 1000, noteTime);
    lastHitRef.current = now;
    haptic.tap();
    stepRef.current += 1;
    setStep(stepRef.current);
    onStepHitRef.current?.({
      step: stepRef.current - 1, runLength: total, at, source,
      slipped: slipsRef.current.filter(Boolean).length,
    });
    if (stepRef.current >= total) {
      const slipped = slipsRef.current.filter(Boolean).length;
      const correct = isScaleCorrect(total, slipped);
      if (correct) playCorrectChime();
      onAnswerRef.current?.({
        scaleTypeId: q.scaleTypeId,
        positionIndex: q.positionIndex,
        correct,
        seconds: (now - questionStartRef.current) / 1000,
        fadeLevel: boardLevelRef.current,
        pattern: boardPatternRef.current,
      });
      const mySession = sessionRef.current;
      nextTimeoutRef.current = setTimeout(() => {
        if (sessionRef.current === mySession) nextQuestion();
      }, NEXT_SCALE_MS);
    }
  }, [onCorrect, noteTime, nextQuestion]);

  /** A wrong note — out of order, or not in the scale. It is charged to the
   *  step being looked for; `tile`, when known, flashes red. */
  const miss = useCallback((tile: OrderTile | null) => {
    if (!slipsRef.current[stepRef.current]) {
      const next = [...slipsRef.current];
      next[stepRef.current] = true;
      slipsRef.current = next;
      setSlips(next);
    }
    onWrong();
    haptic.wrong();
    if (!tile) return;
    setWrongTile(tile);
    if (wrongTimeoutRef.current != null) clearTimeout(wrongTimeoutRef.current);
    wrongTimeoutRef.current = setTimeout(() => setWrongTile(null), WRONG_FLASH_MS);
  }, [onWrong]);

  /** The learner tapped the tile at `(string, fret)`. */
  const tap = useCallback((string: number, fret: number) => {
    const at = performance.now();
    const b = boardRef.current;
    if (!runningRef.current || !questionRef.current || !b) return;
    // Learning mode: the app is still playing the scale — watch first.
    if (demoRunningRef.current) return;
    // Every tile is a playable note, right or wrong.
    playNoteSingle(string, fret);
    if (stepRef.current >= b.runMidi.length) return; // scale done, waiting for the next

    const midi = b.tileMidi.get(`${string}:${fret}`);
    // A second tap on the note just played is not a mistake.
    if (midi != null && stepRef.current > 0 && midi === b.runMidi[stepRef.current - 1]) { haptic.tap(); return; }
    if (midi != null && midi === b.runMidi[stepRef.current]) { hit(at, 'tap'); return; }
    miss({ string, fret });
  }, [hit, miss]);

  /** A note was played on the guitar (answer by playing, `usePitchStream`).
   *  A pitch says which note was played, not where, so any tile with the
   *  step's pitch answers it. An octave off still counts — pitch detection
   *  on a low string often reads the octave above. Nothing is played back:
   *  the learner's own guitar already sounded it. `info.at` is when the note
   *  was plucked (`usePitchStream`), for the metronome's timing. */
  const hear = useCallback((midi: number, info?: { at: number }) => {
    const b = boardRef.current;
    if (!runningRef.current || !questionRef.current || !b) return;
    if (demoRunningRef.current) return;
    const step = stepRef.current;
    if (step >= b.runMidi.length) return; // scale done, waiting for the next
    const same = (a: number, c: number) => a === c || Math.abs(a - c) === 12;
    // The note just played, still ringing or plucked again, is not a mistake.
    if (step > 0 && same(midi, b.runMidi[step - 1])) return;
    if (same(midi, b.runMidi[step])) { hit(info?.at ?? performance.now(), 'guitar'); return; }
    let tile: OrderTile | null = null;
    for (const [key, m] of b.tileMidi) {
      if (m !== midi) continue;
      const [string, fret] = key.split(':').map(Number);
      tile = { string, fret };
      break;
    }
    miss(tile);
  }, [hit, miss]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    running, question, board, step, slips, wrongTile, demoStep,
    questionNumber, questionCount, boardPattern,
    session, start, stop, tap, hear,
  };
}
