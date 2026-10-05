// localStorage persistence for Fret of the Day — kept apart from
// dailyChallenge.ts (the pure seed/candidate logic, exercised by
// scripts/check-daily-challenge.mts with no DOM) so that module stays
// storage-free, matching how mastery.ts stays pure while sync.ts owns
// persistence.

import type { InstrumentId } from './instruments';
import { todayISO } from './dailyChallenge';

export interface DailyChallengeResult {
  date: string;
  correct: number;
  total: number;
  seconds: number;
  /** Consecutive calendar days this instrument's challenge has been played. */
  streak: number;
}

const KEY_PREFIX = 'dailyChallenge:';

function yesterdayISO(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function loadDailyChallengeResult(instrumentId: InstrumentId): DailyChallengeResult | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + instrumentId);
    return raw ? (JSON.parse(raw) as DailyChallengeResult) : null;
  } catch {
    return null;
  }
}

/** The stored result only when it was recorded *today* — the gate that keeps
 *  the challenge to once a day per instrument. */
export function todaysDailyChallengeResult(instrumentId: InstrumentId): DailyChallengeResult | null {
  const prev = loadDailyChallengeResult(instrumentId);
  return prev && prev.date === todayISO() ? prev : null;
}

export function recordDailyChallengeResult(
  instrumentId: InstrumentId,
  outcome: { correct: number; total: number; seconds: number },
): DailyChallengeResult {
  const prev = loadDailyChallengeResult(instrumentId);
  const today = todayISO();
  const streak = prev && prev.date === yesterdayISO(today) ? prev.streak + 1 : 1;
  const result: DailyChallengeResult = { date: today, ...outcome, streak };
  try {
    localStorage.setItem(KEY_PREFIX + instrumentId, JSON.stringify(result));
  } catch {
    /* localStorage unavailable (private mode) — non-fatal, just not persisted */
  }
  return result;
}
