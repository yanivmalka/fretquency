// ── IntervalBoard — the flat 11-interval status board (spec §12) ────────
//
// Read-only. One row per drilled interval quality, in curriculum order, each
// showing its short label, its full (localised) name, a thin recent-accuracy
// bar and a `not started` / `learning` / `mastered` status — the same
// three-level visual language as the Notes fretboard mastery overlay
// (`utils/mastery.ts`'s `unplayed / needsWork / known`).
//
// There is NO interval Learning Path: no stars, no state pills, no lock
// icons, no per-stage bars, no checkpoints, no "n/7". Just the 11 qualities
// and where each one stands, derived every render from `intervalSrs` +
// `intervalHistory` (see `buildIntervalBoard`). Reuses ProgressPanel's
// `string-bar-*` row styling — no new stylesheet.

import type { IntervalBoardRow } from '../learning/intervalMastery';
import { INTERVAL_SKILLS, type IntervalSkill } from '../learning/intervalItem';
import { useTranslation } from '../i18n/useTranslation';

type Status = IntervalBoardRow['status'];

// English literal = i18n key (app convention).
const STATUS_LABEL: Record<Status, string> = {
  notStarted: 'not started',
  learning: 'learning',
  mastered: 'mastered',
};

// Same colour roles as ProgressPanel's fretboard heatmap — the per-palette
// heat tokens, so "learning" and "mastered" stay mutually distinct on every
// seasonal ground (autumn's olive success would otherwise collide with amber).
// `mastered` uses --heat-known-cell, the darker/more-saturated green tuned
// against --heat-needs-work for lightness as well as hue (see 00-tokens.css).
const STATUS_COLOR: Record<Status, string> = {
  notStarted: 'var(--heat-unplayed)',
  learning: 'var(--heat-needs-work)',
  mastered: 'var(--heat-known-cell)',
};

// Reuse the three bar-fill classes BarRows already ships.
const STATUS_BAR: Record<Status, string> = {
  notStarted: 'bar-growing',
  learning: 'bar-solid',
  mastered: 'bar-mastered',
};

// Ear / calculate / neck are separate skills — a quality is only "mastered"
// overall when all three are, so each row shows where it stands per skill.
const SKILL_LABEL: Record<IntervalSkill, string> = {
  ear: 'By ear',
  calc: 'Calculate',
  neck: 'On the neck',
};
const SKILL_MARK: Record<Status, string> = { notStarted: '·', learning: '…', mastered: '✓' };

export default function IntervalBoard({ rows }: { rows: IntervalBoardRow[] }) {
  const { t } = useTranslation();
  return (
    <div className="string-bars ivl-board">
      {rows.map((r) => {
        const pct = Math.round(r.recentAccuracy * 100);
        const played = r.attempts > 0;
        return (
          <div className="string-bar-row" key={r.semitones}>
            <span className="string-bar-label">{r.short}</span>
            <div className="string-bar-track">
              <div
                className={`string-bar-fill ${STATUS_BAR[r.status]}`}
                style={{ width: `${played ? pct : 0}%` }}
              />
            </div>
            <span className="string-bar-pct">{played ? `${pct}%` : '—'}</span>
            <span className="string-bar-counts">
              {t(r.nameKey)}
              {' · '}
              <span style={{ color: STATUS_COLOR[r.status] }}>
                {t(STATUS_LABEL[r.status])}
              </span>
              <span className="ivl-skills">
                {INTERVAL_SKILLS.map((k) => {
                  const sk = r.skills[k];
                  const dirs = sk.bothDirs || sk.status === 'notStarted' ? '' : sk.up !== 'notStarted' ? ' ↑' : ' ↓';
                  return (
                    <span
                      key={k}
                      className={`ivl-skill ivl-skill-${sk.status}`}
                      style={{ color: STATUS_COLOR[sk.status] }}
                      title={`${t(SKILL_LABEL[k])}: ${t(STATUS_LABEL[sk.status])}`}
                    >
                      {SKILL_MARK[sk.status]} {t(SKILL_LABEL[k])}{dirs}
                    </span>
                  );
                })}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
