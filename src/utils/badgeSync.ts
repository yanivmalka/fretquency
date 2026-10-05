// ── Cloud sync for earned achievement badges ──────────────────────────
//
// Same spirit as settingsSync.ts / voiceSync.ts: localStorage (key `badges`)
// stays the source of truth the badge wall reads from on every render. The
// cloud is a restore layer for signed-in users.
//
// The badge store is a tiny fixed-size map — `{ "<storeKey>": { earnedAt } }`
// — and "earned" is monotonic, so it merges cleanly field-wise (unlike the
// settings blob): the merge is a key union that keeps the earliest `earnedAt`
// for any key both sides hold. That makes it commutative and idempotent, so
// every push is really a pull -> merge -> write-back -> upsert mini-reconcile;
// two devices can never diverge the way they do with a last-writer blob.
//
//   - first sign-in on a device: pull cloud, merge with local, write the
//     merged set back to localStorage, push it up.
//   - while signed in + online: each new badge triggers a debounced reconcile.
//   - on reconnect / later app starts: the same idempotent reconcile re-runs.
//
// Retirements (admin "Reset"): a plain union merge would resurrect a family an
// admin cleared on another device, so a reset also records a tombstone —
// `retired[familyId] = <iso>` — carried in the same `user_badges` row and
// mirrored to localStorage. `applyRetired` then drops every earned key in that
// family whose `earnedAt` predates the tombstone, on every device, exactly the
// way sync.ts's `applyTombstones` retires cleared history. A later Grant
// (newer `earnedAt`) survives, so the tombstone just goes inert rather than
// needing to be cleared.
//
// This module never imports badges.ts (which imports this one for the
// write-through hook) — it reads and writes the `badges` key directly, exactly
// as settingsSync.ts stays independent of settings.ts.
//
// When a reconcile actually changes the local store it dispatches a
// `badges-synced` window event; a mounted BadgeGrid listens for it and
// re-reads. No full-page reload (the settings model needs one only because its
// hooks read localStorage once at mount — the badge wall re-reads every render
// and remounts each time it's opened).

import { supabase } from './supabase';
import { getSyncUserId } from './sync';

const STORE_KEY = 'badges';
const RETIRED_KEY = 'badgesRetired';

type EarnedBadge = { earnedAt: string };
export type BadgeStore = Record<string, EarnedBadge>;
// familyId -> ISO timestamp of the admin reset. Earned keys in that family at
// or before it are retired; a Grant afterwards (newer earnedAt) survives.
type Retired = Record<string, string>;

function cloudReady(): boolean {
  return !!supabase && !!getSyncUserId() && navigator.onLine;
}

// Marks that this device has completed the initial local<->cloud merge for a
// given user, so a later sign-in of the same account doesn't re-bootstrap.
const SYNCED_FLAG = 'cloudSyncedBadgesUser';
export function syncedBadgesUser(): string | null {
  try { return localStorage.getItem(SYNCED_FLAG); } catch { return null; }
}
function setSyncedBadgesUser(id: string): void {
  try { localStorage.setItem(SYNCED_FLAG, id); } catch { /* ignore */ }
}
export function clearSyncedBadgesUser(): void {
  try { localStorage.removeItem(SYNCED_FLAG); } catch { /* ignore */ }
}

function loadLocal(): BadgeStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as BadgeStore) : {};
  } catch {
    return {};
  }
}

function loadLocalRetired(): Retired {
  try {
    const raw = localStorage.getItem(RETIRED_KEY);
    return raw ? (JSON.parse(raw) as Retired) : {};
  } catch {
    return {};
  }
}

function writeLocalRetired(retired: Retired): void {
  try { localStorage.setItem(RETIRED_KEY, JSON.stringify(retired)); } catch { /* ignore */ }
}

// Write the merged store straight to localStorage, bypassing badges.ts's
// `saveBadges` so a reconcile never re-triggers its own write-through. Returns
// true only if the on-disk value actually changed, and lets a mounted badge
// wall know to re-read.
function writeLocal(store: BadgeStore): boolean {
  try {
    const next = JSON.stringify(store);
    if (localStorage.getItem(STORE_KEY) === next) return false;
    localStorage.setItem(STORE_KEY, next);
  } catch {
    return false;
  }
  try { window.dispatchEvent(new Event('badges-synced')); } catch { /* non-DOM env */ }
  return true;
}

// The badge family a store key belongs to: strip the `::tier` suffix and any
// `@instrument` scope. `on_fire::silver` -> `on_fire`,
// `string_master_s1@guitar::gold` -> `string_master_s1`. Matches the families
// `resetBadgeFamily` clears in badges.ts.
function familyOf(storeKey: string): string {
  const base = storeKey.includes('::') ? storeKey.slice(0, storeKey.indexOf('::')) : storeKey;
  return base.includes('@') ? base.slice(0, base.indexOf('@')) : base;
}

// Key union; for a key both sides hold, keep the earliest `earnedAt` (a badge
// earned is earned — the first time it happened is the honest timestamp).
export function mergeBadgeStores(a: BadgeStore, b: BadgeStore): BadgeStore {
  const out: BadgeStore = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    out[k] = !cur
      ? v
      : { earnedAt: cur.earnedAt <= v.earnedAt ? cur.earnedAt : v.earnedAt };
  }
  return out;
}

