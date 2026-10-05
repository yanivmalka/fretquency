// Inactive-class notices (migration 0028). The server deletes a class whose
// `last_activity_at` is 6 months old (`purge_inactive_classes`, daily
// pg_cron); "activity" = a homework attempt, a student joining, or the
// teacher assigning homework. The teacher is told in the app:
//   - from 7 days idle: a weekly-style "nothing happened" notice
//   - from 5 months idle: the class will be deleted on <date>
// Pure, so scripts/check-classroom.mts can pin the thresholds.

export const CLASS_IDLE_NOTICE_DAYS = 7;
export const CLASS_WARN_AFTER_MONTHS = 5;
/** Keep in step with the interval in purge_inactive_classes() (0028). */
export const CLASS_DELETE_AFTER_MONTHS = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

function addMonths(d: Date, months: number): Date {
  const out = new Date(d.getTime());
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

export type ClassActivityStatus =
  | { kind: 'active' }
  | { kind: 'idle'; idleDays: number }
  | { kind: 'expiring'; idleDays: number; deletesOn: Date };

export function classActivityStatus(lastActivityAt: string, now: Date = new Date()): ClassActivityStatus {
  const last = new Date(lastActivityAt);
  if (Number.isNaN(last.getTime())) return { kind: 'active' };
  const idleDays = Math.floor((now.getTime() - last.getTime()) / DAY_MS);
  if (now >= addMonths(last, CLASS_WARN_AFTER_MONTHS)) {
    return { kind: 'expiring', idleDays, deletesOn: addMonths(last, CLASS_DELETE_AFTER_MONTHS) };
  }
  if (idleDays >= CLASS_IDLE_NOTICE_DAYS) return { kind: 'idle', idleDays };
  return { kind: 'active' };
}
