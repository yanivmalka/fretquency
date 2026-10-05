// Whether the signed-in account is a teacher (passed the test,
// src/teacher/teacherExam.ts) and/or a student (joined at least one class) —
// drives the Teacher / Student role badges (src/utils/badges.ts) the same
// way `auth.admin` drives the Admin one. Guests are never either.
//
// Fetched once per account on mount and refreshed whenever the Class screen
// closes, since that's the only place either can change (passing the test,
// joining/leaving a class).

import { useCallback, useEffect, useState } from 'react';
import { fetchTeacherStatus, fetchJoinedClasses } from './classroom';

export interface TeacherRoles {
  isTeacher: boolean;
  isStudent: boolean;
  refresh: () => void;
}

export function useTeacherRoles(userId: string | null | undefined): TeacherRoles {
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    Promise.all([fetchTeacherStatus(userId), fetchJoinedClasses(userId)]).then(([status, joined]) => {
      if (!live) return;
      setIsTeacher(status.isTeacher);
      setIsStudent(joined.length > 0);
    }, (e) => console.warn('[useTeacherRoles]', e));
    return () => { live = false; };
  }, [userId, tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  // A signed-out account is never either role, whatever the last fetch found
  // (a sign-out doesn't unmount this hook) — gate the return, not the effect.
  return { isTeacher: !!userId && isTeacher, isStudent: !!userId && isStudent, refresh };
}
