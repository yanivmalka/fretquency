// A small, calm countdown pill shown on the home screen while the reverse
// Premium trial (utils/trial.ts) is active, so a new install actually knows
// it's on Premium (product review 2026-10-05 §3ב/4, item 2). Styled like
// DailyStreakBar — a quiet pill, not a banner — and shown only at rest, never
// during a drill. Tapping it jumps straight into today's Premium Teacher
// plan.

import { useTranslation } from '../i18n/useTranslation';
import { withClick as click } from '../utils/withClick';

interface Props {
  daysLeft: number;
  onOpenDaily: () => void;
}

export default function TrialBanner({ daysLeft, onOpenDaily }: Props) {
  const { t, lang } = useTranslation();
  const daysLabel = daysLeft > 0
    ? `${daysLeft} ${daysLeft === 1 ? t('day left') : t('days left')}`
    : t('ends today');

  return (
    <button
      type="button"
      className="trial-banner"
      dir={lang === 'he' ? 'rtl' : undefined}
      onClick={click(onOpenDaily)}
    >
      <span className="trial-banner-icon" aria-hidden="true">⭐</span>
      <span className="trial-banner-text">
        {t('Premium free')} — {daysLabel} · {t('Try today’s plan')}
      </span>
    </button>
  );
}
