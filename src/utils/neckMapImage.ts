// "My neck map" share card — renders the player's fretboard mastery heatmap
// (same per-position data as ProgressPanel's FretHeatmap) to an off-screen
// canvas, so it can be exported as a PNG and handed to shareImage().
//
// Drawn as its own fixed dark card rather than reading the app's current
// theme tokens: this is a branded artifact meant to look the same whenever
// it's shared, independent of the player's own palette pick.

import type { HistoryEntry } from './music';
import type { InstrumentConfig } from './instruments';
import { fretMasteryMap, type MasteryLevel } from './mastery';

const CUTOFF_DAYS = 7;

const CARD_W = 900;
const CARD_H = 540;

const COLOR = {
  bg: '#141430',
  title: '#ffffff',
  sub: '#c7c3e0',
  label: '#9490b8',
  unplayed: '#24244a',
  needsWork: '#f0a830',
  known: '#0ea049',
};

function heatColor(level: MasteryLevel): string {
  if (level === 'known') return COLOR.known;
  if (level === 'needsWork') return COLOR.needsWork;
  return COLOR.unplayed;
}

// Short open-note label ("String 1 · high E" -> "E"), same split ProgressPanel
// uses for the on-screen heatmap row labels.
function shortStringLabel(label: string | undefined, n: number): string {
  const parts = (label ?? '').split(/[·\s]+/).filter(Boolean);
  return parts[parts.length - 1] ?? `S${n}`;
}

// % of in-range (string, fret) positions at `known` mastery, across the whole
// neck — the single number the card's headline is built from.
export function neckKnownPct(history: HistoryEntry[], instrument: InstrumentConfig): number {
  let known = 0;
  let total = 0;
  for (let s = 1; s <= instrument.stringCount; s++) {
    const map = fretMasteryMap(history, s);
    for (let f = 0; f <= instrument.maxFret; f++) {
      total++;
      if ((map[f]?.level ?? 'unplayed') === 'known') known++;
    }
  }
  return total === 0 ? 0 : Math.round((known / total) * 100);
}

export interface NeckMapResult {
  canvas: HTMLCanvasElement;
  nowPct: number;
  beforePct: number;
  deltaPct: number;
}

// `leftHanded` only mirrors the fret axis (left-right), matching the app's
// own `[data-hand="left"] { transform: scaleX(-1) }` convention — string
// order (top-to-bottom) never flips for handedness, see 27-left-handed.css.
export function buildNeckMapCanvas(
  instrument: InstrumentConfig,
  history: HistoryEntry[],
  leftHanded: boolean,
): NeckMapResult {
  const cutoffISO = new Date(Date.now() - CUTOFF_DAYS * 86_400_000).toISOString();
  const beforeHistory = history.filter(h => h.createdAt != null && h.createdAt < cutoffISO);
  const nowPct = neckKnownPct(history, instrument);
  const beforePct = neckKnownPct(beforeHistory, instrument);
  const deltaPct = nowPct - beforePct;

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, nowPct, beforePct, deltaPct };

  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR.title;
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText(`${instrument.emoji} My ${instrument.label} neck map`, 32, 58);

  ctx.fillStyle = COLOR.sub;
  ctx.font = '24px system-ui, sans-serif';
  const deltaStr = deltaPct > 0 ? `+${deltaPct}` : `${deltaPct}`;
  ctx.fillText(`${nowPct}% known fretboard · ${deltaStr}pp this week`, 32, 94);

  const gridTop = 130;
  const gridBottom = CARD_H - 56;
  const gridLeft = 96;
  const gridRight = CARD_W - 32;
  const rows = instrument.stringCount;
  const cols = instrument.maxFret + 1;
  const rowH = (gridBottom - gridTop) / rows;
  const colW = (gridRight - gridLeft) / cols;

  for (let row = 0; row < rows; row++) {
    const stringNumber = row + 1;
    const map = fretMasteryMap(history, stringNumber);
    const y = gridTop + row * rowH;

    ctx.fillStyle = COLOR.label;
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = leftHanded ? 'left' : 'right';
    const labelX = leftHanded ? gridRight + 16 : gridLeft - 10;
    ctx.fillText(shortStringLabel(instrument.stringLabels[stringNumber], stringNumber), labelX, y + rowH / 2 + 5);

    for (let col = 0; col < cols; col++) {
      const level = map[col]?.level ?? 'unplayed';
      const drawCol = leftHanded ? cols - 1 - col : col;
      const x = gridLeft + drawCol * colW;
      ctx.fillStyle = heatColor(level);
      ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
    }
  }

  ctx.fillStyle = COLOR.label;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of instrument.dotFrets) {
    if (f > instrument.maxFret) continue;
    const drawCol = leftHanded ? cols - 1 - f : f;
    const x = gridLeft + drawCol * colW + colW / 2;
    ctx.fillText(String(f), x, gridBottom + 22);
  }

  ctx.textAlign = 'left';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLOR.label;
  ctx.fillText('Fretquency', 32, CARD_H - 20);

  return { canvas, nowPct, beforePct, deltaPct };
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

// Untranslated by design — matches buildShareCaption() in dailyChallenge.ts,
// the same "branded, symbol-heavy, not run through t()" convention already
// used for shared captions.
export function buildNeckMapCaption(instrument: InstrumentConfig, nowPct: number, deltaPct: number): string {
  const deltaStr = deltaPct > 0 ? `+${deltaPct}` : `${deltaPct}`;
  return `Fretquency ${instrument.emoji} My neck map: ${nowPct}% known (${deltaStr}pp this week)`;
}
