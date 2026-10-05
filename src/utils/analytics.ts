import { supabase } from './supabase';

// First-party, privacy-respecting usage measurement. No third-party SDK, no
// personal data: just an anonymous random install id (never tied to an
// account) plus an event name and a small JSON payload. Writes are
// insert-only (see supabase/migrations/0023_app_events.sql) and this module
// no-ops entirely when `supabase` is null (guest-only / config-less build).
//
// Coordinate new event names here rather than inventing ad-hoc strings at
// call sites, so the analytics table stays queryable.
export type AnalyticsEvent =
  | 'app_open'
  | 'first_round_finished'
  | 'round_finished'
  | 'd1_return'
  | 'd7_return'
  | 'learn_area_opened'
  | 'locked_tile_tapped'
  | 'upgrade_page_viewed'
  | 'share_used'
  | 'reminder_enabled'
  | 'opened_from_link';

const INSTALL_ID_KEY = 'installId';
const FIRST_ROUND_KEY = 'analyticsFirstRoundDone';
const INSTALL_DATE_KEY = 'analyticsInstallDate';
const LAST_RETURN_CHECK_KEY = 'analyticsLastReturnCheckDay';

function getInstallId(): string {
  try {
    let id = localStorage.getItem(INSTALL_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(INSTALL_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (e.g. private mode edge cases) — a per-call
    // random id still lets the event land, just not attributable to others
    // from the same install.
    return crypto.randomUUID();
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!supabase) return;
  const installId = getInstallId();
  void supabase.from('app_events').insert({
    install_id: installId,
    event,
    props: props ?? {},
  }).then(({ error }) => {
    if (error) console.warn('[analytics] track failed', event, error.message);
  });
}

// Marks the very first completed round for this install, in addition to the
// recurring `round_finished` event every session ends on.
export function trackRoundFinished(props?: Record<string, unknown>): void {
  track('round_finished', props);
  try {
    if (!localStorage.getItem(FIRST_ROUND_KEY)) {
      localStorage.setItem(FIRST_ROUND_KEY, '1');
      track('first_round_finished', props);
    }
  } catch {
    // Can't persist the flag — skip the one-time event rather than risk
    // re-firing it as "first" every launch.
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Call once per app boot. Tracks `app_open`, and on the first open of a new
// calendar day since install, fires `d1_return` / `d7_return` once each.
export function trackAppOpenAndReturns(): void {
  track('app_open');
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(LAST_RETURN_CHECK_KEY) === today) return;
    localStorage.setItem(LAST_RETURN_CHECK_KEY, today);

    let installDateStr = localStorage.getItem(INSTALL_DATE_KEY);
    if (!installDateStr) {
      installDateStr = today;
      localStorage.setItem(INSTALL_DATE_KEY, installDateStr);
      return; // install day itself is not a "return"
    }
    const daysSinceInstall = Math.round(
      (new Date(today).getTime() - new Date(installDateStr).getTime()) / DAY_MS,
    );
    if (daysSinceInstall === 1) track('d1_return');
    else if (daysSinceInstall === 7) track('d7_return');
  } catch {
    // No persistence available — skip return-day tracking this session.
  }
}
