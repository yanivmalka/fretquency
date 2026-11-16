// Theme selection has two orthogonal axes that combine into one
// `data-theme="<season>-<mode>"` string on <html> (set in App.tsx from the
// `pref_theme` + `pref_season` settings; see src/hooks/useThemeEffect.ts):
//
//   • mode   — 'dark' (the original app look, and the default), 'night'
//              (warmer / dimmer, for a dark room), 'day' (light).
//   • season — 'winter' (the default; reproduces the pre-seasons look),
//              'spring', 'summer', 'autumn'.
//
// The 12 resulting token blocks live in src/styles/00-tokens.css.
//
// `pref_theme` keeps its original 'dark' | 'night' | 'day' values, so no
// migration is needed; `pref_season` is new and defaults to 'winter'.

export type ThemeMode = 'dark' | 'night' | 'day';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'studio';

// What the player can pick for each axis: a fixed value, or 'auto' to follow
// the clock (mode) / the real season where they are (season, utils/region.ts).
export type ThemePref = ThemeMode | 'auto';
export type SeasonPref = Season | 'auto';

// In auto mode the app is light by day and the warm dim palette by night.
// Mirrored in the inline boot script in index.html — keep the two in sync.
export const AUTO_DAY_START_HOUR = 7;
export const AUTO_DAY_END_HOUR = 19;
export function modeForHour(hour: number): ThemeMode {
  return hour >= AUTO_DAY_START_HOUR && hour < AUTO_DAY_END_HOUR ? 'day' : 'night';
}

// Back-compat alias: `Theme` used to name the mode axis. Kept so existing
// imports keep compiling while call sites migrate to `ThemeMode`.
export type Theme = ThemeMode;

export const THEME_MODES: readonly ThemeMode[] = ['dark', 'night', 'day'];
// The four calendar seasons, in calendar order (utils/region.ts indexes this).
export const SEASONS: readonly Season[] = ['winter', 'spring', 'summer', 'autumn'];
// Palettes on the season axis that are NOT tied to the calendar: a pick of
// one of these holds until the player changes it (it never expires when the
// real season turns over, and 'auto' never lands on it). 'studio' is the
// Fretquency redesign look: its own colours plus fonts and rounder shapes
// (src/styles/39-studio-theme.css).
export const FIXED_SEASONS: readonly Season[] = ['studio'];
// Everything the Appearance picker offers on the season row.
export const PICKABLE_SEASONS: readonly Season[] = [...SEASONS, ...FIXED_SEASONS];
export function isFixedSeason(s: string | null | undefined): s is Season {
  return !!s && (FIXED_SEASONS as readonly string[]).includes(s);
}

export const DEFAULT_MODE: ThemeMode = 'dark';
export const DEFAULT_SEASON: Season = 'winter';

// The `data-theme` attribute value for a (season, mode) pair.
export function themeAttr(season: Season, mode: ThemeMode): string {
  return `${season}-${mode}`;
}

// color-scheme depends only on the mode: 'day' is light; 'dark' and 'night'
// are both dark-family, so mobile browsers must not auto-re-tint them.
export const MODE_COLOR_SCHEME: Record<ThemeMode, 'dark' | 'light'> = {
  dark: 'dark',
  night: 'dark',
  day: 'light',
};

// Primary background per (season, mode), kept here so App.tsx can push it
// into <meta name="theme-color"> without re-reading the CSS tokens. Each
// value mirrors the `--bg-0` of the matching block in
// src/styles/00-tokens.css — keep the two in sync. A trimmed copy also
// lives in the inline boot script in index.html (for the pre-mount splash);
// keep that in sync too.
export const THEME_BG: Record<string, string> = {
  'winter-dark': '#1a1a2e', 'winter-night': '#0f1320', 'winter-day': '#eef2f8',
  'spring-dark': '#14201a', 'spring-night': '#12140d', 'spring-day': '#f1f7f0',
  'summer-dark': '#241009', 'summer-night': '#16110b', 'summer-day': '#fbf5df',
  'autumn-dark': '#201410', 'autumn-night': '#170e09', 'autumn-day': '#f4e8d3',
  'studio-dark': '#121226', 'studio-night': '#0e0f1c', 'studio-day': '#f3f4fb',
};

export function themeBg(season: Season, mode: ThemeMode): string {
  return THEME_BG[themeAttr(season, mode)] ?? THEME_BG['winter-dark'];
}

// ── Legacy exports ────────────────────────────────────────────────────
// Kept so un-migrated call sites (which still think in a single 3-value
// axis) go on compiling. New code should use THEME_MODES / MODE_COLOR_SCHEME
// / themeBg() instead.
export const THEMES = THEME_MODES;
export const THEME_COLOR_SCHEME = MODE_COLOR_SCHEME;
