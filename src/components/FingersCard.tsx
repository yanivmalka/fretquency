// ── FingersCard — the "Show fingers" switch for the Scales boards ─────────
//
// Off / On, plus the key to the numbers while they are shown. Used on the
// Practice screen ("Tap the scale in order") and on "Meet the scale".

import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';

interface Props {
  on: boolean;
  onChange: (on: boolean) => void;
}

export default function FingersCard({ on, onChange }: Props) {
  const { t } = useTranslation();
  const pick = (next: boolean) => { playClickSound(); haptic.tap(); onChange(next); };
  return (
    <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Show fingers')}>
      <span className="set-card-label">{t('Show fingers')}</span>
      <div className="scale-difficulty-row">
        <button
          type="button"
          className={`set-card-btn${!on ? ' set-card-btn-primary' : ''}`}
          aria-pressed={!on}
          onClick={() => pick(false)}
        >
          {t('Off')}
        </button>
        <button
          type="button"
          className={`set-card-btn${on ? ' set-card-btn-primary' : ''}`}
          aria-pressed={on}
          onClick={() => pick(true)}
        >
          {t('On')}
        </button>
      </div>
      {on && (
        <p className="set-card-help">
          {t('The small number on each note is the finger that plays it: 1 index, 2 middle, 3 ring, 4 pinky, 0 an open string. One finger per fret — the hand stays in place and each finger owns its fret.')}
        </p>
      )}
    </div>
  );
}
