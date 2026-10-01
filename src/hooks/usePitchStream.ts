import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from '../tuner/pitchDetect';
import { frequencyToNote } from '../tuner/noteUtils';
import { isSoundPlaying } from '../utils/audio';

// ── usePitchStream ──────────────────────────────────────────────────────
//
// A continuous "what is being played on the guitar" listener, for exercises
// where the learner plays several notes in a row (Scales → "Tap the scale in
// order"). Same detector as `useGuitarAnswer` (`src/tuner/pitchDetect.ts`),
// but where that hook commits one note per question and closes the mic, this
// one keeps the mic open while `enabled` and reports every new note:
//
// - a pitch must hold for `REQUIRED_STABLE_TICKS` ticks before it counts, so
//   a sliding finger or a brushed string isn't reported;
// - a note is reported once, when it starts — a string left ringing is not
//   reported again. The same pitch counts again only after a short silence
//   (`SILENCE_RESET_MS`), i.e. when it is plucked again;
// - nothing is read while the app itself is sounding a note
//   (`isSoundPlaying`), so the detector never hears the speaker.
//
// Values read inside the rAF loop live in refs; state only for rendering.

export type PitchStreamStatus = 'idle' | 'listening' | 'error';
export type PitchStreamError = 'no-permission' | 'not-supported' | null;

export interface UsePitchStreamResult {
  supported: boolean;
  status: PitchStreamStatus;
  /** The live reading ("G3"), for display; '' when nothing is heard. */
  partial: string;
  error: PitchStreamError;
  /** Re-open the mic after an error. */
  retry: () => void;
}

const REQUIRED_STABLE_TICKS = 2;
const TICK_MS = 120;
const SILENCE_RESET_MS = 300;
const FFT_SIZE = 8192;

function isPitchStreamSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const AudioContextCtor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return !!navigator.mediaDevices?.getUserMedia && !!AudioContextCtor;
}

export function usePitchStream({ enabled, onNote }: {
  enabled: boolean;
  /** Called once per new note with its MIDI number. */
  onNote: (midi: number) => void;
}): UsePitchStreamResult {
  const supported = isPitchStreamSupported();

  const [status, setStatus] = useState<PitchStreamStatus>('idle');
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<PitchStreamError>(null);
  const [retryEpoch, setRetryEpoch] = useState(0);

  const onNoteRef = useRef(onNote);
  useEffect(() => { onNoteRef.current = onNote; }, [onNote]);

  const retry = useCallback(() => {
    setError(null);
    setRetryEpoch((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !supported) return;
    let alive = true;
    let raf: number | null = null;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    const teardown = () => {
      alive = false;
      if (raf !== null) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      if (ctx) void ctx.close();
    };

    // The state writes happen in the async open below, not synchronously in
    // the effect body.
    void (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (!alive) { s.getTracks().forEach((track) => track.stop()); return; }
        stream = s;
        const AudioContextCtor = window.AudioContext
          ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextCtor();
        ctx = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        audioContext.createMediaStreamSource(s).connect(analyser);
        const buffer = new Float32Array(analyser.fftSize);
        setError(null);
        setStatus('listening');

        let lastTickAt = 0;
        let lastHeardAt = 0;
        let streak = { midi: -1, ticks: 0 };
        let reported = -1;
        const loop = () => {
          if (!alive) return;
          raf = requestAnimationFrame(loop);
          const now = performance.now();
          if (now - lastTickAt < TICK_MS) return;
          lastTickAt = now;
          // The app's own note is sounding — don't mistake it for the guitar.
          if (isSoundPlaying()) { streak = { midi: -1, ticks: 0 }; return; }
          analyser.getFloatTimeDomainData(buffer);
          const result = detectPitch(buffer, audioContext.sampleRate);
          if (!result) {
            streak = { midi: -1, ticks: 0 };
            if (now - lastHeardAt >= SILENCE_RESET_MS) { reported = -1; setPartial(''); }
            return;
          }
          lastHeardAt = now;
          const note = frequencyToNote(result.frequency);
          setPartial(`${note.name}${note.octave}`);
          if (streak.midi === note.midi) streak.ticks += 1;
          else streak = { midi: note.midi, ticks: 1 };
          if (streak.ticks >= REQUIRED_STABLE_TICKS && note.midi !== reported) {
            reported = note.midi;
            onNoteRef.current(note.midi);
          }
        };
        raf = requestAnimationFrame(loop);
      } catch (err) {
        if (!alive) return;
        const isDenied = err instanceof DOMException
          && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
        setError(isDenied ? 'no-permission' : 'not-supported');
        setStatus('error');
      }
    })();

    return () => {
      teardown();
      setStatus('idle');
      setPartial('');
    };
  }, [enabled, supported, retryEpoch]);

  return { supported, status, partial, error, retry };
}
