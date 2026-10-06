import { useState } from 'react';
import { SettingCard, SegmentedControl, PickRow, LevelBar } from '../../SettingCard';
import {
  SOUND_LEVEL_COUNT, soundLevelFromPrefs, soundLevelToPrefs, soundLevelLabel, previewSoundLevel,
} from '../../../utils/feedback';
import { ProGate } from '../../ProGate';
import { QuickAccessEnableToggle, QuickAccessLegendLink, QuickAccessPinButton } from '../../QuickAccessPinButton';
import AppearancePicker from '../AppearancePicker';
import { withClick as click } from '../../../utils/withClick';
import { saveSetting } from '../../../utils/settings';
import { resetAllDemos } from '../../../utils/demoState';
import { isNative } from '../../../utils/reminder';
import { LANGUAGES, type Lang } from '../../../i18n/translations';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  PRO_MASTERY_LASTN_CHOICES, describeMasteryWindow, type MasteryWindow,
} from '../../../utils/mastery';
import type { SeasonPref, ThemePref } from '../../../utils/theme';
import type { VoiceEnginePref } from '../../../utils/speech';
import type { FeedbackMode } from '../../../utils/feedback';

type AnswerMode = 'tap' | 'voice' | 'guitar';
type WindowMode = MasteryWindow['kind'];

/** Local-calendar `YYYY-MM-DD` for a Date, matching what an `<input type="date">` emits. */
function localDayStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
/** Local midnight of a `YYYY-MM-DD` day, as an ISO instant. */
function startOfDayISO(dayStr: string): string {
  return new Date(`${dayStr}T00:00:00`).toISOString();
}
/** Local midnight of the day *after* `dayStr`, as an ISO instant — the half-open
 *  upper bound `applyMasteryWindow` expects (`>= fromISO && < toISO`). */
function dayAfterISO(dayStr: string): string {
  const x = new Date(`${dayStr}T00:00:00`);
  x.setDate(x.getDate() + 1);
  return x.toISOString();
}
/** Inverse of {@link dayAfterISO}: the inclusive "to" day a stored `toISO` came from. */
function toISOToDayStr(toISO: string): string {
  const x = new Date(toISO);
  x.setDate(x.getDate() - 1);
  return localDayStr(x);
}

/**
 * The general "Settings" drawer section body: score display, silent mode,
 * theme, language, voice answer mode / engine / profile, and the
 * fretboard-mastery overlay controls. Presentation only — every setter is
 * threaded in from <App>; this component imports no hooks.
 */
export interface GeneralSettingsSectionProps {
  t: (s: string) => string;
  lang: Lang;
  setLang: (l: Lang) => void;
  showScore: boolean;
  setShowScore: (v: boolean) => void;
  feedbackMode: FeedbackMode;
  setFeedbackMode: (v: FeedbackMode) => void;
  noteVolume: number;
  setNoteVolume: (v: number) => void;
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  season: SeasonPref;
  setSeason: (s: SeasonPref) => void;
  voiceSupported: boolean;
  answerMode: AnswerMode;
  setAnswerMode: (m: AnswerMode) => void;
  askForMic: () => void;
  /** The device can listen for a played note — offers the "answer by
   *  playing the guitar" mode. */
  guitarSupported: boolean;
  voiceEnginePref: VoiceEnginePref;
  pickVoiceEngine: (p: VoiceEnginePref) => void;
  voiceProfileStat: { enabled: boolean; count: number } | null;
  setSettingsOpen: (v: boolean) => void;
  setShowVoiceCalibration: (v: boolean) => void;
  showMastery: boolean;
  setShowMastery: (v: boolean) => void;
  masteryWindow: MasteryWindow;
  setMasteryWindow: (w: MasteryWindow) => void;
  leftHanded: boolean;
  setLeftHanded: (v: boolean) => void;
  buttonDepth: boolean;
  setButtonDepth: (v: boolean) => void;
  seasonDeco: boolean;
  setSeasonDeco: (v: boolean) => void;
  colorblindHeat: boolean;
  setColorblindHeat: (v: boolean) => void;
  backgroundBeats: boolean;
  setBackgroundBeats: (v: boolean) => void;
  reminder: {
    enabled: boolean;
    time: string;
    setEnabled: (v: boolean) => void;
    setTime: (v: string) => void;
    canPrompt: boolean;
    permissionDenied: boolean;
    supported: boolean;
  };
}

