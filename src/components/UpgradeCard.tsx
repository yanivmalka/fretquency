import { useTranslation } from '../i18n/useTranslation';
import { dateLocale } from '../i18n/translations';
import { useEntitlement } from '../hooks/useEntitlement';
import { minTier, type Feature } from '../utils/features';
import { trialDaysLeft, trialJustEnded } from '../utils/trial';

/**
 * The reusable Free/Pro/Premium upsell (design .kiro/specs/free-pro-tiering
 * §4.3, extended for the Premium tier). Rendered by the `upgrade` drawer
 * section and by `<ProGate variant="replace">`. Lays out all three plans —
 * what Free already gives you, then what Pro adds, then what Premium adds on
 * top of that — and marks whichever one the account is actually on.
 *
 * `feature`, when given, is the capability that was actually tapped (a locked
 * Learn tile, a capped Selector control, a `<ProGate>`): the matching plan
 * card is visually highlighted and a one-line pitch for that exact feature is
 * shown up top, so a Premium-gated tile stops selling Pro. An explicit
 * `pitch` (from a `<ProGate>` call site) overrides that generated line.
 *
 * The CTA on Pro/Premium is a placeholder for this pass — there is no payment
 * button until the payment rail lands. A Premium card during the reverse
 * trial (see utils/trial.ts) shows the trial countdown instead of the CTA.
 */

// The free side, kept in step with the "NOT in this map on purpose" note in
// utils/features.ts — that comment is the source of truth for what stays free.
const FREE_PERKS = [
  'The full fretboard drill — by note and by fret, on every string',
  'Up to 2 strings at once in multi-string mode',
  'Badges and achievements, with your pinned medal shelf',
  'The leaderboard — XP, questions answered and accuracy',
  'Cloud sync and full restore of your practice on every device',
  'Your last 7 days of stats, plus the personal best for what you’re drilling',
  'Occasional ads between rounds',
] as const;

// Kept in step with design §2.2 / utils/features.ts MIN_TIER. Each string is
// translated at the call below.
const PRO_PERKS = [
  'No ads',
  'Your full practice history — all-time stats and trends, not just the last 7 days',
  'Mastery maps — per-note and per-fret accuracy overlays on the circle and grid',
  'Browse your personal bests across every settings combination',
  'Drill three or more strings at once.',
  'Pick an exact fret N–M window to drill',
  'Unlock more instruments',
  'A personal voice profile built from your own calibration recordings',
] as const;

// premium-product-plan.md §2 / §6. Premium includes everything in Pro.
const PREMIUM_PERKS = [
  'A daily session the Teacher builds from your actual weak spots',
  'Spaced review that brings what you missed back until it sticks',
  'A guided Learning Path across the whole fretboard',
  'Interval training, scale training, staff reading and tab reading',
] as const;

// Shown when `feature` is given and the call site didn't already supply its
// own `pitch` (most <ProGate> call sites do; a direct openUpgrade(feature)
// from a locked Learn tile or a capped Selector control doesn't).
const FEATURE_PITCH: Record<Feature, string> = {
  historyBeyond7Days: 'See your full practice history, not just the last 7 days.',
  masteryMaps: 'Point the mastery bars at a recent-question count, a single day, or a date range',
  allPersonalBests: 'Browse your personal bests across every settings combination',
  fretRange: 'Pick an exact fret N–M window to drill',
  multiStringFull: 'Drill three or more strings at once.',
  voiceProfile: 'A personal voice profile built from your own calibration recordings',
  extraInstruments: 'Unlock more instruments',
  noAds: 'Practice without ads.',
  seasonalBackdrop: 'Snowflakes, anemones, sunflowers or falling leaves behind the app, following the season',
  premiumTeacher: 'Let the Teacher plan your practice',
  learningPath: 'Follow a guided path from single notes onward',
  intervalDrill: 'Practise hearing and finding intervals',
  scaleDrill: 'Practise building scale shapes on the neck',
  staffReading: 'Practise reading notes on the staff and finding them on the neck',
  tabReading: 'Practise reading tabs and finding every number on the neck',
  classroomJoin: 'Joining a class needs Pro — ask a parent or guardian, or upgrade yourself.',
};

// Whole sentences (not glued fragments) so the Hebrew reads naturally.
const SOURCE_SENTENCE: Record<string, string> = {
  comp: 'Your access is complimentary.',
  promo: 'Your access came from a promotion.',
  manual: 'Your access was granted manually.',
  revenuecat: 'Your access is from your subscription.',
  stripe: 'Your access is from your subscription.',
  play: 'Your access is from your subscription.',
};

