// Achievements ("badges"). Three kinds:
//
//  • Session badges  — evaluated at game-end from that round's score/streak and
//    its `HistoryEntry` rows. They are NOT back-computed from flat history
//    (sessions aren't delimited in storage), so they only ever accrue going
//    forward.
//  • Lifetime badges — pure functions over play history, re-checked at game-end
//    AND whenever the Badges screen opens, so existing history retroactively
//    unlocks them.
//  • Role badges — reflect the account (e.g. Admin), never evaluated from
//    history, and carry no levels.
//
// Every session/lifetime badge is a *family* with up to four ordered levels —
// Bronze / Silver / Gold, and Platinum where the milestone genuinely earns a
// fourth rung (Dedicated, Century, Marathoner). A player keeps the family the
// moment Bronze is reached and keeps progressing through the same tile.
//
// localStorage (key `badges`) is the source of truth the wall reads from.
// For signed-in users `saveBadges` also write-throughs to the cloud via
// `badgeSync.ts` (pull/merge/push), and a sign-in bootstrap restores the set
// on a new device — so session badges and their `earnedAt` survive a device
// switch instead of being lost. Guests never touch the network.
//
// Instrument scoping has two layers (unchanged from the binary-badge design):
//  • The *store key* — string/fret-shaped badges are earned per instrument
//    (`"{badgeId}@{instrumentId}"`); everything else uses the bare `badgeId`.
//    `awardBadge` / `isEarned` route this from the id. A level beyond Bronze
//    appends `::{tier}` to whichever of those two shapes applies, so every
//    badge already earned under the pre-levels system keeps meaning unchanged
//    as its Bronze record — no migration.
//  • The *evaluation input* — badges that measure the fretboard
//    (String Master, Full String Master, Neck Runner, Both Ends, Low End)
//    look only at the current instrument's history; badges that measure the
//    player (Century, Marathoner, streaks, accuracy, improvement…) look at
//    every instrument's history combined, so bass practice counts toward them
//    the moment it happens.

import type { HistoryEntry } from './music';
import type { InstrumentConfig, InstrumentId } from './instruments';
import { INSTRUMENTS } from './instruments';
import { dailyStats, practiceStreak, lifetimeTotals } from './progress';
import { cloudPushBadges, retireBadgeFamily } from './badgeSync';

// Fixed-identity badges. String Master is per-string and generated at runtime
// from the instrument (`string_master_s1`…), so those ids are not listed here.
export type FixedBadgeId =
  | 'perfect_session' | 'speed_demon' | 'flawless_sprint' | 'on_fire' | 'comeback'
  | 'every_string'
  | 'string_master_all' | 'week_warrior' | 'dedicated' | 'total_reps'
  | 'sharpshooter' | 'most_improved' | 'both_ends' | 'quick_read' | 'doubling_up'
  | 'multi_instrumentalist'
  | 'full_neck' | 'low_end'
  | 'admin';
export type BadgeId = FixedBadgeId | `string_master_s${number}`;

export type BadgeKind = 'session' | 'lifetime' | 'role';

// Bronze/Silver/Gold are levels of one achievement, not a fixed badge "type" —
// a Session family can reach Gold exactly like a Lifetime one. Diamond and up
// exist only on the handful of "flagship" lifetime families big enough to
// carry a player's full first year (see `TOP_TIER_MIN_DAYS` below) — most
// families stop at Platinum or even Gold.
export type Tier =
  | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master'
  | 'legendary1' | 'legendary2' | 'legendary3' | 'legendary4';
export const TIERS: readonly Tier[] = [
  'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master',
  'legendary1', 'legendary2', 'legendary3', 'legendary4',
];
export const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
  diamond: 'Diamond', master: 'Master',
  legendary1: 'Legendary I', legendary2: 'Legendary II',
  legendary3: 'Legendary III', legendary4: 'Legendary IV',
};

export interface LevelDef {
  tier: Tier;
  blurb: string; // this tier's exact earning condition
}

export interface BadgeDef {
  id: BadgeId;
  name: string;              // stable family display name, independent of tier
  kind: BadgeKind;
  instrumentScoped: boolean; // true → stored/earned per instrument
  onlyInstrument?: InstrumentId; // badge exists only for this instrument
  levels: LevelDef[];        // ordered Bronze→Platinum; empty for role badges
  blurb?: string;            // role badges only (levels is empty for them)
}

function tierIndex(t: Tier): number {
  return TIERS.indexOf(t);
}

export function tierAtLeast(t: Tier | null, min: Tier): boolean {
  return t !== null && tierIndex(t) >= tierIndex(min);
}

