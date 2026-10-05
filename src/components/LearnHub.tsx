// ── LearnHub — the "Learn" drawer page: one tile per learning domain ────
//
// A single hamburger-drawer sub-page (settingsSections id 'learn') that lays
// out every learning domain as a tile, so the drawer keeps one row instead of
// a long list. 'notes' is the Selector (always open); 'daily', 'intervals'
// 'scales', 'staff' and 'tabs' are Premium — a tile the user's tier can't reach shows
// a lock and opens the upgrade page. Chords is still an inert "coming soon"
// tile (premium-product-plan.md §9 P5–P7); the scales half of P5 has its own
// live entry now (scales-learning-spec.md), and so does Staff reading
// (staff-reading-spec.md) and Tab reading (tab-reading-spec.md). (The Game layer is disconnected
// for now — see product-wishlist.md.) The Tuner tile is a live entry point for
// everyone, on every tier — it's a generic utility (mic-based pitch
// detection), not part of the adaptive Premium teaching system the other
// domains belong to.
//
// All copy through `t()`; the grid inherits `dir` from the settings page root.

import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import type { Feature } from '../utils/features';

export type LearnDomain = 'notes' | 'daily' | 'intervals' | 'scales' | 'staff' | 'tabs';

// Which Feature each locked tile is actually gated on, so a tap can open the
// upgrade page on the right tier/pitch (openUpgrade(feature)). 'notes' is
// never locked.
const TILE_FEATURE: Partial<Record<LearnDomain, Feature>> = {
  daily: 'premiumTeacher',
  intervals: 'intervalDrill',
  scales: 'scaleDrill',
  staff: 'staffReading',
  tabs: 'tabReading',
};

interface Props {
  activeDomain: LearnDomain;
  canDaily: boolean;
  canIntervals: boolean;
  canScales: boolean;
  canStaff: boolean;
  canTabs: boolean;
  /** Dev/admin only: render the inert "coming soon" roadmap tiles at all. */
  showRoadmap: boolean;
  /** Open the given domain (closes the drawer). */
  onPick: (d: LearnDomain) => void;
  /** A locked tile was tapped — open the upgrade page on the right tier. */
  onLocked: (feature: Feature) => void;
  /** The Tuner tile was tapped — open the tuner screen (closes the drawer). */
  onOpenTuner: () => void;
  /** The Fret of the Day tile was tapped — open that screen (closes the drawer). */
  onOpenDailyChallenge: () => void;
}

interface OpenTile {
  kind: 'open';
  id: LearnDomain;
  emoji: string;
  label: string;
  locked: boolean;
}
interface SoonTile {
  kind: 'soon';
  emoji: string;
  label: string;
}
interface ActionTile {
  kind: 'action';
  emoji: string;
  label: string;
  onSelect: () => void;
}

export default function LearnHub({
  activeDomain,
  canDaily,
  canIntervals,
  canScales,
  canStaff,
  canTabs,
  showRoadmap,
  onPick,
  onLocked,
  onOpenTuner,
  onOpenDailyChallenge,
}: Props) {
  const { t } = useTranslation();

  const tiles: Array<OpenTile | SoonTile | ActionTile> = [
    { kind: 'open', id: 'daily', emoji: '📅', label: 'Daily practice', locked: !canDaily },
    { kind: 'open', id: 'notes', emoji: '🎵', label: 'Notes', locked: false },
    { kind: 'open', id: 'intervals', emoji: '🎸', label: 'Intervals', locked: !canIntervals },
    { kind: 'open', id: 'scales', emoji: '🎼', label: 'Scales', locked: !canScales },
    { kind: 'open', id: 'staff', emoji: '📖', label: 'Staff reading', locked: !canStaff },
    { kind: 'open', id: 'tabs', emoji: '📝', label: 'Tab reading', locked: !canTabs },
    // Free for every tier — a tuner is a generic utility, not part of the
    // adaptive Premium teaching system the other domains belong to.
    { kind: 'action', emoji: '🎛️', label: 'Tuner', onSelect: onOpenTuner },
    // Also free for every tier, and not a teaching domain either — a daily
    // puzzle anyone can share, like the Tuner.
    { kind: 'action', emoji: '🔥', label: 'Fret of the Day', onSelect: onOpenDailyChallenge },
    // The inert roadmap placeholders are a dev/admin-only preview — a regular
    // user only sees domains they can actually open.
    ...(showRoadmap
      ? ([
          { kind: 'soon', emoji: '🎹', label: 'Chords' },
        ] as SoonTile[])
      : []),
  ];

  return (
    <>
      <p className="set-card-help">{t('Choose what to practise.')}</p>
      <div className="learn-hub">
        {tiles.map((tile) => {
          if (tile.kind === 'soon') {
            return (
              <div
                key={tile.label}
                className="learn-tile learn-tile--soon"
                aria-disabled="true"
              >
                <span className="learn-tile__emoji" aria-hidden="true">{tile.emoji}</span>
                <span className="learn-tile__label">{t(tile.label)}</span>
                <span className="learn-tile__state">{t('Coming soon')}</span>
              </div>
            );
          }

          if (tile.kind === 'action') {
            return (
              <button
                key={tile.label}
                type="button"
                className="learn-tile"
                onClick={() => {
                  playClickSound();
                  haptic.tap();
                  tile.onSelect();
                }}
              >
                <span className="learn-tile__emoji" aria-hidden="true">{tile.emoji}</span>
                <span className="learn-tile__label">{t(tile.label)}</span>
                <span className="learn-tile__state" />
              </button>
            );
          }

          const current = tile.id === activeDomain && !tile.locked;
          const cls = [
            'learn-tile',
            current ? 'learn-tile--current' : '',
            tile.locked ? 'learn-tile--locked' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={tile.id}
              type="button"
              className={cls}
              aria-current={current ? 'page' : undefined}
              onClick={() => {
                playClickSound();
                haptic.tap();
                if (tile.locked) {
                  const feature = TILE_FEATURE[tile.id];
                  if (feature) onLocked(feature);
                } else onPick(tile.id);
              }}
            >
              <span className="learn-tile__emoji" aria-hidden="true">{tile.emoji}</span>
              <span className="learn-tile__label">{t(tile.label)}</span>
              <span className="learn-tile__state">
                {tile.locked
                  ? <>🔒 {t('Premium')}</>
                  : current
                    ? t('Current')
                    : ''}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
