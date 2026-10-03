// ── ScaleEchoCard — "I play, you play it back" (call and response by ear) ─
//
// The teacher's day-two method (`scaleEcho.ts`): the app plays a short phrase
// from the box, by ear only (nothing lights while it plays), and the learner
// plays it back on the guitar or taps it. Two clean phrases in a row make the
// next one a note longer; a missed one makes it a note shorter.
//
// Runs on its own `useScaleOrderEngine` — the box as the board, the phrase as
// the run (`layoutBoard`), the demo unlit (`demoLit: false`) — and records
// each phrase as an `echo` answer for the box's own item. The host only hides
// its other cards while `onRunningChange(true)`, like `ScalePathCard`.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { scaleTypeById } from '../utils/scales';
import { pickScaleQuestion, type ScalePoolItem, type ScaleQuestion } from '../learning/scaleDrill';
import type { ScaleOrderBoard as Board } from '../learning/scaleOrder';
import {
  echoBoard, echoStartLength, nextEchoLength, pickEchoItem, type EchoGrowth,
} from '../learning/scaleEcho';
import { scaleItemId } from '../learning/scaleItem';
import type { SrsMap } from '../learning/srs';
import {
  loadLearningState, saveLearningStateLocal, getInstrumentState, withInstrumentState, recordScaleAnswer,
} from '../learning/learningState';
import { cloudPushLearning } from '../learning/learningSync';
import { questionFingering } from '../learning/scaleFingering';
import { useScaleOrderEngine, type ScaleOrderAnswer, type ScaleStepHit } from '../hooks/useScaleOrderEngine';
import { usePitchStream } from '../hooks/usePitchStream';
import ScaleOrderBoard from './ScaleOrderBoard';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { playClickSound, haptic } from '../utils/feedback';
import { playNoteSingle } from '../utils/audio';

const ECHO_QUESTION_COUNT = 8;
const ECHO_NOTE_TIME = 3;
/** The phrase is played a little slower than "Watch, then play"'s demo — it
 *  has to be remembered by ear. */
const ECHO_LEAD_MS = 600;
const ECHO_NOTE_MS = 650;

type EchoResult = 'grew' | 'clean' | 'slip' | 'shrank';

const RESULT_TEXT: Record<EchoResult, string> = {
  grew: '✓ Clean — the next phrase is one note longer.',
  clean: '✓ Clean!',
  slip: 'Found it, with a slip.',
  shrank: 'Missed — the next phrase is one note shorter.',
};

interface Props {
  instrument: InstrumentConfig;
  accidental: AccidentalMode;
  notation: NotationMode;
  lang: string;
  pool: ScalePoolItem[];
  naturalsOnly: boolean;
  /** The Selector's answer-by-guitar pick, "Show fingers" and the board pick. */
  guitar: boolean;
  fingers: boolean;
  dim: boolean;
  onDim: (dim: boolean) => void;
  /** Another exercise is running — draw nothing. */
  hidden: boolean;
  onRunningChange: (running: boolean) => void;
  /** An answer was saved (epoch ms), so the host re-reads progress. */
  onRecorded: (ts: number) => void;
}

