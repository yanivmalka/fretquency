// ── TabPracticeScreen — the "Tab reading" second home screen ─────────────
//
// tab-reading-spec.md. One of the Learn drawer's domains, styled like
// StaffPracticeScreen (a second home screen, no Back row — the hamburger
// drawer is the only way off). Premium-only: the host mounts it behind
// `can('tabReading', tier)` and it is wrapped in <ProGate> as a second line
// of defence.
//
// Self-contained like Staff reading: it runs the shared reading engine
// (`useReadingEngine`) and owns its start / running / summary states, plus a
// Progress tab. Every answer folds into the tab lane of the learning state
// (`tabSrs` / `tabHistory` / `tabDaily`), which steers what comes next, and
// is pushed to the cloud like the rest of the learning blob.
//
// Three topics, each with its own exercises:
//   • single notes — name the note / find it on the neck / write it in tab /
//                    read a riff (Slice 1);
//   • chords       — name the chord a column spells / play it on the neck;
//   • techniques   — say what a symbol means (h, p, /, \, b, ~, x, PM) /
//                    name the note heard at its end (Slice 2).
// Four fret ranges and natural notes only or every note apply to all of
// them. Note and chord names follow the app-wide sharps/flats and notation
// settings.
//
// The tab is drawn the way every real tab is — thinnest string on the top
// line — while the neck board keeps the app's lowest-string-on-top layout.
// The screen says so in one line, because that flip is exactly what a
// beginner gets wrong.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { useReadingEngine, type ReadingAnswer, type ReadingQuestion } from '../hooks/useReadingEngine';
import { usePitchStream } from '../hooks/usePitchStream';
import {
  buildTabPool, buildTabRiff, pickTabQuestion, tabBottomFret, tabNameOptions, tabTopFret,
  TAB_RANGES, type TabPoolItem, type TabRange,
} from '../learning/tabDrill';
import {
  buildTabChordPool, chordQualitiesFor, chordsRootInBass, chordShapeLabel, CHORD_SUFFIX,
  type ChordQuality, type TabChordItem,
} from '../learning/tabChords';
import { buildTechniqueQuestion, tabTechniquePool, type TabTechniqueItem } from '../learning/tabTechniques';
import { tabTechniqueItemId, type TabTechnique } from '../learning/tabItem';
import { buildTabBoard, tabItemStatuses } from '../learning/tabMastery';
import type { SrsMap } from '../learning/srs';
import type { StaffPosition } from '../learning/staffDrill';
import { pitchClassName } from '../utils/staff';
import {
  loadLearningState, saveLearningStateLocal, getInstrumentState, withInstrumentState, recordTabAnswer,
  rollDailyGoal, type TabForm,
} from '../learning/learningState';
import { cloudPushLearning } from '../learning/learningSync';
import { recordDailyActivity } from '../utils/dailyActivity';
import { recordLeagueActivity } from '../utils/leagueActivity';
import TabNotation, { type TabNote } from './TabNotation';
import StaffNeckBoard from './StaffNeckBoard';
import TabProgressBoard, { TabStatusList } from './TabProgressBoard';
import IntervalChoiceRow from './IntervalChoiceRow';
import { ProGate } from './ProGate';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { loadSetting, saveSetting } from '../utils/settings';
import { playClickSound, haptic } from '../utils/feedback';
import { playChordStrum, playNoteGlide, playNoteSequence, playNoteSingle } from '../utils/audio';

interface Props {
  instrument: InstrumentConfig;
  accidental: AccidentalMode;
  notation: NotationMode;
  /** Whether the hamburger button is shown — hidden while the drawer is open. */
  showMenuButton?: boolean;
  /** Open the hamburger drawer (the host owns the drawer state + nav). */
  onOpenMenu: () => void;
}

type TabExercise = TabForm;
type TabTopic = 'notes' | 'chords' | 'techniques';
type TabItem = TabPoolItem | TabChordItem | TabTechniqueItem;
type TabQuestion = ReadingQuestion<TabItem>;

const TOPICS: readonly TabTopic[] = ['notes', 'chords', 'techniques'];
const TOPIC_EXERCISES: Record<TabTopic, readonly TabExercise[]> = {
  notes: ['nameNote', 'findOnNeck', 'writeTab', 'readRiff'],
  chords: ['nameChord', 'playChord'],
  techniques: ['nameTechnique', 'techniqueNote'],
};
const topicOf = (e: TabExercise): TabTopic =>
  TOPICS.find((t) => TOPIC_EXERCISES[t].includes(e)) ?? 'notes';

