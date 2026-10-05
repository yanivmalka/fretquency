import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { BadgeMedal, BadgeMedalDefs } from './BadgeMedal';
import { Chevron } from './Chevron';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import {
  loadPinned, savePinned, earnedBadgeInstances, pinnedBadgeName, MAX_PINNED,
  type EarnedBadgeInstance,
} from '../utils/pinnedBadges';

/**
 * The badge shelf shown in the Account section: up to five medals the player
 * pins beside their name, and a floating picker to choose them from. Replaces
 * the old "🏅 Badges" nav-row — the picker's footer is now the way into the
 * full Badges page.
 *
 * The pinned list lives in localStorage (`pref_pinnedBadges`, cloud-synced via
 * settingsSync). It is filtered against the currently-earned set on every
 * render, so a badge an admin Resets on another device simply drops out of the
 * strip instead of rendering a medal for something no longer held.
 */
export function PinnedBadges({
  isAdmin,
  isTeacher = false,
  isStudent = false,
  onOpenBadges,
}: {
  isAdmin: boolean;
  /** Passed the teacher test — reveals the Teacher role medal. */
  isTeacher?: boolean;
  /** Joined at least one class — reveals the Student role medal. */
  isStudent?: boolean;
  /** Open the full "🏅 Badges" settings page. */
  onOpenBadges: () => void;
}) {
  const { t } = useTranslation();

  // Cloud sync (badgeSync.ts) can rewrite the earned set from under us; re-read
  // when it fires, exactly as BadgeGrid does.
  const [syncTick, refresh] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener('badges-synced', refresh);
    return () => window.removeEventListener('badges-synced', refresh);
  }, []);

  // `syncTick` re-reads the badge store after a cloud sync rewrites it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const earned = useMemo(() => earnedBadgeInstances({ isAdmin, isTeacher, isStudent }), [isAdmin, isTeacher, isStudent, syncTick]);
  const earnedByKey = useMemo(
    () => new Map(earned.map(e => [e.key, e] as const)),
    [earned],
  );

  const [pinned, setPinned] = useState<string[]>(() => loadPinned());
  // Pins whose badge is no longer held (admin Reset, cleared history) are
  // filtered out for every read below — the strip, the picker counter, and the
  // "full" limit all work off `livePinned`, never the raw `pinned`, so a dead
  // key can't keep eating one of the five slots and blocking a replacement.
  // Stored `pref_pinnedBadges` is tidied to the live set the next time `toggle`
  // edits it.
  const livePinned = useMemo(
    () => pinned.filter(k => earnedByKey.has(k)),
    [pinned, earnedByKey],
  );

  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    playClickSound();
    haptic.tap();
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const toggle = useCallback((key: string) => {
    playClickSound();
    haptic.tap();
    setPinned(prev => {
      // Drop any dead keys as we go, so the stored set self-heals on edit.
      const base = prev.filter(k => earnedByKey.has(k));
      let next: string[];
      if (base.includes(key)) {
        next = base.filter(k => k !== key);
      } else if (base.length >= MAX_PINNED) {
        return prev; // full — blocked, the picker shows the hint
      } else {
        next = [...base, key];
      }
      savePinned(next);
      return next;
    });
  }, [earnedByKey]);

  // Nothing earned yet — no shelf at all.
  if (earned.length === 0) return null;

  return (
    <>
      <BadgeMedalDefs />
      {livePinned.length > 0 ? (
        <button
          type="button"
          className="pinned-badges-strip"
          onClick={openPicker}
          aria-label={t('Edit featured badges')}
        >
          <span className="pinned-badges-medals">
            {livePinned.map(k => {
              const e = earnedByKey.get(k)!;
              return (
                <span className="pinned-badges-slot" key={k}>
                  <BadgeMedal
                    id={e.def.id}
                    instrumentId={e.instrumentId}
                    tier={e.tier}
                    size={38}
                  />
                </span>
              );
            })}
          </span>
          <Chevron dir="forward" className="pinned-badges-chev" />
        </button>
      ) : (
        <button
          type="button"
          className="pinned-badges-empty"
          onClick={openPicker}
        >
          <span className="pinned-badges-empty-icon" aria-hidden="true">🏅</span>
          <span className="pinned-badges-empty-label">{t('Choose badges to feature')}</span>
          <Chevron dir="forward" className="pinned-badges-chev" />
        </button>
      )}

      {pickerOpen && (
        <PinnedBadgePicker
          earned={earned}
          pinned={livePinned}
          onToggle={toggle}
          onClose={closePicker}
          onOpenBadges={() => { closePicker(); onOpenBadges(); }}
        />
      )}
    </>
  );
}

function PinnedBadgePicker({
  earned, pinned, onToggle, onClose, onOpenBadges,
}: {
  earned: EarnedBadgeInstance[];
  pinned: string[];
  onToggle: (key: string) => void;
  onClose: () => void;
  onOpenBadges: () => void;
}) {
  const { t, lang } = useTranslation();
  const full = pinned.length >= MAX_PINNED;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pinned-picker-overlay" onClick={onClose}>
      <div
        className="pinned-picker"
        role="dialog"
        aria-modal="true"
        aria-label={t('Your badges')}
        dir={lang === 'he' ? 'rtl' : undefined}
        onClick={e => e.stopPropagation()}
      >
        <BadgeMedalDefs />
        <div className="pinned-picker-head">
          <span className="pinned-picker-title">{t('Feature up to 5 badges')}</span>
          <span className="pinned-picker-counter">{pinned.length} / {MAX_PINNED}</span>
        </div>

        <div className="pinned-picker-grid">
          {earned.map(e => {
            const isPinned = pinned.includes(e.key);
            const blocked = full && !isPinned;
            return (
              <button
                key={e.key}
                type="button"
                className={`pinned-picker-medal${isPinned ? ' is-pinned' : ''}${blocked ? ' is-blocked' : ''}`}
                aria-pressed={isPinned}
                title={pinnedBadgeName(e.def, e.instrumentId, t)}
                onClick={() => onToggle(e.key)}
              >
                <BadgeMedal
                  id={e.def.id}
                  instrumentId={e.instrumentId}
                  tier={e.tier}
                  size={52}
                />
                {isPinned && <span className="pinned-picker-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>

        {full && (
          <p className="pinned-picker-hint">{t('Remove a badge to feature another.')}</p>
        )}

        <button
          type="button"
          className="nav-row pinned-picker-foot"
          onClick={onOpenBadges}
        >
          <span className="nav-row__lead" aria-hidden="true">🏅</span>
          <span className="nav-row__label">{t('See all badges')}</span>
          <Chevron dir="forward" className="nav-row__chev" />
        </button>
      </div>
    </div>
  );
}