export default function ScaleEchoCard({
  instrument, accidental, notation, lang, pool, naturalsOnly, guitar, fingers, dim, onDim, hidden,
  onRunningChange, onRecorded,
}: Props) {
  const { t } = useTranslation();

  // Read when a session starts: the SRS weights which box is asked and how
  // long its first phrase is. Growth is per box, for this session.
  const srsRef = useRef<SrsMap>({});
  const growthRef = useRef(new Map<string, EchoGrowth>());
  const dimRef = useRef(dim);
  useEffect(() => { dimRef.current = dim; }, [dim]);
  const slippedRef = useRef(0);
  const [result, setResult] = useState<EchoResult | null>(null);
  const [longest, setLongest] = useState(0);
  const [finished, setFinished] = useState(false);

  const growthFor = useCallback((itemId: string): EchoGrowth => {
    let g = growthRef.current.get(itemId);
    if (!g) {
      g = { length: echoStartLength(srsRef.current, itemId), streak: 0 };
      growthRef.current.set(itemId, g);
    }
    return g;
  }, []);

  const pickQuestion: typeof pickScaleQuestion = useCallback(
    (p, noteTable, stringCount, maxFret, rng, natural) => {
      const item = pickEchoItem(p, srsRef.current, Date.now(), rng);
      return item ? pickScaleQuestion([item], noteTable, stringCount, maxFret, rng, natural, 'up') : null;
    },
    [],
  );
  const layoutBoard = useCallback(
    (q: ScaleQuestion, openMidi: readonly number[]): Board => {
      const g = growthFor(scaleItemId(q.scaleTypeId, q.positionIndex));
      return echoBoard(q, openMidi, g.length, dimRef.current);
    },
    [growthFor],
  );
  const demoTiming = useCallback(() => ({ leadMs: ECHO_LEAD_MS, noteMs: ECHO_NOTE_MS }), []);

  const record = useCallback((a: ScaleOrderAnswer) => {
    const itemId = scaleItemId(a.scaleTypeId, a.positionIndex);
    const ts = Date.now();
    const state = loadLearningState(ts);
    const inst = getInstrumentState(state, instrument.id, ts);
    saveLearningStateLocal(withInstrumentState(
      state, instrument.id, recordScaleAnswer(inst, itemId, 'echo', a.correct, a.seconds, ts),
    ));
    cloudPushLearning();
    onRecorded(ts);

    const before = growthFor(itemId);
    const clean = slippedRef.current === 0;
    const after = nextEchoLength(before, clean, a.correct);
    growthRef.current.set(itemId, after);
    setLongest((n) => (a.correct ? Math.max(n, before.length) : n));
    setResult(after.length > before.length ? 'grew' : after.length < before.length ? 'shrank' : clean ? 'clean' : 'slip');
  }, [instrument.id, onRecorded, growthFor]);

  const orderInstrument = useMemo(
    () => ({ notes: instrument.notes, stringCount: instrument.stringCount, maxFret: instrument.maxFret, openMidi: instrument.openMidi }),
    [instrument.notes, instrument.stringCount, instrument.maxFret, instrument.openMidi],
  );

  const engine = useScaleOrderEngine({
    instrument: orderInstrument,
    pool,
    questionCount: ECHO_QUESTION_COUNT,
    noteTime: ECHO_NOTE_TIME,
    demo: true,
    demoLit: false,
    naturalsOnly,
    pickQuestion,
    layoutBoard,
    demoTiming,
    onQuestionStart: () => { slippedRef.current = 0; },
    onStepHit: (h: ScaleStepHit) => { slippedRef.current = h.slipped; },
    onComplete: () => setFinished(true),
    onAnswer: record,
  });

  useEffect(() => { onRunningChange(engine.running); }, [engine.running, onRunningChange]);

  const listening = engine.demoStep != null;
  const pitch = usePitchStream({
    enabled: guitar && engine.running && !listening,
    onNote: engine.hear,
  });

  // "Hear it again": the phrase once more, on the learner's turn.
  const replayTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearReplay = () => { replayTimers.current.forEach(clearTimeout); replayTimers.current = []; };
  useEffect(() => clearReplay, []);
  useEffect(() => { clearReplay(); }, [engine.board]);
  const replay = () => {
    const b = engine.board;
    if (!b || listening) return;
    playClickSound(); haptic.tap();
    clearReplay();
    b.run.forEach((p, i) => replayTimers.current.push(
      setTimeout(() => playNoteSingle(p.string, p.fret), ECHO_LEAD_MS / 2 + i * ECHO_NOTE_MS),
    ));
  };

  if (hidden) return null;

  const start = () => {
    playClickSound(); haptic.tap();
    srsRef.current = getInstrumentState(loadLearningState(Date.now()), instrument.id, Date.now()).scaleSrs;
    growthRef.current = new Map();
    setResult(null);
    setLongest(0);
    setFinished(false);
    engine.start();
  };

  if (engine.running && engine.question && engine.board) {
    const q = engine.question;
    const phraseLength = engine.board.runMidi.length;
    return (
      <div className="set-card scale-order-card scale-echo-run">
        <div className="scale-order-header">
          <span className="scale-order-title">
            {`${t(scaleTypeById(q.scaleTypeId)?.nameKey ?? q.scaleTypeId)} · ${displayNote(q.rootName, accidental, notation)} · ${t('Box')} ${q.positionIndex}`}
          </span>
          <span className="set-card-help">
            {t('Phrase')} {engine.questionNumber} / {engine.questionCount}
            {' · '}{t('Score')}: {engine.session.score}
          </span>
          <span className="scale-echo-length" aria-label={t('Notes in the phrase')}>
            {Array.from({ length: phraseLength }, (_, i) => (
              <span key={i} className={`scale-echo-pip${i < engine.step ? ' scale-echo-pip-done' : ''}`} />
            ))}
            <span className="scale-echo-length-text">{phraseLength} {t('notes')}</span>
          </span>
          <span className={`scale-order-status${listening ? ' scale-echo-listen' : ''}`} aria-live="polite">
            {listening ? `🎧 ${t('Listen…')}` : t('Your turn — play it back')}
          </span>
          {result && !listening && (engine.step === 0 || engine.step >= phraseLength) && (
            <span className={`scale-echo-result scale-echo-result-${result}`} role="status">{t(RESULT_TEXT[result])}</span>
          )}
          {guitar && pitch.supported && !listening && (
            <span className={`voice-status guitar-status guitar-${pitch.status}`} role="status" aria-live="polite">
              {pitch.error === 'no-permission'
                ? t('🎸 Microphone blocked — enable it or switch to tap')
                : pitch.error === 'not-supported'
                  ? t('🎸 Pitch detection isn’t available on this device — use tap')
                  : pitch.status === 'listening'
                    ? `🎸 ${t('Listening…')}${pitch.partial ? ` “${pitch.partial}”` : ''}`
                    : t('🎸 Play the notes back on your guitar')}
              {pitch.status === 'error' && (
                <button type="button" className="clear-btn voice-retry" onClick={() => { playClickSound(); haptic.tap(); pitch.retry(); }}>
                  {t('Retry')}
                </button>
              )}
            </span>
          )}
        </div>
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
          fingers={fingers ? questionFingering(q, instrument.stringCount) : null}
        />
        <div className="scale-echo-actions">
          <button type="button" className="set-card-btn" disabled={listening} onClick={replay}>
            {t('🔊 hear it again')}
          </button>
          <button
            type="button"
            className="set-card-btn"
            onClick={() => { playClickSound(); haptic.tap(); clearReplay(); engine.stop(); }}
          >
            {t('Stop')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="set-card scale-echo-card" dir={lang === 'he' ? 'rtl' : undefined}>
      <span className="set-card-label">🎧 {t('Play it back by ear')}</span>
      <p className="set-card-help">
        {t('The app plays a few notes from the box — nothing lights up, so listen. Then play them back on your guitar or tap them. Every phrase starts on the root (gold ring). Two clean phrases in a row and the next one is a note longer.')}
      </p>
      <div className="scale-difficulty-row" role="group" aria-label={t('The box on the board')}>
        <button
          type="button"
          className={`set-card-btn${!dim ? ' set-card-btn-primary' : ''}`}
          aria-pressed={!dim}
          onClick={() => { playClickSound(); haptic.tap(); onDim(false); }}
        >
          {t('All notes lit')}
        </button>
        <button
          type="button"
          className={`set-card-btn${dim ? ' set-card-btn-primary' : ''}`}
          aria-pressed={dim}
          onClick={() => { playClickSound(); haptic.tap(); onDim(true); }}
        >
          {t('Only the root lit')}
        </button>
      </div>
      {dim && (
        <p className="set-card-help">{t('With only the root lit, your ear finds the notes, not your eye.')}</p>
      )}
      {finished && (
        <p className="set-card-help scale-echo-summary" role="status">
          {t('Session complete!')} {t('Score')}: {engine.session.score}
          {longest > 0 ? ` · ${t('Longest phrase played back')}: ${longest} ${t('notes')}` : ''}
        </p>
      )}
      <button type="button" className="set-card-btn set-card-btn-primary" onClick={start}>
        {finished ? t('Practice again') : t('Start')}
      </button>
    </div>
  );
}
