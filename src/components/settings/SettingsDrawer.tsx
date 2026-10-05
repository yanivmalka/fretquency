import { useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Chevron } from '../Chevron';
import { withClick as click } from '../../utils/withClick';
import { BadgeRevealOverlay, type CelebratedBadge } from '../BadgeCelebration';
import type { InstrumentConfig } from '../../utils/instruments';
import type { Lang } from '../../i18n/translations';
import { searchApp, type SearchContext, type SearchEntry } from '../../utils/appSearch';
import { minTier, type Feature } from '../../utils/features';
import { getMenuDim, setMenuDim, subscribeMenuDim } from '../../utils/menuDim';

/**
 * The hamburger settings drawer, split out of <App> as pure presentation:
 * <SettingsDrawerNav> is the side-sheet list of section titles, and
 * <SettingsSubPage> is the full-page view of one section's body. <App> still
 * owns the `settingsSections` array (each `body` is now a section component)
 * and the open/section state; these two just render it.
 */
export interface SettingsSection {
  id: string;
  title: string;
  icon?: string;
  blurb: string;
  body: ReactNode;
  onSelect?: () => void;
}

/** What the menu's search field needs from <App>. */
export interface DrawerSearch {
  ctx: SearchContext;
  /** True when the player's tier can't open `feature` (shows a lock pill). */
  isLocked: (feature: Feature) => boolean;
  /** Navigate to a picked result (closes / swaps the drawer itself). */
  onPick: (entry: SearchEntry) => void;
}

