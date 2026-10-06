// The two always-on home-screen shortcuts as side bubbles: the days-in-a-row +
// daily-goal strip (it used to be the DailyStreakBar pill) and Fret of the Day
// (it used to be the FotdHomeCard pill). Same data as those pills had — the
// device-local, cross-source `dailyActivity` log (cross-instrument on
// purpose, see utils/dailyActivity.ts) and today's recorded Fret of the Day
// result — now handed to PracticeSideBubbles so they sit in the same circles
// as the other shortcuts. Every tier.

import { useEffect, useMemo, useState } from 'react';
import type { SideBubble } from '../components/PracticeSideBubbles';
import type { InstrumentConfig } from '../utils/instruments';
import { activityStreak, onDailyActivityUpdated, todayActivityCount } from '../utils/dailyActivity';
import { DAILY_GOAL_TARGET } from '../utils/progress';
import { dailyChallengeNumber, todayISO } from '../utils/dailyChallenge';
import { todaysDailyChallengeResult } from '../utils/dailyChallengeStorage';
import { useTranslation } from '../i18n/useTranslation';

export function useHomeBubbles(
  instrument: InstrumentConfig,
  onOpenStats: () => void,
  onOpenFotd: () => void,
): SideBubble[] {
  const { t } = useTranslation();
  const [streak, setStreak] = useState(() => activityStreak());
  const [today, setToday] = useState(() => todayActivityCount());

  useEffect(() => onDailyActivityUpdated(() => {
    setStreak(activityStreak());
    setToday(todayActivityCount());
  }), []);

  const dayNumber = useMemo(() => dailyChallengeNumber(todayISO()), []);
  const fotdDone = todaysDailyChallengeResult(instrument.id) !== null;

  return [
    {
      id: 'streak',
      icon: '🔥',
      label: `${t('Daily goal')}: ${today}/${DAILY_GOAL_TARGET}`,
      badge: streak.current,
      onSelect: onOpenStats,
    },
    {
      id: 'fotd',
      icon: '🧩',
      label: `${t('Fret of the Day')} #${dayNumber}`,
      pulse: !fotdDone,
      onSelect: onOpenFotd,
    },
  ];
}
