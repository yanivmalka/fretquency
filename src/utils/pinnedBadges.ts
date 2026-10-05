// Pinned achievement badges — the up-to-five medals the player parks beside
// their name in the Account section.
//
// Stored as an ordered list of badge *instance keys* in localStorage under
// `pref_pinnedBadges`. That key is in settingsSync's SYNCED_KEYS, so
// `saveSetting` write-throughs it to the cloud (last-writer-wins) alongside the
// other preferences — the selection follows the player across devices without
// needing the field-merge machinery `badgeSync.ts` uses for the earned set.
//
// An instance key is `"<badgeId>"` for player-wide badges and
// `"<badgeId>@<instrumentId>"` for the fretboard-shaped families that are
// earned per instrument — the same `{id}@{instrument}` shape `badges.ts` uses
// for its store keys, minus the `::tier` suffix: the pinned strip always shows
// a family's current highest tier and upgrades on its own.

import { loadSetting, saveSetting } from './settings';
import { INSTRUMENTS, getInstrument, type InstrumentId } from './instruments';
import {
  badgeList, earnedTier, type BadgeDef, type BadgeId, type Tier,
} from './badges';

export const MAX_PINNED = 5;
const KEY = 'pref_pinnedBadges';

export interface PinnedKey {
  id: BadgeId;
  instrumentId?: string;
}

export function parsePinned(key: string): PinnedKey {
  const at = key.indexOf('@');
  return at < 0
    ? { id: key as BadgeId }
    : { id: key.slice(0, at) as BadgeId, instrumentId: key.slice(at + 1) };
}

export function makePinnedKey(id: BadgeId, instrumentId?: string): string {
  return instrumentId ? `${id}@${instrumentId}` : id;
}

export function loadPinned(): string[] {
  const raw = loadSetting<unknown>(KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string').slice(0, MAX_PINNED);
}

export function savePinned(list: string[]): void {
  saveSetting(KEY, list.slice(0, MAX_PINNED));
}

/** One earned badge the player could pin. */
export interface EarnedBadgeInstance {
  key: string;
  def: BadgeDef;
  /** Instrument scope it was earned under; undefined for player-wide badges. */
  instrumentId?: string;
  /** Highest tier reached — `'onyx'` for the untiered Admin role. */
  tier: Tier | 'onyx';
}

/**
 * Every badge the player has actually earned, across *both* instruments:
 * player-wide families listed once, fretboard-shaped families listed once per
 * instrument they were earned on. The role medals (Admin/Teacher/Student) are
 * appended for whichever ones the account currently holds — each re-grants
 * from the live account/session state, so it always counts as held while true.
 */
export function earnedBadgeInstances(roles: { isAdmin?: boolean; isTeacher?: boolean; isStudent?: boolean }): EarnedBadgeInstance[] {
  const out: EarnedBadgeInstance[] = [];
  const seen = new Set<string>();

  for (const inst of Object.values(INSTRUMENTS)) {
    for (const def of badgeList(inst)) {
      if (def.kind === 'role') continue;
      const instrumentId = def.instrumentScoped ? inst.id : undefined;
      const key = makePinnedKey(def.id, instrumentId);
      if (seen.has(key)) continue;
      const tier = earnedTier(def.id, instrumentId);
      if (!tier) continue;
      seen.add(key);
      out.push({ key, def, instrumentId, tier });
    }
  }

  const held: Partial<Record<BadgeId, boolean>> = {
    admin: roles.isAdmin, teacher: roles.isTeacher, student: roles.isStudent,
  };
  const anyInstrument = badgeList(Object.values(INSTRUMENTS)[0]);
  for (const [id, isHeld] of Object.entries(held)) {
    if (!isHeld) continue;
    const def = anyInstrument.find(d => d.id === id);
    if (def) out.push({ key: id, def, tier: 'onyx' });
  }
  return out;
}

/**
 * Localise a badge family name, matching `BadgeGrid` / `BadgeCelebration`: most
 * names pass straight through `t()`, but the per-string String Master family
 * carries a spliced-in string label, so that label is lifted to a `{s}`
 * placeholder and the translated label substituted back. English is a no-op.
 */
export function pinnedBadgeName(
  def: BadgeDef, instrumentId: string | undefined, t: (s: string) => string,
): string {
  const m = /^string_master_s(\d+)$/.exec(def.id);
  const inst = instrumentId ? getInstrument(instrumentId as InstrumentId) : null;
  const label = m && inst ? inst.stringLabels[Number(m[1])] : null;
  if (label && def.name.includes(label)) {
    return t(def.name.replace(label, '{s}')).replace('{s}', t(label));
  }
  return t(def.name);
}
