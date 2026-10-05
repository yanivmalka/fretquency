import { SettingCard, SegmentedControl } from '../../SettingCard';
import { ProGate } from '../../ProGate';
import { QuickAccessPinButton } from '../../QuickAccessPinButton';
import FretRangeControl from '../../FretRangeControl';
import FretRangeNeck from '../../FretRangeNeck';
import { withClick as click } from '../../../utils/withClick';
import { saveSetting } from '../../../utils/settings';
import {
  COMING_SOON_INSTRUMENTS, type InstrumentId, type InstrumentConfig,
  type InstrumentVariants, type UkuleleSize, type GuitarType,
  getAvailableStringCounts, getAvailableFretCounts, getAvailableGuitarTypes,
  getAvailableMandolinFretCounts, getAvailableUkuleleSizes, getUkuleleVariant, getAvailableBanjoTypes, getBanjoVariant, getUkuleleTuning,
} from '../../../utils/instruments';
import { solfegeSample, type AccidentalMode, type NotationMode } from '../../../utils/music';

/**
 * The "Playing" drawer section body (instrument picker + note-name notation +
 * the Pro precise fret-range window). Presentation only — every setter is
 * threaded in from <App>; this component imports no hooks.
 */
export interface PlayingSectionProps {
  t: (s: string) => string;
  instrument: InstrumentConfig;
  instrumentId: InstrumentId;
  admin: boolean;
  running: boolean;
  paused: boolean;
  stop: () => void;
  applyInstrument: (id: InstrumentId) => void;
  instrumentVariants: InstrumentVariants;
  setGuitarStrings: (strings: number) => void;
  setGuitarFrets: (frets: number) => void;
  setGuitarType: (type: GuitarType) => void;
  setBassStrings: (strings: number) => void;
  setBassFrets: (frets: number) => void;
  setMandolinFrets: (frets: number) => void;
  setUkuleleSize: (size: UkuleleSize) => void;
  setBanjoType: (key: string) => void;
  setPreloaded: (v: boolean) => void;
  notation: NotationMode;
  setNotation: (n: NotationMode) => void;
  accidental: AccidentalMode;
  setAccidental: (a: AccidentalMode) => void;
  fretRange: {
    useFretRange: boolean;
    fretLo: number;
    fretHi: number;
    onPreciseToggle: () => void;
    onWindow: (lo: number, hi: number) => void;
  };
}

