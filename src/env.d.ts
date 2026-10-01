/// <reference types="vite-plugin-pwa/client" />

declare const __COMMIT_HASH__: string;
declare const __COMMIT_DATE__: string;

interface Window {
  /**
   * Set by `src/main.tsx` once the service worker registers. Asks the SW to
   * check for a newer deploy right now and, if one is found, activates it and
   * reloads into it; otherwise falls back to a plain reload.
   */
  __applyUpdate?: () => Promise<void>;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** "1.0.<run>" — set only by the Android APK workflow (the APK's versionName). */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
