// ── ReadingHomeworkRun — a student plays one staff- or tab-reading homework ──
//
// The same `useReadingEngine` the Staff / Tab reading screens run, over the
// pool the teacher chose (range, key, naturals). Three exercises per domain:
// name the written note, find it on the neck, read a phrase / riff. A homework
// run writes nothing to the learning state (no SRS, no daily goal of the Learn
// screen) — one result row goes to the teacher (`useHomeworkResult`). Not
// Premium-gated: the teacher assigned it.
//
// The staff is never mirrored by left-handed mode, and the tab keeps string 1
// on its top line — both exactly as in their Learn screens.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import HomeworkResultPanel from './HomeworkResultPanel';
import IntervalChoiceRow from './IntervalChoiceRow';
import StaffNotation, { type StaffNote } from './StaffNotation';
import StaffNeckBoard from './StaffNeckBoard';
import TabNotation, { type TabNote } from './TabNotation';
import { useReadingEngine } from '../hooks/useReadingEngine';
import { useHomeworkResult, type HomeworkFinishPayload } from '../hooks/useHomeworkResult';
import {
  buildStaffPhrase, buildStaffPool, pickStaffQuestion, staffBottomFret, staffNameOptions, staffTopFret,
  type StaffPoolItem,
} from '../learning/staffDrill';
import {
  buildTabPool, buildTabRiff, pickTabQuestion, tabBottomFret, tabNameOptions, tabTopFret, type TabPoolItem,
} from '../learning/tabDrill';
import type { SrsMap } from '../learning/srs';
import {
  keySignaturePositions, keySpelling, passageSigns, pitchClassName, spellPitch,
  staffPosition, staffSpecFor,
} from '../utils/staff';
import { unlockAudio, setAudioInstrument } from '../utils/audio';
import { displayNote, setActiveInstrument, type AccidentalMode, type NotationMode } from '../utils/music';
import { getInstrument, type InstrumentConfig, type InstrumentId } from '../utils/instruments';
import type { WrongPosition } from '../teacher/homework';
import {
  STAFF_PHRASE_NOTES, TAB_RIFF_NOTES, type StaffHomework, type TabHomework,
} from '../teacher/homeworkKinds';

interface Props {
  title: string;
  instrumentId: InstrumentId;
  spec: StaffHomework | TabHomework;
  summary: string;
  accidental: AccidentalMode;
  notation: NotationMode;
  onFinished: (r: HomeworkFinishPayload) => Promise<void>;
  onDone: () => void;
}

// A homework picks by plain randomness: there is no review schedule to weight.
const NO_SRS: SrsMap = {};
const getNoSrs = () => NO_SRS;

/** Seconds per note, as the Learn screens give them. */
const STAFF_TIME = { nameNote: 10, findOnNeck: 15, readPhrase: 8 } as const;
const TAB_TIME = { nameNote: 10, findOnNeck: 12, readRiff: 8 } as const;

// English literal = i18n key (the strings are the Learn screens' own).
const STAFF_HELP = {
  nameNote: 'A note is written on the staff. Pick its name — you will hear it after you answer.',
  findOnNeck: 'A note is written on the staff. Tap a place on the neck that plays it — any string counts. Afterwards every place that plays it is shown.',
  readPhrase: 'A short phrase is written on the staff. Name its notes one after another — at the end you will hear it.',
} as const;
const TAB_HELP = {
  nameNote: 'A number is written on one line of the tab. Name the note it plays — you will hear it after you answer.',
  findOnNeck: 'A number is written on one line of the tab. Tap that exact place on the neck: the line is the string, the number is the fret.',
  readRiff: 'A short riff is written in the tab. Name its notes one after another — at the end you will hear it.',
} as const;

/** Tally + lifecycle shared by both domains: counts answers as the engine
 *  reports them, and when the run completes shows and sends the result. */
function useReadingRun(
  instrumentId: InstrumentId,
  total: number,
  onFinished: (r: HomeworkFinishPayload) => Promise<void>,
) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'result'>('idle');
  const [completed, setCompleted] = useState(false);
  const { result, saveState, finish, retrySave, clear } = useHomeworkResult(instrumentId, onFinished);
  const correctRef = useRef(0);
  const secondsRef = useRef(0);
  const wrongRef = useRef<WrongPosition[]>([]);

  useEffect(() => {
    if (!completed) return;
    setCompleted(false);
    setPhase('result');
    finish({ correct: correctRef.current, total, seconds: Math.round(secondsRef.current) }, wrongRef.current);
  }, [completed, finish, total]);

  const record = useCallback((correct: boolean, seconds: number, wrong?: WrongPosition) => {
    if (correct) correctRef.current += 1;
    else if (wrong) wrongRef.current.push(wrong);
    secondsRef.current += seconds;
  }, []);
  const onComplete = useCallback(() => setCompleted(true), []);
  const begin = () => {
    unlockAudio();
    correctRef.current = 0;
    secondsRef.current = 0;
    wrongRef.current = [];
    clear();
    setPhase('playing');
  };
  return { phase, result, saveState, retrySave, record, onComplete, begin };
}

