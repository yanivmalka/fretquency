// Pure half of `joinClass` (classroom.ts): the shape of a join attempt's
// result and the mapping from a `join_class` RPC error message (migrations
// 0026/0028/0031) to it. Kept dependency-free (no supabase import) so it can
// be unit tested without a live client — scripts/check-classroom.mts imports
// this module directly, which would otherwise pull in `import.meta.env` via
// src/utils/supabase.ts and crash outside Vite.

export type JoinOutcome =
  | { kind: 'joined'; classId: string; name: string }
  | { kind: 'notFound' }
  | { kind: 'ownClass' }
  | { kind: 'blocked' }
  | { kind: 'tooManyAttempts' }
  /** Joining account is below Pro (migration 0031) — the join form should
   *  route to the upgrade drawer instead of showing this as a plain error. */
  | { kind: 'requiresPro' };

/** Maps a `join_class` RPC error message to the JoinOutcome kind it
 *  represents, or null when it should be rethrown as-is (e.g. "not signed
 *  in" / "name required" / "certification required" — none of these should
 *  happen given the form's own guards, so they stay generic errors rather
 *  than named outcomes). */
export function classifyJoinError(message: string | null | undefined): JoinOutcome['kind'] | null {
  if (!message) return null;
  if (message.includes('own class')) return 'ownClass';
  if (message.includes('blocked')) return 'blocked';
  if (message.includes('too many attempts')) return 'tooManyAttempts';
  if (message.includes('requires_pro')) return 'requiresPro';
  return null;
}
