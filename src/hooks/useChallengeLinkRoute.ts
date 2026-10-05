// A Fret of the Day / Challenge-a-friend link opens the web build with
// `?fotd=...` in the query string (see utils/challengeLink.ts). This is the
// first thing in the repo that reads an incoming URL for anything other than
// the native OAuth callback (useAuth.ts) — read once at boot, consumed, and
// then stripped from the address bar so a reload/share from inside the app
// doesn't re-trigger it.
import { useState } from 'react';
import { parseChallengeLink, type ChallengeLinkData } from '../utils/challengeLink';

export function useChallengeLinkRoute() {
  const [linkData] = useState<ChallengeLinkData | null>(() => {
    if (typeof window === 'undefined') return null;
    const data = parseChallengeLink(window.location.search);
    if (data) {
      try {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState(window.history.state, '', url.toString());
      } catch {
        /* non-fatal — the param just stays in the address bar */
      }
    }
    return data;
  });
  return linkData;
}
