import type { QuickAccessId } from '../utils/quickAccess';

/**
 * The glyph shown inside a Quick Access circle (the summoned FAB and every
 * strip button). Deliberately drawn as crisp monochrome vector art in
 * `currentColor` — the same language as the Play button's triangle — rather
 * than an emoji, so the control reads as one accent-lit family in dark / night
 * / day. One icon per state of each pinnable setting; the "off" state of a
 * toggle is the same shape hollowed out or struck through, mirroring the
 * pushpin's fill-vs-outline cue.
 */
export default function QuickAccessGlyph({
  id, value,
}: {
  id: QuickAccessId;
  value: unknown;
}) {
  // The 4- and 5-wave speaker glyphs bulge past x=24 at this stroke width;
  // widen the canvas just for soundLevel so every ladder stop stays
  // unclipped while the rest of the glyph family keeps its tighter box.
  const viewBox = id === 'soundLevel' ? '0 0 28 24' : '0 0 24 24';
  return (
    <svg viewBox={viewBox} width="24" height="24" aria-hidden="true" focusable="false">
      {glyph(id, value)}
    </svg>
  );
}

const CAP = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * A speaker cone plus `n` sound waves (n = 0 draws a mute cross instead).
 * The unified loudness ladder's five sound stops draw 1…5 arcs; the silent
 * stop draws n = 0.
 */
function speaker(waves: number) {
  return (
    <>
      <path d="M3 9h3L10.5 5v14L6 15H3z" fill="currentColor" />
      {waves === 0 ? (
        <path d="M14 9.5l5 5M19 9.5l-5 5" {...CAP} />
      ) : (
        <>
          {waves >= 1 && <path d="M13 9.5a3.5 3.5 0 0 1 0 5" {...CAP} />}
          {waves >= 2 && <path d="M15.5 7.5a7 7 0 0 1 0 9" {...CAP} />}
          {waves >= 3 && <path d="M18 5.5a10.5 10.5 0 0 1 0 13" {...CAP} />}
          {waves >= 4 && <path d="M20.5 3.5a14 14 0 0 1 0 17" {...CAP} />}
          {waves >= 5 && <path d="M23 1.5a17.5 17.5 0 0 1 0 21" {...CAP} />}
        </>
      )}
    </>
  );
}

/** The phone-with-motion-lines mark used for the ladder's 'vibrate' stop. */
function vibrateMark() {
  return (
    <>
      <rect x="8" y="3" width="8" height="18" rx="2" {...CAP} />
      <path d="M4.5 8.5v7M19.5 8.5v7" {...CAP} />
    </>
  );
}

function glyph(id: QuickAccessId, value: unknown) {
  switch (id) {
    case 'notation':
      if (value === 'german') {
        return <path d="M6 3h3.4v7h5.2V3H18v18h-3.4v-7.6H9.4V21H6z" fill="currentColor" />;
      }
      return value === 'solfege'
        ? (
          <>
            <ellipse cx="9" cy="17.5" rx="3.4" ry="2.7" fill="currentColor" />
            <rect x="11.6" y="4" width="1.8" height="13.5" fill="currentColor" />
            <path d="M13.4 4c3.3 1 5 3.1 4.4 6.2-.1-2-1.9-3.5-4.4-4.3z" fill="currentColor" />
          </>
        )
        : (
          <path
            d="M12 3l7.5 18h-3.4l-1.6-4H8.5l-1.6 4H3.5zM9.6 14h4.8L12 8z"
            fill="currentColor"
            fillRule="evenodd"
          />
        );

    case 'accidental':
      return value === 'flats'
        ? (
          <>
            <path d="M9 3v15" {...CAP} strokeWidth={2.4} />
            <path d="M9 11c4.5-3.4 7.5-.7 4 3.4-1.6 1.9-4 3.1-4 3.1z" fill="currentColor" />
          </>
        )
        : (
          <path
            d="M9 4.5v15M15 4.5v15M6 11l12-2.2M6 16l12-2.2"
            {...CAP}
            strokeWidth={2.4}
          />
        );

    case 'showScore': {
      const star = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.4 6.1 21l1.2-6.5L2.5 9.9l6.6-.9z';
      return value === false
        ? <path d={star} {...CAP} strokeWidth={1.9} />
        : <path d={star} fill="currentColor" />;
    }

    case 'soundLevel': {
      // Ladder stop: 0 silent, 1 vibrate, 2..6 sound at 1..5 waves.
      const stop = typeof value === 'number' ? value : 0;
      if (stop === 1) return vibrateMark();
      return speaker(stop === 0 ? 0 : stop - 1);
    }

    case 'answerMode':
      return value === 'voice'
        ? (
          <>
            <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" />
            <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7" {...CAP} />
          </>
        )
        : value === 'guitar'
          ? <path d="M12 3c4 0 7 3.8 7 8.5 0 5-3.6 8.7-7 9.5-3.4-.8-7-4.5-7-9.5C5 6.8 8 3 12 3z" fill="currentColor" />
          : (
            <>
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M18 6l-2 2M6 18l2-2M18 18l-2-2" {...CAP} strokeWidth={1.8} />
            </>
          );

    case 'showMastery':
      return value === false
        ? (
          <>
            <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" {...CAP} />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path d="M4 20L20 4" {...CAP} strokeWidth={2.4} />
          </>
        )
        : (
          <>
            <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" {...CAP} />
            <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          </>
        );

    default:
      return null;
  }
}
