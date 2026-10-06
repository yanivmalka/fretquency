import { useCallback, useEffect, useState } from 'react';
import { loadSetting, saveSetting } from '../utils/settings';
import type { AccidentalMode, NotationMode, OrderMode } from '../utils/music';
import type { VoiceEnginePref } from '../utils/speech';
import {
  SEASONS, THEME_MODES, modeForHour, type Season, type SeasonPref, type Theme, type ThemePref,
} from '../utils/theme';
import { currentSeason, resolveSeason } from '../utils/region';
import { NOTE_VOLUME_DEFAULT } from '../utils/audio';
import type { FeedbackMode } from '../utils/feedback';
import { BEAT_STYLES, BEAT_STYLE_DEFAULT, type BeatStyle } from '../utils/backgroundBeat';
import { DEFAULT_MASTERY_WINDOW, type MasteryWindow } from '../utils/mastery';
import { useTranslation } from '../i18n/useTranslation';
import type { Lang } from '../i18n/translations';

type AnswerMode = 'tap' | 'voice' | 'guitar';

function defaultNotation(lang: Lang): NotationMode {
  return lang === 'es' || lang === 'pt-BR' || lang === 'fr' || lang === 'it' ? 'solfege' : 'alpha';
}

// Global display / behaviour preferences, each backed by its own `pref_*`
// localStorage key (read once at mount, exactly as before). The setters are the
// raw state setters — call sites still persist with `saveSetting` alongside the
// setter, unchanged — except `setTheme`, which persists internally (it always
// did). `guitarString` is deliberately NOT here: it is synced from
// derivedSettings via an effect + clamp in App.
export function useAppPreferences() {
  const [byString, setByString] = useState(() => loadSetting('pref_byString', true));
  // Until the player picks note names themselves, they follow the language:
  // Spanish, Portuguese, French and Italian readers learn Do-Re-Mi, everyone else A-B-C. An explicit pick
  // (stored `pref_notation`) always wins.
  const { lang } = useTranslation();
  const [notationPick, setNotation] = useState<NotationMode | null>(
    () => loadSetting<NotationMode | null>('pref_notation', null),
  );
  const notation = notationPick ?? defaultNotation(lang);
  // Which spelling the enharmonic notes are shown with everywhere the player
  // reads a note (question, note wheel, feedback line). Display-only — answer
  // matching stays enharmonic-agnostic via `notesMatch`.
  const [accidental, setAccidental] = useState<AccidentalMode>(
    () => loadSetting('pref_accidental', 'sharps'),
  );
  const [order, setOrder] = useState<OrderMode>(() => loadSetting('pref_order', 'fifths'));
  const [answerMode, setAnswerMode] = useState<AnswerMode>(() => loadSetting('pref_answerMode', 'tap'));
  const [voiceEnginePref, setVoiceEnginePref] = useState<VoiceEnginePref>(
    () => loadSetting('pref_voiceEngine', 'auto'),
  );
  const [showScore, setShowScore] = useState(() => loadSetting('pref_showScore', true));
  const [showMastery, setShowMastery] = useState(() => loadSetting('pref_showMastery', true));
  const [masteryWindow, setMasteryWindow] = useState<MasteryWindow>(
    () => loadSetting('pref_masteryWindow', DEFAULT_MASTERY_WINDOW),
  );
  // How the drill answers back: 'sound' (note + chimes + UI clicks), 'vibrate'
  // (no sound; a haptic pulse on every tap and on right/wrong instead), or
  // 'silent' (visual only). Ships as 'sound'. Falls back to the pre-3-mode
  // `pref_silentMode` boolean once: a device that had it on lands on 'vibrate'
  // (its old behaviour — muted audio, haptics kept).
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>(() => {
    const stored = loadSetting<FeedbackMode | null>('pref_feedbackMode', null);
    if (stored === 'sound' || stored === 'vibrate' || stored === 'silent') return stored;
    return loadSetting('pref_silentMode', false) ? 'vibrate' : 'sound';
  });
  // A plain makeup-gain multiplier. Earlier builds briefly stored a string
  // enum ('low'|'normal'|'high'|'max'); map those forward so a device that set
  // it then isn't stuck on the default.
  const [noteVolume, setNoteVolume] = useState<number>(() => {
    const raw = loadSetting<number | string>('pref_noteVolume', NOTE_VOLUME_DEFAULT);
    if (typeof raw === 'number') return raw;
    return { low: 1.6, normal: 2.6, high: 3.6, max: 4.8 }[raw] ?? NOTE_VOLUME_DEFAULT;
  });
  // 'auto' (the default) is light by day and the dim palette by night, by the
  // device clock; a fixed pick stays put. `theme` is the mode in effect,
  // `themePref` what the player picked.
  const [themePref, setThemePrefState] = useState<ThemePref>(() => {
    const v = loadSetting<ThemePref>('pref_theme', 'auto');
    return THEME_MODES.includes(v as Theme) ? v : 'auto';
  });
  const setTheme = useCallback((t: ThemePref) => {
    setThemePrefState(t);
    saveSetting('pref_theme', t);
  }, []);
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    if (themePref !== 'auto') return;
    const tick = () => setHour(new Date().getHours());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [themePref]);
  const theme: Theme = themePref === 'auto' ? modeForHour(hour) : themePref;
  // The seasonal palette axis, orthogonal to `theme` (the light/dim/dark
  // mode). By default it follows the real season where the player is (see
  // utils/region.ts). A manual pick (`pref_season`) holds only for the season
  // it was made in (`pref_seasonPickedIn`); when the calendar moves on, the
  // palette goes back to following it. Persists internally, like setTheme.
  // `season` is the one in effect, `seasonPref` what the tile row shows ('auto'
  // = following the calendar, including after a pick has expired).
  const [seasonState, setSeasonState] = useState<{ pref: SeasonPref; season: Season }>(() => {
    const actual = currentSeason();
    const pick = loadSetting<string | null>('pref_season', null);
    if (!pick || !SEASONS.includes(pick as Season)) return { pref: 'auto', season: actual };
    let pickedIn = loadSetting<Season | null>('pref_seasonPickedIn', null);
    if (!pickedIn) {
      // A pick saved before pickedIn existed: it was made deliberately, so let
      // it hold for the season that is running now.
      pickedIn = actual;
      try { localStorage.setItem('pref_seasonPickedIn', JSON.stringify(actual)); } catch { /* ignore */ }
    }
    return {
      pref: pickedIn === actual ? (pick as Season) : 'auto',
      season: resolveSeason(pick as Season, pickedIn, actual),
    };
  });
  const setSeason = useCallback((s: SeasonPref) => {
    if (s === 'auto') {
      setSeasonState({ pref: 'auto', season: currentSeason() });
      saveSetting('pref_season', 'auto');
      return;
    }
    setSeasonState({ pref: s, season: s });
    saveSetting('pref_seasonPickedIn', currentSeason());
    saveSetting('pref_season', s);
  }, []);
  const season = seasonState.season;
  const seasonPref = seasonState.pref;
  // Left-handed layout. An axis of its own, independent of language direction:
  // Hebrew only flips reading order, whereas this mirrors the fretboard
  // geometry and moves the on-screen chrome (menu, Quick Access, back
  // buttons) to the opposite side. Persists internally, like setTheme.
  const [leftHanded, setLeftHandedState] = useState<boolean>(
    () => loadSetting<boolean>('pref_leftHanded', false),
  );
  const setLeftHanded = useCallback((v: boolean) => {
    setLeftHandedState(v);
    saveSetting('pref_leftHanded', v);
  }, []);
  // "Raised" 3D look on the app's buttons (top rim + hard bottom edge, pressed
  // on tap). On by default; the CSS keys off `data-depth` on <html>.
  // Persists internally, like setTheme.
  const [buttonDepth, setButtonDepthState] = useState<boolean>(
    () => loadSetting<boolean>('pref_buttonDepth', true),
  );
  const setButtonDepth = useCallback((v: boolean) => {
    setButtonDepthState(v);
    saveSetting('pref_buttonDepth', v);
  }, []);
  // The light seasonal backdrop (snow / anemones / sunflowers / leaves) drawn
  // behind the app for the season in effect. On by default; the CSS keys off
  // `data-deco` on <html>. Persists internally, like setTheme.
  const [seasonDeco, setSeasonDecoState] = useState<boolean>(
    () => loadSetting<boolean>('pref_seasonDeco', true),
  );
  const setSeasonDeco = useCallback((v: boolean) => {
    setSeasonDecoState(v);
    saveSetting('pref_seasonDeco', v);
  }, []);
  // Extra ✓/• glyphs drawn over the Stats-screen fretboard heatmap cells, on
  // top of colour, so the "known" / "needs work" levels read for red/green
  // colour-blindness. Off by default — colour alone is enough for most
  // players and the glyphs otherwise clutter every cell permanently.
  // Persists internally, like setTheme.
  const [colorblindHeat, setColorblindHeatState] = useState<boolean>(
    () => loadSetting<boolean>('pref_colorblindHeat', false),
  );
  const setColorblindHeat = useCallback((v: boolean) => {
    setColorblindHeatState(v);
    saveSetting('pref_colorblindHeat', v);
  }, []);

  // A quiet kick + hi-hat loop under a Practice round (useBackgroundBeat).
  // Off by default. Persists internally, like setTheme.
  const [backgroundBeats, setBackgroundBeatsState] = useState<boolean>(
    () => loadSetting<boolean>('pref_backgroundBeats', false),
  );
  const setBackgroundBeats = useCallback((v: boolean) => {
    setBackgroundBeatsState(v);
    saveSetting('pref_backgroundBeats', v);
  }, []);
  // Which groove plays, and whether its tempo follows the round's timing ramp
  // (on by default) or stays at the style's own tempo.
  const [beatStyle, setBeatStyleState] = useState<BeatStyle>(() => {
    const v = loadSetting<string>('pref_beatStyle', BEAT_STYLE_DEFAULT);
    return (BEAT_STYLES as readonly string[]).includes(v) ? (v as BeatStyle) : BEAT_STYLE_DEFAULT;
  });
  const setBeatStyle = useCallback((v: BeatStyle) => {
    setBeatStyleState(v);
    saveSetting('pref_beatStyle', v);
  }, []);
  const [beatFollowPace, setBeatFollowPaceState] = useState<boolean>(
    () => loadSetting<boolean>('pref_beatFollowPace', true),
  );
  const setBeatFollowPace = useCallback((v: boolean) => {
    setBeatFollowPaceState(v);
    saveSetting('pref_beatFollowPace', v);
  }, []);

  return {
    byString, setByString,
    notation, setNotation,
    accidental, setAccidental,
    order, setOrder,
    answerMode, setAnswerMode,
    voiceEnginePref, setVoiceEnginePref,
    showScore, setShowScore,
    showMastery, setShowMastery,
    masteryWindow, setMasteryWindow,
    feedbackMode, setFeedbackMode,
    noteVolume, setNoteVolume,
    theme, themePref, setTheme,
    season, seasonPref, setSeason,
    leftHanded, setLeftHanded,
    buttonDepth, setButtonDepth,
    seasonDeco, setSeasonDeco,
    colorblindHeat, setColorblindHeat,
    backgroundBeats, setBackgroundBeats,
    beatStyle, setBeatStyle,
    beatFollowPace, setBeatFollowPace,
  };
}
