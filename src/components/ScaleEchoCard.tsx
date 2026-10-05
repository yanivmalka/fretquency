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
//
// Licks (wishlist item 7, `scaleLicks.ts`): the same card and engine with
// standard licks in place of made-up phrases. One box and one key for the
// whole session. Each lick is shown as it plays (lit, the way a teacher shows
// a lick), then played back, twice in a row, in the authored order.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { scaleTypeById } from '../utils/scales';
import { pickScaleQuestion, type ScalePoolItem, type ScaleQuestion } from '../learning/scaleDrill';
import type { ScaleOrderBoard as Board } from '../learning/scaleOrder';
import {
  echoBoard, echoStartLength, nextEchoLength, pickEchoItem, type EchoGrowth,
} from '../learning/scaleEcho';
import { lickBoard, lickIndexFor, lickPool, licksFor, LICK_TRIES, type ScaleLick } from '../learning/scaleLicks';
import { scaleItemId } from '../learning/scaleItem';
import type { SrsMap } from '../learning/srs';
import {
  loadLearningState, saveLearningStateLocal, getInstrumentState, withInstrumentState, recordScaleAnswer,
} from '../learning/learningState';
import { cloudPushLearning } from '../learning/learningSync';
import { recordDailyActivity } from '../utils/dailyActivity';
import { recordLeagueActivity } from '../utils/leagueActivity';
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

type EchoResult = 'grew' | 'clean' | 'slip' | 'shrank' | 'missed';

const RESULT_TEXT: Record<EchoResult, string> = {
  grew: '✓ Clean — the next phrase is one note longer.',
  clean: '✓ Clean!',
  slip: 'Found it, with a slip.',
  shrank: 'Missed — the next phrase is one note shorter.',
  missed: 'Missed this time.',
};

/** A lick's best result this session. */
type LickScore = 'clean' | 'slip' | 'missed';
const LICK_SCORE_ICON: Record<LickScore, string> = { clean: '✓', slip: '≈', missed: '✗' };
const LICK_SCORE_RANK: Record<LickScore, number> = { missed: 0, slip: 1, clean: 2 };

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
  /** Play standard licks (`scaleLicks.ts`) instead of made-up phrases. */
  licks: boolean;
  onLicks: (licks: boolean) => void;
  /** Another exercise is running — draw nothing. */
  hidden: boolean;
  onRunningChange: (running: boolean) => void;
  /** An answer was saved (epoch ms), so the host re-reads progress. */
  onRecorded: (ts: number) => void;
}

