// Class invite links: `<base>?class=ABC234` opens the Class screen with the
// code filled in. Read once at boot by useClassLinkRoute and stripped from
// the address bar, like the Fret of the Day link (utils/challengeLink.ts).
//
// Google sign-in leaves the page (an OAuth redirect), so a guest who taps
// "Sign in" on an invite would lose the code. `setPendingClassCode` keeps it
// in localStorage across that round trip; the route hook picks it up on the
// next boot and the Class screen clears it once the student has joined (or
// closed the screen).

import { CLASS_CODE_LENGTH, normaliseClassCode } from './homework';

const PARAM = 'class';
const PENDING_KEY = 'pendingClassCode';

export function buildClassInviteUrl(baseUrl: string, code: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set(PARAM, code);
  return url.toString();
}

/** The code in a `?class=` query string, or null when absent/malformed. */
export function parseClassLink(search: string): string | null {
  const raw = new URLSearchParams(search).get(PARAM);
  if (!raw) return null;
  const code = normaliseClassCode(raw);
  return code.length === CLASS_CODE_LENGTH ? code : null;
}

export function setPendingClassCode(code: string): void {
  try { localStorage.setItem(PENDING_KEY, code); } catch { /* storage disabled */ }
}

export function readPendingClassCode(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const code = normaliseClassCode(raw);
    return code.length === CLASS_CODE_LENGTH ? code : null;
  } catch {
    return null;
  }
}

export function clearPendingClassCode(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* storage disabled */ }
}
