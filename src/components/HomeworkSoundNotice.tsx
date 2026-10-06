// A homework that has to be heard ("identify the interval / scale") can't be
// answered while the app is not playing sound. Say so before the student starts
// rather than leaving them to guess at silent questions.

import { useTranslation } from '../i18n/useTranslation';
import { loadSetting } from '../utils/settings';

export default function HomeworkSoundNotice({ needsSound }: { needsSound: boolean }) {
  const { t } = useTranslation();
  // Same stored pick `useAppPreferences` reads ('sound' | 'vibrate' | 'silent').
  const soundOn = loadSetting<string>('pref_feedbackMode', 'sound') === 'sound';
  if (!needsSound || soundOn) return null;
  return <p className="class-muted" role="status">{t('Silent mode is on — this exercise needs sound.')}</p>;
}
