import { SettingCard, SegmentedControl } from '../../SettingCard';
import { PinnedBadges } from '../../PinnedBadges';
import AboutCard from './AboutCard';
import AppUpdateCard from './AppUpdateCard';
import GoogleIcon from '../../GoogleIcon';
import { withClick as click } from '../../../utils/withClick';
import { setOwnEntitlement } from '../../../utils/entitlement';
import { verror } from '../../../utils/debugLog';
import type { AuthState } from '../../../hooks/useAuth';
import { dateLocale, type Lang } from '../../../i18n/translations';
import { privacyPolicyUrl, TERMS_URL } from '../../../utils/onboardingState';
import { trialDaysLeft } from '../../../utils/trial';
import { isBeginnerPreview, startBeginnerPreview, endBeginnerPreview } from '../../../utils/adminBeginnerPreview';

/**
 * The "Account" drawer section body: sign-in / sign-out, the plan tile, the
 * pinned-badge shelf, admin-only account tools and the build-info footer.
 * Presentation only — `auth` and the navigation setters are threaded in from
 * <App>; this component imports no hooks.
 */
export interface AccountSectionProps {
  t: (s: string) => string;
  lang: Lang;
  auth: AuthState;
  /** Passed the teacher test — reveals the Teacher role medal in the pinned shelf. */
  isTeacher: boolean;
  /** Joined at least one class — reveals the Student role medal in the pinned shelf. */
  isStudent: boolean;
  setDrawerSection: (id: string | null) => void;
  upgradeFromAccountRef: { current: boolean };
  /** Open the `upgrade` sub-page for no specific feature — just browsing the
   *  plan tiers (clears any feature a previous locked tile had set). */
  onOpenUpgrade?: () => void;
}

