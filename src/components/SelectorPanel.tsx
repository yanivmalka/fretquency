import type { SelectorState, Difficulty } from '../hooks/useSelector';
import type { AccidentalMode, OrderMode, NotationMode } from '../utils/music';
import { displayNote, solfegeSample } from '../utils/music';
import type { InstrumentConfig } from '../utils/instruments';
import { playClickSound, playToggleOnSound, playToggleOffSound } from '../utils/feedback';
import { useTranslation } from '../i18n/useTranslation';
import { useLockHint } from './LockHint';
import { openUpgrade } from '../utils/upgradeDrawer';
import { FREE_MULTI_STRING_LIMIT } from '../utils/features';
import FretRangeConflictDialog from './FretRangeConflictDialog';
import {
  fretXFor, NECK_RIGHT, FB_LEFT_MARGIN, FB_TOP, FB_HEIGHT, FB_BOTTOM,
} from '../utils/neckGeometry';

interface SelectorPanelProps {
  selector: SelectorState;
  instrument: InstrumentConfig;
  onStringSelect: (stringNum: number) => void;
  onMultiToggle: () => void;
  onModeSelect: (mode: 'byNote' | 'byFret') => void;
  onFretRangeToggle: (half: 'lower' | 'upper') => void;
  /** Whether the current user is Pro — decides if the stored precise fret
   *  window (set in Settings → Playing) is actually in effect. It stays saved
   *  but unused for a free user; here it only tints the half-picker neck. */
  isPro?: boolean;
  onDifficultySelect: (diff: Difficulty) => void;
  onAutoAdvanceToggle?: () => void;
  isPlaying: boolean;
  activeString?: number;
  activeFret?: number | null;
  byString?: boolean;
  order?: OrderMode;
  onByStringToggle?: () => void;
  onOrderChange?: (o: OrderMode) => void;
  accidental?: AccidentalMode;
  notation?: NotationMode;
  onNotationChange?: (n: NotationMode) => void;
  /** Render only the A-B-C / Do-Re-Mi notation toggle (used in the hamburger
   *  overlay); the rest of the panel stays inline on the page. */
  notationOnly?: boolean;
  /** Opens the "how the clock method works" bubble; rendered in the corner of
   *  the Note-by-Fret card. */
  onInfo?: () => void;
  showInfo?: boolean;
  /** Fret range conflict state when removing strings from multi-string mode */
  onFretRangeConflict?: {
    isOpen: boolean;
    stringToRemove: number | null;
  } | null;
  /** Handler for fret range conflict resolution */
  onFretRangeConflictResolve?: (
    action: 'auto' | 'manual' | 'cancel',
    newLo?: number,
    newHi?: number,
  ) => void;
}

