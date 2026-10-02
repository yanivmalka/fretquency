// ── RecallLevelCard — "Play from memory" picker for "Tap the scale in order" ─
//
// Recall mode (scales-learning-spec.md, Session 10): how much of the box is
// lit — every note, only the root, or nothing — plus an optional automatic
// level-up after a few good runs in a row (`scaleRecall.ts`).

import { RECALL_LEVELS, type RecallLevel } from '../learning/scaleOrder';
import { RECALL_PROMOTE_RUNS, RECALL_LEVEL_LABEL } from '../learning/scaleRecall';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';

const LEVEL_HELP: Record<RecallLevel, string> = {
  0: 'Every note of the box is lit — learn the shape by seeing it.',
  1: 'Only the root is lit. Play the rest of the box from memory — a dim note of the box still counts.',
  2: 'Nothing is lit. Find the root and play the whole box from memory.',
};

interface Props {
  level: RecallLevel;
  onLevel: (level: RecallLevel) => void;
  auto: boolean;
  onAuto: (on: boolean) => void;
  /** Good runs in a row at this level, toward the next one. */
  streak: number;
}

export default function RecallLevelCard({ level, onLevel, auto, onAuto, streak }: Props) {
  const { t } = useTranslation();
  return (
    <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Play from memory')}>
      <span className="set-card-label">{t('Play from memory')}</span>
      <div className="scale-difficulty-row">
        {RECALL_LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            className={`set-card-btn${level === l ? ' set-card-btn-primary' : ''}`}
            aria-pressed={level === l}
            onClick={() => { playClickSound(); haptic.tap(); onLevel(l); }}
          >
            {t(RECALL_LEVEL_LABEL[l])}
          </button>
        ))}
      </div>
      <p className="set-card-help">{t(LEVEL_HELP[level])}</p>
      {level < 2 && (
        <label className="scale-recall-auto">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => { playClickSound(); haptic.tap(); onAuto(e.target.checked); }}
          />
          {t('Move up a level by itself after 3 good runs in a row')}
        </label>
      )}
      {auto && level < 2 && (
        <p className="set-card-help scale-recall-progress">
          {t('Good runs toward the next level:')} {Math.min(streak, RECALL_PROMOTE_RUNS)} / {RECALL_PROMOTE_RUNS}
        </p>
      )}
    </div>
  );
}
