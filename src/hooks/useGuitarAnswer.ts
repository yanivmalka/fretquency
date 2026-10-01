import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from '../tuner/pitchDetect';
import { frequencyToNote } from '../tuner/noteUtils';
import { isSoundPlaying, soundRemainingMs } from '../utils/audio';

// ── useGuitarAnswer ─────────────────────────────────────────────────────
//
// The "answer by playing the note on the guitar" mode. Reuses the
// tuner's pitch detector (`src/tuner/pitchDetect.ts`) the same way the
// throwaway measurement tool at `src/pitchSpike/` does — listen for a
// pitch-class match held stable for a couple of ticks, then commit it.
//
// Only "by fret" questions (answer = a note name) are supported: a played
// note's pitch says which note it is, not which string/fret produced it, so
// there is no way to answer a "by note" question (answer = a specific fret)
// this way. The driver effect below simply never activates while `byNote`
// is true, and the caller falls back to tap for that question type.
//
// The question itself still plays its target note aloud (unchanged) — the
// driver effect waits for that playback to finish (`isSoundPlaying`/
// `soundRemainingMs` from `utils/audio`) before it starts listening, so the
// detector never mistakes the app's own speaker output for the learner's
// answer. It only starts capturing once the room should be quiet again.
//
// Per the repo's timer conventions, values read inside the rAF pitch-polling
// loop are kept in refs; state exists only for what the UI renders.

export type GuitarAnswerStatus = 'idle' | 'listening' | 'heard' | 'error';
export type GuitarMicPermission = 'unknown' | 'granted' | 'denied';
export type GuitarAnswerError = 'no-permission' | 'not-supported' | null;

export interface UseGuitarAnswerParams {
  /** Master switch — the user's "answer by guitar" preference. */
  enabled: boolean;
  running: boolean;
  paused: boolean;
  answered: boolean;
  byNote: boolean;
  /** Bumped once per question / "where else?" sub-round by useGameEngine. */
  questionSeq: number;
  /** True while a question is actually on screen (a fret is highlighted). */
  hasActiveQuestion: boolean;
  /** Called with a recognised note name ("C", "F#") — wire to selectAnswer. */
  onNote: (note: string) => void;
}

export interface UseGuitarAnswerResult {
  supported: boolean;
  status: GuitarAnswerStatus;
  /** Most recent live pitch reading ("G3"), for display. */
  partial: string;
  error: GuitarAnswerError;
  permission: GuitarMicPermission;
  /** Prompt for microphone access; resolves to whether it is now granted. */
  ensurePermission: () => Promise<boolean>;
  /** Manually restart listening for the current question. */
  retry: () => void;
}

// A detected pitch class must stay stable this many polling ticks before it
// counts as an answer, so a sliding fretting hand or a brushed adjacent
// string isn't scored as a wrong note.
const REQUIRED_STABLE_TICKS = 2;
const TICK_MS = 120;
const FFT_SIZE = 8192;

function isGuitarAnswerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const AudioContextCtor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return !!navigator.mediaDevices?.getUserMedia && !!AudioContextCtor;
}

export function useGuitarAnswer(params: UseGuitarAnswerParams): UseGuitarAnswerResult {
  const supported = isGuitarAnswerSupported();

  const [status, setStatus] = useState<GuitarAnswerStatus>('idle');
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<GuitarAnswerError>(null);
  const [permission, setPermission] = useState<GuitarMicPermission>('unknown');

  const pRef = useRef(params);
  useEffect(() => { pRef.current = params; });
  const permissionRef = useRef<GuitarMicPermission>('unknown');
  useEffect(() => { permissionRef.current = permission; }, [permission]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer>>(new Float32Array(FFT_SIZE));
  const lastTickAtRef = useRef(0);
  const listeningRef = useRef(false);
  const stableStreakRef = useRef({ midi: -1, ticks: 0 });

  const teardown = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    const wasListening = listeningRef.current;
    listeningRef.current = false;
    teardown();
    setPartial('');
    if (wasListening) setStatus((s) => (s === 'heard' ? s : 'idle'));
  }, [teardown]);

  const startNow = useCallback(async () => {
    if (!supported || permissionRef.current === 'denied' || listeningRef.current) return;
    listeningRef.current = true;
    stableStreakRef.current = { midi: -1, ticks: 0 };
    setError(null);
    setPartial('');
    setStatus('listening');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      if (!listeningRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const AudioContextCtor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);
      permissionRef.current = 'granted';
      setPermission('granted');
      lastTickAtRef.current = 0;

      const loop = () => {
        if (!listeningRef.current || !analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const result = detectPitch(bufferRef.current, audioContext.sampleRate);
        const now = performance.now();
        if (result && now - lastTickAtRef.current >= TICK_MS) {
          lastTickAtRef.current = now;
          const note = frequencyToNote(result.frequency);
          setPartial(`${note.name}${note.octave}`);
          const streak = stableStreakRef.current;
          if (streak.midi === note.midi) streak.ticks += 1;
          else stableStreakRef.current = { midi: note.midi, ticks: 1 };
          if (stableStreakRef.current.ticks >= REQUIRED_STABLE_TICKS) {
            listeningRef.current = false;
            setStatus('heard');
            teardown();
            pRef.current.onNote(note.name);
            return;
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      listeningRef.current = false;
      const isDenied = err instanceof DOMException
        && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      if (isDenied) {
        permissionRef.current = 'denied';
        setPermission('denied');
      }
      setError(isDenied ? 'no-permission' : 'not-supported');
      setStatus('error');
    }
  }, [supported, teardown]);

  const retry = useCallback(() => {
    setError(null);
    void startNow();
  }, [startNow]);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      permissionRef.current = 'granted';
      setPermission('granted');
      return true;
    } catch {
      permissionRef.current = 'denied';
      setPermission('denied');
      return false;
    }
  }, [supported]);

  const {
    enabled, running, paused, answered, byNote, hasActiveQuestion, questionSeq,
  } = params;

  // Drive listening from game state, exactly like useVoiceAnswer's driver
  // effect: a change in questionSeq means a fresh question, so a new listen
  // turn begins. The actual start (which sets state) is deferred to a timer
  // rather than called synchronously from the effect body — and, unlike
  // useVoiceAnswer, that timer waits out the question's own note-preview
  // audio first (re-checking after each wait, in case playback was still
  // being scheduled), so listening only begins once the app itself has gone
  // quiet again.
  useEffect(() => {
    const active =
      enabled && supported && !byNote && running && !paused && !answered && hasActiveQuestion;
    if (!active) { stopListening(); return; }
    let timer: number;
    const startWhenQuiet = () => {
      if (isSoundPlaying()) {
        timer = window.setTimeout(startWhenQuiet, soundRemainingMs() + 30);
      } else {
        void startNow();
      }
    };
    timer = window.setTimeout(startWhenQuiet, 0);
    return () => { window.clearTimeout(timer); stopListening(); };
  }, [enabled, supported, byNote, running, paused, answered, hasActiveQuestion, questionSeq, startNow, stopListening]);

  useEffect(() => () => teardown(), [teardown]);

  return { supported, status, partial, error, permission, ensurePermission, retry };
}
