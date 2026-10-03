// ── PickStrokesCard — the "Pick strokes" switch for "Tap the scale in order" ─
//
// Off / On, plus the key to the ↓ / ↑ marks while they are shown (wishlist
// update 2026-10-03, item 8). It says plainly that the app can't check the
// stroke: it hears which note was played, never how it was picked.

import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';

interface Props {
  on: boolean;
  onChange: (on: boolean) => void;
}

export default function PickStrokesCard({ on, onChange }: Props) {
  const { t } = useTranslation();
  const pick = (next: boolean) => { playClickSound(); haptic.tap(); onChange(next); };
  return (
    <div className="set-card scale-difficulty-switcher" role="group" aria-label={t('Pick strokes')}>
      <span className="set-card-label">{t('Pick strokes')}</span>
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
          {t('The arrow on each note is the pick stroke: ↓ down, ↑ up. Alternate from the first note — down, up, down, up — even when you change strings.')}
        </p>
      )}
      <p className="set-card-help">
        {t('The app hears which note you play, not how you pick it — it can’t check the stroke direction. With the metronome at 2 notes per click, every down stroke falls on a click, which keeps the alternation even.')}
      </p>
    </div>
  );
}
