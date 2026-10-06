import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { notes, getCofNotes, getCorrectCofNote, getValidFrets, notesMatch, displayNote } from '../utils/music';
import type { AccidentalMode, OrderMode, HistoryEntry, NotationMode } from '../utils/music';
import type { ScoreResult } from './useScoring';
import { groupCandidateFrets, candidateStringPool } from '../drill/candidates';
import type { DrillPosition } from '../drill/candidates';
import {
  noteNameAtSemitones, intervalBySemitones,
  buildIntervalOptionSemitones, buildTargetNoteOptions,
  targetPositionsForInterval,
  type IntervalDrillSpec, type IntervalExercise,
} from '../utils/intervals';
import { intervalItemId } from '../learning/intervalItem';
import { playNote, playNoteSingle, playNoteSequence, stopPlayback, beep, isSoundPlaying, soundRemainingMs, pauseAudioContext, resumeAudioContext } from '../utils/audio';
import { haptic, playCorrectChime, playStreakTone, correctChimeRemainingMs, showFloatingText } from '../utils/feedback';
import { vlog, verror } from '../utils/debugLog';
import { noteRoundEnded, noteRoundStarted } from '../utils/adPacing';

export interface GameSettings {
  guitarString: number;
  fretFrom: number;
  fretTo: number;
  wholeToneOnly: boolean;
  dotsOnly: boolean;
  byNote: boolean;
  isMulti: boolean;
  activeStrings: number[];
  time: number;
  accidental: AccidentalMode;
  order: OrderMode;
  // Optional explicit question pool. When present and non-empty, questions are
  // drawn only from these positions and the fret-window / wholeToneOnly /
  // dotsOnly filters no longer decide the pool. Absent → unchanged behaviour.
  candidates?: DrillPosition[];
  // Optional interval question spec. When present, every question runs one of
  // the two interval exercises (§8.1): the countdown / scoring / history writes
  // / advance are the plain by-fret flow, but the stimulus (a two-note
  // sequence, or a note + interval) and the answer surface (a chip row) differ.
  // Absent → unchanged behaviour.
  interval?: IntervalDrillSpec;
}

// What the interval branch exposes for the prompt renderer + the chip-row
// answer surface. Null unless an interval question is currently on screen.
export interface IntervalPromptState {
  exercise: IntervalExercise;
  /** 'up' → second note is higher; 'down' → lower. Resolved per question even
   *  when the spec says `direction: 'both'`. */
  dir: 'up' | 'down';
  refString: number;
  /** Fret of the first (reference) note. */
  refFret: number;
  /** Fret of the second (target) note — `refFret ± semitones`. */
  targetFret: number;
  /** Raw sharp-spelled note name at the reference position. */
  rootNote: string;
  /** Sharp-spelled name of the target note (revealed in feedback for
   *  *identify*, and the correct answer for *find the target note*). */
  targetNote: string;
  semitones: number;
  /** *find the target note*: the note-name answer chips (sharp-spelled). */
  options: string[];
  /** *identify the interval*: the interval-size answer chips. */
  optionSemitones: number[];
}

export interface GameSetters {
  setGuitarString: (v: number) => void;
  setTime: (v: number) => void;
  setFretFrom: (v: number) => void;
  setFretTo: (v: number) => void;
  setAccidental: (v: AccidentalMode) => void;
  setOrder: (v: OrderMode) => void;
  setWholeToneOnly: (v: boolean) => void;
  setDotsOnly: (v: boolean) => void;
  setByNote: (v: boolean) => void;
  setMultiStrings: (v: number[]) => void;
  setByString: (v: boolean) => void;
  setStageIndex: (v: number) => void;
}

export interface HistoryOps {
  addEntry: (entry: HistoryEntry) => void;
  markPlayed: () => void;
  resetSession: () => void;
  history: HistoryEntry[];
}

export interface ScoreOps {
  onCorrect: (elapsedSeconds: number, timeLimit: number) => ScoreResult;
  onWrong: () => void;
  onTimeout: () => void;
  // Time limit (seconds) for the question about to be asked, given the current
  // continuous-run progression. `baseTime` is the current difficulty's base.
  getQuestionTime: (baseTime: number) => number;
  // When false ("serious learning" mode) the score itself is still tracked
  // (history + personal best are unaffected) but every score-flavoured effect
  // is suppressed: the floating "+N" and the milestone pause between questions.
  // Defaults to true.
  showScore?: boolean;
}

export interface EngineCallbacks {
  // Fired when the run ends because every question was actually answered
  // (the asked-question budget was reached) — never on a manual Stop, and
  // never on a Pause (which discards the current question and keeps the
  // engine running). Lets a caller (e.g. Auto Advance) distinguish a real
  // stage completion from the session simply being stopped.
  onComplete?: () => void;
  // Interval drills only: after a WRONG answer, don't auto-advance — wait for
  // an explicit `continueAfterMiss()` (the caller must render a Continue
  // control). Off by default so a surface without that control never stalls.
  holdAfterMiss?: boolean;
}

// How the feedback line is worded: the UI language and the player's note-name
// notation (letters / Do-Re-Mi). Absent → English and letters.
export interface EngineDisplay {
  t: (s: string) => string;
  notation: NotationMode;
}

