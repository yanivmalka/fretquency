// ── Fret of the Day / Challenge a friend — deterministic candidate sets ────
//
// Both features need the same thing: a `DrillPosition[]` that is 100%
// reproducible from a short string key, with no server round-trip. "Fret of
// the Day" derives that key from today's date (+ instrument) so every
// player in the world gets the same ~10 positions; "Challenge a friend"
// reuses the exact same generator with an explicit seed instead of a date,
// so a friend who opens the link plays the identical round.
//
// Deliberately generated against each instrument's *base* tuning/string
// count (`getInstrument`, not the player's own string-count/fret-count
// variant) — that's what makes "same for everyone" and "my friend can play
// this even on a different variant" both true. A player on an 8-string
// guitar variant still gets (and can still answer) the standard 6-string
// positions here, exactly like Practice would if they switched to the
// default variant.

import { getInstrument, type InstrumentId } from './instruments';
import type { DrillPosition } from '../drill/candidates';
import type { AccidentalMode, OrderMode } from './music';
import type { DrillConfig } from '../drill/DrillConfig';

export const CHALLENGE_POSITIONS = 10;
export const CHALLENGE_QUESTION_TIME = 8;

// Puzzle #1 is the ship date — mirrors Wordle's own epoch-counted puzzle
// number. Pure cosmetics (the "Fretquency #142" line); nothing else depends
// on it.
const EPOCH_MS = Date.UTC(2026, 9, 5);

function parseISODateUTC(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

/** Today's date as `YYYY-MM-DD`, in the player's local timezone — the same
 *  calendar day a player sees a Wordle-style daily puzzle reset at midnight
 *  local time, not UTC midnight. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 1-based puzzle number for a given date, counted from the ship date. */
export function dailyChallengeNumber(dateISO: string): number {
  const diffDays = Math.round((parseISODateUTC(dateISO) - EPOCH_MS) / 86_400_000);
  return diffDays + 1;
}

// mulberry32 — small, fast, deterministic PRNG. Not cryptographic; it only
// needs to be the same sequence for the same seed on every device.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a — turns an arbitrary string key into a 32-bit PRNG seed.
function hashSeed(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The deterministic position set for one instrument + seed key. Same
 * instrument + same key ⇒ same positions, always, on every device — that
 * invariant is what both Fret of the Day and Challenge a friend rely on.
 * Verified by `scripts/check-daily-challenge.mts`.
 */
export function buildChallengeCandidates(
  instrumentId: InstrumentId,
  seedKey: string,
  count: number = CHALLENGE_POSITIONS,
): DrillPosition[] {
  const cfg = getInstrument(instrumentId);
  const rand = mulberry32(hashSeed(`${instrumentId}:${seedKey}`));
  const minFrets = cfg.minFrets ?? [];
  const positions: DrillPosition[] = [];
  const seen = new Set<string>();
  // Generous guard: a tiny instrument (ukulele, 4 strings × 17 frets = 72
  // positions) still has far more positions than `count`, so this never
  // realistically exhausts, but a corrupt/odd config must not hang.
  let guard = 0;
  const maxGuard = count * 200;
  while (positions.length < count && guard < maxGuard) {
    guard++;
    const stringIdx0 = Math.floor(rand() * cfg.stringCount);
    const lo = minFrets[stringIdx0] ?? 0;
    const hi = cfg.maxFret;
    const fret = lo + Math.floor(rand() * (hi - lo + 1));
    const key = `${stringIdx0}:${fret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    positions.push({ string: stringIdx0 + 1, fret });
  }
  return positions;
}

/** Today's Fret of the Day positions for one instrument. */
export function buildDailyCandidates(instrumentId: InstrumentId, dateISO: string): DrillPosition[] {
  return buildChallengeCandidates(instrumentId, `day:${dateISO}`);
}

/**
 * A `DrillConfig` straight from an explicit candidate set — the one piece
 * `DrillConfig.ts` doesn't supply itself (its only existing builder,
 * `deriveDrillConfig`, starts from Practice's `DerivedSettings`, not a bare
 * position list). `accidental`/`order` only affect how note names are
 * *displayed*; they never affect which positions are asked, so two players
 * with different notation prefs still get the identical round.
 */
export function buildChallengeDrillConfig(
  instrumentId: InstrumentId,
  candidates: DrillPosition[],
  display: { accidental: AccidentalMode; order: OrderMode },
): DrillConfig {
  const cfg = getInstrument(instrumentId);
  const strings = Array.from(new Set(candidates.map((c) => c.string))).sort((a, b) => a - b);
  return {
    strings,
    primaryString: strings[0] ?? 1,
    isMulti: strings.length > 1,
    mode: 'byFret',
    fretFrom: 0,
    fretTo: cfg.maxFret,
    wholeToneOnly: false,
    dotsOnly: false,
    questionCount: candidates.length,
    timeLimit: CHALLENGE_QUESTION_TIME,
    accidental: display.accidental,
    order: display.order,
    candidates,
  };
}

/** One 🟩🟨🟥 tile per answered question, oldest first — green = correct,
 *  red = wrong/timeout. Matches the emoji-grid convention every Wordle-style
 *  daily game shares. */
export function emojiResultLine(correctFlags: boolean[]): string {
  return correctFlags.map((ok) => (ok ? '🟩' : '🟥')).join('');
}

/** "Fretquency #142 🎸 9/10 · 31s" — the line shared via `navigator.share` /
 *  clipboard. `seconds` is the whole round's elapsed time, rounded. */
export function buildShareCaption(opts: {
  dayNumber: number;
  instrumentEmoji: string;
  correct: number;
  total: number;
  seconds: number;
  emojiLine: string;
}): string {
  const { dayNumber, instrumentEmoji, correct, total, seconds, emojiLine } = opts;
  return `Fretquency #${dayNumber} ${instrumentEmoji} ${correct}/${total} · ${seconds}s\n${emojiLine}`;
}
