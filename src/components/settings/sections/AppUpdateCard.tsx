import { useEffect, useState } from 'react';
import { SettingCard } from '../../SettingCard';
import { useTranslation } from '../../../i18n/useTranslation';
import { withClick as click } from '../../../utils/withClick';
import { verror } from '../../../utils/debugLog';
import {
  canSelfUpdate, findUpdate, installUpdate, type AppUpdate,
} from '../../../utils/appUpdate';

/**
 * "App update" tile in the Account section — Android app only. Checks the
 * private release bucket for a newer APK and, on tap, downloads it inside the
 * app and opens the system installer. Renders nothing on the web, for guests,
 * for accounts not allowed to download, or when the app is already current.
 *
 * Self-contained (its own hooks), like <AboutCard>. `userId` re-runs the
 * check after a sign-in / sign-out.
 */
export default function AppUpdateCard({ userId }: { userId: string | null }) {
  const { t } = useTranslation();
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  // null = idle; -1 = downloading, size unknown; 0–100 = downloading
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!canSelfUpdate || !userId) return;
    let alive = true;
    findUpdate()
      .then((u) => { if (alive) setUpdate(u); })
      .catch((e) => verror('[update] check failed', e));
    return () => { alive = false; };
  }, [userId]);

  // A result from before a sign-out must not linger for the next visitor.
  if (!update || !userId) return null;

  const start = () => {
    setFailed(null);
    setProgress(-1);
    installUpdate(update, setProgress)
      .catch((e: unknown) => {
        verror('[update] install failed', e);
        const code = e instanceof Error ? e.message : '';
        setFailed(
          code === 'permission'
            ? t('Allow installs from this app in Android settings, then try again.')
            : t('The update could not be installed. Check your connection and try again.'),
        );
      })
      .finally(() => setProgress(null));
  };

  return (
    <SettingCard
      label={t('App update')}
      help={t('A new version of the app is ready to install.')}
    >
      <button
        className="account-btn account-btn-primary"
        onClick={click(start)}
        disabled={progress !== null}
      >
        {progress === null
          ? `${t('Update to version')} ${update.versionName}`
          : progress >= 0
            ? `${t('Downloading…')} ${progress}%`
            : t('Downloading…')}
      </button>
      {failed && <p className="account-update-error">{failed}</p>}
    </SettingCard>
  );
}
