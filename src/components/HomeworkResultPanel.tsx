// ── HomeworkResultPanel — the end-of-run card shared by every homework run ──

import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import type { HomeworkRunResult, HomeworkSaveState } from '../hooks/useHomeworkResult';

interface Props {
  result: HomeworkRunResult;
  saveState: HomeworkSaveState;
  onRetrySave: () => void;
  onPlayAgain: () => void;
  onDone: () => void;
}

export default function HomeworkResultPanel({ result, saveState, onRetrySave, onPlayAgain, onDone }: Props) {
  const { t } = useTranslation();
  const click = (fn: () => void) => () => { playClickSound(); haptic.tap(); fn(); };
  return (
    <div className="class-run-result">
      <div className="class-run-score">{result.correct}/{result.total} · {result.seconds}s</div>
      <p className="class-muted" role="status">
        {saveState === 'saving' && t('Sending your result to your teacher…')}
        {saveState === 'saved' && t('Your teacher can see this result.')}
        {saveState === 'failed' && t('Could not send your result. Check your connection.')}
      </p>
      <div className="class-row">
        {saveState === 'failed' && (
          <button className="clear-btn" onClick={click(onRetrySave)}>{t('Try again')}</button>
        )}
        <button className="clear-btn" onClick={click(onPlayAgain)}>{t('Play again')}</button>
        <button className="class-btn-primary" onClick={click(onDone)}>{t('Done')}</button>
      </div>
    </div>
  );
}
