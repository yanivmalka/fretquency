// How many assigned homework items the signed-in student hasn't attempted
// yet, across every class they've joined — the badge count for the
// practice-screen homework bubble (PracticeSideBubbles). Same shape as
// useTeacherRoles: fetched once per account on mount, refreshed whenever the
// Class screen closes (the only place an attempt can be posted).

import { useCallback, useEffect, useState } from 'react';
import { fetchPendingHomeworkCount } from './classroom';

export interface PendingHomework {
  count: number;
  refresh: () => void;
}

export function usePendingHomework(userId: string | null | undefined): PendingHomework {
  const [count, setCount] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }
    let live = true;
    fetchPendingHomeworkCount(userId).then((n) => {
      if (live) setCount(n);
    }, (e) => console.warn('[usePendingHomework]', e));
    return () => { live = false; };
  }, [userId, tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  return { count: userId ? count : 0, refresh };
}
