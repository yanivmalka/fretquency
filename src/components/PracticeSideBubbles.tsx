// ── PracticeSideBubbles — floating shortcut circles on a practice screen ──
//
// The mobile-game "side bubbles that point at an offer" idiom, repurposed:
// a small vertical stack of circles fixed on the screen's left edge (the
// physical side opposite QuickAccess's right-edge FAB — see
// src/styles/26-quick-access.css's header comment for why fixed controls use
// a physical side rather than a logical one), available on every Premium
// practice screen. Tapping a circle opens a bottom sheet with that bubble's
// content — the caller decides what each bubble is and shows (most often one
// of the existing TodayCard / IntervalTodayCard / StaffTodayCard /
// TabTodayCard components, now living here instead of on the old Daily
// practice page).
//
// Purely presentational: no feature/tier gating, no data fetching. The
// caller (App.tsx) decides which bubbles exist for the current screen.

import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';

export interface SideBubble {
  id: string;
  icon: string;
  label: string;
  /** A small counter shown on the circle (e.g. pending homework count).
   *  Omitted or 0 shows no badge. */
  badge?: number;
  /** Draws attention with a soft pulse (e.g. the Premium first-week bubble). */
  pulse?: boolean;
  /** Rendered when the sheet is open; `close` lets an action inside (e.g. a
   *  "start" button) dismiss the sheet itself before navigating away. */
  content: (close: () => void) => React.ReactNode;
}

interface Props {
  bubbles: SideBubble[];
}

export default function PracticeSideBubbles({ bubbles }: Props) {
  const { t, lang } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);

  if (bubbles.length === 0) return null;
  const open = bubbles.find((b) => b.id === openId) ?? null;

  return (
    <>
      <div className="psb-stack">
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`psb-bubble${b.pulse ? ' psb-pulse' : ''}`}
            aria-label={b.label}
            title={b.label}
            onClick={() => { playClickSound(); haptic.tap(); setOpenId(b.id); }}
          >
            <span className="psb-glyph" aria-hidden="true">{b.icon}</span>
            {!!b.badge && <span className="psb-badge">{b.badge > 9 ? '9+' : b.badge}</span>}
          </button>
        ))}
      </div>
      {open && (
        <div className="psb-overlay" onClick={() => setOpenId(null)}>
          <div
            className="psb-sheet"
            dir={lang === 'he' ? 'rtl' : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="psb-sheet-close"
              aria-label={t('Close')}
              onClick={() => { playClickSound(); haptic.tap(); setOpenId(null); }}
            >
              ✕
            </button>
            {open.content(() => setOpenId(null))}
          </div>
        </div>
      )}
    </>
  );
}
