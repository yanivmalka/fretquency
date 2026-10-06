import { useEffect } from 'react';
import { startBackgroundBeat, stopBackgroundBeat, type BeatStyle } from '../utils/backgroundBeat';

/**
 * Plays the background groove exactly while `active` is true, and always
 * stops it on unmount. <App> folds every condition into `active`: the setting
 * is on, the feedback mode is 'sound', answers are tapped (a mic-based answer
 * mode would hear the groove), and a Practice round is playing — not paused,
 * but still on through an Auto Advance hand-off so the pulse doesn't drop out
 * between stages.
 *
 * `style` and `pace` retune it in place while it plays (a style change lands
 * on the next bar line, a pace change on the next step); `pace` is 1 at the
 * round's starting speed and grows as the timing ramp shortens the questions.
 */
export function useBackgroundBeat(active: boolean, style: BeatStyle, pace: number) {
  // Starts it, or — when it is already playing — retunes it in place.
  useEffect(() => {
    if (active) startBackgroundBeat(style, pace);
  }, [active, style, pace]);
  useEffect(() => {
    if (!active) return;
    return () => stopBackgroundBeat();
  }, [active]);
}
