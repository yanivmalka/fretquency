// Reads a class invite code at boot: from `?class=CODE` in the URL (then
// strips just that param from the address bar), else from a code a guest
// saved before leaving for Google sign-in (classLink.ts). Mirrors
// useChallengeLinkRoute.
import { useState } from 'react';
import { parseClassLink, readPendingClassCode } from './classLink';

export function useClassLinkRoute(): string | null {
  const [code] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const fromUrl = parseClassLink(window.location.search);
    if (fromUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('class');
        window.history.replaceState(window.history.state, '', url.toString());
      } catch {
        /* non-fatal — the param just stays in the address bar */
      }
      return fromUrl;
    }
    return readPendingClassCode();
  });
  return code;
}