export function SettingsDrawerNav({
  sections, lang, t, setSettingsOpen, setDrawerSection, search, slideIn,
}: {
  sections: SettingsSection[];
  /** Slide the sheet in (a fresh open) or show it in place (Back from a section). */
  slideIn: boolean;
  lang: Lang;
  t: (s: string) => string;
  setSettingsOpen: (v: boolean) => void;
  setDrawerSection: (id: string | null) => void;
  search: DrawerSearch;
}) {
  // Local on purpose: the drawer unmounts on close, so every open starts
  // with an empty field and the plain section list.
  const [query, setQuery] = useState('');
  // The dim behind the sheet is <MenuDim>, outside <App>: it fades in while
  // the list is up and out over whatever screen replaces it (a page, a search
  // pick, close). A layout effect so the change lands in the same frame as
  // the list itself.
  useLayoutEffect(() => {
    setMenuDim(true);
    return () => setMenuDim(false);
  }, []);
  const results = useMemo(
    () => searchApp(query, t, search.ctx),
    [query, t, search.ctx],
  );
  const searching = query.trim() !== '';
  // The trail reads in the text direction: "Settings › Language" in LTR,
  // mirrored in Hebrew.
  const sep = lang === 'he' ? ' ‹ ' : ' › ';
  return (
    <div className={`settings-overlay${slideIn ? '' : ' settings-overlay--static'}`} onClick={click(() => setSettingsOpen(false))}>
      <div
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('Game settings')}
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="settings-menu" dir={lang === 'he' ? 'rtl' : undefined}>
          <div className="sp2-head">
            <button
              className="sp2-back"
              onClick={click(() => setSettingsOpen(false))}
            >
              <Chevron dir="back" /> {t('Back')}
            </button>
            {/* No title here on purpose: the burger menu is just the list
                of sections. "Settings" is one of those sections now. */}
          </div>
          <div className="app-search" role="search">
            <span className="app-search__icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="app-search__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search the app')}
              aria-label={t('Search the app')}
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(e) => {
                // Enter opens the top result, like a search box should.
                if (e.key === 'Enter' && results.length > 0) {
                  e.preventDefault();
                  search.onPick(results[0]);
                }
              }}
            />
            {searching && (
              <button
                type="button"
                className="app-search__clear"
                aria-label={t('Clear search')}
                onClick={click(() => setQuery(''))}
              >
                ✕
              </button>
            )}
          </div>
          {searching && results.length === 0 && (
            <p className="app-search__empty" role="status">{t('No results')}</p>
          )}
          {searching && results.map(r => {
            const locked = r.feature ? search.isLocked(r.feature) : false;
            const trail = r.path.map(x => t(x)).join(sep);
            return (
              <button
                key={r.id}
                className="nav-row app-search__row"
                onClick={click(() => search.onPick(r))}
              >
                <span className="nav-row__lead" aria-hidden="true">{r.emoji}</span>
                <span className="nav-row__label">
                  <span className="app-search__title">
                    {t(r.label)}
                    {locked && r.feature && (
                      <span className="progate-badge app-search__lock">
                        {minTier(r.feature) === 'premium' ? t('Premium') : t('Pro')}
                      </span>
                    )}
                  </span>
                  {trail && <span className="app-search__trail">{trail}</span>}
                </span>
                <Chevron dir="forward" className="nav-row__chev" />
              </button>
            );
          })}
          {!searching && sections.filter(s => s.id !== 'upgrade' && s.id !== 'badges').map(s => {
            // `upgrade` (subscription tier) and `badges` are not top-level
            // rows — each is a tappable tile inside the Account section that
            // opens its sub-page. They stay in `settingsSections` only so
            // that sub-page still resolves by id.
            // `s.icon` is a real image (the metal 3D tab icons); sections
            // without one (upgrade, badges — not shown as top-level rows
            // right now) fall back to the old "<emoji> <label>" title
            // convention, split apart so the emoji is its own leading-icon
            // node and never disturbs the bidi resolution of the
            // (possibly RTL) label text next to it.
            const [emoji, ...rest] = s.icon ? [] : s.title.split(' ');
            return (
              <button
                key={s.id}
                className="nav-row"
                onClick={click(() => { if (s.onSelect) s.onSelect(); else setDrawerSection(s.id); })}
              >
                <span className="nav-row__lead" aria-hidden="true">
                  {s.icon ? <img src={s.icon} alt="" className="nav-row__icon-img" /> : emoji}
                </span>
                <span className="nav-row__label">{s.icon ? s.title : rest.join(' ')}</span>
                <Chevron dir="forward" className="nav-row__chev" />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function SettingsSubPage({
  section, lang, t, drawerSection, upgradeFromAccountRef, setDrawerSection,
  revealBadges, instrument, setRevealBadges,
}: {
  section: SettingsSection;
  lang: Lang;
  t: (s: string) => string;
  drawerSection: string | null;
  upgradeFromAccountRef: { current: boolean };
  setDrawerSection: (id: string | null) => void;
  revealBadges: CelebratedBadge[];
  instrument: InstrumentConfig;
  setRevealBadges: (b: CelebratedBadge[]) => void;
}) {
  return (
    <div className="app settings-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          {/* Badges is a sub-page of Account (opened from the pinned-badge
              picker), so Back returns there, not to the hamburger list.
              Upgrade is a sub-page of Account too when opened from the
              plan tile, but can also be opened directly by a locked
              ProGate elsewhere — upgradeFromAccountRef tracks which. */}
          <button
            className="sp2-back"
            onClick={click(() => {
              const backToAccount = drawerSection === 'badges'
                || (drawerSection === 'upgrade' && upgradeFromAccountRef.current);
              setDrawerSection(backToAccount ? 'account' : null);
            })}
          >
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          {section.icon ? (
            <img src={section.icon} alt="" className="settings-page-icon-img" />
          ) : (
            <span className="settings-page-emoji" aria-hidden="true">
              {section.title.split(' ')[0]}
            </span>
          )}
          <h2 className="settings-page-name">
            {section.icon ? section.title : section.title.slice(section.title.indexOf(' ') + 1)}
          </h2>
        </header>
        <div className="settings-page-body">{section.body}</div>
      </div>
      {/* This full-screen settings sub-page is its own return path, so the
          reveal fired by an admin Grant on the Badges wall must be mounted
          here too — the copy in the main return never renders from here. */}
      {revealBadges.length > 0 && (
        <BadgeRevealOverlay
          badges={revealBadges}
          instrument={instrument}
          onClose={() => setRevealBadges([])}
        />
      )}
    </div>
  );
}

/**
 * The hamburger menu's dim (see utils/menuDim.ts): always mounted, outside
 * <App>, and only its opacity changes — in while the list is up, out once it
 * goes. It dims only the strip beside the sheet: the sheet covers its own
 * area while open and, once gone, that area cuts straight to the next screen
 * instead of flashing dark. Reuses .settings-overlay for its placement (the
 * phone frame on desktop, the left-handed side); never takes a tap.
 */
export function MenuDim() {
  const on = useSyncExternalStore(subscribeMenuDim, getMenuDim);
  return (
    <div className={`settings-overlay menu-dim${on ? ' menu-dim--on' : ''}`} aria-hidden="true">
      <div className="menu-dim__shade" />
      <div className="menu-dim__sheet" />
    </div>
  );
}
