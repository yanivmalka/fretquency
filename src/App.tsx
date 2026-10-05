import {
  useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore,
} from 'react';
import { SettingsDrawerNav, SettingsSubPage, type SettingsSection, type DrawerSearch } from './components/settings/SettingsDrawer';
import { jumpToSearchAnchor } from './utils/appSearch';
import PlayingSection from './components/settings/sections/PlayingSection';
import GeneralSettingsSection from './components/settings/sections/GeneralSettingsSection';
import AccountSection from './components/settings/sections/AccountSection';
import menuIconLearn from './assets/menu-icons/learn.png';
import menuIconPlaying from './assets/menu-icons/playing.png';
import menuIconSettings from './assets/menu-icons/settings.png';
import menuIconStats from './assets/menu-icons/stats.png';
import menuIconFeedback from './assets/menu-icons/feedback.png';
import menuIconLeaderboard from './assets/menu-icons/leaderboard.png';
import menuIconAccount from './assets/menu-icons/account.png';
import SelectorPanel from './components/SelectorPanel';
import AdjustSuggestionBanner from './components/AdjustSuggestionBanner';
import ProgressPanel from './components/ProgressPanel';
import Onboarding from './components/Onboarding';
import { markOnboardingDone } from './utils/onboardingState';
import { setActiveInstrument } from './utils/music';
import type { HistoryEntry } from './utils/music';
import {
  getInstrument, type InstrumentId, type InstrumentConfig, type UkuleleSize, type InstrumentVariants, type GuitarType,
  getInstrumentVariant, getAvailableStringCounts, getDefaultFretCount, getDefaultGuitarType,
  getMandolinVariant, getDefaultMandolinFretCount,
  getUkuleleVariant, getDefaultUkuleleSize,
  getBanjoVariant, getDefaultBanjoType,
} from './utils/instruments';
import { setAudioInstrument, setNoteVolume as setAudioNoteVolume } from './utils/audio';
import { playClickSound, playToggleOnSound, playToggleOffSound, haptic, soundLevelFromPrefs } from './utils/feedback';
import { withClick as click } from './utils/withClick';
import { loadSetting, saveSetting } from './utils/settings';
import { useThemeEffect } from './hooks/useThemeEffect';
import { useHandednessEffect } from './hooks/useHandednessEffect';
import { useButtonDepthEffect } from './hooks/useButtonDepthEffect';
import { useSeasonDecoEffect } from './hooks/useSeasonDecoEffect';
import { useFeedbackModeEffect } from './hooks/useFeedbackModeEffect';
import { useBootReadyEvent } from './hooks/useBootReadyEvent';
import { useAutoPauseOnBackground } from './hooks/useAutoPauseOnBackground';
import { useQuestionChangeAnimation } from './hooks/useQuestionChangeAnimation';
import { useAdjustSuggestion } from './hooks/useAdjustSuggestion';
import { useAuth } from './hooks/useAuth';
import { useCloudSync } from './hooks/useCloudSync';
import { startPresence, stopPresence, setPresenceIdentity } from './utils/presence';
import { useVoiceProfileSummary } from './hooks/useVoiceProfileSummary';
import { useMasteryOverlay } from './hooks/useMasteryOverlay';
import { useAppPreferences } from './hooks/useAppPreferences';
import { useDailyReminder } from './hooks/useDailyReminder';
import DailyStreakBar from './components/DailyStreakBar';
import { useSelector, type DerivedSettings } from './hooks/useSelector';
import { useDerivedNotes } from './hooks/useDerivedNotes';
import { useDrillSession } from './hooks/useDrillSession';
import { deriveDrillConfig, type DrillConfig } from './drill/DrillConfig';
import LearningPathScreen from './components/LearningPathScreen';
import DailyPracticeScreen from './components/DailyPracticeScreen';
import IntervalPracticeScreen from './components/IntervalPracticeScreen';
import ScalePracticeScreen from './components/ScalePracticeScreen';
import StaffPracticeScreen from './components/StaffPracticeScreen';
import TabPracticeScreen from './components/TabPracticeScreen';
import LearnHub from './components/LearnHub';
import TunerScreen from './components/TunerScreen';
import { useLearning } from './hooks/useLearning';
import { useDrillHistorySink } from './game/useDrillHistorySink';
import type { HistoryOps } from './hooks/useGameEngine';
import type { TeacherPlan } from './learning/planner';
import { useHistory } from './hooks/useHistory';
import { useScoring } from './hooks/useScoring';
import { useVoiceAnswer } from './hooks/useVoiceAnswer';
import { useGuitarAnswer } from './hooks/useGuitarAnswer';
import ExitHintToast from './components/ExitHintToast';
import QuickAccess from './components/QuickAccess';
import QuickAccessManagePage from './components/QuickAccessManagePage';
import QuickAccessLegendPage from './components/QuickAccessLegendPage';
import {
  subscribeQuickAccess, getQaManageOpen, closeQuickAccessManager,
  getQaLegendOpen, closeQuickAccessLegend,
} from './utils/quickAccess';
import MicPermissionCard from './components/MicPermissionCard';
import SignInNudge from './components/SignInNudge';
import CountdownOverlay from './components/drill/CountdownOverlay';
import StageTransition from './components/drill/StageTransition';
import GameEndSummary from './components/drill/GameEndSummary';
import DrillBoard from './components/drill/DrillBoard';
import DrillControls from './components/drill/DrillControls';
import DebugLogPanel from './components/DebugLogPanel';
import VoiceCalibration from './components/VoiceCalibration';
import { FeedbackBoard } from './components/FeedbackBoard';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { BadgeGrid } from './components/BadgeGrid';
import { UpgradeCard } from './components/UpgradeCard';
import { can, PRO_ONLY_INSTRUMENTS } from './utils/features';
import { setDrillHold } from './utils/adPacing';
import { track } from './utils/analytics';
import { GuestMergePrompt } from './components/GuestMergePrompt';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useBackNavigation } from './hooks/useBackNavigation';
import { BadgeToast, BadgeRevealOverlay, type CelebratedBadge } from './components/BadgeCelebration';
import type { SpeechNotation } from './utils/speechVocab';
import { useTranslation } from './i18n/useTranslation';
import { useAutoAdvance } from './hooks/useAutoAdvance';
import { useRoundLifecycle } from './hooks/useRoundLifecycle';
import { useRoundEndCelebrations } from './hooks/useRoundEndCelebrations';

// The learning domains, chosen from the "Learn" drawer page (<LearnHub>).
// 'notes' is the Selector — the home screen and the default on every launch;
// 'daily' and 'intervals' are Premium full pages (DailyPracticeScreen /
// IntervalPracticeScreen). Not persisted, so a fresh launch — or a page
// reload — always lands back on the Selector. `LearnDomain` is defined by
// <LearnHub> and re-exported through its import above.

function defaultInstrumentVariants(): InstrumentVariants {
  const guitarStrings = getAvailableStringCounts('guitar')[0];
  const bassStrings = getAvailableStringCounts('bass')[0];
  return {
    guitar: {
      strings: guitarStrings,
      frets: getDefaultFretCount('guitar', guitarStrings),
      type: getDefaultGuitarType(),
    },
    bass: { strings: bassStrings, frets: getDefaultFretCount('bass', bassStrings) },
    mandolin: { frets: getDefaultMandolinFretCount() },
    ukulele: { size: getDefaultUkuleleSize() },
    banjo: { key: getDefaultBanjoType() },
  };
}

// Resolve the *actual* InstrumentConfig for the active instrument + its
// stored variant selection. Guitar/bass/mandolin/ukulele/banjo each route to
// their own verified-variant lookup in utils/instruments.ts; any other id
// (none currently) falls back to the single unvaried config.
function resolveInstrumentConfig(id: InstrumentId, variants: InstrumentVariants): InstrumentConfig {
  switch (id) {
    case 'guitar': return getInstrumentVariant('guitar', variants.guitar.strings, variants.guitar.frets, variants.guitar.type);
    case 'bass': return getInstrumentVariant('bass', variants.bass.strings, variants.bass.frets);
    case 'mandolin': return getMandolinVariant(variants.mandolin.frets);
    case 'ukulele': return getUkuleleVariant(variants.ukulele.size);
    case 'banjo': return getBanjoVariant(variants.banjo.key);
    default: return getInstrument(id);
  }
}