export default function AccountSection({
  t, lang, auth, isTeacher, isStudent, setDrawerSection, upgradeFromAccountRef, onOpenUpgrade,
}: AccountSectionProps) {
  // The reverse Premium trial's "somewhere calm" countdown (utils/trial.ts):
  // a plain line under the plan tile, not a banner or a badge — it shows
  // while the trial is the reason the account reads Premium, on every tier
  // page this component renders (signed in or a guest).
  const onTrial = auth.isPremium && auth.entitlement.source === 'trial';
  const trialDays = onTrial ? trialDaysLeft() : null;
  const trialNote = onTrial && trialDays !== null && (
    <p className="account-trial-note">
      {trialDays > 0
        ? `${t('Premium trial')} — ${trialDays} ${trialDays === 1 ? t('day left') : t('days left')}`
        : t('Premium trial — ends today')}
    </p>
  );
  return (
    <>
      {auth.user ? (
        <SettingCard
          anchor="account"
          label={t('Signed in')}
          help={t('Keeps your preferences and data in sync across devices.')}
        >
          <div className="account-user">
            {auth.profile?.avatarUrl && (
              <img
                className="account-avatar"
                src={auth.profile.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                width={40}
                height={40}
              />
            )}
            <span className="account-identity">
              {auth.profile?.name && (
                <span className="account-name">{auth.profile.name}</span>
              )}
              <span className="account-email">
                {auth.profile?.email ?? auth.user.email ?? t('Signed in')}
              </span>
              {auth.user.created_at && (
                <span className="account-member-since">
                  {t('Member since')} {new Date(auth.user.created_at).toLocaleDateString(dateLocale(lang), {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              )}
            </span>
          </div>
          {/* Subscription tier: a plain tappable tile showing the current plan,
              sitting just above Sign out. Opens the `upgrade` sub-page. */}
          <button
            type="button"
            className={`account-plan${auth.isPro ? ' is-pro' : ''}`}
            onClick={click(() => { upgradeFromAccountRef.current = true; (onOpenUpgrade ?? (() => setDrawerSection('upgrade')))(); })}
          >
            <span className="account-plan-icon" aria-hidden="true">⭐</span>
            <span className="account-plan-tier">
              {auth.isPremium ? t('Premium') : auth.isPro ? t('Pro') : t('Free')}
            </span>
          </button>
          {trialNote}
          <button
            className="set-card-danger"
            onClick={click(() => { void auth.signOut(); })}
          >
            {t('Sign out')}
          </button>
        </SettingCard>
      ) : (
        <SettingCard
          anchor="account"
          label={t('Account')}
          help={t('Sign in with Google to keep your preferences and data across devices.')}
        >
          {/* Signed-out: no plan on the account, so show the current (Free)
              plan large. Tapping opens the `upgrade` sub-page. */}
          <button
            type="button"
            className="account-plan account-plan-lg"
            onClick={click(() => { upgradeFromAccountRef.current = true; (onOpenUpgrade ?? (() => setDrawerSection('upgrade')))(); })}
          >
            <span className="account-plan-icon" aria-hidden="true">⭐</span>
            <span className="account-plan-tier">{t('Free')}</span>
          </button>
          {trialNote}
          <button
            className="set-card-btn set-card-btn-primary"
            onClick={click(() => { void auth.signInWithGoogle(); })}
          >
            <GoogleIcon />
            {t('Sign in with Google')}
          </button>
        </SettingCard>
      )}
      {/* The badge shelf: up to five medals the player pins beside their
          name, plus the floating picker that leads into the full Badges
          page (which used to be its own nav-row here). */}
      <PinnedBadges
        isAdmin={auth.admin}
        isTeacher={isTeacher}
        isStudent={isStudent}
        onOpenBadges={() => setDrawerSection('badges')}
      />
      {/* Admin-only account tools, grouped here rather than on the
          customer-facing Pro screen — kept below the badge shelf so the
          player-facing bits of Account come first. Gated on `adminAccount`
          (the real row in public.admins) so the "back to admin" switch
          stays reachable even while browsing as a regular user. */}
      {auth.adminAccount && (
        <SettingCard
          label={t('Admin: view the app as')}
          help={t('Hides every admin-only control so you see exactly what a regular user sees, or lets you live through the first run as a brand-new user. Switch back here any time — this is a local view change only and does not change what your account can do.')}
        >
          <SegmentedControl<'admin' | 'user' | 'beginner'>
            ariaLabel={t('Admin: view the app as')}
            value={isBeginnerPreview() ? 'beginner' : auth.viewingAsUser ? 'user' : 'admin'}
            options={[
              { value: 'admin', label: t('Admin') },
              { value: 'user', label: t('Regular user') },
              { value: 'beginner', label: t('New user') },
            ]}
            onChange={(next) => {
              if (isBeginnerPreview()) endBeginnerPreview(next === 'user');
              else if (next === 'beginner') startBeginnerPreview();
              else auth.setViewingAsUser(next === 'user');
            }}
          />
          {isBeginnerPreview() && (
            <p className="set-card-help">
              {t('Previewing a brand-new user: onboarding, the first-time demos and the Premium trial start from scratch, and nothing reaches your account. Switch back here to restore everything as it was.')}
            </p>
          )}
        </SettingCard>
      )}
      {auth.admin && auth.user && (
        <SettingCard
          label={t('Admin: plan on your account')}
          help={t('Sets the plan on your own account only (Free, Pro or Premium). Writes to the entitlements table and syncs across your devices.')}
        >
          <SegmentedControl<'free' | 'pro' | 'premium'>
            ariaLabel={t('Admin: plan on your account')}
            value={auth.tier}
            options={[
              { value: 'free', label: t('Free') },
              { value: 'pro', label: t('Pro') },
              { value: 'premium', label: t('Premium') },
            ]}
            onChange={(next) => {
              const userId = auth.user?.id;
              if (!userId || next === auth.tier) return;
              void (async () => {
                try {
                  await setOwnEntitlement(userId, next);
                  await auth.refreshEntitlement();
                } catch (e) {
                  verror('[admin] plan toggle failed', e);
                }
              })();
            }}
          />
        </SettingCard>
      )}
      {import.meta.env.DEV && (
        <p
          className="dev-tier-readout"
          style={{ opacity: 0.6, fontSize: '0.8em', margin: '8px 0 0' }}
        >
          {/* Dev-only readout; the tri-state "simulate tier" control that
              drives the "(sim:…)" state lives in the debug panel (🐞). */}
          tier: {auth.tier}
          {auth.devSimulateTier !== 'off' ? ` (sim:${auth.devSimulateTier})` : ''}
          {auth.entitlementLoading ? ' …' : ''}
        </p>
      )}
      {/* About the app + live community counts (registered accounts, users /
          guests active right now). Self-contained — does its own fetching. */}
      <AboutCard />
      {/* Android app only: a newer APK from the private release bucket. */}
      <AppUpdateCard userId={auth.user?.id ?? null} />
      {/* Public terms + privacy policy (static pages in public/). Absolute URLs
          on purpose: the Android build serves the app from a relative base, so
          a relative link would navigate the WebView away from the app. */}
      <div className="account-legal-links">
        <a className="account-privacy-link" href={TERMS_URL} target="_blank" rel="noopener noreferrer">
          {t('Terms of use')}
        </a>
        <a className="account-privacy-link" href={privacyPolicyUrl(lang)} target="_blank" rel="noopener noreferrer">
          {t('Privacy policy')}
        </a>
      </div>
      {/* App version — moved here from the bottom of the main screen so the
          footer stays clean; this is the one place it now lives. */}
      <div className="build-info account-build-info">
        {/* The APK shows its versionName (1.0.N, same as Android's app info);
            the web build, which has none, shows the commit. */}
        {import.meta.env.VITE_APP_VERSION ?? __COMMIT_HASH__} · {__COMMIT_DATE__.slice(0, 16)}
        <button
          className="refresh-btn"
          onClick={() => { void (window.__applyUpdate?.() ?? window.location.reload()); }}
          title={t('Refresh')}
        >↻</button>
      </div>
    </>
  );
}
