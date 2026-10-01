import {
  useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react';
import {
  playClickSound, haptic, type FeedbackMode,
  soundLevelFromPrefs, soundLevelToPrefs,
} from '../utils/feedback';
import { saveSetting } from '../utils/settings';
import type { AccidentalMode, NotationMode } from '../utils/music';
import QuickAccessGlyph from './QuickAccessGlyph';
import {
  type QuickAccessId,
  quickAccessItem,
  subscribeQuickAccess,
  getQuickAccessEnabled,
  getPinnedQuick,
  hasSeenQaHint,
  markQaHintSeen,
} from '../utils/quickAccess';

type AnswerMode = 'tap' | 'voice' | 'guitar';
type Phase = 'sunk' | 'revealed' | 'open';

/** Step `cur` to the next entry in `states`, wrapping around; falls back to
 *  the first state if `cur` isn't currently offered (e.g. an admin flag was
 *  simulated off after guitar mode was picked). */
function nextInCycle<T>(states: readonly T[], cur: T): T {
  const i = states.indexOf(cur);
  return states[(i + 1) % states.length] ?? states[0];
}

// Reveal / sink timing and gesture tolerances. The summon gesture is a
// double-tap on empty space in the app's bottom-right quadrant (taps on a
// button or other control don't count); the two taps only have to be
// reasonably close in time and place, so two calm taps work — not just a
// fast, precise "double click".
//
// SINK_MS is measured from the *last* touch on any part of the control, not
// from when it was revealed: every pointer-down on the circle or the strip
// (and every setting change) restarts the countdown, so it only sinks after a
// genuine lull. Dragging the circle aside sinks it immediately.
const SINK_MS = 5000;
const HINT_MS = 6000;
// How long the "Quick Access is off" / "no shortcuts pinned yet" notice stays
// up when the summon gesture is made but there is nothing to reveal. Also
// dismissed early by any tap on the screen.
const NOTICE_MS = 3500;
const DOUBLE_TAP_MS = 700;
const DOUBLE_TAP_MOVE_PX = 80;
const DRAG_ASIDE_PX = 24;

export interface QuickAccessProps {
  t: (s: string) => string;
  voiceSupported: boolean;
  /** The device can listen for a played note (answer by guitar). */
  guitarSupported: boolean;
  askForMic: () => void;
  notation: NotationMode;
  setNotation: (n: NotationMode) => void;
  accidental: AccidentalMode;
  setAccidental: (a: AccidentalMode) => void;
  showScore: boolean;
  setShowScore: (v: boolean) => void;
  feedbackMode: FeedbackMode;
  setFeedbackMode: (v: FeedbackMode) => void;
  noteVolume: number;
  setNoteVolume: (v: number) => void;
  answerMode: AnswerMode;
  setAnswerMode: (m: AnswerMode) => void;
  showMastery: boolean;
  setShowMastery: (v: boolean) => void;
}

/**
 * The opt-in floating Quick Access control on the home screen: a double-tap
 * on empty space in the app's bottom-right quadrant (not on a button or other
 * control) reveals a glowing circle on the right edge; tapping the circle
 * opens a downward strip of the player's pinned
 * settings, each a glowing icon that cycles that setting in place. It sinks
 * away on its own after {@link SINK_MS}, on another double-tap in the quadrant,
 * or when dragged aside.
 *
 * Renders nothing unless Quick Access is enabled and at least one setting is
 * pinned. Mounted on the home screen only and only outside a running drill
 * (gated at the call site in <App>).
 */
export default function QuickAccess(props: QuickAccessProps) {
  const { t, voiceSupported, guitarSupported, askForMic } = props;
  const enabled = useSyncExternalStore(subscribeQuickAccess, getQuickAccessEnabled);
  const pinnedRaw = useSyncExternalStore(subscribeQuickAccess, getPinnedQuick);
  const hintSeen = useSyncExternalStore(subscribeQuickAccess, hasSeenQaHint);

  // Drop the "how you answer" item when neither of its states (voice, or
  // guitar) is available on this device.
  const pinned = useMemo(
    () => pinnedRaw.filter(
      (id): id is QuickAccessId => id !== 'answerMode' || voiceSupported || guitarSupported,
    ),
    [pinnedRaw, voiceSupported, guitarSupported],
  );

  // The states "How you answer" cycles through here — tap is always
  // available; voice and guitar only where the device supports them.
  const answerModeStates: AnswerMode[] = useMemo(() => [
    'tap',
    ...(voiceSupported ? ['voice' as const] : []),
    ...(guitarSupported ? ['guitar' as const] : []),
  ], [voiceSupported, guitarSupported]);

  const [phase, setPhase] = useState<Phase>('sunk');
  // The setting that floats to the circle ("last changed wins") is only
  // recomputed once the widget has sunk away and is summoned afresh — never
  // while it is on screen. Reordering the strip under the player's finger
  // mid-use is disorienting, so a change made now is remembered in a ref and
  // only promoted to `committedChangedId` the next time `phase` returns to
  // 'sunk' (when nothing is visible to jump around).
  const [committedChangedId, setCommittedChangedId] = useState<QuickAccessId | null>(null);
  const pendingChangedId = useRef<QuickAccessId | null>(null);
  // Shown when the summon gesture lands but there is nothing to reveal:
  // 'off'   — Quick Access is disabled in Settings.
  // 'empty' — enabled, but the player has not pinned any shortcuts yet.
  const [notice, setNotice] = useState<'off' | 'empty' | null>(null);

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNotice = useCallback((kind: 'off' | 'empty') => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(kind);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);
  const clearNotice = useCallback(() => {
    if (noticeTimer.current) { clearTimeout(noticeTimer.current); noticeTimer.current = null; }
    setNotice(null);
  }, []);

  // Left-handed mode mirrors the summon quadrant (and this hint) to the
  // bottom-left. Read live from <html data-hand> — it only changes with the
  // preference, which re-renders this component through App.
  const leftHanded = document.documentElement.dataset.hand === 'left';

  const sinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const fabDown = useRef<{ x: number; y: number; dragged: boolean } | null>(null);

  const clearSink = useCallback(() => {
    if (sinkTimer.current) { clearTimeout(sinkTimer.current); sinkTimer.current = null; }
  }, []);
  const armSink = useCallback(() => {
    clearSink();
    sinkTimer.current = setTimeout(() => setPhase('sunk'), SINK_MS);
  }, [clearSink]);

  // Current raw value + narrow-and-apply for each pinnable setting. Both are
  // rebuilt every render straight from props, so they always read current.
  const values: Record<QuickAccessId, unknown> = {
    notation: props.notation,
    accidental: props.accidental,
    showScore: props.showScore,
    soundLevel: soundLevelFromPrefs(props.feedbackMode, props.noteVolume),
    answerMode: props.answerMode,
    showMastery: props.showMastery,
  };
  const applyValue: Record<QuickAccessId, (v: unknown) => void> = {
    notation: (v) => props.setNotation(v as NotationMode),
    accidental: (v) => props.setAccidental(v as AccidentalMode),
    showScore: (v) => props.setShowScore(v as boolean),
    // One stop of the unified ladder writes both underlying prefs.
    soundLevel: (v) => {
      const { feedbackMode, noteVolume } = soundLevelToPrefs(v as number);
      props.setFeedbackMode(feedbackMode);
      saveSetting('pref_feedbackMode', feedbackMode);
      if (noteVolume != null) {
        props.setNoteVolume(noteVolume);
        saveSetting('pref_noteVolume', noteVolume);
      }
    },
    answerMode: (v) => props.setAnswerMode(v as AnswerMode),
    showMastery: (v) => props.setShowMastery(v as boolean),
  };

  const cycle = (id: QuickAccessId) => {
    const item = quickAccessItem(id);
    const nextVal = id === 'answerMode'
      ? nextInCycle(answerModeStates, values.answerMode as AnswerMode)
      : item.next(values[id]);
    playClickSound();
    haptic.tap();
    applyValue[id](nextVal);
    if (item.prefKey) saveSetting(item.prefKey, nextVal);
    if (id === 'answerMode' && nextVal === 'voice') askForMic();
    pendingChangedId.current = id;
    armSink();
  };

  // Promote the pending "last changed" pick only once the widget is fully
  // sunk, so the strip never rearranges itself while the player is looking at
  // it. The next summon then opens with that setting on the circle.
  useEffect(() => {
    if (phase !== 'sunk' || pendingChangedId.current === null) return;
    setCommittedChangedId(pendingChangedId.current);
    pendingChangedId.current = null;
  }, [phase]);

  // Tear down the outstanding timers on unmount.
  useEffect(() => () => {
    if (sinkTimer.current) clearTimeout(sinkTimer.current);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  // While a notice is up, the next tap anywhere on the screen dismisses it.
  // Deferred one tick so the second tap of the summon gesture (which raised
  // the notice) doesn't immediately clear it.
  useEffect(() => {
    if (notice === null) return;
    const onDown = () => clearNotice();
    const id = window.setTimeout(
      () => document.addEventListener('pointerdown', onDown, { once: true }), 0,
    );
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [notice, clearNotice]);

  // First-run hint: shown once the player has pinned something but has never
  // revealed the widget. Auto-clears after HINT_MS so it never sticks.
  useEffect(() => {
    if (hintSeen || pinned.length === 0 || phase !== 'sunk') return;
    const id = setTimeout(() => markQaHintSeen(), HINT_MS);
    return () => clearTimeout(id);
  }, [hintSeen, pinned.length, phase]);

  // While the strip is open, a tap anywhere outside it collapses back to the
  // circle. Deferred one tick so the tap that opened it doesn't close it —
  // same shape as useAppNavigation's info-bubble dismiss.
  useEffect(() => {
    if (phase !== 'open') return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest('.qa-fab') || el?.closest('.qa-menu')) return;
      setPhase('revealed');
    };
    const id = window.setTimeout(
      () => document.addEventListener('pointerdown', onDown), 0,
    );
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [phase]);

  // Summon gesture: a double-tap on empty space in the app's bottom-right
  // quadrant reveals the control (and, while it is showing, sinks it again). A
  // document-level `pointerup` listener that never calls preventDefault /
  // stopPropagation, so single taps still reach whatever is underneath — the
  // quadrant is far too large to be allowed to swallow taps.
  //
  // Taps that land on an actual interactive element (a button, link, form
  // control, or the Quick Access widget itself) are ignored for the gesture:
  // the player is using that control, not summoning Quick Access, and a
  // double-tap there — e.g. quickly changing a setting twice — must not also
  // pop the widget open.
  useEffect(() => {
    const onUp = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest('button, a, input, select, textarea, label, [role="button"]')) {
        lastTap.current = null;
        return;
      }

      const app = document.querySelector('.app');
      const r = app?.getBoundingClientRect();
      const midX = r ? r.left + r.width / 2 : window.innerWidth / 2;
      const midY = r ? r.top + r.height / 2 : window.innerHeight / 2;
      const outsideX = leftHanded ? e.clientX > midX : e.clientX < midX;
      if (outsideX || e.clientY < midY) { lastTap.current = null; return; }

      const now = e.timeStamp;
      const prev = lastTap.current;
      lastTap.current = { time: now, x: e.clientX, y: e.clientY };
      if (
        !prev
        || now - prev.time > DOUBLE_TAP_MS
        || Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > DOUBLE_TAP_MOVE_PX
      ) return;

      lastTap.current = null;
      haptic.tap();

      // Nothing to reveal: acknowledge the gesture with a short-lived notice
      // instead (same look as the first-run hint), then stop.
      if (!enabled) { showNotice('off'); return; }
      if (pinned.length === 0) { showNotice('empty'); return; }

      clearNotice();
      setPhase((p) => {
        if (p === 'sunk') {
          armSink();
          if (!hintSeen) markQaHintSeen();
          return 'revealed';
        }
        clearSink();
        return 'sunk';
      });
    };
    document.addEventListener('pointerup', onUp);
    return () => document.removeEventListener('pointerup', onUp);
  }, [enabled, pinned.length, hintSeen, leftHanded, armSink, clearSink, showNotice, clearNotice]);

  if (!enabled || pinned.length === 0) {
    return notice === null ? null : (
      <div className="qa-root">
        <div className="qa-hint" role="status">
          {notice === 'off'
            ? t('Quick access is off')
            : t("You haven't pinned any quick access shortcuts yet")}
        </div>
      </div>
    );
  }

  const onFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    fabDown.current = { x: e.clientX, y: e.clientY, dragged: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    // Any touch on a part of the control keeps it alive: restart the sink
    // countdown so it only disappears after a real lull in use.
    armSink();
  };
  const onFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = fabDown.current;
    if (!d || d.dragged) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > DRAG_ASIDE_PX) {
      d.dragged = true;
      clearSink();
      setPhase('sunk');
    }
  };
  // The circle is itself the first setting — the last-changed one, else the
  // first pinned. Its first tap opens the strip; once open, further taps cycle
  // that setting in place, exactly like a strip button. It is never repeated as
  // a strip row: the strip holds only the *other* pinned settings.
  const fabId: QuickAccessId = committedChangedId && pinned.includes(committedChangedId)
    ? committedChangedId
    : pinned[0];
  const menuIds: QuickAccessId[] = pinned.filter((id) => id !== fabId);

  const onFabPointerUp = () => {
    const d = fabDown.current;
    fabDown.current = null;
    if (!d || d.dragged) return;
    playClickSound();
    haptic.tap();
    if (phase === 'revealed' && menuIds.length > 0) {
      setPhase('open');
      armSink();
    } else {
      cycle(fabId);
    }
  };

  return (
    <div className="qa-root">
      {!hintSeen && phase === 'sunk' && (
        <div className="qa-hint" role="status">
          {leftHanded
            ? t('Double-tap the lower-left of the screen for quick access')
            : t('Double-tap the lower-right of the screen for quick access')}
        </div>
      )}

      {phase !== 'sunk' && (
        <button
          type="button"
          className="qa-fab"
          aria-label={t(quickAccessItem(fabId).label)}
          aria-expanded={phase === 'open'}
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
        >
          <span className="qa-glyph"><QuickAccessGlyph id={fabId} value={values[fabId]} /></span>
        </button>
      )}

      {phase === 'open' && menuIds.length > 0 && (
        <div
          className="qa-menu"
          role="group"
          aria-label={t('Quick access')}
          onPointerDown={() => armSink()}
        >
          {menuIds.map((id) => (
            <button
              key={id}
              type="button"
              className="qa-menu-item"
              aria-label={t(quickAccessItem(id).label)}
              onClick={() => cycle(id)}
            >
              <span className="qa-glyph"><QuickAccessGlyph id={id} value={values[id]} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
