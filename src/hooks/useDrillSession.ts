// ── useDrillSession — the shared drill-session facade ─────────────────────
//
// A thin wrapper around useGameEngine that both Practice and (later) Game run
// a drill through:
//
//     DrillConfig → useDrillSession → { …session state/actions, result }
//
// It does not reimplement any drill logic — question generation, pickSmartFret,
// the shuffle-bag/coverage pool, byFret/byNote flow, notesMatch, remainingFrets,
// timers, scoring, streaks, the timing ramp, history writes and Auto Advance's
// `onComplete` all still live in useGameEngine / useScoring / useHistory.
// This hook only:
//   • translates the platform-neutral DrillConfig into the engine's `settings`,
//   • fills in the setters the engine takes but the app never drives (only the
//     asked-string setter is real today),
//   • exposes a `result: SessionResult` derived from the session score + the
//     drill's recorded history.
//
// The engine's own `start / stop / pause / resume / selectFret / selectAnswer`
// and all of its render state are re-exposed unchanged.

import { useMemo } from 'react';
import { useGameEngine } from './useGameEngine';
import type { EngineDisplay, GameSetters, HistoryOps, ScoreOps } from './useGameEngine';
import type { SessionScore } from './useScoring';
import {
  drillConfigToGameSettings,
  computeSessionResult,
  type DrillConfig,
  type SessionResult,
} from '../drill/DrillConfig';

// Every engine setter except the asked-string one is a no-op in the app today
// (settings are owned by useSelector, not pushed back by the engine). The
// facade supplies these so callers pass only the real collaborator.
const NOOP_SETTERS: Omit<GameSetters, 'setGuitarString'> = {
  setTime: () => {}, setFretFrom: () => {}, setFretTo: () => {},
  setAccidental: () => {}, setOrder: () => {}, setWholeToneOnly: () => {},
  setDotsOnly: () => {}, setByNote: () => {}, setMultiStrings: () => {},
  setByString: () => {}, setStageIndex: () => {},
};

export interface DrillCollaborators {
  /** The engine calls this with the string it is currently asking about, so
   *  multi-string drills keep the rest of the app in sync. */
  setActiveString: (stringNum: number) => void;
  /** History sink for this drill — already scoped to the caller's history key. */
  history: HistoryOps;
  /** Scoring callbacks plus the live session score (the score drives
   *  `result`; the callbacks are handed straight to the engine). */
  scoring: ScoreOps & { session: SessionScore };
  /** Fired when the drill ends because every question was answered — never on
   *  a manual stop or a pause. Practice uses this for Auto Advance. */
  onComplete?: () => void;
  /** UI language + note-name notation for the feedback line. */
  display?: EngineDisplay;
}

export function useDrillSession(config: DrillConfig, collab: DrillCollaborators) {
  const engine = useGameEngine(
    drillConfigToGameSettings(config),
    { setGuitarString: collab.setActiveString, ...NOOP_SETTERS },
    collab.history,
    collab.scoring,
    { onComplete: collab.onComplete },
    collab.display,
  );

  const result = useMemo<SessionResult>(
    () => computeSessionResult(
      collab.scoring.session, collab.history.history, config.questionCount,
    ),
    [collab.scoring.session, collab.history.history, config.questionCount],
  );

  return { ...engine, result };
}
