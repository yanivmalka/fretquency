// ── IntervalPracticeScreen — the "Intervals" second home screen ─────────
//
// One of the learning-type tabs from the drawer's "Learn" group, but styled
// as a *second home screen* rather than a settings sub-page: no Back row — the
// centred title sits at the top like the Notes home screen's `<h1>`, and the
// only way off the page is the hamburger drawer (the host renders the drawer
// nav; this component renders just the hamburger button). It hosts the free
// Interval Selector (intervals-learning-spec §5). The guided "Today's
// intervals" card is *not* here — anything daily-plan-shaped lives on the
// Daily practice tab (<DailyPracticeScreen>). Premium-only: the host mounts it
// behind `can('intervalDrill', tier)` and it is wrapped in <ProGate> as a
// second line of defence. All copy through `t()`; the layout flips for Hebrew
// via `dir`.

import { useMemo, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import type { AccidentalMode, NotationMode, OrderMode } from '../utils/music';
import type { DrillConfig } from '../drill/DrillConfig';
import type { IntervalBoardRow } from '../learning/intervalMastery';
import IntervalSelectorPanel from './IntervalSelectorPanel';
import { ProGate } from './ProGate';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import DemoTour from './DemoTour';
import { INTERVALS_DEMO_STEPS } from './demoTourContent';
import { hasSeenDemo, markDemoSeen } from '../utils/demoState';

interface Props {
  instrument: InstrumentConfig;
  /** The flat 11-interval board — used only to resolve the Selector's
   *  "All learned" pick (§5.2) from the mastered qualities. */
  intervalBoard: IntervalBoardRow[];
  accidental: AccidentalMode;
  order: OrderMode;
  /** Note-name notation — forwarded so the drill's interval feedback matches
   *  the prompt's spelling (#6). */
  notation: NotationMode;
  /** Distinct interval qualities the SRS schedule is tracking so far. */
  trackedCount: number;
  /** Silent mode is on — forwarded so the Selector can hide the audio-only
   *  "Identify the interval" exercise. */
  silentMode?: boolean;
  /** Whether the hamburger button is shown — hidden while the drawer is
   *  already open or during the pre-run count-in, matching the home screen. */
  showMenuButton?: boolean;
  /** Open the hamburger drawer (the host owns the drawer state + nav). */
  onOpenMenu: () => void;
  /** Start a free Selector-configured session. */
  onStart: (config: DrillConfig) => void;
}

export default function IntervalPracticeScreen({
  instrument,
  intervalBoard,
  accidental,
  order,
  notation,
  trackedCount,
  silentMode,
  showMenuButton = true,
  onOpenMenu,
  onStart,
}: Props) {
  const { t, lang } = useTranslation();
  const [showDemo, setShowDemo] = useState(() => !hasSeenDemo('intervals'));

  const masteredSizes = useMemo(
    () => intervalBoard.filter((r) => r.status === 'mastered').map((r) => r.semitones),
    [intervalBoard],
  );

  return (
    <div className="app settings-page lp-page interval-home">
      <DemoTour
        active={showDemo}
        steps={INTERVALS_DEMO_STEPS}
        onFinish={() => { markDemoSeen('intervals'); setShowDemo(false); }}
      />
      {showMenuButton && (
        <button
          className="burger-btn"
          onClick={() => { playClickSound(); haptic.tap(); onOpenMenu(); }}
          aria-label={t('Open settings')}
          title={t('Settings')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <rect x="3" y="5" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
            <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      )}
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <h1 className="interval-home-title">🎸 {t('Interval training')}</h1>

        <div className="settings-page-body">
          <ProGate
            feature="intervalDrill"
            variant="replace"
            pitch={t('Practise hearing and finding intervals')}
          >
            <IntervalSelectorPanel
              instrument={instrument}
              masteredSizes={masteredSizes}
              accidental={accidental}
              order={order}
              notation={notation}
              trackedCount={trackedCount}
              silentMode={silentMode}
              onStart={onStart}
            />
          </ProGate>
        </div>
      </div>
    </div>
  );
}
