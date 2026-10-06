import { useEffect } from 'react';
import { startBackgroundBeat, stopBackgroundBeat } from '../utils/backgroundBeat';

/**
 * Plays the background beat loop exactly while `active` is true, and always
 * stops it on unmount. <App> folds every condition into `active`: the setting
 * is on, the feedback mode is 'sound', answers are tapped (a mic-based answer
 * mode would hear the loop), and a Practice round is playing — not paused,
 * but still on through an Auto Advance hand-off so the pulse doesn't drop out
 * between stages.
 */
export function useBackgroundBeat(active: boolean) {
  useEffect(() => {
    if (!active) return;
    startBackgroundBeat();
    return () => stopBackgroundBeat();
  }, [active]);
}
