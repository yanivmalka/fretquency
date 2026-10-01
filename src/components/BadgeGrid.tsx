import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { HistoryEntry } from '../utils/music';
import type { InstrumentConfig } from '../utils/instruments';
import {
  badgeList, evaluateLifetime, awardBadge, awardFamilyUpTo, earnedTier, earnedAt, badgeProgress,
  resetBadgeFamily, grantNextTier,
  TIERS, TIER_LABEL, type BadgeDef, type LifetimeSnapshot, type Tier,
} from '../utils/badges';
import { BadgeMedal, BadgeMedalDefs, type Metal } from './BadgeMedal';
import { Chevron } from './Chevron';
import type { CelebratedBadge } from './BadgeCelebration';
import { playClickSound, haptic } from '../utils/feedback';
import { useTranslation } from '../i18n/useTranslation';
import { dateLocale } from '../i18n/translations';
import { localise } from '../utils/badgeLocalise';

function higherTier(a: Tier | null, b: Tier | null): Tier | null {
  if (!a) return b;
  if (!b) return a;
  return TIERS.indexOf(a) >= TIERS.indexOf(b) ? a : b;
}

/**
 * The badge collection, rendered by the standalone "🏅 Badges" settings page.
 * It evaluates the lifetime badges against the instrument's all-time history on
 * every open: families that already qualify show their reached tier immediately,
 * and an effect persists every tier up to it (retroactive catch-up) without a
 * re-render — `awardBadge` is idempotent, so this is safe to run every time.
 */
