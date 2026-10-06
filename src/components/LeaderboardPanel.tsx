import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AuthProfile } from '../hooks/useAuth';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import { historyForInstrument } from '../utils/mastery';
import type { HistoryEntry } from '../utils/music';
import { playClickSound, haptic } from '../utils/feedback';
import { useTranslation } from '../i18n/useTranslation';
import {
  fetchLeaderboard,
  upsertMyEntry,
  computeMyStats,
  leaderboardName,
  type LeaderboardRow,
  type LeaderboardScope,
} from '../utils/leaderboard';
import {
  syncLeague,
  fetchLeagueGroup,
  computeLeagueXp,
  leagueZone,
  leagueMoveCount,
  LEAGUE_MIN_PLAYERS,
  LEAGUE_DEMOTE_MIN_SIZE,
  LEAGUE_TIERS,
  LEAGUE_TIER_COLOR,
  type LeagueTier,
} from '../utils/leagues';
import { weeklyLeagueActivity } from '../utils/leagueActivity';
import { supabase } from '../utils/supabase';
import { PlayerProfileCard } from './PlayerProfileCard';

/** The board's scope toggle: the two global scopes plus the player's own
 *  weekly league (signed-in only). */
type BoardScope = LeaderboardScope | 'league';

/** Why the League tab is showing the global weekly board instead of a group. */
type LeagueFallback = 'notJoined' | 'tooFew' | 'unavailable';

/**
 * The leaderboard, rendered as a hamburger settings sub-page (the wrapper in
 * App.tsx already draws the "‹ Back" row and the 🏆 / "Leaderboard" hero, so
 * this body starts at the subtitle).
 *
 * Free / open feature: the standings load for everyone, signed in or not. A
 * signed-in player is pushed onto the board automatically (their XP = lifetime
 * correct answers on the selected instrument). Guests see the list plus a
 * sign-in nudge.
 *
 * The board is per-instrument, and a Guitar / Bass switch lets a player look at
 * either without leaving the drill they're set up for.
 */

// Rank 1 reuses the app's gold token; 2nd/3rd keep their fixed silver/bronze
// medal-metal colors (like BadgeMedal's tiers) so the podium always reads as
// silver/bronze regardless of theme.
const medalColor = (rank: number): string =>
  rank === 1 ? 'var(--gold)' : rank === 2 ? '#c8d0e0' : rank === 3 ? '#cd7f32' : 'var(--text-3)';

function initialOf(name: string): string {
  const c = name.trim()[0];
  return c ? c.toUpperCase() : '?';
}

