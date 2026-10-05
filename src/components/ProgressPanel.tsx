import { useMemo, useState, type ReactNode } from 'react';
import type { HistoryEntry, AccidentalMode, NotationMode } from '../utils/music';
import { displayNote } from '../utils/music';
import { historyForInstrument, fretMasteryMap, noteMasteryMap } from '../utils/mastery';
import {
  dailyStats, practiceStreak, lifetimeTotals, weakNotes, allBestsSummary, withinFreeWindow,
  type DayStat,
} from '../utils/progress';
import type { InstrumentConfig } from '../utils/instruments';
import { playClickSound, haptic } from '../utils/feedback';
import { useTranslation } from '../i18n/useTranslation';
import { ProGate } from './ProGate';
import { Chevron } from './Chevron';
import IntervalStatsPanel from './IntervalStatsPanel';
import type { IntervalBoardRow } from '../learning/intervalMastery';
import type { IntervalStatsSummary } from '../hooks/useLearning';

interface Props {
  allHistory: Record<string, HistoryEntry[]>;
  noteNames: string[];
  accidental: AccidentalMode;
  notation?: NotationMode;
  instrument: InstrumentConfig;
  // The metal 3D tab icon, so this page's hero matches every settings sub-page.
  headerIcon?: string;
  onClose: () => void;
  onClearAll?: () => void; // clears every combination
  // A free user sees only the trailing FREE_HISTORY_DAYS of history in every
  // stat here, with no window toggle; Pro/Premium get a "Last 7 days" / "All
  // time" toggle. The all-combinations personal-bests list is locked for free.
  // Free-tier limits are presentation only — data is never touched.
  isPro?: boolean;
  // Premium interval-learning progress (spec §12 / §15.1). Omitted / empty for
  // a non-Premium user, in which case the "Intervals" section is hidden. This
  // data never mixes with the note history / mastery above — it is derived
  // from the separate `intervalSrs` + `intervalHistory` (spec §15.2).
  intervalBoard?: IntervalBoardRow[];
  intervalStats?: IntervalStatsSummary | null;
  // Draws ✓/• glyphs over the fretboard heatmap cells alongside colour, for
  // red/green colour-blindness. Off by default (`pref_colorblindHeat`).
  colorblindHeat?: boolean;
}

// The stats window: the free 7-day slice, or (Pro/Premium only) everything.
type Scope = 'last7' | 'all';

function pct(n: number) { return `${Math.round(n * 100)}%`; }

// "6|0-12|byFret|dots" or "bass|6|0-12|byFret|dots" -> a short human caption.
// The fret segment is either the half-picker's "0-12" / "12-max" or, for a
// precise Pro window, "p<lo>-<hi>" — shown here as a plain "lo-hi" span.
function describeKey(key: string, t: (s: string) => string): string {
  const parts = key.split('|');
  let inst = '';
  if (parts.length === 5) { inst = parts.shift() === 'bass' ? '🎵 ' : '🎸 '; }
  const [strings, fret, mode, diff] = parts;
  const modeText = mode === 'byNote' ? t('by note') : t('by fret');
  const fretText = fret?.startsWith('p') ? fret.slice(1) : fret;
  return `${inst}str ${strings} · fr ${fretText} · ${modeText} · ${diff}`;
}

// ── shared analytics ────────────────────────────────────────────
interface Bucket { correct: number; wrong: number; timeout: number }
function bucketRate(b: Bucket) {
  const t = b.correct + b.wrong + b.timeout;
  return t === 0 ? 0 : b.correct / t;
}
function bucketCat(b: Bucket): 'mastered' | 'solid' | 'growing' {
  const r = bucketRate(b);
  if (r >= 0.75 && b.correct >= b.wrong + b.timeout) return 'mastered';
  if (r >= 0.4) return 'solid';
  return 'growing';
}
function tallyBuckets<K extends string | number>(
  history: HistoryEntry[], keyOf: (h: HistoryEntry) => K,
): Map<K, Bucket> {
  const m = new Map<K, Bucket>();
  for (const h of history) {
    const k = keyOf(h);
    let b = m.get(k);
    if (!b) { b = { correct: 0, wrong: 0, timeout: 0 }; m.set(k, b); }
    if (h.correct === true) b.correct++;
    else if (h.correct === false) b.wrong++;
    else b.timeout++;
  }
  return m;
}

