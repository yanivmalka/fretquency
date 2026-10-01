// ── ScalePracticeScreen — the "Scales" second home screen ───────────────
//
// One of the learning-type tabs from the drawer's "Learn" group, styled like
// IntervalPracticeScreen (a second home screen, no Back row — the hamburger
// drawer is the only way off). Premium-only: the host mounts it behind
// `can('scaleDrill', tier)` and it is wrapped in <ProGate> as a second line
// of defence.
//
// Unlike Intervals, this screen does NOT hand a `DrillConfig` back to the
// host's shared `useGameEngine` — every exercise runs on its own dedicated
// engine (`useScaleFallEngine` for Exercise A — full-screen Piano Tiles, see
// its header comment — `useScaleOrderEngine` for "Tap the scale in order",
// `useScaleChipEngine` for B and C — see
// their header comments for why: the shared engine's byNote flow can't
// answer a multi-string, multi-note-name shape, and Scales is already a
// sibling domain with its own everything, scales-learning-spec.md §0). So
// this screen owns its own start/running/summary states instead of
// delegating the run back up.
//
// Slice 1 (scales-learning-spec.md §4.2): Minor Pentatonic only. Picks
// (exercise/position/difficulty) + persistence + the derived pool/envelope
// come from `useScaleSelector` (§5.1/§5.3/§5.4); §5.2 "scale selection" is
// deliberately not built yet — see that hook's header comment for why it's
// meaningless while only one scale type is shipped. This screen still only
// renders a minimal segmented-button UI for each control, not the richer
// `IntervalSelectorPanel`-style layout Intervals uses — good enough while
// there's one scale type and two positions.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { useScaleFallEngine, type ScaleFallAnswer } from '../hooks/useScaleFallEngine';
import { useScaleChipEngine, type ScaleChipAnswer } from '../hooks/useScaleChipEngine';
import { useScaleOrderEngine, type ScaleOrderAnswer } from '../hooks/useScaleOrderEngine';
import { usePitchStream } from '../hooks/usePitchStream';
import { useScaleSelector, FALL_SPEED_LEVELS, DISTANCE_UNITS } from '../hooks/useScaleSelector';
import { scaleTypeById, SCALE_TYPES, BASIC_SCALE_TYPE_IDS, MORE_SCALE_GROUPS } from '../utils/scales';
import { SCALE_BLURBS } from '../utils/scaleBlurbs';
import ScaleInfoBody from './ScaleInfoBody';
import { Chevron } from './Chevron';
import { scaleItemId } from '../learning/scaleItem';
import { buildScalePool, type ScaleQuestion } from '../learning/scaleDrill';
import { buildScaleBoard } from '../learning/scaleMastery';
import { loadLearningState, saveLearningStateLocal, getInstrumentState, withInstrumentState, recordScaleAnswer } from '../learning/learningState';
import { cloudPushLearning } from '../learning/learningSync';
import ScaleFallBoard from './ScaleFallBoard';
import ScaleOrderBoard from './ScaleOrderBoard';
import ScaleProgressBoard from './ScaleProgressBoard';
import IntervalChoiceRow from './IntervalChoiceRow';
import { ProGate } from './ProGate';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { playClickSound, haptic } from '../utils/feedback';

interface Props {
  instrument: InstrumentConfig;
  accidental: AccidentalMode;
  notation: NotationMode;
  /** Whether the hamburger button is shown — hidden while the drawer is
   *  already open, matching IntervalPracticeScreen. */
  showMenuButton?: boolean;
  /** Open the hamburger drawer (the host owns the drawer state + nav). */
  onOpenMenu: () => void;
}