export function UpgradeCard({ feature, pitch }: { feature?: Feature; pitch?: string }) {
  const { t, lang } = useTranslation();
  const { tier, isPremium, entitlement } = useEntitlement();

  const targetTier = feature ? minTier(feature) : undefined;
  const headline = pitch ?? (feature ? t(FEATURE_PITCH[feature]) : undefined);
  const daysLeft = trialDaysLeft();
  const onTrial = isPremium && entitlement.source === 'trial';

  const sourceSentence = onTrial
    ? t('Your Premium trial is active.')
    : t(SOURCE_SENTENCE[entitlement.source] ?? 'Your access is active.');
  const expirySentence = (() => {
    if (onTrial || !entitlement.expiresAt) return t('It does not expire.');
    const d = new Date(entitlement.expiresAt);
    if (Number.isNaN(d.getTime())) return t('It does not expire.');
    const date = d.toLocaleDateString(dateLocale(lang), {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    return `${t('Access runs until')} ${date}.`;
  })();

  return (
    <div className="plan-stack">
      {headline && <p className="pro-card-pitch">{headline}</p>}
      {trialJustEnded() && !isPremium && (
        <p className="pro-card-pitch">
          {t('Your 7-day Premium trial has ended. Everything below Premium stays free.')}
        </p>
      )}

      {/* Free — what you already have without paying. */}
      <div className={`pro-card plan-free${tier === 'free' ? ' is-current' : ''}${targetTier === 'free' ? ' is-target' : ''}`}>
        <div className="pro-card-head">
          <span className="plan-pill">{t('Free')}</span>
          <span className="pro-card-tier">
            {tier === 'free' ? t('Your plan') : t('Included with Pro')}
          </span>
        </div>

        <p className="pro-card-lead">
          {t('Everything you need to practice daily, at no cost.')}
        </p>

        <ul className="pro-perks">
          {FREE_PERKS.map(perk => (
            <li key={perk}><span aria-hidden="true">✓</span>{t(perk)}</li>
          ))}
        </ul>

        <p className="pro-card-note plan-price">{t('Free, forever')}</p>
      </div>

      {/* Pro — what upgrading adds on top of everything above. */}
      <div className={`pro-card${tier === 'pro' ? ' is-current' : ''}${targetTier === 'pro' ? ' is-target' : ''}`}>
        <div className="pro-card-head">
          <span className="pro-pill">{t('Pro')}</span>
          <span className="pro-card-tier">
            {tier === 'pro' ? t('Your plan') : isPremium ? t('Included with Premium') : t('Everything in Free, plus:')}
          </span>
        </div>

        <p className="pro-card-lead">
          {t('Pro is for training seriously and tracking progress over time.')}
        </p>

        <ul className="pro-perks">
          {PRO_PERKS.map(perk => (
            <li key={perk}><span aria-hidden="true">✦</span>{t(perk)}</li>
          ))}
        </ul>

        {tier === 'pro' ? (
          <p className="pro-card-status">{sourceSentence} {expirySentence}</p>
        ) : isPremium ? null : (
          <>
            <button type="button" className="pro-cta" disabled>
              {t('Coming soon')}
            </button>
            <p className="pro-card-note">
              {t('Pro isn’t on sale yet — everything above stays free to try in the meantime.')}
            </p>
          </>
        )}
      </div>

      {/* Premium — the Teacher, on top of everything in Pro. */}
      <div className={`pro-card plan-premium${isPremium ? ' is-current' : ''}${targetTier === 'premium' ? ' is-target' : ''}`}>
        <div className="pro-card-head">
          <span className="premium-pill">{t('Premium')}</span>
          <span className="pro-card-tier">
            {isPremium ? (onTrial ? t('Your trial') : t('Your plan')) : t('Everything in Pro, plus:')}
          </span>
        </div>

        <p className="pro-card-lead">
          {t('Premium is a teacher, not a timer — it plans your practice for you.')}
        </p>

        <ul className="pro-perks">
          {PREMIUM_PERKS.map(perk => (
            <li key={perk}><span aria-hidden="true">★</span>{t(perk)}</li>
          ))}
        </ul>

        {isPremium ? (
          <p className="pro-card-status">
            {sourceSentence}{' '}
            {onTrial && daysLeft !== null
              ? daysLeft > 0
                ? `${t('Ends in')} ${daysLeft} ${daysLeft === 1 ? t('day') : t('days')}.`
                : t('Ends today.')
              : expirySentence}
          </p>
        ) : (
          <>
            <button type="button" className="pro-cta" disabled>
              {t('Coming soon')}
            </button>
            <p className="pro-card-note">
              {t('Premium isn’t on sale yet — every new install gets a 7-day free trial in the meantime.')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
