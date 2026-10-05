// Daily practice reminder (product review 2026-10-05 §3ב / §4 item 5).
//
// Android: a real OS alarm via `@capacitor/local-notifications`, which fires
// even with the app closed. The plugin is dynamically imported so the web
// bundle never loads it (same convention as the speech-recognition plugin in
// speech.ts).
//
// Web: there is no background wake-up without a push server (Notification
// permission alone only lets a page fire a notification while it is open),
// so the web path is a best-effort foreground check — `maybeFireWebReminder`
// is polled while the app is open and fires at most once a day, past the
// chosen time. This limitation is called out in the Settings card's help
// text and recorded in the wishlist rather than silently pretending web
// parity.

import { Capacitor } from '@capacitor/core';
import { loadSetting, saveSetting } from './settings';

export const DEFAULT_REMINDER_TIME = '19:00';
const NOTIFICATION_ID = 190001;
const WEB_FIRED_KEY = 'reminderWebFiredDate';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Whether this platform can offer the reminder at all — every Android build,
 *  and a web browser with the Notification API. */
export function reminderSupported(): boolean {
  return isNative() || (typeof window !== 'undefined' && 'Notification' in window);
}

export function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return {
    hour: Number.isFinite(h) ? h : 19,
    minute: Number.isFinite(m) ? m : 0,
  };
}

export async function reminderPermissionDenied(): Promise<boolean> {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.checkPermissions();
    return status.display === 'denied';
  }
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied';
}

/** Requests the OS/browser permission. Callers gate *when* this runs (never
 *  on first launch — see useDailyReminder); this function only performs it. */
export async function requestReminderPermission(): Promise<boolean> {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  }
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Schedules (or re-schedules) the Android daily alarm. No-op on web — the
 *  web path is the foreground check below. */
export async function scheduleDailyReminder(time: string, title: string, body: string): Promise<void> {
  if (!isNative()) return;
  const { hour, minute } = parseTime(time);
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  await LocalNotifications.schedule({
    notifications: [{
      id: NOTIFICATION_ID,
      title,
      body,
      schedule: { on: { hour, minute }, allowWhileIdle: true },
    }],
  });
}

export async function cancelDailyReminder(): Promise<void> {
  if (!isNative()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
}

/** Web-only foreground check: fires a browser Notification at most once a
 *  calendar day, and only once the chosen time has passed. Call this from a
 *  poll (useDailyReminder ticks it every minute while mounted) — it is cheap
 *  and idempotent when there is nothing to do. */
export function maybeFireWebReminder(time: string, title: string, body: string): void {
  if (isNative() || typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const { hour, minute } = parseTime(time);
  const now = new Date();
  if (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute)) return;
  const today = now.toISOString().slice(0, 10);
  if (loadSetting<string>(WEB_FIRED_KEY, '') === today) return;
  saveSetting(WEB_FIRED_KEY, today);
  try { new Notification(title, { body }); } catch { /* best-effort */ }
}
