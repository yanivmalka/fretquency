// Admin "view the app as a brand-new user" preview.
//
// Lets an app admin live through the first-run experience (onboarding, the
// per-domain demos, the 7-day Premium trial) on their own account, then come
// back exactly as they were. Entering snapshots localStorage, clears the
// first-run flags and reloads; leaving restores the snapshot and reloads.
// While it is on, cloud sync is switched off (`sync.ts` treats the player as
// a guest, `upsertMyEntry` no-ops), so nothing done in the preview reaches
// the account — and the restore discards whatever the preview wrote locally.

const FLAG_KEY = 'adminBeginnerPreview';
const BACKUP_KEY = 'adminBeginnerBackup';
const VIEW_AS_USER_KEY = 'adminViewAsUser';

// Keys a genuinely new install does not have. Everything else (history,
// settings, learning state) stays, so the admin's own data keeps driving the
// screens; only "have I seen this" state is reset.
const FIRST_RUN_KEYS = [
  'onboardingDone', 'onboardingStep', 'legalAccepted', 'demoTours',
  'infoBubbleSeen', 'qaHintSeen', 'trialStartedAt', 'trialSummaryShown', 'trialEndingSoonShown',
];

const active: boolean = (() => {
  try { return localStorage.getItem(FLAG_KEY) === '1'; } catch { return false; }
})();

export function isBeginnerPreview(): boolean {
  return active;
}

// Supabase auth tokens must survive both directions or the admin is signed out.
const keepAsIs = (k: string) => k.startsWith('sb-') || k === FLAG_KEY || k === BACKUP_KEY;

export function startBeginnerPreview(): void {
  try {
    const snapshot: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keepAsIs(k)) snapshot[k] = localStorage.getItem(k) ?? '';
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
    FIRST_RUN_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(VIEW_AS_USER_KEY, '1');
    localStorage.setItem(FLAG_KEY, '1');
  } catch { return; }
  window.location.reload();
}

/** `viewAsUser`: the admin / regular-user view to land in once the snapshot is back. */
export function endBeginnerPreview(viewAsUser: boolean): void {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw) {
      const snapshot = JSON.parse(raw) as Record<string, string>;
      const stale: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !keepAsIs(k)) stale.push(k);
      }
      stale.forEach((k) => localStorage.removeItem(k));
      Object.entries(snapshot).forEach(([k, v]) => localStorage.setItem(k, v));
    }
    if (viewAsUser) localStorage.setItem(VIEW_AS_USER_KEY, '1');
    else localStorage.removeItem(VIEW_AS_USER_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(FLAG_KEY);
  } catch { /* storage disabled — nothing was changed to restore */ }
  window.location.reload();
}