// ── Definitions ───────────────────────────────────────────────────────────────
// Display order is this array's order; the per-string String Master tiles are
// spliced in just before `string_master_all` by `badgeList`.
export const FIXED_BADGES: readonly BadgeDef[] = [
  // Session
  {
    id: 'perfect_session', name: 'Perfect Session', kind: 'session', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Answer 10+ questions in a round with no mistakes at all.' },
      { tier: 'silver', blurb: '25+ questions in a round, still zero mistakes.' },
      { tier: 'gold', blurb: '50+ questions in a round, still zero mistakes — a full clean run.' },
    ],
  },
  {
    id: 'speed_demon', name: 'Speed Demon', kind: 'session', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Get 10+ correct answers in a round, at least 8 of them under 1.5s.' },
      { tier: 'silver', blurb: '20+ correct answers, at least 16 of them under 1.5s.' },
      { tier: 'gold', blurb: '40+ correct answers, at least 32 of them under 1.2s.' },
    ],
  },
  {
    id: 'flawless_sprint', name: 'Flawless Sprint', kind: 'session', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Finish a whole round at 90% accuracy or better.' },
      { tier: 'silver', blurb: 'Finish a whole round at 95% accuracy or better.' },
      { tier: 'gold', blurb: 'Finish a whole round at 100% accuracy.' },
    ],
  },
  {
    id: 'on_fire', name: 'On Fire', kind: 'session', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Reach a streak of 15 in a single round.' },
      { tier: 'silver', blurb: 'Reach a streak of 20 in a single round.' },
      { tier: 'gold', blurb: 'Reach a streak of 30 in a single round.' },
    ],
  },
  {
    id: 'comeback', name: 'Comeback', kind: 'session', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Miss 3+ of your first 20 questions, then answer the next 8 in a row correctly.' },
      { tier: 'silver', blurb: 'Miss 5+ of your first 20 questions, then answer the next 12 in a row correctly.' },
      { tier: 'gold', blurb: 'Miss 8+ of your first 20 questions, then answer the next 18 in a row correctly.' },
    ],
  },
  {
    id: 'every_string', name: 'Every String', kind: 'session', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Finish a round that visited every string: 2x that many questions, 90% accuracy.' },
      { tier: 'silver', blurb: 'Visited every string: 4x that many questions, 90% accuracy.' },
      { tier: 'gold', blurb: 'Visited every string: 6x that many questions, 95% accuracy.' },
    ],
  },
  // Per-instrument (fretboard-shape)
  {
    id: 'string_master_all', name: 'Full String Master', kind: 'lifetime', instrumentScoped: true,
    levels: [
      { tier: 'bronze', blurb: 'Earn String Master — Bronze on every string of this instrument.' },
      { tier: 'silver', blurb: 'Earn String Master — Silver on every string.' },
      { tier: 'gold', blurb: 'Earn String Master — Gold on every string.' },
      { tier: 'platinum', blurb: 'Earn String Master — Platinum on every string.' },
      { tier: 'diamond', blurb: 'Earn String Master — Diamond on every string.' },
    ],
  },
  {
    id: 'full_neck', name: 'Neck Runner', kind: 'lifetime', instrumentScoped: true,
    levels: [
      { tier: 'bronze', blurb: 'Answer at least one question on every fret of the neck.' },
      { tier: 'silver', blurb: 'Answer at least 3 questions on every fret of the neck.' },
      { tier: 'gold', blurb: 'Answer at least 5 questions on every fret of the neck.' },
      { tier: 'platinum', blurb: 'Answer at least 10 questions on every fret, spread across 14+ practice days.' },
      { tier: 'diamond', blurb: 'Answer at least 20 questions on every fret, spread across 30+ practice days.' },
    ],
  },
  {
    id: 'both_ends', name: 'Both Ends', kind: 'lifetime', instrumentScoped: true,
    levels: [
      { tier: 'bronze', blurb: 'Answer 40+ questions above the 12th fret at 85% accuracy or better.' },
      { tier: 'silver', blurb: '100+ questions above the 12th fret at 88% accuracy or better.' },
      { tier: 'gold', blurb: '200+ questions above the 12th fret at 92% accuracy or better.' },
      { tier: 'platinum', blurb: '400+ questions above the 12th fret at 93% accuracy or better, over 14+ practice days.' },
      { tier: 'diamond', blurb: '800+ questions above the 12th fret at 94% accuracy or better, over 30+ practice days.' },
    ],
  },
  {
    id: 'low_end', name: 'Low End', kind: 'lifetime', instrumentScoped: true, onlyInstrument: 'bass',
    levels: [
      { tier: 'bronze', blurb: 'Answer 40+ questions on the bass low-E string at 90% accuracy or better.' },
      { tier: 'silver', blurb: '100+ questions on the low-E string at 93% accuracy or better.' },
      { tier: 'gold', blurb: '200+ questions on the low-E string at 96% accuracy or better.' },
      { tier: 'platinum', blurb: '400+ questions on the low-E string at 97% accuracy or better, over 14+ practice days.' },
      { tier: 'diamond', blurb: '800+ questions on the low-E string at 98% accuracy or better, over 30+ practice days.' },
    ],
  },
  // Global player
  {
    id: 'week_warrior', name: 'Week Warrior', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Practise on 5 separate days within a single 7-day window.' },
      { tier: 'silver', blurb: '6 separate days within a single 7-day window.' },
      { tier: 'gold', blurb: 'All 7 days within a single 7-day window — a perfect week.' },
    ],
  },
  {
    id: 'dedicated', name: 'Dedicated', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Build a run of 7 consecutive practice days.' },
      { tier: 'silver', blurb: '14 consecutive practice days.' },
      { tier: 'gold', blurb: '30 consecutive practice days.' },
      { tier: 'platinum', blurb: '60 consecutive practice days.' },
      { tier: 'diamond', blurb: '90 consecutive practice days.' },
      { tier: 'master', blurb: '120 consecutive practice days.' },
      { tier: 'legendary1', blurb: '180 consecutive practice days.' },
      { tier: 'legendary2', blurb: '250 consecutive practice days.' },
      { tier: 'legendary3', blurb: '300 consecutive practice days.' },
      { tier: 'legendary4', blurb: '365 consecutive practice days — a full year, every day.' },
    ],
  },
  {
    id: 'total_reps', name: 'Total Reps', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Answer 100 questions all-time, across every instrument.' },
      { tier: 'silver', blurb: '250 questions all-time.' },
      { tier: 'gold', blurb: '500 questions all-time.' },
      { tier: 'platinum', blurb: '1,000 questions all-time.' },
      { tier: 'diamond', blurb: '2,500 questions all-time, spread across 20+ practice days.' },
      { tier: 'master', blurb: '5,000 questions all-time, spread across 40+ practice days.' },
      { tier: 'legendary1', blurb: '10,000 questions all-time, spread across 70+ practice days.' },
      { tier: 'legendary2', blurb: '20,000 questions all-time, spread across 110+ practice days.' },
      { tier: 'legendary3', blurb: '35,000 questions all-time, spread across 160+ practice days.' },
      { tier: 'legendary4', blurb: '50,000 questions all-time, spread across 220+ practice days.' },
    ],
  },
  {
    id: 'sharpshooter', name: 'Sharpshooter', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Hold 85% accuracy over at least 200 questions, across every instrument.' },
      { tier: 'silver', blurb: '88% accuracy over at least 500 questions.' },
      { tier: 'gold', blurb: '92% accuracy over at least 1,000 questions.' },
      { tier: 'platinum', blurb: '93% accuracy over at least 2,500 questions, spread across 30+ practice days.' },
      { tier: 'diamond', blurb: '94% accuracy over at least 5,000 questions, spread across 60+ practice days.' },
    ],
  },
  {
    id: 'quick_read', name: 'Quick Read', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Hold an average answer time under 2.0s over 200+ questions.' },
      { tier: 'silver', blurb: 'Under 1.6s over 500+ questions.' },
      { tier: 'gold', blurb: 'Under 1.3s over 1,000+ questions.' },
      { tier: 'platinum', blurb: 'Under 1.15s over 2,500+ questions, spread across 30+ practice days.' },
      { tier: 'diamond', blurb: 'Under 1.05s over 5,000+ questions, spread across 60+ practice days.' },
    ],
  },
  {
    id: 'most_improved', name: 'Most Improved', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Over 10+ practice days, lift your accuracy by 20 points from your first days to your latest.' },
      { tier: 'silver', blurb: 'Over 15+ practice days, lift your accuracy by 30 points.' },
      { tier: 'gold', blurb: 'Over 20+ practice days, lift your accuracy by 40 points.' },
    ],
  },
  {
    id: 'doubling_up', name: 'Doubling Up', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Earn String Master on every string of both guitar and bass.' },
      { tier: 'silver', blurb: 'Earn Full String Master — Silver on both guitar and bass.' },
      { tier: 'gold', blurb: 'Earn Full String Master — Gold and Neck Runner — Gold on both guitar and bass.' },
      { tier: 'platinum', blurb: 'Earn Full String Master — Platinum and Neck Runner — Platinum on both guitar and bass.' },
      { tier: 'diamond', blurb: 'Earn Full String Master — Diamond and Neck Runner — Diamond on both guitar and bass.' },
    ],
  },
  {
    id: 'multi_instrumentalist', name: 'Multi-Instrumentalist', kind: 'lifetime', instrumentScoped: false,
    levels: [
      { tier: 'bronze', blurb: 'Earn Full String Master — Silver on 2 different instruments.' },
      { tier: 'silver', blurb: 'Earn Full String Master — Silver on 3 different instruments.' },
      { tier: 'gold', blurb: 'Earn Full String Master — Gold on 4 different instruments.' },
      { tier: 'platinum', blurb: 'Earn Full String Master — Gold on all 5 instruments.' },
      { tier: 'diamond', blurb: 'Earn Full String Master — Platinum on all 5 instruments.' },
    ],
  },
  // Role
  {
    id: 'admin', name: 'Admin', kind: 'role', instrumentScoped: false, levels: [],
    blurb: 'Granted to app administrators — read every Feedback board post, not just your own.',
  },
];