export default function SelectorPanel({
  selector, instrument, onStringSelect, onMultiToggle, onModeSelect,
  onFretRangeToggle, isPro,
  onDifficultySelect, onAutoAdvanceToggle, isPlaying, activeString, activeFret,
  byString, order, onByStringToggle, onOrderChange, accidental, notation, onNotationChange,
  notationOnly, onInfo, showInfo,
  onFretRangeConflict,
  onFretRangeConflictResolve,
}: SelectorPanelProps) {
  const { t, lang } = useTranslation();
  const { showLockHint, lockHintNode } = useLockHint();
  const maxFret = instrument.maxFret;
  const stringCount = instrument.stringCount;
  const dotFrets = instrument.dotFrets;

  // Scale so the last fret always lands at the left margin, whatever the neck length.
  const fretX = fretXFor(maxFret);

  // String pills — one per string, labelled by its open-string note name.
  // Ordered low-pitch → high-pitch left-to-right (lowest string, i.e. the
  // highest string *number*, first) so it reads the way string names are
  // written in chord charts / tab: guitar E A D G B E, bass E A D G.
  const strings = Array.from({ length: stringCount }, (_, i) => {
    const num = stringCount - i;
    return { label: displayNote(instrument.notes[num - 1][0], accidental ?? 'sharps', notation), num };
  });

  // Y of a given 1-based string number inside the fretboard rect.
  const stringY = (num: number) =>
    FB_TOP + 5 + (stringCount - num) * (FB_HEIGHT - 10) / (stringCount - 1);

  const splitX = fretX(12);
  const fbLeft = FB_LEFT_MARGIN - 3;

  // The precise Pro window is actually driving the round (Pro + toggle on): the
  // half-picker is then just a dimmed backdrop with a cyan bar marking the live
  // window, and every fret label reads from it.
  const preciseActive = !!isPro && selector.useFretRange;
  const clampFret = (f: number) => Math.max(0, Math.min(f, maxFret));
  // While a precise window drives the round the difficulty road is pinned to
  // Full (Dots / Naturals are locked), so the highlighted stage follows suit.
  const activeDiff = preciseActive ? 'full' : selector.difficulty;

  // Plain-language summary of everything the current selection means, shown at
  // the top of the "?" bubble so the player can read what this round will drill
  // before starting it. Reads from the same SelectorState the pills/cards set.
  const selectedStringLabels = selector.selectedStrings
    .slice()
    .sort((a, b) => b - a) // low-pitch (higher string number) first
    .map((n) => displayNote(instrument.notes[n - 1][0], accidental ?? 'sharps', notation));
  const stringsPhrase = selectedStringLabels.length === stringCount
    ? `${t('all')} ${stringCount} ${t('strings')}`
    : selectedStringLabels.length === 1
      ? (lang === 'he' ? `מיתר ${selectedStringLabels[0]}`
        : lang === 'es' ? `la cuerda ${selectedStringLabels[0]}`
        : lang === 'pt-BR' ? `a corda ${selectedStringLabels[0]}`
        : lang === 'fr' ? `la corde ${selectedStringLabels[0]}`
        : lang === 'it' ? `la corda ${selectedStringLabels[0]}`
        : `the ${selectedStringLabels[0]} string`)
      : `${t('strings')} ${selectedStringLabels.join(', ')}`;
  const fretsPhrase = preciseActive
    ? `${t('frets')} ${selector.fretLo}–${selector.fretHi}`
    : selector.lowerActive && selector.upperActive
      ? `${t('frets')} 0–${maxFret}`
      : selector.lowerActive ? `${t('frets')} 0–12` : `${t('frets')} 12–${maxFret}`;
  const difficultyPhrase = activeDiff === 'dots'
    ? t('only the dot-marker frets')
    : activeDiff === 'naturals'
      ? t('natural notes only (no sharps or flats)')
      : t('every note, sharps and flats included');
  const orderPhrase = order === 'alphabet' ? t('alphabetical order') : t('circle-of-fifths order');
  const modeSentence = selector.mode === 'byFret'
    ? `${t('A fret lights up and you pick its note from the wheel')} (${orderPhrase}${byString ? t(', rotated to the string') : ''}).`
    : t('A note name is shown and you tap every fret on the neck where it lands.');
  const selectionSummary =
    `${t(selector.mode === 'byFret' ? 'Note-by-Fret' : 'Fret-by-Note')} · ${stringsPhrase}, ${fretsPhrase}, ${difficultyPhrase}. ${modeSentence}`
    + (selector.autoAdvance ? ` ${t('Auto-advances through the difficulty stages.')}` : '');

  // The "?" marker, pinned to a mode card's corner. Rendered on whichever mode
  // card is currently selected (originally only Note-by-Fret) so the summary is
  // reachable in both modes.
  const infoBadge = (
    <span
      className="mode-card-info"
      role="button"
      tabIndex={0}
      aria-label={t('How this works')}
      title={t('How this works')}
      onClick={(e) => { e.stopPropagation(); playClickSound(); onInfo?.(); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); playClickSound(); onInfo?.(); }
      }}
    >
      ?
    </span>
  );

  // Hamburger overlay: just the note-name notation toggle. Everything else in
  // the panel stays inline on the page.
  if (notationOnly) {
    if (!onNotationChange) return null;
    return (
      <div className="notation-row">
        <button
          className={`order-chip${notation === 'alpha' ? ' order-chip-active' : ''}`}
          onClick={() => onNotationChange('alpha')}
        >A B C</button>
        <button
          className={`order-chip${notation === 'solfege' ? ' order-chip-active' : ''}`}
          onClick={() => onNotationChange('solfege')}
        >{solfegeSample()}</button>
      </div>
    );
  }

  // During gameplay: show minimized panel with just info + fret neck
  if (isPlaying) {
    const strLabels = selector.selectedStrings.map(n => strings.find(s => s.num === n)?.label ?? '').join(' ');
    const fretLabel = preciseActive
      ? `${selector.fretLo}-${selector.fretHi}`
      : selector.lowerActive && selector.upperActive ? `0-${maxFret}` : selector.lowerActive ? '0-12' : `12-${maxFret}`;
    const modeLabel = selector.mode === 'byFret' ? 'N→F' : 'F→N';
    const diffLabel = activeDiff === 'dots' ? '●' : activeDiff === 'naturals' ? '♮' : '♯♭';
    return (
      <div className="selector-panel selector-panel-mini">
        <div className="selector-mini">
          <span className="selector-mini-item">{strLabels}</span>
          <span className="selector-mini-sep">·</span>
          <span className="selector-mini-item">{modeLabel}</span>
          <span className="selector-mini-sep">·</span>
          <span className="selector-mini-item">{fretLabel}</span>
          <span className="selector-mini-sep">·</span>
          <span className="selector-mini-item">{diffLabel}</span>
        </div>
        <div className="fret-neck">
          <svg viewBox={`${fbLeft - 5} ${FB_TOP - 3} ${NECK_RIGHT - fbLeft + 12} ${FB_HEIGHT + 16}`} aria-label={`${t(instrument.label)} ${t('neck')}`}>
            <rect x={fbLeft} y={FB_TOP} width={NECK_RIGHT - fbLeft} height={FB_HEIGHT} rx="2" fill="#3d2b1f" />
            {Array.from({ length: stringCount }, (_, i) => {
              const y = stringY(stringCount - i);
              const thickness = 0.9 - i * 0.1;
              return <line key={`str${i}`} x1={fbLeft} y1={y} x2={NECK_RIGHT} y2={y} stroke="#cba" strokeWidth={thickness} opacity="0.5" />;
            })}
            {activeString != null && (
              <line key={activeString} className="mini-neck-active-string" x1={fbLeft} y1={stringY(activeString)} x2={NECK_RIGHT} y2={stringY(activeString)} stroke="var(--accent)" strokeWidth="1.8" opacity="0.9" />
            )}
            {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
              <line key={f} x1={fretX(f)} y1={FB_TOP} x2={fretX(f)} y2={FB_BOTTOM} stroke="var(--text-3)" strokeWidth="1" />
            ))}
            {dotFrets.map((f) => {
              const cx = (fretX(f - 1) + fretX(f)) / 2;
              const midY = FB_TOP + FB_HEIGHT / 2;
              if (f === 12) return <g key={f}><circle cx={cx} cy={midY - 7} r="2.5" fill="#ddd" opacity="0.8" /><circle cx={cx} cy={midY + 7} r="2.5" fill="#ddd" opacity="0.8" /></g>;
              return <circle key={f} cx={cx} cy={midY} r="2.5" fill="#ddd" opacity="0.8" />;
            })}
            {activeFret != null && activeFret >= 0 && activeFret <= maxFret && (
              <circle cx={activeFret === 0 ? NECK_RIGHT + 1 : (fretX(activeFret - 1) + fretX(activeFret)) / 2} cy={activeString ? stringY(activeString) : FB_TOP + FB_HEIGHT / 2} r="4" fill="var(--accent)" opacity="0.85" />
            )}
            <line x1={NECK_RIGHT} y1={FB_TOP} x2={NECK_RIGHT} y2={FB_BOTTOM} stroke="#f5f0e8" strokeWidth="3.5" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="selector-panel">
      {/* ── StringRow ─────────────────────────────────────── */}
      {/* Free tier drills at most FREE_MULTI_STRING_LIMIT strings at once; once
          that many are picked, the remaining pills read as locked and a tap on
          one opens the Pro upsell instead of selecting it (the same guard lives
          in useSelector, this is just the visual cue). */}
      <div data-search-anchor="sel-strings" className={`selector-strings ${notation === 'solfege' ? 'selector-strings-compact' : ''}`}>
        {strings.map(({ label, num }) => {
          const selected = selector.selectedStrings.includes(num);
          const capped = !isPro && selector.multiMode && !selected
            && selector.selectedStrings.length >= FREE_MULTI_STRING_LIMIT;
          return (
            <button
              key={num}
              className={`string-pill ${selected ? 'active' : ''} ${capped ? 'string-pill-locked' : ''}`}
              aria-disabled={capped || undefined}
              onClick={() => {
                if (capped) { playClickSound(); openUpgrade(); return; }
                if (selected) playToggleOffSound(); else playToggleOnSound();
                onStringSelect(num);
              }}
            >{label}</button>
          );
        })}
        <button className={`string-pill string-pill-toggle ${selector.multiMode ? 'active' : ''}`} onClick={() => { if (selector.multiMode) playToggleOffSound(); else playToggleOnSound(); onMultiToggle(); }}>
          {t('Multi')}{!isPro && <span className="string-pill-pro-tag">Pro 1–{stringCount}</span>}
        </button>
      </div>

      {/* ── ModeToggle with order options between cards ── */}
      <div className="mode-cards" data-search-anchor="sel-mode">
        <button className={`mode-card ${selector.mode === 'byFret' ? 'active' : ''}`} onClick={() => { playClickSound(); onModeSelect('byFret'); }}>
          {onInfo && selector.mode === 'byFret' && infoBadge}
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const bx = 20 + 14 * Math.cos(angle);
              const by = 20 + 14 * Math.sin(angle);
              const enabled = [0, 3, 5, 7, 9].includes(i);
              return <circle key={i} cx={bx} cy={by} r="3" fill="currentColor" opacity={enabled ? 1 : 0.2} />;
            })}
          </svg>
          <span>{t('Note by Fret')}</span>
        </button>

        {/* Order options — stacked vertically between the two mode cards, visible only for byFret */}
        <div className={`mode-order-col ${selector.mode === 'byFret' ? 'mode-order-show' : 'mode-order-hide'}`}>
          {onOrderChange && <button className={`order-chip${order === 'alphabet' ? ' order-chip-active' : ''}`} onClick={() => onOrderChange('alphabet')}>{t('Alpha')}</button>}
          {onOrderChange && <button className={`order-chip${order === 'fifths' ? ' order-chip-active' : ''}`} onClick={() => onOrderChange('fifths')}>{t('Fifths')}</button>}
          {onByStringToggle && <button className={`order-chip chip-toggle${byString ? ' chip-toggle-active' : ''}`} onClick={onByStringToggle}>{t('By String')}</button>}
        </div>

        <button className={`mode-card ${selector.mode === 'byNote' ? 'active' : ''}`} onClick={() => { playClickSound(); onModeSelect('byNote'); }}>
          {onInfo && selector.mode === 'byNote' && infoBadge}
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            {[
              { x: 2, y: 2, op: 1 }, { x: 12, y: 2, op: 0.2 }, { x: 22, y: 2, op: 0.2 }, { x: 32, y: 2, op: 1 },
              { x: 2, y: 15, op: 0.2 }, { x: 12, y: 15, op: 1 }, { x: 22, y: 15, op: 0.2 }, { x: 32, y: 15, op: 1 },
              { x: 2, y: 28, op: 0.2 }, { x: 12, y: 28, op: 1 },
            ].map(({ x, y, op }, i) => (
              <rect key={i} x={x} y={y} width="8" height="10" rx="2" fill="currentColor" opacity={op} />
            ))}
          </svg>
          <span>{t('Fret by Note')}</span>
        </button>

        {onInfo && showInfo && (
          <div className="mode-card-info-bubble" role="status" aria-live="polite">
            <span className="mode-card-info-summary">{selectionSummary}</span>
            {selector.mode === 'byFret'
              ? t("Read the note wheel like a clock: your open string sits at 12 o'clock, and the dots under each note show its fret. Answer before the timing bar empties.")
              : t('Answer before the timing bar empties.')}
          </div>
        )}
      </div>

      {/* ── FretRangeNeck SVG ─────────────────────────────── */}
      {/* This 0–12 / 12–max half-picker is free for everyone. A finer
          "fret N to fret M" range selector is planned as a Pro feature
          (`fretRange` in utils/features.ts) but is not surfaced yet. */}
      <div className="fret-neck" data-search-anchor="sel-frets">
        <svg viewBox={`${fbLeft - 5} ${FB_TOP - 3} ${NECK_RIGHT - fbLeft + 12} ${FB_HEIGHT + 16}`} aria-label={`${t(instrument.label)} ${t('neck fret range selector')}`}>
          {/* Fretboard — only covers where frets actually are */}
          <rect x={fbLeft} y={FB_TOP} width={NECK_RIGHT - fbLeft} height={FB_HEIGHT} rx="2" fill="#3d2b1f" />

          {/* Strings — lowest (thickest) at top, highest (thinnest) at bottom */}
          {Array.from({ length: stringCount }, (_, i) => {
            const y = stringY(stringCount - i);
            const thickness = 0.9 - i * 0.1;
            return <line key={`str${i}`} x1={fbLeft} y1={y} x2={NECK_RIGHT} y2={y} stroke="#cba" strokeWidth={thickness} opacity="0.5" />;
          })}

          {/* Highlight the string(s) being drilled: the single active string
              during play, or every currently-selected string while setting up —
              so the neck preview shows where the round will test before it
              starts (same cyan the play view uses). */}
          {activeString != null ? (
            <line
              x1={fbLeft}
              y1={stringY(activeString)}
              x2={NECK_RIGHT}
              y2={stringY(activeString)}
              stroke="var(--accent)" strokeWidth="1.8" opacity="0.9"
            />
          ) : (
            selector.selectedStrings.map((sn) => (
              <line
                key={`sel${sn}`}
                x1={fbLeft}
                y1={stringY(sn)}
                x2={NECK_RIGHT}
                y2={stringY(sn)}
                stroke="var(--accent)" strokeWidth="1.8" opacity="0.9"
              />
            ))
          )}

          {/* Fret lines */}
          {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
            <line key={f} x1={fretX(f)} y1={FB_TOP} x2={fretX(f)} y2={FB_BOTTOM} stroke="var(--text-3)" strokeWidth="1" />
          ))}

          {/* Dot markers */}
          {dotFrets.map((f) => {
            const cx = (fretX(f - 1) + fretX(f)) / 2;
            const midY = FB_TOP + FB_HEIGHT / 2;
            if (f === 12) return <g key={f}><circle cx={cx} cy={midY - 7} r="2.5" fill="#ddd" opacity="0.8" /><circle cx={cx} cy={midY + 7} r="2.5" fill="#ddd" opacity="0.8" /></g>;
            return <circle key={f} cx={cx} cy={midY} r="2.5" fill="#ddd" opacity="0.8" />;
          })}

          {/* Highlight active fret */}
          {activeFret != null && activeFret >= 0 && activeFret <= maxFret && (
            <circle
              cx={activeFret === 0 ? NECK_RIGHT + 1 : (fretX(activeFret - 1) + fretX(activeFret)) / 2}
              cy={activeString ? stringY(activeString) : FB_TOP + FB_HEIGHT / 2}
              r="4" fill="var(--accent)" opacity="0.85"
            />
          )}

          {/* Nut (right edge) */}
          <line x1={NECK_RIGHT} y1={FB_TOP} x2={NECK_RIGHT} y2={FB_BOTTOM} stroke="#f5f0e8" strokeWidth="3.5" />

          {/* Dim inactive halves — only while the precise Pro window isn't
              driving the round, otherwise its own shading (below) would stack
              on top of this one. */}
          {!preciseActive && !selector.lowerActive && (
            <rect x={fretX(11)} y={FB_TOP} width={NECK_RIGHT - fretX(11)} height={FB_HEIGHT} fill="rgba(0,0,0,0.6)" rx="2" />
          )}
          {!preciseActive && !selector.upperActive && (
            <rect x={fbLeft} y={FB_TOP} width={splitX - fbLeft} height={FB_HEIGHT} fill="rgba(0,0,0,0.6)" rx="2" />
          )}

          {/* Tap targets — no sound if tapping the only active half (no-op) */}
          <rect x={splitX} y={FB_TOP} width={NECK_RIGHT - splitX} height={FB_HEIGHT} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => {
            playClickSound(); onFretRangeToggle('lower');
          }} />
          <rect x={fbLeft} y={FB_TOP} width={splitX - fbLeft} height={FB_HEIGHT} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => {
            playClickSound(); onFretRangeToggle('upper');
          }} />

          {/* Precise Pro window (set in Settings → Playing) in effect: shade the
              frets outside the drilled span so the dark silhouette tracks the
              exact window — no separate bar under the neck. */}
          {preciseActive && (
            <>
              <rect
                x={fbLeft}
                y={FB_TOP}
                width={Math.max(0, fretX(clampFret(selector.fretHi)) - fbLeft)}
                height={FB_HEIGHT}
                fill="rgba(0,0,0,0.6)"
                rx="2"
              />
              <rect
                x={fretX(clampFret(selector.fretLo))}
                y={FB_TOP}
                width={Math.max(0, NECK_RIGHT - fretX(clampFret(selector.fretLo)))}
                height={FB_HEIGHT}
                fill="rgba(0,0,0,0.6)"
                rx="2"
              />
            </>
          )}

          {/* Labels — highlighted when active; muted while the precise window overrides them */}
          <text x={(splitX + NECK_RIGHT) / 2} y={FB_BOTTOM + 11} textAnchor="middle" fontSize="8" fill={preciseActive ? 'var(--border-soft)' : selector.lowerActive ? 'var(--accent)' : 'var(--border-soft)'} fontWeight={!preciseActive && selector.lowerActive ? 'bold' : 'normal'}>0–12</text>
          <text x={(fbLeft + splitX) / 2} y={FB_BOTTOM + 11} textAnchor="middle" fontSize="8" fill={preciseActive ? 'var(--border-soft)' : selector.upperActive ? 'var(--accent)' : 'var(--border-soft)'} fontWeight={!preciseActive && selector.upperActive ? 'bold' : 'normal'}>12–{maxFret}</text>
        </svg>
      </div>

      {/* The precise "fret N–M" window (Pro, gated by `fretRange`) now lives in
          Settings → Playing; its neck here just reflects it via `preciseActive`. */}

      {/* ── DifficultyRoad ────────────────────────────────── */}
      {/* A precise fret window runs at Full only — Dots / Naturals lock and the
          active stage reads as Full while it's on (see useSelector). */}
      <div className="difficulty-road" data-search-anchor="sel-difficulty">
        <button
          className={`diff-btn ${activeDiff === 'dots' ? 'active' : ''}${preciseActive ? ' diff-btn-locked' : ''}`}
          aria-disabled={preciseActive || undefined}
          title={preciseActive ? t('Full only while a precise fret window is on') : undefined}
          onClick={(e) => {
            playClickSound();
            if (preciseActive) { showLockHint(e.currentTarget, t('Full only while a precise fret window is on')); return; }
            onDifficultySelect('dots');
          }}
        ><span className="diff-icon">●</span><span className="diff-label">{t('Dots')}</span></button>
        <span className="diff-arrow">→</span>
        <button
          className={`diff-btn ${activeDiff === 'naturals' ? 'active' : ''}${preciseActive ? ' diff-btn-locked' : ''}`}
          aria-disabled={preciseActive || undefined}
          title={preciseActive ? t('Full only while a precise fret window is on') : undefined}
          onClick={(e) => {
            playClickSound();
            if (preciseActive) { showLockHint(e.currentTarget, t('Full only while a precise fret window is on')); return; }
            onDifficultySelect('naturals');
          }}
        ><span className="diff-icon">♮</span><span className="diff-label">{t('Naturals')}</span></button>
        <span className="diff-arrow">→</span>
        <button className={`diff-btn ${activeDiff === 'full' ? 'active' : ''}`} onClick={() => { playClickSound(); onDifficultySelect('full'); }}><span className="diff-icon">♯♭</span><span className="diff-label">{t('Full')}</span></button>
        {/* Auto Advance: continue straight into the next difficulty when the current one is completed */}
        {onAutoAdvanceToggle && (
          <button
            className={`stats-icon-btn auto-advance-toggle ${selector.autoAdvance ? 'stats-icon-on' : ''}`}
            onClick={(e) => { e.currentTarget.blur(); onAutoAdvanceToggle(); }}
            title={t('Auto Advance to next difficulty')}
            aria-label={t('Auto Advance to next difficulty')}
            aria-pressed={selector.autoAdvance}
          >
            <svg viewBox="0 0 20 20" width="16" height="16"><polygon points="3,3 10,10 3,17" fill="currentColor"/><polygon points="10,3 17,10 10,17" fill="currentColor"/></svg>
          </button>
        )}
      </div>

      {lockHintNode}

      {/* Fret Range Conflict Dialog */}
      {onFretRangeConflict && onFretRangeConflictResolve && (
        <FretRangeConflictDialog
          instrument={instrument}
          currentFretLo={selector.fretLo}
          currentFretHi={selector.fretHi}
          selectedStrings={selector.selectedStrings}
          minNotes={4}
          onResolve={onFretRangeConflictResolve}
          isOpen={onFretRangeConflict.isOpen}
        />
      )}
    </div>
  );
}
