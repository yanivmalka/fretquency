// ── StaffPracticeScreen — the "Staff reading" second home screen ─────────
//
// staff-reading-spec.md. One of the Learn drawer's domains, styled like
// ScalePracticeScreen (a second home screen, no Back row — the hamburger
// drawer is the only way off). Premium-only: the host mounts it behind
// `can('staffReading', tier)` and it is wrapped in <ProGate> as a second line
// of defence.
//
// Self-contained like Scales: it runs the shared reading engine (`useReadingEngine`) and
// owns its start / running / summary states, plus a Progress tab. Every
// answer folds into the staff lane of the learning state (`staffSrs` /
// `staffHistory` / `staffDaily`), which steers which notes come next, and is
// pushed to the cloud like the rest of the learning blob.
//
// Four exercises (name the note / find it on the neck / where is it written /
// read a phrase), four fret ranges, a key signature, and the notes of the key
// only or every note. The spelling of a black key follows the key — and in C
// (no signature) the app-wide sharps/flats setting; chip labels follow the
// notation setting (A-B-C / Do-Re-Mi) like everywhere else.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { useReadingEngine, type ReadingAnswer, type ReadingQuestion } from '../hooks/useReadingEngine';
import { usePitchStream } from '../hooks/usePitchStream';
import {
  buildStaffPhrase, buildStaffPool, pickStaffQuestion, staffBottomFret, staffNameOptions, staffTopFret,
  STAFF_RANGES, type StaffPoolItem, type StaffRange,
} from '../learning/staffDrill';
import type { SrsMap } from '../learning/srs';
import { buildStaffBoard } from '../learning/staffMastery';
import {
  KEY_IDS, keyAccidentalCount, keySignaturePositions, keySpelling, passageSigns, pitchClassName,
  spellPitch, staffPosition, staffSpecFor, writtenMidiAt, type KeyId, type StaffSign,
} from '../utils/staff';
import {
  loadLearningState, saveLearningStateLocal, getInstrumentState, withInstrumentState, recordStaffAnswer,
  rollDailyGoal, type StaffForm,
} from '../learning/learningState';
import { cloudPushLearning } from '../learning/learningSync';
import { recordDailyActivity } from '../utils/dailyActivity';
import { recordLeagueActivity } from '../utils/leagueActivity';
import StaffNotation, { type StaffNote } from './StaffNotation';
import StaffNeckBoard from './StaffNeckBoard';
import StaffProgressBoard from './StaffProgressBoard';
import IntervalChoiceRow from './IntervalChoiceRow';
import { ProGate } from './ProGate';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { loadSetting, saveSetting } from '../utils/settings';
import { playClickSound, haptic } from '../utils/feedback';

interface Props {
  instrument: InstrumentConfig;
  accidental: AccidentalMode;
  notation: NotationMode;
  /** Whether the hamburger button is shown — hidden while the drawer is open. */
  showMenuButton?: boolean;
  /** Open the hamburger drawer (the host owns the drawer state + nav). */
  onOpenMenu: () => void;
}

type StaffExercise = StaffForm;
type StaffQuestion = ReadingQuestion<StaffPoolItem>;

const EXERCISES: readonly StaffExercise[] = ['nameNote', 'findOnNeck', 'findOnStaff', 'readPhrase'];
const QUESTION_COUNT: Record<StaffExercise, number> = { nameNote: 12, findOnNeck: 12, findOnStaff: 12, readPhrase: 6 };
const NOTES_PER_QUESTION: Record<StaffExercise, number> = { nameNote: 1, findOnNeck: 1, findOnStaff: 1, readPhrase: 4 };
/** Seconds per note. */
const TIME_LIMIT: Record<StaffExercise, number> = { nameNote: 10, findOnNeck: 15, findOnStaff: 20, readPhrase: 8 };

