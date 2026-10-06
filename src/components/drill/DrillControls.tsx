import type { ReactNode, RefObject } from 'react';
import { withClick as click } from '../../utils/withClick';
import { playClickSound, haptic } from '../../utils/feedback';

/**
 * The Play button, which becomes a Pause/Resume toggle plus a separate Stop
 * once a round is running or paused. Presentation only — <App> owns the
 * engine and passes its lifecycle handlers in.
 */
export default function DrillControls({
  running, paused, countdown, t, playBtnRef, start, pause, resume, stop, onStopPlan, side,
}: {
  running: boolean;
  paused: boolean;
  countdown: number | null;
  t: (s: string) => string;
  playBtnRef: RefObject<HTMLButtonElement | null>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** Clear any Teacher / interval plan alongside Stop. */
  onStopPlan: () => void;
  /** Floating shortcut bubbles, absolutely placed in the free band left of the
   *  Play button — they take no layout space, so nothing is pushed down. */
  side?: ReactNode;
}) {
  return (
    <div className="controls">
      {side}
      {!running && !paused && !countdown ? (
        <button ref={playBtnRef} className="icon-btn play-btn" onClick={click(start)} title={t('Start')}>
          <svg viewBox="0 0 24 24" width="24" height="24"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>
        </button>
      ) : running || paused ? (
        <>
          <button
            className="icon-btn pause-btn"
            onClick={() => {
              if (paused) resume();
              else pause();
              playClickSound(); haptic.tap();
            }}
            title={paused ? t('Resume') : t('Pause')}
            aria-label={paused ? t('Resume') : t('Pause')}
          >
            <span className={`morph-icon ${paused ? 'is-resume' : 'is-pause'}`}>
              <svg className="icon-pause" viewBox="0 0 24 24" width="24" height="24"><rect x="5" y="4" width="4" height="16" fill="currentColor"/><rect x="15" y="4" width="4" height="16" fill="currentColor"/></svg>
              <svg className="icon-play" viewBox="0 0 24 24" width="24" height="24"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>
            </span>
          </button>
          <button
            className="icon-btn stop-btn-icon"
            onClick={() => { stop(); onStopPlan(); playClickSound(); haptic.tap(); }}
            title={t('Stop')}
            aria-label={t('Stop')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"/></svg>
          </button>
        </>
      ) : null}
    </div>
  );
}
