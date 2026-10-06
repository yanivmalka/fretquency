// ── IntervalItem identity ────────────────────────────────────────────────
//
// An SRS item is an interval *quality* × SKILL × DIRECTION:
//   `interval:<semitones>:<skill>:<dir>`   e.g. `interval:4:ear:down`
// (11 qualities × 3 skills × 2 directions = 66 ids). Skills are different
// abilities that must not share a score:
//   ear  — *identify the interval* (the app plays two notes)
//   calc — *find the target note* (work it out from the theory)
//   neck — *find it on the neck* (the fretboard shape)
// History rows already carry `form` + `dir`, so mastery can read them directly;
// the SRS key follows the same split.
//
// BACKWARD COMPAT: the original quality-only id `interval:<semitones>` is still
// valid and is never deleted. New answers write BOTH the fine id and this
// legacy "any skill / any direction" id (so an old device keeps seeing
// progress, and an old blob keeps merging per item). Readers treat a legacy row
// with no fine rows as an UNVERIFIED seed (see `seedLegacyIntervalSrs`), never
// as proof of mastery in any one skill. Nothing is stored for the migration, so
// it is idempotent and needs no SQL (the blob is doc-only).
//
// Interval SRS lives in its OWN `SrsMap` (`InstrumentLearningState.intervalSrs`),
// never mixed into the note schedule. The `interval:` prefix keeps an id
// unmistakable, and `parseNoteItemId` already returns `null` for it.

export const INTERVAL_ID_PREFIX = 'interval:';

export type IntervalSkill = 'ear' | 'calc' | 'neck';
export type IntervalDir = 'up' | 'down';
export const INTERVAL_SKILLS: readonly IntervalSkill[] = ['ear', 'calc', 'neck'];
export const INTERVAL_DIRS: readonly IntervalDir[] = ['up', 'down'];

/** History `form` → the skill it trains. */
export function skillOfForm(form: 'identify' | 'findNote' | 'findPosition'): IntervalSkill {
  return form === 'identify' ? 'ear' : form === 'findPosition' ? 'neck' : 'calc';
}

/** The LEGACY quality-only id, `"interval:<semitones>"`. Still written (as the
 *  aggregate) and still parsed. */
export function intervalItemId(semitones: number): string {
  return `${INTERVAL_ID_PREFIX}${semitones}`;
}

/** The fine id: `"interval:<semitones>:<skill>:<dir>"`. */
export function intervalSkillItemId(
  semitones: number,
  skill: IntervalSkill,
  dir: IntervalDir,
): string {
  return `${INTERVAL_ID_PREFIX}${semitones}:${skill}:${dir}`;
}

export function isIntervalItemId(id: string): boolean {
  return id.startsWith(INTERVAL_ID_PREFIX);
}

export interface ParsedIntervalId {
  semitones: number;
  /** `null` for a legacy quality-only id. */
  skill: IntervalSkill | null;
  dir: IntervalDir | null;
}

/** Parse either id form, or `null` if malformed / outside m2…M7. */
export function parseIntervalId(id: string): ParsedIntervalId | null {
  if (!isIntervalItemId(id)) return null;
  const parts = id.slice(INTERVAL_ID_PREFIX.length).split(':');
  if (parts.length !== 1 && parts.length !== 3) return null;
  if (!/^\d+$/.test(parts[0])) return null;
  const n = Number(parts[0]);
  if (!(n >= 1 && n <= 11)) return null;
  if (parts.length === 1) return { semitones: n, skill: null, dir: null };
  const skill = parts[1] as IntervalSkill;
  const dir = parts[2] as IntervalDir;
  if (!INTERVAL_SKILLS.includes(skill) || !INTERVAL_DIRS.includes(dir)) return null;
  return { semitones: n, skill, dir };
}

/** The semitone size of either id form, or `null` if malformed. */
export function parseIntervalItemId(id: string): number | null {
  return parseIntervalId(id)?.semitones ?? null;
}

/** Is this the legacy quality-only id? */
export function isLegacyIntervalItemId(id: string): boolean {
  const p = parseIntervalId(id);
  return p != null && p.skill == null;
}

/**
 * Read-side migration: a view of `srs` where every fine id with no stored row
 * is seeded from its legacy quality row, bucket capped BELOW the mastered
 * bucket (2) — an old review proves "seen", not "known in this skill". Pure,
 * never stored, so it cannot desync or double-apply across devices.
 */
export function seedLegacyIntervalSrs<T extends { itemId: string; bucket: number }>(
  srs: Record<string, T>,
): Record<string, T> {
  let out: Record<string, T> | null = null;
  for (const [id, item] of Object.entries(srs)) {
    if (!isLegacyIntervalItemId(id)) continue;
    const n = parseIntervalItemId(id)!;
    for (const skill of INTERVAL_SKILLS) {
      for (const dir of INTERVAL_DIRS) {
        const fine = intervalSkillItemId(n, skill, dir);
        if (srs[fine]) continue;
        out ??= { ...srs };
        out[fine] = { ...item, itemId: fine, bucket: Math.min(item.bucket, 2) };
      }
    }
  }
  return out ?? srs;
}
