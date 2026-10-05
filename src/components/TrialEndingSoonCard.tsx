import { withClick as click } from '../utils/withClick';

/**
 * A one-time nudge shown while the reverse Premium trial (utils/trial.ts
 * `trialEndingSoon`) still has a couple of days left, so the end-of-trial
 * card isn't the first the player hears about it (product review
 * 2026-10-05 §3ב/4, item 3). Reuses the sign-in nudge / TrialEndedCard's
 * styling.
 */
export default function TrialEndingSoonCard({
  t, daysLeft, onSeeUpgrade, onDismiss,
}: {
  t: (s: string) => string;
  daysLeft: number;
  onSeeUpgrade: () => void;
  onDismiss: () => void;
}) {
  const daysLabel = daysLeft === 1 ? t('day left') : t('days left');
  return (
    <div className="mic-overlay" onClick={click(onDismiss)}>
      <div
        className="mic-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('Your Premium trial ends soon')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mic-card-icon" aria-hidden="true">⭐</div>
        <div className="mic-card-title">{t('Your Premium trial ends soon')}</div>
        <p className="mic-card-body">
          {`${daysLeft} ${daysLabel}. `}
          {t('After that, you’re back on Free.')}
        </p>
        <div className="mic-card-actions">
          <button className="mic-btn mic-btn-primary" onClick={click(onSeeUpgrade)}>
            {t('See what’s in Premium')}
          </button>
          <button className="mic-btn mic-btn-ghost" onClick={click(onDismiss)}>
            {t('Got it')}
          </button>
        </div>
      </div>
    </div>
  );
}
