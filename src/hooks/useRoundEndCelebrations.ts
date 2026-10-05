import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import { celebrateTier3 } from '../utils/feedback';
import { loadBest, saveBest } from '../utils/personalBest';
import { suggestAdjustment } from '../utils/progress';
import { historyForInstrument, flattenHistory } from '../utils/mastery';
import type { StageStep } from '../utils/stageSequence';
import { computeMyStats, leaderboardName, upsertMyEntry } from '../utils/leaderboard';
import { mergeCelebrated } from '../utils/badgeCelebration';
import { trackRoundFinished } from '../utils/analytics';
import {
  badgeDef, evaluateSession, evaluateLifetime, awardFamilyUpTo, earnedTier,
  type BadgeId, type SessionSnapshot, type LifetimeSnapshot, type Tier,
} from '../utils/badges';
import type { CelebratedBadge } from '../components/BadgeCelebration';
import type { useAuth } from './useAuth';
import type { useScoring } from './useScoring';
import type { useSelector } from './useSelector';
import type { useHistory } from './useHistory';
import type { InstrumentConfig } from '../utils/instruments';
import type { TeacherPlan } from '../learning/planner';
import type { DrillConfig, SessionResult } from '../drill/DrillConfig';
import type { HistoryEntry } from '../utils/music';

/** What the end-of-round card offers as a one-tap "what's next". */
export type RoundSuggestion =
  | { kind: 'nextStage'; step: StageStep }
  | { kind: 'exploreLearn' };

interface Params {
  running: boolean;
  paused: boolean;
  pendingAutoAdvance: boolean;
  /** Whether the run now ending reached its last question on its own, rather
   *  than a manual Stop — read once when `running` falls to false, decides the
   *  end-of-round card's title. */
  completedNaturally: boolean;
  scoring: ReturnType<typeof useScoring>;
  selector: ReturnType<typeof useSelector>;
  sessionResult: SessionResult;
  historyOps: ReturnType<typeof useHistory>;
  instrument: InstrumentConfig;
  showScore: boolean;
  histKey: string;
  wasTeacherRunRef: MutableRefObject<boolean>;
  wasIntervalRunRef: MutableRefObject<boolean>;
  teacherPlanRef: MutableRefObject<TeacherPlan | null>;
  intervalPlanRef: MutableRefObject<DrillConfig | null>;
  auth: ReturnType<typeof useAuth>;
  allHistoryEntries: HistoryEntry[];
  gameEnded: boolean;
  setGameEnded: (v: boolean) => void;
  setRevealBadges: Dispatch<SetStateAction<CelebratedBadge[]>>;
}

/**
 * Round-end celebrations (A32): the mid-game badge sweep + slide-in toasts, the
 * game-end pass (new personal best → Tier 3 celebration, final badge sweep →
 * reveal overlay, plan tear-down), and the post-run leaderboard upsert.
 *
 * `beginRun(isTeacher, isInterval)` clears the per-run state (badge guards,
 * toast queue, PB guard) — called by `start()` and on a historyKey change.
 */