// English literal = i18n key (app convention).
const EXERCISE_LABEL: Record<StaffExercise, string> = {
  nameNote: 'Name the note',
  findOnNeck: 'Find it on the neck',
  findOnStaff: 'Where is it written?',
  readPhrase: 'Read a phrase',
};
const EXERCISE_HELP: Record<StaffExercise, string> = {
  nameNote: 'A note is written on the staff. Pick its name — you will hear it after you answer.',
  findOnNeck: 'A note is written on the staff. Tap a place on the neck that plays it — any string counts. Afterwards every place that plays it is shown.',
  findOnStaff: 'A place on the neck is marked. Tap the staff where that note is written, fine-tune with the arrows, then press Check.',
  readPhrase: 'A short phrase is written on the staff. Name its notes one after another — at the end you will hear it.',
};
const FIXED_RANGE_LABEL: Record<Exclude<StaffRange, 'high'>, string> = {
  open: 'Frets 0–3',
  low: 'Frets 0–5',
  twelve: 'Frets 0–12',
};
const SIGN_LABEL: Record<Exclude<StaffSign, ''>, string> = { '#': '♯', b: '♭', n: '♮' };

function loadOneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const raw = loadSetting<string>(key, fallback);
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

interface Placement { position: number; sign: StaffSign }