export default function App() {
  const { t, lang, setLang } = useTranslation();
  // The full-page Quick Access shortcut manager, opened only from the cap
  // prompt on a pushpin (see QuickAccessPinButton). Its own external store so
  // the deep-nested prompt can raise it without threading state through.
  const qaManageOpen = useSyncExternalStore(subscribeQuickAccess, getQaManageOpen);
  // The read-only "what do the icons mean" legend page, opened from a link
  // under the Quick Access enable row in Settings. Same external-store shape
  // as the manager above.
  const qaLegendOpen = useSyncExternalStore(subscribeQuickAccess, getQaLegendOpen);
  // Auth carries the entitlement/tier — needed above (before the instrument
  // is resolved) so a Free/downgraded user's saved pro-only instrument choice
  // can be clamped back to guitar for this session. The account-sync effect
  // further down uses the same `auth` object.
  const auth = useAuth();

  // Which instrument is being drilled. Chosen on first launch (Onboarding) and
  // switchable from the hamburger menu; everything tuning/string/fret/sample
  // related flows from this config (see utils/instruments.ts).
  const [instrumentId, setInstrumentId] = useState<InstrumentId>(
    () => loadSetting('pref_instrument', 'guitar'),
  );
  // The chosen string-count/fret-count (or named type) within that
  // instrument. Merged over the verified defaults on load so a stored blob
  // missing a key (new install, new instrument added later) never produces
  // an invalid combination.
  const [instrumentVariants, setInstrumentVariants] = useState<InstrumentVariants>(() => {
    const defaults = defaultInstrumentVariants();
    const stored = loadSetting<Partial<InstrumentVariants>>('pref_instrumentVariant', {});
    return {
      guitar: { ...defaults.guitar, ...stored.guitar },
      bass: { ...defaults.bass, ...stored.bass },
      mandolin: { ...defaults.mandolin, ...stored.mandolin },
      ukulele: { ...defaults.ukulele, ...stored.ukulele },
      banjo: { ...defaults.banjo, ...stored.banjo },
    };
  });
  // Mandolin/banjo need `extraInstruments` (Pro); ukulele is free. ProGate in the
  // instrument picker (PlayingSection) is presentation-only and blocks the
  // *tap* that would set this; this is the real gate, covering the case
  // where a saved pref_instrument is one of them but the account has since
  // lost Pro (downgrade, expiry) — it falls back to guitar for this session
  // without touching the saved preference, so it resumes automatically the
  // moment the account is Pro again.
  const effectiveInstrumentId: InstrumentId =
    PRO_ONLY_INSTRUMENTS.includes(instrumentId) && !can('extraInstruments', auth.tier)
      ? 'guitar'
      : instrumentId;
  const instrument = resolveInstrumentConfig(effectiveInstrumentId, instrumentVariants);
  // Sync the shared note-table + audio bindings to the active instrument before
  // any child hook/component reads them this render. Idempotent — this is an
  // external-store sync, not derived render state.
  setActiveInstrument(instrument);
  setAudioInstrument(instrument);
  const applyInstrument = (id: InstrumentId) => {
    setInstrumentId(id);
    saveSetting('pref_instrument', id);
  };
  // One setter per instrument's variant shape (mirrors PlayingSection's
  // per-instrument picker UI — guitar/bass cascade string→fret, the rest are
  // a single choice). Each persists the whole blob immediately, same as
  // applyInstrument does for the instrument id itself.
  const saveInstrumentVariants = (next: InstrumentVariants) => {
    setInstrumentVariants(next);
    saveSetting('pref_instrumentVariant', next);
  };
  const setGuitarStrings = (strings: number) => {
    saveInstrumentVariants({
      ...instrumentVariants,
      guitar: { ...instrumentVariants.guitar, strings, frets: getDefaultFretCount('guitar', strings) },
    });
  };
  const setGuitarFrets = (frets: number) => {
    saveInstrumentVariants({ ...instrumentVariants, guitar: { ...instrumentVariants.guitar, frets } });
  };
  // Acoustic/electric only swaps which sample library notes are played
  // from — string count and fret count (and any saved fret window) carry
  // over untouched, unlike a string-count change which resets frets.
  const setGuitarType = (type: GuitarType) => {
    saveInstrumentVariants({ ...instrumentVariants, guitar: { ...instrumentVariants.guitar, type } });
  };
  const setBassStrings = (strings: number) => {
    saveInstrumentVariants({
      ...instrumentVariants,
      bass: { strings, frets: getDefaultFretCount('bass', strings) },
    });
  };
  const setBassFrets = (frets: number) => {
    saveInstrumentVariants({ ...instrumentVariants, bass: { ...instrumentVariants.bass, frets } });
  };
  const setMandolinFrets = (frets: number) => {
    saveInstrumentVariants({ ...instrumentVariants, mandolin: { frets } });
  };
  const setUkuleleSize = (size: UkuleleSize) => {
    saveInstrumentVariants({ ...instrumentVariants, ukulele: { size } });
  };
  const setBanjoType = (key: string) => {
    saveInstrumentVariants({ ...instrumentVariants, banjo: { key } });
  };

  const selector = useSelector(instrument, auth.isPro);
  const { derivedSettings } = selector;

  // ── Premium Teacher (P2) ──────────────────────────────────────────────
  // A planned session, set by the Today card. While it is non-null the drill
  // runs on the plan's DrillConfig (fret window / mode / strings / count /
  // timer) instead of the Selector's; the Selector itself and `historyKey()`
  // are untouched, so a Teacher session records as ordinary note practice and
  // keeps feeding history / mastery / stats. Cleared when the session ends.
  const [teacherPlan, setTeacherPlan] = useState<TeacherPlan | null>(null);
  const teacherPlanRef = useRef<TeacherPlan | null>(null);
  teacherPlanRef.current = teacherPlan;
  // ── Interval drill (P4) ──────────────────────────────────────────────
  // A plain DrillConfig (with an `interval` spec) set by the Interval card.
  // While it is non-null the drill runs on it; its answers go to an in-memory
  // sink (never `useHistory` / mastery / stats / badges / leaderboard) and feed
  // only the interval SRS schedule. Cleared when the session ends.
  const [intervalPlan, setIntervalPlan] = useState<DrillConfig | null>(null);
  const intervalPlanRef = useRef<DrillConfig | null>(null);
  intervalPlanRef.current = intervalPlan;
  // True while the run that is currently ending was an interval session — used
  // to skip the note-side end-of-run work (personal best, badges, leaderboard).
  // Set in `start()`, cleared on reset (not on stop), like `wasTeacherRunRef`.
  const wasIntervalRunRef = useRef(false);
  // A Teacher answer folds into the learning model (SRS + daily goal); an
  // ordinary by-fret Selector answer folds into the SRS schedule only, so the
  // Teacher still learns from all note practice. Both are no-ops off Premium.
  const teacherRecordRef = useRef<((e: HistoryEntry) => void) | null>(null);
  const practiceRecordRef = useRef<((e: HistoryEntry) => void) | null>(null);
  // True while the run that is currently ending was launched from the Today
  // card. Set in `start()`, read by the game-end effect, cleared on reset —
  // NOT on stop, so a manually-stopped Teacher run is still recognised.
  const wasTeacherRunRef = useRef(false);

  // The settings the drill / board actually run on: the Selector's, unless a
  // Teacher plan is active.
  const eff = useMemo<DerivedSettings>(() => {
    const planDrill = intervalPlan ?? teacherPlan?.drill ?? null;
    if (!planDrill) return derivedSettings;
    const d = planDrill;
    return {
      ...derivedSettings,
      guitarString: d.primaryString,
      multiStrings: d.isMulti ? d.strings : [],
      fretFrom: d.fretFrom,
      fretTo: d.fretTo,
      byNote: d.mode === 'byNote',
      dotsOnly: false,
      wholeToneOnly: false,
      time: d.timeLimit,
      maxQuestions: d.questionCount,
    };
  }, [teacherPlan, intervalPlan, derivedSettings]);
  // Mode the drill is actually running in, for the history sink (read inside a
  // callback, so kept in a ref per the repo convention).
  const effByNoteRef = useRef(eff.byNote);
  effByNoteRef.current = eff.byNote;

  const [guitarString, setGuitarString] = useState(derivedSettings.guitarString);
  // `guitarString` is state synced from derivedSettings via an effect, so for
  // one render right after an instrument switch it can still hold the previous
  // instrument's (larger) string number. Clamp it before anything indexes the
  // now-shorter note table with it — an out-of-range index throws and blanks
  // the whole page.
  const safeGuitarString = Math.min(Math.max(guitarString, 1), instrument.stringCount);
  // Global display / behaviour preferences (each backed by its own pref_* key).
  const {
    byString, setByString, notation, setNotation, accidental, setAccidental, order, setOrder,
    answerMode, setAnswerMode, voiceEnginePref, setVoiceEnginePref,
    showScore, setShowScore, showMastery, setShowMastery,
    masteryWindow, setMasteryWindow, feedbackMode, setFeedbackMode,
    noteVolume, setNoteVolume,
    theme, themePref, setTheme,
    season, seasonPref, setSeason,
    leftHanded, setLeftHanded,
    buttonDepth, setButtonDepth,
    seasonDeco, setSeasonDeco,
    colorblindHeat, setColorblindHeat,
  } = useAppPreferences();
  const reminder = useDailyReminder();
  useEffect(() => { setAudioNoteVolume(noteVolume); }, [noteVolume]);
  const [showVoiceCalibration, setShowVoiceCalibration] = useState(false);
  // Voice-engine calibration epoch + the stored-profile summary shown in
  // Settings. `bumpVoiceEngineEpoch` re-selects the speech engine after a
  // calibration or a restored cloud profile; useVoiceAnswer reads the epoch.
  const {
    voiceProfileStat, pickVoiceEngine, voiceEngineEpoch, bumpVoiceEngineEpoch,
  } = useVoiceProfileSummary({ notation, showVoiceCalibration, setVoiceEnginePref });
  // The engine always picks pitches from the sharp-spelled `notes` table; the
  // `accidental` preference (Playing → Notes) only decides how an enharmonic
  // note is *spelled* on screen — the question note, the note wheel and the
  // feedback line all follow it. Answer matching stays enharmonic-agnostic
  // (`notesMatch`), so the choice never changes which answer is correct.
  useFeedbackModeEffect(feedbackMode);
  // Anything that only cares "is the drill's audio muted?" (e.g. the interval
  // screen's audio-only exercise) keys off this — true in both 'vibrate' and
  // 'silent'.
  const silentMode = feedbackMode !== 'sound';
  useThemeEffect(season, theme);
  useHandednessEffect(leftHanded);
  useButtonDepthEffect(buttonDepth);
  // The seasonal backdrop is Pro. This is the real gate (the Settings card's
  // ProGate is presentation only): kept off until the entitlement is known, so
  // a Free player never sees it flash in behind the boot splash.
  useSeasonDecoEffect(
    seasonDeco && !auth.loading && !auth.entitlementLoading && can('seasonalBackdrop', auth.tier),
  );

  useBootReadyEvent(auth.loading, auth.entitlementLoading);

  const historyOps = useHistory();
  // Interval drill (P4): an isolated in-memory history for interval sessions,
  // so they never touch `useHistory` / mastery / stats / badges / leaderboard.
  // The wrapper below also routes each tagged row to the interval SRS schedule.
  const intervalSink = useDrillHistorySink();
  const intervalSinkRef = useRef(intervalSink);
  intervalSinkRef.current = intervalSink;
  const intervalRecordRef = useRef<((entry: HistoryEntry) => void) | null>(null);
  const intervalAddEntry = useCallback((entry: HistoryEntry) => {
    intervalSinkRef.current.addEntry(entry);
    if (entry.intervalItemId) {
      intervalRecordRef.current?.(entry);
    }
  }, []);
  const intervalHistory = useMemo<HistoryOps>(
    () => ({
      addEntry: intervalAddEntry,
      markPlayed: intervalSink.markPlayed,
      resetSession: intervalSink.resetSession,
      history: intervalSink.history,
    }),
    [intervalSink, intervalAddEntry],
  );
  const histKey = selector.historyKey();
  const { addEntry: addEntryRaw, markPlayed: markPlayedRaw } = historyOps;
  const addEntryWithKey = useCallback(
    (entry: HistoryEntry) => {
      addEntryRaw(histKey, entry);
      // Feed the Premium learning model. A Teacher session's answers update the
      // SRS schedule *and* the daily goal. Ordinary Selector play updates the
      // SRS schedule only (no daily-goal tick). In by-fret mode every entry is
      // exactly the asked (string, fret). In by-note mode a correct tap and a
      // timeout also carry a genuine matching position (a real fret for the
      // shown note — one the player found, or one they failed to), so those
      // feed the schedule too; only an explicit wrong tap records the WRONG
      // fret and must be kept out. Both recorders are inert off Premium.
      if (teacherPlanRef.current) teacherRecordRef.current?.(entry);
      else if (!effByNoteRef.current || entry.correct !== false) {
        practiceRecordRef.current?.(entry);
      }
    },
    [histKey, addEntryRaw],
  );
  const markPlayedForKey = useCallback(
    () => markPlayedRaw(histKey),
    [histKey, markPlayedRaw],
  );

  // Accounts (optional): guests are unaffected; signing in with Google syncs
  // History + Personal Best (and settings / badges / learning / game / voice)
  // to the account and restores them on other devices. localStorage stays the
  // source of truth the UI reads from. All the auth.user-keyed sync effects
  // and the first-sign-in guest-merge prompt live in useCloudSync.
  const { pendingGuestMerge, finishGuestMerge, guestLocalRowCount } = useCloudSync({
    auth, historyOps, bumpVoiceEngineEpoch,
  });

  // Live community presence: one app-wide Realtime channel so the Account
  // screen's "About" tile can show who's using the app right now. No-op on a
  // config-less guest build. Re-announce this tab whenever sign-in state flips.
  useEffect(() => { startPresence(); return () => stopPresence(); }, []);
  useEffect(() => { setPresenceIdentity(auth.user); }, [auth.user]);

  const derived = useDerivedNotes(
    safeGuitarString, eff.fretFrom, eff.fretTo,
    eff.wholeToneOnly, eff.dotsOnly,
    accidental, order, byString, eff.multiStrings, effectiveInstrumentId,
  );
  const { cofList, isMulti } = derived;
  const scoring = useScoring();

  // All-time mastery overlay for the fretboard/note-circle (fret bars on the
  // current string, note bars across all strings) plus the flattened history
  // the badges read. Free vs Pro window handling lives in the hook.
  const {
    allHistoryEntries, everyInstrumentHistory, fretMastery, noteMastery,
    masteryDenom,
  } = useMasteryOverlay({
      allHistory: historyOps.allHistory,
      instrument,
      safeGuitarString,
      cofList,
      masteryWindow,
      isPro: auth.isPro,
    });

  // Premium Teacher: reads the same instrument-scoped history, keeps the SRS
  // schedule + daily goal, and derives today's recommended session + a
  // "weak spots" session. Inert (no work, null plans) for non-Premium users.
  const learning = useLearning({
    instrument,
    entries: allHistoryEntries,
    isPremium: can('premiumTeacher', auth.tier),
    accidental,
    order,
    notation,
  });
  teacherRecordRef.current = learning.recordAnswer;
  practiceRecordRef.current = learning.recordPracticeAnswer;
  // Every interval answer folds through the same path — interval SRS + the
  // separate interval daily goal + the capped, synced interval history
  // (spec §13 / §14 / §15.2). It never touches the note schedule / goal /
  // history (OD-5 / OD-6).
  intervalRecordRef.current = learning.recordIntervalTeacherAnswer;

  // Auto Advance (see hooks/useAutoAdvance): when the current stage/selection
  // is actually completed (every question answered, not a manual Stop), roll
  // straight into the next stage of the ordered curriculum keeping the same
  // score/streak/session. `handleAutoComplete` feeds useDrillSession's
  // `onComplete`; it and selector.applyStage fire in the same tick as the
  // engine's setRunning(false), so the game-end effect sees pendingAutoAdvance
  // already true and skips the "round complete" screen.
  //
  // `engineStartRef` is filled right after useDrillSession below so the Auto
  // Advance hold starts the *next* stage's `eff`. `celebrationsBeginRunRef` is
  // filled right after useRoundEndCelebrations; `start()` and the historyKey
  // reset effect call it to clear the per-run badge / toast / PB state.
  const engineStartRef = useRef<(maxQ: number, currentTime: number, isByNote: boolean) => void>(() => {});
  const celebrationsBeginRunRef = useRef<(isTeacher: boolean, isInterval: boolean) => void>(() => {});
  const { pendingAutoAdvance, stageTransition, handleAutoComplete } = useAutoAdvance({
    selector, derivedSettings, engineStartRef, teacherPlanRef, intervalPlanRef,
  });

  // Practice's picks, reduced to the platform-neutral shape the shared drill
  // engine runs on (Practice → DrillSession ← Game). `accidental`/`order`/the
  // primary string come from App state, exactly as they did when App fed
  // useGameEngine directly.
  const selectorDrillConfig = useMemo(
    () => deriveDrillConfig(derivedSettings, {
      primaryString: safeGuitarString, accidental, order,
    }),
    [derivedSettings, safeGuitarString, accidental, order],
  );
  // An interval plan (P4) or a Teacher plan supplies its own DrillConfig;
  // otherwise the drill runs on the Selector-derived one. Interval plans take
  // precedence and route history to the isolated in-memory sink.
  const drillConfig = intervalPlan ?? (teacherPlan ? teacherPlan.drill : selectorDrillConfig);
  const session = useDrillSession(drillConfig, {
    setActiveString: setGuitarString,
    history: intervalPlan
      ? intervalHistory
      : {
          addEntry: addEntryWithKey,
          markPlayed: markPlayedForKey,
          resetSession: historyOps.resetSession,
          history: historyOps.history,
        },
    scoring: {
      onCorrect: scoring.onCorrect,
      onWrong: scoring.onWrong,
      onTimeout: scoring.onTimeout,
      getQuestionTime: scoring.getQuestionTime,
      showScore,
      session: scoring.session,
    },
    onComplete: handleAutoComplete,
    display: { t, notation },
  });
  const {
    running, paused, currentFret, currentNote, askedFret, remaining, feedback,
    correctCofNote, wrongCofNote, wrongInterval, answered, remainingFrets, foundFrets, wrongFret,
    questionTime, questionStart, questionSeq, questionNumber, intervalPrompt,
    completedNaturally,
    start: engineStart, stop, pause, resume, selectFret, selectAnswer,
    selectInterval, replayIntervalQuestion,
    // The tidy end-of-drill snapshot (score / accuracy / streak / counts) the
    // drill session already derives from the session score + recorded history.
    // Practice reads it for the round-complete card and the personal-best
    // record; a future Game will read the same shape for its own end screen.
    result: sessionResult,
  } = session;
  // Fresh handle for the Auto Advance hold (registered before useDrillSession).
  engineStartRef.current = engineStart;

  // Voice answering (WP-4): while a question is on screen and answerMode is
  // 'voice', listen and route the recognised note/fret through the same
  // selectAnswer/selectFret the tap handlers use.
  const voice = useVoiceAnswer({
    enabled: answerMode === 'voice',
    running,
    paused,
    answered,
    byNote: eff.byNote,
    questionSeq,
    hasActiveQuestion: eff.byNote ? currentNote !== null : currentFret !== null,
    notation: notation as SpeechNotation,
    engineEpoch: voiceEngineEpoch,
    onNote: selectAnswer,
    onFret: selectFret,
  });
  // Fall back to tap input if voice is selected but no recogniser exists.
  const voiceActive = answerMode === 'voice' && voice.supported;

  // Answer-by-guitar: play the note instead of tapping it. Only
  // supported for "by fret" questions; see useGuitarAnswer's own comment.
  const guitar = useGuitarAnswer({
    enabled: answerMode === 'guitar',
    running,
    paused,
    answered,
    byNote: eff.byNote,
    questionSeq,
    hasActiveQuestion: eff.byNote ? currentNote !== null : currentFret !== null,
    onNote: selectAnswer,
  });
  const guitarActive = answerMode === 'guitar' && guitar.supported && !eff.byNote;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!paused) setGuitarString(eff.guitarString); }, [eff.guitarString, paused]);

  const questionDisplayRef = useQuestionChangeAnimation(questionSeq);

  // Settings changed while actively playing invalidate the session, so stop it.
  // While paused, just remember the new settings — they're picked up on resume
  // (for the next question) without losing the current score/streak/progress.
  const derivedRef = useRef(derivedSettings);
  useEffect(() => {
    if (derivedRef.current !== derivedSettings && running && !paused) { stop(); }
    derivedRef.current = derivedSettings;
  }, [derivedSettings, running, paused, stop]);

  useAutoPauseOnBackground(pause, running);

  const [preloaded, setPreloaded] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => loadSetting<boolean>('onboardingDone', false));
  // One-time nudge for guests to sign in, shown right after onboarding. "Maybe
  // later" sets this device-local flag so it never nags again; the account is
  // still reachable any time from Settings → Account.
  const [signInPromptSeen, setSignInPromptSeen] = useState(
    () => loadSetting<boolean>('pref_signInPromptSeen', false),
  );
  const dismissSignInPrompt = () => {
    setSignInPromptSeen(true);
    saveSetting('pref_signInPromptSeen', true);
  };
  // `countdown` / `gameEnded` / the Play handler `start()` live in
  // useRoundLifecycle; the per-run badge & personal-best celebration state
  // lives in useRoundEndCelebrations. Both are called below, once their inputs
  // (nav's `askForMic`, the drill session) are available.

  const isPlaying = running && !paused;
  const isStopped = !running && !paused;
  // The game screen (question, grid/circle, selector-mini) stays visible and
  // frozen while paused, not just while actively running.
  // Also "active" during the brief Auto Advance banner: `running` is momentarily
  // false between stages, but the game screen must stay mounted (frozen on the
  // last question) so the transition never collapses the layout.
  const gameActive = running || paused || pendingAutoAdvance;

  const hasHistory = historyOps.getEntriesForKey(histKey).length > 0;
  const hasAnyHistory = hasHistory || Object.values(historyOps.allHistory).some(list => list.length > 0);

  // Navigation view state + mic-permission card + info bubble + `gfp_view`
  // reload-restore + the Escape-key ladder (A26 / A28 / A29).
  const nav = useAppNavigation({ signInPromptSeen, dismissSignInPrompt, hasAnyHistory, voice });
  const {
    showStats, setShowStats, showPath, setShowPath, settingsOpen, setSettingsOpen,
    activeDomain, setActiveDomain, drawerSection, setDrawerSection, drawerSlideIn,
    tunerOpen, setTunerOpen,
    micPrompt, setMicPrompt, showInfo, upgradeFromAccountRef,
    askForMic, grantMic, openInfo,
  } = nav;

  // Usage measurement: fire once per transition into these drawer views, not
  // on every re-render (settingsSections' `body` elements are reconstructed
  // on each render regardless of which section is actually showing).
  useEffect(() => {
    if (drawerSection === 'upgrade') track('upgrade_page_viewed');
    else if (drawerSection === 'learn') track('learn_area_opened');
  }, [drawerSection]);

  // The Play handler + 3-2-1 count-in + `gameEnded` flag + the Teacher /
  // interval auto-launch effect (A33). `start()` calls `celebrationsBeginRunRef`
  // (filled just below) to reset the per-run celebration state.
  const {
    start, countdown, gameEnded, setGameEnded, gameRowRef, playBtnRef,
  } = useRoundLifecycle({
    eff, selector, scoring, engineStart, voice, teacherPlan, intervalPlan,
    preloaded, setPreloaded, askForMic, answerMode, running, paused,
    celebrationsBeginRunRef,
  });

  // During the 3-2-1 count-in the engine hasn't started yet (`running` is still
  // false), but the fretboard/circle should already wear the stage's play
  // appearance — no all-time mastery overlay, dots shown — instead of flashing
  // the at-rest page look for the three seconds before the first question.
  const boardLive = gameActive || countdown !== null;
  // The count-in and the Auto Advance gap are still "in a drill": keep the ad
  // strip down through them so it never flashes between rounds.
  const drillHold = countdown !== null || pendingAutoAdvance;
  useEffect(() => { setDrillHold(drillHold); }, [drillHold]);

  // The end-of-round badge reveal list. Owned here rather than inside
  // useRoundEndCelebrations because useBackNavigation consumes it and the
  // historyKey reset effect clears it before that hook is even called.
  const [revealBadges, setRevealBadges] = useState<CelebratedBadge[]>([]);

  // ── "Back" keeps you inside the app ─────────────────────────────────
  // Android's hardware Back / back-gesture and the browser's Back button both
  // run the same ladder (close a popup, step back through Settings, leave
  // Stats, back out of the Game, stop a running round) instead of dropping
  // straight out of the app. The branch order in useBackNavigation *is* the
  // behaviour. Only on the bare home screen with nothing left to undo does a
  // second Back within 2s actually leave.
  const signInPromptOpen = auth.configured && !auth.loading && !auth.user
    && hasAnyHistory && !signInPromptSeen && !gameActive;
  const { exitHint } = useBackNavigation({
    nav, running, paused, stop,
    revealBadges, setRevealBadges, signInPromptOpen, dismissSignInPrompt,
  });

  const { adjustSuggestion, dismissSuggestion } = useAdjustSuggestion({
    autoAdvance: selector.state.autoAdvance,
    useFretRange: selector.state.useFretRange,
    difficulty: selector.state.difficulty,
    isPro: auth.isPro,
    histKey,
    getEntriesForKey: historyOps.getEntriesForKey,
  });

  // While actively playing the game stays clean and focused — the hamburger
  // (and the stats shortcut) are only offered when stopped or paused.
  // The burger icon is hidden while the drawer itself is open — the drawer's
  // own Back control takes over from there.
  const showBurger = !isPlaying && !pendingAutoAdvance && countdown === null && !settingsOpen;

  // Reset the transient view + per-run celebration state whenever the settings
  // combination (historyKey) changes. Kept here — above useRoundEndCelebrations
  // — so that hook's game-end effect still registers *after* this reset, exactly
  // as it did before the split.
  useEffect(() => {
    setShowStats(false); setGameEnded(false);
    celebrationsBeginRunRef.current(false, false);
    setTeacherPlan(null);
    setIntervalPlan(null);
  }, [histKey, setShowStats, setGameEnded]);

  // An interval session stays armed after a round ends (so pressing Play runs
  // another interval question rather than the Selector's note drill). Tear it
  // down when the user actually leaves the interval flow — i.e. when the active
  // domain returns to 'notes' (Back, the Learn hub, or a tier drop). Interval
  // plans are only ever launched from the 'intervals' / 'daily' tabs, so a
  // 'notes' domain always means the flow is over.
  useEffect(() => {
    if (activeDomain === 'notes' && !running && !paused) setIntervalPlan(null);
  }, [activeDomain, running, paused]);

  // Multi-string mode: a short haptic pulse when the drilled string changes
  // between questions, reinforcing the visual string-change emphasis. Single-
  // string rounds never switch string, so this only ever fires in Multi.
  const activeStringRef = useRef(guitarString);
  useEffect(() => {
    if (gameActive && isMulti && activeStringRef.current !== guitarString) {
      haptic.stageChange();
    }
    activeStringRef.current = guitarString;
  }, [guitarString, gameActive, isMulti]);

  // Mid-game badge sweep + slide-in toasts, the game-end pass (new personal
  // best → Tier 3 celebration, final badge sweep → reveal overlay, plan
  // tear-down) and the post-run leaderboard upsert (A32). `beginRun` clears the
  // per-run state; it is wired into `celebrationsBeginRunRef` for `start()` and
  // the historyKey reset effect above.
  const {
    newBadges, setNewBadges, toastQueue, setToastQueue, beginRun: celebrationsBeginRun,
    roundCompletedNaturally, suggestion,
  } = useRoundEndCelebrations({
    running, paused, pendingAutoAdvance, completedNaturally, scoring, selector, sessionResult,
    historyOps, instrument, showScore, histKey,
    wasTeacherRunRef, wasIntervalRunRef, teacherPlanRef, intervalPlanRef,
    auth, allHistoryEntries,
    gameEnded, setGameEnded, setRevealBadges,
  });
  celebrationsBeginRunRef.current = celebrationsBeginRun;

  // Multiplier display tracks the streak-tier multiplier from useScoring
  // (1×, 1.25×, 1.5×, 2×, 2.5×, 3×, 4× at streaks 0, 3, 5, 7, 10, 15, 20).
  const currentMultiplier = scoring.session.multiplier;
  const multiplierFireCount = currentMultiplier >= 4 ? 5
    : currentMultiplier >= 3 ? 4
    : currentMultiplier >= 2.5 ? 3
    : currentMultiplier >= 2 ? 2
    : currentMultiplier > 1 ? 1
    : 0;
  const multiplierIcon = multiplierFireCount > 0
    ? `${'🔥'.repeat(multiplierFireCount)} ×${currentMultiplier}`
    : '';

  // One definition of the settings panel, rendered in three ways: the full
  // editable panel inline on the page, the compact read-only HUD during play
  // (panelPlaying = true), and — inside the hamburger overlay — just the
  // note-name notation toggle (notationOnly = true).
  const renderSelectorPanel = (panelPlaying: boolean, notationOnly = false) => (
    <SelectorPanel
      selector={selector.state}
      instrument={instrument}
      onStringSelect={selector.onStringSelect}
      onMultiToggle={selector.onMultiToggle}
      onModeSelect={selector.onModeSelect}
      onFretRangeToggle={selector.onFretRangeToggle}
      isPro={auth.isPro}
      onDifficultySelect={selector.onDifficultySelect}
      onAutoAdvanceToggle={() => {
        if (selector.state.autoAdvance) playToggleOffSound(); else playToggleOnSound();
        haptic.tap();
        selector.onAutoAdvanceToggle();
        // Pull focus/hover off the toggle onto Play so a touch device repaints
        // it to its new on/off colour immediately instead of holding the
        // pressed look until the next tap.
        playBtnRef.current?.focus();
      }}
      isPlaying={panelPlaying}
      notationOnly={notationOnly}
      activeString={gameActive ? safeGuitarString : undefined}
      activeFret={
        gameActive
          ? intervalPrompt
            // Every interval exercise (identify / find-the-note / find-the-
            // position) has a reference fret — mark it on the mini neck so
            // the asked-about position is always visible, not just for
            // findTargetPosition.
            ? intervalPrompt.refFret
            : askedFret
          : undefined
      }
      byString={byString}
      order={order}
      onByStringToggle={() => { if (byString) playToggleOffSound(); else playToggleOnSound(); haptic.tap(); const next = !byString; setByString(next); saveSetting('pref_byString', next); }}
      onOrderChange={(o) => { playClickSound(); haptic.tap(); setOrder(o); saveSetting('pref_order', o); }}
      accidental={accidental}
      notation={notation}
      onNotationChange={(n) => { playClickSound(); haptic.tap(); setNotation(n); saveSetting('pref_notation', n); }}
      onInfo={() => { playClickSound(); haptic.tap(); openInfo(); }}
      showInfo={showInfo}
      onFretRangeConflict={selector.fretRangeConflict}
      onFretRangeConflictResolve={selector.onFretRangeConflictResolve}
    />
  );

  // The search field at the top of the hamburger menu (src/utils/appSearch.ts):
  // a picked result opens its page the same way the menu / Learn tiles do,
  // then scrolls to and flashes the card it names. A tier-locked page (a
  // Premium domain, the Learning Path) routes to the upgrade page exactly like
  // its locked Learn tile; a locked settings card is opened in place, where
  // its own <ProGate> explains the lock.
  const drawerSearch: DrawerSearch = {
    ctx: {
      configured: auth.configured,
      voiceSupported: voice.supported,
      guitarSupported: guitar.supported,
    },
    isLocked: (f) => !can(f, auth.tier),
    onPick: (entry) => {
      const target = entry.target;
      const toUpgrade = () => {
        upgradeFromAccountRef.current = false;
        setSettingsOpen(true);
        setDrawerSection('upgrade');
      };
      const leaveDrawer = () => {
        setShowStats(false);
        setShowPath(false);
        setSettingsOpen(false);
        setDrawerSection(null);
      };
      switch (target.kind) {
        case 'section':
          // Badges / Your plan are sub-pages of Account: Back returns there.
          if (target.section === 'upgrade') upgradeFromAccountRef.current = true;
          setSettingsOpen(true);
          setDrawerSection(target.section);
          if (target.anchor) jumpToSearchAnchor(target.anchor, target.fallback);
          return;
        case 'domain':
          if (entry.feature && !can(entry.feature, auth.tier)) { toUpgrade(); return; }
          leaveDrawer();
          setActiveDomain(target.domain);
          if (target.anchor) jumpToSearchAnchor(target.anchor);
          return;
        case 'stats':
          // Same as the menu row: the stats page sits over the open drawer,
          // so closing it lands back on the menu.
          setShowStats(true);
          return;
        case 'tuner':
          leaveDrawer();
          setTunerOpen(true);
          return;
        case 'path':
          if (entry.feature && !can(entry.feature, auth.tier)) { toUpgrade(); return; }
          leaveDrawer();
          setActiveDomain('notes');
          setShowPath(true);
          return;
      }
    },
  };

  // The hamburger drawer is a list of section titles; tapping one opens a
  // sub-page with a short blurb plus just that section's controls.
  // `onSelect`, when set, fires on tap instead of opening the section's sub-page —
  // used by "Stats & progress" to jump straight to its full screen like a page.
  const settingsSections: SettingsSection[] = [
    {
      id: 'learn',
      title: t('Learn'),
      icon: menuIconLearn,
      blurb: t('Choose what to practise.'),
      body: (
        <LearnHub
          activeDomain={activeDomain}
          canDaily={can('premiumTeacher', auth.tier)}
          canIntervals={can('intervalDrill', auth.tier)}
          canScales={can('scaleDrill', auth.tier)}
          canStaff={can('staffReading', auth.tier)}
          canTabs={can('tabReading', auth.tier)}
          showRoadmap={import.meta.env.DEV || auth.admin}
          onPick={(d) => {
            setActiveDomain(d);
            setShowStats(false);
            setShowPath(false);
            setSettingsOpen(false);
            setDrawerSection(null);
          }}
          onLocked={() => {
            track('locked_tile_tapped');
            upgradeFromAccountRef.current = false;
            setDrawerSection('upgrade');
          }}
          onOpenTuner={() => {
            setShowStats(false);
            setShowPath(false);
            setSettingsOpen(false);
            setDrawerSection(null);
            setTunerOpen(true);
          }}
        />
      ),
    },
    {
      id: 'instrument',
      title: t('Playing'),
      icon: menuIconPlaying,
      blurb: '',
      body: (
        <PlayingSection
          t={t}
          instrument={instrument}
          instrumentId={effectiveInstrumentId}
          admin={auth.admin}
          running={running}
          paused={paused}
          stop={stop}
          applyInstrument={applyInstrument}
          instrumentVariants={instrumentVariants}
          setGuitarStrings={setGuitarStrings}
          setGuitarFrets={setGuitarFrets}
          setGuitarType={setGuitarType}
          setBassStrings={setBassStrings}
          setBassFrets={setBassFrets}
          setMandolinFrets={setMandolinFrets}
          setUkuleleSize={setUkuleleSize}
          setBanjoType={setBanjoType}
          setPreloaded={setPreloaded}
          notation={notation}
          setNotation={setNotation}
          accidental={accidental}
          setAccidental={setAccidental}
          fretRange={{
            useFretRange: selector.state.useFretRange,
            fretLo: selector.state.fretLo,
            fretHi: selector.state.fretHi,
            onPreciseToggle: selector.onFretRangePreciseToggle,
            onWindow: selector.onFretRangeWindow,
          }}
        />
      ),
    },
    {
      // The general "Settings" drawer section: score display, app language and
      // the fretboard-mastery overlay toggle (which used to sit at the top of
      // the Stats & progress screen) all live together here now.
      id: 'settings',
      title: t('Settings'),
      icon: menuIconSettings,
      blurb: '',
      body: (
        <GeneralSettingsSection
          t={t}
          lang={lang}
          setLang={setLang}
          showScore={showScore}
          setShowScore={setShowScore}
          feedbackMode={feedbackMode}
          setFeedbackMode={setFeedbackMode}
          noteVolume={noteVolume}
          setNoteVolume={setNoteVolume}
          theme={themePref}
          setTheme={setTheme}
          season={seasonPref}
          setSeason={setSeason}
          voiceSupported={voice.supported}
          answerMode={answerMode}
          setAnswerMode={setAnswerMode}
          askForMic={askForMic}
          guitarSupported={guitar.supported}
          voiceEnginePref={voiceEnginePref}
          pickVoiceEngine={pickVoiceEngine}
          voiceProfileStat={voiceProfileStat}
          setSettingsOpen={setSettingsOpen}
          setShowVoiceCalibration={setShowVoiceCalibration}
          showMastery={showMastery}
          setShowMastery={setShowMastery}
          masteryWindow={masteryWindow}
          setMasteryWindow={setMasteryWindow}
          leftHanded={leftHanded}
          setLeftHanded={setLeftHanded}
          buttonDepth={buttonDepth}
          setButtonDepth={setButtonDepth}
          seasonDeco={seasonDeco}
          setSeasonDeco={setSeasonDeco}
          colorblindHeat={colorblindHeat}
          setColorblindHeat={setColorblindHeat}
          reminder={reminder}
        />
      ),
    },
    {
      // Jumps straight to its full screen.
      id: 'stats',
      title: t('Stats & progress'),
      icon: menuIconStats,
      blurb: '',
      body: null,
      onSelect: () => { setShowStats(true); },
    },
    ...(auth.configured ? [{
      id: 'board',
      title: t('Feedback board'),
      icon: menuIconFeedback,
      blurb: '',
      body: (
        <FeedbackBoard
          user={auth.user}
          profile={auth.profile}
          suppressAdmin={auth.viewingAsUser}
          onSignIn={() => { void auth.signInWithGoogle(); }}
        />
      ),
    }] : []),
    ...(auth.configured ? [{
      id: 'leaderboard',
      title: t('Leaderboard'),
      icon: menuIconLeaderboard,
      blurb: '',
      body: (
        <LeaderboardPanel
          activeInstrumentId={instrument.id}
          allHistory={historyOps.allHistory}
          user={auth.user}
          profile={auth.profile}
          onSignIn={() => { void auth.signInWithGoogle(); }}
        />
      ),
    }] : []),
    ...(auth.configured ? [{
      id: 'account',
      title: t('Account'),
      icon: menuIconAccount,
      blurb: '',
      body: (
        <AccountSection
          t={t}
          lang={lang}
          auth={auth}
          setDrawerSection={setDrawerSection}
          upgradeFromAccountRef={upgradeFromAccountRef}
        />
      ),
    }] : []),
    ...(auth.configured ? [{
      id: 'upgrade',
      title: `⭐ ${t('Pro')}`,
      blurb: '',
      // The admin Pro toggle used to live here; it now sits in the Account tab
      // (design note: admin controls are grouped under Account, not on the
      // customer-facing subscription screen).
      body: <UpgradeCard />,
    }] : []),
    {
      id: 'badges',
      title: `🏅 ${t('Badges')}`,
      blurb: '',
      body: (
        <BadgeGrid
          instrument={instrument}
          instrumentEntries={allHistoryEntries}
          allEntries={everyInstrumentHistory}
          isAdmin={auth.admin}
          onCelebrate={setRevealBadges}
        />
      ),
    },
  ];

  // The Quick Access shortcut manager is an explicit user navigation from the
  // cap prompt on a pushpin, so it wins over every other screen. Back closes
  // it and drops straight back to the settings sub-page it was raised from
  // (settingsOpen / drawerSection are left untouched while it is open).
  if (qaManageOpen) {
    return (
      <QuickAccessManagePage
        t={t}
        lang={lang}
        onBack={closeQuickAccessManager}
        values={{
          notation, accidental, showScore,
          soundLevel: soundLevelFromPrefs(feedbackMode, noteVolume),
          answerMode, showMastery,
        }}
      />
    );
  }

  // The read-only symbol legend, opened from Settings. Same "wins over every
  // other screen" treatment as the manager above.
  if (qaLegendOpen) {
    return (
      <QuickAccessLegendPage
        t={t}
        lang={lang}
        onBack={closeQuickAccessLegend}
        guitarSupported={guitar.supported}
      />
    );
  }

  // A shared render of the opt-in floating Quick Access control, used on both
  // the note Selector (home) and the Premium interval-practice screen. Caller
  // decides when it may show.
  const renderQuickAccess = () => (
    <QuickAccess
      t={t}
      voiceSupported={voice.supported}
      guitarSupported={guitar.supported}
      askForMic={askForMic}
      notation={notation}
      setNotation={setNotation}
      accidental={accidental}
      setAccidental={setAccidental}
      showScore={showScore}
      setShowScore={setShowScore}
      feedbackMode={feedbackMode}
      setFeedbackMode={setFeedbackMode}
      noteVolume={noteVolume}
      setNoteVolume={setNoteVolume}
      answerMode={answerMode}
      setAnswerMode={setAnswerMode}
      showMastery={showMastery}
      setShowMastery={setShowMastery}
    />
  );

  // The Tuner is a self-contained full-screen takeover — it owns
  // its own mic/pitch-detection state (src/tuner/useTuner.ts) entirely.
  if (tunerOpen) {
    return <TunerScreen onClose={() => setTunerOpen(false)} />;
  }

  // The unified "Stats & progress" screen replaces the game entirely — its own
  // page, not an overlay pinned on top of the (blurred) game screen.
  if (showStats) {
    return (
      <div className="app settings-page stats-page">
        <ProgressPanel
          headerIcon={menuIconStats}
          allHistory={historyOps.allHistory}
          noteNames={cofList}
          accidental={accidental}
          notation={notation}
          instrument={instrument}
          onClearAll={() => { historyOps.clearAllHistory(); }}
          onClose={() => setShowStats(false)}
          isPro={auth.isPro}
          intervalBoard={learning.intervalBoard}
          intervalStats={learning.intervalStats}
          colorblindHeat={colorblindHeat}
        />
      </div>
    );
  }

  // The Premium Learning Path (P3): a full page shown alongside the Selector,
  // never in place of it. Gated on `learningPath` (premium) — a tier drop
  // while it is open falls straight through to the home screen. It is not
  // shown while a round is running.
  if (showPath && can('learningPath', auth.tier) && !gameActive && countdown === null) {
    return (
      <LearningPathScreen
        pathView={learning.pathView ?? { checkpoints: [], currentIndex: 0 }}
        todayPlan={learning.todayPlan}
        busy={gameActive || countdown !== null}
        onStart={(plan) => { setShowPath(false); setTeacherPlan(plan); }}
        onClose={() => setShowPath(false)}
      />
    );
  }

  // Learning-type tabs (drawer "Learn" group). Full pages like Stats / the
  // Learning Path. Their Back button drops the domain and re-opens the "Learn"
  // drawer hub the user launched from, rather than falling out to the Selector
  // / home screen. They bail while a round is running, during the count-in, or
  // while the end-of-round summary is up, so the game and its summary render
  // from the main return as usual; the user then lands back on the tab they
  // launched from. A tier drop falls straight through to the home screen.
  const backToLearnHub = () => {
    // Leaving a learning tab ends any armed Teacher / interval session — the
    // plans outlive a single round now, so they must be dropped here.
    setTeacherPlan(null);
    setIntervalPlan(null);
    setActiveDomain('notes');
    setSettingsOpen(true);
    setDrawerSection('learn');
  };

  // Clears the end-of-round card's state — shared by its "OK" and by the
  // "what's next" suggestion buttons, which dismiss the card after acting on
  // it. Dismissing ends an armed Teacher / interval session; pressing Play
  // (instead of OK) keeps it for another question.
  const dismissRoundEnd = () => {
    setGameEnded(false); setNewBadges([]); setToastQueue([]); setRevealBadges([]);
    setTeacherPlan(null); setIntervalPlan(null);
  };
  // The end-of-round "what's next" nudge: move straight into the next stage
  // of the ordered curriculum, or open the Learn hub when there's nothing
  // harder left to offer on this combination (see useRoundEndCelebrations).
  const applyRoundSuggestion = () => {
    if (suggestion?.kind === 'nextStage') selector.applyStage(suggestion.step);
    else if (suggestion?.kind === 'exploreLearn') { setSettingsOpen(true); setDrawerSection('learn'); }
    dismissRoundEnd();
  };

  if (activeDomain === 'daily' && can('premiumTeacher', auth.tier)
      && onboardingDone && !gameActive && !gameEnded) {
    // Keep the Daily page mounted through the 3-2-1 count-in (with the shared
    // overlay on top) so launching a plan never flashes the note practice
    // board — Selector → count-in → the guided question, same as Intervals.
    return (
      <>
        <DailyPracticeScreen
          todayPlan={learning.todayPlan}
          weakSpotsPlan={learning.weakSpotsPlan}
          dailyGoal={learning.dailyGoal}
          goalComplete={learning.goalComplete}
          accidental={accidental}
          notation={notation}
          instrument={instrument}
          canIntervals={can('intervalDrill', auth.tier)}
          intervalTodayPlan={learning.intervalTodayPlan}
          intervalWeakSpotsPlan={learning.intervalWeakSpotsPlan}
          intervalDailyGoal={learning.intervalDailyGoal}
          intervalGoalComplete={learning.intervalGoalComplete}
          canStaff={can('staffReading', auth.tier)}
          onOpenStaff={() => setActiveDomain('staff')}
          canTabs={can('tabReading', auth.tier)}
          onOpenTabs={() => setActiveDomain('tabs')}
          busy={gameActive || countdown !== null}
          onStart={(plan) => setTeacherPlan(plan)}
          onStartIntervalPlan={(exercise, kind) => {
            const plan = kind === 'weak'
              ? learning.buildIntervalWeakSpotsPlan(exercise)
              : learning.buildIntervalTodayPlan(exercise);
            if (plan) setIntervalPlan(plan.drill);
          }}
          onOpenPath={can('learningPath', auth.tier)
            ? () => { setShowStats(false); setSettingsOpen(false); setShowPath(true); }
            : undefined}
          onClose={backToLearnHub}
        />
        {countdown !== null && <CountdownOverlay countdown={countdown} />}
      </>
    );
  }
  // The hamburger stays a side drawer that only lists the section titles.
  // Tapping a title opens that one section as its own full page (same
  // page-replacing treatment as "Stats & progress"), styled to match it.
  // Checked before the Intervals page below so opening a drawer section from
  // there (e.g. "Learn") replaces it with the sub-page, same as on the home
  // screen.
  if (settingsOpen && drawerSection !== null) {
    const activeSection = settingsSections.find(s => s.id === drawerSection);
    if (activeSection && activeSection.body != null) {
      return (
        <SettingsSubPage
          section={activeSection}
          lang={lang}
          t={t}
          drawerSection={drawerSection}
          upgradeFromAccountRef={upgradeFromAccountRef}
          setDrawerSection={setDrawerSection}
          revealBadges={revealBadges}
          instrument={instrument}
          setRevealBadges={setRevealBadges}
        />
      );
    }
  }

  // The Intervals page is a second home screen: no Back button, reached and
  // left through the hamburger drawer (rendered here as a sibling overlay).
  // Kept mounted through the 3-2-1 count-in so launching a session never
  // flashes the note practice board — it goes straight from the Selector to
  // the count-in to the interval question.
  if (activeDomain === 'intervals' && can('intervalDrill', auth.tier)
      && onboardingDone && !gameActive && !gameEnded) {
    return (
      <>
        <IntervalPracticeScreen
          instrument={instrument}
          intervalBoard={learning.intervalBoard}
          accidental={accidental}
          order={order}
          notation={notation}
          trackedCount={learning.intervalTrackedCount}
          silentMode={silentMode}
          showMenuButton={!settingsOpen && countdown === null}
          onOpenMenu={() => { setDrawerSection(null); setSettingsOpen(true); }}
          onStart={(config: DrillConfig) => setIntervalPlan(config)}
        />
        {settingsOpen && drawerSection === null && (
          <SettingsDrawerNav
            sections={settingsSections}
            lang={lang}
            t={t}
            setSettingsOpen={setSettingsOpen}
            setDrawerSection={setDrawerSection}
            search={drawerSearch}
            slideIn={drawerSlideIn}
          />
        )}
        {/* Quick Access is offered on the intervals page too — same rules as
            the home screen: not while the hamburger drawer is open, not during
            the count-in. */}
        {!settingsOpen && countdown === null && renderQuickAccess()}
        {countdown !== null && <CountdownOverlay countdown={countdown} />}
      </>
    );
  }

  // The Scales page — same "second home screen" treatment as Intervals, but
  // fully self-contained: it runs its own dedicated engine internally rather
  // than handing a DrillConfig back to this component (see
  // ScalePracticeScreen's header comment for why), so it needs none of the
  // gameActive/countdown/intervalPlan coupling the Intervals branch above has.
  if (activeDomain === 'scales' && can('scaleDrill', auth.tier)
      && onboardingDone && !gameActive && !gameEnded) {
    return (
      <>
        <ScalePracticeScreen
          instrument={instrument}
          accidental={accidental}
          notation={notation}
          showMenuButton={!settingsOpen}
          onOpenMenu={() => { setDrawerSection(null); setSettingsOpen(true); }}
        />
        {settingsOpen && drawerSection === null && (
          <SettingsDrawerNav
            sections={settingsSections}
            lang={lang}
            t={t}
            setSettingsOpen={setSettingsOpen}
            setDrawerSection={setDrawerSection}
            search={drawerSearch}
            slideIn={drawerSlideIn}
          />
        )}
      </>
    );
  }

  // The Staff reading page — a self-contained second home screen, exactly like
  // the Scales branch above (its own engine, no DrillConfig handed back).
  if (activeDomain === 'staff' && can('staffReading', auth.tier)
      && onboardingDone && !gameActive && !gameEnded) {
    return (
      <>
        <StaffPracticeScreen
          instrument={instrument}
          accidental={accidental}
          notation={notation}
          showMenuButton={!settingsOpen}
          onOpenMenu={() => { setDrawerSection(null); setSettingsOpen(true); }}
        />
        {settingsOpen && drawerSection === null && (
          <SettingsDrawerNav
            sections={settingsSections}
            lang={lang}
            t={t}
            setSettingsOpen={setSettingsOpen}
            setDrawerSection={setDrawerSection}
            search={drawerSearch}
            slideIn={drawerSlideIn}
          />
        )}
      </>
    );
  }

  // The Tab reading page — the same self-contained treatment as Staff reading.
  if (activeDomain === 'tabs' && can('tabReading', auth.tier)
      && onboardingDone && !gameActive && !gameEnded) {
    return (
      <>
        <TabPracticeScreen
          instrument={instrument}
          accidental={accidental}
          notation={notation}
          showMenuButton={!settingsOpen}
          onOpenMenu={() => { setDrawerSection(null); setSettingsOpen(true); }}
        />
        {settingsOpen && drawerSection === null && (
          <SettingsDrawerNav
            sections={settingsSections}
            lang={lang}
            t={t}
            setSettingsOpen={setSettingsOpen}
            setDrawerSection={setDrawerSection}
            search={drawerSearch}
            slideIn={drawerSlideIn}
          />
        )}
      </>
    );
  }

  return (
    <div className={`app home-page${gameActive ? ' playing' : ''}`}>
      {!onboardingDone && (
        <Onboarding
          instrument={instrument}
          notation={notation}
          accidental={accidental}
          tier={auth.tier}
          onInstrument={applyInstrument}
          onPlacement={selector.onDifficultySelect}
          onDone={() => {
            markOnboardingDone();
            setOnboardingDone(true);
            // Straight into a round with whatever instrument/difficulty was
            // just chosen — no stop on the Selector screen first. The sign-in
            // nudge now waits for hasAnyHistory (after this first round),
            // not for onboarding finishing.
            start();
          }}
        />
      )}

      {/* Pause: dim the entire app screen; .controls (Resume/Stop) sits
          above this via z-index so it stays sharp and clickable in place. */}
      {paused && <div className="pause-overlay" aria-hidden="true" />}

      {/* Shown when Back (hardware or browser) is pressed on the home screen —
          a second press within 2s leaves the app (see the Back handler above). */}
      {exitHint && <ExitHintToast t={t} />}

      {/* Settings hamburger + stats shortcut — hidden while actively playing so
          the game stays clean and focused. */}
      {showBurger && (
        <button
          className="burger-btn"
          onClick={click(() => { setDrawerSection(null); setSettingsOpen(o => !o); })}
          aria-label={settingsOpen ? t('Close settings') : t('Open settings')}
          aria-expanded={settingsOpen}
          title={t('Settings')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <rect x="3" y="5" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      )}

      {/* Opt-in floating Quick Access control — home screen only, and only
          outside a running / paused / advancing drill or the pre-run
          countdown, and not while the hamburger drawer is open. */}
      {!gameActive && countdown === null && onboardingDone && !settingsOpen
        && renderQuickAccess()}

      <h1>{instrument.emoji} {t(instrument.label)} {t('Fret Practice')}</h1>

      {/* The Premium Teacher's Today card and the interval-drill entry now
          live on their own learning-type tabs (drawer "Learn" group →
          DailyPracticeScreen / IntervalPracticeScreen), not stacked here on
          the home screen. This screen is the 'notes' tab: the Selector. */}

      {/* Days-in-a-row + a small daily goal, every tier — hidden while a
          drill is running/paused so it never crowds the fretboard. */}
      {!gameActive && onboardingDone && (
        <DailyStreakBar
          allHistory={historyOps.allHistory}
          instrument={instrument}
          onOpenStats={() => setShowStats(true)}
        />
      )}

      {/* All playing settings live inline on the page; a compact read-only HUD
          replaces the panel during play. */}
      {renderSelectorPanel(gameActive)}

      {/* Adaptive difficulty nudge — only at rest, and only once the current
          combination has enough recent history to be sure (see wishlist §3). */}
      {isStopped && !gameEnded && onboardingDone && adjustSuggestion && (
        <AdjustSuggestionBanner
          direction={adjustSuggestion.direction}
          target={adjustSuggestion.target}
          onApply={() => {
            // Switching difficulty changes historyKey, so this combination's
            // banner disappears on its own — no dismissal to record. The button
            // itself plays the click + haptic (see AdjustSuggestionBanner).
            selector.onDifficultySelect(adjustSuggestion.target);
          }}
          onDismiss={() => dismissSuggestion(adjustSuggestion.direction)}
        />
      )}

      {/* Hamburger drawer: a side sheet listing the section titles only.
          Tapping one opens that section as its own full page (handled by the
          early return above). Backdrop click or Escape dismisses. */}
      {settingsOpen && drawerSection === null && (
        <SettingsDrawerNav
          sections={settingsSections}
          lang={lang}
          t={t}
          setSettingsOpen={setSettingsOpen}
          setDrawerSection={setDrawerSection}
          search={drawerSearch}
          slideIn={drawerSlideIn}
        />
      )}

      {/* Microphone permission card — our own copy + styling, shown ahead of
          (primer) or in place of (denied) the browser's native prompt. */}
      {micPrompt && (
        <MicPermissionCard
          micPrompt={micPrompt}
          t={t}
          grantMic={grantMic}
          setMicPrompt={setMicPrompt}
          setAnswerMode={setAnswerMode}
        />
      )}

      {/* One-time sign-in nudge for guests, right after their first round
          (not during onboarding — that now goes straight into a round).
          Reuses the mic card's styling. "Maybe later" (or backdrop / Escape)
          dismisses it for good on this device; the account stays reachable
          from Settings. */}
      {auth.configured && !auth.loading && !auth.user && hasAnyHistory
        && !signInPromptSeen && !gameActive && (
        <SignInNudge
          t={t}
          onSignIn={() => { void auth.signInWithGoogle(); }}
          onDismiss={dismissSignInPrompt}
        />
      )}

      {/* Countdown overlay */}
      {countdown !== null && <CountdownOverlay countdown={countdown} />}

      <div className="game-row" ref={gameRowRef}>
        {stageTransition && <StageTransition stageTransition={stageTransition} t={t} />}
        <DrillBoard
          t={t}
          lang={lang}
          accidental={accidental}
          notation={notation}
          instrument={instrument}
          derived={derived}
          eff={eff}
          voice={voice}
          guitar={guitar}
          scoringSession={scoring.session}
          fretMastery={fretMastery}
          noteMastery={noteMastery}
          masteryDenominator={masteryDenom}
          intervalPrompt={intervalPrompt}
          questionDisplayRef={questionDisplayRef}
          gameActive={gameActive}
          isStopped={isStopped}
          gameEnded={gameEnded}
          stageExiting={stageTransition != null}
          isPlaying={isPlaying}
          boardLive={boardLive}
          running={running}
          paused={paused}
          answered={answered}
          showScore={showScore}
          showMastery={showMastery}
          byString={byString}
          voiceActive={voiceActive}
          guitarActive={guitarActive}
          multiplierIcon={multiplierIcon}
          feedback={feedback}
          safeGuitarString={safeGuitarString}
          currentNote={currentNote}
          currentFret={currentFret}
          questionSeq={questionSeq}
          remaining={remaining}
          questionTime={questionTime}
          questionStart={questionStart}
          questionNumber={questionNumber}
          remainingFrets={remainingFrets}
          foundFrets={foundFrets}
          wrongFret={wrongFret}
          correctCofNote={correctCofNote}
          wrongCofNote={wrongCofNote}
          wrongInterval={wrongInterval}
          selectFret={selectFret}
          selectAnswer={selectAnswer}
          selectInterval={selectInterval}
          replayIntervalQuestion={replayIntervalQuestion}
        >
          {gameEnded && isStopped && (
            <GameEndSummary
              t={t}
              showScore={showScore}
              completed={roundCompletedNaturally}
              score={scoring.session.score}
              longestStreak={scoring.session.longestStreak}
              questionsCorrect={sessionResult.questionsCorrect}
              questionsAnswered={sessionResult.questionsAnswered}
              newBadges={newBadges}
              instrument={instrument}
              suggestion={suggestion}
              onApplySuggestion={applyRoundSuggestion}
              onOk={dismissRoundEnd}
            />
          )}
          <DrillControls
            running={running}
            paused={paused}
            countdown={countdown}
            t={t}
            playBtnRef={playBtnRef}
            start={start}
            pause={pause}
            resume={resume}
            stop={stop}
            onStopPlan={() => { setTeacherPlan(null); setIntervalPlan(null); }}
          />
        </DrillBoard>
      </div>

      {(auth.admin || import.meta.env.DEV) && (
        <DebugLogPanel
          {...(import.meta.env.DEV
            ? { simTier: auth.devSimulateTier, onSetSimTier: auth.setDevSimulateTier }
            : {})}
        />
      )}

      {showVoiceCalibration && auth.isPro && (
        <VoiceCalibration
          notation={notation}
          accidental={accidental}
          onClose={() => setShowVoiceCalibration(false)}
          onProfileChanged={bumpVoiceEngineEpoch}
        />
      )}

      {pendingGuestMerge && auth.user && (
        <GuestMergePrompt
          localRowCount={guestLocalRowCount}
          onMerge={() => void finishGuestMerge('merge')}
          onAccountOnly={() => void finishGuestMerge('account-only')}
        />
      )}

      <BadgeToast
        key={toastQueue[0]?.uid ?? 'idle'}
        badge={toastQueue[0] ?? null}
        instrument={instrument}
        onDone={() => setToastQueue(q => q.slice(1))}
      />
      {/* Normally set only at game end, but an admin Granting a badge by hand on
          the Badges wall fires the same reveal — so gate on the list alone. */}
      {revealBadges.length > 0 && (
        <BadgeRevealOverlay
          badges={revealBadges}
          instrument={instrument}
          onClose={() => setRevealBadges([])}
        />
      )}
    </div>
  );
}