export default function ScaleEchoCard({
  instrument, accidental, notation, lang, pool, naturalsOnly, guitar, fingers, dim, onDim, licks, onLicks, hidden,
  onRunningChange, onRecorded,
}: Props) {
  const { t } = useTranslation();

  // Licks are written for a guitar's box on the 6th string (`scaleLicks.ts`).
  // The session's box: one of the learner's own scales when it has licks,
  // else Minor Pentatonic's.
  const lickItems = useMemo(
    () => (instrument.id === 'guitar' ? lickPool(instrument.stringCount) : []),
    [instrument.id, instrument.stringCount],
  );
  const lickItem = useMemo<ScalePoolItem | null>(
    () => lickItems.find((l) => pool.some((p) => p.scaleTypeId === l.scaleTypeId && p.positionIndex === l.positionIndex))
      ?? lickItems[0] ?? null,
    [lickItems, pool],
  );
  const lickSet = useMemo<readonly ScaleLick[]>(
    () => (lickItem ? licksFor(lickItem.scaleTypeId, lickItem.positionIndex, instrument.stringCount) : []),
    [lickItem, instrument.stringCount],
  );
  const licksOn = licks && lickSet.length > 0;

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

  // Licks: the session's mode, box, key and lick list are fixed at Start.
  const licksOnRef = useRef(false);
  const lickItemRef = useRef<ScalePoolItem | null>(null);
  const lickSetRef = useRef<readonly ScaleLick[]>([]);
  const lickQuestionRef = useRef<ScaleQuestion | null>(null);
  /** Questions laid out so far this session — which lick is asked. */
  const laidRef = useRef(0);
  const [lickIndex, setLickIndex] = useState(0);
  const lickIndexRef = useRef(0);
  const [lickScores, setLickScores] = useState<Record<string, LickScore>>({});
  /** The licks of the last session — what the summary lists. */
  const [sessionLicks, setSessionLicks] = useState<readonly ScaleLick[]>([]);

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
      if (licksOnRef.current) {
        // One key for the whole session, so the second try of a lick (and
        // the next lick) sits where the learner's hand already is.
        if (!lickQuestionRef.current && lickItemRef.current) {
          lickQuestionRef.current = pickScaleQuestion([lickItemRef.current], noteTable, stringCount, maxFret, rng, natural, 'up');
        }
        return lickQuestionRef.current;
      }
      const item = pickEchoItem(p, srsRef.current, Date.now(), rng);
      return item ? pickScaleQuestion([item], noteTable, stringCount, maxFret, rng, natural, 'up') : null;
    },
    [],
  );
  const layoutBoard = useCallback(
    (q: ScaleQuestion, openMidi: readonly number[]): Board => {
      const n = laidRef.current;
      laidRef.current += 1;
      if (licksOnRef.current) {
        const i = lickIndexFor(n, lickSetRef.current.length);
        lickIndexRef.current = i;
        setLickIndex(i);
        const b = lickSetRef.current[i] ? lickBoard(q, openMidi, lickSetRef.current[i], dimRef.current) : null;
        if (b) return b;
      }
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
    recordDailyActivity();
    // Same isolated-history reasoning as ScalePracticeScreen's recordAnswer —
    // this is a separate write path, so it needs its own league XP report.
    if (a.correct) recordLeagueActivity(instrument.id);

    const clean = slippedRef.current === 0;
    if (licksOnRef.current) {
      const lick = lickSetRef.current[lickIndexRef.current];
      const score: LickScore = !a.correct ? 'missed' : clean ? 'clean' : 'slip';
      if (lick) {
        setLickScores((prev) => {
          const had = prev[lick.id];
          return had && LICK_SCORE_RANK[had] >= LICK_SCORE_RANK[score] ? prev : { ...prev, [lick.id]: score };
        });
      }
      setResult(score);
      return;
    }
    const before = growthFor(itemId);
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
    // The pick can't change mid-session (the card shows the run instead).
    questionCount: licksOn ? lickSet.length * LICK_TRIES : ECHO_QUESTION_COUNT,
    noteTime: ECHO_NOTE_TIME,
    demo: true,
    // A lick is shown as it plays; a made-up phrase is by ear only.
    demoLit: licksOn,
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
    licksOnRef.current = licksOn;
    lickItemRef.current = licksOn ? lickItem : null;
    lickSetRef.current = licksOn ? lickSet : [];
    lickQuestionRef.current = null;
    laidRef.current = 0;
    lickIndexRef.current = 0;
    setLickIndex(0);
    setLickScores({});
    setSessionLicks(licksOn ? lickSet : []);
    setResult(null);
    setLongest(0);
    setFinished(false);
    engine.start();
  };

  if (engine.running && engine.question && engine.board) {
    const q = engine.question;
    const phraseLength = engine.board.runMidi.length;
    const lick = sessionLicks[lickIndex];
    const lickTry = (engine.questionNumber - 1) % LICK_TRIES + 1;
    return (
      <div className="set-card scale-order-card scale-echo-run">
        <div className="scale-order-header">
          <span className="scale-order-title">
            {`${t(scaleTypeById(q.scaleTypeId)?.nameKey ?? q.scaleTypeId)} · ${displayNote(q.rootName, accidental, notation)} · ${t('Box')} ${q.positionIndex}`}
          </span>
          {lick ? (
            <>
              <span className="scale-lick-name">🎸 {t(lick.nameKey)}</span>
              <span className="set-card-help">
                {t('Lick')} {lickIndex + 1} / {sessionLicks.length}
                {' · '}{t('Try')} {lickTry} / {LICK_TRIES}
                {' · '}{t('Score')}: {engine.session.score}
              </span>
              <span className="set-card-help scale-lick-how">{t(lick.howKey)}</span>
            </>
          ) : (
            <span className="set-card-help">
              {t('Phrase')} {engine.questionNumber} / {engine.questionCount}
              {' · '}{t('Score')}: {engine.session.score}
            </span>
          )}
          <span className="scale-echo-length" aria-label={t('Notes in the phrase')}>
            {Array.from({ length: phraseLength }, (_, i) => (
              <span key={i} className={`scale-echo-pip${i < engine.step ? ' scale-echo-pip-done' : ''}`} />
            ))}
            <span className="scale-echo-length-text">{phraseLength} {t('notes')}</span>
          </span>
          <span className={`scale-order-status${listening ? ' scale-echo-listen' : ''}`} aria-live="polite">
            {listening
              ? (lick ? `👀 ${t('Watch and listen…')}` : `🎧 ${t('Listen…')}`)
              : t('Your turn — play it back')}
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
        {lick?.noteKey && <p className="set-card-help scale-lick-note">{t(lick.noteKey)}</p>}
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

  const lickBoxName = lickItem
    ? `${t(scaleTypeById(lickItem.scaleTypeId)?.nameKey ?? lickItem.scaleTypeId)} · ${t('Box')} ${lickItem.positionIndex}`
    : '';

  return (
    <div className="set-card scale-echo-card" dir={lang === 'he' ? 'rtl' : undefined}>
      <span className="set-card-label">🎧 {t('Play it back by ear')}</span>
      {lickSet.length > 0 && (
        <div className="scale-difficulty-row" role="group" aria-label={t('What the app plays')}>
          <button
            type="button"
            className={`set-card-btn${!licksOn ? ' set-card-btn-primary' : ''}`}
            aria-pressed={!licksOn}
            onClick={() => { playClickSound(); haptic.tap(); onLicks(false); }}
          >
            {t('Short phrases')}
          </button>
          <button
            type="button"
            className={`set-card-btn${licksOn ? ' set-card-btn-primary' : ''}`}
            aria-pressed={licksOn}
            onClick={() => { playClickSound(); haptic.tap(); onLicks(true); }}
          >
            {t('Licks')}
          </button>
        </div>
      )}
      {licksOn ? (
        <>
          <p className="set-card-help">
            {t('Standard blues and rock licks every guitarist learns in this box. The app shows and plays each lick, then you play it back on your guitar or tap it — twice per lick, in one key.')}
          </p>
          <p className="set-card-help scale-lick-box">{lickBoxName}</p>
          <ol className="scale-lick-list">
            {lickSet.map((l) => (
              // The name is the item's own text, not a span: under the global
              // `unicode-bidi: plaintext` a lone span is isolated and the item
              // would read as LTR in Hebrew.
              <li key={l.id} className="scale-lick-item">
                {t(l.nameKey)}
                {finished && sessionLicks.includes(l) && (
                  <span className={`scale-lick-score scale-lick-score-${lickScores[l.id] ?? 'missed'}`}>
                    {LICK_SCORE_ICON[lickScores[l.id] ?? 'missed']}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="set-card-help">
          {t('The app plays a few notes from the box — nothing lights up, so listen. Then play them back on your guitar or tap them. Every phrase starts on the root (gold ring). Two clean phrases in a row and the next one is a note longer.')}
        </p>
      )}
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
          {sessionLicks.length === 0 && longest > 0 ? ` · ${t('Longest phrase played back')}: ${longest} ${t('notes')}` : ''}
          {sessionLicks.length > 0
            ? ` · ${t('Licks played clean')}: ${sessionLicks.filter((l) => lickScores[l.id] === 'clean').length} / ${sessionLicks.length}`
            : ''}
        </p>
      )}
      <button type="button" className="set-card-btn set-card-btn-primary" onClick={start}>
        {finished ? t('Practice again') : t('Start')}
      </button>
    </div>
  );
}