// ── presentational primitives ──────────────────────────────────
function HeroTiles({ tiles }: { tiles: Array<{ v: ReactNode; l: string; gold?: boolean }> }) {
  return (
    <div className="sp2-hero">
      {tiles.map(t => (
        <div className="sp2-tile" key={t.l}>
          <span className={`sp2-tile-v${t.gold ? ' score-gold' : ''}`}>{t.v}</span>
          <span className="sp2-tile-l">{t.l}</span>
        </div>
      ))}
    </div>
  );
}

function BarRows({ rows }: { rows: Array<{ label: string; value: number; cat: 'mastered' | 'solid' | 'growing'; detail?: string }> }) {
  const { t } = useTranslation();
  if (rows.length === 0) return <p className="encouragement">{t('Not enough data yet.')}</p>;
  return (
    <div className="string-bars">
      {rows.map(r => (
        <div className="string-bar-row" key={r.label}>
          <span className="string-bar-label">{r.label}</span>
          <div className="string-bar-track">
            <div className={`string-bar-fill bar-${r.cat}`} style={{ width: `${r.value}%` }} />
          </div>
          <span className="string-bar-pct">{r.value}%</span>
          {r.detail && <span className="string-bar-counts">{r.detail}</span>}
        </div>
      ))}
    </div>
  );
}