export function stringMasterBadges(instrument: InstrumentConfig): BadgeDef[] {
  return Array.from({ length: instrument.stringCount }, (_, i) => {
    const n = i + 1;
    const label = instrument.stringLabels[n] ?? `String ${n}`;
    return {
      id: `string_master_s${n}` as BadgeId,
      name: `String Master · ${label}`,
      kind: 'lifetime' as const,
      instrumentScoped: true,
      levels: [
        { tier: 'bronze' as const, blurb: `Answer 40+ questions on ${label} at 90% accuracy or better.` },
        { tier: 'silver' as const, blurb: `100+ questions on ${label} at 92% accuracy or better.` },
        { tier: 'gold' as const, blurb: `200+ questions on ${label} at 95% accuracy or better.` },
        { tier: 'platinum' as const, blurb: `400+ questions on ${label} at 96% accuracy or better, over 14+ practice days.` },
        { tier: 'diamond' as const, blurb: `800+ questions on ${label} at 97% accuracy or better, over 30+ practice days.` },
      ],
    };
  });
}

// The full ordered badge set for one instrument: per-string String Master
// tiles inserted before `string_master_all`.
export function badgeList(instrument: InstrumentConfig): BadgeDef[] {
  const out: BadgeDef[] = [];
  for (const def of FIXED_BADGES) {
    if (def.onlyInstrument && def.onlyInstrument !== instrument.id) continue;
    if (def.id === 'string_master_all') {
      out.push(...stringMasterBadges(instrument));
    }
    out.push(def);
  }
  return out;
}

