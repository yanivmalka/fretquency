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
import { sequencePicker } from '../learning/scaleCurriculum';
import { questionFingering } from '../learning/scaleFingering';
import {
  sequenceLadder, SEQUENCE_LABEL, SEQUENCE_HOW, SEQUENCE_PASS_RUNS, SEQUENCE_UNLOCK_RUNS, type SequencePattern,
} from '../learning/scaleSequence';
import { usePitchStream } from '../hooks/usePitchStream';
import ScaleOrderBoard from './ScaleOrderBoard';
import ScaleTermHint, { ScaleTermNote, ScaleTermStrip } from './ScaleTermHint';
import { termHighlight, type ScaleTermId } from '../learning/scaleTerms';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { playClickSound, haptic } from '../utils/feedback';
import { fourFingersQuestion, fourFingersFingering, FOUR_FINGERS_INDEX } from '../learning/scaleCurriculum';
import type { TempoMap } from '../learning/scaleTiming';
import { useScaleTempo } from '../hooks/useScaleTempo';
import { ScaleTimingStrip, ScaleRunSummary } from './ScaleTempo';
import ScaleRingTips from './ScaleRingTips';

/** The path runs every step at the `focused` envelope (one box, natural
 *  roots): `useScaleSelector`'s numbers for a single position. */
const PATH_QUESTION_COUNT = 6;
const PATH_NOTE_TIME = 3;
/** A sequence run is two to three times a plain run's length, so its session
 *  is shorter: up, down, up, down — still room for the 3 good runs in a row
 *  that pass a rung. */
const SEQUENCE_QUESTION_COUNT = 4;

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
  onAnswer: (
    itemId: string, form: 'orderScale' | 'connectBoxes' | 'orderRecall' | 'orderSequence', correct: boolean, seconds: number,
    extra?: { recallLevel?: 1 | 2; pattern?: SequencePattern },
  ) => void;
  /** Step 0 ("One string, four fingers"): the Selector's "Show fingers" pick,
   *  and its metronome with the per-scale tempo map. */
  fingers?: boolean;
  metronome?: boolean;
  tempoMap?: TempoMap;
  setTempo?: (itemIds: readonly string[], bpm: number) => void;
}

/** Steps whose title names a box — the ones that get the "Box" ⓘ. */
const BOX_STEP_KINDS: readonly string[] = ['box', 'connect', 'relativeBox', 'sequence'];

const NO_TEMPOS: TempoMap = {};
const noSetTempo = () => {};

const STATUS_ICON: Record<ScalePathStatus, string> = { done: '✓', current: '●', available: '○', locked: '🔒' };

