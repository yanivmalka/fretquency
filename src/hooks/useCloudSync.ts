import { useCallback, useEffect, useState } from 'react';
import type { useAuth } from './useAuth';
import type { useHistory } from './useHistory';
import { bootstrapUser, reconcileUser, syncedUser, clearSyncedUser, cloudCaptureOrphans, restoreOnly } from '../utils/sync';
import { bootstrapSettings, clearSyncedSettingsUser, cloudPushSettings } from '../utils/settingsSync';
import { bootstrapBadges, syncedBadgesUser, clearSyncedBadgesUser, cloudPushBadges } from '../utils/badgeSync';
import {
  bootstrapLearning, syncedLearningUser, clearSyncedLearningUser, clearLocalLearningState, cloudPushLearning,
} from '../learning/learningSync';
import { loadAllBests, writeAllBests } from '../utils/personalBest';
import { flattenHistory } from '../utils/mastery';
import { getActiveProfile, setActiveProfile, recomputeReady } from '../utils/voiceProfile';
import { PROFILE_LABELS, SAMPLES_PER_LABEL } from '../utils/voiceProfileVocab';
import { bootstrapVoiceProfile, voiceSyncedUser, clearVoiceSyncedUser } from '../utils/voiceSync';
import { resetSpeechEngine } from '../utils/speech';

interface Params {
  auth: ReturnType<typeof useAuth>;
  historyOps: ReturnType<typeof useHistory>;
  // A restored voice profile re-selects the speech engine; the calibration
  // epoch is owned by useVoiceProfileSummary, so the bump is passed in.
  bumpVoiceEngineEpoch: () => void;
}

