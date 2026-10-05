import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  supabase, isSupabaseConfigured, authRedirectTo, NATIVE_AUTH_REDIRECT,
} from '../utils/supabase';
import { setSyncUser } from '../utils/sync';
import { fetchIsAdmin } from '../utils/board';
import {
  fetchEntitlement, cachedEntitlement, FREE, tierAtLeast,
  type Entitlement, type Tier,
} from '../utils/entitlement';
import {
  getDevSimulateTier, subscribeDevSimulateTier, setDevSimulateTier, type SimTier,
} from '../utils/devSimulateTier';
import {
  getAdminViewAsUser, subscribeAdminViewAsUser, setAdminViewAsUser,
} from '../utils/adminViewAsUser';

export interface AuthProfile {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface AuthState {
  user: User | null;
  profile: AuthProfile | null;
  /** True when the signed-in user has a row in `public.admins` AND is not
   *  currently browsing as a regular user (see {@link viewingAsUser}). This is
   *  the flag the UI should gate admin-only chrome on. */
  admin: boolean;
  /** True when the account actually has a row in `public.admins`, regardless of
   *  the {@link viewingAsUser} mask. Use this only to decide whether to offer
   *  the "back to admin" / "view as user" switch — never to unlock admin UI. */
  adminAccount: boolean;
  /** An admin has flipped "view the app as a regular user" from the Account
   *  tab. Purely a client-side view mask over {@link admin}. */
  viewingAsUser: boolean;
  /** Toggle {@link viewingAsUser} (persisted to localStorage). */
  setViewingAsUser: (on: boolean) => void;
  /** Effective subscription tier (`'free'` | `'pro'` | `'premium'`), already
   *  folded with the DEV tier simulator. `'free'` for guests and signed-in
   *  free users. */
  tier: Tier;
  /** Tier is Pro **or better** (Premium included). This is the flag to gate a
   *  Pro-or-above feature on — never `tier === 'pro'`. */
  isPro: boolean;
  /** Tier is Premium. For future Premium-only gates. */
  isPremium: boolean;
  /** The full entitlement row (tier + `source` + `expiresAt`), `FREE` for
   *  guests. `source` / `expiresAt` back the Pro details in `<UpgradeCard>`. */
  entitlement: Entitlement;
  /** True while the first entitlement lookup for the current user is in flight. */
  entitlementLoading: boolean;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-fetch the entitlement now (used by the foreground refresh and, later,
   *  the post-purchase flow). No-op for guests. */
  refreshEntitlement: () => Promise<void>;
  /** Dev-only (`import.meta.env.DEV`): a tri-state override of the effective
   *  tier (`'off'` | `'pro'` | `'premium'`) with no DB change, so every gated
   *  UI can be exercised against one account. Always `'off'` in a production
   *  bundle. */
  devSimulateTier: SimTier;
  /** Set {@link devSimulateTier} (persisted to localStorage). No-op in a
   *  production bundle. */
  setDevSimulateTier: (tier: SimTier) => void;
}

// How stale the entitlement may get before a foreground return re-fetches it.
const ENTITLEMENT_MAX_AGE_MS = 5 * 60_000;

// Google's OAuth `profile` scope (requested by default) puts the display name
// and picture into `user_metadata`. Supabase key names vary a little by
// provider, so check the known aliases.
function toProfile(user: User | null): AuthProfile | null {
  if (!user) return null;
  const m = (user.user_metadata ?? {}) as Record<string, unknown>;
  const str = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = m[k];
      if (typeof v === 'string' && v) return v;
    }
    return null;
  };
  return {
    name: str('full_name', 'name'),
    email: str('email') ?? user.email ?? null,
    avatarUrl: str('avatar_url', 'picture'),
  };
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [entitlement, setEntitlement] = useState<Entitlement>(FREE);
  const [entitlementLoading, setEntitlementLoading] = useState(isSupabaseConfigured);

  // Dev-only "simulate tier": an external-store tri-state that overrides the
  // effective tier below so every gated UI can be checked without touching the
  // DB (design §6.2). Backed by a store rather than local state so every
  // independent `useAuth()` instance updates together; `import.meta.env.DEV`-
  // gated, so a production build folds it to `'off'` (verified by grepping
  // `dist/`).
  const devSimulateTier = useSyncExternalStore(subscribeDevSimulateTier, getDevSimulateTier);

  // Admin "view as a regular user": an external-store flag AND-ed out of the
  // exposed `admin` below so every `useAuth()` instance masks admin chrome
  // together. Backed by a store for the same reason as `devSimulateTier`.
  const viewingAsUser = useSyncExternalStore(subscribeAdminViewAsUser, getAdminViewAsUser);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSyncUser(data.session?.user?.id ?? null);
      setLoading(false);
    }).catch(() => {
      // Never leave the boot splash hanging on a rejected session read — the
      // boot 'app-ready' event waits on this flag (see useBootReadyEvent).
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSyncUser(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Native (Capacitor) OAuth callback. `signInWithGoogle` opens Google's
  // consent screen in an in-app Chrome Custom Tab; when it finishes, Android
  // routes the `com.fretquency.app://auth-callback?code=…` deep link
  // back here via `@capacitor/app`. We exchange the `code` for a session on the
  // same client that started the flow (its PKCE verifier is in localStorage),
  // then close the tab. The web build never registers this — it uses the
  // in-page `detectSessionInUrl` exchange instead.
  useEffect(() => {
    if (!supabase || !Capacitor.isNativePlatform()) return;
    const client = supabase;
    const consume = async (url: string) => {
      if (!url.startsWith(NATIVE_AUTH_REDIRECT)) return;
      try {
        const params = new URL(url).searchParams;
        const code = params.get('code');
        const error = params.get('error_description') ?? params.get('error');
        if (error) console.error('[auth] OAuth callback error:', error);
        else if (code) await client.auth.exchangeCodeForSession(code);
      } catch (e) {
        console.error('[auth] failed to handle OAuth callback', e);
      } finally {
        void Browser.close().catch(() => {});
      }
    };
    // Warm resume from the Custom Tab is the normal path; also cover a cold
    // start where the deep link was the launch intent.
    void CapacitorApp.getLaunchUrl().then((r) => { if (r?.url) void consume(r.url); });
    const handle = CapacitorApp.addListener('appUrlOpen', ({ url }) => { void consume(url); });
    return () => { void handle.then((h) => h.remove()); };
  }, []);

  // Admin flag: a row in `public.admins` (see utils/board.ts). Re-checked
  // whenever the signed-in user changes. A stale `true` after sign-out is
  // masked below by gating the exposed value on `user`.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchIsAdmin(user.id).then(is => { if (!cancelled) setAdmin(is); });
    return () => { cancelled = true; };
  }, [user]);

  // Entitlement: same shape as the admin effect — re-checked whenever the
  // signed-in user changes; a stale value after sign-out is masked below by
  // gating the exposed `tier` / `isPro` on `user`. Offline, `fetchEntitlement`
  // falls back to the localStorage cache, so a returning Pro user stays Pro
  // without a network round-trip (design §9).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // Seed synchronously from the offline cache so a returning Pro user isn't
    // shown the locked UI for the ~half-second the network lookup takes. The
    // fetch below still runs and corrects an expired / downgraded row.
    const cached = cachedEntitlement(user.id);
    if (cached) {
      setEntitlement(cached);
      setEntitlementLoading(false);
    }
    fetchEntitlement(user.id).then(e => {
      if (cancelled) return;
      setEntitlement(e);
      setEntitlementLoading(false);
    }).catch(() => {
      // `fetchEntitlement` is meant to fail open on its own, but never let a
      // rejection here strand the boot splash — the boot 'app-ready' event
      // waits on this flag (see useBootReadyEvent). Falls back to Free / the
      // cached row until the next foreground refresh corrects it.
      if (!cancelled) setEntitlementLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  // Foreground refresh: a just-upgraded user on another device (or an expiry)
  // becomes visible without a reload. Re-fetch when the tab returns to the
  // foreground after more than ~5 min, and whenever the network reconnects.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let lastFetch = Date.now();
    const maybeRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetch < ENTITLEMENT_MAX_AGE_MS) return;
      lastFetch = Date.now();
      fetchEntitlement(user.id).then(e => { if (!cancelled) setEntitlement(e); });
    };
    const onOnline = () => { lastFetch = 0; maybeRefresh(); };
    document.addEventListener('visibilitychange', maybeRefresh);
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', maybeRefresh);
      window.removeEventListener('online', onOnline);
    };
  }, [user]);

  const refreshEntitlement = useCallback(async () => {
    if (!user) { setEntitlement(FREE); return; }
    setEntitlement(await fetchEntitlement(user.id));
  }, [user]);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    if (Capacitor.isNativePlatform()) {
      // Don't let supabase-js navigate the WebView to accounts.google.com —
      // Google blocks OAuth in an embedded WebView and Android would punt it to
      // the system browser with no way back. Get the URL, open it in an in-app
      // Chrome Custom Tab, and let the `appUrlOpen` effect above finish the
      // flow when the deep link returns.
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authRedirectTo(), skipBrowserRedirect: true },
      });
      if (data?.url) await Browser.open({ url: data.url });
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTo() },
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  // Dev-only override: force an effective tier so every gated experience is one
  // tap apart during development (design §9). Deliberately not gated on `user`
  // — it works on the config-less local dev server too. `'off'` in production
  // builds, so `effectiveTier` is just the real entitlement there.
  const simTier: SimTier = import.meta.env.DEV ? devSimulateTier : 'off';
  const realTier: Tier = user ? entitlement.tier : 'free';
  const effectiveTier: Tier = simTier === 'off' ? realTier : simTier;

  return {
    user,
    profile: toProfile(user),
    admin: admin && !!user && !viewingAsUser,
    adminAccount: admin && !!user,
    viewingAsUser,
    setViewingAsUser: setAdminViewAsUser,
    tier: effectiveTier,
    isPro: tierAtLeast(effectiveTier, 'pro'),
    isPremium: tierAtLeast(effectiveTier, 'premium'),
    entitlement: user ? entitlement : FREE,
    entitlementLoading: !!user && entitlementLoading,
    loading,
    configured: isSupabaseConfigured,
    signInWithGoogle,
    signOut,
    refreshEntitlement,
    devSimulateTier,
    setDevSimulateTier,
  };
}
