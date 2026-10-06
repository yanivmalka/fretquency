// ── HomeworkRun — a student plays one Notes or Intervals homework drill ───
//
// Runs the teacher's DrillConfig through the shared `useDrillSession` facade,
// exactly the way Fret of the Day does (DailyChallengeScreen.tsx): its own
// `useScoring` instance and an in-memory history sink, so a homework round
// can never interleave with a Practice round left running in the background
// and never writes Practice's history / mastery / stats / leaderboard. The
// one thing a finished run produces is a result row for the teacher
// (`onFinished` → classroom.submitAttempt, via `useHomeworkResult`).
//
// An interval homework (`drill.interval` set) runs through the very same
// engine: the question area swaps to `IntervalPrompt` and the answer surface to
// the chip row (or, for "find it on the neck", the fret grid with the
// reference note marked) — the pieces Practice's `DrillBoard` uses.
//
// The board renders the instrument's base tuning — the teacher assigned
// strings by number on that tuning, so a student's 7-string variant setting
// must not shift what "string 6" means.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import NoteCircle from './NoteCircle';
import FretGrid from './FretGrid';
import SpeedBar from './SpeedBar';
import IntervalPrompt from './IntervalPrompt';
import IntervalChoiceRow from './IntervalChoiceRow';
import HomeworkResultPanel from './HomeworkResultPanel';
import HomeworkSoundNotice from './HomeworkSoundNotice';
import { useDrillSession } from '../hooks/useDrillSession';
import { useDerivedNotes } from '../hooks/useDerivedNotes';
import { useScoring } from '../hooks/useScoring';
import { useHomeworkResult, type HomeworkFinishPayload } from '../hooks/useHomeworkResult';
import { useDrillHistorySink } from '../game/useDrillHistorySink';
import { unlockAudio, setAudioInstrument } from '../utils/audio';
import { displayNote, setActiveInstrument, type AccidentalMode, type OrderMode, type NotationMode } from '../utils/music';
import { intervalBySemitones } from '../utils/intervals';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import type { DrillConfig } from '../drill/DrillConfig';
import { extractWrongPositions } from '../teacher/homework';

interface Props {
  title: string;
  instrumentId: InstrumentId;
  drill: DrillConfig;
  /** One-line description of the drill (the caller knows its kind). */
  summary: string;
  accidental: AccidentalMode;
  order: OrderMode;
  notation: NotationMode;
  /** Called once when every question has been answered. */
  onFinished: (r: HomeworkFinishPayload) => Promise<void>;
  onDone: () => void;
}

type Phase = 'idle' | 'playing' | 'result';

