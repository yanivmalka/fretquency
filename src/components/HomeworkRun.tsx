// ── HomeworkRun — a student plays one homework drill ──────────────────────
//
// Runs the teacher's DrillConfig through the shared `useDrillSession` facade,
// exactly the way Fret of the Day does (DailyChallengeScreen.tsx): its own
// `useScoring` instance and an in-memory history sink, so a homework round
// can never interleave with a Practice round left running in the background
// and never writes Practice's history / mastery / stats / leaderboard. The
// one thing a finished run produces is a result row for the teacher
// (`onFinished` → classroom.submitAttempt).
//
// The board renders the instrument's base tuning — the teacher assigned
// strings by number on that tuning, so a student's 7-string variant setting
// must not shift what "string 6" means.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import NoteCircle from './NoteCircle';
import SpeedBar from './SpeedBar';
import { useDrillSession } from '../hooks/useDrillSession';
import { useDerivedNotes } from '../hooks/useDerivedNotes';
import { useScoring } from '../hooks/useScoring';
import { useDrillHistorySink } from '../game/useDrillHistorySink';
import { recordDailyActivity } from '../utils/dailyActivity';
import { unlockAudio, setAudioInstrument } from '../utils/audio';
import { setActiveInstrument, type AccidentalMode, type OrderMode, type NotationMode } from '../utils/music';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import type { DrillConfig } from '../drill/DrillConfig';
import { describeHomework, extractWrongPositions, type WrongPosition } from '../teacher/homework';

interface Props {
  title: string;
  instrumentId: InstrumentId;
  drill: DrillConfig;
  accidental: AccidentalMode;
  order: OrderMode;
  notation: NotationMode;
  /** Called once when every question has been answered. */
  onFinished: (r: { correct: number; total: number; seconds: number; wrongPositions: WrongPosition[] }) => Promise<void>;
  onDone: () => void;
}

type Phase = 'idle' | 'playing' | 'result';

export default function HomeworkRun({
  title, instrumentId, drill, accidental, order, notation, onFinished, onDone,
}: Props) {
  const { t } = useTranslation();
  const instrument = getInstrument(instrumentId);
  // Same render-time override as DailyChallengeScreen: App re-syncs its own
  // instrument on its next render once this screen closes.
  setActiveInstrument(instrument);
  setAudioInstrument(instrument);

  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<{ correct: number; total: number; seconds: number } | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed'>('saving');

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

  // Captured at the moment a run ends, so a "Try again" retry after a failed
  // save resends the same positions rather than whatever the next run leaves
  // in the (by-then-reset) history sink.
  const wrongPositionsRef = useRef<WrongPosition[]>([]);

  const save = (r: { correct: number; total: number; seconds: number }) => {
    setSaveState('saving');
    onFinished({ ...r, wrongPositions: wrongPositionsRef.current })
      .then(() => setSaveState('saved'), () => setSaveState('failed'));
  };

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
      wrongPositionsRef.current = extractWrongPositions(historySink.history);
      setResult(r);
      setPhase('result');
      save(r);
      // Homework otherwise writes only to an in-memory sink (see the module
      // comment) — without this, a student's home-screen streak and daily
      // goal would never move on a day they only did homework.
      recordDailyActivity(drill.questionCount);
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
    setResult(null);
    setPhase('playing');
    session.start(drill.questionCount, drill.timeLimit, false);
  };

  const click = (fn: () => void) => { playClickSound(); haptic.tap(); fn(); };

  return (
    <div className="class-run">
      <div className="class-run-head">
        <span className="class-run-emoji" aria-hidden="true">{instrument.emoji}</span>
        <div>
          <div className="class-run-title">{title}</div>
          <div className="class-muted">{describeHomework(drill, t)}</div>
        </div>
      </div>

      {phase === 'idle' && (
        <button className="class-btn-primary" onClick={() => click(start)}>{t('Start')}</button>
      )}

      {phase === 'playing' && (
        <div className="question-col class-question-col">
          <div className="string-label">{t(instrument.stringLabels[activeString] ?? '')}</div>
          <div className="fret-display">{session.currentFret !== null ? session.currentFret : '—'}</div>
          <SpeedBar
            key={`hw-sb-${session.questionSeq}`}
            remaining={session.remaining}
            total={session.questionTime}
            startAt={session.questionStart}
            answered={session.answered}
            paused={session.paused}
          />
          <div className="game-info-row">
            <span className="game-timer">{session.remaining}s</span>
            <span className="game-progress-text">{session.questionNumber}/{drill.questionCount}</span>
          </div>
          <div className={`feedback ${session.feedback.startsWith('✓') ? 'good' : session.feedback.startsWith('✗') ? 'bad' : 'warn'}`}>
            {session.feedback}
          </div>
          <NoteCircle
            notes={derived.cofList}
            activeNotes={derived.isMulti ? derived.questionActiveNotes : derived.activeNotes}
            active={!session.answered}
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
        </div>
      )}

      {phase === 'result' && result && (
        <div className="class-run-result">
          <div className="class-run-score">{result.correct}/{result.total} · {result.seconds}s</div>
          <p className="class-muted" role="status">
            {saveState === 'saving' && t('Sending your result to your teacher…')}
            {saveState === 'saved' && t('Your teacher can see this result.')}
            {saveState === 'failed' && t('Could not send your result. Check your connection.')}
          </p>
          <div className="class-row">
            {saveState === 'failed' && (
              <button className="clear-btn" onClick={() => click(() => save(result))}>{t('Try again')}</button>
            )}
            <button className="clear-btn" onClick={() => click(start)}>{t('Play again')}</button>
            <button className="class-btn-primary" onClick={() => click(onDone)}>{t('Done')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
