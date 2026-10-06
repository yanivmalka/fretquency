// ── useHomeworkResult — what every homework run does when it ends ─────────
//
// One finished run produces one result row for the teacher
// (`onFinished` → classroom.submitAttempt) and nothing else in the learning
// or history stores. The run components (Notes/Intervals in `HomeworkRun`,
// scales in `ScaleHomeworkRun`, staff/tab in `ReadingHomeworkRun`) all end the
// same way, so the save-state machine, the retry, and the home-screen streak /
// weekly-league credit live here once.

import { useCallback, useRef, useState } from 'react';
import { recordDailyActivity } from '../utils/dailyActivity';
import { recordLeagueActivity } from '../utils/leagueActivity';
import type { WrongPosition } from '../teacher/homework';

export interface HomeworkRunResult { correct: number; total: number; seconds: number }
export type HomeworkSaveState = 'saving' | 'saved' | 'failed';

export interface HomeworkFinishPayload extends HomeworkRunResult { wrongPositions: WrongPosition[] }

export function useHomeworkResult(
  instrumentId: string,
  onFinished: (r: HomeworkFinishPayload) => Promise<void>,
) {
  const [result, setResult] = useState<HomeworkRunResult | null>(null);
  const [saveState, setSaveState] = useState<HomeworkSaveState>('saving');
  // Captured at the moment a run ends, so a "Try again" after a failed save
  // resends the same positions rather than whatever the next run leaves behind.
  const wrongRef = useRef<WrongPosition[]>([]);

  const save = useCallback((r: HomeworkRunResult) => {
    setSaveState('saving');
    onFinished({ ...r, wrongPositions: wrongRef.current })
      .then(() => setSaveState('saved'), () => setSaveState('failed'));
  }, [onFinished]);

  /** A run ended: show the result, send it to the teacher, and credit the
   *  day's goal / streak and the week's league XP, which a homework-only day
   *  would otherwise never move (homework writes to no Practice store). */
  const finish = useCallback((r: HomeworkRunResult, wrongPositions: WrongPosition[]) => {
    wrongRef.current = wrongPositions;
    setResult(r);
    save(r);
    recordDailyActivity(r.total);
    recordLeagueActivity(instrumentId, r.correct);
  }, [save, instrumentId]);

  const clear = useCallback(() => setResult(null), []);

  return { result, saveState, finish, retrySave: save, clear };
}