export default function ReadingHomeworkRun(props: Props) {
  const instrument = getInstrument(props.instrumentId);
  setActiveInstrument(instrument);
  setAudioInstrument(instrument);
  return props.spec.kind === 'staff'
    ? <StaffRun {...props} spec={props.spec} instrument={instrument} />
    : <TabRun {...props} spec={props.spec} instrument={instrument} />;
}

interface FrameProps {
  title: string;
  summary: string;
  emoji: string;
  idle: React.ReactNode;
  playing: React.ReactNode;
  phase: 'idle' | 'playing' | 'result';
  result: ReturnType<typeof useReadingRun>['result'];
  saveState: ReturnType<typeof useReadingRun>['saveState'];
  retrySave: ReturnType<typeof useReadingRun>['retrySave'];
  onPlayAgain: () => void;
  onDone: () => void;
}

function Frame({ title, summary, emoji, idle, playing, phase, result, saveState, retrySave, onPlayAgain, onDone }: FrameProps) {
  return (
    <div className="class-run">
      <div className="class-run-head">
        <span className="class-run-emoji" aria-hidden="true">{emoji}</span>
        <div>
          <div className="class-run-title">{title}</div>
          <div className="class-muted">{summary}</div>
        </div>
      </div>
      {phase === 'idle' && idle}
      {phase === 'playing' && playing}
      {phase === 'result' && result && (
        <HomeworkResultPanel
          result={result}
          saveState={saveState}
          onRetrySave={() => retrySave(result)}
          onPlayAgain={onPlayAgain}
          onDone={onDone}
        />
      )}
    </div>
  );
}

// ── Staff ───────────────────────────────────────────────────────────────