// ── Accounts (optional): guests are unaffected; signing in with Google syncs
// History + Personal Best to the account and restores them on other devices.
// localStorage stays the source of truth the UI reads from. Every effect here
// is keyed on `auth.user`; each cloud-sync module keeps its own "synced user"
// flag so the pull→merge→push bootstrap runs once per account per device, with
// an idempotent reconcile on later app starts / reconnect.
export function useCloudSync({ auth, historyOps, bumpVoiceEngineEpoch }: Params) {
  const { replaceAllHistory, getAllHistory } = historyOps;

  // First sign-in on a device that has local guest history: ask before
  // merging it into the account (design §5.4). The sign-in effect only sets
  // this flag; the actual bootstrap / capture+restore runs in the prompt's
  // button handlers, so the async sign-in flow isn't blocked on a user choice.
  const [pendingGuestMerge, setPendingGuestMerge] = useState(false);
  const guestMergeKey = (userId: string) => `guestMergeChoice:${userId}`;
  const finishGuestMerge = useCallback(async (choice: 'merge' | 'account-only') => {
    setPendingGuestMerge(false);
    const user = auth.user;
    if (!user) return;
    try {
      if (choice === 'merge') {
        // The original behavior: union this device's guest rows into the
        // account, push, and commit the merged set locally.
        const { history, bests } = await bootstrapUser(
          user.id, getAllHistory(), loadAllBests(),
        );
        replaceAllHistory(history);
        writeAllBests(bests);
      } else {
        // Keep the guest rows off the account: drop them into orphan_practice
        // for analytics, then restore the account's own cloud data locally,
        // replacing the guest history and bests on this device.
        await cloudCaptureOrphans(flattenHistory(getAllHistory()));
        const { history, bests } = await restoreOnly(user.id);
        replaceAllHistory(history);
        writeAllBests(bests);
      }
      try { localStorage.setItem(guestMergeKey(user.id), choice); } catch { /* ignore */ }
    } catch {
      /* offline or transient error — the sign-in effect retries next start */
    }
  }, [auth.user, getAllHistory, replaceAllHistory]);

  useEffect(() => {
    const user = auth.user;
    if (!user) { clearSyncedUser(); return; }
    let cancelled = false;
    (async () => {
      // Cleared here (inside the async body, not synchronously in the effect)
      // so a stale prompt from a previous account can't linger; re-armed below
      // only on a genuine first sign-in with un-merged guest history.
      setPendingGuestMerge(false);
      try {
        if (syncedUser() !== user.id) {
          // First sign-in on this device. With no local guest history there is
          // nothing to merge — restore straight from the cloud, no prompt.
          if (flattenHistory(getAllHistory()).length === 0) {
            const { history, bests } = await bootstrapUser(
              user.id, getAllHistory(), loadAllBests(),
            );
            if (cancelled) return;
            replaceAllHistory(history);
            writeAllBests(bests);
            return;
          }
          // Local guest history exists: honor a remembered choice silently,
          // otherwise ask (design §5.4).
          let stored: string | null = null;
          try { stored = localStorage.getItem(guestMergeKey(user.id)); } catch { /* ignore */ }
          if (cancelled) return;
          if (stored === 'merge' || stored === 'account-only') {
            await finishGuestMerge(stored);
          } else {
            setPendingGuestMerge(true);
          }
        } else {
          // Already merged before — pull the tombstone set, retire any
          // cleared rows that still survive here, then re-push what's left
          // (this also carries up anything written offline).
          const { history, changed } = await reconcileUser(
            user.id, getAllHistory(), loadAllBests(),
          );
          if (cancelled) return;
          if (changed) replaceAllHistory(history);
        }
      } catch {
        /* offline or transient error — retried on next sign-in / app start */
      }
    })();
    return () => { cancelled = true; };
  }, [auth.user, replaceAllHistory, getAllHistory, finishGuestMerge]);

  // Selector picks + UI preferences: adopt the account's settings blob if it's
  // newer than what this device last synced. Applied by writing localStorage
  // then reloading, so the settings hooks read the restored values at mount
  // (they only read localStorage once). A no-op when the cloud blob isn't
  // newer, in which case it pushes this device's snapshot up instead.
  //
  // This runs on every sign-in / app start, not just the first bootstrap on a
  // device: `bootstrapSettings` is an idempotent pull→adopt-or-push reconcile
  // (same cadence as the history / badges / learning effects), so a
  // settings change made on another device — e.g. enabling Quick Access or
  // pinning a shortcut — reaches this device on its next start without a
  // sign-out/in.
  useEffect(() => {
    const user = auth.user;
    if (!user) { clearSyncedSettingsUser(); return; }
    let cancelled = false;
    (async () => {
      try {
        const { applied } = await bootstrapSettings(user.id);
        if (cancelled) return;
        if (applied) window.location.reload();
      } catch {
        /* offline or transient error — retried on next sign-in / app start */
      }
    })();
    return () => { cancelled = true; };
  }, [auth.user]);

  // Earned badges: pull/merge/push the `badges` store on sign-in / app start,
  // so session badges (and every badge's original earnedAt) restore instead of
  // being lost on a device switch. The merge keeps the earliest earnedAt per
  // badge, so it's safe to re-run; badgeSync fires a `badges-synced` event if
  // the local set changed, which a mounted BadgeGrid re-reads on. A device
  // that already bootstrapped this account still runs the cheap reconcile
  // (one row) to pull anything earned elsewhere since its last visit.
  useEffect(() => {
    const user = auth.user;
    if (!user) { clearSyncedBadgesUser(); return; }
    if (syncedBadgesUser() === user.id) { cloudPushBadges(); return; }
    void (async () => {
      try {
        await bootstrapBadges(user.id);
      } catch {
        /* offline or transient error — retried on next sign-in / app start */
      }
    })();
  }, [auth.user]);

  // Premium Teacher learning state (SRS schedule + daily goal): pull / merge /
  // push the JSONB blob on sign-in / app start, same cadence as badgeSync. The
  // merge is per-NoteItem (never last-writer), so a review made on another
  // device is not discarded. A device that already bootstrapped still fires
  // the cheap write-through to carry up anything answered offline.
  useEffect(() => {
    const user = auth.user;
    // Signed out: drop this device's learning blob so it can't be merged into
    // the next account's cloud row on a shared device. A Free user's Teacher
    // is inert, so there is nothing live to lose.
    if (!user) { clearSyncedLearningUser(); clearLocalLearningState(); return; }
    if (syncedLearningUser() === user.id) { cloudPushLearning(); return; }
    void (async () => {
      try {
        await bootstrapLearning(user.id);
      } catch {
        /* offline or transient error — retried on next sign-in / app start */
      }
    })();
  }, [auth.user]);

  // Same model, for the personal voice profile: pull/merge/push once per
  // sign-in on this device, then switch the app onto the restored profile.
  useEffect(() => {
    const user = auth.user;
    if (!user) { clearVoiceSyncedUser(); return; }
    if (voiceSyncedUser() === user.id) return;
    let cancelled = false;
    (async () => {
      try {
        const merged = await bootstrapVoiceProfile(user.id);
        if (cancelled || !merged.length) return;
        // Keep the device's current profile if it's among the restored rows;
        // otherwise switch to whichever profile was touched most recently.
        const current = getActiveProfile();
        const profiles = [...new Set(merged.map((r) => r.profile))];
        const chosen = current && profiles.includes(current)
          ? current
          : merged.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b)).profile;
        setActiveProfile(chosen);
        const vocabIds = [...new Set(
          merged.filter((r) => r.profile === chosen).map((r) => r.vocabId),
        )];
        for (const vocabId of vocabIds) {
          await recomputeReady(vocabId, [...PROFILE_LABELS], SAMPLES_PER_LABEL);
        }
        resetSpeechEngine();
        bumpVoiceEngineEpoch();
      } catch {
        /* offline or transient error — retried on next sign-in / app start */
      }
    })();
    return () => { cancelled = true; };
  }, [auth.user]);

  // A round played offline only reaches the cloud on the next app start:
  // write-through (cloudInsertEntry / cloudPushSettings) is dropped while
  // navigator.onLine is false and nothing replays it. Re-run the idempotent
  // history + settings reconcile — and re-arm the other pushes — as soon as
  // the network comes back.
  useEffect(() => {
    const user = auth.user;
    if (!user) return;
    let cancelled = false;
    const onOnline = () => {
      void (async () => {
        try {
          if (syncedUser() === user.id) {
            const { history, changed } = await reconcileUser(
              user.id, getAllHistory(), loadAllBests(),
            );
            if (!cancelled && changed) replaceAllHistory(history);
          } else {
            const { history, bests } = await bootstrapUser(
              user.id, getAllHistory(), loadAllBests(),
            );
            if (cancelled) return;
            replaceAllHistory(history);
            writeAllBests(bests);
          }
        } catch {
          /* transient — retried on the next reconnect / app start */
        }
        try {
          const { applied } = await bootstrapSettings(user.id);
          if (applied && !cancelled) { window.location.reload(); return; }
        } catch { cloudPushSettings(); }
        cloudPushBadges();
        cloudPushLearning();
      })();
    };
    window.addEventListener('online', onOnline);
    return () => { cancelled = true; window.removeEventListener('online', onOnline); };
  }, [auth.user, replaceAllHistory, getAllHistory]);

  // Local guest-history row count, shown in <GuestMergePrompt>.
  const guestLocalRowCount = pendingGuestMerge
    ? flattenHistory(getAllHistory()).length
    : 0;

  return { pendingGuestMerge, finishGuestMerge, guestLocalRowCount };
}
