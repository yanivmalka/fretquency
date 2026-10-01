import type { InstrumentConfig } from './instruments';
import type { BadgeDef } from './badges';

/**
 * The instrument string-label (`"String 1 · high E"`) baked into a per-string
 * String Master badge's generated `name`/`blurb`, or null for every other badge.
 */
export function smStringLabel(def: BadgeDef, instrument: InstrumentConfig): string | null {
  const m = /^string_master_s(\d+)$/.exec(def.id);
  return m ? (instrument.stringLabels[Number(m[1])] ?? null) : null;
}

/**
 * Localise a badge's `name` or a level `blurb` for the active language. Most
 * strings pass straight through `t()`. The per-string String Master family is
 * the exception: its text is generated in `badges.ts` with a string label
 * spliced in, so a literal dictionary entry per string/tier would be brittle.
 * Instead the label is lifted to a `{s}` placeholder — one template translation
 * then covers every string — and the translated label is substituted back.
 * `badges.ts` is untouched; if its wording or thresholds change, the template
 * simply misses the dictionary and English shows, exactly like any other
 * not-yet-translated string in the app. For English this is a no-op.
 *
 * Shared by `BadgeGrid` (the owner's wall) and `PlayerProfileCard` (another
 * player's read-only achievements).
 */
export function localise(
  src: string, def: BadgeDef, instrument: InstrumentConfig, t: (s: string) => string,
): string {
  const label = smStringLabel(def, instrument);
  if (label && src.includes(label)) {
    return t(src.replace(label, '{s}')).replace('{s}', t(label));
  }
  return t(src);
}
