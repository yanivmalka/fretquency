// The base address for links a player SHARES with someone else (class
// invites, Fret of the Day, friend challenges). On the web that's this page's
// own origin + Vite base, so dev and preview links point at the server that
// made them. Inside the Capacitor APK the page is served from the WebView's
// local origin (https://localhost/ with a relative base), a dead address on
// anyone else's device, so a shared link goes to the public site instead.

import { Capacitor } from '@capacitor/core';

export const PUBLIC_APP_URL = 'https://yanivmalka.github.io/fretquency/';

export function shareBaseUrl(): string {
  if (Capacitor.isNativePlatform()) return PUBLIC_APP_URL;
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}
