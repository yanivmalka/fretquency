// Cloud sync for signed-in users. Guests never reach any of this.
//
// Model: localStorage stays the source of truth the UI reads from, always.
// The cloud is a backup/restore layer on top:
//   - on first sign-in on a device: pull cloud -> merge with local -> push
//     the merged set back -> write merged set into localStorage.
//   - while signed in + online: each new history row / personal best is
//     also written through to the cloud (best-effort, failure ignored).
//   - on later app starts while signed in + online: a full idempotent
//     re-push catches anything written offline.

import { supabase } from './supabase';
import { isBeginnerPreview } from './adminBeginnerPreview';
import type { HistoryEntry } from './music';
import type { PersonalBest } from './personalBest';

type HistoryMap = Record<string, HistoryEntry[]>;
type BestMap = Record<string, PersonalBest>;
// historyKey -> ISO timestamp of the clear. History rows at/before it are
// gone. The sentinel key '*' is a global clear that applies to every key.
type Tombstones = Record<string, string>;
const ALL_KEYS = '*';

let currentUserId: string | null = null;

export function setSyncUser(id: string | null) {
  // An admin's new-user preview must never reach the account.
  currentUserId = isBeginnerPreview() ? null : id;
}

/** The signed-in user id, or null for a guest. Read-only access for other sync modules. */
export function getSyncUserId(): string | null {
  return currentUserId;
}

function cloudReady(): boolean {
  return !!supabase && !!currentUserId && navigator.onLine;
}

// Marks that this device has completed the initial local->cloud merge for a
// given user, so a later sign-in of the same account doesn't re-run it.
const SYNCED_FLAG = 'cloudSyncedUser';
export function syncedUser(): string | null {
  try { return localStorage.getItem(SYNCED_FLAG); } catch { return null; }
}
function setSyncedUser(id: string) {
  try { localStorage.setItem(SYNCED_FLAG, id); } catch { /* ignore */ }
}
export function clearSyncedUser() {
  try { localStorage.removeItem(SYNCED_FLAG); } catch { /* ignore */ }
}

// ── Local tombstone store ───────────────────────────────────────────────
// Persisted so a re-push on a later app start (which never pulls) still
// knows not to resurrect cleared rows. Merged with the cloud set on every
// bootstrap / reconcile.
const TOMBSTONES_KEY = 'cloudDeletedKeys';

export function loadTombstones(): Tombstones {
  try {
    const raw = localStorage.getItem(TOMBSTONES_KEY);
    return raw ? (JSON.parse(raw) as Tombstones) : {};
  } catch {
    return {};
  }
}

function saveTombstones(t: Tombstones): void {
  try { localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(t)); } catch { /* ignore */ }
}

export function clearTombstones(): void {
  try { localStorage.removeItem(TOMBSTONES_KEY); } catch { /* ignore */ }
}

// Newest of two ISO timestamps (either may be undefined).
function laterIso(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? '';
  if (!b) return a;
  return a >= b ? a : b;
}

function mergeTombstones(a: Tombstones, b: Tombstones): Tombstones {
  const out: Tombstones = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = laterIso(out[k], v);
  return out;
}

