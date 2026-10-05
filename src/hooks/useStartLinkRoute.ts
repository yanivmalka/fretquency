// A landing page (guitar-neck-notes.html) links into the app with
// `?start=notes`, meaning "drop me straight into a Notes round". Read once at
// boot and stripped from the address bar (only this param — a `?fotd=` or
// `?class=` alongside it is left for its own route) so a reload or a share
// from inside the app doesn't start another round. Same shape as
// useChallengeLinkRoute.
import { useState } from 'react';

export function useStartLinkRoute(): boolean {
  const [startNotes] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('start') !== 'notes') return false;
      url.searchParams.delete('start');
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      return false;
    }
    return true;
  });
  return startNotes;
}
