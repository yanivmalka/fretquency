// ── share() — one call, three fallbacks ────────────────────────────────────
//
// Android's embedded WebView (what every Capacitor app runs in) does not
// implement `navigator.share` — that's a bare Chrome/installed-PWA feature —
// so the APK needs the native `@capacitor/share` plugin's system share sheet.
// On the web build, `navigator.share` covers mobile browsers and installed
// PWAs; desktop browsers mostly lack it too, so the final fallback copies the
// caption + link to the clipboard. `@capacitor/share` is lazily imported so
// the web bundle never pulls in a plugin it will never call (same pattern as
// the native speech engine).

import { Capacitor } from '@capacitor/core';

export interface ShareInput {
  title: string;
  text: string;
  url: string;
}

export type ShareOutcome = 'shared' | 'copied' | 'failed';

export async function shareResult(input: ShareInput): Promise<ShareOutcome> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: input.title, text: input.text, url: input.url, dialogTitle: input.title });
      return 'shared';
    } catch {
      // Falls through to the clipboard below — the user cancelling the share
      // sheet also lands here, which is fine (nothing to tell them).
    }
  } else if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: input.title, text: input.text, url: input.url });
      return 'shared';
    } catch (err) {
      // AbortError = the user cancelled the share sheet — not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
    }
  }

  try {
    await navigator.clipboard.writeText(`${input.text}\n${input.url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
