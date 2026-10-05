import { useState, useEffect, useMemo, useRef } from 'react';
import { loadSetting, saveSetting } from '../utils/settings';
import { registerUpgradeHandler } from '../utils/upgradeDrawer';
import type { LearnDomain } from '../components/LearnHub';
import type { UseVoiceAnswerResult } from './useVoiceAnswer';

type MicPrompt = null | 'primer' | 'denied';

interface StoredView {
  stats?: boolean;
  settingsOpen?: boolean;
  section?: string | null;
  upgradeFromAccount?: boolean;
  path?: boolean;
}

export interface UseAppNavigationParams {
  signInPromptSeen: boolean;
  /** "Maybe later" on the guest sign-in nudge (device-local, from App). */
  dismissSignInPrompt: () => void;
  /** Whether any instrument has recorded history — gates the first-time hint. */
  hasAnyHistory: boolean;
  voice: Pick<UseVoiceAnswerResult, 'supported' | 'permission' | 'ensurePermission'>;
}

/**
 * A26 (+A28 microphone card, +A29 info bubble): every "which screen is open"
 * flag, the refs the Back ladder and the drawer read, the `gfp_view`
 * reload-restore persistence, `registerUpgradeHandler`, and the Escape-key
 * ladder that mirrors hardware Back. Extracted from App.tsx unchanged — no
 * behaviour, order or naming change.
 */
