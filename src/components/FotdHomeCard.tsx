// A small, one-line "today's puzzle" entry shown at rest above the Selector,
// right under DailyStreakBar — Fret of the Day used to sit only as a tile
// deep inside menu → Learn (product review 2026-10-05 §3ב/15, §4/7). Reuses
// the same day-number + candidate-count the full screen shows, and a done
// state once today's result is already recorded, so it never duplicates
// state of its own.

import { useMemo } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { CHALLENGE_POSITIONS, dailyChallengeNumber, todayISO } from '../utils/dailyChallenge';
import { todaysDailyChallengeResult } from '../utils/dailyChallengeStorage';
import { useTranslation } from '../i18n/useTranslation';
import { withClick as click } from '../utils/withClick';

interface Props {
  instrument: InstrumentConfig;
  onOpen: () => void;
}

export default function FotdHomeCard({ instrument, onOpen }: Props) {
  const { t, lang } = useTranslation();
  const dayNumber = useMemo(() => dailyChallengeNumber(todayISO()), []);
  const done = todaysDailyChallengeResult(instrument.id) !== null;

  return (
    <button
      type="button"
      className="fotd-home-card"
      dir={lang === 'he' ? 'rtl' : undefined}
      onClick={click(onOpen)}
    >
      <span className="fotd-home-card-label">
        🔥 #{dayNumber} — {t('{count} positions, today').replace('{count}', String(CHALLENGE_POSITIONS))}
      </span>
      {done && <span className="fotd-home-card-done" aria-hidden="true">✓</span>}
    </button>
  );
}
