// ── DailyChallengeScreen — Fret of the Day / Challenge a friend ───────────
//
// A self-contained full-page takeover, reached from the Learn drawer (free
// for every tier, like the Tuner) or straight from a shared link
// (?fotd=<instrument>, parsed by useChallengeLinkRoute before first paint —
// see App.tsx). It owns its own drill session end to end — its own
// `useScoring` instance and an isolated in-memory history sink
// (`useDrillHistorySink`, borrowed from the Game layer: it predates this
// feature and is a plain, Game-agnostic utility) — so nothing here can
// interleave with a Practice round the player left running in the
// background. The finished run's entries are committed into the *real*
// persisted history only once, on completion, under a dedicated
// `daily:<instrument>` key: that is a deliberate product decision (see
// CLAUDE.md-adjacent note in the commit) — a Fret of the Day round counts
// toward mastery, the leaderboard and Stats like any other round, but never
// touches the player's per-combination personal best.
//
// The board always renders the instrument's *base* tuning (not the
// player's own string-count/fret-count variant) — see dailyChallenge.ts for
// why that's required for "same puzzle for everyone" to actually hold.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import { Chevron } from './Chevron';
import NoteCircle from './NoteCircle';
import SpeedBar from './SpeedBar';
import { useDrillSession } from '../hooks/useDrillSession';
import { useDerivedNotes } from '../hooks/useDerivedNotes';
import { useScoring } from '../hooks/useScoring';
import { useDrillHistorySink } from '../game/useDrillHistorySink';
import { unlockAudio } from '../utils/audio';
import { setActiveInstrument } from '../utils/music';
import { setAudioInstrument } from '../utils/audio';
import { loadSetting } from '../utils/settings';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import type { AccidentalMode, OrderMode, NotationMode, HistoryEntry } from '../utils/music';
import {
  buildDailyCandidates, buildChallengeDrillConfig, dailyChallengeNumber,
  emojiResultLine, buildShareCaption, todayISO,
} from '../utils/dailyChallenge';
import { todaysDailyChallengeResult, recordDailyChallengeResult, type DailyChallengeResult } from '../utils/dailyChallengeStorage';
import { buildDailyChallengeUrl, buildFriendChallengeUrl, type ChallengeLinkData } from '../utils/challengeLink';
import { shareResult } from '../utils/share';

const INSTRUMENT_IDS: InstrumentId[] = ['guitar', 'bass', 'mandolin', 'banjo', 'ukulele'];

interface Props {
  /** The instrument currently active elsewhere in the app — just the initial
   *  pick for the switcher; a Fret of the Day round never touches it. */
  defaultInstrumentId: InstrumentId;
  /** Non-null when this screen was opened from a shared link. */
  linkData: ChallengeLinkData | null;
  /** Commits a finished round's entries into the real, persisted history
   *  under `daily:<instrumentId>` — the same `historyOps` Practice uses,
   *  so mastery/leaderboard/Stats count this round like any other. */
  addEntry: (key: string, entry: HistoryEntry) => void;
  markPlayed: (key: string) => void;
  onClose: () => void;
}

type Phase = 'idle' | 'playing' | 'result';

