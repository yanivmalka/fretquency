import { useCallback, useEffect, useState } from 'react';
import { loadSetting, saveSetting } from '../utils/settings';
import {
  DEFAULT_REMINDER_TIME, isNative, reminderSupported, requestReminderPermission,
  reminderPermissionDenied, scheduleDailyReminder, cancelDailyReminder, maybeFireWebReminder,
} from '../utils/reminder';
import { lifetimeRoundsCompleted } from '../utils/adPacing';
import { onDailyActivityUpdated, todayActivityCount } from '../utils/dailyActivity';
import { track } from '../utils/analytics';
import { useTranslation } from '../i18n/useTranslation';

/** Rounds a player must finish before the reminder's permission prompt may
 *  fire — review rule: "never on first launch". The Settings card hides the
 *  prompt behind a hint until this is met instead of asking right away. */
const MIN_ROUNDS_BEFORE_PROMPT = 2;

/**
 * Owns the daily-reminder preference (on/off + time), persists it the same
 * way every other `pref_*` setting does (so settingsSync picks it up), and
 * keeps the platform scheduler (Android alarm or web foreground check) in
 * sync with it. Presentation lives in the Settings card; this hook has no
 * JSX.
 */
export function useDailyReminder() {
  const { t } = useTranslation();
  const [enabled, setEnabledState] = useState<boolean>(() => loadSetting('pref_reminderEnabled', false));
  const [time, setTimeState] = useState<string>(() => loadSetting('pref_reminderTime', DEFAULT_REMINDER_TIME));
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [offerSeen, setOfferSeen] = useState<boolean>(() => loadSetting('pref_reminderOfferSeen', false));

  // Reactive "did the player already practise today" — every practice
  // source fires `daily-activity-updated` (see utils/dailyActivity.ts), so
  // this flips to true the moment a round finishes, which is also the cue
  // to re-arm the (one-shot, see reminder.ts) Android alarm for tomorrow
  // instead of today (review §3ב item 10 — it used to fire regardless).
  const [practicedToday, setPracticedToday] = useState(() => todayActivityCount() > 0);
  useEffect(() => onDailyActivityUpdated(() => setPracticedToday(todayActivityCount() > 0)), []);

  const title = t('Time to practice');
  const body = t("A couple of minutes keeps your streak alive — don't lose it today.");

  useEffect(() => {
    if (!enabled) { void cancelDailyReminder(); return; }
    void scheduleDailyReminder(time, title, body, practicedToday);
  }, [enabled, time, title, body, practicedToday]);

  // Web only: poll once a minute while the app is open. Native builds skip
  // this entirely — the Android alarm fires on its own.
  useEffect(() => {
    if (!enabled || isNative()) return;
    maybeFireWebReminder(time, title, body, practicedToday);
    const id = window.setInterval(() => maybeFireWebReminder(time, title, body, practicedToday), 60_000);
    return () => window.clearInterval(id);
  }, [enabled, time, title, body, practicedToday]);

  useEffect(() => {
    if (!enabled) return;
    void reminderPermissionDenied().then(setPermissionDenied);
  }, [enabled]);

  /** True once the player has finished enough rounds to be asked for
   *  notification permission at all (review rule — never on first launch). */
  const canPrompt = lifetimeRoundsCompleted() >= MIN_ROUNDS_BEFORE_PROMPT;

  const setEnabled = useCallback((v: boolean) => {
    if (!v) {
      setEnabledState(false);
      saveSetting('pref_reminderEnabled', false);
      return;
    }
    if (lifetimeRoundsCompleted() < MIN_ROUNDS_BEFORE_PROMPT) return; // caller checks canPrompt first
    void requestReminderPermission().then((granted) => {
      setPermissionDenied(!granted);
      if (!granted) return;
      setEnabledState(true);
      saveSetting('pref_reminderEnabled', true);
      track('reminder_enabled');
    });
  }, []);

  const setTime = useCallback((v: string) => {
    setTimeState(v);
    saveSetting('pref_reminderTime', v);
  }, []);

  /** Dismisses the one-time home-screen offer for good (whether the player
   *  said yes, not-now, or got denied) — Settings stays reachable either
   *  way, this only stops the unprompted card from reappearing. */
  const dismissOffer = useCallback(() => {
    setOfferSeen(true);
    saveSetting('pref_reminderOfferSeen', true);
  }, []);

  // Review §3ב item 10 / §4 item 8: offer the reminder once, right after the
  // player's 2nd finished round, instead of leaving it buried in Settings.
  // Never offered once already enabled, already answered, or unsupported.
  const shouldOfferReminder = canPrompt && !enabled && !offerSeen && reminderSupported();

  return {
    enabled, time, setEnabled, setTime,
    canPrompt, permissionDenied,
    supported: reminderSupported(),
    shouldOfferReminder, dismissOffer,
  };
}