export default function StaffPracticeScreen({ instrument, accidental, notation, showMenuButton = true, onOpenMenu }: Props) {
  const { t, lang } = useTranslation();
  const [finished, setFinished] = useState(false);
  const [tab, setTab] = useState<'practice' | 'progress'>('practice');
  const [exercise, setExerciseState] = useState<StaffExercise>(() => loadOneOf('staff_exercise', EXERCISES, 'nameNote'));
  const [range, setRangeState] = useState<StaffRange>(() => loadOneOf('staff_range', STAFF_RANGES, 'open'));
  const [keyId, setKeyState] = useState<KeyId>(() => loadOneOf('staff_key', KEY_IDS, 'C'));
  // Stored under its Slice 1 name: "naturals only" is "the notes of the key" in C.
  const [inKeyOnly, setInKeyOnlyState] = useState<boolean>(() => loadSetting<boolean>('staff_naturalsOnly', true) !== false);
  const [guitarAnswer, setGuitarAnswerState] = useState<boolean>(() => loadSetting<boolean>('staff_guitarAnswer', false));
  // The note placed on the staff ("Where is it written?"), tagged with the
  // question it belongs to so a new question starts with a clean staff.
  const [placed, setPlaced] = useState<{ q: StaffQuestion; p: Placement } | null>(null);
  // Bumped on every recorded answer and on a cloud reconcile, so the daily
  // goal and the Progress board re-read the learning state.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const reread = () => setNow(Date.now());
    window.addEventListener('learning-synced', reread);
    return () => window.removeEventListener('learning-synced', reread);
  }, []);

  const spec = staffSpecFor(instrument.id);
  const spelling = keySpelling(keyId, accidental);
  const topFret = staffTopFret(range, instrument.maxFret);
  const bottomFret = staffBottomFret(range, instrument.maxFret);
  const keySignature = keySignaturePositions(keyId, spec.clef);

  const pool = useMemo(
    () => buildStaffPool(
      { openMidi: instrument.openMidi, maxFret: instrument.maxFret, minFrets: instrument.minFrets },
      range,
      inKeyOnly,
      keyId,
    ),
    [instrument.openMidi, instrument.maxFret, instrument.minFrets, range, inKeyOnly, keyId],
  );

  /** Where a sounding pitch is written, and with which spelling. */
  const writeOf = useCallback((midi: number) => {
    const written = midi + spec.writtenShift;
    const p = spellPitch(written, spelling);
    return { position: staffPosition(written, spec.clef, spelling), accidental: p.accidental, letter: p.letter };
  }, [spec.writtenShift, spec.clef, spelling]);

  // The whole session's lowest / highest position, so the staff keeps its size.
  const span = useMemo(() => {
    const ps = pool.map((p) => writeOf(p.midi).position);
    return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : { min: 0, max: 8 };
  }, [pool, writeOf]);

  const instState = useMemo(
    () => getInstrumentState(loadLearningState(now), instrument.id, now),
    [instrument.id, now],
  );
  const dailyGoal = rollDailyGoal(instState.staffDaily, now, instState.staffDaily.target);
  const boardItems = useMemo(
    () => buildStaffBoard(pool, instState.staffSrs, instState.staffHistory, now),
    [pool, instState, now],
  );

  const getSrs = useCallback(() => {
    const ts = Date.now();
    return getInstrumentState(loadLearningState(ts), instrument.id, ts).staffSrs;
  }, [instrument.id]);

  const recordAnswer = useCallback((a: ReadingAnswer<StaffExercise>) => {
    const ts = Date.now();
    const state = loadLearningState(ts);
    const inst = getInstrumentState(state, instrument.id, ts);
    const next = recordStaffAnswer(inst, a.itemId, a.form, a.correct, a.seconds, ts);
    saveLearningStateLocal(withInstrumentState(state, instrument.id, next));
    // A no-op for a guest / offline; the reconcile merges per item.
    cloudPushLearning();
    setNow(ts);
    recordDailyActivity();
    // Staff reading is its own isolated SRS/history, never Practice's real
    // history — without this, a week spent only on Staff reading would never
    // move the player's weekly league XP (leagueActivity.ts).
    if (a.correct) recordLeagueActivity(instrument.id);
  }, [instrument.id]);

  const notesPerQuestion = NOTES_PER_QUESTION[exercise];
  const pickItems = useCallback((srs: SrsMap, previous: StaffPoolItem | null, ts: number) => {
    const previousMidi = previous?.midi ?? null;
    return notesPerQuestion > 1
      ? buildStaffPhrase(pool, srs, notesPerQuestion, previousMidi, ts)
      : [pickStaffQuestion(pool, srs, previousMidi, ts)].filter((q): q is StaffPoolItem => q != null);
  }, [pool, notesPerQuestion]);

  const engine = useReadingEngine({
    exercise,
    pickItems,
    openMidi: instrument.openMidi,
    questionCount: QUESTION_COUNT[exercise],
    notesPerQuestion,
    timeLimit: TIME_LIMIT[exercise],
    markPosition: exercise === 'findOnStaff',
    pitchOctaveStrict: true,
    getSrs,
    onComplete: () => setFinished(true),
    onAnswer: recordAnswer,
  });
  const { running, question, cursor, results, answered } = engine;

  // Answer by playing: a note heard on the guitar goes to the engine like a
  // name pick. The staff is testing the exact pitch, octave included — unlike
  // Scales/Tab, `pitchOctaveStrict` above keeps an octave slip a mistake.
  const pitch = usePitchStream({
    enabled: guitarAnswer && (exercise === 'nameNote' || exercise === 'readPhrase') && running,
    onNote: engine.hear,
  });

  const placement = placed && placed.q === question ? placed.p : null;
  const setPlacement = (fn: (p: Placement | null) => Placement) => {
    if (!question) return;
    setPlaced({ q: question, p: fn(placement) });
  };

  const pick = (fn: () => void) => {
    if (running) return;
    playClickSound(); haptic.tap();
    fn();
    setFinished(false);
  };
  const setExercise = (e: StaffExercise) => pick(() => { setExerciseState(e); saveSetting('staff_exercise', e); });
  const setRange = (r: StaffRange) => pick(() => { setRangeState(r); saveSetting('staff_range', r); });
  const setKey = (k: KeyId) => pick(() => { setKeyState(k); saveSetting('staff_key', k); });
  const setInKeyOnly = (v: boolean) => pick(() => { setInKeyOnlyState(v); saveSetting('staff_naturalsOnly', v); });
  const setGuitarAnswer = (v: boolean) => {
    playClickSound(); haptic.tap();
    setGuitarAnswerState(v);
    saveSetting('staff_guitarAnswer', v);
  };

  const startSession = () => {
    playClickSound(); haptic.tap();
    setFinished(false);
    engine.start();
  };

  const clefHelp = spec.clef === 'bass'
    ? t('Bass music is written in the bass clef, one octave above how it sounds.')
    : spec.octaveMark
      ? t('Music for this instrument is written in the treble clef, one octave above how it sounds — the small 8 under the clef says so.')
      : t('Music for this instrument is written in the treble clef, at the pitch it sounds.');

  const nameOf = (midi: number) => displayNote(pitchClassName(midi), spelling, notation);
  const rangeLabel = (r: StaffRange) => r === 'high'
    // Isolated LTR, so "12–21" never reads backwards on a Hebrew page.
    ? `${t('Frets')} ⁦${staffBottomFret('high', instrument.maxFret)}–${instrument.maxFret}⁩`
    : t(FIXED_RANGE_LABEL[r]);
  const keyLabel = (k: KeyId) => {
    const n = keyAccidentalCount(k);
    const name = displayNote(k, n < 0 ? 'flats' : 'sharps', notation);
    return n === 0 ? name : `⁦${name} · ${Math.abs(n)}${n > 0 ? '♯' : '♭'}⁩`;
  };

  // ── The staff for the current question ──────────────────────────────
  const items = question?.items ?? [];
  const written = items.map((it) => writeOf(it.midi));
  const signs = passageSigns(written, keyId);
  const single = items.length === 1;
  const singleCorrect = single && results[0]?.correct === true;

  let staffNotes: StaffNote[] = [];
  if (exercise === 'findOnStaff') {
    if (placement) {
      staffNotes.push({ ...placement, state: !answered ? 'ghost' : singleCorrect ? 'correct' : 'wrong' });
    }
    if (answered && !singleCorrect && written[0]) {
      staffNotes.push({ position: written[0].position, sign: signs[0], state: 'correct' });
    }
  } else {
    staffNotes = written.map((w, i) => {
      const r = results[i];
      return {
        position: w.position,
        sign: signs[i],
        state: r ? (r.correct ? 'correct' : 'wrong') : !answered && !single && i === cursor ? 'current' : 'live',
        label: !single && r ? nameOf(items[i].midi) : undefined,
      };
    });
  }

  const nudge = (d: number) => {
    playClickSound(); haptic.tap();
    setPlacement((p) => {
      const base = p ?? { position: 4, sign: '' as StaffSign };
      return { ...base, position: Math.max(span.min - 3, Math.min(span.max + 3, base.position + d)) };
    });
  };
  const chooseSign = (s: StaffSign) => {
    playClickSound(); haptic.tap();
    setPlacement((p) => ({ position: p?.position ?? 4, sign: p?.sign === s ? '' : s }));
  };
  const checkPlacement = () => {
    if (!placement) return;
    playClickSound();
    engine.answerPitch(writtenMidiAt(placement.position, spec.clef, placement.sign, keyId) - spec.writtenShift);
  };
  const signChoices: Exclude<StaffSign, ''>[] = keyId === 'C' ? ['#', 'b'] : ['#', 'b', 'n'];

  const goalPct = dailyGoal.target > 0 ? Math.min(100, Math.round((dailyGoal.completed / dailyGoal.target) * 100)) : 0;
  const goalDone = dailyGoal.completed >= dailyGoal.target;
  const goalBar = (
    <div className="teacher-goal staff-goal">
      <div className="teacher-goal-bar" aria-hidden="true">
        <span className="teacher-goal-fill" style={{ width: `${goalPct}%` }} />
      </div>
      <span className="teacher-goal-label">
        {t('Daily goal')}: {dailyGoal.completed}/{dailyGoal.target}{goalDone ? ' ✓' : ''}
      </span>
    </div>
  );

  const phraseScore = results.filter((r) => r?.correct).length;

  return (
    <div className="app settings-page lp-page interval-home">
      {showMenuButton && (
        <button
          className="burger-btn"
          onClick={() => { playClickSound(); haptic.tap(); onOpenMenu(); }}
          aria-label={t('Open settings')}
          title={t('Settings')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <rect x="3" y="5" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      )}
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <h1 className="interval-home-title">📖 {t('Staff reading')}</h1>

        <div className="settings-page-body">
          <ProGate
            feature="staffReading"
            variant="replace"
            pitch={t('Practise reading notes on the staff and finding them on the neck')}
          >
            {!running && (
              <div className="stats-tabs" role="group">
                <button
                  type="button"
                  className={`stats-tab${tab === 'practice' ? ' stats-tab-active' : ''}`}
                  onClick={() => { playClickSound(); haptic.tap(); setTab('practice'); }}
                >
                  {t('Practice')}
                </button>
                <button
                  type="button"
                  className={`stats-tab${tab === 'progress' ? ' stats-tab-active' : ''}`}
                  onClick={() => { playClickSound(); haptic.tap(); setTab('progress'); setNow(Date.now()); }}
                >
                  {t('Progress')}
                </button>
              </div>
            )}

            {!running && tab === 'practice' && (
              <div className="set-card scale-exercise-switcher staff-exercise-switcher" role="group" aria-label={t('Exercise')}>
                {EXERCISES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`set-card-btn${exercise === e ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={exercise === e}
                    onClick={() => setExercise(e)}
                  >
                    {t(EXERCISE_LABEL[e])}
                  </button>
                ))}
              </div>
            )}

            {!running && (
              <div className="set-card scale-position-switcher" role="group" aria-label={t('Range')}>
                <span className="set-card-label">{t('Range')}</span>
                <div className="scale-position-row">
                  {STAFF_RANGES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`set-card-btn${range === r ? ' set-card-btn-primary' : ''}`}
                      aria-pressed={range === r}
                      onClick={() => setRange(r)}
                    >
                      {rangeLabel(r)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!running && (
              <div className="set-card scale-position-switcher" role="group" aria-label={t('Key signature')}>
                <span className="set-card-label">{t('Key signature')}</span>
                <div className="scale-position-row staff-key-row">
                  {KEY_IDS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`set-card-btn${keyId === k ? ' set-card-btn-primary' : ''}`}
                      aria-pressed={keyId === k}
                      onClick={() => setKey(k)}
                    >
                      {keyLabel(k)}
                    </button>
                  ))}
                </div>
                {keyId !== 'C' && (
                  <p className="set-card-help">
                    {t('The signs at the start of the staff hold for every note on that letter, unless a note carries its own sign.')}
                  </p>
                )}
              </div>
            )}

            {!running && (
              <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Notes')}>
                <span className="set-card-label">{t('Notes')}</span>
                <div className="scale-difficulty-row">
                  <button
                    type="button"
                    className={`set-card-btn${inKeyOnly ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={inKeyOnly}
                    onClick={() => setInKeyOnly(true)}
                  >
                    {keyId === 'C' ? t('Natural notes only') : t('Notes of the key only')}
                  </button>
                  <button
                    type="button"
                    className={`set-card-btn${!inKeyOnly ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={!inKeyOnly}
                    onClick={() => setInKeyOnly(false)}
                  >
                    {keyId === 'C' ? t('With sharps and flats') : t('With accidentals')}
                  </button>
                </div>
              </div>
            )}

            {!running && tab === 'practice' && (exercise === 'nameNote' || exercise === 'readPhrase') && pitch.supported && (
              <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Answer mode')}>
                <span className="set-card-label">{t('Answer mode')}</span>
                <div className="scale-difficulty-row">
                  <button
                    type="button"
                    className={`set-card-btn${!guitarAnswer ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={!guitarAnswer}
                    onClick={() => setGuitarAnswer(false)}
                  >
                    {t('Tap')}
                  </button>
                  <button
                    type="button"
                    className={`set-card-btn${guitarAnswer ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={guitarAnswer}
                    onClick={() => setGuitarAnswer(true)}
                  >
                    🎸 {t('Guitar')}
                  </button>
                </div>
                {guitarAnswer && (
                  <p className="set-card-help">
                    {t('Play it on your guitar instead of naming it — the app listens through the microphone. Play the exact note you see, including its octave: that’s what this exercise is testing. Tapping still works.')}
                  </p>
                )}
              </div>
            )}

            {!running && tab === 'progress' && (
              <div className="set-card">
                <StaffProgressBoard
                  items={boardItems}
                  spec={spec}
                  keyId={keyId}
                  spelling={spelling}
                  notation={notation}
                />
              </div>
            )}

            {!running && tab === 'practice' && !finished && (
              <div className="set-card">
                <p className="set-card-help">{t(EXERCISE_HELP[exercise])}</p>
                <p className="set-card-help">{clefHelp}</p>
                {goalBar}
                <button type="button" className="set-card-btn set-card-btn-primary" onClick={startSession}>
                  {t('Start')}
                </button>
              </div>
            )}

            {running && question && (
              <div className="set-card staff-card">
                <p className="set-card-help">
                  {exercise === 'readPhrase' ? t('Phrase') : t('Question')} {engine.questionNumber} / {engine.questionCount}
                  {' · '}{t('Score')}: {engine.session.score}
                </p>

                {guitarAnswer && pitch.supported && (exercise === 'nameNote' || exercise === 'readPhrase') && (
                  <span className={`voice-status guitar-status guitar-${pitch.status}`} role="status" aria-live="polite">
                    {pitch.error === 'no-permission'
                      ? t('🎸 Microphone blocked — enable it or switch to tap')
                      : pitch.error === 'not-supported' || !pitch.supported
                        ? t('🎸 Pitch detection isn’t available on this device — use tap')
                        : pitch.status === 'listening'
                          ? `🎸 ${t('Listening…')}${pitch.partial ? ` “${pitch.partial}”` : ''}`
                          : exercise === 'readPhrase' ? t('🎸 Play the phrase on your guitar') : t('🎸 Play the note on your guitar')}
                    {pitch.status === 'error' && (
                      <button type="button" className="clear-btn voice-retry" onClick={() => { playClickSound(); haptic.tap(); pitch.retry(); }}>
                        {t('Retry')}
                      </button>
                    )}
                  </span>
                )}

                {exercise === 'findOnStaff' && (
                  <StaffNeckBoard
                    bottomFret={bottomFret}
                    topFret={topFret}
                    noteTable={instrument.notes}
                    stringCount={instrument.stringCount}
                    minFrets={instrument.minFrets}
                    reveal={null}
                    tapped={null}
                    marked={question.marked}
                    accidental={accidental}
                    notation={notation}
                  />
                )}

                <StaffNotation
                  clef={spec.clef}
                  octaveMark={spec.octaveMark}
                  keySignature={keySignature}
                  notes={staffNotes}
                  span={span}
                  slots={exercise === 'findOnStaff' ? 2 : 1}
                  endBar={exercise === 'readPhrase'}
                  label={exercise === 'findOnStaff' ? t('Tap the staff where the note is written') : t('A note on the staff')}
                  onPickPosition={exercise === 'findOnStaff' && !answered
                    ? (position) => setPlacement((p) => ({ position, sign: p?.sign ?? '' }))
                    : undefined}
                />

                {/* Always rendered, so the answer appearing never shifts the board. */}
                <p className="staff-answer" aria-live="polite">
                  {answered && (single
                    ? <>{singleCorrect ? '✓ ' : '✗ '}{nameOf(items[0].midi)}</>
                    : <>{phraseScore === items.length ? '✓ ' : ''}{phraseScore}/{items.length}</>)}
                </p>

                {exercise === 'findOnStaff' && (
                  <div className="staff-place-controls">
                    <button type="button" className="set-card-btn" onClick={() => nudge(1)} disabled={answered} aria-label={t('Up')}>▲</button>
                    <button type="button" className="set-card-btn" onClick={() => nudge(-1)} disabled={answered} aria-label={t('Down')}>▼</button>
                    {!inKeyOnly && signChoices.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`set-card-btn staff-sign-btn${placement?.sign === s ? ' set-card-btn-primary' : ''}`}
                        aria-pressed={placement?.sign === s}
                        onClick={() => chooseSign(s)}
                        disabled={answered}
                      >
                        {SIGN_LABEL[s]}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="set-card-btn set-card-btn-primary"
                      onClick={checkPlacement}
                      disabled={answered || !placement}
                    >
                      {t('Check')}
                    </button>
                  </div>
                )}

                {(exercise === 'nameNote' || exercise === 'readPhrase') && (
                  <IntervalChoiceRow
                    variant="note"
                    options={staffNameOptions(inKeyOnly, keyId).map((n) => ({
                      value: n,
                      label: displayNote(n, spelling, notation),
                    }))}
                    onSelect={engine.selectName}
                    correct={single && answered ? pitchClassName(items[0].midi) : null}
                    wrong={single && results[0]?.picked != null && !singleCorrect ? results[0].picked : null}
                    disabled={answered}
                    dir={lang === 'he' ? 'rtl' : undefined}
                  />
                )}

                {exercise === 'findOnNeck' && (
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

                <button
                  type="button"
                  className="set-card-btn"
                  onClick={() => { playClickSound(); haptic.tap(); engine.stop(); }}
                >
                  {t('Stop')}
                </button>
              </div>
            )}

            {!running && tab === 'practice' && finished && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('Session complete!')} {t('Score')}: {engine.session.score}
                </p>
                {goalBar}
                <button type="button" className="set-card-btn set-card-btn-primary" onClick={startSession}>
                  {t('Practice again')}
                </button>
              </div>
            )}
          </ProGate>
        </div>
      </div>
    </div>
  );
}