export function BadgeGrid({
  instrument, instrumentEntries, allEntries, isAdmin = false, onCelebrate,
}: {
  instrument: InstrumentConfig;
  /** History for the current instrument — fretboard-shape badges. */
  instrumentEntries: HistoryEntry[];
  /** History across every instrument — player-progress badges. */
  allEntries: HistoryEntry[];
  /** Current account is an app administrator — reveals the Admin role medal. */
  isAdmin?: boolean;
  /** Fire the normal earn celebration for a badge the admin just Granted by
   *  hand — the effects should play on the manual path too, not only in-game. */
  onCelebrate?: (badges: CelebratedBadge[]) => void;
}) {
  const { t } = useTranslation();

  // The tiles read the badge store synchronously on every render (earnedTier /
  // earnedAt). The admin Grant / Reset controls mutate that store in place, so
  // bump a counter to re-render the wall after one fires.
  const [, refreshWall] = useReducer((n: number) => n + 1, 0);

  // Cloud sync (badgeSync.ts) can rewrite the store from under us — a sign-in
  // restore, or a badge earned on another device arriving during a reconcile.
  // Re-read the wall when it does.
  useEffect(() => {
    window.addEventListener('badges-synced', refreshWall);
    return () => window.removeEventListener('badges-synced', refreshWall);
  }, []);
  // Per-mount running id for the CelebratedBadge records the Grant button emits.
  const celebrateUidRef = useRef(0);

  const lifetime = useMemo<LifetimeSnapshot>(
    () => ({ instrumentEntries, allEntries, instrument }),
    [instrumentEntries, allEntries, instrument],
  );

  const qualifying = useMemo(() => evaluateLifetime(lifetime), [lifetime]);

  useEffect(() => {
    for (const def of badgeList(instrument)) {
      if (def.kind === 'role') continue;
      const tier = qualifying[def.id];
      if (tier) awardFamilyUpTo(def.id, instrument.id, tier, def.levels);
    }
    if (isAdmin) awardBadge('admin');
  }, [qualifying, instrument, isAdmin]);

  // Role medals only appear for the accounts that hold them — a non-admin
  // never sees a locked "become an admin" tile.
  const defs = badgeList(instrument).filter(d => d.kind !== 'role' || isAdmin);
  const effectiveTier = (def: BadgeDef): Tier | null =>
    def.kind === 'role' ? null : higherTier(earnedTier(def.id, instrument.id), qualifying[def.id] ?? null);
  const earnedCount = defs.filter(d => d.kind === 'role' ? isAdmin : effectiveTier(d) !== null).length;
  const collectedPct = defs.length ? Math.round((earnedCount / defs.length) * 100) : 0;

  return (
    <div className="badge-wrap">
      <BadgeMedalDefs />
      {/* Collection tracker — the whole shelf's completion, read as one meter. */}
      <div className="badge-collection-head">
        <div className="badge-collection-top">
          <span className="badge-collection-num">{earnedCount}</span>
          <span className="badge-collection-total">/ {defs.length}</span>
          <span className="badge-collection-label">{t('unlocked')}</span>
        </div>
        <span className="badge-collection-meter" aria-hidden="true">
          <span className="badge-collection-meter-fill" style={{ width: `${collectedPct}%` }} />
        </span>
      </div>
      {isAdmin && (
        <p className="badge-admin-note">
          {t('Admin tools: Grant or Reset each badge to test it. History-based badges re-appear on reopen unless you also clear history.')}
        </p>
      )}
      <div className="badge-grid">
        {defs.map(def => (
          <BadgeTile
            key={def.id}
            def={def}
            instrument={instrument}
            lifetime={lifetime}
            tier={def.kind === 'role' ? 'gold' : effectiveTier(def)}
            isAdmin={isAdmin}
            onAdminChange={refreshWall}
            onGrantCelebrate={
              onCelebrate
                ? (id, grantedTier, upgrade) =>
                    onCelebrate([{ uid: ++celebrateUidRef.current, id, tier: grantedTier, upgrade }])
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function BadgeTile({
  def, instrument, lifetime, tier, isAdmin = false, onAdminChange, onGrantCelebrate,
}: {
  def: BadgeDef;
  instrument: InstrumentConfig;
  lifetime: LifetimeSnapshot;
  /** The family's highest reached tier, or null if not yet earned. */
  tier: Tier | null;
  /** Current account is an app administrator — shows the Grant / Reset controls. */
  isAdmin?: boolean;
  /** Called after an admin Grant / Reset mutates the badge store. */
  onAdminChange?: () => void;
  /** Play the normal earn celebration for a tier the admin Granted by hand. */
  onGrantCelebrate?: (id: BadgeDef['id'], tier: Tier, upgrade: boolean) => void;
}) {
  const { t, lang } = useTranslation();

  const isRole = def.kind === 'role';
  const earned = tier !== null;
  const nextLevel = isRole
    ? null
    : def.levels.find(l => tier === null || TIERS.indexOf(l.tier) > TIERS.indexOf(tier));
  const when = isRole ? earnedAt(def.id) : (earned ? earnedAt(def.id, instrument.id, tier as Tier) : null);
  const progress = !isRole && nextLevel && def.kind === 'lifetime'
    ? badgeProgress(def.id, lifetime, nextLevel.tier)
    : null;
  const medalTier: Metal = isRole ? 'onyx' : (tier ?? def.levels[0]?.tier ?? 'bronze');
  const maxedOut = !isRole && !nextLevel && earned;
  const reachedIdx = tier ? TIERS.indexOf(tier) : -1;

  // ── Localised text ──────────────────────────────────────────────────────────
  const name = localise(def.name, def, instrument, t);
  const rawBlurb = isRole
    ? (def.blurb ?? '')
    : (maxedOut ? def.levels[def.levels.length - 1].blurb : nextLevel?.blurb ?? '');
  const blurb = rawBlurb ? localise(rawBlurb, def, instrument, t) : '';
  const tierWord = (tr: Tier) => t(TIER_LABEL[tr]);
  const earnedDate = when
    ? new Date(when).toLocaleDateString(dateLocale(lang), {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : t('Earned');

  return (
    <div className={`badge-tile tier-${medalTier} ${earned ? 'earned' : 'locked'}${maxedOut ? ' maxed' : ''}`}>
      <span className="badge-medal-frame">
        <BadgeMedal id={def.id} instrumentId={instrument.id} tier={medalTier} size={76} />
        {!earned && (
          <span className="badge-lock" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12">
              <path
                d="M6 10V8a6 6 0 0 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 0 0-8 0v2Z"
                fill="currentColor"
              />
            </svg>
          </span>
        )}
      </span>

      {maxedOut && (
        <span className={`badge-crown tier-${medalTier}`} aria-hidden="true">
          {TIERS.indexOf(medalTier as Tier) >= TIERS.indexOf('platinum') ? (
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M2 8l4.6 3.2L12 3l5.4 8.2L22 8l-2.1 11.3H4.1L2 8Z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13">
              <path d="M12 2.6l2.7 6 6.6.6-5 4.3 1.5 6.4L12 16.5 6.2 19.9l1.5-6.4-5-4.3 6.6-.6z" fill="currentColor" />
            </svg>
          )}
        </span>
      )}

      <span className="badge-id-row">
        <span className="badge-name" title={name}>{name}</span>
        {def.instrumentScoped && (
          <span className={`badge-scope is-${instrument.id}`}>
            <span className="badge-scope-emoji" aria-hidden="true">{instrument.emoji}</span>
            {t(instrument.label)}
          </span>
        )}
      </span>

      {!isRole && def.levels.length > 0 && (
        <span className="badge-tier-track" aria-hidden="true">
          {def.levels.map(l => (
            <span
              key={l.tier}
              className={`badge-tier-seg tier-${l.tier}${
                reachedIdx >= 0 && TIERS.indexOf(l.tier) <= reachedIdx ? ' on' : ''
              }`}
            />
          ))}
        </span>
      )}

      {!isRole && earned && (
        <span className={`badge-tier-word${maxedOut ? ' is-max' : ''}${tier ? ` tier-${tier}` : ''}`}>
          {maxedOut ? (
            t('Max')
          ) : (
            <>
              {tierWord(tier as Tier)}
              {nextLevel && (
                <span className="badge-tier-next"> <Chevron dir="forward" /> {tierWord(nextLevel.tier)}</span>
              )}
            </>
          )}
        </span>
      )}

      <span className="badge-blurb" title={blurb}>{blurb}</span>

      {!earned && progress && progress.target > 0 && (
        <span className="badge-progress">
          <span className="badge-progress-track">
            <span
              className="badge-progress-bar"
              style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
            />
          </span>
          <span className="badge-progress-txt">{progress.current} / {progress.target}</span>
        </span>
      )}

      {earned && (
        <span className="badge-earned">
          <span className="badge-earned-mark" aria-hidden="true">✓</span>
          <span>{earnedDate}</span>
        </span>
      )}

      {/* Earned, not maxed: the next-tier climb is a quiet footnote, and only
          when there's real progress to show — never a big empty bar. */}
      {earned && !maxedOut && nextLevel && progress && progress.target > 0 && progress.current > 0 && (
        <span className="badge-progress badge-progress--next">
          <span className="badge-progress-track">
            <span
              className="badge-progress-bar"
              style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
            />
          </span>
          <span className="badge-progress-txt">
            {tierWord(nextLevel.tier)} · {progress.current}/{progress.target}
          </span>
        </span>
      )}

      {/* Admin-only test controls. The Admin role medal itself is deliberately
          excluded — it re-grants from the account, so there is nothing to test
          and nothing an admin should be able to strip from themselves. */}
      {isAdmin && def.id !== 'admin' && (
        <span className="badge-admin-row">
          <button
            type="button"
            className="badge-admin-btn"
            disabled={isRole ? earned : maxedOut}
            onClick={() => {
              playClickSound(); haptic.tap();
              const prevTier = earnedTier(def.id, instrument.id);
              const granted = grantNextTier(def.id, instrument.id, def.levels);
              onAdminChange?.();
              if (granted) onGrantCelebrate?.(def.id, granted, prevTier !== null);
            }}
          >
            {t('Grant')}
          </button>
          <button
            type="button"
            className="badge-admin-btn badge-admin-btn--reset"
            disabled={!earned}
            onClick={() => {
              playClickSound(); haptic.tap();
              resetBadgeFamily(def.id);
              onAdminChange?.();
            }}
          >
            {t('Reset')}
          </button>
        </span>
      )}
    </div>
  );
}
