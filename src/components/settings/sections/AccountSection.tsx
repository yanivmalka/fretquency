import { SettingCard, SegmentedControl } from '../../SettingCard';
import { PinnedBadges } from '../../PinnedBadges';
import AboutCard from './AboutCard';
import AppUpdateCard from './AppUpdateCard';
import { withClick as click } from '../../../utils/withClick';
import { setOwnEntitlement } from '../../../utils/entitlement';
import { verror } from '../../../utils/debugLog';
import type { AuthState } from '../../../hooks/useAuth';
import { dateLocale, type Lang } from '../../../i18n/translations';

const PRIVACY_POLICY_URL = 'https://yanivmalka.github.io/guitar-fret-practice/privacy.html';

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
  setDrawerSection: (id: string | null) => void;
  upgradeFromAccountRef: { current: boolean };
}

export default function AccountSection({
  t, lang, auth, setDrawerSection, upgradeFromAccountRef,
}: AccountSectionProps) {
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
            onClick={click(() => { upgradeFromAccountRef.current = true; setDrawerSection('upgrade'); })}
          >
            <span className="account-plan-icon" aria-hidden="true">⭐</span>
            <span className="account-plan-tier">
              {auth.isPremium ? t('Premium') : auth.isPro ? t('Pro') : t('Free')}
            </span>
          </button>
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
            onClick={click(() => { upgradeFromAccountRef.current = true; setDrawerSection('upgrade'); })}
          >
            <span className="account-plan-icon" aria-hidden="true">⭐</span>
            <span className="account-plan-tier">{t('Free')}</span>
          </button>
          <button
            className="set-card-btn set-card-btn-primary"
            onClick={click(() => { void auth.signInWithGoogle(); })}
          >
            <svg className="google-icon" viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            {t('Sign in with Google')}
          </button>
        </SettingCard>
      )}
      {/* The badge shelf: up to five medals the player pins beside their
          name, plus the floating picker that leads into the full Badges
          page (which used to be its own nav-row here). */}
      <PinnedBadges
        isAdmin={auth.admin}
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
          help={t('Hides every admin-only control so you see exactly what a regular user sees. Switch back here any time — this is a local view change only and does not change what your account can do.')}
        >
          <SegmentedControl<'admin' | 'user'>
            ariaLabel={t('Admin: view the app as')}
            value={auth.viewingAsUser ? 'user' : 'admin'}
            options={[
              { value: 'admin', label: t('Admin') },
              { value: 'user', label: t('Regular user') },
            ]}
            onChange={(next) => auth.setViewingAsUser(next === 'user')}
          />
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
      {/* Public privacy policy (static page in public/). Absolute URL on
          purpose: the Android build serves the app from a relative base, so a
          relative link would navigate the WebView away from the app. */}
      <a
        className="account-privacy-link"
        href={PRIVACY_POLICY_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('Privacy policy')}
      </a>
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
