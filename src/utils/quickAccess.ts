// Quick Access — the opt-in floating control on the home screen that exposes a
// handful of often-flipped settings as a short strip of glowing icons.
//
// Modelled on `src/utils/pinnedBadges.ts` (an ordered `string[]` in
// localStorage, capped, cloud-synced last-writer-wins via `SYNCED_KEYS`) plus
// the tiny external-store shape from `src/utils/adminViewAsUser.ts`, so the
// Settings pin buttons and the home-screen widget stay in sync within a
// session without a reload.
//
// Six settings are pinnable and at most five can be pinned at once. Every
// pinnable setting is a two-state toggle except Sound & vibration, which cycles
// through the unified seven-stop loudness ladder (silent → vibrate → sound
// 1..5 → silent); see `src/utils/feedback.ts`.

import { loadSetting, saveSetting } from './settings';
import { SOUND_LEVEL_COUNT } from './feedback';

export const ENABLED_KEY = 'pref_quickAccessEnabled';
export const PINNED_KEY = 'pref_pinnedQuickAccess';
export const HINT_KEY = 'qaHintSeen';
export const MAX_QUICK_PINNED = 5;

// Quick Access is on out of the box, pre-pinned with the three settings players
// flip most often: note names (A B C ↔ Do Re Mi), sharps-or-flats, and the
// sound → vibrate → silent ringer switch. These are only fallbacks for a user
// who has never touched the widget — any stored / cloud-synced choice wins.
export const DEFAULT_QUICK_ENABLED = true;
export const DEFAULT_PINNED_QUICK: readonly QuickAccessId[] = [
  'notation',
  'accidental',
  'soundLevel',
];

export type QuickAccessId =
  | 'notation'
  | 'accidental'
  | 'showScore'
  | 'soundLevel'
  | 'answerMode'
  | 'showMastery';

// Pre-ladder builds pinned 'feedbackMode' and/or 'noteVolume' as two separate
// shortcuts; both now fold into the single 'soundLevel' stop.
const LEGACY_ID_MAP: Record<string, QuickAccessId> = {
  feedbackMode: 'soundLevel',
  noteVolume: 'soundLevel',
};

export interface QuickAccessItem {
  id: QuickAccessId;
  /** localStorage `pref_*` key the setting persists to. Omitted for
   *  `soundLevel`, whose cycled value spans two prefs — `QuickAccess`
   *  persists those itself. */
  prefKey?: string;
  /** English label, run through `t()` for the aria-label. */
  label: string;
  /** Only offered / cyclable when voice input is supported. */
  voiceOnly?: boolean;
  /** Current raw pref value -> the next raw value in the cycle. */
  next: (cur: unknown) => unknown;
}

export const QUICK_ACCESS_ITEMS: readonly QuickAccessItem[] = [
  {
    id: 'notation',
    prefKey: 'pref_notation',
    label: 'Note names',
    next: (cur) => (cur === 'alpha' ? 'solfege' : cur === 'solfege' ? 'german' : 'alpha'),
  },
  {
    id: 'accidental',
    prefKey: 'pref_accidental',
    label: 'Sharps or flats',
    next: (cur) => (cur === 'flats' ? 'sharps' : 'flats'),
  },
  {
    id: 'showScore',
    prefKey: 'pref_showScore',
    label: 'Score & celebrations',
    next: (cur) => cur === false,
  },
  {
    id: 'soundLevel',
    label: 'Sound & vibration',
    // `cur` is the ladder stop (0 silent, 1 vibrate, 2..6 sound 1..5); step up
    // one and wrap back to silent past the top.
    next: (cur) => ((typeof cur === 'number' ? cur : 0) + 1) % SOUND_LEVEL_COUNT,
  },
  {
    id: 'answerMode',
    prefKey: 'pref_answerMode',
    label: 'How you answer',
    voiceOnly: true,
    next: (cur) => (cur === 'voice' ? 'tap' : 'voice'),
  },
  {
    id: 'showMastery',
    prefKey: 'pref_showMastery',
    label: 'Mastery on the fretboard',
    next: (cur) => cur === false,
  },
];

const ITEM_IDS = new Set<string>(QUICK_ACCESS_ITEMS.map((i) => i.id));

export function quickAccessItem(id: QuickAccessId): QuickAccessItem {
  const it = QUICK_ACCESS_ITEMS.find((i) => i.id === id);
  if (!it) throw new Error(`unknown quick-access item: ${id}`);
  return it;
}