function StaffRun({ title, instrumentId, spec, summary, accidental, notation, onFinished, onDone, instrument }: Props & {
  spec: StaffHomework; instrument: InstrumentConfig;
}) {
  const { t, lang } = useTranslation();
  const isPhrase = spec.exercise === 'readPhrase';
  const notesPerQuestion = isPhrase ? STAFF_PHRASE_NOTES : 1;
  const run = useReadingRun(instrumentId, spec.questionCount * notesPerQuestion, onFinished);

  const clefSpec = staffSpecFor(instrument.id);
  const spelling = keySpelling(spec.key, accidental);
  const topFret = staffTopFret(spec.range, instrument.maxFret);
  const bottomFret = staffBottomFret(spec.range, instrument.maxFret);
  const keySignature = keySignaturePositions(spec.key, clefSpec.clef);

  const pool = useMemo(
    () => buildStaffPool(
      { openMidi: instrument.openMidi, maxFret: instrument.maxFret, minFrets: instrument.minFrets },
      spec.range, spec.inKeyOnly, spec.key,
    ),
    [instrument.openMidi, instrument.maxFret, instrument.minFrets, spec.range, spec.inKeyOnly, spec.key],
  );

  const writeOf = useCallback((midi: number) => {
    const written = midi + clefSpec.writtenShift;
    const p = spellPitch(written, spelling);
    return { position: staffPosition(written, clefSpec.clef, spelling), accidental: p.accidental, letter: p.letter };
  }, [clefSpec.writtenShift, clefSpec.clef, spelling]);

  // The whole run's lowest / highest position, so the staff keeps its size.
  const span = useMemo(() => {
    const ps = pool.map((p) => writeOf(p.midi).position);
    return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : { min: 0, max: 8 };
  }, [pool, writeOf]);

  const pickItems = useCallback((srs: SrsMap, previous: StaffPoolItem | null, ts: number) => {
    const previousMidi = previous?.midi ?? null;
    return isPhrase
      ? buildStaffPhrase(pool, srs, STAFF_PHRASE_NOTES, previousMidi, ts)
      : [pickStaffQuestion(pool, srs, previousMidi, ts)].filter((q): q is StaffPoolItem => q != null);
  }, [pool, isPhrase]);

  const engine = useReadingEngine<typeof spec.exercise, StaffPoolItem>({
    exercise: spec.exercise,
    pickItems,
    openMidi: instrument.openMidi,
    questionCount: spec.questionCount,
    notesPerQuestion,
    timeLimit: STAFF_TIME[spec.exercise],
    markPosition: false,
    pitchOctaveStrict: true,
    getSrs: getNoSrs,
    onComplete: run.onComplete,
    onAnswer: (a) => run.record(a.correct, a.seconds),
  });
  const { stop } = engine;
  useEffect(() => () => stop(), [stop]);

  const { question, cursor, results, answered } = engine;
  const items = question?.items ?? [];
  const written = items.map((it) => writeOf(it.midi));
  const signs = passageSigns(written, spec.key);
  const single = items.length === 1;
  const singleCorrect = single && results[0]?.correct === true;
  const nameOf = (midi: number) => displayNote(pitchClassName(midi), spelling, notation);
  const phraseScore = results.filter((r) => r?.correct).length;

  const staffNotes: StaffNote[] = written.map((w, i) => {
    const r = results[i];
    return {
      position: w.position,
      sign: signs[i],
      state: r ? (r.correct ? 'correct' : 'wrong') : !answered && !single && i === cursor ? 'current' : 'live',
      label: !single && r ? nameOf(items[i].midi) : undefined,
    };
  });

  const clefHelp = clefSpec.clef === 'bass'
    ? t('Bass music is written in the bass clef, one octave above how it sounds.')
    : clefSpec.octaveMark
      ? t('Music for this instrument is written in the treble clef, one octave above how it sounds — the small 8 under the clef says so.')
      : t('Music for this instrument is written in the treble clef, at the pitch it sounds.');

  const start = () => { playClickSound(); haptic.tap(); run.begin(); engine.start(); };

  return (
    <Frame
      title={title} summary={summary} emoji={instrument.emoji}
      phase={run.phase} result={run.result} saveState={run.saveState} retrySave={run.retrySave}
      onPlayAgain={start} onDone={onDone}
      idle={(
        <>
          <p className="class-muted">{t(STAFF_HELP[spec.exercise])}</p>
          <p className="class-muted">{clefHelp}</p>
          <button className="class-btn-primary" onClick={start}>{t('Start')}</button>
        </>
      )}
      playing={engine.running && question && (
        <div className="question-col class-question-col">
          <p className="set-card-help">
            {isPhrase ? t('Phrase') : t('Question')} {engine.questionNumber} / {engine.questionCount}
          </p>
          <StaffNotation
            clef={clefSpec.clef}
            octaveMark={clefSpec.octaveMark}
            keySignature={keySignature}
            notes={staffNotes}
            span={span}
            slots={1}
            endBar={isPhrase}
            label={t('A note on the staff')}
          />
          {/* Always rendered, so the answer appearing never shifts the board. */}
          <p className="staff-answer" aria-live="polite">
            {answered && (single
              ? <>{singleCorrect ? '✓ ' : '✗ '}{nameOf(items[0].midi)}</>
              : <>{phraseScore === items.length ? '✓ ' : ''}{phraseScore}/{items.length}</>)}
          </p>
          {spec.exercise !== 'findOnNeck' ? (
            <IntervalChoiceRow
              variant="note"
              options={staffNameOptions(spec.inKeyOnly, spec.key).map((n) => ({ value: n, label: displayNote(n, spelling, notation) }))}
              onSelect={engine.selectName}
              correct={single && answered ? pitchClassName(items[0].midi) : null}
              wrong={single && results[0]?.picked != null && !singleCorrect ? results[0].picked : null}
              disabled={answered}
              dir={lang === 'he' ? 'rtl' : undefined}
            />
          ) : (
            <StaffNeckBoard
              bottomFret={bottomFret}
              topFret={topFret}
              noteTable={instrument.notes}
              stringCount={instrument.stringCount}
              minFrets={instrument.minFrets}
              reveal={answered ? items[0].positions : null}
              tapped={engine.tapped}
              accidental={accidental}
              notation={notation}
              onTap={engine.tapPosition}
            />
          )}
        </div>
      )}
    />
  );
}

// ── Tab ─────────────────────────────────────────────────────────────────

