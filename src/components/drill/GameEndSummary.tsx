import AnimatedScore from '../AnimatedScore';
import { BadgeMedal, BadgeMedalDefs } from '../BadgeMedal';
import type { CelebratedBadge } from '../BadgeCelebration';
import { badgeDef, TIER_LABEL } from '../../utils/badges';
import { withClick as click } from '../../utils/withClick';
import type { InstrumentConfig } from '../../utils/instruments';
import type { RoundSuggestion } from '../../hooks/useRoundEndCelebrations';

/**
 * The end-of-round card (score, streak, correct count and any badges won this
 * run). Presentation only — <App> owns the round state and clears it via
 * `onOk`. `completed` tells it whether the run reached its last question on
 * its own or was cut short by a manual Stop — the two get different titles so
 * a stopped-early run is never announced as "complete".
 */
export default function GameEndSummary({
  t, showScore, completed, score, longestStreak, questionsCorrect, questionsAnswered,
  newBadges, instrument, suggestion, onApplySuggestion, onOk,
}: {
  t: (s: string) => string;
  showScore: boolean;
  completed: boolean;
  score: number;
  longestStreak: number;
  questionsCorrect: number;
  questionsAnswered: number;
  newBadges: CelebratedBadge[];
  instrument: InstrumentConfig;
  suggestion: RoundSuggestion | null;
  onApplySuggestion: () => void;
  onOk: () => void;
}) {
  return (
    <div className="game-end-summary">
      <div className="game-end-title">
        {completed ? <>🎉 {t('Round Complete!')}</> : t('Session Stopped')}
      </div>
      {showScore && <div className="game-end-score"><AnimatedScore value={score} /> {t('pts')}</div>}
      <div className="game-end-details">
        {longestStreak >= 2 && <span>🔥 {longestStreak} {t('streak')}</span>}
        <span>✓ {questionsCorrect}/{questionsAnswered}</span>
      </div>
      {newBadges.length > 0 && (
        <div className="game-end-badges">
          <BadgeMedalDefs />
          {newBadges.map(({ id, tier }) => {
            const def = badgeDef(id, instrument);
            return (
              <div className="game-end-badge" key={id}>
                <BadgeMedal id={id} instrumentId={instrument.id} tier={tier} size={30} />
                {t('New badge')} · {def ? t(def.name) : id} — {t(TIER_LABEL[tier])}
              </div>
            );
          })}
        </div>
      )}
      {suggestion && (
        <div className="game-end-suggestion">
          <div>
            {suggestion.kind === 'nextStage'
              ? t("You're ready for the next stage:")
              : t("You've mastered this — ready to learn something new?")}
          </div>
          {suggestion.kind === 'nextStage' && (
            <div className="game-end-suggestion-name" dir="ltr">{suggestion.step.label}</div>
          )}
          <button className="clear-btn" onClick={click(onApplySuggestion)}>
            {suggestion.kind === 'nextStage' ? t('Move on') : t('Explore Learn')}
          </button>
        </div>
      )}
      <button className="clear-btn" onClick={click(onOk)}>{t('OK')}</button>
    </div>
  );
}
