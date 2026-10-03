// ── ScalePathCard — the guided beginner path at the top of Scales' Practice ─
//
// Shows the path from `scaleCurriculum.ts`: the next step, why it comes now,
// and a Start button, plus a collapsible list of every step (passed ✓, up
// next, locked 🔒). Progress is derived from the scale SRS + history on every
// render — nothing of its own is stored. A passed step can be picked again
// for more practice; a locked one cannot be started from here (the free
// "More options" picker below still reaches everything).
//
// Every practice step is a "Tap the scale in order" run, so the card runs it
// itself on one `useScaleOrderEngine` and draws `ScaleOrderBoard`; the host
// only hides its other cards while `onRunningChange(true)`.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { scaleTypeById } from '../utils/scales';
import { pickScaleQuestion, type ScaleDirection, type ScalePoolItem } from '../learning/scaleDrill';
import {
  scalePathProgress, pickRelativeBoxQuestion, pickConnectFromPool, RELATIVE_BOX_INDEX,
  type ScalePathStep, type ScalePathStatus,
} from '../learning/scaleCurriculum';
import { loadLearningState, getInstrumentState } from '../learning/learningState';
import { scaleItemId } from '../learning/scaleItem';
import { useScaleOrderEngine, type ScaleOrderAnswer } from '../hooks/useScaleOrderEngine';
import { usePitchStream } from '../hooks/usePitchStream';
import ScaleOrderBoard from './ScaleOrderBoard';
import ScaleTermHint, { ScaleTermNote, ScaleTermStrip } from './ScaleTermHint';
import { termHighlight, type ScaleTermId } from '../learning/scaleTerms';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { playClickSound, haptic } from '../utils/feedback';

/** The path runs every step at the `focused` envelope (one box, natural
 *  roots): `useScaleSelector`'s numbers for a single position. */
const PATH_QUESTION_COUNT = 6;
const PATH_NOTE_TIME = 3;

interface Props {
  instrument: InstrumentConfig;
  accidental: AccidentalMode;
  notation: NotationMode;
  lang: string;
  /** Bumped by the host on every recorded answer / sync, so progress re-reads. */
  now: number;
  /** The Selector's "Watch, then play", answer-by-guitar and direction picks. */
  demo: boolean;
  guitar: boolean;
  direction: ScaleDirection;
  /** Another exercise is running — draw nothing. */
  hidden: boolean;
  onRunningChange: (running: boolean) => void;
  onOpenExplain: () => void;
  onAnswer: (itemId: string, form: 'orderScale' | 'connectBoxes', correct: boolean, seconds: number) => void;
}

/** Steps whose title names a box — the ones that get the "Box" ⓘ. */
const BOX_STEP_KINDS: readonly string[] = ['box', 'connect', 'relativeBox', 'sequence'];

const STATUS_ICON: Record<ScalePathStatus, string> = { done: '✓', current: '●', available: '○', locked: '🔒' };

