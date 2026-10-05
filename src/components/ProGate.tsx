import type { ReactNode } from 'react';
import { useEntitlement } from '../hooks/useEntitlement';
import { can, minTier, type Feature } from '../utils/features';
import { openUpgrade } from '../utils/upgradeDrawer';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import { UpgradeCard } from './UpgradeCard';

/**
 * The presentational lock (design .kiro/specs/free-pro-tiering §4.2). Renders
 * `children` untouched for a user who `can()` use the feature; otherwise a
 * locked state that routes to the `upgrade` drawer section. It enforces
 * nothing security-sensitive — the real gate is the entitlement row and the
 * per-feature logic in the host component; this is only the UI.
 *
 *  - `overlay`      dim + blur `children`, lock chip + "Pro" pill on top
 *                   (history panel, the mastery toggle).
 *  - `replace`      render only `<UpgradeCard>` instead of `children`
 *                   (a whole Pro-only section, e.g. voice calibration).
 *  - `inline-badge` render `children` in full, add a "Pro" pill, and swallow
 *                   the primary interaction so a tap opens the upsell instead
 *                   (the multi-string toggle).
 */

interface ProGateProps {
  feature: Feature;
  children: ReactNode;
  variant?: 'overlay' | 'replace' | 'inline-badge';
  /** Short reason shown in the locked state, e.g. "See your full history". */
  pitch?: string;
  /** `replace` only: the menu-search anchor of the card it stands in for, so
   *  a search result still lands on the locked spot (src/utils/appSearch.ts). */
  anchor?: string;
}

export function ProGate({ feature, children, variant = 'overlay', pitch, anchor }: ProGateProps) {
  const { tier } = useEntitlement();
  const { t } = useTranslation();

  if (can(feature, tier)) return <>{children}</>;

  // Label the lock with the tier the feature actually needs, so a
  // Premium-gated control reads "Premium" and a Pro-gated one still reads "Pro".
  const tierLabel = minTier(feature) === 'premium' ? t('Premium') : t('Pro');
  const defaultPitch = minTier(feature) === 'premium'
    ? t('Unlock with Premium')
    : t('Unlock with Pro');

  const go = () => { playClickSound(); haptic.tap(); openUpgrade(); };

  if (variant === 'replace') {
    return anchor
      ? <div data-search-anchor={anchor}><UpgradeCard pitch={pitch} /></div>
      : <UpgradeCard pitch={pitch} />;
  }

  if (variant === 'inline-badge') {
    return (
      <span className="progate-inline">
        {children}
        <span className="progate-badge">{tierLabel}</span>
        <button
          type="button"
          className="progate-inline-catch"
          onClick={go}
          aria-label={pitch ?? defaultPitch}
        />
      </span>
    );
  }

  return (
    <div className="progate-overlay">
      <div className="progate-dim" aria-hidden="true">{children}</div>
      <button type="button" className="progate-lock" onClick={go}>
        <span className="progate-lock-icon" aria-hidden="true">🔒</span>
        <span className="progate-badge">{tierLabel}</span>
        <span className="progate-lock-text">{pitch ?? defaultPitch}</span>
      </button>
    </div>
  );
}