export function useAppNavigation({
  signInPromptSeen,
  dismissSignInPrompt,
  hasAnyHistory,
  voice,
}: UseAppNavigationParams) {
  // Which screen is open (Stats, the settings drawer, a settings sub-page) is
  // stashed in sessionStorage so a page reload — the ↻ button, or the browser's
  // own refresh — lands back where you were instead of on the home screen.
  // sessionStorage (not localStorage) so a fresh launch still starts at home.
  const initialView = useMemo<StoredView | null>(() => {
    try {
      const raw = sessionStorage.getItem('gfp_view');
      return raw ? (JSON.parse(raw) as StoredView) : null;
    } catch {
      return null;
    }
  }, []);
  // The unified "Stats & progress" screen (current-setup stats + all-time progress tabs).
  const [showStats, setShowStats] = useState(() => initialView?.stats ?? false);
  // The Premium Learning Path screen (P3) — a full page shown alongside the
  // Selector, opened from the Today card. Persisted to `gfp_view` like the
  // other full-screen views so a reload lands back on it.
  const [showPath, setShowPath] = useState(() => initialView?.path ?? false);
  const [settingsOpen, setSettingsOpen] = useState(() => initialView?.settingsOpen ?? false);
  // Which learning-type tab is showing (drawer "Learn" group). Not persisted —
  // every launch / reload starts on 'notes' (the Selector). See LEARN_TABS.
  const [activeDomain, setActiveDomain] = useState<LearnDomain>('notes');
  // Which settings sub-page is open inside the drawer; null = the list of titles.
  const [drawerSection, setDrawerSection] = useState<string | null>(() => initialView?.section ?? null);
  // How the menu and the pages opened from it (a section, or Stats via its
  // row's onSelect) hand over. Each screen is its own return in App, so every
  // switch is a hard cut:
  // - `drawerSlideIn`: the list slides in only on a fresh open. Back from a
  //   page remounts it, and replaying the slide there flashed the screen dark
  //   with an empty half; once a page has been opened from the menu, the list
  //   reappears in place (its dim fading in) until the menu closes.
  // - `pageFromMenu`: the page was opened straight from the list, so it fades
  //   the list's dim out instead of cutting from dark to light.
  // Derived during render from the previous values (no effect, no ref).
  const [drawerSlideIn, setDrawerSlideIn] = useState(() => !initialView?.section && !initialView?.stats);
  const [pageFromMenu, setPageFromMenu] = useState(false);
  const [prevDrawer, setPrevDrawer] = useState({ settingsOpen, drawerSection, showStats });
  if (prevDrawer.settingsOpen !== settingsOpen || prevDrawer.drawerSection !== drawerSection
    || prevDrawer.showStats !== showStats) {
    setPrevDrawer({ settingsOpen, drawerSection, showStats });
    const onPage = drawerSection !== null || showStats;
    if (!settingsOpen) setDrawerSlideIn(true);
    else if (onPage) setDrawerSlideIn(false);
    setPageFromMenu(settingsOpen && onPage && prevDrawer.settingsOpen
      && prevDrawer.drawerSection === null && !prevDrawer.showStats);
  }
  // The Tuner is a single-screen full-page takeover (no sub-screens of its
  // own), so it needs no backRef — Back just closes it. Not persisted to
  // gfp_view.
  const [tunerOpen, setTunerOpen] = useState(false);
  // The `upgrade` (Pro) sub-page is reachable both from the Account tab's plan
  // tile and from any locked <ProGate> in the app (via registerUpgradeHandler,
  // which may open it without Account ever being shown). Back should return to
  // Account only in the former case, so track which way we got there.
  const upgradeFromAccountRef = useRef(initialView?.upgradeFromAccount ?? false);
  // Friendly in-app microphone card shown *before* the browser's own bare
  // permission prompt: 'primer' explains why we need the mic, 'denied' is the
  // recovery card for when the browser has already refused (it won't re-ask).
  const [micPrompt, setMicPrompt] = useState<MicPrompt>(null);
  const [showInfo, setShowInfo] = useState(false);
  // True only while the first-time auto-popped hint is showing (a brand-new
  // player who has never seen it). It changes the dismiss rule to "any click
  // anywhere closes it"; existing users never enter this state and keep the
  // manual "?" open/close/position behavior untouched.
  const [infoAutoShown, setInfoAutoShown] = useState(false);

  // Route every microphone request through our own card instead of springing
  // the browser's permission bar unannounced. Already-granted → straight
  // through; a prior refusal → the recovery card; otherwise → the primer.
  const askForMic = () => {
    if (!voice.supported) return;
    if (voice.permission === 'granted') { void voice.ensurePermission(); return; }
    setMicPrompt(voice.permission === 'denied' ? 'denied' : 'primer');
  };
  const grantMic = async () => {
    const ok = await voice.ensurePermission();
    setMicPrompt(ok ? null : 'denied');
  };

  // "?" affordance pinned to the active mode card: opens the setup-summary
  // bubble and keeps it open until the user taps the "?" again or clicks
  // anywhere else on the page (no auto-dismiss timer).
  // Any interaction with the "?" itself drops the first-time auto-shown state,
  // so from then on the bubble behaves the normal (manual) way for this user.
  const openInfo = () => { setInfoAutoShown(false); setShowInfo(v => !v); };
  useEffect(() => {
    if (!showInfo) return;
    const onPointerDown = (e: PointerEvent) => {
      // First-time auto-popped hint: a click anywhere collapses it back.
      if (infoAutoShown) { setInfoAutoShown(false); setShowInfo(false); return; }
      if (!(e.target as Element | null)?.closest('.mode-card-info')) setShowInfo(false);
    };
    // Defer so the click that opened the bubble doesn't immediately close it.
    const id = window.setTimeout(
      () => document.addEventListener('pointerdown', onPointerDown), 0,
    );
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [showInfo, infoAutoShown]);

  // First-time hint: a brand-new player (no history at all, hint never seen)
  // gets the setup-summary bubble popped open automatically the first time they
  // reach the selector. It collapses on the first click anywhere and never
  // auto-opens again. Runs once on mount.
  const firstHintRef = useRef(false);
  useEffect(() => {
    if (firstHintRef.current) return;
    firstHintRef.current = true;
    if (loadSetting<boolean>('infoBubbleSeen', false)) return;
    saveSetting('infoBubbleSeen', true);
    if (hasAnyHistory) return;
    // One-time mount init — same as when this lived in App.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowInfo(true);
    setInfoAutoShown(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the open sub-page in a ref so the Escape handler (bound once per
  // open) reads the current value without re-subscribing on every navigation.
  const drawerSectionRef = useRef<string | null>(null);
  useEffect(() => { drawerSectionRef.current = drawerSection; }, [drawerSection]);

  // Persist the open screen so a reload restores it (see `initialView` above).
  // Clear the key when we're back on the home screen so the next fresh launch
  // starts clean even within the same tab session.
  useEffect(() => {
    try {
      if (!showStats && !settingsOpen && drawerSection === null && !showPath) {
        sessionStorage.removeItem('gfp_view');
      } else {
        sessionStorage.setItem('gfp_view', JSON.stringify({
          stats: showStats,
          settingsOpen,
          section: drawerSection,
          upgradeFromAccount: upgradeFromAccountRef.current,
          path: showPath,
        }));
      }
    } catch {
      /* sessionStorage unavailable (private mode / disabled) — non-fatal */
    }
  }, [showStats, settingsOpen, drawerSection, showPath]);

  // A locked <ProGate> anywhere in the tree opens the `upgrade` drawer section
  // through this handler (see utils/upgradeDrawer.ts). Leave any full-screen
  // view (Stats, an open sub-page) first so the section actually renders.
  useEffect(() => {
    registerUpgradeHandler(() => {
      setShowStats(false);
      setSettingsOpen(true);
      upgradeFromAccountRef.current = false;
      setDrawerSection('upgrade');
    });
    return () => registerUpgradeHandler(null);
  }, []);

  // Escape steps back one level, then closes the drawer. The Badges page is
  // only reachable from inside Account (via the pinned-badge picker), so it
  // steps back there rather than to the hamburger list of titles.
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const cur = drawerSectionRef.current;
      if (cur !== null) {
        const backToAccount = cur === 'badges' || (cur === 'upgrade' && upgradeFromAccountRef.current);
        setDrawerSection(backToAccount ? 'account' : null);
      } else setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  // Dismiss the microphone card with Escape too.
  useEffect(() => {
    if (!micPrompt) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMicPrompt(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [micPrompt]);

  // Close the Learning Path screen with Escape, back to the home screen.
  useEffect(() => {
    if (!showPath) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPath(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPath]);

  // Close the Tuner with Escape, back to the home screen.
  useEffect(() => {
    if (!tunerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTunerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tunerOpen]);

  // Escape steps a learning-type tab (Daily practice / Intervals) back to the
  // Selector, matching the on-screen Back button and hardware Back.
  useEffect(() => {
    if (activeDomain === 'notes') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveDomain('notes'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeDomain]);

  // Guests can dismiss the sign-in nudge with Escape ("Maybe later").
  useEffect(() => {
    if (signInPromptSeen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismissSignInPrompt(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signInPromptSeen]);

  return {
    showStats, setShowStats,
    showPath, setShowPath,
    settingsOpen, setSettingsOpen,
    activeDomain, setActiveDomain,
    drawerSection, setDrawerSection, drawerSlideIn, pageFromMenu,
    tunerOpen, setTunerOpen,
    micPrompt, setMicPrompt,
    showInfo, setShowInfo,
    infoAutoShown, setInfoAutoShown,
    upgradeFromAccountRef,
    askForMic, grantMic, openInfo,
  };
}

export type AppNavigation = ReturnType<typeof useAppNavigation>;
