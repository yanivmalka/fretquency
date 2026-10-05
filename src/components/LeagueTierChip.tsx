// A quiet home-screen indicator of the signed-in player's current weekly
// league tier, next to DailyStreakBar, so they don't have to open Leaderboard
// → League to know they're in one. Reads the device-local cache
// `useRoundEndCelebrations` writes after each round's league sync
// (`loadLastSeenLeagueTier` in utils/leagues.ts) — no network call of its own,
// so it never slows down or clutters the home screen. Renders nothing for a
// guest, a player never synced into a league, or a league currently too small
// to count (`inLeague: false`).

import { loadLastSeenLeagueTier, LEAGUE_TIERS, LEAGUE_TIER_COLOR } from '../utils/leagues';
import { useTranslation } from '../i18n/useTranslation';
import { withClick as click } from '../utils/withClick';

interface Props {
  userId: string | null;
  instrumentId: string;
  onOpenLeaderboard: () => void;
}

export default function LeagueTierChip({ userId, instrumentId, onOpenLeaderboard }: Props) {
  const { t } = useTranslation();
  if (!userId) return null;
  const seen = loadLastSeenLeagueTier(instrumentId);
  if (!seen || !seen.inLeague) return null;

  return (
    <button
      type="button"
      className="league-tier-chip"
      style={{ color: LEAGUE_TIER_COLOR[seen.tier] }}
      onClick={click(onOpenLeaderboard)}
      aria-label={t(`${LEAGUE_TIERS[seen.tier]} League`)}
    >
      🏆 {t(`${LEAGUE_TIERS[seen.tier]} League`)}
    </button>
  );
}