// The "haven't practiced this yet" tail shown under a By-* breakdown: the
// notes / strings / frets in range that have no recorded answers at all.
function UnplayedChips({ items }: { items: string[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <div className="sp2-unplayed">
      <p className="sp2-unplayed-title">{t('Not practiced yet')}</p>
      <div className="note-stats">
        {items.map(x => (
          <span key={x} className="note-stat note-stat-muted">{x}</span>
        ))}
      </div>
    </div>
  );
}

function Expander({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <>
      <button className={`sp2-exp${open ? ' sp2-exp-open' : ''}`} onClick={onToggle}>
        <span>{label}</span>
        <span className="sp2-chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="sp2-exp-body">{children}</div>}
    </>
  );
}

// `known` uses --heat-known-cell, not --heat-known — a darker/more
// saturated green tuned specifically so this grid's solid cells separate
// from --heat-needs-work by lightness as well as hue (see 00-tokens.css).
const HEAT: Record<string, string> = {
  unplayed: 'var(--heat-unplayed)',
  needsWork: 'var(--heat-needs-work)',
  known: 'var(--heat-known-cell)',
};

// Colour alone doesn't separate "needs work" from "known" reliably across
// every seasonal palette (amber vs. green reads as similar warm-mid tones on
// some grounds, and collapses further for red/green colour-blindness). Each
// cell can also carry a glyph so the level reads without relying on hue —
// opt-in via `pref_colorblindHeat` (off by default, see FretHeatmap).
const HEAT_GLYPH: Record<string, string> = {
  unplayed: '',
  needsWork: '•',
  known: '✓',
};

// Short open-note label ("String 1 · high E" -> "E") for the heatmap rows.
function shortStringLabel(label: string | undefined, n: number): string {
  const parts = (label ?? '').split(/[·\s]+/).filter(Boolean);
  return parts[parts.length - 1] ?? `S${n}`;
}

function FretHeatmap({ history, instrument, colorblindHeat }: { history: HistoryEntry[]; instrument: InstrumentConfig; colorblindHeat: boolean }) {
  const { t } = useTranslation();
  const frets = Array.from({ length: instrument.maxFret + 1 }, (_, f) => f);
  const glyph = (level: string) => (colorblindHeat ? HEAT_GLYPH[level] : '');
  return (
    <div className="sp2-heat-scroll">
      <div className="sp2-heat">
        {Array.from({ length: instrument.stringCount }, (_, row) => {
          const stringNumber = row + 1;
          const map = fretMasteryMap(history, stringNumber);
          return (
            <div className="sp2-heat-row" key={stringNumber}>
              <span className="sp2-heat-str">{shortStringLabel(instrument.stringLabels[stringNumber], stringNumber)}</span>
              {frets.map(fret => {
                const stat = map[fret];
                const level = stat?.level ?? 'unplayed';
                const title = stat && stat.level !== 'unplayed'
                  ? `${t('String')} ${stringNumber} ${t('fret')} ${fret} — ${pct(stat.accuracy)}`
                  : `${t('String')} ${stringNumber} ${t('fret')} ${fret} — ${t('not played')}`;
                return (
                  <span key={fret} className="sp2-heat-cell" title={title} style={{ background: HEAT[level] }}>
                    {glyph(level)}
                  </span>
                );
              })}
            </div>
          );
        })}
        <div className="sp2-heat-row sp2-heat-nums">
          <span className="sp2-heat-str" />
          {frets.map(fret => (
            <span key={fret} className="sp2-heat-num">{instrument.dotFrets.includes(fret) ? fret : ''}</span>
          ))}
        </div>
      </div>
      <div className="sp2-heat-legend">
        <span><i style={{ background: HEAT.known }}>{glyph('known')}</i> {t('known')}</span>
        <span><i style={{ background: HEAT.needsWork }}>{glyph('needsWork')}</i> {t('needs work')}</span>
        <span><i style={{ background: HEAT.unplayed }} /> {t('unplayed')}</span>
      </div>
    </div>
  );
}

// "Am I improving?" — two stacked sparklines over the last N days: accuracy %
// (fixed 0-100 axis) above, average response time in seconds below. They share
// an X axis of dates. History has no session marker, so the trend is per-day
// via `dailyStats`. Needs at least two dated days to draw a line; with fewer,
// the caller's bar list / empty-state text carries the screen instead.
const TREND_DAYS = 30;

function TrendChart({ history }: { history: HistoryEntry[] }) {
  const { t } = useTranslation();
  const days = useMemo(() => dailyStats(history).slice(-TREND_DAYS), [history]);
  if (days.length < 2) return null;

  const W = 300, H = 80, padX = 4, padTop = 8, padBot = 8;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBot;
  const base = padTop + innerH;
  const n = days.length;
  const xAt = (i: number) => padX + (i * innerW) / (n - 1);

  const maxSec = Math.max(1, Math.ceil(Math.max(...days.map(d => d.avgSeconds))));
  const yAcc = (d: DayStat) => padTop + (1 - d.accuracy) * innerH;
  const ySec = (d: DayStat) => padTop + (1 - d.avgSeconds / maxSec) * innerH;

  const points = (yOf: (d: DayStat) => number) => days.map((d, i) => ({ x: xAt(i), y: yOf(d) }));
  const toPoly = (p: { x: number; y: number }[]) => p.map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const toArea = (p: { x: number; y: number }[]) =>
    `M${padX},${base} ` + p.map(q => `L${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ') + ` L${xAt(n - 1).toFixed(1)},${base} Z`;

  const chart = (label: string, topTick: string, cls: string, p: { x: number; y: number }[]) => (
    <div className="sp2-trend-chart">
      <div className="sp2-trend-head">
        <span className="sp2-trend-label">{label}</span>
        <span className="sp2-trend-tick">{topTick}</span>
      </div>
      <svg
        className={`sp2-trend-svg ${cls}`}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <line className="sp2-trend-axis" x1={padX} y1={base} x2={padX + innerW} y2={base} vectorEffect="non-scaling-stroke" />
        <path className="sp2-trend-area" d={toArea(p)} />
        <polyline
          className="sp2-trend-line"
          points={toPoly(p)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );

  return (
    <div className="sp2-trend" dir="ltr">
      {chart(t('Accuracy %'), '100%', 'sp2-trend-acc', points(yAcc))}
      {chart(t('Avg response time'), `${maxSec}s`, 'sp2-trend-time', points(ySec))}
      <div className="sp2-trend-ticks">
        <span>{days[0].date.slice(5)}</span>
        <span>{days[n - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

function Timeline({ history }: { history: HistoryEntry[] }) {
  const { t } = useTranslation();
  const days = dailyStats(history).slice(-14);
  if (days.length === 0) {
    return <p className="encouragement">{t('Older sessions have no date stamp, so the timeline is empty. New sessions fill it in.')}</p>;
  }
  const maxCount = Math.max(...days.map(d => d.count), 1);
  return (
    <>
      <TrendChart history={history} />
      <div className="string-bars">
        {days.map(d => (
        <div key={d.date} className="string-bar-row">
          <span className="string-bar-label">{d.date.slice(5)}</span>
          <div className="string-bar-track">
            <div className="string-bar-fill bar-solid" style={{ width: pct(d.count / maxCount) }} />
          </div>
          <span className="string-bar-pct">{pct(d.accuracy)}</span>
          <span className="string-bar-counts">{d.count}q · ⚡{d.avgSeconds.toFixed(1)}s</span>
        </div>
        ))}
      </div>
    </>
  );
}

// ── the stats body ─────────────────────────────────────────────
function ScopeView({
  history, noteNames, accidental, notation, instrument, windowed, open, toggle, colorblindHeat,
}: {
  history: HistoryEntry[];
  noteNames: string[];
  accidental: AccidentalMode;
  notation?: NotationMode;
  instrument: InstrumentConfig;
  // The free 7-day window is in effect, so an empty view can just mean "nothing
  // in the last 7 days" rather than "nothing ever".
  windowed?: boolean;
  // The single-open accordion state is owned by ProgressPanel so that the
  // Intervals section outside this component shares the same "only one open"
  // group.
  open: string | null;
  toggle: (id: string) => () => void;
  colorblindHeat: boolean;
}) {
  const { t } = useTranslation();

  const days = useMemo(() => dailyStats(history), [history]);
  const streak = useMemo(() => practiceStreak(days), [days]);
  const totals = useMemo(() => lifetimeTotals(history, days), [history, days]);
  const weak = useMemo(() => weakNotes(history, noteNames), [history, noteNames]);
  const bests = useMemo(() => allBestsSummary(instrument.id), [instrument.id]);

  const noteRows = useMemo(() => {
    const m = tallyBuckets(history, h => displayNote(h.note, accidental, notation));
    return [...m.entries()]
      .map(([label, b]) => ({ label, value: Math.round(bucketRate(b) * 100), cat: bucketCat(b), n: b.correct + b.wrong + b.timeout }))
      .filter(r => r.n > 0)
      .sort((a, b) => a.value - b.value);
  }, [history, accidental, notation]);

  // Notes in the current note set that have no recorded answers at all — the
  // gaps the "By note" bars can't show because they only plot played notes.
  const unplayedNotes = useMemo(() => {
    const map = noteMasteryMap(history, noteNames);
    return noteNames
      .filter(n => map[n].level === 'unplayed')
      .map(n => displayNote(n, accidental, notation));
  }, [history, noteNames, accidental, notation]);

  const stringRows = useMemo(() => {
    const m = tallyBuckets(history, h => h.string);
    return [...m.entries()]
      .sort(([a], [b]) => a - b)
      .map(([num, b]) => ({
        label: instrument.stringLabels[num] ?? `S${num}`,
        value: Math.round(bucketRate(b) * 100),
        cat: bucketCat(b),
        detail: `✓${b.correct} ✗${b.wrong} ⏱${b.timeout}`,
      }));
  }, [history, instrument]);

  // The whole neck is always in scope now — the stats span every string and
  // fret the instrument has, never a single settings combination.
  const scopeStrings = useMemo(
    () => Array.from({ length: instrument.stringCount }, (_, i) => i + 1),
    [instrument.stringCount],
  );

  const scopeFrets = useMemo(
    () => Array.from({ length: instrument.maxFret + 1 }, (_, i) => i),
    [instrument.maxFret],
  );

  // Strings in scope with no recorded answers yet.
  const unplayedStrings = useMemo(() => {
    const played = new Set(history.map(h => h.string));
    return scopeStrings
      .filter(num => !played.has(num))
      .map(num => instrument.stringLabels[num] ?? `S${num}`);
  }, [history, scopeStrings, instrument]);

  const fretRows = useMemo(() => {
    const m = tallyBuckets(history, h => h.fret);
    return [...m.entries()]
      .map(([fret, b]) => ({
        label: `Fret ${fret}`,
        value: Math.round(bucketRate(b) * 100),
        cat: bucketCat(b),
        detail: `✓${b.correct} ✗${b.wrong} ⏱${b.timeout}`,
        fret,
      }))
      .sort((a, b) => a.value - b.value || a.fret - b.fret);
  }, [history]);

  // Frets in scope with no recorded answers yet.
  const unplayedFrets = useMemo(() => {
    const played = new Set(history.map(h => h.fret));
    return scopeFrets.filter(f => !played.has(f)).map(f => `Fret ${f}`);
  }, [history, scopeFrets]);

  if (history.length === 0) {
    return (
      <p className="encouragement">
        {windowed
          ? t('No practice in the last 7 days.')
          : t('Play a few rounds and your all-time progress shows up here.')}
      </p>
    );
  }

  const heroTiles = [
    { v: pct(totals.accuracy), l: t('accuracy'), gold: true },
    { v: <>🔥 {streak.current}</>, l: t('day streak') },
    { v: totals.totalQuestions, l: t('answered') },
  ];

  return (
    <>
      <div className="stat-group">
        <p className="stat-group-title improving">🎸 {t('Fretboard heatmap')}</p>
        <FretHeatmap history={history} instrument={instrument} colorblindHeat={colorblindHeat} />
      </div>

      <HeroTiles tiles={heroTiles} />

      <div className="stat-group">
        <p className="stat-group-title improving">🎯 {t('Weakest notes')}</p>
        <div className="note-stats">
          {weak.length === 0 && <span className="note-stat">{t('Nothing below 70% — nice.')}</span>}
          {weak.map(w => (
            <span key={w.label} className="note-stat note-stat-split">
              <span className="note-stat-label">{displayNote(w.label, accidental, notation)}</span>
              <span className="note-stat-bad">{pct(w.accuracy)}</span>
            </span>
          ))}
        </div>
      </div>

      <Expander label={t('By note')} open={open === 'note'} onToggle={toggle('note')}>
        {noteRows.length > 0 && <BarRows rows={noteRows} />}
        <UnplayedChips items={unplayedNotes} />
      </Expander>
      <Expander label={t('By string')} open={open === 'string'} onToggle={toggle('string')}>
        {stringRows.length > 0 && <BarRows rows={stringRows} />}
        <UnplayedChips items={unplayedStrings} />
      </Expander>
      <Expander label={t('By fret')} open={open === 'byfret'} onToggle={toggle('byfret')}>
        {fretRows.length > 0 && <BarRows rows={fretRows} />}
        <UnplayedChips items={unplayedFrets} />
      </Expander>
      <Expander label={t('Daily timeline')} open={open === 'time'} onToggle={toggle('time')}>
        <Timeline history={history} />
      </Expander>
      <ProGate
        feature="allPersonalBests"
        variant="overlay"
        pitch={t('Browse your personal bests across every settings combination')}
      >
        <Expander label={t('Personal bests')} open={open === 'bests'} onToggle={toggle('bests')}>
          <div className="string-bars">
            {bests.length === 0 && <p className="encouragement">{t('No personal bests recorded yet.')}</p>}
            {bests.slice(0, 8).map(b => (
              <div key={b.key} className="string-bar-row">
                <span className="string-bar-label" style={{ minWidth: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                  {describeKey(b.key, t)}
                </span>
                <span className="string-bar-pct score-gold">{b.best.score}</span>
                <span className="string-bar-counts">🔥{b.best.streak} · {b.best.accuracy}%</span>
              </div>
            ))}
          </div>
        </Expander>
      </ProGate>
    </>
  );
}

export default function ProgressPanel({
  allHistory, noteNames, accidental, notation, instrument, headerIcon, onClose,
  onClearAll, isPro, intervalBoard, intervalStats, colorblindHeat = false,
}: Props) {
  const { t, lang } = useTranslation();
  // Pro/Premium can toggle the window; free is pinned to the 7-day slice.
  const [scope, setScope] = useState<Scope>('all');
  const [confirm, setConfirm] = useState(false);
  // One shared accordion group across every collapsible section on this screen,
  // including the Intervals panel below — opening any one closes the others.
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => () => { playClickSound(); haptic.tap(); setOpen(o => (o === id ? null : id)); };
  const click = (fn: () => void) => () => { playClickSound(); haptic.tap(); fn(); };

  const all = useMemo(
    () => historyForInstrument(allHistory, instrument.id),
    [allHistory, instrument.id],
  );

  // Free users see only the trailing 7 days in every stat on this screen (spec
  // free-pro-tiering §5.1); Pro/Premium pick via the toggle. The window is a
  // view filter here and nowhere else — `all` is still the full set, synced and
  // feeding XP / badges / the leaderboard, and "Clear all history" below acts on
  // all of it regardless of what the window shows.
  const windowed = !isPro || scope === 'last7';
  const history = useMemo(
    () => (windowed ? withinFreeWindow(all) : all),
    [all, windowed],
  );

  return (
    <div className="stats-panel sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
      <div className="sp2-head settings-page-head">
        <button className="sp2-back" onClick={click(onClose)}><Chevron dir="back" /> {t('Back')}</button>
      </div>
      <header className="settings-page-hero">
        {headerIcon
          ? <img src={headerIcon} alt="" className="settings-page-icon-img" />
          : <span className="settings-page-emoji" aria-hidden="true">📊</span>}
        <h2 className="settings-page-name">{t('Stats & progress')}</h2>
      </header>
      <div className="settings-page-body">

      {isPro && (
        <div className="sp2-scope">
          <button
            className={`sp2-scope-btn${scope === 'last7' ? ' sp2-scope-active' : ''}`}
            onClick={click(() => setScope('last7'))}
          >{t('Last 7 days')}</button>
          <button
            className={`sp2-scope-btn${scope === 'all' ? ' sp2-scope-active' : ''}`}
            onClick={click(() => setScope('all'))}
          >{t('All time')}</button>
        </div>
      )}
      <p className="sp2-scope-cap">
        {lang === 'es'
          ? `${t('across every')} ${t('settings combination')} de ${t(instrument.label).toLowerCase()}`
          : lang === 'pt-BR'
          ? `${t('across every')} ${t('settings combination')} do ${t(instrument.label).toLowerCase()}`
          : lang === 'fr'
          ? `${t('across every')} ${t('settings combination')} de ${t(instrument.label).toLowerCase()}`
          : lang === 'it'
          ? `${t('across every')} ${t('settings combination')} di ${t(instrument.label).toLowerCase()}`
          : `${t('across every')} ${lang === 'he' ? t(instrument.label) : instrument.label.toLowerCase()} ${t('settings combination')}`}
        {windowed && ` · ${t('Last 7 days')}`}
      </p>

      <ScopeView
        key={windowed ? 'last7' : 'all'}
        history={history}
        noteNames={noteNames}
        accidental={accidental}
        notation={notation}
        instrument={instrument}
        windowed={windowed}
        colorblindHeat={colorblindHeat}
        open={open}
        toggle={toggle}
      />

      {/* Intervals learning progress (spec §12 / §15.1) — a self-contained
          read-only section, independent of the window toggle above and of
          every note stat. Hidden entirely when there is no interval data
          (non-Premium, or nothing drilled yet). */}
      {intervalBoard && intervalBoard.length > 0 && intervalStats && (
        <Expander
          label={t('Intervals')}
          open={open === 'intervals'}
          onToggle={toggle('intervals')}
        >
          <IntervalStatsPanel board={intervalBoard} stats={intervalStats} />
        </Expander>
      )}

      {all.length > 0 && (
        <button className="sp2-danger" onClick={click(() => setConfirm(true))}>
          {t('Clear all history')}
        </button>
      )}
      </div>

      {confirm && (
        <div className="mic-overlay" onClick={click(() => setConfirm(false))}>
          <div className="mic-card" onClick={e => e.stopPropagation()}>
            <div className="mic-card-title">{t('Clear all stats?')}</div>
            <p className="mic-card-body">
              {t('This permanently erases your entire practice history and resets the all-time mastery for every note, string and settings combination. Your personal bests are kept.')}
              {' '}<strong>{t("This can't be undone.")}</strong>
            </p>
            <div className="mic-card-actions">
              <button
                className="mic-btn mic-btn-danger"
                onClick={click(() => { setConfirm(false); onClearAll?.(); })}
              >
                {t('Delete anyway')}
              </button>
              <button className="mic-btn mic-btn-ghost" onClick={click(() => setConfirm(false))}>
                {t('Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