export default function DailyChallengeScreen({
  defaultInstrumentId, linkData, addEntry, markPlayed, onClose,
}: Props) {
  const { t, lang } = useTranslation();
  const accidental: AccidentalMode = loadSetting('pref_accidental', 'sharps');
  const order: OrderMode = loadSetting('pref_order', 'fifths');
  const notation: NotationMode = loadSetting('pref_notation', 'alpha');

  const [instrumentId, setInstrumentId] = useState<InstrumentId>(
    linkData?.instrumentId ?? defaultInstrumentId,
  );
  const instrumentLocked = linkData !== null;
  const instrument = getInstrument(instrumentId);
  // Every render, override the shared note-table/audio bindings to THIS
  // screen's instrument — App.tsx has already synced them to the player's
  // own active instrument earlier in the very same render, so this write
  // wins for the subtree below and is undone for free the moment the
  // player closes this screen (App's next render re-syncs its own).
  setActiveInstrument(instrument);
  setAudioInstrument(instrument);

  const today = useMemo(() => todayISO(), []);
  const dayNumber = useMemo(() => dailyChallengeNumber(today), [today]);
  const [storedResult, setStoredResult] = useState<DailyChallengeResult | null>(
    () => todaysDailyChallengeResult(instrumentId),
  );
  const [phase, setPhase] = useState<Phase>(storedResult ? 'result' : 'idle');
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [challengerName, setChallengerName] = useState('');

  const candidates = useMemo(
    () => buildDailyCandidates(instrumentId, today),
    [instrumentId, today],
  );
  const drill = useMemo(
    () => buildChallengeDrillConfig(instrumentId, candidates, { accidental, order }),
    [instrumentId, candidates, accidental, order],
  );

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
    activeString, drill.fretFrom, drill.fretTo, false, false, accidental, order,
    false, drill.isMulti ? drill.strings : [], instrumentId, drill.candidates,
  );

  // End-of-run detection mirrors GameFlow's StageRunner: watch `running` fall
  // from true to false rather than the engine's `onComplete`, so the final
  // history entry has already settled into `session.result` by the time this
  // runs.
  const wasRunningRef = useRef(false);
  const committedRef = useRef(false);
  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = session.running;
    if (wasRunning && !session.running && !session.paused
      && session.result.questionsAnswered > 0 && !committedRef.current) {
      committedRef.current = true;
      const key = `daily:${instrumentId}`;
      for (const entry of historySink.history) addEntry(key, entry);
      markPlayed(key);
      const seconds = historySink.history.reduce((sum, e) => sum + (e.seconds || 0), 0);
      const result = recordDailyChallengeResult(instrumentId, {
        correct: session.result.questionsCorrect,
        total: session.result.questionCount,
        seconds: Math.round(seconds),
      });
      setStoredResult(result);
      setPhase('result');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.running, session.paused, session.result]);

  const startChallenge = () => {
    unlockAudio();
    committedRef.current = false;
    scoring.reset();
    scoring.beginRun(drill.timeLimit, drill.questionCount);
    setPhase('playing');
    session.start(drill.questionCount, drill.timeLimit, false);
  };

  const leave = () => {
    if (session.running || session.paused) session.stop();
    onClose();
  };

  const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const doShare = async () => {
    if (!storedResult) return;
    const emojiLine = emojiResultLine(historySink.history.map((e) => e.correct === true));
    const caption = buildShareCaption({
      dayNumber, instrumentEmoji: instrument.emoji,
      correct: storedResult.correct, total: storedResult.total, seconds: storedResult.seconds,
      emojiLine: emojiLine || '🟩'.repeat(storedResult.correct) + '🟥'.repeat(storedResult.total - storedResult.correct),
    });
    const url = buildDailyChallengeUrl(baseUrl, instrumentId);
    const outcome = await shareResult({ title: t('Fret of the Day'), text: caption, url });
    if (outcome === 'copied') { setShareState('copied'); window.setTimeout(() => setShareState('idle'), 2000); }
  };

  const doChallengeFriend = async () => {
    if (!storedResult) return;
    const name = challengerName.trim() || t('A friend');
    const url = buildFriendChallengeUrl(baseUrl, instrumentId, {
      name, correct: storedResult.correct, total: storedResult.total, seconds: storedResult.seconds,
    });
    const caption = t('Beat my score on today\'s Fret of the Day!');
    const outcome = await shareResult({ title: t('Challenge a friend'), text: caption, url });
    if (outcome === 'copied') { setShareState('copied'); window.setTimeout(() => setShareState('idle'), 2000); }
  };

  const idle = !session.running && !session.paused;

  return (
    <div className="app settings-page fotd-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button className="sp2-back" onClick={() => { playClickSound(); haptic.tap(); leave(); }}>
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          <span className="settings-page-emoji" aria-hidden="true">🔥</span>
          <h2 className="settings-page-name">{t('Fret of the Day')}</h2>
          <p className="fotd-puzzle-number">#{dayNumber}</p>
        </header>

        <div className="settings-page-body fotd-body">
          {!instrumentLocked && phase !== 'playing' && (
            <div className="fotd-instrument-row">
              {INSTRUMENT_IDS.map((id) => (
                <button
                  key={id}
                  className={`fotd-instrument-btn${id === instrumentId ? ' active' : ''}`}
                  onClick={() => {
                    playClickSound(); haptic.tap();
                    setInstrumentId(id);
                    const existing = todaysDailyChallengeResult(id);
                    setStoredResult(existing);
                    setPhase(existing ? 'result' : 'idle');
                  }}
                  aria-pressed={id === instrumentId}
                >
                  <span aria-hidden="true">{getInstrument(id).emoji}</span>
                  <span className="fotd-instrument-label">{t(getInstrument(id).label)}</span>
                </button>
              ))}
            </div>
          )}

          {linkData?.challenger && phase === 'idle' && (
            <div className="fotd-challenger-banner">
              {t('{name} got {correct}/{total} in {seconds}s — beat it!')
                .replace('{name}', linkData.challenger.name)
                .replace('{correct}', String(linkData.challenger.correct))
                .replace('{total}', String(linkData.challenger.total))
                .replace('{seconds}', String(linkData.challenger.seconds))}
            </div>
          )}

          {phase === 'idle' && (
            <div className="fotd-idle">
              <p className="fotd-tagline">
                {t('The same {count} positions for every player in the world, today.')
                  .replace('{count}', String(drill.questionCount))}
              </p>
              <button className="start-btn" onClick={() => { playClickSound(); haptic.tap(); startChallenge(); }}>
                {t('Start')}
              </button>
            </div>
          )}

          {phase === 'playing' && (
            <div className="question-col fotd-question-col">
              <div className="string-label">{t(instrument.stringLabels[activeString] ?? '')}</div>
              <div className="fret-display">{session.currentFret !== null ? session.currentFret : '—'}</div>
              <SpeedBar
                key={`fotd-sb-${session.questionSeq}`}
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
              {!idle && (
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
              )}
            </div>
          )}

          {phase === 'result' && storedResult && (
            <div className="fotd-result">
              <div className="fotd-result-score">
                {storedResult.correct}/{storedResult.total} · {storedResult.seconds}s
              </div>
              <div className="fotd-result-emoji">
                {emojiResultLine(historySink.history.length > 0
                  ? historySink.history.map((e) => e.correct === true)
                  : Array.from({ length: storedResult.total }, (_, i) => i < storedResult.correct))}
              </div>
              {storedResult.streak > 1 && (
                <div className="fotd-streak">🔥 {t('{n}-day streak').replace('{n}', String(storedResult.streak))}</div>
              )}
              <p className="fotd-result-note">{t('Come back tomorrow for a new puzzle.')}</p>

              <div className="fotd-share-row">
                <button className="clear-btn" onClick={() => { playClickSound(); haptic.tap(); void doShare(); }}>
                  {t('Share result')}
                </button>
              </div>
              <div className="fotd-challenge-row">
                <input
                  className="fotd-name-input"
                  type="text"
                  maxLength={24}
                  placeholder={t('Your name (optional)')}
                  value={challengerName}
                  onChange={(e) => setChallengerName(e.target.value)}
                />
                <button className="clear-btn" onClick={() => { playClickSound(); haptic.tap(); void doChallengeFriend(); }}>
                  {t('Challenge a friend')}
                </button>
              </div>
              {shareState === 'copied' && <p className="fotd-copied-note">{t('Copied to clipboard')}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