// Newest reset per family wins.
export function mergeRetired(a: Retired, b: Retired): Retired {
  const out: Retired = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (!out[k] || v > out[k]) out[k] = v;
  }
  return out;
}

// Drop earned keys whose family was reset at or after the key was earned; a
// re-Grant after the reset (newer earnedAt) is kept. Applied to each side
// *before* the union, not just to the result: otherwise "keep earliest
// earnedAt" would pull a re-Grant back down to the cleared copy's timestamp
// and the tombstone would then retire it.
export function applyRetired(store: BadgeStore, retired: Retired): BadgeStore {
  const out: BadgeStore = {};
  for (const [key, val] of Object.entries(store)) {
    const cut = retired[familyOf(key)];
    if (cut && val.earnedAt <= cut) continue;
    out[key] = val;
  }
  return out;
}

// pull -> merge -> write-back -> upsert. Idempotent and order-independent.
// Returns whether the local store changed on disk.
async function reconcile(userId: string): Promise<boolean> {
  const { data: row, error } = await supabase!
    .from('user_badges')
    .select('badges, retired, student_visible')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  const cloudStore = (row?.badges ?? {}) as BadgeStore;
  const cloudRetired = (row?.retired ?? {}) as Retired;

  const retired = mergeRetired(loadLocalRetired(), cloudRetired);
  const merged = mergeBadgeStores(
    applyRetired(loadLocal(), retired),
    applyRetired(cloudStore, retired),
  );

  const changed = writeLocal(merged);
  writeLocalRetired(retired);
  // Pulled once at bootstrap so a device that never touched the toggle shows
  // the account's real setting instead of the local default (false).
  if (row && typeof row.student_visible === 'boolean') writeLocalStudentVisible(row.student_visible);

  const { error: upErr } = await supabase!.from('user_badges').upsert(
    {
      user_id: userId, badges: merged, retired,
      student_visible: loadStudentVisible(), updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (upErr) throw upErr;

  return changed;
}

// ── Student badge visibility (0029) ────────────────────────────────────
// A simple on/off preference, not a mergeable set — last write wins, same
// model as settingsSync's blob. Lives alongside the badge row rather than in
// `user_settings` because it has to be world-readable for `fetchPublicBadges`
// to enforce it, and `user_settings` is self-only.
const STUDENT_VISIBLE_KEY = 'studentBadgePublic';

export function loadStudentVisible(): boolean {
  try { return localStorage.getItem(STUDENT_VISIBLE_KEY) === 'true'; } catch { return false; }
}

function writeLocalStudentVisible(v: boolean): void {
  try { localStorage.setItem(STUDENT_VISIBLE_KEY, v ? 'true' : 'false'); } catch { /* ignore */ }
}

/** Flip the Student badge's public visibility and push it immediately
 *  (unlike earned badges, there is nothing to merge — just upsert the flag). */
export async function setStudentBadgeVisible(userId: string, visible: boolean): Promise<void> {
  writeLocalStudentVisible(visible);
  if (!supabase) return;
  const { error } = await supabase
    .from('user_badges')
    .upsert({ user_id: userId, student_visible: visible, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

// ── Write-through (debounced) ─────────────────────────────────────────
// Called from badges.ts after any successful `saveBadges`.

let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function cloudPushBadges(): void {
  if (!cloudReady()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void (async () => {
      if (!cloudReady()) return;
      try { await reconcile(getSyncUserId()!); } catch { /* best-effort */ }
    })();
  }, 800);
}

// Record an admin "Reset" of a badge family as a tombstone. Written to
// localStorage synchronously (so it survives an offline reset) and pushed on
// the reconcile `saveBadges` schedules right after. Retiring on one device
// therefore clears the family on every device, and no later push resurrects it.
export function retireBadgeFamily(familyId: string): void {
  const retired = loadLocalRetired();
  retired[familyId] = new Date().toISOString();
  writeLocalRetired(retired);
}

// ── Public read (another player's profile) ────────────────────────────
// Read-only fetch of ANY player's earned badges (migration 0022 adds a public
// SELECT policy alongside the self-only write policy). Retirements are
// applied so an admin-cleared family doesn't show as earned. Returns {} for a
// guest build, a player with no row yet, or on any error — a profile view
// should degrade to "no badges yet", never throw.
export async function fetchPublicBadges(userId: string): Promise<BadgeStore> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badges, retired, student_visible')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return {};
    const store = applyRetired((data.badges ?? {}) as BadgeStore, (data.retired ?? {}) as Retired);
    // Teacher is always public (a teacher wants to be recognisable); Student
    // is opt-in (a classmate shouldn't be outed without asking) — strip it
    // here, at the one read path every viewer-of-another-player goes through,
    // rather than trust every call site to re-check the flag.
    if (!data.student_visible) delete store.student;
    return store;
  } catch {
    return {};
  }
}

// ── Bootstrap on sign-in ─────────────────────────────────────────────
// Pull/merge/push once per sign-in on this device. Throws on failure so the
// caller leaves local data untouched and retries on the next app start.
// Returns whether the local store changed, so the caller can refresh a
// badge wall that happens to already be mounted.
export async function bootstrapBadges(userId: string): Promise<{ changed: boolean }> {
  if (!supabase) return { changed: false };
  const changed = await reconcile(userId);
  setSyncedBadgesUser(userId);
  return { changed };
}
