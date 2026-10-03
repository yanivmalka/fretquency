// ── ScaleRingTips — "Make it ring", the card before step 0 of the path ────
//
// product-wishlist.md, Scales, 2026-10-03 item 2: before any scale, a teacher
// checks that one note rings — thumb behind the neck, fingertip just behind
// the fret wire, the finger arched so the next string stays free. Two static
// drawings and four short tips; no logic, nothing stored.
//
// The drawings hold no text, so nothing in them reads backwards in Hebrew.
// The fretboard view puts the headstock on the left like the app's necks, and
// the left-handed setting mirrors it (30-scale-board.css).

import { useTranslation } from '../i18n/useTranslation';

/** Strings drawn in the cross-section: the instrument's own count, capped. */
const MAX_DRAWN_STRINGS = 8;

export default function ScaleRingTips({ stringCount }: { stringCount: number }) {
  const { t } = useTranslation();
  const n = Math.max(1, Math.min(stringCount, MAX_DRAWN_STRINGS));

  // Fretboard from above: strings across, fret wires down.
  const topStrings = [16, 32, 48, 64];
  // Cross-section of the neck, seen from the headstock: strings on top,
  // the thumb behind it at the bottom.
  const crossX = (i: number) => (n === 1 ? 80 : 34 + (i * 92) / (n - 1));
  const pressed = Math.min(n - 1, Math.floor((n - 1) / 2));

  return (
    <div className="scale-ring">
      <div className="scale-ring-figures">
        <figure className="scale-ring-figure scale-ring-top">
          <svg viewBox="0 0 160 80" role="img" aria-label={t('Where the fingertip goes')}>
            <rect x="0" y="8" width="160" height="64" rx="4" className="scale-ring-wood" />
            {[20, 80, 140].map((x) => (
              <line key={x} x1={x} y1="8" x2={x} y2="72" className="scale-ring-fret" />
            ))}
            {topStrings.map((y) => (
              <line key={y} x1="0" y1={y} x2="160" y2={y} className="scale-ring-string" />
            ))}
            {/* Good: just behind the fret wire. */}
            <circle cx="71" cy="32" r="7" className="scale-ring-good" />
            {/* Not here: on top of the wire. */}
            <circle cx="140" cy="48" r="8" className="scale-ring-bad" />
            <line x1="134" y1="42" x2="146" y2="54" className="scale-ring-bad-x" />
            <line x1="146" y1="42" x2="134" y2="54" className="scale-ring-bad-x" />
          </svg>
          <figcaption>{t('Where the fingertip goes')}</figcaption>
        </figure>
        <figure className="scale-ring-figure">
          <svg viewBox="0 -14 160 118" role="img" aria-label={t('Arch the finger, thumb behind the neck')}>
            <path d="M20 34 L140 34 Q140 84 80 84 Q20 84 20 34 Z" className="scale-ring-wood" />
            {Array.from({ length: n }, (_, i) => (
              <circle key={i} cx={crossX(i)} cy="30" r="3" className="scale-ring-string-dot" />
            ))}
            {/* The finger comes over the top in an arch and lands on its tip. */}
            <path
              d={`M6 6 C 30 -10, ${crossX(pressed) - 6} -8, ${crossX(pressed)} 25`}
              className="scale-ring-finger"
            />
            {/* The thumb, behind the neck. */}
            <ellipse cx="80" cy="94" rx="13" ry="7" className="scale-ring-thumb" />
          </svg>
          <figcaption>{t('Arch the finger, thumb behind the neck')}</figcaption>
        </figure>
      </div>
      <ol className="scale-ring-tips">
        <li>{t('Thumb behind the neck, about behind your middle finger — not wrapped over the top.')}</li>
        <li>{t('Fingertip just behind the fret wire, not on top of it.')}</li>
        <li>{t('Arch the finger so only the tip touches: the string next to it must still ring.')}</li>
        <li>{t('One finger per fret: finger 1 on fret 5, 2 on 6, 3 on 7, 4 on 8. Let each note ring before the next.')}</li>
      </ol>
    </div>
  );
}
