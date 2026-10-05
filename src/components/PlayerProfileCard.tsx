import { useEffect, useState } from 'react';
import type { InstrumentConfig } from '../utils/instruments';
import { fetchPublicBadges, type BadgeStore } from '../utils/badgeSync';
import { badgeList, earnedTierFrom, earnedAtFrom, TIER_LABEL } from '../utils/badges';
import { BadgeMedal, BadgeMedalDefs, type Metal } from './BadgeMedal';
import { localise } from '../utils/badgeLocalise';
import { playClickSound, haptic } from '../utils/feedback';
import { useTranslation } from '../i18n/useTranslation';
import { dateLocale } from '../i18n/translations';
import type { LeaderboardRow, LeaderboardScope } from '../utils/leaderboard';

/**
 * Read-only "what has this player earned" card, opened by tapping any row on
 * the leaderboard (product-owner request, 2026-10-01 — see conversation).
 * Shows the row's own standing figures (already in hand, no extra fetch) plus
 * their earned badges, fetched fresh from the public `user_badges` read added
 * in migration 0022. Unlike `BadgeGrid`, this never evaluates or awards
 * anything — it only displays what the cloud already says this player holds,
 * so a visitor's own history/progress is never touched or exposed.
 */
export function PlayerProfileCard({
  row,
  scope,
  instrument,
  onClose,
}: {
  row: LeaderboardRow;
  scope: LeaderboardScope;
  instrument: InstrumentConfig;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const [store, setStore] = useState<BadgeStore | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchPublicBadges(row.userId).then((s) => { if (alive) setStore(s); });
    return () => { alive = false; };
  }, [row.userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const earned = store
    ? badgeList(instrument)
        .filter((d) => d.kind !== 'role')
        .map((def) => ({ def, tier: earnedTierFrom(store, def.id, instrument.id) }))
        .filter((e): e is { def: typeof e.def; tier: NonNullable<typeof e.tier> } => e.tier !== null)
    : [];

  const close = () => { playClickSound(); haptic.tap(); onClose(); };

  return (
    <div className="lb-profile-overlay" onClick={close}>
      <div
        className="lb-profile-card"
        role="dialog"
        aria-modal="true"
        aria-label={row.displayName}
        onClick={(e) => e.stopPropagation()}
      >
        <BadgeMedalDefs />
        <button className="lb-profile-close" onClick={close} aria-label={t('Close')}>✕</button>

        <div className="lb-profile-head">
          <div className="lb-profile-av">{row.displayName.trim()[0]?.toUpperCase() ?? '?'}</div>
          <div className="lb-profile-name">{row.displayName}</div>
          <div className="lb-profile-rank">#{row.rank} · {t(instrument.label)}</div>
        </div>

        <div className="lb-profile-stats">
          <div className="lb-profile-stat">
            <span className="lb-profile-stat-n">{(row.leagueXp ?? (scope === 'thisWeek' ? row.weeklyXp : row.xp)).toLocaleString()}</span>
            <span className="lb-profile-stat-l">XP</span>
          </div>
          <div className="lb-profile-stat">
            <span className="lb-profile-stat-n">{row.accuracy}%</span>
            <span className="lb-profile-stat-l">{t('accuracy')}</span>
          </div>
          <div className="lb-profile-stat">
            <span className="lb-profile-stat-n">{row.questions.toLocaleString()}</span>
            <span className="lb-profile-stat-l">{t('answered')}</span>
          </div>
        </div>

        <div className="lb-profile-badges-head">{t('Achievements')}</div>
        {store === null ? (
          <p className="board-empty">{t('Loading…')}</p>
        ) : earned.length === 0 ? (
          <p className="lb-profile-empty">{t('No badges earned yet.')}</p>
        ) : (
          <div className="lb-profile-badge-grid">
            {earned.map(({ def, tier }) => {
              const when = earnedAtFrom(store, def.id, instrument.id, tier);
              return (
                <div key={def.id} className="lb-profile-badge" title={localise(def.name, def, instrument, t)}>
                  <BadgeMedal id={def.id} instrumentId={instrument.id} tier={tier as Metal} size={48} />
                  <span className="lb-profile-badge-name">{localise(def.name, def, instrument, t)}</span>
                  <span className="lb-profile-badge-tier">{t(TIER_LABEL[tier])}</span>
                  {when && (
                    <span className="lb-profile-badge-date">
                      {new Date(when).toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
