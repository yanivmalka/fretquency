import { useEffect, useState } from 'react';
import { SettingCard } from '../../SettingCard';
import { useTranslation } from '../../../i18n/useTranslation';
import { isSupabaseConfigured } from '../../../utils/supabase';
import { usePresence } from '../../../hooks/usePresence';
import {
  fetchRegisteredUserCount,
  cachedRegisteredUserCount,
} from '../../../utils/communityStats';

/**
 * The "About" tile in the Account section: a short blurb about the makers, and
 * — when a Supabase backend is configured — three live community numbers
 * beneath it: registered accounts, users active right now, and guests active
 * right now. The guests tile is shown only while at least one guest is online.
 *
 * Self-contained (its own hooks), like <PinnedBadges>, so <AccountSection>
 * stays presentation-only.
 */
export default function AboutCard() {
  const { t } = useTranslation();
  const { users, guests } = usePresence();
  const [registered, setRegistered] = useState<number | null>(
    cachedRegisteredUserCount,
  );

  useEffect(() => {
    let alive = true;
    void fetchRegisteredUserCount().then((n) => {
      if (alive && n != null) setRegistered(n);
    });
    return () => { alive = false; };
  }, []);

  return (
    <SettingCard label={t('About')}>
      <p className="account-about-copy">
        {t('Fretquency is a small labor of love — built to turn learning the fretboard into a game instead of a chore. Made by an independent developer, with patient help from family and friends.')}
      </p>
      {isSupabaseConfigured && (
        <div className="account-community sp2-hero">
          <div className="sp2-tile">
            <span className="sp2-tile-v">{registered ?? '—'}</span>
            <span className="sp2-tile-l">{t('Registered users')}</span>
          </div>
          <div className="sp2-tile">
            <span className="sp2-tile-v">{users}</span>
            <span className="sp2-tile-l">{t('Active now')}</span>
          </div>
          {guests > 0 && (
            <div className="sp2-tile">
              <span className="sp2-tile-v">{guests}</span>
              <span className="sp2-tile-l">{t('Guests online')}</span>
            </div>
          )}
        </div>
      )}
    </SettingCard>
  );
}
