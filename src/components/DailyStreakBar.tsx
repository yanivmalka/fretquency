// A compact, one-line streak + daily-goal strip shown at rest above the
// Selector on the home screen, for every tier (product review 2026-10-05
// §3ב / §4 item 4). Reuses `practiceStreak` — the same streak already shown
// on the Stats & progress screen — rather than introducing a second one, and
// derives the daily goal straight from history too, so there is no new
// persistence here at all. Tapping it opens Stats, same destination the
// number already points to.

import { useMemo } from 'react';
import type { HistoryEntry } from '../utils/music';
import { historyForInstrument } from '../utils/mastery';
import { dailyStats, practiceStreak, todayCount, DAILY_GOAL_TARGET } from '../utils/progress';
import type { InstrumentConfig } from '../utils/instruments';
import { useTranslation } from '../i18n/useTranslation';
import { withClick as click } from '../utils/withClick';

interface Props {
  allHistory: Record<string, HistoryEntry[]>;
  instrument: InstrumentConfig;
  onOpenStats: () => void;
}

export default function DailyStreakBar({ allHistory, instrument, onOpenStats }: Props) {
  const { t, lang } = useTranslation();
  const history = useMemo(
    () => historyForInstrument(allHistory, instrument.id),
    [allHistory, instrument.id],
  );
  const days = useMemo(() => dailyStats(history), [history]);
  const streak = useMemo(() => practiceStreak(days), [days]);
  const today = todayCount(days);
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