// Drop every history row for a tombstoned key that was created at or before
// the clear. A replay after the clear (newer createdAt) survives; a key with
// nothing left is removed from the map.
function applyTombstones(history: HistoryMap, tombstones: Tombstones): HistoryMap {
  const out: HistoryMap = {};
  for (const [key, entries] of Object.entries(history)) {
    const cut = laterIso(tombstones[key], tombstones[ALL_KEYS]);
    if (!cut) { out[key] = entries; continue; }
    const kept = entries.filter(e => (e.createdAt ?? '') > cut);
    if (kept.length) out[key] = kept;
  }
  return out;
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Ensure every entry has a stable id + createdAt (older local rows predate
// these fields). Mutates a shallow copy, returns it.
export function withIds(entry: HistoryEntry): HistoryEntry {
  return {
    ...entry,
    id: entry.id ?? newId(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
}

// ── Write-through (called on each new row / best while signed in) ─────────

export async function cloudInsertEntry(historyKey: string, entry: HistoryEntry) {
  if (!cloudReady()) return;
  const e = withIds(entry);
  try {
    await supabase!.from('history_entries').upsert(
      {
        id: e.id,
        user_id: currentUserId,
        history_key: historyKey,
        note: e.note,
        fret: e.fret,
        string: e.string,
        seconds: e.seconds,
        skipped: e.skipped,
        correct: e.correct,
        created_at: e.createdAt,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  } catch { /* best-effort */ }
}

export async function cloudUpsertBest(historyKey: string, best: PersonalBest) {
  if (!cloudReady()) return;
  try {
    await supabase!.from('personal_bests').upsert(
      {
        user_id: currentUserId,
        history_key: historyKey,
        score: best.score,
        streak: best.streak,
        accuracy: best.accuracy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,history_key' },
    );
  } catch { /* best-effort */ }
}

// Clear the history rows for one selector-combination everywhere: delete the
// cloud rows, write a tombstone (local + cloud) so no later re-push or other
// device's bootstrap brings them back. Best-effort; the local tombstone is
// still recorded when offline so the next online sync propagates it.
export async function cloudDeleteKey(historyKey: string) {
  const now = new Date().toISOString();
  const local = loadTombstones();
  local[historyKey] = laterIso(local[historyKey], now);
  saveTombstones(local);

  if (!cloudReady()) return;
  try {
    await supabase!.from('history_entries')
      .delete()
      .eq('user_id', currentUserId)
      .eq('history_key', historyKey);
    await supabase!.from('deleted_keys').upsert(
      { user_id: currentUserId, history_key: historyKey, deleted_at: now },
      { onConflict: 'user_id,history_key' },
    );
  } catch { /* best-effort — local tombstone covers the next sync */ }
}

// Clear the history for every selector-combination at once: delete all of
// the user's cloud rows and write a single global ('*') tombstone so no
// re-push or other device's still-local rows bring anything back. A later
// replay (newer createdAt) still survives. Best-effort; the local tombstone
// is recorded even when offline.
export async function cloudDeleteAll() {
  const now = new Date().toISOString();
  const local = loadTombstones();
  local[ALL_KEYS] = laterIso(local[ALL_KEYS], now);
  saveTombstones(local);

  if (!cloudReady()) return;
  try {
    await supabase!.from('history_entries').delete().eq('user_id', currentUserId);
    await supabase!.from('deleted_keys').upsert(
      { user_id: currentUserId, history_key: ALL_KEYS, deleted_at: now },
      { onConflict: 'user_id,history_key' },
    );
  } catch { /* best-effort — local tombstone covers the next sync */ }
}

// ── Pull / merge / push (bootstrap on sign-in) ───────────────────────────

export async function pullAll(
  userId: string,
): Promise<{ history: HistoryMap; bests: BestMap; tombstones: Tombstones }> {
  const history: HistoryMap = {};
  const bests: BestMap = {};
  const tombstones: Tombstones = {};
  if (!supabase) return { history, bests, tombstones };

  const { data: rows, error: hErr } = await supabase
    .from('history_entries')
    .select('id, history_key, note, fret, string, seconds, skipped, correct, created_at')
    .eq('user_id', userId);
  if (hErr) throw hErr;
  for (const r of rows ?? []) {
    (history[r.history_key] ??= []).push({
      id: r.id,
      note: r.note,
      fret: r.fret,
      string: r.string,
      seconds: r.seconds,
      skipped: r.skipped,
      correct: r.correct,
      createdAt: r.created_at,
    });
  }

  const { data: bestRows, error: bErr } = await supabase
    .from('personal_bests')
    .select('history_key, score, streak, accuracy')
    .eq('user_id', userId);
  if (bErr) throw bErr;
  for (const r of bestRows ?? []) {
    bests[r.history_key] = { score: r.score, streak: r.streak, accuracy: r.accuracy };
  }

  const { data: tombRows, error: tErr } = await supabase
    .from('deleted_keys')
    .select('history_key, deleted_at')
    .eq('user_id', userId);
  if (tErr) throw tErr;
  for (const r of tombRows ?? []) tombstones[r.history_key] = r.deleted_at;

  return { history, bests, tombstones };
}

// History merge: union by id across every historyKey. Local rows without an
// id get one assigned here so the result is stable for the push that follows.
export function mergeHistory(
  local: HistoryMap,
  cloud: HistoryMap,
  tombstones: Tombstones = {},
): HistoryMap {
  const out: HistoryMap = {};
  const keys = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  for (const key of keys) {
    const byId = new Map<string, HistoryEntry>();
    for (const e of cloud[key] ?? []) byId.set(e.id!, e);
    for (const e of local[key] ?? []) {
      const withId = withIds(e);
      if (!byId.has(withId.id!)) byId.set(withId.id!, withId);
    }
    out[key] = [...byId.values()].sort(
      (a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
    );
  }
  return applyTombstones(out, tombstones);
}

// Personal-best merge: highest score per historyKey wins.
export function mergeBests(local: BestMap, cloud: BestMap): BestMap {
  const out: BestMap = {};
  const keys = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  for (const key of keys) {
    const l = local[key];
    const c = cloud[key];
    out[key] = !l ? c! : !c ? l : l.score >= c.score ? l : c;
  }
  return out;
}

export async function pushAll(
  userId: string,
  history: HistoryMap,
  bests: BestMap,
  tombstones: Tombstones = {},
): Promise<void> {
  if (!supabase) return;

  // Never re-push rows a tombstone already retired.
  history = applyTombstones(history, tombstones);

  const rows: Record<string, unknown>[] = [];
  for (const [historyKey, entries] of Object.entries(history)) {
    for (const e of entries) {
      const w = withIds(e);
      rows.push({
        id: w.id,
        user_id: userId,
        history_key: historyKey,
        note: w.note,
        fret: w.fret,
        string: w.string,
        seconds: w.seconds,
        skipped: w.skipped,
        correct: w.correct,
        created_at: w.createdAt,
      });
    }
  }
  if (rows.length) {
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from('history_entries')
        .upsert(rows.slice(i, i + 500), { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    }
  }

  const bestRows = Object.entries(bests).map(([historyKey, b]) => ({
    user_id: userId,
    history_key: historyKey,
    score: b.score,
    streak: b.streak,
    accuracy: b.accuracy,
    updated_at: new Date().toISOString(),
  }));
  if (bestRows.length) {
    const { error } = await supabase
      .from('personal_bests')
      .upsert(bestRows, { onConflict: 'user_id,history_key' });
    if (error) throw error;
  }

  const tombRows = Object.entries(tombstones).map(([historyKey, deletedAt]) => ({
    user_id: userId,
    history_key: historyKey,
    deleted_at: deletedAt,
  }));
  if (tombRows.length) {
    const { error } = await supabase
      .from('deleted_keys')
      .upsert(tombRows, { onConflict: 'user_id,history_key' });
    if (error) throw error;
  }
}

// Full bootstrap: pull -> merge -> push. Returns the merged sets for the
// caller to commit to localStorage / React state. Throws on failure, in
// which case the caller must leave local data untouched.
export async function bootstrapUser(
  userId: string,
  localHistory: HistoryMap,
  localBests: BestMap,
): Promise<{ history: HistoryMap; bests: BestMap }> {
  const { history: cloudHistory, bests: cloudBests, tombstones: cloudTombs } =
    await pullAll(userId);
  const tombstones = mergeTombstones(loadTombstones(), cloudTombs);
  const history = mergeHistory(localHistory, cloudHistory, tombstones);
  const bests = mergeBests(localBests, cloudBests);
  await pushAll(userId, history, bests, tombstones);
  saveTombstones(tombstones);
  setSyncedUser(userId);
  return { history, bests };
}

// ── Guest-merge prompt: "Use account only" ──────────────────────────────
// The first sign-in on a device with local guest history asks whether to
// merge that history into the account (design §5.4). If the user declines,
// their guest rows are dropped into this write-only analytics table —
// unlinked from any account (no user_id / FK) so the data isn't lost to us —
// and then the account's own cloud data is restored locally without unioning
// the guest rows in.

export async function cloudCaptureOrphans(entries: HistoryEntry[]): Promise<void> {
  if (!supabase || !entries.length) return;
  const batchId = newId();
  const rows = entries.map(e => {
    const w = withIds(e);
    return {
      batch_id: batchId,
      note: w.note,
      fret: w.fret,
      string: w.string,
      seconds: w.seconds,
      skipped: w.skipped,
      correct: w.correct,
      created_at: w.createdAt,
    };
  });
  try {
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from('orphan_practice').insert(rows.slice(i, i + 500));
      if (error) throw error;
    }
  } catch { /* best-effort — analytics capture only, never blocks sign-in */ }
}

// "Use account only": restore the account's cloud data locally without
// unioning in this device's guest rows. Reuses bootstrapUser with empty local
// maps so there is one pull -> merge -> push code path; the merge is a no-op.
export function restoreOnly(userId: string): Promise<{ history: HistoryMap; bests: BestMap }> {
  return bootstrapUser(userId, {}, {});
}

// Fast path for a device that has already bootstrapped this account: pull
// only the tombstone set, retire any locally-surviving cleared rows, then
// re-push. Returns the reconciled sets plus whether anything actually
// changed, so the caller can skip a needless re-render / localStorage write.
export async function reconcileUser(
  userId: string,
  localHistory: HistoryMap,
  localBests: BestMap,
): Promise<{ history: HistoryMap; bests: BestMap; changed: boolean }> {
  const { tombstones: cloudTombs } = await pullAll(userId);
  const tombstones = mergeTombstones(loadTombstones(), cloudTombs);
  const history = applyTombstones(localHistory, tombstones);
  const before = JSON.stringify(Object.keys(localHistory).sort());
  const after = JSON.stringify(Object.keys(history).sort());
  const changed =
    before !== after ||
    Object.keys(history).some(k => history[k].length !== (localHistory[k]?.length ?? 0));
  await pushAll(userId, history, localBests, tombstones);
  saveTombstones(tombstones);
  return { history, bests: localBests, changed };
}
