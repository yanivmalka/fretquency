import { playClickSound, haptic } from '../../utils/feedback';
import {
  PICKABLE_SEASONS, THEME_MODES, type SeasonPref, type ThemePref,
} from '../../utils/theme';

/**
 * The two theme axes (mode × season) as a single control.
 *
 * They stay two rows — a 3-wide mode row and a 4-wide season row — rather than
 * one 12-cell grid, because the axes really are independent and a 12-way
 * control does not fit a narrow phone. Tiles show only their name, not a
 * colour preview, so switching seasons/modes never spoils the look of the
 * combination you're not currently on.
 */

const MODE_LABEL: Record<ThemePref, string> = {
  auto: 'Auto', dark: 'Dark', night: 'Night', day: 'Day',
};
const SEASON_LABEL: Record<SeasonPref, string> = {
  auto: 'Auto', winter: 'Winter', spring: 'Spring', summer: 'Summer', autumn: 'Autumn', studio: 'Studio',
};

function Tile({
  on, label, onPick,
}: {
  on: boolean;
  label: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className={`ap-tile${on ? ' ap-tile-on' : ''}`}
      aria-pressed={on}
      onClick={() => {
        if (on) return;
        playClickSound();
        haptic.tap();
        onPick();
      }}
    >
      <span className="ap-tile-l">{label}</span>
    </button>
  );
}

export interface AppearancePickerProps {
  t: (s: string) => string;
  mode: ThemePref;
  setMode: (m: ThemePref) => void;
  season: SeasonPref;
  setSeason: (s: SeasonPref) => void;
}

export default function AppearancePicker({
  t, mode, setMode, season, setSeason,
}: AppearancePickerProps) {
  return (
    <div className="ap">
      <div className="ap-axis">
        <span className="ap-axis-k">{t('Theme')}</span>
        <div className="ap-row ap-row-4" role="group" aria-label={t('Theme')}>
          {(['auto', ...THEME_MODES] as ThemePref[]).map((m) => (
            <Tile
              key={m}
              on={m === mode}
              label={t(MODE_LABEL[m])}
              onPick={() => setMode(m)}
            />
          ))}
        </div>
      </div>
      <div className="ap-axis">
        <span className="ap-axis-k">{t('Season')}</span>
        {/* Auto + 4 calendar seasons + Studio = 6 tiles: two rows of 3 so the
            labels stay readable on a narrow phone. */}
        <div className="ap-row ap-row-3" role="group" aria-label={t('Season')}>
          {(['auto', ...PICKABLE_SEASONS] as SeasonPref[]).map((s) => (
            <Tile
              key={s}
              on={s === season}
              label={t(SEASON_LABEL[s])}
              onPick={() => setSeason(s)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