export default function ScalePathCard({
  instrument, accidental, notation, lang, now, demo, guitar, direction, hidden,
  onRunningChange, onOpenExplain, onAnswer,
}: Props) {
  const { t } = useTranslation();

  const progress = useMemo(() => {
    const inst = getInstrumentState(loadLearningState(now), instrument.id, now);
    return scalePathProgress(inst.scaleSrs, inst.scaleHistory, now, instrument.stringCount);
  }, [instrument.id, instrument.stringCount, now]);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  /** The step of the run that just finished, for the summary line. */
  const [summary, setSummary] = useState<string | null>(null);
  /** The open ⓘ word; during a run it is lit on the board. */
  const [term, setTerm] = useState<ScaleTermId | null>(null);

  const current = progress.currentIndex >= 0 ? progress.entries[progress.currentIndex] : null;
  // The explanation gates nothing: when it is up next, its practice step is
  // the one Start runs, and the card offers the explanation beside it.
  const practiceAfter = (i: number) => progress.entries.slice(i).find((e) => e.step.kind !== 'explain') ?? null;
  const defaultEntry = current
    ? (current.step.kind === 'explain' ? practiceAfter(progress.currentIndex) : current)
    : null;
  const picked = progress.entries.find((e) => e.step.id === pickedId && e.status !== 'locked' && e.step.kind !== 'explain');
  const selected = picked ?? defaultEntry;
  const runStep: ScalePathStep | null =
    (activeId ? progress.entries.find((e) => e.step.id === activeId)?.step : null) ?? selected?.step ?? null;
  const explainEntry = progress.entries.find((e) => e.step.kind === 'explain');
  const offerExplain = explainEntry != null && explainEntry.status !== 'locked'
    && selected?.step.itemId === explainEntry.step.itemId;

  const pool = useMemo<ScalePoolItem[]>(
    () => (runStep ? [{ scaleTypeId: runStep.scaleTypeId, positionIndex: runStep.positionIndex }] : []),
    [runStep],
  );
  const pickQuestion = runStep?.kind === 'relativeBox' ? pickRelativeBoxQuestion
    : runStep?.kind === 'connect' ? pickConnectFromPool
    : pickScaleQuestion;
  const orderInstrument = useMemo(
    () => ({ notes: instrument.notes, stringCount: instrument.stringCount, maxFret: instrument.maxFret, openMidi: instrument.openMidi }),
    [instrument.notes, instrument.stringCount, instrument.maxFret, instrument.openMidi],
  );

  const activeRef = useRef<string | null>(null);
  const engine = useScaleOrderEngine({
    instrument: orderInstrument,
    pool,
    questionCount: PATH_QUESTION_COUNT,
    noteTime: runStep?.kind === 'connect' ? PATH_NOTE_TIME * 1.5 : PATH_NOTE_TIME,
    demo,
    naturalsOnly: true,
    direction,
    pickQuestion,
    // A run that ends on its own (not via Stop): show how it went, and point
    // the card back at the path's next step.
    onComplete: () => {
      setSummary(activeRef.current);
      activeRef.current = null;
      setActiveId(null);
      setPickedId(null);
    },
    onAnswer: (a: ScaleOrderAnswer) =>
      onAnswer(scaleItemId(a.scaleTypeId, a.positionIndex), a.positionIndex === 0 ? 'connectBoxes' : 'orderScale', a.correct, a.seconds),
  });

  useEffect(() => { onRunningChange(engine.running); }, [engine.running, onRunningChange]);

  const pitch = usePitchStream({
    enabled: guitar && engine.running && engine.demoStep == null,
    onNote: engine.hear,
  });

  const stepTitle = useCallback((s: ScalePathStep) => {
    const name = t(scaleTypeById(s.scaleTypeId)?.nameKey ?? s.scaleTypeId);
    if (s.kind === 'explain') return t('One shape, two names');
    if (s.kind === 'connect') return `${name} · ${t('Connect the boxes')}`;
    if (s.kind === 'relativeBox') return `${name} · ${t('Same box, new home note')}`;
    return `${name} · ${t('Box')} ${s.positionIndex}`;
  }, [t]);

  if (hidden || progress.entries.length === 0) return null;

  const start = () => {
    if (!selected) return;
    playClickSound(); haptic.tap();
    setSummary(null);
    setActiveId(selected.step.id);
    activeRef.current = selected.step.id;
    engine.start();
  };
  const stop = () => {
    playClickSound(); haptic.tap();
    activeRef.current = null;
    setActiveId(null);
    engine.stop();
  };

  if (engine.running && engine.question && engine.board) {
    const q = engine.question;
    const posLabel = q.positionIndex === 0 ? t('Boxes 1–2')
      : q.positionIndex === RELATIVE_BOX_INDEX ? t('Same box, new home note')
      : `${t('Box')} ${q.positionIndex}`;
    return (
      <div className="set-card scale-order-card scale-path-run">
        <div className="scale-order-header">
          <span className="scale-order-title">
            {`${t(scaleTypeById(q.scaleTypeId)?.nameKey ?? q.scaleTypeId)} · ${displayNote(q.rootName, accidental, notation)} · ${posLabel} ${q.direction === 'down' ? '↓' : '↑'}`}
          </span>
          <span className="set-card-help">
            {t('Scale')} {engine.questionNumber} / {engine.questionCount}
            {' · '}{t('Score')}: {engine.session.score}
          </span>
          {demo && (
            <span className="scale-order-status" aria-live="polite">
              {engine.demoStep != null ? t('Watch and listen…') : t('Your turn — play it back')}
            </span>
          )}
          {guitar && pitch.supported && engine.demoStep == null && (
            <span className={`voice-status guitar-status guitar-${pitch.status}`} role="status" aria-live="polite">
              {pitch.error === 'no-permission'
                ? t('🎸 Microphone blocked — enable it or switch to tap')
                : pitch.error === 'not-supported'
                  ? t('🎸 Pitch detection isn’t available on this device — use tap')
                  : pitch.status === 'listening'
                    ? `🎸 ${t('Listening…')}${pitch.partial ? ` “${pitch.partial}”` : ''}`
                    : t('🎸 Play the scale on your guitar')}
              {pitch.status === 'error' && (
                <button type="button" className="clear-btn voice-retry" onClick={() => { playClickSound(); haptic.tap(); pitch.retry(); }}>
                  {t('Retry')}
                </button>
              )}
            </span>
          )}
        </div>
        <ScaleTermStrip terms={['root', 'box', 'string', 'fret']} active={term} onToggle={setTerm} />
        <ScaleOrderBoard
          board={engine.board}
          step={engine.step}
          slips={engine.slips}
          wrongTile={engine.wrongTile}
          demoStep={engine.demoStep}
          rootName={q.rootName}
          noteTable={instrument.notes}
          stringCount={instrument.stringCount}
          accidental={accidental}
          notation={notation}
          onTap={engine.tap}
          hint={termHighlight(term)}
        />
        <button type="button" className="set-card-btn" onClick={stop}>
          {t('Stop')}
        </button>
      </div>
    );
  }

  const summaryEntry = summary ? progress.entries.find((e) => e.step.id === summary) : null;
  const summaryPassed = summaryEntry?.status === 'done';
  const nextUp = defaultEntry && defaultEntry.step.id !== summary ? defaultEntry : null;

  return (
    <div className="set-card scale-path-card" dir={lang === 'he' ? 'rtl' : undefined}>
      <div className="scale-path-head">
        <span className="set-card-label">🧭 {t('Your path')}</span>
        <span className="scale-path-count">{progress.passed} / {progress.total}</span>
      </div>
      <div className="scale-path-dots" aria-hidden="true">
        {progress.entries.filter((e) => e.step.gating).map((e) => (
          <span key={e.step.id} className={`scale-path-dot scale-path-dot-${e.status}`} />
        ))}
      </div>

      {summary && (
        <p className="set-card-help scale-path-summary" role="status">
          {t('Session complete!')} {t('Score')}: {engine.session.score}
          {summaryPassed && nextUp ? ` · ${t('Step passed! Next up:')} ${stepTitle(nextUp.step)}` : ''}
          {summaryPassed && !nextUp && progress.currentIndex < 0 ? ` · ${t('Step passed!')}` : ''}
          {!summaryPassed ? ` · ${t('Not passed yet — one more clean session usually does it.')}` : ''}
        </p>
      )}

      {selected ? (
        <>
          <span className="scale-path-next">
            {stepTitle(selected.step)}
            {BOX_STEP_KINDS.includes(selected.step.kind) && (
              <>{' '}<ScaleTermHint term="box" active={term} onToggle={setTerm} /></>
            )}
          </span>
          {term === 'box' && BOX_STEP_KINDS.includes(selected.step.kind) && <ScaleTermNote term={term} />}
          <p className="set-card-help">{t(selected.step.whyKey)}</p>
          {offerExplain && explainEntry && (
            <>
              <p className="set-card-help">{t(explainEntry.step.whyKey)}</p>
              <button
                type="button"
                className={`set-card-btn${explainEntry.status === 'current' ? ' scale-path-explain-new' : ''}`}
                onClick={() => { playClickSound(); haptic.tap(); onOpenExplain(); }}
              >
                🔁 {t('One shape, two names')}
              </button>
            </>
          )}
          <button type="button" className="set-card-btn set-card-btn-primary" onClick={start}>
            {selected.status === 'done' ? t('Practice again') : t('Start this step')}
          </button>
        </>
      ) : (
        <p className="set-card-help">
          {t('Path complete! Practise any step again, or open More options for every scale.')}
        </p>
      )}

      <button
        type="button"
        className="clear-btn scale-more-options-toggle"
        aria-expanded={listOpen}
        onClick={() => { playClickSound(); haptic.tap(); setListOpen((o) => !o); }}
      >
        {listOpen ? `▴ ${t('Hide steps')}` : `▾ ${t('All steps')}`}
      </button>

      {listOpen && (
        <ol className="scale-path-list">
          {progress.entries.map((e) => {
            const isSelected = selected?.step.id === e.step.id;
            const locked = e.status === 'locked';
            return (
              <li key={e.step.id}>
                <button
                  type="button"
                  className={`scale-path-step scale-path-step-${e.status}${isSelected ? ' scale-path-step-selected' : ''}`}
                  disabled={locked}
                  aria-pressed={isSelected}
                  title={locked ? t('Finish the steps before it to unlock this one.') : undefined}
                  onClick={() => {
                    playClickSound(); haptic.tap();
                    if (e.step.kind === 'explain') onOpenExplain();
                    else { setPickedId(e.step.id); setSummary(null); }
                  }}
                >
                  <span className="scale-path-step-icon" aria-hidden="true">{STATUS_ICON[e.status]}</span>
                  <span>{stepTitle(e.step)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
