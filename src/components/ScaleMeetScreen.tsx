// ── ScaleMeetScreen — "Meet the scale", shown before practicing ──────────
//
// A beginner-facing view (product-owner request, 2026-10-01): the chosen
// scale laid out across the WHOLE neck (not one movable box), its root
// highlighted, every scale tone labelled with its degree, a button that
// plays it ascending from the root, and the scale's plain-language blurb
// (`scaleBlurbs.ts`, already written for the "?" bubble). Reached from
// `ScalePracticeScreen`'s home screen; "Start practicing" just closes this
// view back to the (already-configured) practice screen — it carries no
// drill state of its own.
//
// The root picker reuses `ScaleInfoBody`'s own persisted pick (`ssel_info_root`)
// so "which root am I looking at" stays the same note across this screen and
// the "?" bubble rather than two independent, confusing pickers.

import { useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { CHROMATIC } from '../utils/instruments';
import { scaleTypeById } from '../utils/scales';
import { SCALE_BLURBS } from '../utils/scaleBlurbs';
import ScaleMeetBoard from './ScaleMeetBoard';
import { loadSetting, saveSetting } from '../utils/settings';
import { playNoteSequence } from '../utils/audio';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { playClickSound, haptic } from '../utils/feedback';

const ROOT_KEY = 'ssel_info_root';

interface Props {
  instrument: InstrumentConfig;
  accidental: AccidentalMode;
  notation: NotationMode;
  lang: string;
  scaleTypeId: string;
  onBack: () => void;
  onStart: () => void;
}

export default function ScaleMeetScreen({ instrument, accidental, notation, lang, scaleTypeId, onBack, onStart }: Props) {
  const { t } = useTranslation();
  const [root, setRootState] = useState<string>(() => {
    const raw = loadSetting<string>(ROOT_KEY, 'A');
    return CHROMATIC.includes(raw) ? raw : 'A';
  });
  const scale = scaleTypeById(scaleTypeId);
  const blurb = scale ? SCALE_BLURBS[scaleTypeId] : undefined;

  const play = () => {
    playClickSound(); haptic.tap();
    if (!scale) return;
    const row = instrument.notes[instrument.stringCount - 1] ?? [];
    const maxDegree = Math.max(0, ...scale.degrees);
    const candidates: number[] = [];
    for (let f = 0; f <= instrument.maxFret; f++) {
      if (row[f] === root) candidates.push(f);
    }
    const rootFret = candidates.find((f) => f + maxDegree <= instrument.maxFret) ?? candidates[0];
    if (rootFret == null) return;
    const frets = [0, ...scale.degrees].map((semi) => rootFret + semi);
    void playNoteSequence(instrument.stringCount, frets, Math.max(1200, frets.length * 400));
  };

  if (!scale) return null;

  return (
    <div className="app settings-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button className="sp2-back" onClick={onBack}>
            ← {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          <span className="settings-page-emoji" aria-hidden="true">📖</span>
          <h2 className="settings-page-name">{t(scale.nameKey)}</h2>
        </header>
        <div className="settings-page-body">
          {blurb && (
            <div className="set-card">
              <p className="set-card-help">{t(blurb)}</p>
            </div>
          )}

          <div className="set-card scale-meet-root-card" role="group" aria-label={t('Root')}>
            <span className="set-card-label">{t('Root')}</span>
            <div className="scale-info-roots" dir="ltr">
              {CHROMATIC.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`scale-info-root${r === root ? ' scale-info-root-active' : ''}`}
                  aria-pressed={r === root}
                  onClick={() => { playClickSound(); haptic.tap(); setRootState(r); saveSetting(ROOT_KEY, r); }}
                >
                  {displayNote(r, accidental, notation)}
                </button>
              ))}
            </div>
          </div>

          <div className="set-card">
            <ScaleMeetBoard
              scale={scale}
              rootName={root}
              noteTable={instrument.notes}
              stringCount={instrument.stringCount}
              maxFret={instrument.maxFret}
            />
            <button type="button" className="set-card-btn" onClick={play}>
              ▶ {t('Play the scale')}
            </button>
          </div>

          <div className="set-card">
            <button type="button" className="set-card-btn set-card-btn-primary" onClick={onStart}>
              {t('Start practicing')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
