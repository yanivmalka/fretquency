// ── ScaleRelativeScreen — the path's "one shape, two names" step ──────────
//
// The relative major/minor explanation from the guided path
// (scaleCurriculum.ts): A minor pentatonic and C major pentatonic are the
// same five notes on the same frets — only the home note differs. The whole
// neck is drawn by `ScaleMeetBoard` with both home notes ringed, a switch
// re-counts the degree labels from either one (the lit cells never move),
// and two buttons play the run from each home note so the learner hears
// what the home note changes.

import { useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { scaleTypeById } from '../utils/scales';
import { noteNameAtSemitones } from '../utils/intervals';
import ScaleMeetBoard from './ScaleMeetBoard';
import { Chevron } from './Chevron';
import { playNoteSequence } from '../utils/audio';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { playClickSound, haptic } from '../utils/feedback';

const MINOR_ID = 'minorPentatonic';
const MAJOR_ID = 'majorPentatonic';
const MINOR_ROOT = 'A';
const MAJOR_ROOT = noteNameAtSemitones(MINOR_ROOT, 3);

interface Props {
  instrument: InstrumentConfig;
  accidental: AccidentalMode;
  notation: NotationMode;
  lang: string;
  onBack: () => void;
}

export default function ScaleRelativeScreen({ instrument, accidental, notation, lang, onBack }: Props) {
  const { t } = useTranslation();
  const [countFrom, setCountFrom] = useState<'minor' | 'major'>('minor');
  const minor = scaleTypeById(MINOR_ID);
  const major = scaleTypeById(MAJOR_ID);
  if (!minor || !major) return null;

  const minorNote = displayNote(MINOR_ROOT, accidental, notation);
  const majorNote = displayNote(MAJOR_ROOT, accidental, notation);
  const fill = (s: string) => s.split('{minor}').join(minorNote).split('{major}').join(majorNote);

  // Root to root on the lowest string, so the run lands back home.
  const play = (which: 'minor' | 'major') => {
    playClickSound(); haptic.tap();
    const scale = which === 'minor' ? minor : major;
    const root = which === 'minor' ? MINOR_ROOT : MAJOR_ROOT;
    const row = instrument.notes[instrument.stringCount - 1] ?? [];
    const rootFrets = row.flatMap((n, f) => (n === root ? [f] : []));
    const rootFret = rootFrets.find((f) => f + 12 <= instrument.maxFret) ?? rootFrets[0];
    if (rootFret == null) return;
    const steps = rootFret + 12 <= instrument.maxFret ? [0, ...scale.degrees, 12] : [0, ...scale.degrees];
    const frets = steps.map((s) => rootFret + s);
    void playNoteSequence(instrument.stringCount, frets, Math.max(1200, frets.length * 400));
  };

  const fromMinor = countFrom === 'minor';

  return (
    <div className="app settings-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button className="sp2-back" onClick={onBack}>
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          <span className="settings-page-emoji" aria-hidden="true">🔁</span>
          <h2 className="settings-page-name">{t('One shape, two names')}</h2>
        </header>
        <div className="settings-page-body">
          <div className="set-card">
            <p className="set-card-help">
              {fill(t('Same five notes, same shape. Start and end on {minor} and they sound like a minor pentatonic — dark and bluesy. Start and end on {major} and the very same notes sound like a major pentatonic — bright and sweet.'))}
            </p>
            <p className="set-card-help">
              {t('On the thickest string, the major home note sits three frets above the minor one.')}
            </p>
          </div>

          <div className="set-card">
            <div className="scale-relative-legend">
              <span className="scale-relative-key">
                <span className="scale-relative-swatch scale-relative-swatch-root" aria-hidden="true" />
                {fromMinor ? `${minorNote} · ${t(minor.nameKey)}` : `${majorNote} · ${t(major.nameKey)}`}
              </span>
              <span className="scale-relative-key">
                <span className="scale-relative-swatch scale-relative-swatch-root2" aria-hidden="true" />
                {fromMinor ? `${majorNote} · ${t(major.nameKey)}` : `${minorNote} · ${t(minor.nameKey)}`}
              </span>
            </div>
            <ScaleMeetBoard
              scale={fromMinor ? minor : major}
              rootName={fromMinor ? MINOR_ROOT : MAJOR_ROOT}
              secondRootName={fromMinor ? MAJOR_ROOT : MINOR_ROOT}
              noteTable={instrument.notes}
              stringCount={instrument.stringCount}
              maxFret={instrument.maxFret}
            />
            <div className="scale-relative-count" role="group" aria-label={t('Count the degrees from')}>
              <span className="set-card-label">{t('Count the degrees from')}</span>
              <div className="scale-position-row">
                {(['minor', 'major'] as const).map((which) => (
                  <button
                    key={which}
                    type="button"
                    className={`set-card-btn${countFrom === which ? ' set-card-btn-primary' : ''}`}
                    aria-pressed={countFrom === which}
                    onClick={() => { playClickSound(); haptic.tap(); setCountFrom(which); }}
                  >
                    {which === 'minor' ? minorNote : majorNote}
                  </button>
                ))}
              </div>
            </div>
            <div className="scale-position-row">
              <button type="button" className="set-card-btn" onClick={() => play('minor')}>
                ▶ {minorNote} · {t(minor.nameKey)}
              </button>
              <button type="button" className="set-card-btn" onClick={() => play('major')}>
                ▶ {majorNote} · {t(major.nameKey)}
              </button>
            </div>
          </div>

          <div className="set-card">
            <button type="button" className="set-card-btn set-card-btn-primary" onClick={onBack}>
              {t('Back to the path')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
