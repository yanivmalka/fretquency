// ── Reverse Premium trial — 7 days of Premium from install, no card ──────
//
// A client-side convenience, exactly like devSimulateTier: it never writes to
// the server-side `entitlements` table (the real paid-tier grant stays
// admin/webhook-only, per design), and RLS-protected data stays protected
// regardless of its value. It only ever *adds* a temporary 'premium' floor on
// top of the real entitlement in useAuth's tier computation — never removes
// anything a paid row already grants, and a real `entitlements` row always
// wins once it exists.
//
// Local-first like everything else here: `trialStartedAt` lives in
// localStorage and starts once per device, only on a genuinely new install
// (see `ensureTrialStarted`). For a signed-in user it is also reconciled
// against `public.premium_trial` (migration 0024) so the trial can't be
// restarted by signing out/in, reinstalling, or switching devices — the first
// device to reach the server for a given account wins the start date, and
// every later sync adopts that date instead of keeping a later local one. A
// signed-out guest has no server copy, so clearing site data does restart a
// guest's trial — an accepted, documented limitation (there is nothing to key
// a guest's trial on besides the device itself).
//
// Existing installs (anyone who had already finished onboarding before this
// shipped) are deliberately NOT granted a trial retroactively — see
// `ensureTrialStarted`. Granting one would feel like a bait-and-switch on
// players who already settled into the Free experience.

import { supabase } from './supabase';
import { track } from './analytics';

export const TRIAL_DAYS = 7;

const STARTED_KEY = 'trialStartedAt';
const INELIGIBLE = 'ineligible';
const SUMMARY_SHOWN_KEY = 'trialSummaryShown';
const ENDING_SOON_SHOWN_KEY = 'trialEndingSoonShown';
// How many days-left count as "ending soon" for the one-time day-5 nudge
// below (a 7-day trial reaches this on day 5).
const ENDING_SOON_THRESHOLD_DAYS = 2;

function readStarted(): string | null {
  try { return localStorage.getItem(STARTED_KEY); } catch { return null; }
}
function writeStarted(v: string): void {
  try { localStorage.setItem(STARTED_KEY, v); } catch { /* storage full/disabled */ }
}

/**
 * Starts the local trial clock the first time this runs on a device that has
 * never completed onboarding — i.e. a genuinely new install. Call once at
 * boot, before or alongside onboarding, regardless of sign-in state. A device
 * that had already finished onboarding before this shipped is marked
 * ineligible instead, so it is only ever evaluated once.
 */
export function ensureTrialStarted(alreadyOnboarded: boolean): void {
  if (readStarted() !== null) return;
  if (alreadyOnboarded) { writeStarted(INELIGIBLE); return; }
  writeStarted(new Date().toISOString());
  track('trial_started');
}

function startedDate(): Date | null {
  const raw = readStarted();
  if (!raw || raw === INELIGIBLE) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  // Clamp a future-dated value (a guest editing localStorage, or a stray
  // server row) to now, so it can never push `trialEndsAt` further out than
  // a real start would — closes the "set trialStartedAt to the future for
  // indefinite free Premium" gap (product review 2026-10-05 §3ב item 12).
  const now = Date.now();
  return d.getTime() > now ? new Date(now) : d;
}

/** When the trial ends, or null if this device never had one. */
export function trialEndsAt(): Date | null {
  const started = startedDate();
  if (!started) return null;
  return new Date(started.getTime() + TRIAL_DAYS * 86_400_000);
}

/** Whole days left (0 on the last day), or null if no trial ever started. */
export function trialDaysLeft(): number | null {
  const ends = trialEndsAt();
  if (!ends) return null;
  return Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86_400_000));
}

export function isTrialActive(): boolean {
  const ends = trialEndsAt();
  return !!ends && ends.getTime() > Date.now();
}

/** True once a real trial has run its course and the one-time end-of-trial
 *  summary hasn't been shown yet. Pair a read with `markTrialSummaryShown`. */
export function trialJustEnded(): boolean {
  if (isTrialActive()) return false;
  if (!trialEndsAt()) return false;
  try { return localStorage.getItem(SUMMARY_SHOWN_KEY) !== 'true'; } catch { return false; }
}

export function markTrialSummaryShown(): void {
  track('trial_ended');
  try { localStorage.setItem(SUMMARY_SHOWN_KEY, 'true'); } catch { /* ignore */ }
}

/** True once, a few days before a still-active trial ends, so the one-time
 *  "ends soon" nudge can fire exactly once (product review 2026-10-05 §3ב/4,
 *  item 3). Pair a read with `markTrialEndingSoonShown`. */
export function trialEndingSoon(): boolean {
  const days = trialDaysLeft();
  if (days === null || !isTrialActive()) return false;
  if (days > ENDING_SOON_THRESHOLD_DAYS) return false;
  try { return localStorage.getItem(ENDING_SOON_SHOWN_KEY) !== 'true'; } catch { return false; }
}

export function markTrialEndingSoonShown(): void {
  try { localStorage.setItem(ENDING_SOON_SHOWN_KEY, 'true'); } catch { /* ignore */ }
}

/**
 * Reconcile this device's trial start against `public.premium_trial`
 * (migration 0024) for a signed-in user, so switching devices or signing out
 * and back in can't restart the trial. A no-op if Supabase isn't configured
 * or this device was never trial-eligible. First writer for the account wins;
 * every call after that adopts whatever the server already has.
 */
export async function syncTrialStart(userId: string): Promise<void> {
  if (!supabase) return;
  const local = readStarted();
  if (local === INELIGIBLE) return;
  try {
    const { data } = await supabase
      .from('premium_trial')
      .select('started_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (data?.started_at) { writeStarted(data.started_at as string); return; }

    const toWrite = local ?? new Date().toISOString();
    const { error } = await supabase
      .from('premium_trial')
      .insert({ user_id: userId, started_at: toWrite });
    if (!error) { writeStarted(toWrite); return; }

    // Lost a race with another device inserting first — adopt its date.
    const { data: after } = await supabase
      .from('premium_trial')
      .select('started_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (after?.started_at) writeStarted(after.started_at as string);
  } catch {
    /* offline / best-effort — local value stands until the next sync */
  }
}