export default function ScalePracticeScreen({ instrument, accidental, notation, showMenuButton = true, onOpenMenu }: Props) {
  const { t, lang } = useTranslation();
  const [finished, setFinished] = useState(false);
  const [tab, setTab] = useState<'practice' | 'progress'>('practice');
  // Bumped on every recorded answer (mirrors `useLearning.ts`'s own `now`
  // state) so the Progress tab's board (read fresh from localStorage below)
  // reflects the just-finished question instead of staying frozen at
  // whatever it showed when this screen mounted — and so the board is
  // derived from state rather than calling `Date.now()` during render.
  const [now, setNow] = useState(() => Date.now());
  // A background reconcile that brought in another device's answers.
  useEffect(() => {
    const reread = () => setNow(Date.now());
    window.addEventListener('learning-synced', reread);
    return () => window.removeEventListener('learning-synced', reread);
  }, []);

  const sel = useScaleSelector(instrument.stringCount);
  const { exercise, pool } = sel;

  // The five basic scales sit on the screen itself; the rest live on the
  // "More scales" page, whose button carries the pick when one is chosen.
  const [morePage, setMorePage] = useState(false);
  // Which row's "?" explanation is open on the "More scales" page (one at a time).
  const [infoScaleId, setInfoScaleId] = useState<string | null>(null);
  // The "?" bubble floats, so a tap anywhere outside a "?" dismisses it.
  useEffect(() => {
    if (infoScaleId === null) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('.scale-more-info, .scale-info-bubble')) setInfoScaleId(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [infoScaleId]);
  const basicScaleIds = sel.shippedScaleTypeIds.filter((id) => BASIC_SCALE_TYPE_IDS.includes(id));
  // The open "?" explanation on the main screen — only the five basic scales live there.
  const basicInfoType = infoScaleId && basicScaleIds.includes(infoScaleId) ? scaleTypeById(infoScaleId) : undefined;
  const moreScaleIds = sel.shippedScaleTypeIds.filter((id) => !BASIC_SCALE_TYPE_IDS.includes(id));
  const moreChosen = moreScaleIds.includes(sel.scaleChoice);
  // Any extra scale missing from MORE_SCALE_GROUPS still gets listed, under
  // "Other", so a new SCALE_TYPES row can never go unreachable.
  const grouped = new Set(MORE_SCALE_GROUPS.flatMap((g) => g.ids));
  const moreScaleGroups = [
    ...MORE_SCALE_GROUPS.map((g) => ({ ...g, ids: g.ids.filter((id) => moreScaleIds.includes(id)) })),
    { titleKey: 'Other', ids: moreScaleIds.filter((id) => !grouped.has(id)) },
  ].filter((g) => g.ids.length > 0);

  const chipInstrument = useMemo(
    () => ({ notes: instrument.notes, stringCount: instrument.stringCount, maxFret: instrument.maxFret }),
    [instrument.notes, instrument.stringCount, instrument.maxFret],
  );

  const buildEnvelope = sel.buildEnvelope(false);
  const chipEnvelope = sel.buildEnvelope(true);

  // Feed every scale answer, from any of the three exercises, into the
  // per-item SRS schedule (scales-learning-spec.md §10), then push the blob
  // to the cloud (§15 — a no-op for a guest / offline; the reconcile merges
  // per item, so another device's scale reviews are never lost).
  const recordAnswer = useCallback(
    (itemId: string, form: 'buildScale' | 'orderScale' | 'identifyScale' | 'nameDegree', correct: boolean, seconds: number) => {
      const ts = Date.now();
      const state = loadLearningState(ts);
      const inst = getInstrumentState(state, instrument.id, ts);
      const next = recordScaleAnswer(inst, itemId, form, correct, seconds, ts);
      saveLearningStateLocal(withInstrumentState(state, instrument.id, next));
      cloudPushLearning();
      setNow(ts);
    },
    [instrument.id],
  );

  // The progress board (§12) is built against the full shipped catalogue —
  // not the Selector's own `pool`, which may be narrowed to one position —
  // so it always shows every position of every scale type shipped so far,
  // regardless of what the learner currently has picked to practise.
  const boardRows = useMemo(() => {
    const state = loadLearningState(now);
    const inst = getInstrumentState(state, instrument.id, now);
    const fullPool = buildScalePool(SCALE_TYPES.map((s) => s.id), instrument.stringCount);
    return buildScaleBoard({
      pool: fullPool,
      scaleSrs: inst.scaleSrs,
      historyRows: inst.scaleHistory,
      now,
    });
  }, [instrument.id, instrument.stringCount, now]);

  const fallInstrument = useMemo(
    () => ({ ...chipInstrument, openMidi: instrument.openMidi }),
    [chipInstrument, instrument.openMidi],
  );

  const buildEngine = useScaleFallEngine({
    instrument: fallInstrument,
    pool,
    questionCount: buildEnvelope.questionCount,
    speed: buildEnvelope.fallSpeed,
    naturalsOnly: buildEnvelope.naturalsOnlyRoot,
    direction: sel.direction,
    onComplete: () => setFinished(true),
    onAnswer: (a: ScaleFallAnswer) =>
      recordAnswer(scaleItemId(a.scaleTypeId, a.positionIndex), 'buildScale', a.correct, a.seconds),
  });

  /** "Minor Pentatonic · A · Box 1 ↑" — the banner that opens each run; the
   *  arrow says which way this run goes. */
  const scaleLabel = (q: ScaleQuestion) =>
    `${t(scaleTypeById(q.scaleTypeId)?.nameKey ?? q.scaleTypeId)} · ${displayNote(q.rootName, accidental, notation)} · ${t('Box')} ${q.positionIndex} ${q.direction === 'down' ? '↓' : '↑'}`;

  const chipEngine = useScaleChipEngine({
    exercise: exercise === 'nameDegree' ? 'nameDegree' : 'identifyScale',
    instrument: chipInstrument,
    pool,
    questionCount: chipEnvelope.questionCount,
    timeLimit: chipEnvelope.timeLimit,
    optionCount: chipEnvelope.optionCount,
    naturalsOnly: chipEnvelope.naturalsOnlyRoot,
    direction: sel.direction,
    onComplete: () => setFinished(true),
    onAnswer: (a: ScaleChipAnswer) =>
      recordAnswer(scaleItemId(a.scaleTypeId, a.positionIndex), a.form, a.correct, a.seconds),
  });

  // "Tap the scale in order": a still box with every note lit, tapped in the
  // run's order. No clock per scale; a note tapped within `noteTime` of the
  // previous one still earns the speed bonus.
  const orderEngine = useScaleOrderEngine({
    instrument: fallInstrument,
    pool,
    questionCount: buildEnvelope.questionCount,
    noteTime: Math.max(2, buildEnvelope.timeLimit / 4),
    demo: sel.orderDemo,
    naturalsOnly: buildEnvelope.naturalsOnlyRoot,
    direction: sel.direction,
    onComplete: () => setFinished(true),
    onAnswer: (a: ScaleOrderAnswer) =>
      recordAnswer(scaleItemId(a.scaleTypeId, a.positionIndex), 'orderScale', a.correct, a.seconds),
  });

  // Answer by playing: while a scale is the learner's to play (not during the
  // demo), every note heard on the guitar goes to the engine like a tap.
  const pitch = usePitchStream({
    enabled: sel.orderGuitar && exercise === 'orderScale' && orderEngine.running && orderEngine.demoStep == null,
    onNote: orderEngine.hear,
  });

  const running = exercise === 'buildScale' ? buildEngine.running
    : exercise === 'orderScale' ? orderEngine.running
    : chipEngine.running;

  const startSession = () => {
    playClickSound(); haptic.tap();
    setFinished(false);
    if (exercise === 'buildScale') buildEngine.start();
    else if (exercise === 'orderScale') orderEngine.start();
    else chipEngine.start();
  };

  const pickExercise = (next: typeof exercise) => {
    if (running) return;
    playClickSound(); haptic.tap();
    sel.setExercise(next);
    setFinished(false);
  };

  const score = exercise === 'buildScale' ? buildEngine.session.score
    : exercise === 'orderScale' ? orderEngine.session.score
    : chipEngine.session.score;

  if (morePage && !running) {
    return (
      <div className="app settings-page">
        <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
          <div className="sp2-head settings-page-head">
            <button className="sp2-back" onClick={() => { playClickSound(); haptic.tap(); setMorePage(false); }}>
              <Chevron dir="back" /> {t('Back')}
            </button>
          </div>
          <header className="settings-page-hero">
            <span className="settings-page-emoji" aria-hidden="true">🎼</span>
            <h2 className="settings-page-name">{t('More scales')}</h2>
          </header>
          <div className="settings-page-body">
            {moreScaleGroups.map((group) => (
              <div key={group.titleKey} className="set-card scale-more-list" role="group" aria-label={t(group.titleKey)}>
                <span className="set-card-label">{t(group.titleKey)}</span>
                {group.ids.map((id) => {
                  const type = scaleTypeById(id);
                  const blurb = SCALE_BLURBS[id];
                  const infoOpen = infoScaleId === id;
                  return (
                    <div key={id} className="scale-more-item">
                      <div className="scale-more-row">
                        <button
                          type="button"
                          className={`set-card-btn scale-more-btn${sel.scaleChoice === id ? ' set-card-btn-primary' : ''}`}
                          onClick={() => { playClickSound(); haptic.tap(); sel.setScaleChoice(id); setMorePage(false); }}
                        >
                          <span>{t(type?.nameKey ?? id)}</span>
                          {type && <span className="scale-more-formula" dir="ltr">{['1', ...type.degreeLabels].join(' ')}</span>}
                        </button>
                        {blurb && (
                          <button
                            type="button"
                            className={`scale-more-info${infoOpen ? ' scale-more-info-open' : ''}`}
                            aria-label={t('How this works')}
                            title={t('How this works')}
                            aria-expanded={infoOpen}
                            onClick={() => { playClickSound(); haptic.tap(); setInfoScaleId(infoOpen ? null : id); }}
                          >
                            ?
                          </button>
                        )}
                      </div>
                      {blurb && infoOpen && (
                        <div className="mode-card-info-bubble scale-info-bubble" role="status" aria-live="polite">
                          <ScaleInfoBody scaleTypeId={id} accidental={accidental} notation={notation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
        <h1 className="interval-home-title">🎼 {t('Scale training')}</h1>

        <div className="settings-page-body">
          <ProGate
            feature="scaleDrill"
            variant="replace"
            pitch={t('Practise building scale shapes on the neck')}
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

            {!running && tab === 'progress' && (
              <div className="set-card">
                <ScaleProgressBoard rows={boardRows} />
              </div>
            )}

            {!running && tab === 'practice' && (
              <div className="set-card scale-exercise-switcher" role="group">
                <button
                  type="button"
                  className={`set-card-btn${exercise === 'buildScale' ? ' set-card-btn-primary' : ''}`}
                  onClick={() => pickExercise('buildScale')}
                >
                  {t('Build the scale')}
                </button>
                <button
                  type="button"
                  className={`set-card-btn${exercise === 'orderScale' ? ' set-card-btn-primary' : ''}`}
                  onClick={() => pickExercise('orderScale')}
                >
                  {t('Tap the scale in order')}
                </button>
                <button
                  type="button"
                  className={`set-card-btn${exercise === 'identifyScale' ? ' set-card-btn-primary' : ''}`}
                  onClick={() => pickExercise('identifyScale')}
                >
                  {t('Identify the scale')}
                </button>
                <button
                  type="button"
                  className={`set-card-btn${exercise === 'nameDegree' ? ' set-card-btn-primary' : ''}`}
                  onClick={() => pickExercise('nameDegree')}
                >
                  {t('Name the degree')}
                </button>
              </div>
            )}

            {!running && tab === 'practice' && (
              <div className="set-card scale-position-switcher" role="group" aria-label={t('Scale')}>
                <span className="set-card-label">{t('Scale')}</span>
                <div className="scale-position-row">
                  {['all', ...basicScaleIds].map((id) => {
                    const chip = (
                      <button
                        key={id}
                        type="button"
                        className={`set-card-btn${sel.scaleChoice === id ? ' set-card-btn-primary' : ''}`}
                        onClick={() => { playClickSound(); haptic.tap(); sel.setScaleChoice(id); }}
                      >
                        {id === 'all' ? t('All scales') : t(scaleTypeById(id)?.nameKey ?? id)}
                      </button>
                    );
                    if (!SCALE_BLURBS[id]) return chip;
                    const infoOpen = infoScaleId === id;
                    return (
                      <div key={id} className="scale-chip-group">
                        {chip}
                        <button
                          type="button"
                          className={`scale-more-info${infoOpen ? ' scale-more-info-open' : ''}`}
                          aria-label={t('How this works')}
                          title={t('How this works')}
                          aria-expanded={infoOpen}
                          onClick={() => { playClickSound(); haptic.tap(); setInfoScaleId(infoOpen ? null : id); }}
                        >
                          ?
                        </button>
                      </div>
                    );
                  })}
                  {moreScaleIds.length > 0 && (
                    <button
                      type="button"
                      className={`set-card-btn${moreChosen ? ' set-card-btn-primary' : ''}`}
                      onClick={() => { playClickSound(); haptic.tap(); setMorePage(true); }}
                    >
                      {moreChosen ? t(scaleTypeById(sel.scaleChoice)?.nameKey ?? sel.scaleChoice) : t('More scales')}
                      <Chevron dir="forward" />
                    </button>
                  )}
                </div>
                {basicInfoType && SCALE_BLURBS[basicInfoType.id] && (
                  <div className="mode-card-info-bubble scale-info-bubble" role="status" aria-live="polite">
                    <ScaleInfoBody scaleTypeId={basicInfoType.id} accidental={accidental} notation={notation} />
                  </div>
                )}
              </div>
            )}

            {!running && tab === 'practice' && sel.positionChoiceAvailable && (
              <div className="set-card scale-position-switcher" role="group" aria-label={t('Position')}>
                <span className="set-card-label">{t('Position')}</span>
                <div className="scale-position-row">
                  <button
                    type="button"
                    className={`set-card-btn${sel.positionMode === 'all' ? ' set-card-btn-primary' : ''}`}
                    onClick={() => { playClickSound(); haptic.tap(); sel.setPositionMode('all'); }}
                  >
                    {t('All positions')}
                  </button>
                  {sel.availablePositions.map((p) => (
                    <button
                      key={p.positionIndex}
                      type="button"
                      className={`set-card-btn${sel.positionMode === 'one' && sel.positionIndex === p.positionIndex ? ' set-card-btn-primary' : ''}`}
                      onClick={() => {
                        playClickSound(); haptic.tap();
                        sel.setPositionIndex(p.positionIndex);
                        sel.setPositionMode('one');
                      }}
                    >
                      {t('Box')} {p.positionIndex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!running && tab === 'practice' && (
              <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Difficulty')}>
                <span className="set-card-label">{t('Difficulty')}</span>
                <div className="scale-difficulty-row">
                  {(['focused', 'mixed', 'full'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`set-card-btn${sel.difficultyStored === d ? ' set-card-btn-primary' : ''}`}
                      disabled={sel.positionMode === 'one'}
                      onClick={() => { playClickSound(); haptic.tap(); sel.setDifficulty(d); }}
                    >
                      {t(d === 'focused' ? 'Focused' : d === 'mixed' ? 'Mixed' : 'Full')}
                    </button>
                  ))}
                </div>
                {sel.positionMode === 'one' && (
                  <p className="set-card-help">
                    {t('One position selected — difficulty is focused.')}
                  </p>
                )}
              </div>
            )}

            {/* Ascending / descending — two on/off tiles, at least one lit, like the
                Intervals selector. "Name the degree" has no direction. */}
            {!running && tab === 'practice' && exercise !== 'nameDegree' && (
              <div className="set-card scale-direction-switcher" role="group" aria-label={t('Direction')}>
                <span className="set-card-label">{t('Direction')}</span>
                <div className="difficulty-road interval-direction-road">
                  <button
                    type="button"
                    className={`diff-btn ${sel.dirUp ? 'active' : ''}`}
                    aria-pressed={sel.dirUp}
                    onClick={() => { playClickSound(); haptic.tap(); sel.toggleDirection('up'); }}
                  >
                    <span className="diff-icon">↑</span>
                    <span className="diff-label">{t('Ascending')}</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-btn ${sel.dirDown ? 'active' : ''}`}
                    aria-pressed={sel.dirDown}
                    onClick={() => { playClickSound(); haptic.tap(); sel.toggleDirection('down'); }}
                  >
                    <span className="diff-icon">↓</span>
                    <span className="diff-label">{t('Descending')}</span>
                  </button>
                </div>
              </div>
            )}

            {!running && tab === 'practice' && exercise === 'buildScale' && (
              <div className="set-card scale-speed-switcher" role="group" aria-label={t('Fall speed')}>
                <span className="set-card-label">{t('Fall speed')}</span>
                <div className="scale-speed-row">
                  {FALL_SPEED_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`set-card-btn${sel.speedLevel === level ? ' set-card-btn-primary' : ''}`}
                      onClick={() => { playClickSound(); haptic.tap(); sel.setSpeedLevel(level); }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="scale-speed-ends" aria-hidden="true">
                  <span>{t('Slow')}</span>
                  <span>{t('Fast')}</span>
                </div>
              </div>
            )}

            {!running && tab === 'practice' && exercise === 'buildScale' && (
              <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Distance shown in')}>
                <span className="set-card-label">{t('Distance shown in')}</span>
                <div className="scale-difficulty-row">
                  {DISTANCE_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`set-card-btn${sel.distanceUnit === u ? ' set-card-btn-primary' : ''}`}
                      onClick={() => { playClickSound(); haptic.tap(); sel.setDistanceUnit(u); }}
                    >
                      {t(u === 'tones' ? 'Tones' : 'Frets')}
                    </button>
                  ))}
                </div>
                <p className="set-card-help">
                  {t('A half tone is one fret, a whole tone is two.')}
                </p>
              </div>
            )}

            {!running && tab === 'practice' && !finished && exercise === 'buildScale' && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('Rows of notes fall down the screen, one lane per string. Only the first note of the scale is lit — tap it, and the distance in tones to the next note appears on it. Find that next note before its row falls off, bottom row first — a run up or down the scale, as the arrow on the banner shows. Every note you tap plays its sound.')}
                </p>
                <button type="button" className="set-card-btn set-card-btn-primary" onClick={startSession}>
                  {t('Start')}
                </button>
              </div>
            )}
            {!running && tab === 'practice' && exercise === 'orderScale' && (
              <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Learning mode')}>
                <span className="set-card-label">{t('Learning mode')}</span>
                <div className="scale-difficulty-row">
                  <button
                    type="button"
                    className={`set-card-btn${!sel.orderDemo ? ' set-card-btn-primary' : ''}`}
                    onClick={() => { playClickSound(); haptic.tap(); sel.setOrderDemo(false); }}
                  >
                    {t('Play on my own')}
                  </button>
                  <button
                    type="button"
                    className={`set-card-btn${sel.orderDemo ? ' set-card-btn-primary' : ''}`}
                    onClick={() => { playClickSound(); haptic.tap(); sel.setOrderDemo(true); }}
                  >
                    {t('Watch, then play')}
                  </button>
                </div>
                <p className="set-card-help">
                  {t('The app plays each scale first, lighting its notes one by one — then you play it after.')}
                </p>
              </div>
            )}
            {!running && tab === 'practice' && exercise === 'orderScale' && pitch.supported && (
              <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Answer mode')}>
                <span className="set-card-label">{t('Answer mode')}</span>
                <div className="scale-difficulty-row">
                  <button
                    type="button"
                    className={`set-card-btn${!sel.orderGuitar ? ' set-card-btn-primary' : ''}`}
                    onClick={() => { playClickSound(); haptic.tap(); sel.setOrderGuitar(false); }}
                  >
                    {t('Tap')}
                  </button>
                  <button
                    type="button"
                    className={`set-card-btn${sel.orderGuitar ? ' set-card-btn-primary' : ''}`}
                    onClick={() => { playClickSound(); haptic.tap(); sel.setOrderGuitar(true); }}
                  >
                    🎸 {t('Guitar')}
                  </button>
                </div>
                {sel.orderGuitar && (
                  <p className="set-card-help">
                    {t('Play the scale on your guitar, note by note — the app listens through the microphone. A note an octave higher or lower also counts. Tapping still works.')}
                  </p>
                )}
              </div>
            )}

            {!running && tab === 'practice' && !finished && exercise === 'orderScale' && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('A section of the neck is shown with every note of the scale lit. Tap them in order to play the scale: start on the root (gold ring), go to one end of the section, then to the other end, and back to the root — up first or down first, as the arrow shows.')}
                </p>
                <button type="button" className="set-card-btn set-card-btn-primary" onClick={startSession}>
                  {t('Start')}
                </button>
              </div>
            )}
            {!running && tab === 'practice' && !finished && exercise === 'identifyScale' && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('The app plays the scale up or down. Pick which scale you heard.')}
                </p>
                <button type="button" className="set-card-btn set-card-btn-primary" onClick={startSession}>
                  {t('Start')}
                </button>
              </div>
            )}
            {!running && tab === 'practice' && !finished && exercise === 'nameDegree' && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('The app shows a scale, a root and a degree. Pick the note that matches.')}
                </p>
                <button type="button" className="set-card-btn set-card-btn-primary" onClick={startSession}>
                  {t('Start')}
                </button>
              </div>
            )}

            {buildEngine.running && buildEngine.stream && (
              <ScaleFallBoard
                stream={buildEngine.stream}
                rowStates={buildEngine.rowStates}
                rowSlips={buildEngine.rowSlips}
                hintRow={buildEngine.hintRow}
                nextRow={buildEngine.nextRow}
                wrongTile={buildEngine.wrongTile}
                noteTable={instrument.notes}
                stringCount={instrument.stringCount}
                distanceUnit={sel.distanceUnit}
                accidental={accidental}
                notation={notation}
                frameListenerRef={buildEngine.frameListenerRef}
                onTap={buildEngine.tap}
                bannerLabel={(q) => scaleLabel(buildEngine.stream!.questions[q])}
                header={
                  <>
                    <span className="scale-fall-header-title">
                      {buildEngine.currentQuestion ? scaleLabel(buildEngine.currentQuestion) : ''}
                    </span>
                    <span>
                      {t('Scale')} {buildEngine.questionNumber} / {buildEngine.questionCount}
                      {' · '}{t('Score')}: {buildEngine.session.score}
                    </span>
                  </>
                }
                onExit={() => { playClickSound(); haptic.tap(); buildEngine.stop(); }}
                exitLabel={t('Stop')}
                uiDir={lang === 'he' ? 'rtl' : undefined}
              />
            )}

            {orderEngine.running && orderEngine.question && orderEngine.board && (
              <div className="set-card scale-order-card">
                <div className="scale-order-header">
                  <span className="scale-order-title">{scaleLabel(orderEngine.question)}</span>
                  <span className="set-card-help">
                    {t('Scale')} {orderEngine.questionNumber} / {orderEngine.questionCount}
                    {' · '}{t('Score')}: {orderEngine.session.score}
                  </span>
                  {sel.orderDemo && (
                    <span className="scale-order-status" aria-live="polite">
                      {orderEngine.demoStep != null ? t('Watch and listen…') : t('Your turn — play it back')}
                    </span>
                  )}
                  {sel.orderGuitar && pitch.supported && orderEngine.demoStep == null && (
                    <span className={`voice-status guitar-status guitar-${pitch.status}`} role="status" aria-live="polite">
                      {pitch.error === 'no-permission'
                        ? t('🎸 Microphone blocked — enable it or switch to tap')
                        : pitch.error === 'not-supported' || !pitch.supported
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
                <ScaleOrderBoard
                  board={orderEngine.board}
                  step={orderEngine.step}
                  slips={orderEngine.slips}
                  wrongTile={orderEngine.wrongTile}
                  demoStep={orderEngine.demoStep}
                  rootName={orderEngine.question.rootName}
                  noteTable={instrument.notes}
                  stringCount={instrument.stringCount}
                  accidental={accidental}
                  notation={notation}
                  onTap={orderEngine.tap}
                />
                <button
                  type="button"
                  className="set-card-btn"
                  onClick={() => { playClickSound(); haptic.tap(); orderEngine.stop(); }}
                >
                  {t('Stop')}
                </button>
              </div>
            )}

            {chipEngine.running && chipEngine.question && exercise === 'identifyScale' && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('Question')} {chipEngine.questionNumber} / {chipEngine.questionCount}
                </p>
                <button type="button" className="scale-replay-btn" onClick={chipEngine.replay}>
                  {t('🔊 hear it again')}
                </button>
                <IntervalChoiceRow
                  variant="scale"
                  options={chipEngine.question.options.map((id) => ({
                    value: id,
                    label: t(scaleTypeById(id)?.nameKey ?? id),
                  }))}
                  onSelect={chipEngine.selectOption}
                  correct={chipEngine.selected != null ? chipEngine.answerValue : null}
                  wrong={chipEngine.selected != null && chipEngine.selected !== chipEngine.answerValue ? chipEngine.selected : null}
                  disabled={chipEngine.selected != null}
                  dir={lang === 'he' ? 'rtl' : undefined}
                />
              </div>
            )}

            {chipEngine.running && chipEngine.question && exercise === 'nameDegree' && 'degreeLabel' in chipEngine.question && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('Question')} {chipEngine.questionNumber} / {chipEngine.questionCount}
                </p>
                <p className="set-card-help">
                  {t('Degree')} {chipEngine.question.degreeLabel}
                  {' · '}{t('Root')} {displayNote(chipEngine.question.rootName, accidental, notation)}
                  {' · '}{t(scaleTypeById(chipEngine.question.scaleTypeId)?.nameKey ?? chipEngine.question.scaleTypeId)}
                </p>
                <IntervalChoiceRow
                  variant="note"
                  options={chipEngine.question.options.map((n) => ({
                    value: n,
                    label: displayNote(n, accidental, notation),
                  }))}
                  onSelect={chipEngine.selectOption}
                  correct={chipEngine.selected != null ? chipEngine.answerValue : null}
                  wrong={chipEngine.selected != null && chipEngine.selected !== chipEngine.answerValue ? chipEngine.selected : null}
                  disabled={chipEngine.selected != null}
                  dir={lang === 'he' ? 'rtl' : undefined}
                />
              </div>
            )}

            {!running && tab === 'practice' && finished && (
              <div className="set-card">
                <p className="set-card-help">
                  {t('Session complete!')} {t('Score')}: {score}
                </p>
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
