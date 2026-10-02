// ── useScaleTempo — the metronome for "Tap the scale in order" ──────────
//
// Owns the click track (`metronome.ts`) for a session and judges every note
// the learner plays against it (`scaleTiming.ts`):
// - each scale is clicked at its own stored tempo (per scale/box), and the
//   metronome starts with the session's first scale — inside the Start tap,
//   so the audio context is allowed to sound;
// - every answered step — a tap, or a pluck timed by `usePitchStream` — is
//   judged against the nearest click: on time within ±⅙ beat, else early or
//   late, shown live;
// - at the end of each run a summary; after a clean run (no slips, nearly
//   every note on time) that scale/box's tempo goes up by `TEMPO_STEP`.
//
// Wire `onQuestionStart` / `onStepHit` / `demoTiming` into
// `useScaleOrderEngine` only while the metronome is on (without them the
// engine is unchanged), and call `stop` whenever its session isn't running.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Metronome } from '../utils/metronome';
import { getAudioContext, unlockAudio } from '../utils/audio';
import { scaleItemId } from '../learning/scaleItem';
import {
  TEMPO_DEFAULT, beatMsFor, isCleanRun, judgeNote, nextTempo, summarizeTiming, tempoFor,
  type TempoMap, type TimingJudgement, type TimingSummary,
} from '../learning/scaleTiming';
import type { ScaleQuestion } from '../learning/scaleDrill';
import type { ScaleStepHit } from './useScaleOrderEngine';

/** The demo starts on a click at least this far off, so it isn't rushed. */
const DEMO_MIN_LEAD_MS = 400;

export interface ScaleRunTiming {
  summary: TimingSummary;
  clean: boolean;
  /** Tempo the run was played at, and the tempo stored after it. */
  bpm: number;
  nextBpm: number;
}

export interface ScaleBeat {
  index: number;
  accent: boolean;
}

export function useScaleTempo({ enabled, tempoMap, setTempo }: {
  /** Metronome switched on for this exercise. */
  enabled: boolean;
  tempoMap: TempoMap;
  setTempo: (itemIds: readonly string[], bpm: number) => void;
}) {
  const metronomeRef = useRef<Metronome | null>(null);
  const metronome = useCallback(() => {
    if (!metronomeRef.current) metronomeRef.current = new Metronome(getAudioContext);
    return metronomeRef.current;
  }, []);

  const tempoMapRef = useRef(tempoMap);
  useEffect(() => { tempoMapRef.current = tempoMap; }, [tempoMap]);
  const itemRef = useRef<string | null>(null);
  const bpmRef = useRef(TEMPO_DEFAULT);
  const judgementsRef = useRef<TimingJudgement[]>([]);

  const [bpm, setBpm] = useState(TEMPO_DEFAULT);
  /** Verdict per step of the current run (`null` = not played yet). */
  const [judgements, setJudgements] = useState<(TimingJudgement | null)[]>([]);
  const [lastNote, setLastNote] = useState<TimingJudgement | null>(null);
  const [lastRun, setLastRun] = useState<ScaleRunTiming | null>(null);
  const [beat, setBeat] = useState<ScaleBeat | null>(null);

  /** Silence the click — the host calls this whenever its session isn't
   *  running (the engine is created after this hook, so it can't be passed in). */
  const stop = useCallback(() => { metronomeRef.current?.stop(); }, []);
  useEffect(() => { if (!enabled) stop(); }, [enabled, stop]);
  useEffect(() => () => metronomeRef.current?.stop(), []);
  useEffect(() => {
    if (!enabled) return;
    return metronome().subscribe((b) => setBeat({ index: b.index, accent: b.accent }));
  }, [enabled, metronome]);

  /** From the Start tap: lets the audio context sound on mobile. */
  const prime = useCallback(() => {
    if (enabled) unlockAudio();
    setLastRun(null);
  }, [enabled]);

  const onQuestionStart = useCallback((q: ScaleQuestion, runLength: number) => {
    const id = scaleItemId(q.scaleTypeId, q.positionIndex);
    itemRef.current = id;
    const next = tempoFor(tempoMapRef.current, id);
    bpmRef.current = next;
    setBpm(next);
    judgementsRef.current = [];
    setJudgements(Array.from({ length: runLength }, () => null));
    setLastNote(null);
    const m = metronome();
    if (m.running) m.setBpm(next);
    else m.start(next);
  }, [metronome]);

  const onStepHit = useCallback((hit: ScaleStepHit) => {
    const m = metronomeRef.current;
    if (!m) return;
    const j = judgeNote(hit.at, m.heardBeats(), beatMsFor(bpmRef.current));
    if (!j) return;
    judgementsRef.current = [...judgementsRef.current, j];
    setLastNote(j);
    setJudgements((prev) => {
      const next = prev.length === hit.runLength ? [...prev] : Array.from({ length: hit.runLength }, (_, i) => prev[i] ?? null);
      next[hit.step] = j;
      return next;
    });
    if (hit.step !== hit.runLength - 1) return;
    const summary = summarizeTiming(judgementsRef.current);
    const clean = isCleanRun(summary, hit.runLength, hit.slipped);
    const played = bpmRef.current;
    const raised = nextTempo(played, clean);
    if (raised !== played && itemRef.current) setTempo([itemRef.current], raised);
    setLastRun({ summary, clean, bpm: played, nextBpm: raised });
  }, [setTempo]);

  /** Learning mode in time: the demo starts on a click, one note per beat. */
  const demoTiming = useCallback(() => {
    const m = metronomeRef.current;
    if (!m?.running) return null;
    return { leadMs: m.msToBeatAfter(DEMO_MIN_LEAD_MS), noteMs: beatMsFor(bpmRef.current) };
  }, []);

  return { bpm, beat, judgements, lastNote, lastRun, prime, stop, onQuestionStart, onStepHit, demoTiming };
}
