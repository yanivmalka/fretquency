import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from '../tuner/pitchDetect';
import { frequencyToNote } from '../tuner/noteUtils';
import { isSoundPlaying } from '../utils/audio';
import {
  LOW_BAND_HZ, REPORT_LAG_MS, agreesWithRecent, chooseNoteOnset, createOnsetTracker, locatePitchStart, lowBandFrame,
  type OnsetSource,
} from '../utils/onset';

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
//
// `timing` (the metronome is on): each note also gets its start time — when
// it was plucked, not when the detector got sure of it (`onset.ts`) — and the
// mic is low-passed to the guitar band first, so the metronome's click
// (`metronome.ts`, kept above that band) is neither read as a note nor taken
// for a pluck. Without it the listener is unchanged.

export type PitchStreamStatus = 'idle' | 'listening' | 'error';

export interface PitchNoteInfo {
  /** When the note started, on the `performance.now()` clock. */
  at: number;
  source: OnsetSource;
}
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
/** With `timing`: ~680 ms of history, so a note first read late by the
 *  detector still has its pluck in view. The detector reads the newest
 *  `FFT_SIZE` samples of it, as before. */
const TIMING_HISTORY = 32768;
const ONSET_MEMORY = 8;

function isPitchStreamSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const AudioContextCtor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return !!navigator.mediaDevices?.getUserMedia && !!AudioContextCtor;
}

export function usePitchStream({ enabled, onNote, timing = false }: {
  enabled: boolean;
  /** Called once per new note with its MIDI number and when it started. */
  onNote: (midi: number, info: PitchNoteInfo) => void;
  /** Time each note's pluck and filter out the metronome's click. */
  timing?: boolean;
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
        analyser.fftSize = timing ? TIMING_HISTORY : FFT_SIZE;
        const source = audioContext.createMediaStreamSource(s);
        if (timing) {
          // Two low-pass stages: the click's band (≥ 2.5 kHz) is gone before
          // the detector or the onset tracker see the signal.
          let tail: AudioNode = source;
          for (let i = 0; i < 2; i++) {
            const lp = audioContext.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = LOW_BAND_HZ;
            lp.Q.value = Math.SQRT1_2;
            tail.connect(lp);
            tail = lp;
          }
          tail.connect(analyser);
        } else {
          source.connect(analyser);
        }
        const history = new Float32Array(analyser.fftSize);
        const buffer = history.subarray(history.length - FFT_SIZE);
        const sampleRate = audioContext.sampleRate;
        // The mic's own delay, where the browser reports it (seconds).
        const trackLatency = (s.getAudioTracks()[0]?.getSettings() as MediaTrackSettings & { latency?: number })?.latency;
        const inputLatencyMs = typeof trackLatency === 'number' && Number.isFinite(trackLatency) ? trackLatency * 1000 : 0;
        const tracker = createOnsetTracker();
        const energyOnsets: number[] = [];
        setError(null);
        setStatus('listening');

        let lastTickAt = 0;
        let lastHeardAt = 0;
        let streak = { midi: -1, ticks: 0, firstSeenAt: 0, pitchStart: null as number | null };
        let reported = -1;
        const loop = () => {
          if (!alive) return;
          raf = requestAnimationFrame(loop);
          const now = performance.now();
          if (timing) {
            if (isSoundPlaying()) tracker.reset();
            else {
              analyser.getFloatTimeDomainData(history);
              const onset = tracker.push(now, lowBandFrame(history, sampleRate));
              if (onset != null) {
                energyOnsets.push(onset);
                if (energyOnsets.length > ONSET_MEMORY) energyOnsets.shift();
              }
            }
          }
          if (now - lastTickAt < TICK_MS) return;
          lastTickAt = now;
          // The app's own note is sounding — don't mistake it for the guitar.
          if (isSoundPlaying()) { streak = { midi: -1, ticks: 0, firstSeenAt: 0, pitchStart: null }; return; }
          if (!timing) analyser.getFloatTimeDomainData(history);
          const result = detectPitch(buffer, sampleRate);
          if (!result) {
            streak = { midi: -1, ticks: 0, firstSeenAt: 0, pitchStart: null };
            if (now - lastHeardAt >= SILENCE_RESET_MS) { reported = -1; setPartial(''); }
            return;
          }
          lastHeardAt = now;
          const note = frequencyToNote(result.frequency);
          // A window straddling two notes can read a third that nobody
          // played; with timing on, wait until the newest stretch agrees.
          if (timing && !agreesWithRecent(history, sampleRate, note.midi)) {
            streak = { midi: -1, ticks: 0, firstSeenAt: 0, pitchStart: null };
            return;
          }
          setPartial(`${note.name}${note.octave}`);
          if (streak.midi === note.midi) streak.ticks += 1;
          else {
            const age = timing ? locatePitchStart(history, sampleRate, result.frequency) : null;
            streak = { midi: note.midi, ticks: 1, firstSeenAt: now, pitchStart: age == null ? null : now - age };
          }
          if (streak.ticks >= REQUIRED_STABLE_TICKS && note.midi !== reported) {
            reported = note.midi;
            const seenAt = streak.firstSeenAt;
            let info: PitchNoteInfo;
            if (timing) {
              const energy = energyOnsets.filter((t) => t <= seenAt + 20).pop() ?? null;
              const chosen = chooseNoteOnset(energy, streak.pitchStart, seenAt);
              info = { at: chosen.at - inputLatencyMs, source: chosen.source };
            } else {
              info = { at: seenAt - REPORT_LAG_MS, source: 'report' };
            }
            onNoteRef.current(note.midi, info);
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
  }, [enabled, supported, retryEpoch, timing]);

  return { supported, status, partial, error, retry };
}
