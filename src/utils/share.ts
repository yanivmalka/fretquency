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

export interface ShareImageInput {
  title: string;
  text: string;
  blob: Blob;
  filename: string;
}

// Image sharing has no native-file path yet: @capacitor/share can only share
// an existing file:// path, and this app has no @capacitor/filesystem to
// write the PNG to one first (see product-wishlist.md) — so a native build
// falls straight to the download+clipboard fallback below, same as a browser
// with neither Web Share Level 2 nor the Clipboard image API.
export async function shareImage(input: ShareImageInput): Promise<ShareOutcome> {
  if (!Capacitor.isNativePlatform()) {
    const file = new File([input.blob], input.filename, { type: input.blob.type });
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: input.title, text: input.text, files: [file] });
        return 'shared';
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
      }
    }
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && 'write' in navigator.clipboard) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ [input.blob.type]: input.blob })]);
        return 'copied';
      } catch {
        // Falls through to the download+text fallback below.
      }
    }
  }

  try {
    const url = URL.createObjectURL(input.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = input.filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // Saving the file is best-effort; the caption below is still useful.
  }
  try {
    await navigator.clipboard.writeText(input.text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
