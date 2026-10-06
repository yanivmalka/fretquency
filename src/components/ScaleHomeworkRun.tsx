// ── ScaleHomeworkRun — a student plays one scale homework ─────────────────
//
// "Identify the scale" (hear a scale, pick its name) or "name the degree",
// over the scales the teacher chose. Runs the same `useScaleChipEngine` the
// Scales screen does, but writes nothing to the learning state: a homework
// run produces one result row for the teacher (`useHomeworkResult`) and that
// is all. Not Premium-gated — the teacher assigned it.

import { useRef, useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import IntervalChoiceRow from './IntervalChoiceRow';
import HomeworkResultPanel from './HomeworkResultPanel';
import HomeworkSoundNotice from './HomeworkSoundNotice';
import { useScaleChipEngine, type ScaleChipAnswer } from '../hooks/useScaleChipEngine';
import { useHomeworkResult, type HomeworkFinishPayload } from '../hooks/useHomeworkResult';
import { buildScalePool } from '../learning/scaleDrill';
import { scaleTypeById } from '../utils/scales';
import { unlockAudio, setAudioInstrument } from '../utils/audio';
import { displayNote, setActiveInstrument, type AccidentalMode, type NotationMode } from '../utils/music';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import { homeworkNeedsSound, type ScaleHomework } from '../teacher/homeworkKinds';

interface Props {
  title: string;
  instrumentId: InstrumentId;
  spec: ScaleHomework;
  summary: string;
  accidental: AccidentalMode;
  notation: NotationMode;
  onFinished: (r: HomeworkFinishPayload) => Promise<void>;
  onDone: () => void;
}

/** Seconds per question: hearing a scale takes longer than naming a degree. */
const TIME_LIMIT = { identifyScale: 15, nameDegree: 12 } as const;

export default function ScaleHomeworkRun({
  title, instrumentId, spec, summary, accidental, notation, onFinished, onDone,
}: Props) {
  const { t, lang } = useTranslation();
  const instrument = getInstrument(instrumentId);
  setActiveInstrument(instrument);
  setAudioInstrument(instrument);

  const [phase, setPhase] = useState<'idle' | 'playing' | 'result'>('idle');
  const { result, saveState, finish, retrySave, clear } = useHomeworkResult(instrumentId, onFinished);

  const pool = useMemo(
    () => buildScalePool(spec.scaleTypeIds, instrument.stringCount),
    [spec.scaleTypeIds, instrument.stringCount],
  );
  const chipInstrument = useMemo(
    () => ({ notes: instrument.notes, stringCount: instrument.stringCount, maxFret: instrument.maxFret }),
    [instrument.notes, instrument.stringCount, instrument.maxFret],
  );

  // Tallied from the engine's per-question callback; the engine reports no
  // totals of its own.
  const correctRef = useRef(0);
  const secondsRef = useRef(0);
  const [completed, setCompleted] = useState(false);

  const engine = useScaleChipEngine({
    exercise: spec.exercise,
    instrument: chipInstrument,
    pool,
    questionCount: spec.questionCount,
    timeLimit: TIME_LIMIT[spec.exercise],
    optionCount: 4,
    direction: spec.direction,
    onComplete: () => setCompleted(true),
    onAnswer: (a: ScaleChipAnswer) => {
      if (a.correct) correctRef.current += 1;
      secondsRef.current += a.seconds;
    },
  });

  // `onComplete` fires from a timer; finishing from an effect keeps the
  // state updates (and the cloud call) out of the engine's callback.
  useEffect(() => {
    if (!completed) return;
    setCompleted(false);
    setPhase('result');
    // Scale questions have no single fret position to blame, so no weak spots.
    finish({ correct: correctRef.current, total: spec.questionCount, seconds: Math.round(secondsRef.current) }, []);
  }, [completed, finish, spec.questionCount]);

  // Leaving mid-run stops the engine's timers.
  const { stop } = engine;
  useEffect(() => () => stop(), [stop]);

  const start = () => {
    unlockAudio();
    correctRef.current = 0;
    secondsRef.current = 0;
    clear();
    setPhase('playing');
    engine.start();
  };
  const click = (fn: () => void) => { playClickSound(); haptic.tap(); fn(); };

  const q = engine.question;
  const answered = engine.selected != null;

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
          <HomeworkSoundNotice needsSound={homeworkNeedsSound(spec)} />
          <button className="class-btn-primary" onClick={() => click(start)}>{t('Start')}</button>
        </>
      )}

      {phase === 'playing' && engine.running && q && (
        <div className="question-col class-question-col">
          <p className="set-card-help">{t('Question')} {engine.questionNumber} / {engine.questionCount}</p>
          {spec.exercise === 'identifyScale' ? (
            <>
              <button type="button" className="scale-replay-btn" onClick={() => click(engine.replay)}>
                {t('🔊 hear it again')}
              </button>
              <IntervalChoiceRow
                variant="scale"
                options={q.options.map((id) => ({ value: id, label: t(scaleTypeById(id)?.nameKey ?? id) }))}
                onSelect={engine.selectOption}
                correct={answered ? engine.answerValue : null}
                wrong={answered && engine.selected !== engine.answerValue ? engine.selected : null}
                disabled={answered}
                dir={lang === 'he' ? 'rtl' : undefined}
              />
            </>
          ) : 'degreeLabel' in q && (
            <>
              <p className="set-card-help">
                {t('Degree')} {q.degreeLabel}
                {' · '}{t('Root')} {displayNote(q.rootName, accidental, notation)}
                {' · '}{t(scaleTypeById(q.scaleTypeId)?.nameKey ?? q.scaleTypeId)}
              </p>
              <IntervalChoiceRow
                variant="note"
                options={q.options.map((n) => ({ value: n, label: displayNote(n, accidental, notation) }))}
                onSelect={engine.selectOption}
                correct={answered ? engine.answerValue : null}
                wrong={answered && engine.selected !== engine.answerValue ? engine.selected : null}
                disabled={answered}
                dir={lang === 'he' ? 'rtl' : undefined}
              />
            </>
          )}
          <div className={`feedback ${engine.feedback.startsWith('✓') ? 'good' : engine.feedback.startsWith('✗') ? 'bad' : 'warn'}`}>
            {engine.feedback}
          </div>
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