export default function ScalePathCard({
  instrument, accidental, notation, lang, now, demo, guitar, direction, hidden,
  onRunningChange, onOpenExplain, onAnswer,
  fingers = true, metronome = false, tempoMap = NO_TEMPOS, setTempo = noSetTempo,
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
  // Step 0: one string per run, lowest first; the counter restarts on Start.
  const fourFingersRunRef = useRef(0);
  const pickFourFingers = useCallback<typeof pickScaleQuestion>(
    (_pool, notes, stringCount, maxFret) => fourFingersQuestion(fourFingersRunRef.current++, notes, stringCount, maxFret),
    [],
  );
  const fourFingersStep = runStep?.kind === 'fourFingers';
  // Step 0 runs the Selector's metronome, judged and stepped up as on "Tap
  // the scale in order" (its own tempo, item `scale:minorPentatonic:8`).
  // The sequences step uses it too, at box 1's own tempo.
  const warmupTempoOn = metronome && (fourFingersStep || runStep?.kind === 'sequence');
  const tempo = useScaleTempo({ enabled: warmupTempoOn, tempoMap, setTempo });
  const warmupTiming = warmupTempoOn
    ? { onQuestionStart: tempo.onQuestionStart, onStepHit: tempo.onStepHit, demoTiming: tempo.demoTiming }
    : {};
  // Sequences (wishlist 2026-10-03 item 6): until the box is played from
  // memory (Recall level 1) a few times in a row, the step runs that recall
  // first; then the ladder's next rung, up and down in turn. Both are read by
  // the engine as each scale is laid out, so the step climbs mid-session.
  const sequenceStep = runStep?.kind === 'sequence';
  const ladder = useMemo(() => {
    if (!runStep || runStep.kind !== 'sequence') return null;
    const inst = getInstrumentState(loadLearningState(now), instrument.id, now);
    return sequenceLadder(inst.scaleHistory, runStep.itemId);
  }, [runStep, instrument.id, now]);
  const [pickedPattern, setPickedPattern] = useState<SequencePattern | null>(null);
  const pickablePattern = pickedPattern != null && ladder?.rungs.some((r) => r.pattern === pickedPattern && (r.passed || ladder.current === r.pattern))
    ? pickedPattern : null;
  const sequencePattern: SequencePattern | null = !sequenceStep || !ladder?.unlocked ? null
    : pickablePattern ?? ladder.current ?? 'groups3';
  const sequenceRunRef = useRef(0);
  const pickSequence = useCallback<typeof pickScaleQuestion>(
    (...args) => sequencePicker(sequenceRunRef)(...args),
    [],
  );
  const pickQuestion = fourFingersStep ? pickFourFingers
    : sequenceStep ? pickSequence
    : runStep?.kind === 'relativeBox' ? pickRelativeBoxQuestion
    : runStep?.kind === 'connect' ? pickConnectFromPool
    : pickScaleQuestion;
  const orderInstrument = useMemo(
    () => ({ notes: instrument.notes, stringCount: instrument.stringCount, maxFret: instrument.maxFret, openMidi: instrument.openMidi }),
    [instrument.notes, instrument.stringCount, instrument.maxFret, instrument.openMidi],
  );

  const activeRef = useRef<string | null>(null);
  const engine = useScaleOrderEngine({
    ...warmupTiming,
    instrument: orderInstrument,
    pool,
    questionCount: sequenceStep ? SEQUENCE_QUESTION_COUNT : PATH_QUESTION_COUNT,
    noteTime: runStep?.kind === 'connect' ? PATH_NOTE_TIME * 1.5 : PATH_NOTE_TIME,
    demo,
    naturalsOnly: true,
    direction,
    pickQuestion,
    fadeLevel: sequenceStep && !ladder?.unlocked ? 1 : 0,
    sequence: sequencePattern,
    // A run that ends on its own (not via Stop): show how it went, and point
    // the card back at the path's next step.
    onComplete: () => {
      setSummary(activeRef.current);
      activeRef.current = null;
      setActiveId(null);
      setPickedId(null);
    },
    onAnswer: (a: ScaleOrderAnswer) => {
      const itemId = scaleItemId(a.scaleTypeId, a.positionIndex);
      if (a.pattern) { onAnswer(itemId, 'orderSequence', a.correct, a.seconds, { pattern: a.pattern }); return; }
      if (a.fadeLevel !== 0) { onAnswer(itemId, 'orderRecall', a.correct, a.seconds, { recallLevel: a.fadeLevel }); return; }
      onAnswer(itemId, a.positionIndex === 0 ? 'connectBoxes' : 'orderScale', a.correct, a.seconds);
    },
  });

  useEffect(() => { onRunningChange(engine.running); }, [engine.running, onRunningChange]);
  const { stop: stopClick } = tempo;
  useEffect(() => { if (!engine.running) stopClick(); }, [engine.running, stopClick]);

  const pitch = usePitchStream({
    enabled: guitar && engine.running && engine.demoStep == null,
    onNote: engine.hear,
    timing: warmupTempoOn,
  });

  const stepTitle = useCallback((s: ScalePathStep) => {
    const name = t(scaleTypeById(s.scaleTypeId)?.nameKey ?? s.scaleTypeId);
    if (s.kind === 'fourFingers') return t('One string, four fingers');
    if (s.kind === 'explain') return t('One shape, two names');
    if (s.kind === 'connect') return `${name} · ${t('Connect the boxes')}`;
    if (s.kind === 'sequence') return `${name} · ${t('Box')} ${s.positionIndex} · ${t('Sequences')}`;
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
    fourFingersRunRef.current = 0;
    sequenceRunRef.current = 0;
    tempo.prime();
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
      : `${t('Box')} ${q.positionIndex}${engine.boardPattern ? ` · ${t(SEQUENCE_LABEL[engine.boardPattern])}` : ''}`;
    // Step 0: no scale and no box, just the string, up and back.
    const warmupRun = q.positionIndex === FOUR_FINGERS_INDEX;
    const warmupTitle = warmupRun ? `${t('One string, four fingers')} · ${t('String')} ${q.rootString} ↑↓` : null;
    return (
      <div className="set-card scale-order-card scale-path-run">
        <div className="scale-order-header">
          <span className="scale-order-title">
            {warmupTitle ?? `${t(scaleTypeById(q.scaleTypeId)?.nameKey ?? q.scaleTypeId)} · ${displayNote(q.rootName, accidental, notation)} · ${posLabel} ${q.direction === 'down' ? '↓' : '↑'}`}
          </span>
          <span className="set-card-help">
            {t('Scale')} {engine.questionNumber} / {engine.questionCount}
            {' · '}{t('Score')}: {engine.session.score}
          </span>
          {warmupRun && (
            <span className="set-card-help scale-ring-reminder">
              {t('Fingertip just behind the fret. Let each note ring before the next.')}
            </span>
          )}
          {engine.boardPattern && (
            <span className="set-card-help scale-seq-how">{t(SEQUENCE_HOW[engine.boardPattern])}</span>
          )}
          {sequenceStep && !engine.boardPattern && ladder && (
            <span className="set-card-help scale-seq-how">
              {t('First, play the box from memory: only the root is lit.')}
              {' '}{t('Good runs in a row:')} {ladder.recallStreak} / {SEQUENCE_UNLOCK_RUNS}
            </span>
          )}
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
        {warmupTempoOn && (
          <ScaleTimingStrip
            bpm={tempo.bpm}
            beat={tempo.beat}
            judgements={tempo.judgements}
            lastNote={tempo.lastNote}
            lastRun={tempo.lastRun}
          />
        )}
        <ScaleOrderBoard
          fingers={warmupRun && fingers ? fourFingersFingering(q)
            : engine.boardPattern && fingers ? questionFingering(q, instrument.stringCount) : undefined}
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
          {/* The sequences step's ladder below shows its own progress. */}
          {!summaryPassed && summaryEntry?.step.kind !== 'sequence' ? ` · ${t('Not passed yet — one more clean session usually does it.')}` : ''}
        </p>
      )}
      {summaryEntry?.step.kind === 'fourFingers' && metronome && tempo.lastRun && <ScaleRunSummary run={tempo.lastRun} />}

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
          {selected.step.kind === 'sequence' && ladder && (
            <ol className="scale-seq-ladder">
              <li className={`scale-seq-rung${ladder.unlocked ? ' scale-seq-rung-passed' : ' scale-seq-rung-current'}`}>
                <span className="scale-seq-rung-icon" aria-hidden="true">{ladder.unlocked ? '✓' : '●'}</span>
                <span>{t('Play the box from memory')}</span>
                {!ladder.unlocked && <span className="scale-seq-rung-count"><span dir="ltr">{ladder.recallStreak} / {SEQUENCE_UNLOCK_RUNS}</span></span>}
              </li>
              {ladder.rungs.map((r) => {
                const open = r.passed || ladder.current === r.pattern;
                const chosen = sequencePattern === r.pattern;
                return (
                  <li key={r.pattern} className={`scale-seq-rung${r.passed ? ' scale-seq-rung-passed' : open ? ' scale-seq-rung-current' : ' scale-seq-rung-locked'}`}>
                    <button
                      type="button"
                      className={`scale-seq-rung-btn${chosen ? ' scale-seq-rung-chosen' : ''}`}
                      disabled={!open}
                      aria-pressed={chosen}
                      title={open ? undefined : t('Finish the rung before it to unlock this one.')}
                      onClick={() => { playClickSound(); haptic.tap(); setPickedPattern(r.pattern); }}
                    >
                      <span className="scale-seq-rung-icon" aria-hidden="true">{r.passed ? '✓' : open ? '●' : '🔒'}</span>
                      <span>{t(SEQUENCE_LABEL[r.pattern])}</span>
                      {!r.passed && open && <span className="scale-seq-rung-count"><span dir="ltr">{r.streak} / {SEQUENCE_PASS_RUNS}</span></span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          {selected.step.kind === 'fourFingers' && (
            <>
              <span className="set-card-label scale-ring-title">{t('Make it ring')}</span>
              <ScaleRingTips stringCount={instrument.stringCount} />
            </>
          )}
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
