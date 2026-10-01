import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { supabase } from './supabase';

// In-app self-update for the sideloaded Android APK.
//
// The APK is NOT published on GitHub Releases (the repo is public). The
// Android workflow uploads each build to the private Supabase Storage bucket
// `app-releases` (see supabase/migrations/0019_app_updates.sql): a versioned
// `apk/app-<versionCode>.apk` plus a `latest.json` pointer. Only admins and
// the accounts in `public.apk_testers` can read it — for everyone else
// `findUpdate` quietly returns null, so the update card never shows.
//
// The native half is android-overrides/AppUpdaterPlugin.java: it downloads
// the APK inside the app (with progress), checks it's a newer build of this
// same package, and opens the system install dialog.

interface AppUpdaterPlugin {
  appInfo(): Promise<{ versionCode: number; versionName: string }>;
  downloadAndInstall(options: { url: string }): Promise<void>;
  addListener(
    event: 'progress',
    cb: (e: { percent: number }) => void,
  ): Promise<PluginListenerHandle>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

const BUCKET = 'app-releases';

/** Inside the Android app, where a self-update can run at all. */
export const canSelfUpdate =
  Capacitor.getPlatform() === 'android' && supabase !== null;

export interface AppUpdate {
  versionCode: number;
  versionName: string;
  path: string;
}

/** {versionCode, versionName} of the installed APK. */
export const installedVersion = () => AppUpdater.appInfo();

/**
 * The published build if it is newer than the installed APK, else null.
 * Null too when the signed-in account may not download (RLS denies the read),
 * when nobody is signed in, or on an APK that predates the native plugin.
 */
export async function findUpdate(): Promise<AppUpdate | null> {
  if (!canSelfUpdate || !supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data, error } = await supabase.storage.from(BUCKET).download('latest.json');
  if (error || !data) return null;
  const latest = JSON.parse(await data.text()) as Partial<AppUpdate>;
  if (typeof latest.versionCode !== 'number' || typeof latest.path !== 'string') return null;
  let versionCode: number;
  try {
    ({ versionCode } = await installedVersion());
  } catch {
    return null; // an APK built before AppUpdaterPlugin was added
  }
  if (latest.versionCode <= versionCode) return null;
  return {
    versionCode: latest.versionCode,
    versionName: latest.versionName ?? String(latest.versionCode),
    path: latest.path,
  };
}

/**
 * Downloads the APK (in Android's DownloadManager, so it carries on when the
 * app is left; the installer opens once the app is back in front) and opens
 * the system install dialog. `onProgress` gets
 * 0–100 (-1 when the size is unknown). Rejects with an Error whose message is
 * "busy", "bad url", "download", "not an update", "permission" or
 * "no installer" (from the plugin), or "sign" when no URL could be signed.
 */
export async function installUpdate(
  update: AppUpdate,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const url = await signedApkUrl(update.path);
  const listener = onProgress
    ? await AppUpdater.addListener('progress', (e) => onProgress(e.percent))
    : null;
  try {
    await AppUpdater.downloadAndInstall({ url });
  } finally {
    await listener?.remove();
  }
}

// A signed URL lives this long, and is reused while at least REUSE_MIN_MS of
// it is left. The plugin downloads through Android's DownloadManager, which
// keeps going after the app is left or closed, and a second tap on "Update"
// resumes that same download only when it is handed the SAME url — so a fresh
// URL per tap would throw away a half-finished download.
const SIGNED_URL_SECONDS = 2 * 60 * 60;
const REUSE_MIN_MS = 30 * 60 * 1000;
const SIGNED_URL_KEY = 'appUpdateSignedUrl';

async function signedApkUrl(path: string): Promise<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(SIGNED_URL_KEY) ?? 'null') as
      { path: string; url: string; expires: number } | null;
    if (saved && saved.path === path && saved.expires - Date.now() > REUSE_MIN_MS) {
      return saved.url;
    }
  } catch { /* a corrupt entry — sign a new one */ }
  if (!supabase) throw new Error('sign');
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) throw new Error('sign');
  localStorage.setItem(SIGNED_URL_KEY, JSON.stringify({
    path, url: data.signedUrl, expires: Date.now() + SIGNED_URL_SECONDS * 1000,
  }));
  return data.signedUrl;
}
