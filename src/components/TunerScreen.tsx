// ── TunerScreen — the app-integrated chromatic tuner ────────────────────
//
// A full-page takeover reached from the "Learn" drawer page (<LearnHub>),
// same page-replacing treatment as Stats / the Learning Path / the Game.
// Free for every tier (a tuner is a generic utility, not part of the
// adaptive Premium teaching system — see the Notes/Daily/Intervals domains
// for that).
//
// The actual pitch-detection engine (mic capture, autocorrelation, the note
// wheel + compass) was built and proven standalone under src/tuner/ before
// this screen existed (see src/tuner/README.md) and is reused unchanged
// here — only the chrome (header/back button, copy, layout) is new, styled
// to match the rest of the app's settings-page/sp2 shell and the current
// theme's tokens.

import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import { Chevron } from './Chevron';
import { useTuner } from '../tuner/useTuner';
import NoteWheel from '../tuner/NoteWheel';
import { STANDARD_TUNING_STRINGS } from '../tuner/standardTuning';
import { centsFromNote } from '../tuner/noteUtils';
import { audibleErrorPercent, classifyCents, isInTune, zoneColor } from '../tuner/tuningZones';

interface Props {
  onClose: () => void;
}

export default function TunerScreen({ onClose }: Props) {
  const { t, lang } = useTranslation();
  const { status, reading, start, stop } = useTuner();

  // Locking ("pinning") a note means "this is the string I'm tuning" — the
  // wheel holds that note at 12 o'clock instead of following whatever pitch
  // is detected, and the compass measures distance from THAT note rather
  // than from whichever note the raw frequency happens to be closest to.
  const [pinnedNote, setPinnedNote] = useState<string | null>(null);

  const handleSelectNote = (note: string) => {
    playClickSound();
    haptic.tap();
    setPinnedNote((prev) => (prev === note ? null : note));
  };

  const targetNote = pinnedNote ?? (reading ? reading.note.name : null);

  const cents = useMemo(() => {
    if (!reading) return null;
    if (pinnedNote) return centsFromNote(reading.frequency, pinnedNote);
    return reading.note.cents;
  }, [reading, pinnedNote]);

  const zone = cents !== null ? classifyCents(cents) : null;
  const stringNumbers = targetNote ? STANDARD_TUNING_STRINGS[targetNote] : undefined;

  return (
    <div className="app settings-page tn-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button className="sp2-back" onClick={() => { playClickSound(); haptic.tap(); stop(); onClose(); }}>
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          <span className="settings-page-emoji" aria-hidden="true">🎛️</span>
          <h2 className="settings-page-name">{t('Tuner')}</h2>
        </header>

        <div className="settings-page-body tn-body">
          <p className="set-card-help">{t('Tune your strings using the microphone.')}</p>

          <div className="tn-live">
            <p className="tn-hint">
              {t("Tap a note on the wheel to lock it as the string you're tuning. Tap it again to switch back to auto-detect.")}
            </p>

            {targetNote && (
              <div className="tn-target-line">
                {pinnedNote ? t('Tuning') : t('Detected')}: <strong>{targetNote}</strong>
                {stringNumbers && (
                  <>
                    {' — '}
                    {t('String {n}').replace('{n}', stringNumbers.join(` ${t('or')} `))}
                  </>
                )}
                {pinnedNote && (
                  <button className="tn-unpin" onClick={() => { playClickSound(); haptic.tap(); setPinnedNote(null); }}>
                    {t('Unpin')}
                  </button>
                )}
              </div>
            )}

            <div className="tn-wheel-wrap">
              <NoteWheel
                targetNote={targetNote}
                pinnedNote={pinnedNote}
                cents={cents}
                onSelectNote={handleSelectNote}
                pinLabel={t("Tap to lock this note at 12 o'clock")}
                unpinLabel={t('Tap to unpin')}
              />
            </div>

            {reading && (
              <div className="tn-readout">
                <div className="tn-readout-note">
                  {reading.note.name}
                  <sub>{reading.note.octave}</sub>
                </div>
                <div className="tn-readout-hz">{reading.frequency.toFixed(1)} Hz</div>
                {cents !== null && zone && (
                  <div className="tn-readout-cents" style={{ color: zoneColor(zone) }}>
                    {cents > 0 ? '+' : ''}
                    {cents}¢
                    {' — '}
                    {isInTune(cents)
                      ? t('In tune')
                      : cents < 0 ? t('Tighten (raise pitch)') : t('Loosen (lower pitch)')}
                    {(zone === 'noticeable' || zone === 'off') && (
                      <span className="tn-readout-pct">
                        {' · '}
                        {t('~{pct}% of the audible threshold').replace('{pct}', String(audibleErrorPercent(cents)))}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {status === 'idle' && (
              <button className="tn-btn tn-btn-primary" onClick={() => void start()}>
                {t('Start listening')}
              </button>
            )}
            {status === 'requesting' && <p className="tn-status">{t('Requesting microphone permission…')}</p>}
            {status === 'denied' && (
              <div className="tn-status">
                <p>{t('Microphone access was denied. Allow it in your browser settings, then try again.')}</p>
                <button className="tn-btn tn-btn-primary" onClick={() => void start()}>{t('Try again')}</button>
              </div>
            )}
            {status === 'error' && (
              <div className="tn-status">
                <p>{t("Couldn't start the microphone.")}</p>
                <button className="tn-btn tn-btn-primary" onClick={() => void start()}>{t('Try again')}</button>
              </div>
            )}
            {status === 'listening' && !reading && <p className="tn-status">{t('Listening… play a note.')}</p>}
            {status === 'listening' && (
              <button className="tn-btn tn-btn-ghost" onClick={() => { playClickSound(); haptic.tap(); stop(); }}>
                {t('Stop')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
