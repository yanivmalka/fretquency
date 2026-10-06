// ── IntervalStatsPanel — the "Intervals" section of Stats & progress ───
//
// Spec §12 + §15.1. A read-only summary of interval learning: the headline
// "n / 11 mastered" count, a few pedagogically meaningful numbers, the
// "currently learning: <group>" line (informational — no lock, no %) and the
// flat 11-interval board.
//
// Interval runs are deliberately excluded from points / XP / streak / badges
// / leaderboard / stars (spec §15.3), so none of those appear here. Reuses
// ProgressPanel's `sp2-hero` tile styling and `stat-group-title` — no new
// stylesheet.

import type { IntervalBoardRow } from '../learning/intervalMastery';
import type { IntervalStatsSummary } from '../hooks/useLearning';
import { useTranslation } from '../i18n/useTranslation';
import IntervalBoard from './IntervalBoard';

interface Props {
  board: IntervalBoardRow[];
  stats: IntervalStatsSummary;
}

export default function IntervalStatsPanel({ board, stats }: Props) {
  const { t } = useTranslation();

  const tiles: Array<{ v: string; l: string }> = [
    { v: `${stats.inSystem}`, l: t('In the system') },
    { v: `${stats.started}`, l: t('Started') },
    { v: `${stats.needsWork}`, l: t('Needs work') },
    { v: `${stats.mastered}`, l: t('mastered') },
  ];
  if (stats.accuracy != null) {
    tiles.push({ v: `${Math.round(stats.accuracy * 100)}%`, l: t('Accuracy') });
  }
  if (stats.avgSeconds != null) {
    tiles.push({ v: `${stats.avgSeconds.toFixed(1)}s`, l: t('Avg. time') });
  }

  return (
    <div className="ivl-stats">
      <p className="stat-group-title">
        {stats.mastered} / {stats.inSystem} {t('mastered')}
      </p>
      <p className="sp2-scope-cap">
        {t('currently learning')}: {t(stats.currentGroupNameKey)}
      </p>
      <div className="sp2-hero">
        {tiles.map((tile) => (
          <div className="sp2-tile" key={tile.l}>
            <span className="sp2-tile-v">{tile.v}</span>
            <span className="sp2-tile-l">{tile.l}</span>
          </div>
        ))}
      </div>
      <p className="sp2-scope-cap">
        {t('Each skill is tracked separately: by ear, by calculation and on the neck. "Mastered" only when all three are.')}
      </p>
      <IntervalBoard rows={board} />
    </div>
  );
}