export function badgeDef(id: BadgeId, instrument: InstrumentConfig): BadgeDef | undefined {
  return badgeList(instrument).find(b => b.id === id);
}

// ── Store ────────────────────────────────────────────────────────────────────
export interface EarnedBadge { earnedAt: string; } // ISO
export type BadgeStore = Record<string, EarnedBadge>;

const STORE_KEY = 'badges';

function isInstrumentScoped(id: BadgeId): boolean {
  return id.startsWith('string_master_s')
    || id === 'string_master_all'
    || id === 'full_neck'
    || id === 'both_ends'
    || id === 'low_end';
}

// Level 1 (Bronze) keeps the exact key shape the pre-levels system used, so
// every badge already earned transfers untouched as "Bronze earned" — no
// migration. Silver/Gold/Platinum append `::{tier}` to that same base.
export function storeKey(id: BadgeId, instrumentId?: string, tier: Tier = 'bronze'): string {
  const base = isInstrumentScoped(id) && instrumentId ? `${id}@${instrumentId}` : id;
  return tier === 'bronze' ? base : `${base}::${tier}`;
}

// Pure, store-agnostic version of `earnedTier` — reads an arbitrary
// `BadgeStore` (e.g. another player's, fetched from `user_badges`) instead of
// this device's localStorage copy.
export function earnedTierFrom(store: BadgeStore, id: BadgeId, instrumentId?: string): Tier | null {
  let best: Tier | null = null;
  for (const t of TIERS) {
    if (storeKey(id, instrumentId, t) in store) best = t;
  }
  return best;
}

// Pure, store-agnostic version of `earnedAt`.
export function earnedAtFrom(store: BadgeStore, id: BadgeId, instrumentId?: string, tier: Tier = 'bronze'): string | null {
  return store[storeKey(id, instrumentId, tier)]?.earnedAt ?? null;
}

export function loadBadges(): BadgeStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as BadgeStore) : {};
  } catch {
    return {};
  }
}

function saveBadges(store: BadgeStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* localStorage unavailable — best-effort only */
  }
  // Write-through for signed-in users (debounced, no-op for guests / offline).
  cloudPushBadges();
}

export function isEarned(id: BadgeId, instrumentId?: string, tier: Tier = 'bronze'): boolean {
  return storeKey(id, instrumentId, tier) in loadBadges();
}

export function earnedAt(id: BadgeId, instrumentId?: string, tier: Tier = 'bronze'): string | null {
  return loadBadges()[storeKey(id, instrumentId, tier)]?.earnedAt ?? null;
}

// Writes `earnedAt` only on the first earn; returns true only when NEWLY
// earned, so a "new badge" celebration never repeats.
export function awardBadge(id: BadgeId, instrumentId?: string, tier: Tier = 'bronze'): boolean {
  const store = loadBadges();
  const k = storeKey(id, instrumentId, tier);
  if (store[k]) return false;
  store[k] = { earnedAt: new Date().toISOString() };
  saveBadges(store);
  return true;
}

// The highest tier actually persisted for a family, or null if none yet.
export function earnedTier(id: BadgeId, instrumentId?: string): Tier | null {
  let best: Tier | null = null;
  for (const t of TIERS) {
    if (isEarned(id, instrumentId, t)) best = t;
  }
  return best;
}

// Awards every level up to and including `reachedTier` (idempotent — already-
// earned levels are skipped), so a retroactive jump straight to Gold still
// stamps Bronze/Silver too. Returns the tiers newly awarded this call, in
// ascending order — the caller celebrates only the last (highest) one.
export function awardFamilyUpTo(
  id: BadgeId,
  instrumentId: string | undefined,
  reachedTier: Tier,
  familyLevels: readonly LevelDef[],
): Tier[] {
  const newly: Tier[] = [];
  for (const level of familyLevels) {
    if (tierIndex(level.tier) > tierIndex(reachedTier)) break;
    if (awardBadge(id, instrumentId, level.tier)) newly.push(level.tier);
  }
  return newly;
}

// ── Admin test overrides ─────────────────────────────────────────────────────
// So an admin can exercise the Badges wall without grinding the real
// conditions. `resetBadgeFamily` wipes a family's stored tiers across every
// instrument scope; `grantNextTier` stamps the next rung regardless of whether
// it was earned. A session family stays reset (those only accrue at game-end);
// a lifetime family re-derives from play history the next time the Badges
// screen evaluates it, so a reset there only sticks if history is also cleared.
// For signed-in admins the reset also records a cloud tombstone (`badgeSync`)
// so it propagates to their other devices instead of being resurrected by the
// next sync.

/** Remove every stored tier of one badge family, across all instrument scopes. */
export function resetBadgeFamily(id: BadgeId): void {
  const store = loadBadges();
  let changed = false;
  for (const key of Object.keys(store)) {
    const base = key.includes('::') ? key.slice(0, key.indexOf('::')) : key;
    if (base === id || base.startsWith(`${id}@`)) {
      delete store[key];
      changed = true;
    }
  }
  if (changed) {
    retireBadgeFamily(id);
    saveBadges(store);
  }
}

/**
 * Stamp the next not-yet-earned tier of a family (climbing Bronze→…→Platinum),
 * or the bare badge for a role badge with no tiers. Returns the tier granted,
 * or null when the family is already at its top rung.
 */