export default function PlayingSection({
  t, instrument, instrumentId, admin, running, paused, stop,
  applyInstrument, instrumentVariants,
  setGuitarStrings, setGuitarFrets, setGuitarType, setBassStrings, setBassFrets,
  setMandolinFrets, setUkuleleSize, setBanjoType,
  setPreloaded, notation, setNotation, accidental, setAccidental, fretRange,
}: PlayingSectionProps) {
  // Same "stop the live drill + drop the preloaded-samples flag" guard the
  // instrument row itself uses (samples reload on any variant change too),
  // skipped when the tapped value is already the active one.
  const withReload = (changed: boolean, apply: () => void) => {
    if (!changed) return;
    if (running || paused) stop();
    apply();
    setPreloaded(false);
  };

  const variantPicker = (() => {
    if (instrumentId === 'guitar' || instrumentId === 'bass') {
      const v = instrumentVariants[instrumentId];
      const strings = getAvailableStringCounts(instrumentId);
      const frets = getAvailableFretCounts(instrumentId, v.strings);
      const setStrings = instrumentId === 'guitar' ? setGuitarStrings : setBassStrings;
      const setFrets = instrumentId === 'guitar' ? setGuitarFrets : setBassFrets;
      return (
        <>
          {instrumentId === 'guitar' && (
            <>
              <span className="pick-row-label">{t('Type')}</span>
              <div className="pick-row" role="group" aria-label={t('Type')}>
                {getAvailableGuitarTypes().map((gt) => (
                  <button
                    key={gt}
                    type="button"
                    className={`pick-btn${instrumentVariants.guitar.type === gt ? ' pick-btn-on' : ''}`}
                    aria-pressed={instrumentVariants.guitar.type === gt}
                    onClick={click(() => withReload(
                      instrumentVariants.guitar.type !== gt,
                      () => setGuitarType(gt),
                    ))}
                  >
                    {t(gt === 'acoustic' ? 'Acoustic' : 'Electric')}
                  </button>
                ))}
              </div>
            </>
          )}
          <span className="pick-row-label">{t('Strings')}</span>
          <div className="pick-row" role="group" aria-label={t('Strings')}>
            {strings.map((s) => (
              <button
                key={s}
                type="button"
                className={`pick-btn${v.strings === s ? ' pick-btn-on' : ''}`}
                aria-pressed={v.strings === s}
                onClick={click(() => withReload(s !== v.strings, () => setStrings(s)))}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="pick-row-label">{t('Frets')}</span>
          <div className="pick-row" role="group" aria-label={t('Frets')}>
            {frets.map((f) => (
              <button
                key={f}
                type="button"
                className={`pick-btn${v.frets === f ? ' pick-btn-on' : ''}`}
                aria-pressed={v.frets === f}
                onClick={click(() => withReload(f !== v.frets, () => setFrets(f)))}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      );
    }
    if (instrumentId === 'mandolin') {
      const v = instrumentVariants.mandolin;
      return (
        <>
        <span className="pick-row-label">{t('Frets')}</span>
        <div className="pick-row" role="group" aria-label={t('Frets')}>
          {getAvailableMandolinFretCounts().map((f) => (
            <button
              key={f}
              type="button"
              className={`pick-btn${v.frets === f ? ' pick-btn-on' : ''}`}
              aria-pressed={v.frets === f}
              onClick={click(() => withReload(f !== v.frets, () => setMandolinFrets(f)))}
            >
              {f}
            </button>
          ))}
        </div>
        </>
      );
    }
    if (instrumentId === 'ukulele') {
      const v = instrumentVariants.ukulele;
      return (
        <>
        <span className="pick-row-label">{t('Type')}</span>
        <div className="pick-row pick-row-wrap" role="group" aria-label={t('Type')}>
          {getAvailableUkuleleSizes().map((size) => (
            <button
              key={size}
              type="button"
              className={`pick-btn${v.size === size ? ' pick-btn-on' : ''}`}
              aria-pressed={v.size === size}
              onClick={click(() => withReload(size !== v.size, () => setUkuleleSize(size)))}
            >
              {/* Size name alone doesn't say what actually differs between
                  the four — append tuning and fret range so the row reads as sizes
                  the player can compare, not four interchangeable buttons. */}
              {t(size.charAt(0).toUpperCase() + size.slice(1))} • {getUkuleleTuning(size)} • {getUkuleleVariant(size).maxFret}
            </button>
          ))}
        </div>
        </>
      );
    }
    if (instrumentId === 'banjo') {
      const v = instrumentVariants.banjo;
      return (
        <>
        <span className="pick-row-label">{t('Type')}</span>
        <div className="pick-row pick-row-wrap" role="group" aria-label={t('Type')}>
          {getAvailableBanjoTypes().map((bt) => (
            <button
              key={bt.key}
              type="button"
              className={`pick-btn${v.key === bt.key ? ' pick-btn-on' : ''}`}
              aria-pressed={v.key === bt.key}
              onClick={click(() => withReload(bt.key !== v.key, () => setBanjoType(bt.key)))}
            >
              {/* Two specs (22/24-fret six-string) share one label — the fret
                  count disambiguates them in the button itself. */}
              {t(bt.label)} ({getBanjoVariant(bt.key).maxFret})
            </button>
          ))}
        </div>
        </>
      );
    }
    return null;
  })();

  return (
    <>
      <SettingCard
        anchor="instruments"
        label={t('Instruments')}
        help={t('Switches tuning, string count and fret range, then reloads the note samples.')}
      >
        {(
          [
            [
              ['guitar', '🎸', t('Guitar'), false],
              ['bass', '🎵', t('Bass'), false],
            ],
            [
              ['mandolin', '🎻', t('Mandolin'), true],
              ['banjo', '🪕', t('Banjo'), true],
              ['ukulele', '🎸', t('Ukulele'), true],
            ],
          ] as const
        ).map((row, i) => (
          <div key={i} className="pick-row" role="group" aria-label={t('Instruments')}>
            {row.map(([id, emoji, name, pro]) => {
              const btn = (
                <button
                  key={id}
                  type="button"
                  className={`pick-btn${instrumentId === id ? ' pick-btn-on' : ''}`}
                  aria-pressed={instrumentId === id}
                  onClick={click(() => {
                    if (id === instrumentId) return;
                    if (running || paused) stop();
                    applyInstrument(id);
                    setPreloaded(false);
                  })}
                >
                  {emoji} {name}
                </button>
              );
              return pro
                ? (
                  <ProGate key={id} feature="extraInstruments" variant="inline-badge" pitch={t('Unlock more instruments')}>
                    {btn}
                  </ProGate>
                )
                : btn;
            })}
          </div>
        ))}
        {/* Cascading variant picker for the active instrument — string count
            then fret count for guitar/bass, fret count only for mandolin, a
            single named-type row for ukulele/banjo (see utils/instruments.ts
            for why those two aren't independent axes). */}
        {variantPicker}
        {/* Roadmap instruments the engine can't drill yet — shown to admins
            inside the same card as Guitar/Bass, as a second row of smaller
            disabled buttons, so the plan reads as part of the picker. */}
        {admin && (
          <div className="pick-soon-row" role="group" aria-label={t('Coming soon')}>
            {COMING_SOON_INSTRUMENTS.map((ci) => (
              <button
                key={ci.label}
                type="button"
                className="pick-btn-soon"
                disabled
                aria-disabled="true"
                title={`${t('Coming soon')} — ${ci.tuning}`}
              >
                {ci.emoji} {t(ci.label)}
              </button>
            ))}
          </div>
        )}
      </SettingCard>
      {/* Two display preferences, one tile each. Both are display-only —
          `notesMatch` keeps answer-checking spelling-agnostic. "Note names"
          is letters vs solfège syllables; "Sharps or flats" is which sign an
          enharmonic note (C♯ / D♭) is shown with on the question, the note
          wheel and the feedback line. The sharp/flat primer is worded with
          the vocabulary that matches the chosen notation (A-B-C → "sharp /
          flat"; Do-Re-Mi → "dièse / bémol", i.e. Hebrew "דיאז / במול"). */}
      <SettingCard
        anchor="notation"
        label={t('Note names')}
        pin={<QuickAccessPinButton itemId="notation" />}
        help={
          <>
            {t("Display only — the drill itself doesn't change.")}{' '}
            {t('Letters (A, B, C…) or solfège syllables (Do, Re, Mi…).')}
          </>
        }
      >
        <div className="pick-row" role="group" aria-label={t('Note names')}>
          {([['alpha', 'A B C'], ['solfege', solfegeSample()]] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`pick-btn${notation === val ? ' pick-btn-on' : ''}`}
              aria-pressed={notation === val}
              onClick={click(() => { setNotation(val); saveSetting('pref_notation', val); })}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingCard>
      <SettingCard
        anchor="accidental"
        label={t('Sharps or flats')}
        pin={<QuickAccessPinButton itemId="accidental" />}
        help={
          <>
            {t("Display only — the drill itself doesn't change.")}{' '}
            {notation === 'solfege'
              ? t('A dièse (♯) is a half-step higher; a bémol (♭) is a half-step lower. The same pitch can be written either way — Do♯ and Re♭ are one note. Pick which sign you see.')
              : t('A sharp (♯) is a half-step higher; a flat (♭) is a half-step lower. The same pitch can be written either way — C♯ and D♭ are one note. Pick which sign you see.')}
          </>
        }
      >
        <div className="pick-row" role="group" aria-label={t('Sharps or flats')}>
          {([
            ['sharps', notation === 'solfege' ? t('Dièse (♯)') : t('Sharp (♯)')],
            ['flats', notation === 'solfege' ? t('Bémol (♭)') : t('Flat (♭)')],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`pick-btn${accidental === val ? ' pick-btn-on' : ''}`}
              aria-pressed={accidental === val}
              onClick={click(() => { setAccidental(val); saveSetting('pref_accidental', val); })}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingCard>
      {/* Precise fret-range window (Pro). It used to sit under the neck on
          the home screen; it lives here now, with its own neck picture
          whose dark silhouette tracks the slider. The home-screen neck
          still reflects the chosen window. */}
      <SettingCard
        anchor="fretRange"
        label={t('Fret range')}
        help={t('Drill only part of the neck. Drag the handles to set the exact fret window — the shaded area is muted out, both here and on the home-screen neck.')}
      >
        <ProGate
          feature="fretRange"
          variant="overlay"
          pitch={t('Pick an exact fret N–M window to drill')}
        >
          <div className="fret-range-block">
            <SegmentedControl
              ariaLabel={t('Precise fret range')}
              value={fretRange.useFretRange ? 'on' : 'off'}
              options={[
                { value: 'on', label: t('On') },
                { value: 'off', label: t('Off') },
              ]}
              onChange={() => fretRange.onPreciseToggle()}
            />
            <FretRangeNeck
              instrument={instrument}
              lo={fretRange.fretLo}
              hi={fretRange.fretHi}
              disabled={!fretRange.useFretRange}
            />
            <FretRangeControl
              maxFret={instrument.maxFret}
              lo={fretRange.fretLo}
              hi={fretRange.fretHi}
              onChange={fretRange.onWindow}
              disabled={!fretRange.useFretRange}
            />
          </div>
        </ProGate>
      </SettingCard>
    </>
  );
}
