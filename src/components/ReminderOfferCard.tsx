import { withClick as click } from '../utils/withClick';

/**
 * The one-time "want a daily reminder?" offer, shown right after the
 * player's 2nd finished round (product review 2026-10-05 §3ב item 10 / §4
 * item 8) instead of leaving the reminder buried in Settings → General.
 * Reuses the mic/sign-in card styling. <App> owns the visibility condition
 * (`useDailyReminder().shouldOfferReminder`) and the one-time "seen" flag;
 * this component only renders and calls back.
 */
export default function ReminderOfferCard({
  t, onEnable, onDismiss,
}: {
  t: (s: string) => string;
  onEnable: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mic-overlay" onClick={click(onDismiss)}>
      <div
        className="mic-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('Daily reminder')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mic-card-icon" aria-hidden="true">🔔</div>
        <div className="mic-card-title">{t('Want a daily reminder?')}</div>
        <p className="mic-card-body">
          {t("A quick nudge at a time you pick, so your streak doesn't slip. You can change or turn it off anytime in Settings.")}
        </p>
        <div className="mic-card-actions">
          <button
            className="mic-btn mic-btn-primary"
            onClick={click(onEnable)}
          >
            {t('Remind me')}
          </button>
          <button className="mic-btn mic-btn-ghost" onClick={click(onDismiss)}>
            {t('Not now')}
          </button>
        </div>
      </div>
    </div>
  );
}