export function useGameEngine(
  settings: GameSettings,
  setters: GameSetters,
  historyOps: HistoryOps,
  scoreOps: ScoreOps,
  callbacks: EngineCallbacks = {},
  display?: EngineDisplay,
) {
  const { guitarString, fretFrom, fretTo, wholeToneOnly, dotsOnly, byNote,
          isMulti, activeStrings, time, accidental, order, candidates, interval } = settings;

  // Read inside timer callbacks, so kept in a ref (no stale language / notation
  // and no new deps on every memoised handler). `note` takes the interval
  // drill's own notation when it has one, so its prompt and feedback match;
  // otherwise it follows the player's pick.
  const fmt = {
    t: (s: string) => display?.t(s) ?? s,
    note: (n: string, notation?: NotationMode) =>
      displayNote(n, accidental, notation ?? display?.notation),
  };
  const fmtRef = useRef(fmt);
  useEffect(() => { fmtRef.current = fmt; });

  // An explicit candidate set confines every question to those exact
  // positions. Built into `string -> sorted frets` once per candidate-array
  // identity; a malformed / all-invalid set collapses to `null` so the drill
  // simply falls back to the filter-based pool below.
  //
  // Positions are validated against the note table captured here. A caller
  // that switches instruments must hand in a fresh `candidates` array (its
  // positions are instrument-specific anyway) for the re-validation to run.
  const candidateFretsByString = useMemo<Map<number, number[]> | null>(() => {
    if (!candidates || candidates.length === 0) return null;
    const grouped = groupCandidateFrets(candidates, notes);
    if (grouped.size === 0) {
      verror('[drill] candidate set has no valid positions — using filters instead',
        { count: candidates.length });
      return null;
    }
    return grouped;
  }, [candidates]);
  const { onComplete } = callbacks;
  const { addEntry, markPlayed, resetSession } = historyOps;
  const { onCorrect, onWrong, onTimeout, getQuestionTime, showScore = true } = scoreOps;

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentFret, setCurrentFret] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [askedFret, setAskedFret] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [correctCofNote, setCorrectCofNote] = useState<string | null>(null);
  const [wrongCofNote, setWrongCofNote] = useState<string | null>(null);
  // The interval size (semitones) the learner wrongly picked on the chip row of
  // an *identify the interval* question, or null. Mirrors `wrongCofNote` for the
  // note circle: it drives the `.is-wrong` marker on `IntervalChoiceRow`.
  const [wrongInterval, setWrongInterval] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [remainingFrets, setRemainingFrets] = useState<number[]>([]);
  const [foundFrets, setFoundFrets] = useState<number[]>([]);
  const [wrongFret, setWrongFret] = useState<number | null>(null);
  // The interval question currently on screen (P4), or null for a plain
  // question. Kept in a ref too so the timer/answer callbacks tag their
  // history rows without re-creating on every prompt change.
  const [intervalPrompt, setIntervalPrompt] = useState<IntervalPromptState | null>(null);
  const intervalPromptRef = useRef<IntervalPromptState | null>(null);
  // True while a *find on the neck* interval question is on screen: the answer
  // is a fret tap on `FretGrid` (like by-note), every octave-equivalent of the
  // target note on the reference string is accepted, and the first correct tap
  // ends the question (no "where else?" sub-round).
  const intervalPositionRef = useRef(false);
  // Single source of truth for the SpeedBar. `questionTime` is the exact limit
  // the current countdown runs on (matches questionTimeRef); `questionStart` is
  // the wall-clock the countdown started at (matches questionStartRef);
  // `questionSeq` increments once per countdown so the bar remounts cleanly for
  // every question and every "where else?" sub-round.
  const [questionTime, setQuestionTime] = useState(time);
  const [questionStart, setQuestionStart] = useState(() => Date.now());
  const [questionSeq, setQuestionSeq] = useState(0);
  // Per-stage question number (1-based) for the progress display. Mirrors
  // countRef, which is reset for every stage in start(); unlike the
  // continuous-run counters in useScoring it goes back to 0 at each Auto
  // Advance boundary.
  const [questionNumber, setQuestionNumber] = useState(0);

  // Refs that game-loop callbacks read directly (avoid stale closures)
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  // Whether the run now ending reached its last question on its own, as
  // opposed to a manual Stop — read once, right when `running` falls to
  // false, by the caller that decides what the end-of-round card says.
  const completedNaturallyRef = useRef(false);
  const pausedRef = useRef(false);
  const countRef = useRef(0);
  const answeredRef = useRef(false);
  const lastNoteRef = useRef<string | null>(null);
  const remainingFretsRef = useRef<number[]>([]);
  const askedFretRef = useRef<number>(0);
  const currentNoteRef = useRef<string | null>(null);
  const currentQuestionStringRef = useRef<number>(guitarString);
  const questionStartRef = useRef(0);
  // Live refs for values used inside timer callbacks
  const maxQuestionsRef = useRef(20);
  const sessionRef = useRef(0); // incremented on start/switchStage to cancel stale callbacks
  // Coverage pool: ensures every valid fret is asked before repeats
  const coveragePoolRef = useRef<number[]>([]);
  const milestonePauseRef = useRef(false);
  // baseTimeRef: the difficulty's own base time (unaffected by streak).
  // questionTimeRef: that base scaled down by the current streak tier —
  // the value actually used for the countdown and passed to scoring.
  const baseTimeRef = useRef(time);
  baseTimeRef.current = time;
  const questionTimeRef = useRef(time);
  // Note playback speed scales proportionally with how far the continuous
  // timing ramp has compressed the current question: rate = base / current.
  // At the original/base question time this is 1×. This only affects audio
  // playback rate — timing, scoring, streaks and Auto Advance are untouched.
  const questionPlaybackRate = () =>
    questionTimeRef.current > 0 ? baseTimeRef.current / questionTimeRef.current : 1;
  const timeoutCallbackRef = useRef<(() => void) | null>(null);
  // Hold-after-miss (interval drills): the pending "next question" closure,
  // stamped with its session, run only by an explicit continueAfterMiss().
  const holdMissRef = useRef(false);
  holdMissRef.current = !!callbacks.holdAfterMiss;
  const continueRef = useRef<{ session: number; fn: () => void } | null>(null);
  const [awaitingContinue, setAwaitingContinue] = useState(false);
  // The contrastive replay's delayed second playback.
  const replayTimerRef = useRef<number | null>(null);
  const clearReplay = () => {
    if (replayTimerRef.current) { clearTimeout(replayTimerRef.current); replayTimerRef.current = null; }
  };
  const dropHold = () => {
    continueRef.current = null;
    setAwaitingContinue(false);
  };
  const advanceTimeoutRef = useRef<number | null>(null);
  const advanceMetaRef = useRef<{ fn: () => void; start: number; delay: number } | null>(null);

  const scheduleAdvance = useCallback((fn: () => void, delay: number) => {
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceMetaRef.current = { fn, start: Date.now(), delay };
    advanceTimeoutRef.current = window.setTimeout(() => {
      advanceTimeoutRef.current = null;
      advanceMetaRef.current = null;
      fn();
    }, delay);
  }, []);

  const scoreCorrect = useCallback((elapsedSeconds: number): ScoreResult => {
    const result = onCorrect(elapsedSeconds, questionTimeRef.current);
    playCorrectChime();
    // The climbing streak tone belongs with the rest of the score display, so
    // "Score & celebrations: Off" drops it along with the HUD.
    if (showScore) playStreakTone(result.streak);
    haptic.correct();

    // A small floating "+N" by the live score — a clean "you scored" cue with
    // no ring. Streak milestones (3/5/10…) get no in-game celebration: the
    // streak shows only through the score multiplier and the HUD.
    if (showScore) {
      const scoreEl = document.getElementById('live-score');
      if (scoreEl) {
        const rect = scoreEl.getBoundingClientRect();
        showFloatingText(`+${result.points}`, 'var(--accent)', 800, rect.left + rect.width / 2, rect.top);
      }
    }

    return result;
  }, [onCorrect, showScore]);

  // Defer the next question (and its note) until every feedback sound has
  // finished — the success chime after a correct answer, or a reveal note after
  // a wrong answer / timeout — so a question note never starts on top of the
  // sound that scored the previous one. `minDelay` keeps the existing
  // read-the-answer pauses; the effective wait is whichever is longest. Routed
  // through scheduleAdvance so pause cancels it like any other pending advance.
  const advanceAfterSound = useCallback((fn: () => void, minDelay = 0) => {
    scheduleAdvance(fn, Math.max(minDelay, correctChimeRemainingMs(), soundRemainingMs()));
  }, [scheduleAdvance]);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const startCountdown = (seconds: number, onTimeout: () => void) => {
    timeoutCallbackRef.current = onTimeout;
    // `seconds` can be fractional (the run's timing ramp eases toward a 3s
    // floor). Display whole seconds counting down cleanly to 0 — never a
    // fractional or negative value — by ceiling the start and clamping each
    // tick, instead of decrementing the raw fractional value.
    let rem = Math.ceil(seconds);
    setRemaining(rem);
    countdownRef.current = window.setInterval(() => {
      rem = Math.max(0, rem - 1);
      setRemaining(rem);
      if (rem <= 0 && countdownRef.current) clearInterval(countdownRef.current);
    }, 1000);
    timerRef.current = window.setTimeout(onTimeout, seconds * 1000);
  };

  // Start a countdown AND publish its timing to the render layer in the same
  // step, so the SpeedBar always spans exactly `seconds` from exactly the
  // moment questionStartRef was stamped. Bumping questionSeq remounts the bar.
  const beginCountdown = (seconds: number, onTimeout: () => void) => {
    setQuestionTime(seconds);
    setQuestionStart(questionStartRef.current);
    setQuestionSeq(s => s + 1);
    startCountdown(seconds, onTimeout);
  };

  const pickSmartFret = useCallback((validFrets: number[], _strIdx: number): number => {
    if (validFrets.length === 0) return 0;

    // Shuffle-bag approach: drain the pool in random order, then reshuffle
    // Keep only frets that are still valid
    coveragePoolRef.current = coveragePoolRef.current.filter(f => validFrets.includes(f));

    // Refill and shuffle when empty
    if (coveragePoolRef.current.length === 0) {
      // Fisher-Yates shuffle
      const bag = [...validFrets];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      coveragePoolRef.current = bag;
    }

    // Avoid immediate repeat of last fret — swap it to the end if it's first
    const lastFret = lastNoteRef.current !== null
      ? validFrets.find(f => notes[_strIdx]?.[f] === lastNoteRef.current) ?? -1
      : -1;

    if (coveragePoolRef.current[0] === lastFret && coveragePoolRef.current.length > 1) {
      // Move it to the back so it's asked later
      coveragePoolRef.current.push(coveragePoolRef.current.shift()!);
    }

    // Take the first item from the pool
    const pick = coveragePoolRef.current.shift()!;
    return pick ?? validFrets[0];
  }, []);

  // ── INTERVAL QUESTION ────────────────────────────────────────
  // Build one interval question: pick a first note on `qString` with room for
  // the second note above or below it (per the question's direction), work out
  // the target note, and assemble the chip-row options for the active exercise
  // (§8.1). Returns null only for a degenerate window (the caller then falls
  // back to a plain note pick, same as before intervals existed).
  const buildIntervalQuestion = useCallback(
    (qString: number, validFrets: number[]): {
      askedFret: number;
      targetNote: string;
      targetFrets: number[];
      prompt: IntervalPromptState;
    } | null => {
      const spec = interval;
      if (!spec || validFrets.length === 0) return null;
      const semis = spec.semitones.length > 0 ? spec.semitones : [4];
      const semi = semis[Math.floor(Math.random() * semis.length)];
      const dir: 'up' | 'down' =
        spec.direction === 'both'
          ? (Math.random() < 0.5 ? 'up' : 'down')
          : spec.direction;
      const delta = dir === 'up' ? semi : -semi;
      const row = notes[qString - 1];
      if (!row) return null;
      // Prefer a reference that leaves room for the target inside the drilled
      // window; fall back to any position whose target is still a real fret.
      const inRow = (f: number) => f >= 0 && f < row.length;
      const roomy = validFrets.filter(
        (f) => inRow(f + delta) && f + delta >= fretFrom && f + delta <= fretTo,
      );
      const anyOk = validFrets.filter((f) => inRow(f + delta));
      let pool = roomy.length > 0 ? roomy : anyOk;
      if (pool.length === 0) return null;

      // §9.1 register spread — draw the reference note from a tighter fret
      // window on the harder-to-hear tiers (matters for *identify*'s two-note
      // playback). Skip the narrowing if it would empty the pool.
      const spread = spec.registerSpread ?? 'wide';
      if (spread !== 'wide') {
        const lo = spread === 'narrow' ? Math.max(fretFrom, 3) : Math.max(fretFrom, 2);
        const hi = spread === 'narrow' ? Math.min(fretTo, 9) : Math.min(fretTo, 11);
        const inRegister = pool.filter((f) => f >= lo && f <= hi);
        if (inRegister.length > 0) pool = inRegister;
      }

      // §9.1 first-note bias — `focused` prefers a natural (no ♯/♭) first note.
      if (spec.firstNoteBias === 'naturals') {
        const naturals = pool.filter((f) => !/[#b]/.test(row[f]));
        if (naturals.length > 0) pool = naturals;
      }

      const refFret = pool[Math.floor(Math.random() * pool.length)];
      const targetFret = refFret + delta;
      const targetNote = noteNameAtSemitones(row[refFret], delta);
      const optionCount = Math.max(2, spec.optionCount ?? 4);

      // *find on the neck*: the answer is a fret tap, and every octave-equivalent
      // of the target note on the reference string counts (like the by-note
      // flow). Fall back to the single exact fret if the window somehow holds
      // none (degenerate range).
      const positionFrets =
        spec.exercise === 'findTargetPosition'
          ? (() => {
              const ps = targetPositionsForInterval(
                { string: qString, fret: refFret },
                delta,
                notes,
                { strings: [qString], fretFrom, fretTo },
              ).map((p) => p.fret);
              return ps.length > 0 ? ps : [targetFret];
            })()
          : [targetFret];
      // §9.2 option-set shaping: focused avoids near confusers, full forces the
      // nearest neighbours in, mixed only completes the current group's
      // in-pool confuser pairs.
      const optionRules = {
        avoidNear: spec.optionPolicy === 'avoidNear',
        forceNear: spec.optionPolicy === 'allNear',
        pairs: spec.confuserPairs,
      };
      return {
        askedFret: targetFret,
        targetNote,
        targetFrets: positionFrets,
        prompt: {
          exercise: spec.exercise,
          dir,
          refString: qString,
          refFret,
          targetFret,
          rootNote: row[refFret],
          targetNote,
          semitones: semi,
          options:
            spec.exercise === 'findTargetNote'
              ? buildTargetNoteOptions(row[refFret], targetNote, semis, dir === 'up' ? 1 : -1, optionCount, optionRules, semi)
              : [],
          optionSemitones:
            spec.exercise === 'identifyInterval'
              ? buildIntervalOptionSemitones(semi, semis, optionCount, optionRules)
              : [],
        },
      };
    },
    [interval, fretFrom, fretTo],
  );

  // Play the interval question's stimulus: the two-note sequence for *identify
  // the interval* (low→high or high→low per direction), or the single first
  // note for *find the target note*. Used on question start and by the
  // "hear it again" control. No-op outside an interval question.
  const playIntervalStimulus = useCallback(() => {
    const p = intervalPromptRef.current;
    if (!p) return;
    if (p.exercise === 'identifyInterval') {
      playNoteSequence(p.refString, [p.refFret, p.targetFret], 900);
    } else {
      playNoteSingle(p.refString, p.refFret, questionPlaybackRate());
    }
  }, []);

  // After a wrong answer in an interval drill: wait for an explicit Continue
  // instead of auto-advancing. Returns false (caller keeps its auto-advance)
  // when the hold is off or this is not an interval question.
  const holdForContinue = useCallback((mySession: number, fn: () => void): boolean => {
    if (!holdMissRef.current || !intervalPromptRef.current) return false;
    continueRef.current = { session: mySession, fn };
    setAwaitingContinue(true);
    return true;
  }, []);

  const continueAfterMiss = useCallback(() => {
    const held = continueRef.current;
    if (!held || held.session !== sessionRef.current || !runningRef.current) return;
    dropHold();
    held.fn();
  }, []);

  // Contrastive replay on a miss in *identify the interval*: the correct
  // interval, then — from the same root — the one the learner chose, so the
  // difference is audible. Silent mode is honoured inside playNoteSequence.
  const playContrastiveReplay = useCallback((chosenSemitones: number, mySession: number) => {
    const p = intervalPromptRef.current;
    if (!p || p.exercise !== 'identifyInterval') return;
    clearReplay();
    const maxFret = notes[p.refString - 1].length - 1;
    const sign = p.dir === 'up' ? 1 : -1;
    let chosenFret = p.refFret + sign * chosenSemitones;
    if (chosenFret < 0 || chosenFret > maxFret) chosenFret = p.refFret - sign * chosenSemitones;
    replayTimerRef.current = window.setTimeout(() => {
      replayTimerRef.current = null;
      if (sessionRef.current !== mySession || !runningRef.current) return;
      playNoteSequence(p.refString, [p.refFret, p.targetFret], 900);
      if (chosenFret < 0 || chosenFret > maxFret) return;
      replayTimerRef.current = window.setTimeout(() => {
        replayTimerRef.current = null;
        if (sessionRef.current !== mySession || !runningRef.current) return;
        playNoteSequence(p.refString, [p.refFret, chosenFret], 900);
      }, 1500);
    }, 350);
  }, []);

  const setIntervalPromptBoth = useCallback((p: IntervalPromptState | null) => {
    intervalPromptRef.current = p;
    setIntervalPrompt(p);
  }, []);

  // Tag a history row with the interval quality it exercised (+ the exercise
  // form and direction, for Stats), so the interval drill's in-memory sink can
  // route it to the interval SRS schedule. A no-op (returns the row unchanged)
  // outside an interval question.
  const tagInterval = useCallback((entry: HistoryEntry): HistoryEntry => {
    const p = intervalPromptRef.current;
    return p
      ? {
          ...entry,
          intervalItemId: intervalItemId(p.semitones),
          intervalForm:
            p.exercise === 'identifyInterval'
              ? 'identify'
              : p.exercise === 'findTargetPosition'
                ? 'findPosition'
                : 'findNote',
          intervalDir: p.dir,
        }
      : entry;
  }, []);

  // ── BY NOTE MODE ──────────────────────────────────────────────
  const nextByNote = useCallback(() => {
    if (!runningRef.current || countRef.current >= maxQuestionsRef.current) {
      const completedNaturally = runningRef.current && countRef.current >= maxQuestionsRef.current;
      setRunning(false); runningRef.current = false;
      completedNaturallyRef.current = completedNaturally;
      if (completedNaturally) { noteRoundEnded(); onComplete?.(); }
      return;
    }
    const mySession = sessionRef.current;
    countRef.current++;
    setQuestionNumber(countRef.current);
    setAnswered(false);
    answeredRef.current = false;
    clearReplay(); dropHold();
    setFeedback('');
    setWrongFret(null);
    setFoundFrets([]);

    // With an explicit candidate set: pick a string from the candidate pool
    // and use that string's candidate frets. Without one: the original
    // filter-based selection, unchanged.
    const candStrings = candidateFretsByString
      ? candidateStringPool(candidateFretsByString, isMulti, guitarString)
      : null;
    const qString = candStrings
      ? candStrings[Math.floor(Math.random() * candStrings.length)]
      : isMulti
        ? activeStrings[Math.floor(Math.random() * activeStrings.length)]
        : guitarString;
    currentQuestionStringRef.current = qString;
    setters.setGuitarString(qString);

    const candFrets = candidateFretsByString?.get(qString);
    const validFrets = candFrets && candFrets.length > 0
      ? candFrets
      : getValidFrets(qString - 1, fretFrom, fretTo, wholeToneOnly, dotsOnly);

    // *Find on the neck* interval question (§8.5): the only interval exercise
    // that answers on the neck. Mark one note on this string, name the interval
    // + direction, and accept a tap on any octave-equivalent of the target note.
    let iq: ReturnType<typeof buildIntervalQuestion> = null;
    let iqString = qString;
    if (interval && interval.exercise === 'findTargetPosition') {
      // A degenerate fret window on the chosen string can leave
      // buildIntervalQuestion with nowhere to place the interval and it returns
      // null. Rather than silently dropping to a plain note question with no
      // interval context (#11), try the other candidate strings — each with its
      // own valid frets — before giving up.
      const iqPool = candStrings ?? (isMulti ? activeStrings : [guitarString]);
      for (const s of [qString, ...iqPool.filter((x) => x !== qString)]) {
        const cf = candidateFretsByString?.get(s);
        const vf = cf && cf.length > 0
          ? cf
          : getValidFrets(s - 1, fretFrom, fretTo, wholeToneOnly, dotsOnly);
        const built = buildIntervalQuestion(s, vf);
        if (built) { iq = built; iqString = s; break; }
      }
    }
    if (iq) {
      if (iqString !== qString) {
        currentQuestionStringRef.current = iqString;
        setters.setGuitarString(iqString);
      }
      intervalPositionRef.current = true;
      setIntervalPromptBoth(iq.prompt);
      const targetNote = iq.targetNote;
      lastNoteRef.current = targetNote;
      askedFretRef.current = iq.prompt.targetFret;
      currentNoteRef.current = targetNote;
      remainingFretsRef.current = [...iq.targetFrets];
      setRemainingFrets([...iq.targetFrets]);
      setCurrentNote(targetNote);
      setCurrentFret(null);
      setAskedFret(iq.prompt.refFret);
      questionStartRef.current = Date.now();
      questionTimeRef.current = getQuestionTime(baseTimeRef.current);
      playIntervalStimulus();
      beginCountdown(questionTimeRef.current, () => {
        if (answeredRef.current || sessionRef.current !== mySession) return;
        answeredRef.current = true;
        setAnswered(true);
        beep();
        onTimeout();
        const elapsed = (Date.now() - questionStartRef.current) / 1000;
        addEntry(tagInterval({ note: targetNote, fret: remainingFretsRef.current[0], string: iqString, seconds: Math.round(elapsed * 10) / 10, skipped: true, correct: null }));
        setFeedback(`⏱ ${fmtRef.current.note(targetNote, interval?.notation)}`);
        playNoteSingle(iqString, remainingFretsRef.current[0], questionPlaybackRate());
        advanceAfterSound(() => { if (runningRef.current && sessionRef.current === mySession) nextByNote(); }, 1800);
      });
      return;
    }
    intervalPositionRef.current = false;
    setIntervalPromptBoth(null);

    // By-note is a note-only surface — the two chip-row interval exercises
    // always run through the by-fret flow, never here.
    const fret = pickSmartFret(validFrets, qString - 1);
    const note = notes[qString - 1][fret];
    lastNoteRef.current = note;
    askedFretRef.current = fret;
    currentNoteRef.current = note;

    const allFretsForNote = validFrets.filter(f => notesMatch(notes[qString - 1][f], note));
    setRemainingFrets(allFretsForNote);
    remainingFretsRef.current = allFretsForNote;
    setCurrentNote(note);
    setCurrentFret(null);
    setAskedFret(fret);

    questionStartRef.current = Date.now();

    // BUG FIX 1: use timeRef.current so countdown uses the correct time after switchStage
    questionTimeRef.current = getQuestionTime(baseTimeRef.current);
    playNote(qString, fret, questionPlaybackRate());
    beginCountdown(questionTimeRef.current, () => {
      if (answeredRef.current || sessionRef.current !== mySession) return;
      answeredRef.current = true;
      setAnswered(true);
      beep();
      onTimeout();
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      addEntry(tagInterval({ note, fret: askedFretRef.current, string: qString, seconds: Math.round(elapsed * 10) / 10, skipped: true, correct: null }));
      setFeedback(`⏱ ${fmtRef.current.t('Frets')}: ${remainingFretsRef.current.join(', ')}`);
      playNoteSingle(qString, askedFretRef.current, questionPlaybackRate());
      advanceAfterSound(() => { if (runningRef.current && sessionRef.current === mySession) nextByNote(); }, 1800);
    });
  }, [guitarString, isMulti, activeStrings, fretFrom, fretTo, wholeToneOnly, dotsOnly, candidateFretsByString, pickSmartFret, addEntry, setters, onTimeout, scheduleAdvance, advanceAfterSound, onComplete, getQuestionTime, tagInterval, interval, buildIntervalQuestion, setIntervalPromptBoth, playIntervalStimulus, accidental]);

  // ── SELECT FRET (by note mode) ────────────────────────────────
  const selectFret = useCallback((selectedFret: number) => {
    if (!runningRef.current || paused || answeredRef.current) return;
    stopPlayback(); // stop question sound immediately on user input
    const mySession = sessionRef.current;
    const qString = currentQuestionStringRef.current;
    const rem = remainingFretsRef.current;
    const note = currentNoteRef.current!;
    const isCorrect = rem.includes(selectedFret);

    if (isCorrect) {
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const scoreResult = scoreCorrect(elapsed);
      // *Find on the neck*: one correct tap completes the question — every
      // octave-equivalent of the target note was an accepted answer, not a
      // separate thing to find, so there is no "where else?" sub-round.
      const newRem = intervalPositionRef.current ? [] : rem.filter(f => f !== selectedFret);
      remainingFretsRef.current = newRem;
      setRemainingFrets(newRem);
      setFoundFrets(prev => [...prev, selectedFret]);
      addEntry(tagInterval({ note, fret: selectedFret, string: qString, seconds: Math.round(elapsed * 10) / 10, skipped: false, correct: true }));

      if (newRem.length === 0) {
        clearTimers();
        answeredRef.current = true;
        setAnswered(true);
        setFeedback(`✓ ${fmtRef.current.t(intervalPositionRef.current ? 'Correct!' : 'All found!')}`);
        // Visual celebration (floating text, rings/banner) plays independently
        // on its own overlay, but the success chime must finish before the next
        // question note so they don't overlap.
        advanceAfterSound(() => { if (runningRef.current && sessionRef.current === mySession) nextByNote(); });
      } else {
        clearTimers();
        setFeedback(`✓ ${fmtRef.current.t('Where else? ({n} more)').replace('{n}', String(newRem.length))}`);

        const resumeRemaining = () => {
          if (!runningRef.current || sessionRef.current !== mySession) return;
          milestonePauseRef.current = false;
          answeredRef.current = false;
          setAnswered(false);
          questionStartRef.current = Date.now();
          beginCountdown(questionTimeRef.current, () => {
            if (answeredRef.current || sessionRef.current !== mySession) return;
            answeredRef.current = true;
            setAnswered(true);
            beep();
            onTimeout();
            const elapsed2 = (Date.now() - questionStartRef.current) / 1000;
            addEntry(tagInterval({ note, fret: remainingFretsRef.current[0], string: qString, seconds: Math.round(elapsed2 * 10) / 10, skipped: true, correct: null }));
            setFeedback(`⏱ ${fmtRef.current.t('Also on: {list}').replace('{list}', remainingFretsRef.current.join(', '))}`);
            playNoteSingle(qString, remainingFretsRef.current[0], questionPlaybackRate());
            advanceAfterSound(() => { if (runningRef.current && sessionRef.current === mySession) nextByNote(); }, 1800);
          });
        };

        if (showScore && scoreResult.milestone) {
          milestonePauseRef.current = true;
          answeredRef.current = true;
          setAnswered(true);
          scheduleAdvance(resumeRemaining, 1500);
        } else {
          resumeRemaining();
        }
      }
    } else {
      onWrong();
      haptic.wrong();
      clearTimers();
      answeredRef.current = true;
      setAnswered(true);
      setWrongFret(selectedFret);
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      addEntry(tagInterval({ note, fret: selectedFret, string: qString, seconds: Math.round(elapsed * 10) / 10, skipped: false, correct: false }));
      setFeedback(
        intervalPositionRef.current
          ? `✗ ${fmtRef.current.note(note, interval?.notation)}`
          : `✗ ${fmtRef.current.t('Correct: {list}').replace('{list}', rem.join(', '))}`,
      );
      // *Find on the neck* miss: the board already reveals every accepted
      // position — hold for an explicit Continue so it can be read.
      if (!(intervalPositionRef.current && holdForContinue(mySession, nextByNote))) {
        advanceAfterSound(() => { if (runningRef.current && sessionRef.current === mySession) nextByNote(); }, 1800);
      }
    }
  }, [paused, addEntry, nextByNote, onTimeout, onWrong, scoreCorrect, scheduleAdvance, advanceAfterSound, showScore, tagInterval, accidental, interval, holdForContinue]);

  // ── BY FRET MODE ──────────────────────────────────────────────
  const next = useCallback(() => {
    if (!runningRef.current || countRef.current >= maxQuestionsRef.current) {
      const completedNaturally = runningRef.current && countRef.current >= maxQuestionsRef.current;
      setRunning(false); runningRef.current = false;
      completedNaturallyRef.current = completedNaturally;
      if (completedNaturally) { noteRoundEnded(); onComplete?.(); }
      return;
    }
    const mySession = sessionRef.current;
    countRef.current++;
    setQuestionNumber(countRef.current);
    setAnswered(false);
    answeredRef.current = false;
    clearReplay(); dropHold();
    setFeedback('');
    setCorrectCofNote(null);
    setWrongCofNote(null);
    setWrongInterval(null);

    // With an explicit candidate set: pick a string from the candidate pool
    // and use that string's candidate frets. Without one: the original
    // filter-based selection, unchanged.
    const candStrings = candidateFretsByString
      ? candidateStringPool(candidateFretsByString, isMulti, guitarString)
      : null;
    const qString = candStrings
      ? candStrings[Math.floor(Math.random() * candStrings.length)]
      : isMulti
        ? activeStrings[Math.floor(Math.random() * activeStrings.length)]
        : guitarString;
    currentQuestionStringRef.current = qString;
    setters.setGuitarString(qString);

    const candFrets = candidateFretsByString?.get(qString);
    const validFrets = candFrets && candFrets.length > 0
      ? candFrets
      : getValidFrets(qString - 1, fretFrom, fretTo, wholeToneOnly, dotsOnly);
    const iq = interval ? buildIntervalQuestion(qString, validFrets) : null;
    setIntervalPromptBoth(iq ? iq.prompt : null);
    const fret = iq ? iq.askedFret : pickSmartFret(validFrets, qString - 1);
    lastNoteRef.current = notes[qString - 1][fret];
    askedFretRef.current = fret;
    setCurrentFret(fret);
    setCurrentNote(null);
    // Interval question: `fret` is the (hidden) target — don't surface it; the
    // chip row is the answer surface and the prompt carries the stimulus.
    setAskedFret(iq ? null : fret);
    currentNoteRef.current = null;
    questionStartRef.current = Date.now();

    questionTimeRef.current = getQuestionTime(baseTimeRef.current);
    if (iq) {
      // *identify the interval*: play the two-note sequence (never a note the
      // learner has to name). *find the target note*: sound the first note.
      playIntervalStimulus();
    } else {
      playNote(qString, fret, questionPlaybackRate());
    }
    beginCountdown(questionTimeRef.current, () => {
      if (answeredRef.current || sessionRef.current !== mySession) return;
      answeredRef.current = true;
      setAnswered(true);
      beep();
      onTimeout();
      const correctNote = notes[qString - 1][fret];
      // A question that ran out of time with every voice attempt rejected
      // otherwise leaves no record of what the speaker was trying to say.
      vlog('[voice] timed out', { correctNote, currentFret: fret });
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      addEntry(tagInterval({ note: correctNote, fret, string: qString, seconds: Math.round(elapsed * 10) / 10, skipped: true, correct: null }));
      if (iq && iq.prompt.exercise === 'identifyInterval') {
        const short = intervalBySemitones(iq.prompt.semitones)?.short ?? `+${iq.prompt.semitones}`;
        setFeedback(`⏱ ${short}`);
      } else if (iq) {
        setFeedback(`⏱ ${fmtRef.current.note(correctNote, interval?.notation)}`);
      } else {
        const cof = getCofNotes(accidental, order, false);
        setCorrectCofNote(getCorrectCofNote(correctNote, cof));
        setFeedback(`⏱ ${fmtRef.current.note(correctNote)} (${fmtRef.current.t('Fret')} ${fret})`);
      }
      scheduleAdvance(() => { if (runningRef.current && sessionRef.current === mySession) next(); }, 1500);
    });
  }, [guitarString, isMulti, activeStrings, fretFrom, fretTo, accidental, order, wholeToneOnly, dotsOnly, candidateFretsByString, pickSmartFret, addEntry, setters, onTimeout, scheduleAdvance, onComplete, getQuestionTime, interval, buildIntervalQuestion, setIntervalPromptBoth, playIntervalStimulus, tagInterval]);

  const selectAnswer = useCallback((selectedNote: string) => {
    vlog('[voice] selectAnswer', { selectedNote, running: runningRef.current, paused, answered: answeredRef.current, currentFret });
    if (!runningRef.current || paused || answeredRef.current || currentFret === null) return undefined;
    const mySession = sessionRef.current;
    answeredRef.current = true;
    setAnswered(true);
    clearTimers();
    stopPlayback();
    const qString = currentQuestionStringRef.current;
    const correctNote = notes[qString - 1][currentFret];
    const cof = getCofNotes(accidental, order, false);
    const isCorrect = notesMatch(selectedNote, correctNote);
    // Voice diagnosis needs to tell "the recogniser heard the wrong note"
    // apart from "it heard the right note and the answer was wrong", and the
    // recogniser's own log lines can't say which. Record the verdict here.
    vlog('[voice] scored', { selectedNote, correctNote, isCorrect });
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    if (isCorrect) {
      scoreCorrect(elapsed);
    } else {
      onWrong();
      haptic.wrong();
    }
    setCorrectCofNote(getCorrectCofNote(correctNote, cof));
    if (!isCorrect) setWrongCofNote(selectedNote);
    addEntry(tagInterval({ note: correctNote, fret: currentFret, string: qString, seconds: Math.round(elapsed * 10) / 10, skipped: false, correct: isCorrect }));
    setFeedback(
      isCorrect
        ? `✓ ${fmtRef.current.t('Correct!')}`
        : `✗ ${fmtRef.current.t('It was {note}').replace('{note}', fmtRef.current.note(correctNote, intervalPromptRef.current ? interval?.notation : undefined))}`,
    );

    if (isCorrect) {
      // Wait for the success chime to finish before advancing so its tail does
      // not overlap the next question note (visible esp. during Auto Advance).
      advanceAfterSound(() => { if (runningRef.current && sessionRef.current === mySession) next(); });
      return true;
    }

    // *Find the target note* miss: the chip row already marks the right note —
    // hold for an explicit Continue (no-op outside an interval drill).
    if (holdForContinue(mySession, next)) return false;
    const waitForSound = () => {
      if (isSoundPlaying()) {
        scheduleAdvance(waitForSound, 100);
      } else {
        scheduleAdvance(() => { if (runningRef.current && sessionRef.current === mySession) next(); }, 400);
      }
    };
    scheduleAdvance(waitForSound, 800);
    return false;
  }, [paused, currentFret, accidental, order, addEntry, next, onWrong, scoreCorrect, scheduleAdvance, advanceAfterSound, tagInterval, interval, holdForContinue]);

  // ── SELECT INTERVAL (identify-the-interval answer) ────────────
  // The chip-row answer for *identify the interval*: the learner picked an
  // interval size; grade it against the interval that was played. Mirrors
  // `selectAnswer`'s scoring / history / advance, minus the note-circle state.
  const selectInterval = useCallback((chosenSemitones: number) => {
    if (!runningRef.current || paused || answeredRef.current) return undefined;
    const p = intervalPromptRef.current;
    if (!p) return undefined;
    const mySession = sessionRef.current;
    answeredRef.current = true;
    setAnswered(true);
    clearTimers();
    stopPlayback();
    const qString = currentQuestionStringRef.current;
    const isCorrect = chosenSemitones === p.semitones;
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    if (isCorrect) {
      scoreCorrect(elapsed);
    } else {
      onWrong();
      haptic.wrong();
      setWrongInterval(chosenSemitones);
    }
    addEntry(tagInterval({ note: p.targetNote, fret: p.targetFret, string: qString, seconds: Math.round(elapsed * 10) / 10, skipped: false, correct: isCorrect }));
    const answerShort = intervalBySemitones(p.semitones)?.short ?? `+${p.semitones}`;
    const chosenShort = intervalBySemitones(chosenSemitones)?.short ?? `+${chosenSemitones}`;
    setFeedback(
      isCorrect
        ? `✓ ${fmtRef.current.t('Correct!')}`
        : holdMissRef.current
          ? `✗ ${fmtRef.current.t('You said {chosen}, it was {answer}').replace('{chosen}', chosenShort).replace('{answer}', answerShort)}`
          : `✗ ${answerShort}`,
    );

    if (isCorrect) {
      advanceAfterSound(() => { if (runningRef.current && sessionRef.current === mySession) next(); });
      return true;
    }
    if (holdForContinue(mySession, next)) {
      playContrastiveReplay(chosenSemitones, mySession);
      return false;
    }
    const waitForSound = () => {
      if (isSoundPlaying()) {
        scheduleAdvance(waitForSound, 100);
      } else {
        scheduleAdvance(() => { if (runningRef.current && sessionRef.current === mySession) next(); }, 400);
      }
    };
    scheduleAdvance(waitForSound, 800);
    return false;
  }, [paused, addEntry, next, onWrong, scoreCorrect, scheduleAdvance, advanceAfterSound, tagInterval, holdForContinue, playContrastiveReplay]);

  // "🔊 hear it again" — replay the current interval question's stimulus with
  // no scoring effect. No-op outside an interval question.
  const replayIntervalQuestion = useCallback(() => {
    if (!runningRef.current || !intervalPromptRef.current) return;
    clearReplay();
    playIntervalStimulus();
  }, [playIntervalStimulus]);

  // ── CONTROLS ─────────────────────────────────────────────────
  const start = useCallback((maxQ: number, currentTime: number, isByNote: boolean) => {
    sessionRef.current++;
    clearReplay(); dropHold();
    noteRoundStarted();
    maxQuestionsRef.current = maxQ;
    baseTimeRef.current = currentTime;
    questionTimeRef.current = currentTime;
    setQuestionTime(currentTime);
    setRunning(true);
    setPaused(false);
    runningRef.current = true;
    pausedRef.current = false;
    completedNaturallyRef.current = false;
    countRef.current = 0;
    setQuestionNumber(0);
    coveragePoolRef.current = [];
    resetSession();
    setFeedback('');
    setCurrentFret(null);
    setCurrentNote(null);
    setAskedFret(null);
    setCorrectCofNote(null);
    setWrongCofNote(null);
    setWrongInterval(null);
    setFoundFrets([]);
    setWrongFret(null);
    intervalPromptRef.current = null;
    setIntervalPrompt(null);
    lastNoteRef.current = null;
    milestonePauseRef.current = false;
    markPlayed();
    setTimeout(isByNote ? nextByNote : next, 100);
  }, [nextByNote, next, resetSession, markPlayed]);

  // Leaving the screen mid-round ends the round as far as the ad strip goes.
  useEffect(() => () => { if (runningRef.current || pausedRef.current) noteRoundEnded(); }, []);

  const stop = useCallback(() => {
    // A round stopped part-way still counts toward the ad pacing.
    if (runningRef.current || pausedRef.current) noteRoundEnded();
    clearTimers();
    if (advanceTimeoutRef.current) { clearTimeout(advanceTimeoutRef.current); advanceTimeoutRef.current = null; }
    advanceMetaRef.current = null;
    clearReplay(); dropHold();
    runningRef.current = false;
    pausedRef.current = false;
    completedNaturallyRef.current = false;
    answeredRef.current = true; // prevent any pending callbacks
    setRunning(false);
    setPaused(false);
    setCurrentFret(null);
    setCurrentNote(null);
    setAskedFret(null);
    setCorrectCofNote(null);
    setWrongCofNote(null);
    setWrongInterval(null);
    setFoundFrets([]);
    setWrongFret(null);
    intervalPromptRef.current = null;
    setIntervalPrompt(null);
    milestonePauseRef.current = false;
    stopPlayback();
  }, []);

  // Discard the in-progress question entirely, as if it were never asked:
  // cancel its countdown/scheduled-advance so no timeout/answer callback can
  // fire for it, and give back its slot in the asked-question budget. No
  // score/history entry is ever written for a question that was neither
  // answered nor timed out, so nothing there needs undoing.
  const pause = useCallback(() => {
    // Idempotent: repeated calls while already paused (e.g. several
    // visibilitychange/pagehide/appStateChange firings before the user
    // resumes) must not discard more than the one in-flight question.
    if (pausedRef.current) return;
    pausedRef.current = true;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (advanceTimeoutRef.current) { clearTimeout(advanceTimeoutRef.current); advanceTimeoutRef.current = null; }
    advanceMetaRef.current = null;
    // A held miss: its question was already answered and scored, so unlike an
    // in-flight one it must not give its slot back (resume asks a fresh one).
    const wasHeld = continueRef.current !== null;
    clearReplay(); dropHold();
    if (countRef.current > 0 && !wasHeld) countRef.current--;
    setQuestionNumber(countRef.current);
    runningRef.current = false;
    answeredRef.current = true;
    setPaused(true);
    setFeedback('');
    setCurrentFret(null);
    setCurrentNote(null);
    setAskedFret(null);
    setCorrectCofNote(null);
    setWrongCofNote(null);
    setWrongInterval(null);
    setFoundFrets([]);
    setWrongFret(null);
    setRemainingFrets([]);
    intervalPromptRef.current = null;
    setIntervalPrompt(null);
    milestonePauseRef.current = false;
    stopPlayback();
    pauseAudioContext();
  }, []);

  // Resume the session with a brand-new question, not the discarded one.
  const resume = useCallback(() => {
    runningRef.current = true;
    pausedRef.current = false;
    setPaused(false);
    resumeAudioContext();
    if (byNote) nextByNote(); else next();
  }, [byNote, nextByNote, next]);

  return {
    // state
    running, paused, currentFret, currentNote, askedFret, remaining, feedback,
    correctCofNote, wrongCofNote, wrongInterval, answered, remainingFrets, foundFrets, wrongFret,
    questionTime, questionStart, questionSeq, questionNumber, intervalPrompt,
    // Whether the run that just stopped (running just went true → false)
    // reached its last question on its own, vs. a manual Stop — read at
    // that moment, before the next start() resets it.
    completedNaturally: completedNaturallyRef.current,
    // actions
    start, stop, pause, resume, selectFret, selectAnswer,
    selectInterval, replayIntervalQuestion,
    awaitingContinue, continueAfterMiss,
  };
}