// ── External store ───────────────────────────────────────────────────
// A module-level listener set + cached snapshots, so `useSyncExternalStore`
// consumers (the pin buttons and the home widget) re-render together the
// instant anything flips, with no reload.

const listeners = new Set<() => void>();
function emit(): void {
  for (const fn of listeners) fn();
}

export function subscribeQuickAccess(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => { listeners.delete(onChange); };
}

function sanitizePinned(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw_x of raw) {
    if (typeof raw_x !== 'string') continue;
    const x = LEGACY_ID_MAP[raw_x] ?? raw_x;
    if (!ITEM_IDS.has(x) || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
    if (out.length >= MAX_QUICK_PINNED) break;
  }
  return out;
}

let enabled: boolean = loadSetting<boolean>(ENABLED_KEY, DEFAULT_QUICK_ENABLED);
let pinned: string[] = sanitizePinned(
  loadSetting<unknown>(PINNED_KEY, DEFAULT_PINNED_QUICK),
);
let hintSeen: boolean = loadSetting<boolean>(HINT_KEY, false);

export function getQuickAccessEnabled(): boolean {
  return enabled;
}

export function setQuickAccessEnabled(on: boolean): void {
  if (enabled === on) return;
  enabled = on;
  saveSetting(ENABLED_KEY, on);
  emit();
}

/** Stable reference between changes — safe as a `useSyncExternalStore` snapshot. */
export function getPinnedQuick(): string[] {
  return pinned;
}

export function isQuickPinned(id: QuickAccessId): boolean {
  return pinned.includes(id);
}

/**
 * Add or remove `id` from the pinned strip. Same include / exclude / cap logic
 * as `PinnedBadges.toggle`: adding past `MAX_QUICK_PINNED` is a no-op.
 */
export function togglePinnedQuick(id: QuickAccessId): void {
  if (!ITEM_IDS.has(id)) return;
  let next: string[];
  if (pinned.includes(id)) {
    next = pinned.filter((x) => x !== id);
  } else {
    if (pinned.length >= MAX_QUICK_PINNED) return;
    next = [...pinned, id];
  }
  pinned = next;
  saveSetting(PINNED_KEY, next);
  emit();
}

// ── Manage / deletion page ───────────────────────────────────────────
// The only way to reach the full-page "remove a Quick Access shortcut" view is
// to already have MAX_QUICK_PINNED pinned and try to pin one more: the cap
// prompt then offers to open this manager. `pendingPin` remembers the shortcut
// that could not fit, so the moment a slot is freed here it is pinned
// automatically and the user never has to walk back and re-tap the pushpin.

let manageOpen = false;
let pendingPin: QuickAccessId | null = null;

export function getQaManageOpen(): boolean {
  return manageOpen;
}

export function getPendingQuickPin(): QuickAccessId | null {
  return pendingPin;
}

/** Open the manager, remembering the shortcut the user just failed to pin. */
export function openQuickAccessManager(pending: QuickAccessId | null): void {
  pendingPin = pending;
  manageOpen = true;
  emit();
}

export function closeQuickAccessManager(): void {
  if (!manageOpen && pendingPin === null) return;
  manageOpen = false;
  pendingPin = null;
  emit();
}

/**
 * Remove a pinned shortcut from inside the manager. If that frees a slot and
 * there is a shortcut still waiting to be pinned, pin it right away and clear
 * the pending marker.
 */
export function removePinnedFromManager(id: QuickAccessId): void {
  if (!pinned.includes(id)) return;
  pinned = pinned.filter((x) => x !== id);
  saveSetting(PINNED_KEY, pinned);
  if (pendingPin && pendingPin !== id && !pinned.includes(pendingPin)
      && pinned.length < MAX_QUICK_PINNED) {
    pinned = [...pinned, pendingPin];
    saveSetting(PINNED_KEY, pinned);
    pendingPin = null;
  }
  emit();
}

export function hasSeenQaHint(): boolean {
  return hintSeen;
}

export function markQaHintSeen(): void {
  if (hintSeen) return;
  hintSeen = true;
  saveSetting(HINT_KEY, true);
  emit();
}

// ── Symbol legend page ───────────────────────────────────────────────
// A read-only full-page explainer for the glyphs `QuickAccessGlyph` draws,
// reached from a link under the "Quick access" enable row in Settings.

let legendOpen = false;

export function getQaLegendOpen(): boolean {
  return legendOpen;
}

export function openQuickAccessLegend(): void {
  if (legendOpen) return;
  legendOpen = true;
  emit();
}

export function closeQuickAccessLegend(): void {
  if (!legendOpen) return;
  legendOpen = false;
  emit();
}
