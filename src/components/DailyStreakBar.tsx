// A compact, one-line streak + daily-goal strip shown at rest above the
// Selector on the home screen, for every tier (product review 2026-10-05
// §3ב / §4 item 4). Reads the device-local, cross-source `dailyActivity` log
// (every practice source feeds it — Practice, Fret of the Day, Homework and
// every Learn domain, see utils/dailyActivity.ts) rather than Practice's own
// per-instrument history, so a student who only did homework or a Premium
// learner who only practises Staff reading still sees their streak and goal
// move (review §3ב items 6–7). Deliberately cross-instrument: switching
// instrument must not reset the streak. The Stats & progress screen keeps
// its own, separate Practice-only per-instrument streak (utils/progress.ts)
// — the two numbers can differ by design. Tapping this opens Stats anyway,
// since that is still the deeper history view.

import { useEffect, useState } from 'react';
import { activityStreak, onDailyActivityUpdated, todayActivityCount } from '../utils/dailyActivity';
import { DAILY_GOAL_TARGET } from '../utils/progress';
import { useTranslation } from '../i18n/useTranslation';
import { withClick as click } from '../utils/withClick';

interface Props {
  onOpenStats: () => void;
}

export default function DailyStreakBar({ onOpenStats }: Props) {
  const { t, lang } = useTranslation();
  const [streak, setStreak] = useState(() => activityStreak());
  const [today, setToday] = useState(() => todayActivityCount());

  useEffect(() => onDailyActivityUpdated(() => {
    setStreak(activityStreak());
    setToday(todayActivityCount());
  }), []);

  const pct = Math.min(100, Math.round((today / DAILY_GOAL_TARGET) * 100));
  const goalDone = today >= DAILY_GOAL_TARGET;

  return (
    <button
      type="button"
      className="daily-streak-bar"
      dir={lang === 'he' ? 'rtl' : undefined}
      onClick={click(onOpenStats)}
      aria-label={t('Stats & progress')}
    >
      <span className="daily-streak-flame">🔥 {streak.current}</span>
      <span className="daily-streak-goal">
        <span className="daily-streak-goal-bar" aria-hidden="true">
          <span className="daily-streak-goal-fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="daily-streak-goal-label">
          {goalDone ? `✓ ${t('Daily goal')}` : `${t('Daily goal')}: ${today}/${DAILY_GOAL_TARGET}`}
        </span>
      </span>
    </button>
  );
}