const QUESTION_COUNT: Record<TabExercise, number> = {
  nameNote: 12, findOnNeck: 12, writeTab: 12, readRiff: 6,
  nameChord: 10, playChord: 8, nameTechnique: 10, techniqueNote: 10,
};
const NOTES_PER_QUESTION: Record<TabExercise, number> = {
  nameNote: 1, findOnNeck: 1, writeTab: 1, readRiff: 5,
  nameChord: 1, playChord: 1, nameTechnique: 1, techniqueNote: 1,
};
/** Seconds per note (per chord / per symbol). */
const TIME_LIMIT: Record<TabExercise, number> = {
  nameNote: 10, findOnNeck: 12, writeTab: 20, readRiff: 8,
  nameChord: 15, playChord: 30, nameTechnique: 12, techniqueNote: 12,
};

// English literal = i18n key (app convention).
const TOPIC_LABEL: Record<TabTopic, string> = {
  notes: 'Single notes',
  chords: 'Chords',
  techniques: 'Techniques',
};
const EXERCISE_LABEL: Record<TabExercise, string> = {
  nameNote: 'Name the note',
  findOnNeck: 'Find it on the neck',
  writeTab: 'Write it in tab',
  readRiff: 'Read a riff',
  nameChord: 'Name the chord',
  playChord: 'Play the chord',
  nameTechnique: 'What does it mean?',
  techniqueNote: 'Which note do you hear at the end?',
};
const EXERCISE_HELP: Record<TabExercise, string> = {
  nameNote: 'A number is written on one line of the tab. Name the note it plays — you will hear it after you answer.',
  findOnNeck: 'A number is written on one line of the tab. Tap that exact place on the neck: the line is the string, the number is the fret.',
  writeTab: 'A place on the neck is marked. Tap the tab line of its string, pick the fret number, then press Check.',
  readRiff: 'A short riff is written in the tab. Name its notes one after another — at the end you will hear it.',
  nameChord: 'A chord is written in the tab: the numbers in one column are played together, and a line with no number is not played. Name the chord — you will hear it after you answer.',
  playChord: 'A chord is written in the tab. Tap every place it plays on the neck, one per string, leave the strings with no number alone, then press Check.',
  nameTechnique: 'A playing technique is written in the tab. Say what the symbol means — you will hear it after you answer.',
  techniqueNote: 'A playing technique is written in the tab. Name the note that sounds at the end of it.',
};
const TECHNIQUE_LABEL: Record<TabTechnique, string> = {
  hammerOn: 'Hammer-on',
  pullOff: 'Pull-off',
  slideUp: 'Slide up',
  slideDown: 'Slide down',
  bend: 'Bend',
  vibrato: 'Vibrato',
  mutedNote: 'Muted note',
  palmMute: 'Palm mute',
};
const TECHNIQUE_SYMBOL: Record<TabTechnique, string> = {
  hammerOn: 'h', pullOff: 'p', slideUp: '/', slideDown: '\\', bend: 'b', vibrato: '~', mutedNote: 'x', palmMute: 'PM',
};
const TECHNIQUE_HELP: Record<TabTechnique, string> = {
  hammerOn: 'Hammer-on: pick the first note, then press the higher fret down hard without picking again.',
  pullOff: 'Pull-off: pick the first note, then pull that finger off so the lower fret sounds, without picking again.',
  slideUp: 'Slide up: pick the first note and slide the same finger up the string to the second fret.',
  slideDown: 'Slide down: pick the first note and slide the same finger down the string to the second fret.',
  bend: 'Bend: pick the note and push the string sideways until it sounds as high as the fret in the second number.',
  vibrato: 'Vibrato: let the note ring and shake its pitch slightly by moving the string.',
  mutedNote: 'Muted note: touch the string without pressing it down and pick — a short click with no pitch.',
  palmMute: 'Palm mute: rest the side of the picking hand on the strings by the bridge, for a short, muffled sound.',
};
const QUALITY_LABEL: Record<ChordQuality, string> = { major: 'Major', minor: 'Minor', dom7: '7', power: '5' };
const FIXED_RANGE_LABEL: Record<Exclude<TabRange, 'high'>, string> = {
  open: 'Frets 0–3',
  low: 'Frets 0–5',
  twelve: 'Frets 0–12',
};

function loadOneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const raw = loadSetting<string>(key, fallback);
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

const samePlace = (a: StaffPosition, b: StaffPosition) => a.string === b.string && a.fret === b.fret;

/** Play a technique the way it is written. */
function playTechnique(it: TabTechniqueItem) {
  const { string, from, to } = it;
  switch (it.technique) {
    case 'hammerOn':
    case 'pullOff':
      if (to != null) void playNoteSequence(string, [from, to], 520);
      return;
    case 'slideUp':
    case 'slideDown':
      if (to != null) void playNoteGlide(string, from, to, 200, 160);
      return;
    case 'bend':
      if (to != null) void playNoteGlide(string, from, to, 180, 260);
      return;
    case 'vibrato':
    case 'palmMute':
      void playNoteSingle(string, from);
      return;
    case 'mutedNote':
      return;
  }
}

interface Written { string: number | null; fret: number | null }
interface ChordPick { root?: string; quality?: ChordQuality }

export default function TabPracticeScreen({ instrument, accidental, notation, showMenuButton = true, onOpenMenu }: Props) {
  const { t, lang } = useTranslation();
  const [finished, setFinished] = useState(false);
  const [tab, setTab] = useState<'practice' | 'progress'>('practice');
  const [exercise, setExerciseState] = useState<TabExercise>(() => loadOneOf(
    'tab_exercise',
    TOPICS.flatMap((tp) => TOPIC_EXERCISES[tp]),
    'nameNote',
  ));
  const topic = topicOf(exercise);
  const [range, setRangeState] = useState<TabRange>(() => loadOneOf('tab_range', TAB_RANGES, 'open'));
  const [naturalsOnly, setNaturalsOnlyState] = useState<boolean>(() => loadSetting<boolean>('tab_naturalsOnly', true) !== false);
  const [guitarAnswer, setGuitarAnswerState] = useState<boolean>(() => loadSetting<boolean>('tab_guitarAnswer', false));
  // What the learner has entered for the current question, tagged with the
  // question it belongs to so a new question starts clean: a note written
  // in the tab, a chord name being picked, the places of a chord played.
  const [written, setWritten] = useState<{ q: TabQuestion; w: Written } | null>(null);
  const [chordPick, setChordPick] = useState<{ q: TabQuestion; p: ChordPick } | null>(null);
  const [played, setPlayed] = useState<{ q: TabQuestion; places: StaffPosition[] } | null>(null);
  // Bumped on every recorded answer and on a cloud reconcile, so the daily
  // goal and the Progress board re-read the learning state.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const reread = () => setNow(Date.now());
    window.addEventListener('learning-synced', reread);
    return () => window.removeEventListener('learning-synced', reread);
  }, []);

  const topFret = tabTopFret(range, instrument.maxFret);
  const bottomFret = tabBottomFret(range, instrument.maxFret);
  const inst = useMemo(
    () => ({ openMidi: instrument.openMidi, maxFret: instrument.maxFret, minFrets: instrument.minFrets }),
    [instrument.openMidi, instrument.maxFret, instrument.minFrets],
  );

  const pool = useMemo(() => buildTabPool(inst, range, naturalsOnly), [inst, range, naturalsOnly]);
  const chordPool = useMemo(
    () => buildTabChordPool(inst, instrument.id, range, naturalsOnly),
    [inst, instrument.id, range, naturalsOnly],
  );
  const qualities = chordQualitiesFor(instrument.id);
  const techniques = useMemo(
    () => tabTechniquePool(inst, range, exercise === 'techniqueNote'),
    [inst, range, exercise],
  );

  const instState = useMemo(
    () => getInstrumentState(loadLearningState(now), instrument.id, now),
    [instrument.id, now],
  );
  const dailyGoal = rollDailyGoal(instState.tabDaily, now, instState.tabDaily.target);
  const boardItems = useMemo(
    () => buildTabBoard(pool, instState.tabSrs, instState.tabHistory, now),
    [pool, instState, now],
  );

  const getSrs = useCallback(() => {
    const ts = Date.now();
    return getInstrumentState(loadLearningState(ts), instrument.id, ts).tabSrs;
  }, [instrument.id]);

  const recordAnswer = useCallback((a: ReadingAnswer<TabExercise>) => {
    const ts = Date.now();
    const state = loadLearningState(ts);
    const st = getInstrumentState(state, instrument.id, ts);
    const next = recordTabAnswer(st, a.itemId, a.form, a.correct, a.seconds, ts);
    saveLearningStateLocal(withInstrumentState(state, instrument.id, next));
    // A no-op for a guest / offline; the reconcile merges per item.
    cloudPushLearning();
    setNow(ts);
    recordDailyActivity();
    // Tab reading is its own isolated SRS/history, never Practice's real
    // history — without this, a week spent only on Tab reading would never
    // move the player's weekly league XP (leagueActivity.ts).
    if (a.correct) recordLeagueActivity(instrument.id);
  }, [instrument.id]);

  const notesPerQuestion = NOTES_PER_QUESTION[exercise];
  const pickItems = useCallback((srs: SrsMap, previous: TabItem | null, ts: number): TabItem[] => {
    const previousId = previous?.itemId ?? null;
    if (topic === 'chords') {
      return [pickTabQuestion(chordPool, srs, previousId, ts)].filter((q): q is TabChordItem => q != null);
    }
    if (topic === 'techniques') {
      const entries = techniques.map((tech) => ({ itemId: tabTechniqueItemId(tech), tech }));
      const pick = pickTabQuestion(entries, srs, previousId, ts);
      if (!pick) return [];
      const naturals = naturalsOnly && exercise === 'techniqueNote';
      const q = buildTechniqueQuestion(inst, range, pick.tech, naturals)
        ?? buildTechniqueQuestion(inst, range, pick.tech, false);
      return q ? [q] : [];
    }
    const notes = pool;
    return notesPerQuestion > 1
      ? buildTabRiff(notes, srs, notesPerQuestion, previousId, ts)
      : [pickTabQuestion(notes, srs, previousId, ts)].filter((q): q is TabPoolItem => q != null);
  }, [topic, exercise, chordPool, techniques, naturalsOnly, inst, range, pool, notesPerQuestion]);

  const engine = useReadingEngine<TabExercise, TabItem>({
    exercise,
    pickItems,
    openMidi: instrument.openMidi,
    questionCount: QUESTION_COUNT[exercise],
    notesPerQuestion,
    timeLimit: TIME_LIMIT[exercise],
    markPosition: exercise === 'writeTab',
    exactPosition: true,
    getSrs,
    onComplete: () => setFinished(true),
    onAnswer: recordAnswer,
  });
  const { running, question, cursor, results, answered } = engine;

  // Answer by playing: a note heard on the guitar goes to the engine like a
  // name pick. A tab item is a place, not just a pitch — a played note can't
  // say which string it came from, so this only applies to the "notes" topic
  // exercises that are judged by name (not findOnNeck/writeTab, which already
  // ask for the place itself).
  const pitch = usePitchStream({
    enabled: guitarAnswer && (exercise === 'nameNote' || exercise === 'readRiff') && running,
    onNote: engine.hear,
  });

  const current: Written = written && written.q === question ? written.w : { string: null, fret: null };
  const write = (patch: Partial<Written>) => {
    if (!question || answered) return;
    setWritten({ q: question, w: { ...current, ...patch } });
  };
  const pickedChord: ChordPick = chordPick && chordPick.q === question ? chordPick.p : {};
  const playedPlaces: StaffPosition[] = played && played.q === question ? played.places : [];

  const pick = (fn: () => void) => {
    if (running) return;
    playClickSound(); haptic.tap();
    fn();
    setFinished(false);
  };
  const setExercise = (e: TabExercise) => pick(() => {
    setExerciseState(e);
    saveSetting('tab_exercise', e);
    saveSetting(`tab_exercise_${topicOf(e)}`, e);
  });
  const setTopic = (tp: TabTopic) => {
    if (tp === topic) return;
    setExercise(loadOneOf(`tab_exercise_${tp}`, TOPIC_EXERCISES[tp], TOPIC_EXERCISES[tp][0]));
  };
  const setRange = (r: TabRange) => pick(() => { setRangeState(r); saveSetting('tab_range', r); });
  const setNaturalsOnly = (v: boolean) => pick(() => { setNaturalsOnlyState(v); saveSetting('tab_naturalsOnly', v); });
  const setGuitarAnswer = (v: boolean) => {
    playClickSound(); haptic.tap();
    setGuitarAnswerState(v);
    saveSetting('tab_guitarAnswer', v);
  };

  const startSession = () => {
    playClickSound(); haptic.tap();
    setFinished(false);
    engine.start();
  };

  const nameOf = (midi: number) => displayNote(pitchClassName(midi), accidental, notation);
  const chordLabel = (c: Pick<TabChordItem, 'rootPc' | 'quality'>) =>
    `${displayNote(pitchClassName(c.rootPc), accidental, notation)}${CHORD_SUFFIX[c.quality]}`;
  const techniqueLabel = (tech: TabTechnique) => `${TECHNIQUE_SYMBOL[tech]} · ${t(TECHNIQUE_LABEL[tech])}`;
  const stringNames = Array.from(
    { length: instrument.stringCount },
    (_, i) => displayNote(instrument.notes[i]?.[0] ?? '', accidental, notation),
  );
  // Real tabs write the top string in lower case when it shares its name
  // with the bottom one (e … E), so the two lines never read alike.
  if (stringNames.length > 1 && stringNames[0] === stringNames[stringNames.length - 1]) {
    stringNames[0] = stringNames[0].toLowerCase();
  }
  const rangeLabel = (r: TabRange) => r === 'high'
    // Isolated LTR, so "12–21" never reads backwards on a Hebrew page.
    ? `${t('Frets')} ⁦${tabBottomFret('high', instrument.maxFret)}–${instrument.maxFret}⁩`
    : t(FIXED_RANGE_LABEL[r]);

  // ── The tab for the current question ────────────────────────────────
  const items = question?.items ?? [];
  const first = items[0];
  const single = items.length === 1;
  const singleCorrect = single && results[0]?.correct === true;
  const chord = first?.kind === 'chord' ? first : null;
  const technique = first?.kind === 'technique' ? first : null;
  const liveState = !answered ? 'live' : singleCorrect ? 'correct' : 'wrong';

  let tabNotes: TabNote[] = [];
  if (exercise === 'writeTab') {
    if (current.string != null) {
      tabNotes.push({
        cells: [{ string: current.string, text: current.fret == null ? '?' : String(current.fret) }],
        state: !answered ? 'ghost' : singleCorrect ? 'correct' : 'wrong',
      });
    }
    if (answered && !singleCorrect && first?.kind === 'note') {
      tabNotes.push({ cells: [{ string: first.string, text: String(first.fret) }], state: 'correct' });
    }
  } else if (chord) {
    tabNotes = [{
      cells: chord.frets.flatMap((f, i) => (f == null ? [] : [{ string: i + 1, text: String(f) }])),
      state: liveState,
    }];
  } else if (technique) {
    tabNotes = [{
      cells: [{ string: technique.string, text: technique.text }],
      above: technique.above,
      state: liveState,
    }];
  } else {
    tabNotes = items.flatMap((it, i) => {
      if (it.kind !== 'note') return [];
      const r = results[i];
      return [{
        cells: [{ string: it.string, text: String(it.fret) }],
        state: r ? (r.correct ? 'correct' : 'wrong') : !answered && !single && i === cursor ? 'current' : 'live',
        label: !single && r ? nameOf(it.midi) : undefined,
      } as TabNote];
    });
  }

  const fretChoices: number[] = [];
  for (let f = bottomFret; f <= topFret; f++) fretChoices.push(f);
  const checkWritten = () => {
    if (current.string == null || current.fret == null) return;
    playClickSound();
    engine.answerPosition(current.string, current.fret);
  };

  // ── Chords ───────────────────────────────────────────────────────────
  const chooseChord = (patch: ChordPick) => {
    if (!question || !chord || answered) return;
    const next: ChordPick = { ...pickedChord, ...patch };
    if (qualities.length === 1) next.quality = qualities[0];
    setChordPick({ q: question, p: next });
    if (next.root != null && next.quality != null) {
      const correct = next.root === pitchClassName(chord.rootPc) && next.quality === chord.quality;
      void playChordStrum(chord.positions);
      engine.answerWith(correct, `${next.root}|${next.quality}`);
    }
  };
  const tapChordPlace = (string: number, fret: number) => {
    if (!question || answered) return;
    void playNoteSingle(string, fret);
    const exists = playedPlaces.some((p) => p.string === string && p.fret === fret);
    // One place per string: a new tap on a string replaces its old one.
    const places = exists
      ? playedPlaces.filter((p) => !(p.string === string && p.fret === fret))
      : [...playedPlaces.filter((p) => p.string !== string), { string, fret }];
    setPlayed({ q: question, places });
  };
  const checkChord = () => {
    if (!chord || answered || playedPlaces.length === 0) return;
    playClickSound();
    const correct = playedPlaces.length === chord.positions.length
      && chord.positions.every((p) => playedPlaces.some((q) => samePlace(p, q)));
    void playChordStrum(chord.positions);
    engine.answerWith(correct);
  };

  // ── Techniques ───────────────────────────────────────────────────────
  const chooseTechnique = (value: string) => {
    if (!technique || answered) return;
    playTechnique(technique);
    engine.answerWith(value === technique.technique, value);
  };
  const chooseTechniqueNote = (value: string) => {
    if (!technique || answered) return;
    playTechnique(technique);
    engine.answerWith(value === pitchClassName(technique.midi), value);
  };

  // ── Progress ─────────────────────────────────────────────────────────
  const chordStatuses = useMemo(
    () => tabItemStatuses(chordPool.map((c) => c.itemId), instState.tabSrs, instState.tabHistory, now),
    [chordPool, instState, now],
  );
  const techniqueStatuses = useMemo(
    () => tabItemStatuses(techniques.map(tabTechniqueItemId), instState.tabSrs, instState.tabHistory, now),
    [techniques, instState, now],
  );

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

  const riffScore = results.filter((r) => r?.correct).length;
  const orientationHelp = t('In a tab the top line is the thinnest, highest string and the bottom line the thickest — upside down from the neck in this app, where the thickest string is on top.');
  const unavailable = topic === 'chords' && chordPool.length === 0;
  const pickedParts = (results[0]?.picked ?? '').split('|');

  let answerText: React.ReactNode = null;
  if (answered && first) {
    const mark = singleCorrect ? '✓ ' : '✗ ';
    if (!single) answerText = <>{riffScore === items.length ? '✓ ' : ''}{riffScore}/{items.length}</>;
    else if (chord) answerText = <>{mark}<bdi dir="ltr">{chordLabel(chord)}</bdi></>;
    else if (technique && exercise === 'nameTechnique') answerText = <>{mark}{t(TECHNIQUE_LABEL[technique.technique])}</>;
    else answerText = <>{mark}{nameOf(first.midi)}</>;
  }

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
        <h1 className="interval-home-title">📝 {t('Tab reading')}</h1>

        <div className="settings-page-body">
          <ProGate
            feature="tabReading"
            variant="replace"
            pitch={t('Practise reading tabs and finding every number on the neck')}
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

            {!running && (
              <div className="set-card scale-position-switcher" role="group" aria-label={t('Topic')}>
                <span className="set-card-label">{t('Topic')}</span>
                <div className="scale-position-row">
                  {TOPICS.map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      className={`set-card-btn${topic === tp ? ' set-card-btn-primary' : ''}`}
                      aria-pressed={topic === tp}
                      onClick={() => setTopic(tp)}
                    >
                      {t(TOPIC_LABEL[tp])}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!running && tab === 'practice' && (
              <div className="set-card scale-exercise-switcher staff-exercise-switcher" role="group" aria-label={t('Exercise')}>
                {TOPIC_EXERCISES[topic].map((e) => (
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
                  {TAB_RANGES.map((r) => (
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
              <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Notes')}>
                <span className="set-card-label">{t('Notes')}</span>
                <div className="scale-difficulty-row">
                  <button
                    type="button"
                    className={`set-card-btn${naturalsOnly ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={naturalsOnly}
                    onClick={() => setNaturalsOnly(true)}
                  >
                    {t('Natural notes only')}
                  </button>
                  <button
                    type="button"
                    className={`set-card-btn${!naturalsOnly ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={!naturalsOnly}
                    onClick={() => setNaturalsOnly(false)}
                  >
                    {t('With sharps and flats')}
                  </button>
                </div>
              </div>
            )}

            {!running && tab === 'practice' && (exercise === 'nameNote' || exercise === 'readRiff') && pitch.supported && (
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
                    {t('Play it on your guitar instead of naming it — the app listens through the microphone. A pitch can’t say which string it came from, so any place that plays the right note counts — an octave either way too. Tapping still works.')}
                  </p>
                )}
              </div>
            )}

            {!running && tab === 'progress' && (
              <div className="set-card">
                {topic === 'notes' && (
                  <TabProgressBoard
                    items={boardItems}
                    bottomFret={bottomFret}
                    topFret={topFret}
                    noteTable={instrument.notes}
                    stringCount={instrument.stringCount}
                    accidental={accidental}
                    notation={notation}
                  />
                )}
                {topic === 'chords' && (unavailable
                  ? <p className="set-card-help">{t('Chords in tab are not available for this instrument yet.')}</p>
                  : (
                    <TabStatusList
                      heading={t('Chords mastered')}
                      items={chordPool.map((c, i) => ({
                        key: c.itemId,
                        label: chordLabel(c),
                        sub: chordShapeLabel(c),
                        status: chordStatuses[i].status,
                      }))}
                    />
                  ))}
                {topic === 'techniques' && (
                  <TabStatusList
                    heading={t('Symbols mastered')}
                    items={techniques.map((tech, i) => ({
                      key: tech,
                      label: TECHNIQUE_SYMBOL[tech],
                      sub: t(TECHNIQUE_LABEL[tech]),
                      status: techniqueStatuses[i].status,
                    }))}
                  />
                )}
              </div>
            )}

            {!running && tab === 'practice' && !finished && (
              <div className="set-card">
                <p className="set-card-help">{t(EXERCISE_HELP[exercise])}</p>
                {topic === 'chords' && !unavailable && chordsRootInBass(instrument.id) && (
                  <p className="set-card-help">{t('The lowest note of these chords is the root, the note the chord is named after.')}</p>
                )}
                <p className="set-card-help">{orientationHelp}</p>
                {unavailable ? (
                  <p className="set-card-help">{t('Chords in tab are not available for this instrument yet.')}</p>
                ) : (
                  <>
                    {goalBar}
                    <button type="button" className="set-card-btn set-card-btn-primary" onClick={startSession}>
                      {t('Start')}
                    </button>
                  </>
                )}
              </div>
            )}

            {running && question && (
              <div className="set-card staff-card">
                <p className="set-card-help">
                  {exercise === 'readRiff' ? t('Riff') : t('Question')} {engine.questionNumber} / {engine.questionCount}
                  {' · '}{t('Score')}: {engine.session.score}
                </p>

                {guitarAnswer && pitch.supported && (exercise === 'nameNote' || exercise === 'readRiff') && (
                  <span className={`voice-status guitar-status guitar-${pitch.status}`} role="status" aria-live="polite">
                    {pitch.error === 'no-permission'
                      ? t('🎸 Microphone blocked — enable it or switch to tap')
                      : pitch.error === 'not-supported' || !pitch.supported
                        ? t('🎸 Pitch detection isn’t available on this device — use tap')
                        : pitch.status === 'listening'
                          ? `🎸 ${t('Listening…')}${pitch.partial ? ` “${pitch.partial}”` : ''}`
                          : exercise === 'readRiff' ? t('🎸 Play the riff on your guitar') : t('🎸 Play the note on your guitar')}
                    {pitch.status === 'error' && (
                      <button type="button" className="clear-btn voice-retry" onClick={() => { playClickSound(); haptic.tap(); pitch.retry(); }}>
                        {t('Retry')}
                      </button>
                    )}
                  </span>
                )}

                {exercise === 'writeTab' && (
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

                <TabNotation
                  stringNames={stringNames}
                  notes={tabNotes}
                  slots={exercise === 'writeTab' ? 2 : 1}
                  endBar={exercise === 'readRiff'}
                  selectedString={exercise === 'writeTab' && !answered ? current.string : null}
                  label={exercise === 'writeTab' ? t('Tap the tab line of the string') : t('A number on the tab')}
                  onPickString={exercise === 'writeTab' && !answered
                    ? (s) => { playClickSound(); haptic.tap(); write({ string: s }); }
                    : undefined}
                />

                {/* Always rendered, so the answer appearing never shifts the board. */}
                <p className="staff-answer" aria-live="polite">{answerText}</p>

                {technique && answered && (
                  <p className="set-card-help tab-technique-help">
                    <bdi dir="ltr">{technique.text}</bdi> — {t(TECHNIQUE_HELP[technique.technique])}
                  </p>
                )}

                {exercise === 'writeTab' && (
                  <>
                    <div className="tab-fret-row" role="group" aria-label={t('Fret')} dir="ltr">
                      {fretChoices.map((f) => (
                        <button
                          key={f}
                          type="button"
                          className={`set-card-btn tab-fret-btn${current.fret === f ? ' set-card-btn-primary' : ''}`}
                          aria-pressed={current.fret === f}
                          onClick={() => { playClickSound(); haptic.tap(); write({ fret: f }); }}
                          disabled={answered}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="staff-place-controls">
                      <button
                        type="button"
                        className="set-card-btn set-card-btn-primary"
                        onClick={checkWritten}
                        disabled={answered || current.string == null || current.fret == null}
                      >
                        {t('Check')}
                      </button>
                    </div>
                  </>
                )}

                {(exercise === 'nameNote' || exercise === 'readRiff') && (
                  <IntervalChoiceRow
                    variant="note"
                    options={tabNameOptions(naturalsOnly).map((n) => ({
                      value: n,
                      label: displayNote(n, accidental, notation),
                    }))}
                    onSelect={engine.selectName}
                    correct={single && answered && first ? pitchClassName(first.midi) : null}
                    wrong={single && results[0]?.picked != null && !singleCorrect ? results[0].picked : null}
                    disabled={answered}
                    dir={lang === 'he' ? 'rtl' : undefined}
                  />
                )}

                {exercise === 'findOnNeck' && first && (
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

                {exercise === 'nameChord' && chord && (
                  <>
                    <IntervalChoiceRow
                      variant="note"
                      options={tabNameOptions(naturalsOnly).map((n) => ({
                        value: n,
                        label: displayNote(n, accidental, notation),
                      }))}
                      onSelect={(v) => chooseChord({ root: v })}
                      correct={answered ? pitchClassName(chord.rootPc) : null}
                      selected={answered ? null : pickedChord.root ?? null}
                      wrong={answered && pickedParts[0] && pickedParts[0] !== pitchClassName(chord.rootPc) ? pickedParts[0] : null}
                      disabled={answered}
                      dir={lang === 'he' ? 'rtl' : undefined}
                    />
                    {qualities.length > 1 && (
                      <IntervalChoiceRow
                        variant="interval"
                        options={qualities.map((q) => ({ value: q, label: t(QUALITY_LABEL[q]) }))}
                        onSelect={(v) => chooseChord({ quality: v as ChordQuality })}
                        correct={answered ? chord.quality : null}
                        selected={answered ? null : pickedChord.quality ?? null}
                        wrong={answered && pickedParts[1] && pickedParts[1] !== chord.quality ? pickedParts[1] : null}
                        disabled={answered}
                        dir={lang === 'he' ? 'rtl' : undefined}
                      />
                    )}
                  </>
                )}

                {exercise === 'playChord' && chord && (
                  <>
                    <StaffNeckBoard
                      bottomFret={bottomFret}
                      topFret={topFret}
                      noteTable={instrument.notes}
                      stringCount={instrument.stringCount}
                      minFrets={instrument.minFrets}
                      reveal={answered ? chord.positions : null}
                      tapped={null}
                      selected={answered ? [] : playedPlaces}
                      wrong={answered ? playedPlaces.filter((p) => !chord.positions.some((q) => samePlace(p, q))) : []}
                      accidental={accidental}
                      notation={notation}
                      onTap={tapChordPlace}
                    />
                    <div className="staff-place-controls">
                      <button
                        type="button"
                        className="set-card-btn set-card-btn-primary"
                        onClick={checkChord}
                        disabled={answered || playedPlaces.length === 0}
                      >
                        {t('Check')}
                      </button>
                    </div>
                  </>
                )}

                {exercise === 'nameTechnique' && technique && (
                  <IntervalChoiceRow
                    variant="scale"
                    options={techniques.map((tech) => ({ value: tech, label: techniqueLabel(tech) }))}
                    onSelect={chooseTechnique}
                    correct={answered ? technique.technique : null}
                    wrong={answered && results[0]?.picked != null && !singleCorrect ? results[0].picked : null}
                    disabled={answered}
                    dir={lang === 'he' ? 'rtl' : undefined}
                  />
                )}

                {exercise === 'techniqueNote' && technique && (
                  <IntervalChoiceRow
                    variant="note"
                    options={tabNameOptions(naturalsOnly).map((n) => ({
                      value: n,
                      label: displayNote(n, accidental, notation),
                    }))}
                    onSelect={chooseTechniqueNote}
                    correct={answered ? pitchClassName(technique.midi) : null}
                    wrong={answered && results[0]?.picked != null && !singleCorrect ? results[0].picked : null}
                    disabled={answered}
                    dir={lang === 'he' ? 'rtl' : undefined}
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
