import { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { AppNavigation } from './useAppNavigation';
import type { CelebratedBadge } from '../components/BadgeCelebration';

export interface UseBackNavigationParams {
  nav: AppNavigation;
  running: boolean;
  paused: boolean;
  stop: () => void;
  revealBadges: CelebratedBadge[];
  setRevealBadges: (b: CelebratedBadge[]) => void;
  /** Whether the one-time guest sign-in nudge is currently on screen. */
  signInPromptOpen: boolean;
  /** "Maybe later" on that nudge (device-local, from App). */
  dismissSignInPrompt: () => void;
}

/**
 * A27 — "Back keeps you inside the app". Android's hardware Back / back-gesture
 * (via @capacitor/app) and the browser's Back button (via a History API
 * sentinel entry) both run the same ladder — close a popup, step back through
 * Settings, leave Stats, close the Tuner, stop a running round — instead
 * of dropping straight out of the app. Only on the bare home screen with
 * nothing left to undo does a second Back within 2s actually leave.
 *
 * The order of the branches in `consumeBack` *is* the behaviour; extracted from
 * App.tsx verbatim, including the popstate sentinel and `armExitHint`.
 */
export function useBackNavigation({
  nav,
  running,
  paused,
  stop,
  revealBadges,
  setRevealBadges,
  signInPromptOpen,
  dismissSignInPrompt,
}: UseBackNavigationParams): { exitHint: boolean } {
  const {
    micPrompt, setMicPrompt, showInfo, setShowInfo,
    settingsOpen, setSettingsOpen, drawerSection, setDrawerSection,
    showStats, setShowStats, showPath, setShowPath,
    activeDomain, setActiveDomain, upgradeFromAccountRef,
    tunerOpen, setTunerOpen, dailyChallengeOpen, setDailyChallengeOpen,
  } = nav;

  const [exitHint, setExitHint] = useState(false);
  // Everything the Back handler reads, refreshed after each render so the
  // listeners (bound once) always see current values without re-subscribing.
  const backNav = useRef({
    micPrompt, showInfo, revealBadges, signInPromptOpen, settingsOpen, drawerSection,
    showStats, showPath, activeDomain, tunerOpen, dailyChallengeOpen, running, paused, stop,
  });
  useEffect(() => {
    backNav.current = {
      micPrompt, showInfo, revealBadges, signInPromptOpen, settingsOpen, drawerSection,
      showStats, showPath, activeDomain, tunerOpen, dailyChallengeOpen, running, paused, stop,
    };
  });
  useEffect(() => {
    // Step the app back one level. Returns true when it consumed a level,
    // false when already on the bare home screen.
    const consumeBack = (): boolean => {
      const s = backNav.current;
      if (s.micPrompt) { setMicPrompt(null); return true; }
      if (s.showInfo) { setShowInfo(false); return true; }
      if (s.revealBadges.length > 0) { setRevealBadges([]); return true; }
      if (s.signInPromptOpen) { dismissSignInPrompt(); return true; }
      // Settings drawer and its sub-pages (mirrors the Escape ladder above).
      if (s.settingsOpen) {
        if (s.drawerSection !== null) {
          const toAccount = s.drawerSection === 'badges'
            || (s.drawerSection === 'upgrade' && upgradeFromAccountRef.current);
          setDrawerSection(toAccount ? 'account' : null);
        } else {
          setSettingsOpen(false);
        }
        return true;
      }
      if (s.showStats) { setShowStats(false); return true; }
      if (s.showPath) { setShowPath(false); return true; }
      // Learning-type tabs step back to the "Learn" drawer hub they were
      // launched from, not all the way out to the Selector / home screen.
      if (s.activeDomain !== 'notes') {
        setActiveDomain('notes');
        setSettingsOpen(true);
        setDrawerSection('learn');
        return true;
      }
      if (s.tunerOpen) { setTunerOpen(false); return true; }
      if (s.dailyChallengeOpen) { setDailyChallengeOpen(false); return true; }
      if (s.running || s.paused) { s.stop(); return true; }
      return false;
    };

    let armed = false;
    let armedTimer: number | null = null;
    const disarm = () => {
      armed = false;
      if (armedTimer !== null) { clearTimeout(armedTimer); armedTimer = null; }
      setExitHint(false);
    };
    const armExitHint = () => {
      armed = true;
      setExitHint(true);
      armedTimer = window.setTimeout(disarm, 2000);
    };

    // Android hardware Back (native shell only fires this).
    let removeNative: (() => void) | undefined;
    CapacitorApp.addListener('backButton', () => {
      if (consumeBack()) return;
      if (armed) { disarm(); void CapacitorApp.exitApp(); return; }
      armExitHint();
    }).then((h) => { removeNative = () => h.remove(); });

    // Browser Back button / gesture. A sentinel history entry sits "ahead" of
    // the app so Back fires popstate here instead of unloading the page; we
    // re-push it after every handled press. Skipped in the native shell, where
    // the plugin above owns Back.
    const isNative = Capacitor.isNativePlatform();
    const pushSentinel = () => {
      try { window.history.pushState({ gfpBackTrap: true }, ''); } catch { /* history unavailable */ }
    };
    const onPopState = () => {
      if (consumeBack()) { pushSentinel(); return; }
      if (armed) {
        disarm();
        window.removeEventListener('popstate', onPopState);
        window.history.back(); // leave the app (or close the installed PWA)
        return;
      }
      pushSentinel();
      armExitHint();
    };
    if (!isNative) {
      // Guard against a second sentinel from StrictMode / HMR remounts.
      if (!(window.history.state as { gfpBackTrap?: boolean } | null)?.gfpBackTrap) {
        pushSentinel();
      }
      window.addEventListener('popstate', onPopState);
    }

    return () => {
      removeNative?.();
      if (armedTimer !== null) clearTimeout(armedTimer);
      window.removeEventListener('popstate', onPopState);
    };
    // Bound once: every value the handler needs is read live through `backNav`,
    // and the setters are stable. Same empty-deps contract as in App.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { exitHint };
}