export function grantNextTier(
  id: BadgeId,
  instrumentId: string | undefined,
  familyLevels: readonly LevelDef[],
): Tier | null {
  if (familyLevels.length === 0) {
    return awardBadge(id, instrumentId) ? 'bronze' : null;
  }
  const current = earnedTier(id, instrumentId);
  const nextIdx = current === null ? 0 : tierIndex(current) + 1;
  const next = familyLevels[nextIdx]?.tier;
  if (!next) return null;
  awardBadge(id, instrumentId, next);
  return next;
}

// ── Evaluation ───────────────────────────────────────────────────────────────
export interface SessionSnapshot {
  questionsAnswered: number;
  maxQuestions: number;     // whole run total (Auto Advance stages summed)
  longestStreak: number;
  entries: HistoryEntry[];  // this round's rows, in answer order
  instrument: InstrumentConfig;
}

export interface LifetimeSnapshot {
  /** History for the current instrument only — feeds the fretboard-shape badges. */
  instrumentEntries: HistoryEntry[];
  /** History across every instrument — feeds the player-progress badges. */
  allEntries: HistoryEntry[];
  instrument: InstrumentConfig;
}

function accuracyOf(entries: HistoryEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.filter(e => e.correct === true).length / entries.length;
}

function isMiss(e: HistoryEntry): boolean {
  return e.correct === false || e.skipped;
}

// The "rough start, strong finish" shape, bounded so it stays meaningful
// regardless of how long an Auto Advance chain runs: misses are only counted
// in a fixed early window (not "the first half of everything"), and the
// recovery streak starts immediately after that window's last miss — wherever
// it lands — rather than requiring it to reach all the way to the round's end.
function comebackRecovery(entries: HistoryEntry[], windowSize = 20): { misses: number; streak: number } {
  const window = entries.slice(0, Math.min(windowSize, entries.length));
  const misses = window.filter(isMiss).length;
  let lastMissIdx = -1;
  for (let i = window.length - 1; i >= 0; i--) {
    if (isMiss(window[i])) { lastMissIdx = i; break; }
  }
  if (lastMissIdx < 0) return { misses, streak: 0 };
  let streak = 0;
  for (let i = lastMissIdx + 1; i < entries.length; i++) {
    if (entries[i].correct === true) streak++;
    else break;
  }
  return { misses, streak };
}

export function evaluateSession(s: SessionSnapshot): Partial<Record<BadgeId, Tier>> {
  const { entries, questionsAnswered, longestStreak, maxQuestions, instrument } = s;
  const out: Partial<Record<BadgeId, Tier>> = {};
  const correct = entries.filter(e => e.correct === true);

  if (entries.length > 0 && entries.every(e => e.correct === true)) {
    if (questionsAnswered >= 50) out.perfect_session = 'gold';
    else if (questionsAnswered >= 25) out.perfect_session = 'silver';
    else if (questionsAnswered >= 10) out.perfect_session = 'bronze';
  }

  const fast15 = correct.filter(e => e.seconds <= 1.5).length;
  const fast12 = correct.filter(e => e.seconds <= 1.2).length;
  if (correct.length >= 40 && fast12 >= 32) out.speed_demon = 'gold';
  else if (correct.length >= 20 && fast15 >= 16) out.speed_demon = 'silver';
  else if (correct.length >= 10 && fast15 >= 8) out.speed_demon = 'bronze';

  if (maxQuestions > 0 && questionsAnswered >= maxQuestions) {
    const acc = accuracyOf(entries);
    if (acc >= 1) out.flawless_sprint = 'gold';
    else if (acc >= 0.95) out.flawless_sprint = 'silver';
    else if (acc >= 0.9) out.flawless_sprint = 'bronze';
  }

  if (longestStreak >= 30) out.on_fire = 'gold';
  else if (longestStreak >= 20) out.on_fire = 'silver';
  else if (longestStreak >= 15) out.on_fire = 'bronze';

  const { misses: slumpMisses, streak: recoveryStreak } = comebackRecovery(entries);
  if (slumpMisses >= 8 && recoveryStreak >= 18) out.comeback = 'gold';
  else if (slumpMisses >= 5 && recoveryStreak >= 12) out.comeback = 'silver';
  else if (slumpMisses >= 3 && recoveryStreak >= 8) out.comeback = 'bronze';

  // A clean multi-string round that touched every string of the instrument —
  // accuracy is over the whole round's entries, same as the other axes here.
  const stringsSeen = new Set(entries.filter(e => e.correct !== null).map(e => e.string));
  if (instrument.stringCount > 1 && stringsSeen.size === instrument.stringCount) {
    const acc = accuracyOf(entries);
    if (questionsAnswered >= instrument.stringCount * 6 && acc >= 0.95) out.every_string = 'gold';
    else if (questionsAnswered >= instrument.stringCount * 4 && acc >= 0.9) out.every_string = 'silver';
    else if (questionsAnswered >= instrument.stringCount * 2 && acc >= 0.9) out.every_string = 'bronze';
  }

  return out;
}

// Distinct practice dates (YYYY-MM-DD), ascending — from rows that carry a
// `createdAt` (older rows can't be placed on the timeline).
function practiceDates(entries: HistoryEntry[]): string[] {
  return dailyStats(entries).map(d => d.date);
}

