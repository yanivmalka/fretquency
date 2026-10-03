// ── ScaleTempo — the metronome's controls and its live timing read-out ───
//
// `ScaleTempoCard` sits with the other "Tap the scale in order" options: the
// metronome on/off and the tempo (40–160 BPM) of the scale/box being
// practised. `ScaleTimingStrip` sits above the board during a run: the beat,
// the verdict on the last note (on time / early / late, with where it fell in
// the beat), a mark per note of the run, and the last run's summary with what
// happened to the tempo.
//
// The beat meter is a time line (early ← → late), pinned `dir="ltr"` like the
// neck boards; its ends are labelled, so it reads the same in Hebrew.

import type { TimingJudgement } from '../learning/scaleTiming';
import { NOTES_PER_CLICK, ON_TIME_BEATS, TEMPO_MAX, TEMPO_MIN, TEMPO_STEP, clampTempo, type NotesPerClick } from '../learning/scaleTiming';
import type { ScaleBeat, ScaleRunTiming } from '../hooks/useScaleTempo';
import { useTranslation } from '../i18n/useTranslation';
import { haptic, playClickSound } from '../utils/feedback';

const BEATS_PER_BAR = 4;

export function ScaleTempoCard({ on, onToggle, bpm, mixed, onBpm, perClick, onPerClick }: {
  on: boolean;
  onToggle: (on: boolean) => void;
  /** The tempo shown — the slowest of the scales/boxes being practised. */
  bpm: number;
  /** The scales/boxes being practised don't all share one tempo. */
  mixed: boolean;
  onBpm: (bpm: number) => void;
  /** Notes per click (wishlist item 8); the picker shows only when
   *  `onPerClick` is given. */
  perClick?: NotesPerClick;
  onPerClick?: (n: NotesPerClick) => void;
}) {
  const { t } = useTranslation();
  const click = () => { playClickSound(); haptic.tap(); };
  return (
    <div className="set-card scale-difficulty-switcher scale-tempo-card" role="group" aria-label={t('Metronome')}>
      <span className="set-card-label">{t('Metronome')}</span>
      <div className="scale-difficulty-row">
        <button
          type="button"
          className={`set-card-btn${!on ? ' set-card-btn-primary' : ''}`}
          aria-pressed={!on}
          onClick={() => { click(); onToggle(false); }}
        >
          {t('Off')}
        </button>
        <button
          type="button"
          className={`set-card-btn${on ? ' set-card-btn-primary' : ''}`}
          aria-pressed={on}
          onClick={() => { click(); onToggle(true); }}
        >
          {t('On')}
        </button>
      </div>
      {on && (
        <>
          <div className="scale-tempo-row" dir="ltr">
            <button
              type="button"
              className="set-card-btn scale-tempo-step"
              aria-label={t('Slower')}
              disabled={bpm <= TEMPO_MIN}
              onClick={() => { click(); onBpm(clampTempo(bpm - TEMPO_STEP)); }}
            >
              −
            </button>
            <span className="scale-tempo-value" aria-live="polite">
              <strong>{bpm}</strong> BPM
            </span>
            <button
              type="button"
              className="set-card-btn scale-tempo-step"
              aria-label={t('Faster')}
              disabled={bpm >= TEMPO_MAX}
              onClick={() => { click(); onBpm(clampTempo(bpm + TEMPO_STEP)); }}
            >
              +
            </button>
          </div>
          <input
            type="range"
            className="scale-tempo-slider"
            dir="ltr"
            min={TEMPO_MIN}
            max={TEMPO_MAX}
            step={1}
            value={bpm}
            aria-label={t('Tempo')}
            onChange={(e) => onBpm(clampTempo(Number(e.target.value)))}
          />
          {onPerClick && (
            <div className="scale-difficulty-row" role="group" aria-label={t('Notes per click')}>
              <span className="set-card-help scale-per-click-label">{t('Notes per click')}</span>
              {NOTES_PER_CLICK.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`set-card-btn${(perClick ?? 1) === n ? ' set-card-btn-primary' : ''}`}
                  aria-pressed={(perClick ?? 1) === n}
                  onClick={() => { click(); onPerClick(n); }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          <p className="set-card-help">
            {perClick === 2
              ? t('Play two notes on each click: the down stroke on the click, the up stroke halfway to the next one. Each note is judged against those half-beats, so start slower than usual. After a clean run the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.')
              : t('Play one note on each click. After a clean run — no wrong notes and nearly every note on the click — the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.')}
          </p>
          {mixed && (
            <p className="set-card-help">
              {t('The scales and boxes you picked have different tempos — this sets them all.')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function verdictLabel(j: TimingJudgement): string {
  return j.verdict === 'onTime' ? 'On time' : j.verdict === 'early' ? 'Early' : 'Late';
}

export function ScaleTimingStrip({ bpm, beat, judgements, lastNote, lastRun, perClick }: {
  bpm: number;
  /** At 2 notes per click the tempo reads with two eighth notes (♫). */
  perClick?: NotesPerClick;
  beat: ScaleBeat | null;
  judgements: readonly (TimingJudgement | null)[];
  lastNote: TimingJudgement | null;
  lastRun: ScaleRunTiming | null;
}) {
  const { t } = useTranslation();
  const beatInBar = beat ? beat.index % BEATS_PER_BAR : -1;
  // −½…+½ beat → 0…100% along the meter.
  const pos = (offsetBeats: number) => `${(Math.max(-0.5, Math.min(0.5, offsetBeats)) + 0.5) * 100}%`;
  const zone = `${(0.5 - ON_TIME_BEATS) * 100}%`;
  return (
    <div className="scale-timing">
      <div className="scale-timing-top">
        <span className="scale-timing-beats" dir="ltr" aria-hidden="true">
          {Array.from({ length: BEATS_PER_BAR }, (_, i) => (
            <span
              key={`${beat?.index ?? -1}-${i}`}
              className={`scale-timing-beat${i === 0 ? ' scale-timing-beat-accent' : ''}${i === beatInBar ? ' scale-timing-beat-on' : ''}`}
            />
          ))}
        </span>
        <span className="scale-timing-bpm" dir="ltr">♩ = {bpm}{perClick === 2 ? ' · ♫' : ''}</span>
        {lastNote && (
          <span className={`scale-timing-verdict scale-timing-${lastNote.verdict}`} role="status" aria-live="polite">
            {t(verdictLabel(lastNote))}
          </span>
        )}
      </div>
      {/* The labels belong to the time line, so they share its direction. */}
      <div className="scale-timing-meter-wrap" dir="ltr">
        <span className="scale-timing-end">{t('Early')}</span>
        <div className="scale-timing-meter" style={{ ['--zone' as string]: zone }}>
          <span className="scale-timing-zone" />
          <span className="scale-timing-center" />
          {lastNote && (
            <span className={`scale-timing-needle scale-timing-${lastNote.verdict}`} style={{ left: pos(lastNote.offsetBeats) }} />
          )}
        </div>
        <span className="scale-timing-end">{t('Late')}</span>
      </div>
      {judgements.length > 0 && (
        <div className="scale-timing-notes" dir="ltr" aria-hidden="true">
          {judgements.map((j, i) => (
            <span key={i} className={`scale-timing-note${j ? ` scale-timing-${j.verdict}` : ''}`} />
          ))}
        </div>
      )}
      {lastRun && <ScaleRunSummary run={lastRun} />}
    </div>
  );
}

export function ScaleRunSummary({ run }: { run: ScaleRunTiming }) {
  const { t } = useTranslation();
  const { summary } = run;
  return (
    <p className="set-card-help scale-timing-summary">
      <span>
        {t('Last run')}: {t('on the click')} {summary.onTime}/{summary.total}
        {' · '}{t('early')} {summary.early}{' · '}{t('late')} {summary.late}
      </span>
      {summary.tendency && (
        <span>
          {summary.tendency === 'rushing'
            ? t('You are rushing — wait for the click.')
            : t('You are dragging — play right on the click.')}
        </span>
      )}
      <span className={run.clean ? 'scale-timing-onTime' : undefined}>
        {run.clean
          ? run.nextBpm > run.bpm
            ? <>{t('Clean run! Tempo up to')} <span dir="ltr">{run.nextBpm} BPM</span></>
            : t('Clean run at the top tempo!')
          : <>{t('Not clean yet — the tempo stays at')} <span dir="ltr">{run.bpm} BPM</span></>}
      </span>
    </p>
  );
}
