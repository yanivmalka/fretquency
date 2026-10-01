import { withClick as click } from '../../utils/withClick';
import type { UseGuitarAnswerResult } from '../../hooks/useGuitarAnswer';

/**
 * The one-line pitch-detection status readout shown under the question while
 * answering by playing the guitar. Mirrors `VoiceStatusRow`'s
 * shape and states, with guitar-appropriate copy. Presentation only — <App>
 * owns the `guitarActive` condition and the `guitar` engine state.
 */
export default function GuitarStatusRow({
  guitar, t,
}: {
  guitar: UseGuitarAnswerResult;
  t: (s: string) => string;
}) {
  return (
    <div className={`voice-status guitar-status guitar-${guitar.status}`} role="status" aria-live="polite">
      {guitar.permission === 'denied'
        ? t('🎸 Microphone blocked — enable it or switch to tap')
        : guitar.error === 'not-supported'
          ? t('🎸 Pitch detection isn’t available on this device — use tap')
          : guitar.error
            ? t('🎸 Didn’t catch that')
            : guitar.status === 'listening'
              ? `🎸 ${t('Listening…')}${guitar.partial ? ` “${guitar.partial}”` : ''}`
              : guitar.status === 'heard'
                ? `🎸 “${guitar.partial}”`
                : t('🎸 Play the note on your guitar')}
      {(guitar.status === 'error') && (
        <button className="clear-btn voice-retry" onClick={click(guitar.retry)}>{t('Retry')}</button>
      )}
    </div>
  );
}