export default function HomeworkRun({
  title, instrumentId, drill, summary, accidental, order, notation, onFinished, onDone,
}: Props) {
  const { t, lang } = useTranslation();
  const instrument = getInstrument(instrumentId);
  // Same render-time override as DailyChallengeScreen: App re-syncs its own
  // instrument on its next render once this screen closes.
  setActiveInstrument(instrument);
  setAudioInstrument(instrument);

  const [phase, setPhase] = useState<Phase>('idle');
  const { result, saveState, finish, retrySave, clear } = useHomeworkResult(instrumentId, onFinished);

  const scoring = useScoring();
  const historySink = useDrillHistorySink();
  const [activeString, setActiveString] = useState(drill.primaryString);

  const session = useDrillSession(drill, {
    setActiveString,
    history: historySink,
    scoring: { ...scoring, showScore: true },
    display: { t, notation },
  });

  const derived = useDerivedNotes(
    activeString, drill.fretFrom, drill.fretTo, drill.wholeToneOnly, false, accidental, order,
    false, drill.isMulti ? drill.strings : [], instrumentId,
  );

  // End-of-run detection, as in DailyChallengeScreen: watch `running` fall
  // so the last answer has settled into `session.result`. A manual stop
  // (Back mid-run) never posts a result.
  const wasRunningRef = useRef(false);
  const finishedRef = useRef(false);
  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = session.running;
    if (wasRunning && !session.running && !session.paused && !finishedRef.current
      && session.result.questionsAnswered >= drill.questionCount) {
      finishedRef.current = true;
      const seconds = historySink.history.reduce((sum, e) => sum + (e.seconds || 0), 0);
      const r = { correct: session.result.questionsCorrect, total: drill.questionCount, seconds: Math.round(seconds) };
      setPhase('result');
      // The weak-spot list is per fret position; an interval question's
      // position is just where its reference note happened to sit, so those
      // runs report none.
      finish(r, drill.interval ? [] : extractWrongPositions(historySink.history));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.running, session.paused, session.result]);

  // Leaving mid-run stops the engine's timers.
  useEffect(() => () => { if (session.running || session.paused) session.stop(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

  const start = () => {
    unlockAudio();
    finishedRef.current = false;
    scoring.reset();
    scoring.beginRun(drill.timeLimit, drill.questionCount);
    clear();
    setPhase('playing');
    session.start(drill.questionCount, drill.timeLimit, false);
  };

  const click = (fn: () => void) => { playClickSound(); haptic.tap(); fn(); };

  const prompt = session.intervalPrompt;
  const answered = session.answered;

  return (
    <div className="class-run">
      <div className="class-run-head">
        <span className="class-run-emoji" aria-hidden="true">{instrument.emoji}</span>
        <div>
          <div className="class-run-title">{title}</div>
          <div className="class-muted">{summary}</div>
        </div>
      </div>

      {phase === 'idle' && (
        <>
          <HomeworkSoundNotice needsSound={drill.interval?.exercise === 'identifyInterval'} />
          <button className="class-btn-primary" onClick={() => click(start)}>{t('Start')}</button>
        </>
      )}

      {phase === 'playing' && (
        <div className="question-col class-question-col">
          <div className="string-label">{t(instrument.stringLabels[activeString] ?? '')}</div>
          {prompt
            ? <div className="note-display">
                <IntervalPrompt prompt={prompt} accidental={accidental} notation={notation} onReplay={session.replayIntervalQuestion} />
              </div>
            : drill.mode === 'byNote'
              ? <div className="note-display">{session.currentNote ? displayNote(session.currentNote, accidental, notation) : '—'}</div>
              : <div className="fret-display">{session.currentFret !== null ? session.currentFret : '—'}</div>}
          <SpeedBar
            key={`hw-sb-${session.questionSeq}`}
            remaining={session.remaining}
            total={session.questionTime}
            startAt={session.questionStart}
            answered={answered}
            paused={session.paused}
          />
          <div className="game-info-row">
            <span className="game-timer">{session.remaining}s</span>
            <span className="game-progress-text">{session.questionNumber}/{drill.questionCount}</span>
          </div>
          <div className={`feedback ${session.feedback.startsWith('✓') ? 'good' : session.feedback.startsWith('✗') ? 'bad' : 'warn'}`}>
            {session.feedback}
          </div>
          {prompt && prompt.exercise === 'findTargetPosition' ? (
            <FretGrid
              fretFrom={drill.fretFrom}
              fretTo={drill.fretTo}
              guitarString={activeString}
              validFrets={new Set(Array.from({ length: drill.fretTo - drill.fretFrom + 1 }, (_, i) => drill.fretFrom + i))}
              active={!answered}
              correctFrets={session.remainingFrets}
              wrongFret={session.wrongFret}
              foundFrets={session.foundFrets}
              onSelect={session.selectFret}
              showMastery={false}
              referenceFret={prompt.refFret}
            />
          ) : prompt ? (
            <IntervalChoiceRow
              variant={prompt.exercise === 'identifyInterval' ? 'interval' : 'note'}
              options={prompt.exercise === 'identifyInterval'
                ? prompt.optionSemitones.map((s) => ({ value: String(s), label: intervalBySemitones(s)?.short ?? `+${s}` }))
                : prompt.options.map((n) => ({ value: n, label: displayNote(n, accidental, notation) }))}
              correct={answered ? (prompt.exercise === 'identifyInterval' ? String(prompt.semitones) : prompt.targetNote) : null}
              wrong={answered
                ? (prompt.exercise === 'identifyInterval'
                  ? (session.wrongInterval != null ? String(session.wrongInterval) : null)
                  : session.wrongCofNote)
                : null}
              disabled={answered}
              dir={lang === 'he' ? 'rtl' : undefined}
              onSelect={(value) => (prompt.exercise === 'identifyInterval'
                ? session.selectInterval(Number(value))
                : session.selectAnswer(value))}
            />
          ) : drill.mode === 'byNote' ? (
            <FretGrid
              fretFrom={drill.fretFrom}
              fretTo={drill.fretTo}
              guitarString={activeString}
              validFrets={new Set(Object.values(derived.noteFrets).flat())}
              active={!answered}
              correctFrets={session.remainingFrets}
              wrongFret={session.wrongFret}
              foundFrets={session.foundFrets}
              onSelect={session.selectFret}
              showMastery={false}
              referenceFret={null}
            />
          ) : (
            <NoteCircle
              notes={derived.cofList}
              activeNotes={derived.isMulti ? derived.questionActiveNotes : derived.activeNotes}
              active={!answered}
              correctNote={session.correctCofNote}
              wrongNote={session.wrongCofNote}
              onSelect={session.selectAnswer}
              guitarString={activeString}
              fretDots={derived.fretDots}
              noteFrets={derived.noteFrets}
              byString={false}
              startIndex={derived.startIndex}
              showDots
              accidental={accidental}
              notation={notation}
            />
          )}
        </div>
      )}

      {phase === 'result' && result && (
        <HomeworkResultPanel
          result={result}
          saveState={saveState}
          onRetrySave={() => retrySave(result)}
          onPlayAgain={start}
          onDone={onDone}
        />
      )}
    </div>
  );
}