export function useRoundEndCelebrations({
  running, paused, pendingAutoAdvance, completedNaturally, scoring, selector, sessionResult,
  historyOps, instrument, showScore, histKey,
  wasTeacherRunRef, wasIntervalRunRef, teacherPlanRef, intervalPlanRef,
  auth, allHistoryEntries,
  gameEnded, setGameEnded, setRevealBadges,
}: Params) {
  // Guards the Tier 3 (new personal best) celebration so it fires at most once
  // per completed run.
  const tier3FiredRef = useRef(false);
  // Guards badge evaluation so it runs at most once per completed run.
  const badgesFiredRef = useRef(false);
  // Every badge newly earned this run (mid-game sweeps + the final one), keyed
  // by family. Feeds the game-end summary list and the reveal finale.
  const [newBadges, setNewBadges] = useState<CelebratedBadge[]>([]);
  const newBadgesRef = useRef<CelebratedBadge[]>([]);
  useEffect(() => { newBadgesRef.current = newBadges; }, [newBadges]);
  // Pending top-of-screen toasts (one shown at a time).
  const [toastQueue, setToastQueue] = useState<CelebratedBadge[]>([]);
  // Whether the round the end-of-round card is about to describe reached its
  // last question on its own — captured once when `gameEnded` is raised, so
  // the card's title doesn't flip if `completedNaturally` changes afterward.
  const [roundCompletedNaturally, setRoundCompletedNaturally] = useState(true);
  // The "what's next" nudge the end-of-round card offers, or null when recent
  // accuracy on this combination doesn't clear the bar.
  const [suggestion, setSuggestion] = useState<RoundSuggestion | null>(null);
  // Last answered-question count a mid-game badge sweep ran at, so each answer
  // triggers at most one sweep. A per-run running id for celebrated badges.
  const midSweepCountRef = useRef(0);
  const badgeUidRef = useRef(0);

  const beginRun = useCallback((isTeacher: boolean, isInterval: boolean) => {
    tier3FiredRef.current = false;
    wasTeacherRunRef.current = isTeacher;
    wasIntervalRunRef.current = isInterval;
    badgesFiredRef.current = false;
    setNewBadges([]);
    midSweepCountRef.current = 0;
    setToastQueue([]);
    setRevealBadges([]);
    setSuggestion(null);
  }, [wasTeacherRunRef, wasIntervalRunRef, setRevealBadges]);

  // Evaluate this run's session badges plus a retroactive pass over all-time
  // history, award every reached tier (idempotent), and return the families
  // that were genuinely new this call. Mid-game it drops the badges that a
  // later answer could still invalidate.
  const sweepBadges = useCallback((midGame: boolean): CelebratedBadge[] => {
    const sessionSnap: SessionSnapshot = {
      questionsAnswered: scoring.session.questionsAnswered,
      maxQuestions: intervalPlanRef.current
        ? intervalPlanRef.current.questionCount
        : teacherPlanRef.current
          ? teacherPlanRef.current.drill.questionCount
          : selector.runQuestionCount(),
      longestStreak: scoring.session.longestStreak,
      entries: historyOps.history,
      instrument,
    };
    const lifetimeSnap: LifetimeSnapshot = {
      instrumentEntries: historyForInstrument(historyOps.allHistory, instrument.id),
      allEntries: flattenHistory(historyOps.allHistory),
      instrument,
    };
    const reached: Partial<Record<BadgeId, Tier>> = {
      ...evaluateSession(sessionSnap),
      ...evaluateLifetime(lifetimeSnap),
    };
    if (midGame) {
      delete reached.perfect_session;
      delete reached.flawless_sprint;
      delete reached.every_string;
    }
    const earned: CelebratedBadge[] = [];
    for (const [idStr, tier] of Object.entries(reached) as [BadgeId, Tier | undefined][]) {
      if (!tier) continue;
      const def = badgeDef(idStr, instrument);
      if (!def) continue;
      const prevTier = earnedTier(idStr, instrument.id);
      const newly = awardFamilyUpTo(idStr, instrument.id, tier, def.levels);
      if (newly.length > 0) {
        earned.push({
          uid: ++badgeUidRef.current,
          id: idStr,
          tier: newly[newly.length - 1],
          upgrade: prevTier !== null,
        });
      }
    }
    return earned;
  }, [
    scoring.session.questionsAnswered, scoring.session.longestStreak,
    selector, historyOps.history, historyOps.allHistory, instrument,
    intervalPlanRef, teacherPlanRef,
  ]);

  // Mid-game achievement check: after every answered question, sweep for newly
  // earned badges and slide a toast in from the top for each.
  useEffect(() => {
    if (!running || paused) return;
    const n = scoring.session.questionsAnswered;
    if (n === 0 || n === midSweepCountRef.current) return;
    midSweepCountRef.current = n;
    const earned = sweepBadges(true);
    if (earned.length === 0) return;
    setNewBadges(prev => mergeCelebrated(prev, earned));
    if (showScore) setToastQueue(q => [...q, ...earned]);
  }, [running, paused, scoring.session.questionsAnswered, showScore, sweepBadges]);

  // Detect game end (skipped when Auto Advance is about to continue straight
  // into the next stage).
  const wasRunningRef = useRef(false);
  useEffect(() => {
    if (wasRunningRef.current && !running && !paused && scoring.session.questionsAnswered > 0 && !pendingAutoAdvance) {
      setGameEnded(true);
      setRoundCompletedNaturally(completedNaturally);
      trackRoundFinished({
        questionsAnswered: scoring.session.questionsAnswered,
        score: scoring.session.score,
        accuracy: sessionResult.accuracy,
        completedNaturally,
      });

      // "What's next" nudge: only for a plain Selector run (never a fixed
      // Teacher/interval plan, which doesn't live on the stage curriculum) that
      // just posted strong recent accuracy on this exact combination. A stage
      // to move into offers that stage; nothing left in the curriculum at this
      // difficulty offers the Learn hub instead.
      if (!wasTeacherRunRef.current && !wasIntervalRunRef.current
        && suggestAdjustment(historyOps.getEntriesForKey(histKey)) === 'harder') {
        const next = selector.nextStage();
        setSuggestion(next ? { kind: 'nextStage', step: next } : { kind: 'exploreLearn' });
      } else {
        setSuggestion(null);
      }

      // A Teacher / interval session stays armed after the round so pressing
      // Play runs another plan question instead of falling back to the
      // Selector's note drill. Both plans are torn down when the user actually
      // leaves the flow — App clears them from the end-of-round summary's "OK",
      // the "Learn" back button, the "Stop" control, and (for intervals) when
      // the active domain returns to 'notes'.

      // Major achievement: a new personal-best score for this exact selector
      // combination. A Teacher session runs on the plan's own window, so its
      // score is not comparable to that combo's best — skip the record for it.
      const score = scoring.session.score;
      const prevBest = loadBest(histKey);
      let pbCardShown = false;
      if (!wasTeacherRunRef.current && !tier3FiredRef.current && score > 0 && score > (prevBest?.score ?? 0)) {
        tier3FiredRef.current = true;
        saveBest(histKey, { score, streak: scoring.session.longestStreak, accuracy: sessionResult.accuracy });
        if (showScore) pbCardShown = true;
      }

      // Achievements: a final sweep, once per completed run. Awarding is never
      // gated on `showScore`; only the toast and the reveal are score effects.
      let revealList: CelebratedBadge[] = [];
      if (!badgesFiredRef.current && !wasIntervalRunRef.current) {
        badgesFiredRef.current = true;
        const merged = mergeCelebrated(newBadgesRef.current, sweepBadges(false));
        if (merged.length > 0) {
          setNewBadges(merged);
          if (showScore) {
            setToastQueue([]); // the reveal supersedes any still-queued mid-game toasts
            revealList = merged;
          }
        }
      }

      // The personal-best card is a blocking modal; only after it is dismissed
      // does the badge reveal fly in. With no PB card, a short beat lets the
      // score register first.
      if (pbCardShown) {
        celebrateTier3(
          score, scoring.session.longestStreak,
          revealList.length > 0 ? () => setRevealBadges(revealList) : undefined,
        );
      } else if (revealList.length > 0) {
        window.setTimeout(() => setRevealBadges(revealList), 900);
      }
    }
    wasRunningRef.current = running;
  }, [running, paused, pendingAutoAdvance, completedNaturally, scoring.session.questionsAnswered, scoring.session.score, scoring.session.longestStreak, sessionResult, histKey, historyOps.allHistory, historyOps.getEntriesForKey, instrument, selector, showScore, sweepBadges]);

  // Push the signed-in player's leaderboard row after each completed run.
  useEffect(() => {
    if (!gameEnded || !auth.user) return;
    if (wasIntervalRunRef.current) return;
    const name = leaderboardName(
      auth.profile?.name ?? null,
      auth.profile?.email ?? auth.user.email ?? null,
    );
    void upsertMyEntry(
      auth.user.id,
      instrument.id,
      name,
      computeMyStats(allHistoryEntries),
    );
  }, [gameEnded, auth.user, auth.profile, instrument.id, allHistoryEntries]);

  return {
    newBadges, setNewBadges, toastQueue, setToastQueue, beginRun,
    roundCompletedNaturally, suggestion, setSuggestion,
  };
}