function Medal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 3l1.8 4.2M15 3l-1.8 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="6" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function LeaderboardPanel({
  activeInstrumentId,
  allHistory,
  user,
  profile,
  onSignIn,
}: {
  activeInstrumentId: InstrumentId;
  allHistory: Record<string, HistoryEntry[]>;
  user: User | null;
  profile: AuthProfile | null;
  onSignIn: () => void;
}) {
  const { t, lang } = useTranslation();
  const [view, setView] = useState<InstrumentId>(activeInstrumentId);
  const [scope, setScope] = useState<BoardScope>('allTime');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  // League tab only: the group's tier when a real league is showing, or why
  // it fell back to the global weekly board.
  const [leagueTier, setLeagueTier] = useState<LeagueTier | null>(null);
  const [leagueFallback, setLeagueFallback] = useState<LeagueFallback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xpOpen, setXpOpen] = useState(false);
  const [profileRow, setProfileRow] = useState<LeaderboardRow | null>(null);

  const openProfile = (r: LeaderboardRow) => {
    playClickSound();
    haptic.tap();
    setProfileRow(r);
  };

  const instrument = getInstrument(view);
  const userId = user?.id ?? null;
  const myName = leaderboardName(profile?.name ?? null, profile?.email ?? user?.email ?? null);
  const myStats = useMemo(
    () => computeMyStats(historyForInstrument(allHistory, view)),
    [allHistory, view],
  );
  // Practice's own correct-answer count plus whatever Homework / the Premium
  // Learn domains logged into the separate weekly counter (leagueActivity.ts)
  // — same 1-XP-per-correct-answer unit for every source.
  const myLeagueXp = useMemo(
    () => computeLeagueXp(historyForInstrument(allHistory, view)) + weeklyLeagueActivity(view),
    [allHistory, view],
  );
  // Leagues need an account and a backend; a guest never sees the tab.
  const leaguesAvailable = !!userId && !!supabase;
  const activeScope: BoardScope = scope === 'league' && !leaguesAvailable ? 'thisWeek' : scope;

  // On open (and on instrument / sign-in change): push our own up-to-date row
  // first, then load the standings so our position is current. A push failure
  // is non-fatal — we still show the list.
  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        if (userId) {
          try {
            await upsertMyEntry(userId, view, myName, myStats);
          } catch { /* keep going — show whatever is on the board */ }
        }
        if (activeScope === 'league' && userId) {
          // Our own group if it has enough players to be worth showing;
          // otherwise (not joined yet / too few players / migration not
          // applied) the global weekly board, with a note saying why.
          let fallback: LeagueFallback = 'notJoined';
          try {
            const membership = await syncLeague(view, myName, myLeagueXp);
            if (membership) {
              const group = await fetchLeagueGroup(membership.groupId, view, userId);
              if (group.length >= LEAGUE_MIN_PLAYERS) {
                if (alive) {
                  setRows(group);
                  setLeagueTier(membership.tier);
                  setLeagueFallback(null);
                }
                return;
              }
              fallback = 'tooFew';
            }
          } catch {
            fallback = 'unavailable';
          }
          const weekly = await fetchLeaderboard(view, userId, 'thisWeek');
          if (alive) {
            setRows(weekly);
            setLeagueTier(null);
            setLeagueFallback(fallback);
          }
          return;
        }
        const list = await fetchLeaderboard(view, userId, activeScope === 'league' ? 'thisWeek' : activeScope);
        if (alive) {
          setRows(list);
          setLeagueTier(null);
          setLeagueFallback(null);
        }
      } catch {
        if (alive) setError(t('Couldn’t load the leaderboard. Check your connection and try again.'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // myStats / myLeagueXp / myName are snapshots captured at open; intentionally not deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, userId, activeScope]);

  const switchView = (next: InstrumentId) => {
    if (next === view) return;
    playClickSound();
    haptic.tap();
    setView(next);
  };

  const switchScope = (next: BoardScope) => {
    if (next === scope) return;
    playClickSound();
    haptic.tap();
    setScope(next);
  };

  // A real league ranks by league XP; the League tab's fallback is the weekly board.
  const inLeague = activeScope === 'league' && leagueTier !== null;
  const weeklyView = activeScope === 'thisWeek' || (activeScope === 'league' && !inLeague);
  const xpOf = (r: LeaderboardRow) => (inLeague ? (r.leagueXp ?? 0) : weeklyView ? r.weeklyXp : r.xp);
  const zoneOf = (r: LeaderboardRow) => (inLeague && leagueTier !== null ? leagueZone(r.rank, rows.length, leagueTier) : null);
  const mine = rows.find((r) => r.mine);
  const podium = rows.length >= 3 ? rows.slice(0, 3) : [];
  const listRows = podium.length ? rows.slice(3) : rows;
  const playerCount =
    rows.length === 0 ? null : rows.length >= 100 ? `100+ ${t('players')}` : `${rows.length} ${t(rows.length === 1 ? 'player' : 'players')}`;

  // ── sub-blocks ────────────────────────────────────────────────────────────

  const subtitle = (
    <p className="lb-subtitle">
      {t(instrument.label)} · {t('ranked by XP')}{playerCount ? ` · ${playerCount}` : ''} · {t('free for everyone')}
    </p>
  );

  const toggles = (
    <div className="lb-toggles">
      <div className="sp2-scope lb-scope">
        {(['guitar', 'bass', 'mandolin', 'banjo', 'ukulele'] as InstrumentId[]).map((id) => (
          <button
            key={id}
            className={`sp2-scope-btn${view === id ? ' sp2-scope-active' : ''}`}
            onClick={() => switchView(id)}
          >
            {t(getInstrument(id).label)}
          </button>
        ))}
      </div>
      <div className="sp2-scope lb-scope">
        <button
          className={`sp2-scope-btn${scope === 'allTime' ? ' sp2-scope-active' : ''}`}
          onClick={() => switchScope('allTime')}
        >
          {t('All-time')}
        </button>
        <button
          className={`sp2-scope-btn${scope === 'thisWeek' ? ' sp2-scope-active' : ''}`}
          onClick={() => switchScope('thisWeek')}
        >
          {t('This week')}
        </button>
        {leaguesAvailable && (
          <button
            className={`sp2-scope-btn${scope === 'league' ? ' sp2-scope-active' : ''}`}
            onClick={() => switchScope('league')}
          >
            {t('League')}
          </button>
        )}
      </div>
    </div>
  );

  // League tab: the group's tier and how the week ends, or — while there's
  // no league worth showing — why the weekly board is standing in for it.
  const leagueBlock = activeScope !== 'league' || loading ? null : inLeague && leagueTier !== null ? (
    <div className="lb-league" style={{ borderColor: LEAGUE_TIER_COLOR[leagueTier] }}>
      <div className="lb-league-name" style={{ color: LEAGUE_TIER_COLOR[leagueTier] }}>
        {t(`${LEAGUE_TIERS[leagueTier]} League`)}
      </div>
      <p className="lb-league-copy">
        {(rows.length >= LEAGUE_DEMOTE_MIN_SIZE && leagueTier > 0
          ? t('Top {n} move up, bottom {n} move down when the week ends.')
          : t('Top {n} move up when the week ends.')
        ).replace(/\{n\}/g, String(leagueMoveCount(rows.length)))}
        {' '}
        {t('Correct answers since Monday count. A new week starts Monday 00:00 UTC.')}
      </p>
    </div>
  ) : leagueFallback ? (
    <p className="lb-league-note">
      {leagueFallback === 'notJoined'
        ? t('Answer a question correctly this week to join a league of up to 30 players. Until then, here is everyone’s week.')
        : leagueFallback === 'tooFew'
          ? t('Your league opens once {n} players have joined it this week. Until then, here is everyone’s week.').replace('{n}', String(LEAGUE_MIN_PLAYERS))
          : t('Leagues aren’t available right now. Here is everyone’s week instead.')}
    </p>
  ) : null;

  const zoneMark = (r: LeaderboardRow) => {
    const z = zoneOf(r);
    if (!z) return null;
    return (
      <span className={`lb-zone lb-zone-${z}`} title={t(z === 'up' ? 'Moves up' : 'Moves down')}>
        {z === 'up' ? '▲' : '▼'}
      </span>
    );
  };

  const meCard = user ? (
    <div className="lb-standing">
      <div className="lb-standing-k">{t('Your standing')}</div>
      <div className="lb-standing-row">
        <div className="lb-rankpill">
          <span className="lb-rankpill-n">{mine ? mine.rank : '–'}</span>
          <span className="lb-rankpill-l">{t('RANK')}</span>
        </div>
        <div className="lb-standing-id">
          <div className="lb-standing-name">{myName}</div>
          <div className="lb-standing-sub">
            {myStats.questions.toLocaleString()} {t('answered')} · {myStats.accuracy}% {t('accuracy')}
          </div>
        </div>
        <div className="lb-standing-xp">
          <div className="lb-standing-xp-n">
            {(inLeague ? myLeagueXp : weeklyView ? myStats.weeklyXp : myStats.xp).toLocaleString()}
          </div>
          <div className="lb-standing-xp-l">XP</div>
        </div>
      </div>
      <div className="lb-standing-foot">
        <span>{t('Visible on the leaderboard')}</span>
      </div>
    </div>
  ) : (
    <div className="lb-standing lb-standing-guest">
      <div className="lb-standing-k">{t('Join the board')}</div>
      <p className="lb-guest-copy">
        {t('You can see every player’s standing right now. Sign in with Google to take your own place — every correct answer you’ve ever played counts. Free, no subscription.')}
      </p>
      <button
        className="set-card-btn set-card-btn-primary"
        onClick={() => {
          playClickSound();
          haptic.tap();
          onSignIn();
        }}
      >
        {t('Sign in with Google')}
      </button>
    </div>
  );

  const podiumBlock = podium.length === 3 && (
    <div className="lb-podium">
      {[podium[1], podium[0], podium[2]].map((r) => (
        <button
          key={r.userId}
          type="button"
          className={`lb-pod lb-pod-${r.rank}${r.mine ? ' lb-pod-me' : ''}`}
          onClick={() => openProfile(r)}
        >
          <div className="lb-pod-av" style={{ background: medalColor(r.rank) }}>
            {initialOf(r.displayName)}
          </div>
          <div className="lb-pod-medal" style={{ color: medalColor(r.rank) }}>
            <Medal />
            <span>{r.rank}</span>
            {zoneMark(r)}
          </div>
          <div className="lb-pod-name">{r.displayName}</div>
          <div className="lb-pod-xp">{xpOf(r).toLocaleString()}</div>
          <div className="lb-pod-acc">{r.accuracy}% {t('acc')}</div>
        </button>
      ))}
    </div>
  );

  const listBlock = (
    <ol className="lb-list">
      {listRows.map((r) => (
        <li key={r.userId} className={`lb-item${r.mine ? ' lb-item-me' : ''}${zoneOf(r) ? ` lb-item-${zoneOf(r)}` : ''}`}>
          <button type="button" className="lb-item-btn" onClick={() => openProfile(r)}>
            <span className="lb-rk" style={r.rank <= 3 ? { color: medalColor(r.rank) } : undefined}>
              {r.rank}
            </span>
            <span className="lb-av">{initialOf(r.displayName)}</span>
            <span className="lb-name">
              {r.displayName}
              {r.mine && <span className="lb-you"> {t('(you)')}</span>}
              {zoneMark(r)}
            </span>
            <span className="lb-stat">
              <span className="lb-xp">{xpOf(r).toLocaleString()}</span>
              <span className="lb-acc">{r.accuracy}% {t('acc')}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );

  const emptyBlock = (
    <div className="lb-empty">
      <svg
        width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 4h12v3a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
        <path d="M6 5H4a2 2 0 0 0 0 4h1M18 5h2a2 2 0 0 1 0 4h-1" />
        <path d="M10 12v3M14 12v3M8 20h8M9 20a3 3 0 0 1 6 0" />
      </svg>
      <div className="lb-empty-title">{t('No one’s on the board yet')}</div>
      <p className="lb-empty-copy">
        {t('Finish a practice run while signed in and your name lands here first.')}
      </p>
    </div>
  );

  const xpExplainer = (
    <div className="lb-xpexp">
      <button
        className={`sp2-exp${xpOpen ? ' sp2-exp-open' : ''}`}
        aria-expanded={xpOpen}
        onClick={() => {
          playClickSound();
          haptic.tap();
          setXpOpen((v) => !v);
        }}
      >
        <span>{t('How is XP counted?')}</span>
        <span className="sp2-chev" aria-hidden="true">{xpOpen ? '▴' : '▾'}</span>
      </button>
      {xpOpen && (
        <p className="lb-xpexp-body">
          {lang === 'he' ? (
            <>
              נקודת ניסיון אחת על כל תשובה נכונה, שנצברת לאורך כל תרגולי ה{t(instrument.label)} שלך —
              זהו אותו סך מצטבר שמופיע במסך הסטטיסטיקות. בונוסים על מהירות ורצף מעלים את הניקוד שלך
              במשחק, לא את נקודות הניסיון.
            </>
          ) : lang === 'es' ? (
            <>
              1&nbsp;XP por cada respuesta correcta, sumada en toda tu práctica de{' '}
              {t(instrument.label).toLowerCase()} — el mismo total histórico que ves en Estadísticas. Las
              bonificaciones por velocidad y racha suben tu puntuación en el juego, no tu XP.
            </>
          ) : lang === 'pt-BR' ? (
            <>
              1&nbsp;XP por cada resposta certa, somado em toda a sua prática de{' '}
              {t(instrument.label).toLowerCase()} — o mesmo total geral que você vê em Estatísticas. Os
              bônus de velocidade e sequência aumentam a sua pontuação no jogo, não o seu XP.
            </>
          ) : lang === 'fr' ? (
            <>
              1&nbsp;XP pour chaque bonne réponse, cumulée sur tout ton entraînement de{' '}
              {t(instrument.label).toLowerCase()} — le même total global que dans tes Statistiques. Les
              bonus de vitesse et de série augmentent ton score en jeu, pas ton XP.
            </>
          ) : lang === 'it' ? (
            <>
              1&nbsp;XP per ogni risposta giusta, sommati in tutta la tua pratica di{' '}
              {t(instrument.label).toLowerCase()} — lo stesso totale di sempre che vedi nelle Statistiche. I
              bonus di velocità e di serie aumentano il tuo punteggio nel gioco, non i tuoi XP.
            </>
          ) : lang === 'de' ? (
            <>
              1&nbsp;XP für jede richtige Antwort, summiert über dein gesamtes{' '}
              {t(instrument.label)}-Training — dieselbe Gesamtsumme wie in deinen Statistiken. Tempo- und
              Serienboni erhöhen deinen Punktestand im Spiel, nicht deine XP.
            </>
          ) : lang === 'ja' ? (
            <>
              正解1問につき1&nbsp;XP。{t(instrument.label)}の練習全体で合算され、統計画面の通算合計と同じです。
              スピードボーナスと連続ボーナスはゲーム内スコアを上げますが、XPには加算されません。
            </>
          ) : (
            <>
              1&nbsp;XP for every correct answer, added up across all your {instrument.label.toLowerCase()}{' '}
              practice — the same lifetime total as your Stats screen. Speed and streak bonuses lift
              your in-game score, not your XP.
            </>
          )}
        </p>
      )}
    </div>
  );

  return (
    <div className="board lb-panel">
      {subtitle}
      {toggles}
      {meCard}
      {leagueBlock}
      {error && <p className="board-error">{error}</p>}
      {loading ? (
        <p className="board-empty">{t('Loading…')}</p>
      ) : rows.length === 0 ? (
        emptyBlock
      ) : (
        <>
          {podiumBlock}
          {listBlock}
        </>
      )}
      {xpExplainer}
      {profileRow && (
        <PlayerProfileCard
          row={profileRow}
          scope={weeklyView ? 'thisWeek' : 'allTime'}
          instrument={instrument}
          onClose={() => setProfileRow(null)}
        />
      )}
    </div>
  );
}