// Largest number of distinct dates falling inside any `windowDays`-long window.
function maxDatesInWindow(dates: string[], windowDays = 7): number {
  const ms = windowDays * 86_400_000;
  let best = 0;
  for (let i = 0; i < dates.length; i++) {
    const start = Date.parse(`${dates[i]}T00:00:00Z`);
    let count = 0;
    for (let j = i; j < dates.length; j++) {
      if (Date.parse(`${dates[j]}T00:00:00Z`) - start < ms) count++;
      else break;
    }
    if (count > best) best = count;
  }
  return best;
}

function stringStats(entries: HistoryEntry[], stringNum: number): { count: number; accuracy: number } {
  const rows = entries.filter(e => e.string === stringNum);
  return { count: rows.length, accuracy: accuracyOf(rows) };
}

// Per-fret answer counts, current instrument only — Neck Runner's tiers are
// "visited this fret N times", not just "visited once".
function fretVisitCounts(entries: HistoryEntry[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const e of entries) m.set(e.fret, (m.get(e.fret) ?? 0) + 1);
  return m;
}

function everyFretAtLeast(visits: Map<number, number>, instrument: InstrumentConfig, minVisits: number): boolean {
  for (let f = 0; f <= instrument.maxFret; f++) {
    if ((visits.get(f) ?? 0) < minVisits) return false;
  }
  return true;
}

function meanAccuracy(days: { accuracy: number }[]): number {
  if (days.length === 0) return 0;
  return days.reduce((s, d) => s + d.accuracy, 0) / days.length;
}

// Total distinct calendar days with any recorded practice — the "can't be
// grinded in one sitting" floor the top 1-2 tiers of the big count-based
// families require on top of their raw threshold (see badges.ts module doc).
function distinctPracticeDays(entries: HistoryEntry[]): number {
  return dailyStats(entries).length;
}

// Walks a `[count, minDays?]` threshold ladder (ascending) and returns the
// highest tier whose count (and, where given, minimum distinct practice
// days) is met. `tiers` must be given weakest-first, same order as `TIERS`.
function highestTierMet(
  count: number,
  days: number,
  ladder: readonly [Tier, number, number?][],
): Tier | null {
  let best: Tier | null = null;
  for (const [tier, minCount, minDays] of ladder) {
    if (count >= minCount && (minDays === undefined || days >= minDays)) best = tier;
  }
  return best;
}

// Same as `highestTierMet` but also gates on accuracy — for String Master,
// Both Ends, Low End, Sharpshooter.
function highestTierMetAcc(
  count: number,
  accuracy: number,
  days: number,
  ladder: readonly [Tier, number, number, number?][],
): Tier | null {
  let best: Tier | null = null;
  for (const [tier, minCount, minAcc, minDays] of ladder) {
    if (count >= minCount && accuracy >= minAcc && (minDays === undefined || days >= minDays)) best = tier;
  }
  return best;
}

// Same shape but "lower is better" (average answer time) — for Quick Read.
function highestTierMetUnder(
  count: number,
  seconds: number,
  days: number,
  ladder: readonly [Tier, number, number, number?][],
): Tier | null {
  let best: Tier | null = null;
  for (const [tier, minCount, maxSeconds, minDays] of ladder) {
    if (count >= minCount && seconds > 0 && seconds < maxSeconds && (minDays === undefined || days >= minDays)) best = tier;
  }
  return best;
}

// Threshold ladders — see the module doc for why the top 1-2 rungs of the
// big count-based families also require a minimum spread of distinct
// practice days: without it a single long binge session/week could clear
// them, defeating the point of a family meant to take months.
const STRING_MASTER_LADDER: readonly [Tier, number, number, number?][] = [
  ['bronze', 40, 0.90], ['silver', 100, 0.92], ['gold', 200, 0.95],
  ['platinum', 400, 0.96, 14], ['diamond', 800, 0.97, 30],
];
const NECK_RUNNER_LADDER: readonly [Tier, number, number?][] = [
  ['bronze', 1], ['silver', 3], ['gold', 5], ['platinum', 10, 14], ['diamond', 20, 30],
];
const BOTH_ENDS_LADDER: readonly [Tier, number, number, number?][] = [
  ['bronze', 40, 0.85], ['silver', 100, 0.88], ['gold', 200, 0.92],
  ['platinum', 400, 0.93, 14], ['diamond', 800, 0.94, 30],
];
const LOW_END_LADDER: readonly [Tier, number, number, number?][] = [
  ['bronze', 40, 0.90], ['silver', 100, 0.93], ['gold', 200, 0.96],
  ['platinum', 400, 0.97, 14], ['diamond', 800, 0.98, 30],
];
const TOTAL_REPS_LADDER: readonly [Tier, number, number?][] = [
  ['bronze', 100], ['silver', 250], ['gold', 500], ['platinum', 1000],
  ['diamond', 2500, 20], ['master', 5000, 40], ['legendary1', 10000, 70],
  ['legendary2', 20000, 110], ['legendary3', 35000, 160], ['legendary4', 50000, 220],
];
const DEDICATED_LADDER: readonly number[] = [7, 14, 30, 60, 90, 120, 180, 250, 300, 365];
const SHARPSHOOTER_LADDER: readonly [Tier, number, number, number?][] = [
  ['bronze', 200, 0.85], ['silver', 500, 0.88], ['gold', 1000, 0.92],
  ['platinum', 2500, 0.93, 30], ['diamond', 5000, 0.94, 60],
];
const QUICK_READ_LADDER: readonly [Tier, number, number, number?][] = [
  ['bronze', 200, 2.0], ['silver', 500, 1.6], ['gold', 1000, 1.3],
  ['platinum', 2500, 1.15, 30], ['diamond', 5000, 1.05, 60],
];

