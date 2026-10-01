// Shared color/threshold logic for the tuner's visual feedback (wheel pointer
// + center compass), based on how far off pitch is in cents.
//
// The thresholds below are a deliberate margin of error for the human ear,
// not mathematical perfection: studies on pitch discrimination commonly put
// the "just noticeable difference" for an average listener somewhere around
// 5-10 cents (trained musicians can sometimes do better). Demanding 0 cents
// would make the tuner impossible to satisfy and wouldn't reflect anything
// audible, so "acceptable" (not just "perfect") counts as in tune.

export const PERFECT_CENTS = 5;
export const AUDIBLE_THRESHOLD_CENTS = 8; // ~ the human-ear just-noticeable-difference
export const CLEARLY_OFF_CENTS = 20;
// Beyond this, both the compass needle and the spectrum marker pin at their
// max swing/position; the cents number shown in text is still the real value.
export const MAX_DISPLAY_CENTS = 50;

export type TuningZone = 'perfect' | 'acceptable' | 'noticeable' | 'off';

export function classifyCents(cents: number): TuningZone {
  const abs = Math.abs(cents);
  if (abs <= PERFECT_CENTS) return 'perfect';
  if (abs <= AUDIBLE_THRESHOLD_CENTS) return 'acceptable';
  if (abs <= CLEARLY_OFF_CENTS) return 'noticeable';
  return 'off';
}

/** Perfect or acceptable = a human ear won't reliably notice the difference. */
export function isInTune(cents: number): boolean {
  const zone = classifyCents(cents);
  return zone === 'perfect' || zone === 'acceptable';
}

// Reuses the app's own theme tokens (src/styles/00-tokens.css) rather than
// fixed hex values, so the tuner's colors stay correct across all twelve
// season/mode palettes instead of just the one it was designed against.
// 'perfect' and 'acceptable' share --success: both count as in tune (see
// isInTune above) and a human ear can't tell them apart anyway.
export function zoneColor(zone: TuningZone): string {
  switch (zone) {
    case 'perfect': return 'var(--success)';
    case 'acceptable': return 'var(--success)';
    case 'noticeable': return 'var(--amber)';
    case 'off': return 'var(--danger)';
  }
}

/** How far past the human-ear audible threshold the current reading is, as a percentage (100% = right at the threshold). */
export function audibleErrorPercent(cents: number): number {
  return Math.round((Math.abs(cents) / AUDIBLE_THRESHOLD_CENTS) * 100);
}