function TabRun({ title, instrumentId, spec, summary, accidental, notation, onFinished, onDone, instrument }: Props & {
  spec: TabHomework; instrument: InstrumentConfig;
}) {
  const { t, lang } = useTranslation();
  const isRiff = spec.exercise === 'readRiff';
  const notesPerQuestion = isRiff ? TAB_RIFF_NOTES : 1;
  const run = useReadingRun(instrumentId, spec.questionCount * notesPerQuestion, onFinished);

  const topFret = tabTopFret(spec.range, instrument.maxFret);
  const bottomFret = tabBottomFret(spec.range, instrument.maxFret);
  const inst = useMemo(
    () => ({ openMidi: instrument.openMidi, maxFret: instrument.maxFret, minFrets: instrument.minFrets }),
    [instrument.openMidi, instrument.maxFret, instrument.minFrets],
  );
  const pool = useMemo(() => buildTabPool(inst, spec.range, spec.naturalsOnly), [inst, spec.range, spec.naturalsOnly]);

  const pickItems = useCallback((srs: SrsMap, previous: TabPoolItem | null, ts: number): TabPoolItem[] => {
    const previousId = previous?.itemId ?? null;
    return isRiff
      ? buildTabRiff(pool, srs, TAB_RIFF_NOTES, previousId, ts)
      : [pickTabQuestion(pool, srs, previousId, ts)].filter((q): q is TabPoolItem => q != null);
  }, [pool, isRiff]);

  const engine = useReadingEngine<typeof spec.exercise, TabPoolItem>({
    exercise: spec.exercise,
    pickItems,
    openMidi: instrument.openMidi,
    questionCount: spec.questionCount,
    notesPerQuestion,
    timeLimit: TAB_TIME[spec.exercise],
    markPosition: false,
    exactPosition: true,
    getSrs: getNoSrs,
    onComplete: run.onComplete,
    onAnswer: (a) => {
      // A tab item is a place, so a miss names the exact string and fret.
      const item = pool.find((p) => p.itemId === a.itemId);
      run.record(a.correct, a.seconds, item ? { string: item.string, fret: item.fret } : undefined);
    },
  });
  const { stop } = engine;
  useEffect(() => () => stop(), [stop]);

  const { question, cursor, results, answered } = engine;
  const items = question?.items ?? [];
  const first = items[0];
  const single = items.length === 1;
  const singleCorrect = single && results[0]?.correct === true;
  const nameOf = (midi: number) => displayNote(pitchClassName(midi), accidental, notation);
  const riffScore = results.filter((r) => r?.correct).length;

  const stringNames = Array.from(
    { length: instrument.stringCount },
    (_, i) => displayNote(instrument.notes[i]?.[0] ?? '', accidental, notation),
  );
  // Real tabs write the top string in lower case when it shares its name
  // with the bottom one (e … E), so the two lines never read alike.
  if (stringNames.length > 1 && stringNames[0] === stringNames[stringNames.length - 1]) {
    stringNames[0] = stringNames[0].toLowerCase();
  }

  const tabNotes: TabNote[] = items.map((it, i) => {
    const r = results[i];
    return {
      cells: [{ string: it.string, text: String(it.fret) }],
      state: r ? (r.correct ? 'correct' : 'wrong') : !answered && !single && i === cursor ? 'current' : 'live',
      label: !single && r ? nameOf(it.midi) : undefined,
    };
  });

  const start = () => { playClickSound(); haptic.tap(); run.begin(); engine.start(); };

  return (
    <Frame
      title={title} summary={summary} emoji={instrument.emoji}
      phase={run.phase} result={run.result} saveState={run.saveState} retrySave={run.retrySave}
      onPlayAgain={start} onDone={onDone}
      idle={(
        <>
          <p className="class-muted">{t(TAB_HELP[spec.exercise])}</p>
          <p className="class-muted">
            {t('In a tab the top line is the thinnest, highest string and the bottom line the thickest — upside down from the neck in this app, where the thickest string is on top.')}
          </p>
          <button className="class-btn-primary" onClick={start}>{t('Start')}</button>
        </>
      )}
      playing={engine.running && question && (
        <div className="question-col class-question-col">
          <p className="set-card-help">
            {isRiff ? t('Riff') : t('Question')} {engine.questionNumber} / {engine.questionCount}
          </p>
          <TabNotation
            stringNames={stringNames}
            notes={tabNotes}
            slots={1}
            endBar={isRiff}
            label={t('A number on the tab')}
          />
          <p className="staff-answer" aria-live="polite">
            {answered && first && (single
              ? <>{singleCorrect ? '✓ ' : '✗ '}{nameOf(first.midi)}</>
              : <>{riffScore === items.length ? '✓ ' : ''}{riffScore}/{items.length}</>)}
          </p>
          {spec.exercise !== 'findOnNeck' ? (
            <IntervalChoiceRow
              variant="note"
              options={tabNameOptions(spec.naturalsOnly).map((n) => ({ value: n, label: displayNote(n, accidental, notation) }))}
              onSelect={engine.selectName}
              correct={single && answered && first ? pitchClassName(first.midi) : null}
              wrong={single && results[0]?.picked != null && !singleCorrect ? results[0].picked : null}
              disabled={answered}
              dir={lang === 'he' ? 'rtl' : undefined}
            />
          ) : first && (
            <StaffNeckBoard
              bottomFret={bottomFret}
              topFret={topFret}
              noteTable={instrument.notes}
              stringCount={instrument.stringCount}
              minFrets={instrument.minFrets}
              reveal={answered ? first.positions : null}
              tapped={engine.tapped}
              accidental={accidental}
              notation={notation}
              onTap={engine.tapPosition}
            />
          )}
        </div>
      )}
    />
  );
}
