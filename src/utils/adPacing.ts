// Ad pacing: decides *when* the Free-tier ad strip appears.
//
// The rules (product owner):
//   • the strip only ever shows while the user is browsing — never during a
//     drill;
//   • a guest sees it on every browsing screen, always, with no way to close it;
//   • a signed-in Free user sees it as soon as the app opens (first launch
//     included), and after that once every random 1–3 rounds — finished or
//     stopped part-way, both count — until the next round starts or they
//     close it;
//   • none of the above applies on install day, or for anyone's first three
//     rounds ever (whichever is longer) — a brand-new player, guest or
//     signed-in, never sees an ad before they've felt the app work. This
//     overrides even the guest's "always" rule.
//
// Every drill engine reports two moments here: a round being started
// (`noteRoundStarted`) and a round ending, naturally, by the user stopping it,
// or by its screen unmounting mid-round (`noteRoundEnded`). From those this
// module keeps two flags: `roundActive` (a drill is on screen — no strip for
// anyone; Practice also holds it through its 3-2-1 count-in and the Auto
// Advance gap via `setDrillHold`) and `pending` (the Free user's paced strip is due). Each paced cycle
// draws a fresh 1–3 threshold.
//
// Who sees ads at all, and which flag applies, is NOT decided here:
// `<AdBanner>` gates on `can('noAds', tier)` and on whether anyone is signed
// in. This module is only the pacing state, held in a tiny external store (like
// devSimulateTier) so every engine can report into it without a context
// provider. In-memory on purpose — a fresh launch starts a fresh cycle (with
// the strip already up), and nothing here is worth syncing.

import { loadSetting, saveSetting } from './settings';

export const AD_MIN_ROUNDS = 1;
export const AD_MAX_ROUNDS = 3;
// Ad-free grace window: install day, and this many rounds no matter how many
// days that takes (a player who only opens the app once a day still gets
// three ad-free rounds before the first ad).
const AD_FREE_ROUNDS = 3;
const INSTALL_DATE_KEY = 'installDate';
const LIFETIME_ROUNDS_KEY = 'lifetimeRoundsCompleted';

function todayKey(): string {
  return new Date().toDateString();
}

// Device-local only — never synced to the cloud (not in settingsSync's key
// list) and not reset by sign-in/sign-out, since it tracks the device's
// install, not the account.
let installDate = loadSetting<string>(INSTALL_DATE_KEY, '');
if (!installDate) {
  installDate = todayKey();
  saveSetting(INSTALL_DATE_KEY, installDate);
}
let lifetimeRounds = loadSetting<number>(LIFETIME_ROUNDS_KEY, 0);

/** True during the new-player grace window: install day, or the first three
 *  rounds ever on this device. Overrides ad visibility entirely, guest included. */
export function isAdFreeWindow(): boolean {
  return todayKey() === installDate || lifetimeRounds < AD_FREE_ROUNDS;
}

function drawThreshold(): number {
  return AD_MIN_ROUNDS + Math.floor(Math.random() * (AD_MAX_ROUNDS - AD_MIN_ROUNDS + 1));
}

let roundsSinceAd = 0;
let threshold = drawThreshold();
// Up from launch: a Free user sees the strip as soon as the app opens
// (outside the ad-free grace window above).
let pending = true;
let roundActive = false;
let drillHold = false;
const listeners = new Set<() => void>();

function emit() { listeners.forEach(l => l()); }

export function isAdPending(): boolean {
  return pending;
}

/** True while a drill round is running (or paused) on screen. */
export function isRoundActive(): boolean {
  return roundActive || drillHold;
}

/** Practice's count-in / Auto Advance gap: no round is running, but the user
 *  is still in the drill, so the strip stays down. */
export function setDrillHold(on: boolean): void {
  if (drillHold === on) return;
  drillHold = on;
  emit();
}

export function subscribeAdPending(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => { listeners.delete(onChange); };
}

/** A round ended — ran to its natural end, was stopped part-way by the user, or
 *  its screen went away mid-round. Raises the paced strip once the count
 *  reaches the current threshold. */
export function noteRoundEnded(): void {
  const wasActive = roundActive;
  roundActive = false;
  if (wasActive && lifetimeRounds < AD_FREE_ROUNDS) {
    lifetimeRounds += 1;
    saveSetting(LIFETIME_ROUNDS_KEY, lifetimeRounds);
  }
  if (!pending) {
    roundsSinceAd += 1;
    if (roundsSinceAd >= threshold) pending = true;
  }
  if (wasActive || pending) emit();
}

/** A round is starting: take the strip down (the user is practising again). */
export function noteRoundStarted(): void {
  roundActive = true;
  if (!dismissAd()) emit();
}

/** Take the paced strip down and begin a new cycle with a fresh random
 *  threshold. Returns whether anything changed (listeners already notified). */
export function dismissAd(): boolean {
  if (!pending) return false;
  pending = false;
  roundsSinceAd = 0;
  threshold = drawThreshold();
  emit();
  return true;
}

/** Rounds completed on this device, capped at `AD_FREE_ROUNDS` (the counter
 *  stops climbing once ad pacing no longer needs it) — enough to answer "has
 *  this player finished at least N rounds yet?", e.g. gating the daily
 *  reminder's permission prompt to after their second round. */
export function lifetimeRoundsCompleted(): number {
  return lifetimeRounds;
}
