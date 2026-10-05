// ── Challenge links — short, public, PII-free URLs ─────────────────────────
//
// Two kinds of link open the same `DailyChallengeScreen`, both parsed off
// `location.search` once at boot (see `useChallengeLinkRoute`):
//
//   • Fret of the Day:   ?fotd=<instrumentId>
//     Always resolves to *today's* puzzle for that instrument — opening it
//     tomorrow plays tomorrow's puzzle, same as re-opening wordle.com.
//
//   • Challenge a friend: ?fotd=<instrumentId>&vs=<name>&sc=<correct>&t=<secs>
//     Carries the challenger's chosen display name (never an account id) plus
//     their score/time, so the friend sees "beat Dana's 9/10 in 31s" before
//     playing the *same* day's round.
//
// Deliberately short keys (shared links are public) and no date/seed param —
// the date comes from the clock, keeping the URL stable even if copy-pasted
// a few hours later on the other side of the world.

import type { InstrumentId } from './instruments';

const INSTRUMENT_IDS: readonly InstrumentId[] = ['guitar', 'bass', 'mandolin', 'banjo', 'ukulele'];

export interface ChallengeLinkData {
  instrumentId: InstrumentId;
  /** Present only on a "challenge a friend" link. */
  challenger?: { name: string; correct: number; total: number; seconds: number };
}

function isInstrumentId(v: string | null): v is InstrumentId {
  return !!v && (INSTRUMENT_IDS as readonly string[]).includes(v);
}

/** Parses `search` (e.g. `window.location.search`) into challenge-link data,
 *  or `null` when it carries none. Never throws on malformed input. */
export function parseChallengeLink(search: string): ChallengeLinkData | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  const instrumentId = params.get('fotd');
  if (!isInstrumentId(instrumentId)) return null;

  const name = params.get('vs');
  const sc = params.get('sc');
  const total = params.get('tot');
  const t = params.get('t');
  if (name && sc !== null && total !== null && t !== null) {
    const correct = Number.parseInt(sc, 10);
    const totalN = Number.parseInt(total, 10);
    const seconds = Number.parseInt(t, 10);
    if (Number.isFinite(correct) && Number.isFinite(totalN) && Number.isFinite(seconds)) {
      // Clip to a short, display-safe length — this came from a URL.
      return { instrumentId, challenger: { name: name.slice(0, 24), correct, total: totalN, seconds } };
    }
  }
  return { instrumentId };
}

/** Builds the Fret of the Day link for `instrumentId` on the given origin+base
 *  path (from `shareBaseUrl()` in utils/publicUrl.ts). */
export function buildDailyChallengeUrl(baseUrl: string, instrumentId: InstrumentId): string {
  const url = new URL(baseUrl);
  url.searchParams.set('fotd', instrumentId);
  return url.toString();
}

/** Builds a "challenge a friend" link carrying the challenger's own result.
 *  `name` is whatever the challenger typed — opt-in, never an account id. */
export function buildFriendChallengeUrl(
  baseUrl: string,
  instrumentId: InstrumentId,
  challenger: { name: string; correct: number; total: number; seconds: number },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('fotd', instrumentId);
  url.searchParams.set('vs', challenger.name.slice(0, 24));
  url.searchParams.set('sc', String(challenger.correct));
  url.searchParams.set('tot', String(challenger.total));
  url.searchParams.set('t', String(Math.round(challenger.seconds)));
  return url.toString();
}
