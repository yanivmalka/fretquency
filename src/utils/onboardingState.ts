// Whether first-run onboarding (welcome, privacy consent, sign-in offer,
// instrument + placement) has been completed on this device.
//
// A tiny external store so components mounted outside <App> — the ad strip —
// can hold back until the player has seen the welcome screens and accepted
// the privacy policy.

import { loadSetting, saveSetting } from './settings';

export const PRIVACY_POLICY_URL = 'https://yanivmalka.github.io/fretquency/privacy.html';
export const TERMS_URL = 'https://yanivmalka.github.io/fretquency/terms.html';
// The "Last updated" dates of public/privacy.html and public/terms.html. Bump
// them with the pages so a stored acceptance records which text was agreed to.
const PRIVACY_POLICY_VERSION = '2026-09-25';
const TERMS_VERSION = '2026-10-05';

let done = loadSetting<boolean>('onboardingDone', false);
const listeners = new Set<() => void>();

export function markOnboardingDone(): void {
  saveSetting('onboardingDone', true);
  localStorage.removeItem('onboardingStep');
  if (done) return;
  done = true;
  listeners.forEach((fn) => fn());
}

export function isOnboardingDone(): boolean {
  return done;
}

export function subscribeOnboardingDone(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function recordLegalAccepted(): void {
  saveSetting('legalAccepted', {
    privacy: PRIVACY_POLICY_VERSION,
    terms: TERMS_VERSION,
    at: new Date().toISOString(),
  });
}
