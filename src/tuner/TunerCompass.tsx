import { classifyCents, zoneColor, AUDIBLE_THRESHOLD_CENTS, CLEARLY_OFF_CENTS, MAX_DISPLAY_CENTS } from './tuningZones';

// A clock-hand-style needle pivoting from the exact center of the note
// wheel. 12 o'clock = in tune; the hand swings toward 9 when flat and
// toward 3 when sharp, matching a standard clip-on tuner's flat-left /
// sharp-right convention. The needle's own color is still what mainly
// carries "how far off" — this stays deliberately quiet, not a painted
// background.
//
// The one thing added beyond a bare needle: a thin, muted scale (a faint
// track + small ticks) so the full ±50-cent range reads as a range, not
// just an arbitrary swing — and a single quiet dot at dead center marking
// the "perfect" spot, which gently pulses while the needle is actually
// resting on it. No color-blocked zones, no raised gems — the moment the
// needle finds center is the only thing that gets to be loud.

const SIZE = 160;
const CENTER = SIZE / 2;
const NEEDLE_LENGTH = 50;
const TRACK_RADIUS = 62;
const TICK_STEP_CENTS = 10;

function centsToAngleDeg(cents: number): number {
  const clamped = Math.max(-MAX_DISPLAY_CENTS, Math.min(MAX_DISPLAY_CENTS, cents));
  // -50 cents -> 180deg (9 o'clock), 0 -> 90deg (12 o'clock), +50 -> 0deg (3 o'clock)
  return 1.8 * (MAX_DISPLAY_CENTS - clamped);
}

function polarPoint(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER - radius * Math.sin(rad) };
}

const trackEnds = { left: polarPoint(180, TRACK_RADIUS), right: polarPoint(0, TRACK_RADIUS) };
const TRACK_PATH = `M ${trackEnds.left.x} ${trackEnds.left.y} A ${TRACK_RADIUS} ${TRACK_RADIUS} 0 0 1 ${trackEnds.right.x} ${trackEnds.right.y}`;

const TICKS: number[] = [];
for (let c = -MAX_DISPLAY_CENTS; c <= MAX_DISPLAY_CENTS; c += TICK_STEP_CENTS) {
  if (c !== 0) TICKS.push(c);
}

interface Props {
  /** null while there's no target note (nothing pinned and nothing detected). */
  cents: number | null;
}

export default function TunerCompass({ cents }: Props) {
  const hasReading = cents !== null;
  const zone = hasReading ? classifyCents(cents) : null;
  const isPerfect = zone === 'perfect';
  const needleColor = zone ? zoneColor(zone) : 'var(--text-2, #888)';
  const needleAngle = centsToAngleDeg(hasReading ? cents : 0);
  const tip = polarPoint(needleAngle, NEEDLE_LENGTH);
  const centerDot = polarPoint(90, TRACK_RADIUS);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: SIZE,
        height: SIZE,
        pointerEvents: 'none',
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
        {/* Faint track marking the full range the needle can travel. */}
        <path d={TRACK_PATH} fill="none" stroke="var(--border-soft)" strokeWidth={1} opacity={0.5} />

        {/* Quiet ticks, roughly where the zone edges fall — not colored, just scale. */}
        {TICKS.map((c) => {
          const angle = centsToAngleDeg(c);
          const inner = polarPoint(angle, TRACK_RADIUS - 3);
          const outer = polarPoint(angle, TRACK_RADIUS + 3);
          const isZoneEdge = Math.abs(c) === AUDIBLE_THRESHOLD_CENTS || Math.abs(c) === CLEARLY_OFF_CENTS;
          return (
            <line
              key={c}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--text-2, #888)"
              strokeWidth={1}
              opacity={isZoneEdge ? 0.4 : 0.22}
            />
          );
        })}

        {/* The one accent: a quiet dot marking dead center, pulsing while the needle actually rests there. */}
        <circle
          cx={centerDot.x}
          cy={centerDot.y}
          r={3}
          fill="var(--success)"
          opacity={isPerfect ? 1 : 0.4}
          className={isPerfect ? 'tn-compass-perfect-active' : undefined}
        />

        {/* Needle, pivoting from the center like a clock hand. */}
        <line
          x1={CENTER}
          y1={CENTER}
          x2={tip.x}
          y2={tip.y}
          stroke={needleColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={CENTER} cy={CENTER} r={5} fill={needleColor} />
      </svg>
    </div>
  );
}
