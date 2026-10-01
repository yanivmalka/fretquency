import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { can } from '../utils/features';
import { dismissAd, isAdPending, isRoundActive, subscribeAdPending } from '../utils/adPacing';
import { haptic, playClickSound } from '../utils/feedback';
import { adSurface, NATIVE_REFRESH_MAX_MS, NATIVE_REFRESH_MIN_MS } from '../ads/config';
import { hideNativeBanner, refreshNativeBanner, showNativeBanner } from '../ads/nativeBanner';
import AdSenseSlot from '../ads/AdSenseSlot';
import { isBootDone, subscribeBootDone } from '../utils/bootState';

const SURFACE = adSurface();
const ROOT = document.documentElement;

/** The Free-tier ad strip.
 *
 *  When it shows is decided by `utils/adPacing` — never during a drill; for a
 *  guest on every browsing screen, with no close button; for a signed-in Free
 *  user from app launch and then after every random 1–3 rounds. Who sees it is
 *  decided here through the capability map (`noAds` is a Pro feature). Mounted once, outside
 *  <App>, so it overlays every browsing screen without each one knowing.
 *
 *  What fills it depends on the platform (`ads/config.ts`):
 *   • native (Capacitor Android / iOS) — an AdMob banner, a native view over
 *     the WebView; this component renders no DOM, it only drives the banner;
 *   • web with AdSense ids — an AdSense unit inside a bottom strip;
 *   • otherwise — a house placeholder line in the same strip. */
export default function AdBanner() {
  const { t } = useTranslation();
  const auth = useAuth();
  const pending = useSyncExternalStore(subscribeAdPending, isAdPending);
  const roundActive = useSyncExternalStore(subscribeAdPending, isRoundActive);
  const isGuest = !auth.user;
  // While the entitlement is still resolving a paying user reads as Free, so
  // hold the strip back until we actually know.
  const visible = !roundActive && (isGuest || pending) && !auth.loading && !can('noAds', auth.tier);
  // The native banner waits for the boot splash to go: setting up the AdMob
  // SDK and its consent flow behind the splash made its bar and intro scale
  // stutter in the APK.
  const bootDone = useSyncExternalStore(subscribeBootDone, isBootDone);
  const nativeVisible = visible && bootDone;

  // Reserve room at the bottom so the strip never covers a control.
  useEffect(() => {
    document.body.classList.toggle('has-ad-strip', visible);
    return () => document.body.classList.remove('has-ad-strip');
  }, [visible]);

  // Native: raise / remove the AdMob banner and reserve its real height.
  useEffect(() => {
    if (SURFACE !== 'native') return;
    if (!nativeVisible) { void hideNativeBanner(); ROOT.style.removeProperty('--ad-strip-h'); return; }
    void showNativeBanner(px => {
      if (px > 0) ROOT.style.setProperty('--ad-strip-h', `${px}px`);
      else ROOT.style.removeProperty('--ad-strip-h');
    });
    return () => { void hideNativeBanner(); ROOT.style.removeProperty('--ad-strip-h'); };
  }, [nativeVisible]);

  // Native: while the banner stays up, swap in a new ad every random 60–90 s.
  // Never while the app is in the background — no ad requests with the screen off.
  useEffect(() => {
    if (SURFACE !== 'native' || !nativeVisible) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const ms = NATIVE_REFRESH_MIN_MS + Math.random() * (NATIVE_REFRESH_MAX_MS - NATIVE_REFRESH_MIN_MS);
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') void refreshNativeBanner();
        schedule();
      }, ms);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [nativeVisible]);

  if (!visible || SURFACE === 'native') return null;

  return (
    <div className="ad-strip" role="complementary" aria-label={t('Advertisement')}>
      <span className="ad-strip__tag">{t('Ad')}</span>
      {SURFACE === 'adsense'
        ? <AdSenseSlot />
        : <span className="ad-strip__text">{t('Your ad could be here. Go Pro to remove ads.')}</span>}
      {!isGuest && (
        <button
          type="button"
          className="ad-strip__close"
          aria-label={t('Close ad')}
          onClick={() => { playClickSound(); haptic.tap(); dismissAd(); }}
        >
          ×
        </button>
      )}
    </div>
  );
}
