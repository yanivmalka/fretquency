import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

// Single Supabase client for the whole app. If the env vars are missing
// (e.g. a build without a .env), `supabase` is null and the app stays in
// pure guest / localStorage mode — nothing calls the network.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // PKCE so the OAuth callback carries a `?code=` that we exchange for a
          // session on the same client that started the flow. Required for the
          // native (Capacitor) deep-link callback in `useAuth`, and equivalent
          // to the old implicit flow on the web where `detectSessionInUrl`
          // handles the exchange automatically.
          flowType: 'pkce',
        },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

// The custom-scheme deep link Google redirects back to inside the Android app.
// Android routes it to `MainActivity` via the `<intent-filter>` in the manifest
// override (`android-overrides/AndroidManifest.xml`); `useAuth` listens for it
// through `@capacitor/app`'s `appUrlOpen`. This exact string must also be in the
// Supabase "Redirect URLs" allowlist.
export const NATIVE_AUTH_REDIRECT = 'com.fretquency.app://auth-callback';

// Where Google should send the user back to after auth. On the web it's the
// Vite `base` (/fretquency/) so it lines up with the Supabase
// "Redirect URLs" allowlist in both dev and production; inside the APK it's the
// custom-scheme deep link that returns to the app instead of a browser tab.
export function authRedirectTo(): string {
  if (Capacitor.isNativePlatform()) return NATIVE_AUTH_REDIRECT;
  return window.location.origin + import.meta.env.BASE_URL;
}
