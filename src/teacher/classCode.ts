// Class join codes — chosen by the teacher (migration 0028). The server's
// `classes_code_format` check is the real rule; these mirror it so the form
// can explain a bad code before a round trip:
//   - 6–10 Latin letters and digits, at least one letter and one digit
//   - case-sensitive: "Guitar7" and "guitar7" are different codes
//   - unique across all classes (only the server can tell)
// Codes made before 0028 were server-generated (6 upper-case characters,
// possibly without a digit), so a code a STUDENT types or follows from a link
// is only checked for shape (`isJoinableCode`), not for the letter+digit rule.

export const CLASS_CODE_MIN = 6;
export const CLASS_CODE_MAX = 10;

/** What someone types into a code field: spaces, dashes and anything that
 *  isn't a Latin letter or digit dropped, case kept, capped at the maximum. */
export function normaliseClassCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, '').slice(0, CLASS_CODE_MAX);
}

/** Shape check for joining (old generated codes included). */
export function isJoinableCode(code: string): boolean {
  return /^[A-Za-z0-9]+$/.test(code) && code.length >= CLASS_CODE_MIN && code.length <= CLASS_CODE_MAX;
}

export type CodeProblem = 'length' | 'chars' | 'needsLetter' | 'needsDigit';

/** Why a teacher's new code would be refused, or null when it is fine. */
export function classCodeProblem(code: string): CodeProblem | null {
  if (!/^[A-Za-z0-9]*$/.test(code)) return 'chars';
  if (code.length < CLASS_CODE_MIN || code.length > CLASS_CODE_MAX) return 'length';
  if (!/[A-Za-z]/.test(code)) return 'needsLetter';
  if (!/[0-9]/.test(code)) return 'needsDigit';
  return null;
}

// No look-alikes (0/O, 1/I/l), so a suggested code survives a whiteboard.
const SUGGEST_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
const SUGGEST_DIGITS = '23456789';

/** A random valid 8-character code for the "Suggest" button. */
export function suggestClassCode(random: () => number = Math.random): string {
  const pick = (s: string) => s[Math.floor(random() * s.length)];
  const all = SUGGEST_LETTERS + SUGGEST_DIGITS;
  const chars = [pick(SUGGEST_LETTERS), pick(SUGGEST_DIGITS)];
  while (chars.length < 8) chars.push(pick(all));
  // Shuffle so the guaranteed letter and digit aren't always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