export default function GeneralSettingsSection({
  t, lang, setLang, showScore, setShowScore, feedbackMode, setFeedbackMode,
  noteVolume, setNoteVolume, theme, setTheme, season, setSeason, voiceSupported, answerMode, setAnswerMode, askForMic,
  guitarSupported,
  voiceEnginePref, pickVoiceEngine, voiceProfileStat, setSettingsOpen,
  setShowVoiceCalibration, showMastery, setShowMastery, masteryWindow, setMasteryWindow,
  leftHanded, setLeftHanded, buttonDepth, setButtonDepth, seasonDeco, setSeasonDeco, colorblindHeat, setColorblindHeat,
  backgroundBeats, setBackgroundBeats, reminder,
}: GeneralSettingsSectionProps) {
  // Progress of a switch to a language whose dictionary is still downloading.
  const { languageLoad } = useTranslation();
  const todayStr = localDayStr(new Date());
  // Which sub-control of the "Mastery time window" card is visible. Seeded from
  // the persisted window, but tracked separately so "A range" can be shown while
  // its two dates are still being filled in (an invalid range is never persisted).
  const [winMode, setWinMode] = useState<WindowMode>(masteryWindow.kind);
  // Remembered so switching Recent → Day → Recent is lossless.
  const [lastNMemo, setLastNMemo] = useState(
    masteryWindow.kind === 'lastN' ? masteryWindow.n : 250,
  );
  const [daySel, setDaySel] = useState(
    masteryWindow.kind === 'onDay' ? masteryWindow.dayISO.slice(0, 10) : todayStr,
  );
  const [rangeFrom, setRangeFrom] = useState(
    masteryWindow.kind === 'dateRange' ? masteryWindow.fromISO.slice(0, 10) : '',
  );
  const [rangeTo, setRangeTo] = useState(
    masteryWindow.kind === 'dateRange' ? toISOToDayStr(masteryWindow.toISO) : '',
  );

  const commitWindow = (w: MasteryWindow) => {
    setMasteryWindow(w);
    saveSetting('pref_masteryWindow', w);
  };
  const commitRange = (from: string, to: string) => {
    if (from && to && from <= to) {
      commitWindow({ kind: 'dateRange', fromISO: startOfDayISO(from), toISO: dayAfterISO(to) });
    }
  };

  const windowSummary = describeMasteryWindow(masteryWindow, t);
  const [toursReset, setToursReset] = useState(false);

  return (
    <>
      <SettingCard
        anchor="quickAccess"
        label={t('Quick access')}
        help={t('A floating button on the home screen for the settings you flip most. Pin up to 5 with the pushpins below, then double-tap the lower-right of the screen outside a drill to open it.')}
      >
        <QuickAccessEnableToggle />
        <QuickAccessLegendLink />
      </SettingCard>
      <SettingCard
        anchor="showScore"
        label={t('Score & celebrations')}
        pin={<QuickAccessPinButton itemId="showScore" />}
        help={<>{t('Live score, streak multiplier and celebrations are shown.')} <em>{t('Every answer is still recorded to your stats and personal bests either way.')}</em></>}
      >
        <SegmentedControl
          ariaLabel={t('Score')}
          value={showScore ? 'on' : 'off'}
          options={[
            { value: 'on', label: t('On') },
            { value: 'off', label: t('Off') },
          ]}
          onChange={(v) => { const on = v === 'on'; setShowScore(on); saveSetting('pref_showScore', on); }}
        />
      </SettingCard>
      {reminder.supported && (
        <SettingCard
          anchor="dailyReminder"
          label={t('Daily reminder')}
          help={isNative()
            ? t('A notification at the time you pick, reminding you to practice.')
            : t('A browser notification at the time you pick — only while this app is open in a tab. For a reminder that works with the app closed, install the Android app.')}
        >
          <SegmentedControl
            ariaLabel={t('Daily reminder')}
            value={reminder.enabled ? 'on' : 'off'}
            options={[
              { value: 'on', label: t('On') },
              { value: 'off', label: t('Off') },
            ]}
            onChange={(v) => reminder.setEnabled(v === 'on')}
          />
          {!reminder.enabled && !reminder.canPrompt && (
            <p className="set-card-help">
              {t('Finish one more round first — then we can ask for notification permission.')}
            </p>
          )}
          {reminder.permissionDenied && (
            <p className="set-card-help">
              {t('Notifications are blocked — turn them on for this app in your device/browser settings.')}
            </p>
          )}
          {reminder.enabled && (
            <label className="set-date-field">
              <span>{t('Reminder time')}</span>
              <input
                type="time"
                className="set-date-input"
                value={reminder.time}
                onChange={(e) => { if (e.target.value) reminder.setTime(e.target.value); }}
              />
            </label>
          )}
        </SettingCard>
      )}
      <SettingCard
        anchor="soundLevel"
        label={t('Sound & vibration')}
        pin={<QuickAccessPinButton itemId="soundLevel" />}
        help={t('How the drill answers back, on one ladder from quietest to loudest. Silent: no sound and no per-button buzz, just a buzz on right / wrong answers plus the on-screen celebrations. Vibrate: no sound — a buzz on every button press and on right / wrong answers instead. Sound 1–5: note playback, chimes and tap sounds, louder each step; the limiter keeps even the loudest from distorting. Silent and Vibrate are great for practising with headphones off or a guitar in hand.')}
      >
        <LevelBar
          ariaLabel={t('Sound & vibration')}
          value={soundLevelFromPrefs(feedbackMode, noteVolume) + 1}
          count={SOUND_LEVEL_COUNT}
          formatValue={() => soundLevelLabel(soundLevelFromPrefs(feedbackMode, noteVolume), t)}
          onFeedback={(v) => previewSoundLevel(v - 1)}
          onChange={(v) => {
            const { feedbackMode: fm, noteVolume: nv } = soundLevelToPrefs(v - 1);
            setFeedbackMode(fm);
            saveSetting('pref_feedbackMode', fm);
            if (nv != null) {
              setNoteVolume(nv);
              saveSetting('pref_noteVolume', nv);
            }
          }}
        />
      </SettingCard>
      <SettingCard
        anchor="backgroundBeats"
        label={t('Background beats')}
        help={t('A quiet drum loop under a Practice round to keep your pace. It stops while the round is paused.')}
      >
        <SegmentedControl
          ariaLabel={t('Background beats')}
          value={backgroundBeats ? 'on' : 'off'}
          options={[
            { value: 'on', label: t('On') },
            { value: 'off', label: t('Off') },
          ]}
          onChange={(v) => { setBackgroundBeats(v === 'on'); }}
        />
        {backgroundBeats && feedbackMode !== 'sound' && (
          <p className="set-card-help">
            {t('Not playing now: Sound & vibration is on Silent or Vibrate. Pick a Sound level to hear the beats.')}
          </p>
        )}
        {backgroundBeats && feedbackMode === 'sound' && answerMode !== 'tap' && (
          <p className="set-card-help">
            {t('Not playing now: you answer by voice or by playing, and the microphone would hear the beats. Switch “How you answer” to Tap to hear them.')}
          </p>
        )}
      </SettingCard>
      <SettingCard
        anchor="appearance"
        label={t('Appearance')}
        help={t('Theme sets how light or dark the app is: Night is a warmer, dimmer palette for a dark room, Day is a light one. Season sets the colours layered over it — Winter is the original look. Auto follows your clock (Day from 07:00 to 19:00, Night after) and the real season where you are; picking a season by hand holds until that season ends.')}
      >
        <AppearancePicker
          t={t}
          mode={theme}
          setMode={setTheme}
          season={season}
          setSeason={setSeason}
        />
      </SettingCard>
      <ProGate
        feature="seasonalBackdrop"
        anchor="seasonDeco"
        variant="replace"
        pitch={t('Snowflakes, anemones, sunflowers or falling leaves behind the app, following the season')}
      >
        <SettingCard
          anchor="seasonDeco"
          label={t('Seasonal background')}
          help={t('Light seasonal decorations behind the app: snowflakes in winter, anemones in spring, sunflowers in summer, falling leaves in autumn. They follow the season above. Off keeps the background plain.')}
        >
          <SegmentedControl
            ariaLabel={t('Seasonal background')}
            value={seasonDeco ? 'on' : 'off'}
            options={[
              { value: 'on', label: t('On') },
              { value: 'off', label: t('Off') },
            ]}
            onChange={(v) => { setSeasonDeco(v === 'on'); }}
          />
        </SettingCard>
      </ProGate>
      <SettingCard
        anchor="buttonDepth"
        label={t('Button depth')}
        help={t('Gives the buttons a raised, 3D look: a light rim on top, a solid edge underneath, and they sink a little when pressed. Off keeps them flat.')}
      >
        <SegmentedControl
          ariaLabel={t('Button depth')}
          value={buttonDepth ? 'on' : 'off'}
          options={[
            { value: 'on', label: t('On') },
            { value: 'off', label: t('Off') },
          ]}
          onChange={(v) => { setButtonDepth(v === 'on'); }}
        />
      </SettingCard>
      <SettingCard
        anchor="language"
        label={t('Language')}
        help={languageLoad === 'loading' ? t('Downloading the language…')
          : languageLoad === 'failed' ? t('Could not download the language. Check your connection and try again.')
          : undefined}
      >
        <PickRow
          ariaLabel={t('Language')}
          value={lang}
          options={LANGUAGES}
          wrap
          onChange={(l) => { setLang(l); }}
        />
      </SettingCard>
      <SettingCard
        anchor="leftHanded"
        label={t('Left-handed')}
        help={t('Mirrors the app for a left-handed player: the fretboard flips (nut on the right), and the menu, Quick Access and back buttons move to the left. Independent of language — it stays mirrored in Hebrew too.')}
      >
        <SegmentedControl
          ariaLabel={t('Left-handed')}
          value={leftHanded ? 'on' : 'off'}
          options={[
            { value: 'on', label: t('On') },
            { value: 'off', label: t('Off') },
          ]}
          onChange={(v) => { setLeftHanded(v === 'on'); }}
        />
      </SettingCard>
      {(voiceSupported || guitarSupported) && (
        <>
          <SettingCard
            anchor="answerMode"
            label={t('How you answer')}
            pin={<QuickAccessPinButton itemId="answerMode" />}
            help={t('Voice mode asks for microphone permission the first time.')}
          >
            <PickRow
              ariaLabel={t('Answer mode')}
              value={answerMode}
              options={[
                { value: 'tap', label: <>👆 {t('Tap')}</> },
                ...(voiceSupported ? [{ value: 'voice' as const, label: <>🎤 {t('Voice')}</> }] : []),
                ...(guitarSupported ? [{ value: 'guitar' as const, label: <>🎸 {t('Guitar')}</> }] : []),
              ]}
              onChange={(m) => {
                setAnswerMode(m);
                saveSetting('pref_answerMode', m);
                if (m === 'voice') askForMic();
              }}
            />
            {answerMode === 'voice' && (
              <p className="set-card-help">
                {t('Speak clearly and pause briefly between words — for sharp/flat notes, say the letter, pause, then “sharp” / “flat” as two separate words.')}
              </p>
            )}
            {answerMode === 'guitar' && (
              <p className="set-card-help">
                {t('Play the target note on your guitar instead of tapping — the app listens through the microphone. Only works for “by fret” questions — a played note can’t say which string it came from, so “by note” questions stay on tap.')}
              </p>
            )}
          </SettingCard>
          {/* Voice engine + personal profile only matter once Voice is the
              chosen answer mode, so they live nested under it. */}
          {answerMode === 'voice' && (
            <ProGate
              feature="voiceProfile"
              anchor="voiceEngine"
              variant="replace"
              pitch={t('A personal voice profile built from your own calibration recordings')}
            >
              <SettingCard
                anchor="voiceEngine"
                label={t('Voice engine')}
                help={t('Auto picks the best available. Personal uses your calibrated profile; General uses the built-in model.')}
              >
                <PickRow
                  ariaLabel={t('Voice engine')}
                  value={voiceEnginePref}
                  options={[
                    { value: 'auto', label: t('Auto') },
                    { value: 'profile', label: t('Personal') },
                    { value: 'general', label: t('General') },
                  ]}
                  onChange={(v) => pickVoiceEngine(v)}
                />
              </SettingCard>
              <SettingCard
                anchor="voiceProfile"
                label={t('Your voice profile')}
                help={t('Calibrating your own voice improves recognition when answering by voice.')}
              >
                {voiceProfileStat && voiceProfileStat.count > 0 && (
                  <div className="sp2-hero">
                    <div className="sp2-tile">
                      <span className="sp2-tile-v">{voiceProfileStat.count}</span>
                      <span className="sp2-tile-l">{t('recordings')}</span>
                    </div>
                    <div className="sp2-tile">
                      <span className="sp2-tile-v" style={{ color: voiceProfileStat.enabled ? '#34e07a' : '#ff9d2e' }}>
                        {voiceProfileStat.enabled ? t('On') : t('Off')}
                      </span>
                      <span className="sp2-tile-l">{t('enabled')}</span>
                    </div>
                  </div>
                )}
                <button
                  className="set-card-btn"
                  onClick={click(() => { setSettingsOpen(false); setShowVoiceCalibration(true); })}
                >🎙️ {voiceProfileStat && voiceProfileStat.count > 0
                  ? t('Add / review recordings')
                  : t('Calibrate my voice')}</button>
              </SettingCard>
            </ProGate>
          )}
        </>
      )}
      <SettingCard
        anchor="showMastery"
        label={t('Mastery on the fretboard')}
        pin={<QuickAccessPinButton itemId="showMastery" />}
        help={<>{t('The per-note / per-fret accuracy bars drawn over the circle and grid while stopped or paused.')} <em>{t('Mastery keeps being tracked and shows on the Stats screen either way.')}</em></>}
      >
        <SegmentedControl
          ariaLabel={t('Mastery on the fretboard')}
          value={showMastery ? 'on' : 'off'}
          options={[
            { value: 'on', label: t('On') },
            { value: 'off', label: t('Off') },
          ]}
          onChange={(v) => { const on = v === 'on'; setShowMastery(on); saveSetting('pref_showMastery', on); }}
        />
      </SettingCard>
      <SettingCard
        anchor="colorblind"
        label={t('Colour-blind heatmap markers')}
        help={t('Adds a ✓ / • mark on the Stats-screen fretboard heatmap cells, on top of colour, so known vs. needs-work reads without relying on hue.')}
      >
        <SegmentedControl
          ariaLabel={t('Colour-blind heatmap markers')}
          value={colorblindHeat ? 'on' : 'off'}
          options={[
            { value: 'on', label: t('On') },
            { value: 'off', label: t('Off') },
          ]}
          onChange={(v) => { setColorblindHeat(v === 'on'); }}
        />
      </SettingCard>
      <ProGate
        feature="masteryMaps"
        anchor="masteryWindow"
        variant="replace"
        pitch={t('Point the mastery bars at a recent-question count, a single day, or a date range')}
      >
        <SettingCard
          anchor="masteryWindow"
          label={t('Mastery time window')}
          help={<>
            {t('What slice of your history the mastery bars are computed from. Free accounts use the last 250 questions. Older history saved without a date is not counted for a specific day or range.')}
            {' '}<em>{windowSummary}</em>
          </>}
        >
          <SegmentedControl
            ariaLabel={t('Mastery time window')}
            value={winMode}
            options={[
              { value: 'lastN', label: t('Recent') },
              { value: 'onDay', label: t('A day') },
              { value: 'dateRange', label: t('A range') },
            ]}
            onChange={(m) => {
              setWinMode(m);
              if (m === 'lastN') commitWindow({ kind: 'lastN', n: lastNMemo });
              else if (m === 'onDay') commitWindow({ kind: 'onDay', dayISO: daySel });
              else commitRange(rangeFrom, rangeTo);
            }}
          />
          {winMode === 'lastN' && (
            <PickRow
              ariaLabel={t('Questions counted')}
              value={String(lastNMemo)}
              options={PRO_MASTERY_LASTN_CHOICES.map((n) => ({
                value: String(n),
                label: n === 0 ? t('All') : String(n),
              }))}
              onChange={(v) => {
                const n = Number(v);
                setLastNMemo(n);
                commitWindow({ kind: 'lastN', n });
              }}
            />
          )}
          {winMode === 'onDay' && (
            <label className="set-date-field">
              <span>{t('A day')}</span>
              <input
                type="date"
                className="set-date-input"
                max={todayStr}
                value={daySel}
                onChange={(e) => {
                  const d = e.target.value;
                  if (!d) return;
                  setDaySel(d);
                  commitWindow({ kind: 'onDay', dayISO: d });
                }}
              />
            </label>
          )}
          {winMode === 'dateRange' && (
            <div className="set-date-range">
              <label className="set-date-field">
                <span>{t('From')}</span>
                <input
                  type="date"
                  className="set-date-input"
                  max={rangeTo || todayStr}
                  value={rangeFrom}
                  onChange={(e) => {
                    const from = e.target.value;
                    setRangeFrom(from);
                    commitRange(from, rangeTo);
                  }}
                />
              </label>
              <label className="set-date-field">
                <span>{t('To')}</span>
                <input
                  type="date"
                  className="set-date-input"
                  min={rangeFrom || undefined}
                  max={todayStr}
                  value={rangeTo}
                  onChange={(e) => {
                    const to = e.target.value;
                    setRangeTo(to);
                    commitRange(rangeFrom, to);
                  }}
                />
              </label>
            </div>
          )}
        </SettingCard>
      </ProGate>
      <SettingCard
        anchor="replayTours"
        label={t('Replay app tours')}
        help={t('Shows the first-time demo again the next time you open each practice domain.')}
      >
        <button
          className="set-card-btn"
          onClick={click(() => { resetAllDemos(); setToursReset(true); })}
        >
          {t('Replay app tours')}
        </button>
        {toursReset && <p className="set-card-help">{t('Tours reset.')}</p>}
      </SettingCard>
    </>
  );
}