export function evaluateLifetime(l: LifetimeSnapshot): Partial<Record<BadgeId, Tier>> {
  const { instrumentEntries, allEntries, instrument } = l;
  const out: Partial<Record<BadgeId, Tier>> = {};
  const instrumentDays = distinctPracticeDays(instrumentEntries);

  // ── Fretboard-shape badges — current instrument only ──────────────────────
  const stringTiers: (Tier | null)[] = [];
  for (let n = 1; n <= instrument.stringCount; n++) {
    const { count, accuracy } = stringStats(instrumentEntries, n);
    const stringDays = distinctPracticeDays(instrumentEntries.filter(e => e.string === n));
    const tier = highestTierMetAcc(count, accuracy, stringDays, STRING_MASTER_LADDER);
    stringTiers.push(tier);
    if (tier) out[`string_master_s${n}` as BadgeId] = tier;
  }
  // Full String Master is derived, not its own numeric threshold: its tier is
  // the weakest-linked string's tier, so "Gold" only means every string is Gold.
  if (stringTiers.length > 0 && stringTiers.every((t): t is Tier => t !== null)) {
    out.string_master_all = stringTiers.reduce((min, t) => (tierIndex(t) < tierIndex(min) ? t : min));
  }

  const visits = fretVisitCounts(instrumentEntries);
  if (instrumentEntries.length > 0) {
    let neckTier: Tier | null = null;
    for (const [tier, minVisits, minDays] of NECK_RUNNER_LADDER) {
      if (everyFretAtLeast(visits, instrument, minVisits) && (minDays === undefined || instrumentDays >= minDays)) {
        neckTier = tier;
      }
    }
    if (neckTier) out.full_neck = neckTier;
  }

  const upper = instrumentEntries.filter(e => e.fret >= 12);
  const upperDays = distinctPracticeDays(upper);
  const bothEndsTier = highestTierMetAcc(upper.length, accuracyOf(upper), upperDays, BOTH_ENDS_LADDER);
  if (bothEndsTier) out.both_ends = bothEndsTier;

  if (instrument.id === 'bass') {
    const lowE = stringStats(instrumentEntries, 4); // bass string 4 = low E
    const lowEDays = distinctPracticeDays(instrumentEntries.filter(e => e.string === 4));
    const lowEndTier = highestTierMetAcc(lowE.count, lowE.accuracy, lowEDays, LOW_END_LADDER);
    if (lowEndTier) out.low_end = lowEndTier;
  }

  // ── Player-progress badges — every instrument's history combined ──────────
  const days = dailyStats(allEntries);
  const streak = practiceStreak(days);
  const totals = lifetimeTotals(allEntries, days);
  const bestWindow = maxDatesInWindow(practiceDates(allEntries));
  const totalDays = days.length;

  if (bestWindow >= 7) out.week_warrior = 'gold';
  else if (bestWindow >= 6) out.week_warrior = 'silver';
  else if (bestWindow >= 5) out.week_warrior = 'bronze';

  for (let i = 0; i < DEDICATED_LADDER.length; i++) {
    if (streak.longest >= DEDICATED_LADDER[i]) out.dedicated = TIERS[i];
  }

  const totalRepsTier = highestTierMet(totals.totalQuestions, totalDays, TOTAL_REPS_LADDER);
  if (totalRepsTier) out.total_reps = totalRepsTier;

  const sharpshooterTier = highestTierMetAcc(totals.totalQuestions, totals.accuracy, totalDays, SHARPSHOOTER_LADDER);
  if (sharpshooterTier) out.sharpshooter = sharpshooterTier;

  const quickReadTier = highestTierMetUnder(totals.totalQuestions, totals.avgSeconds, totalDays, QUICK_READ_LADDER);
  if (quickReadTier) out.quick_read = quickReadTier;

  if (days.length >= 10) {
    const gain = meanAccuracy(days.slice(-5)) - meanAccuracy(days.slice(0, 5));
    if (days.length >= 20 && gain >= 0.4) out.most_improved = 'gold';
    else if (days.length >= 15 && gain >= 0.3) out.most_improved = 'silver';
    else if (gain >= 0.2) out.most_improved = 'bronze';
  }

  // Cross-instrument capstones — read only what's already persisted for each
  // instrument (not `out`, which only reflects the current one), same as the
  // pre-levels version: completing another instrument's Full String Master
  // unlocks these the next time badges are evaluated, not mid-pass.
  const gFSM = earnedTier('string_master_all', 'guitar');
  const bFSM = earnedTier('string_master_all', 'bass');
  if (gFSM && bFSM) {
    const gNeck = earnedTier('full_neck', 'guitar');
    const bNeck = earnedTier('full_neck', 'bass');
    let tier: Tier = 'bronze';
    for (const t of ['silver', 'gold', 'platinum', 'diamond'] as const) {
      if (
        tierAtLeast(gFSM, t) && tierAtLeast(bFSM, t)
        && (t === 'silver' || (tierAtLeast(gNeck, t) && tierAtLeast(bNeck, t)))
      ) {
        tier = t;
      }
    }
    out.doubling_up = tier;
  }

  const allInstrumentIds = Object.keys(INSTRUMENTS) as InstrumentId[];
  const fsmTiers = allInstrumentIds.map(id => earnedTier('string_master_all', id));
  const atLeast = (t: Tier) => fsmTiers.filter(ft => tierAtLeast(ft, t)).length;
  let multiTier: Tier | null = null;
  if (atLeast('silver') >= 2) multiTier = 'bronze';
  if (atLeast('silver') >= 3) multiTier = 'silver';
  if (atLeast('gold') >= 4) multiTier = 'gold';
  if (atLeast('gold') >= 5) multiTier = 'platinum';
  if (atLeast('platinum') >= 5) multiTier = 'diamond';
  if (multiTier) out.multi_instrumentalist = multiTier;

  return out;
}

