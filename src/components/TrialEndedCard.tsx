import { withClick as click } from '../utils/withClick';

/**
 * The one-time "your Premium trial ended" summary (utils/trial.ts
 * `trialJustEnded`), shown once right after the 7-day reverse trial runs out.
 * Reuses the sign-in nudge's card styling. `trackedCount` is read directly
 * from learningState.ts by the caller (not through useLearning, which goes
 * inert the instant the tier drops back to Free) so the number reflects what
 * the Teacher actually did during the trial, not zero.
 *
 * `reverted` lists, in plain language, what actually goes back to Free for
 * this player — e.g. the Pro-only instrument they were playing, or the
 * multi-string/precise-fret-window picks they had set — instead of letting
 * those revert silently (product review 2026-10-05 §3ב/4, item 4). Empty
 * when nothing they were using is affected.
 */
export default function TrialEndedCard({
  t, trackedCount, reverted, onSeeUpgrade, onDismiss,
}: {
  t: (s: string) => string;
  trackedCount: number;
  reverted: string[];
  onSeeUpgrade: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mic-overlay" onClick={click(onDismiss)}>
      <div
        className="mic-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('Your Premium trial has ended')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mic-card-icon" aria-hidden="true">⭐</div>
        <div className="mic-card-title">{t('Your Premium trial has ended')}</div>
        <p className="mic-card-body">
          {trackedCount > 0
            ? `${t('This week the Teacher kept track of')} ${trackedCount} ${t('positions on your fretboard.')}`
            : t('This week the Teacher started learning your fretboard.')}
          {' '}
          {t('You’re back on Free — everything you’ve already learned stays yours.')}
        </p>
        {reverted.length > 0 && (
          <p className="mic-card-body mic-card-body-secondary">
            {t('This goes back to Free too:')} {reverted.join(', ')}.
          </p>
        )}
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