// Pulls the raw-count target for `nextTier` out of a `[tier, count, ...]`
// ladder (the shape shared by every `*_LADDER` above) — used to keep the
// progress bar's target in lockstep with the actual earning ladder.
function ladderCountTarget(nextTier: Tier, ladder: readonly (readonly [Tier, number, ...unknown[]])[]): number {
  return ladder.find(row => row[0] === nextTier)?.[1] ?? 0;
}

// Current / target for a locked tile's thin progress bar, aimed at the given
// (next unearned) tier. Null → no bar for this badge. Note this only tracks
// the raw-count axis — the day-spread floor some top tiers also require
// (see the `*_LADDER` tables) isn't shown on this bar, only in the blurb.
export function badgeProgress(
  id: BadgeId,
  l: LifetimeSnapshot,
  nextTier: Tier,
): { current: number; target: number } | null {
  const { instrumentEntries, allEntries, instrument } = l;

  if (id.startsWith('string_master_s')) {
    const n = Number(id.slice('string_master_s'.length));
    const target = ladderCountTarget(nextTier, STRING_MASTER_LADDER);
    return { current: Math.min(stringStats(instrumentEntries, n).count, target), target };
  }
  if (id === 'string_master_all') {
    let count = 0;
    for (let n = 1; n <= instrument.stringCount; n++) {
      if (tierAtLeast(earnedTier(`string_master_s${n}` as BadgeId, instrument.id), nextTier)) count++;
    }
    return { current: count, target: instrument.stringCount };
  }
  if (id === 'full_neck') {
    const visits = fretVisitCounts(instrumentEntries);
    const minVisits = NECK_RUNNER_LADDER.find(row => row[0] === nextTier)?.[1] ?? 1;
    let seen = 0;
    for (let f = 0; f <= instrument.maxFret; f++) if ((visits.get(f) ?? 0) >= minVisits) seen++;
    return { current: seen, target: instrument.maxFret + 1 };
  }
  if (id === 'both_ends') {
    const target = ladderCountTarget(nextTier, BOTH_ENDS_LADDER);
    return { current: Math.min(instrumentEntries.filter(e => e.fret >= 12).length, target), target };
  }
  if (id === 'low_end') {
    const target = ladderCountTarget(nextTier, LOW_END_LADDER);
    return { current: Math.min(stringStats(instrumentEntries, 4).count, target), target };
  }
  if (id === 'doubling_up') {
    const gates = nextTier === 'bronze'
      ? [
          tierAtLeast(earnedTier('string_master_all', 'guitar'), 'bronze'),
          tierAtLeast(earnedTier('string_master_all', 'bass'), 'bronze'),
        ]
      : [
          tierAtLeast(earnedTier('string_master_all', 'guitar'), nextTier),
          tierAtLeast(earnedTier('string_master_all', 'bass'), nextTier),
          tierAtLeast(earnedTier('full_neck', 'guitar'), nextTier),
          tierAtLeast(earnedTier('full_neck', 'bass'), nextTier),
        ];
    return { current: gates.filter(Boolean).length, target: gates.length };
  }
  if (id === 'multi_instrumentalist') {
    const allInstrumentIds = Object.keys(INSTRUMENTS) as InstrumentId[];
    const gateTier: Tier = nextTier === 'bronze' || nextTier === 'silver' ? 'silver' : 'gold';
    const target = nextTier === 'bronze' ? 2 : nextTier === 'silver' ? 3 : nextTier === 'gold' ? 4 : 5;
    const count = allInstrumentIds.filter(id2 => tierAtLeast(earnedTier('string_master_all', id2), gateTier)).length;
    return { current: Math.min(count, target), target };
  }

  const days = dailyStats(allEntries);
  const totals = lifetimeTotals(allEntries, days);
  switch (id) {
    case 'week_warrior': {
      const target = nextTier === 'gold' ? 7 : nextTier === 'silver' ? 6 : 5;
      return { current: Math.min(maxDatesInWindow(days.map(d => d.date)), target), target };
    }
    case 'dedicated': {
      const target = DEDICATED_LADDER[tierIndex(nextTier)] ?? DEDICATED_LADDER[0];
      return { current: Math.min(practiceStreak(days).longest, target), target };
    }
    case 'total_reps': {
      const target = ladderCountTarget(nextTier, TOTAL_REPS_LADDER);
      return { current: Math.min(totals.totalQuestions, target), target };
    }
    case 'sharpshooter': {
      const target = ladderCountTarget(nextTier, SHARPSHOOTER_LADDER);
      return { current: Math.min(totals.totalQuestions, target), target };
    }
    case 'quick_read': {
      const target = ladderCountTarget(nextTier, QUICK_READ_LADDER);
      return { current: Math.min(totals.totalQuestions, target), target };
    }
    default:
      return null;
  }
}
