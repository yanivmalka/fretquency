import type { BadgeId, Tier } from '../utils/badges';

/**
 * A struck-medal rendering for a badge: a domed metal disc with a raised rim,
 * a specular gloss and a per-badge emblem stamped into the metal (a dark inlay
 * over a 1px light bevel). Ported from the "Fretboard Badge Book" design page.
 *
 * The metal is the *tier* (bronze/silver/gold/platinum, plus onyx for the
 * untiered Admin role) — the same tier looks identical on guitar and bass.
 * Instrument identity lives entirely in the *emblem* (a bass badge always
 * carries a distinct emblem from its guitar twin, e.g. strings4 vs strings6),
 * so a guitar/bass pair is never confusable and a tier is always recognisable
 * across every family.
 *
 * The shared metal gradients live in <BadgeMedalDefs/>, which must be mounted
 * once on any page that renders a <BadgeMedal/>.
 */

export type Metal = Tier | 'onyx';
type Emblem = keyof typeof EMBLEMS;

// Emblems authored in the 100×100 medal space, centred on 50,50, using
// `currentColor` so one path serves both the inlay and the bevel copy.
const EMBLEMS = {
  target:
    '<circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="3.4"/>' +
    '<circle cx="50" cy="50" r="8.6" fill="none" stroke="currentColor" stroke-width="3.4"/>' +
    '<circle cx="50" cy="50" r="2.7" fill="currentColor"/>',
  bolt:
    '<path d="M56 29 L39 53 h9.5 l-4.5 18 L63 45 h-9.5 Z" fill="currentColor"/>',
  flag:
    '<rect x="35" y="28" width="3.6" height="44" rx="1.6" fill="currentColor"/>' +
    '<rect x="38.6" y="31" width="26" height="19" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
    '<g fill="currentColor">' +
    '<rect x="38.6" y="31" width="8.66" height="6.33"/><rect x="55.94" y="31" width="8.66" height="6.33"/>' +
    '<rect x="47.28" y="37.33" width="8.66" height="6.33"/>' +
    '<rect x="38.6" y="43.66" width="8.66" height="6.34"/><rect x="55.94" y="43.66" width="8.66" height="6.34"/>' +
    '</g>',
  flame:
    '<path d="M50 27 C58 37 60.5 44 56.5 52 C61 50.5 62.5 46 62.5 46 C67 57 60.5 73 50 73 C39 73 33 60 39.5 47.5 C40.5 53 43.5 55.5 46 56.5 C41.5 46 45.5 35.5 50 27 Z" fill="currentColor"/>',
  comeback:
    '<path d="M33 61 C40 64 45 59 47 50 C49 41 53 35 63 35" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"/>' +
    '<path d="M56 28 L67 34.5 L55.5 41 Z" fill="currentColor"/>',
  string:
    '<path d="M30 50 q5 -11 10 0 t10 0 t10 0 t10 0" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>' +
    '<circle cx="30" cy="50" r="3.6" fill="currentColor"/><circle cx="70" cy="50" r="3.6" fill="currentColor"/>',
  // Bass per-string variant — one thick, slack wave instead of guitar's four
  // brisk ones, echoing the same "thicker = lower/bass" language as strings4
  // and lowstring below.
  stringBass:
    '<path d="M28 50 q11 -13 22 0 t22 0" fill="none" stroke="currentColor" stroke-width="4.4" stroke-linecap="round"/>' +
    '<circle cx="28" cy="50" r="3.8" fill="currentColor"/><circle cx="72" cy="50" r="3.8" fill="currentColor"/>',
  strings6:
    '<line x1="32" y1="33" x2="68" y2="33" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>' +
    '<g stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
    '<line x1="36" y1="35" x2="36" y2="62"/><line x1="41.6" y1="35" x2="41.6" y2="62"/>' +
    '<line x1="47.2" y1="35" x2="47.2" y2="62"/><line x1="52.8" y1="35" x2="52.8" y2="62"/>' +
    '<line x1="58.4" y1="35" x2="58.4" y2="62"/><line x1="64" y1="35" x2="64" y2="62"/></g>',
  strings4:
    '<line x1="33" y1="33" x2="67" y2="33" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>' +
    '<g stroke="currentColor" stroke-width="3.4" stroke-linecap="round">' +
    '<line x1="38" y1="35" x2="38" y2="62"/><line x1="46" y1="35" x2="46" y2="62"/>' +
    '<line x1="54" y1="35" x2="54" y2="62"/><line x1="62" y1="35" x2="62" y2="62"/></g>',
  calendar:
    '<rect x="33" y="35" width="34" height="31" rx="4.5" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<path d="M33 44 h34" stroke="currentColor" stroke-width="3"/>' +
    '<g fill="currentColor"><circle cx="41" cy="52" r="2.4"/><circle cx="50" cy="52" r="2.4"/><circle cx="59" cy="52" r="2.4"/>' +
    '<circle cx="41" cy="60" r="2.4"/><circle cx="50" cy="60" r="2.4"/></g>',
  calcheck:
    '<rect x="33" y="35" width="34" height="31" rx="4.5" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<path d="M33 44 h34" stroke="currentColor" stroke-width="3"/>' +
    '<path d="M40 55 l6 6 12 -13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  trophy:
    '<path d="M39 33 h22 v7 c0 8.5 -4.9 14.5 -11 14.5 S39 48.5 39 40 Z" fill="currentColor"/>' +
    '<path d="M39 35 c-6.5 0 -8.5 9 -1 11.5" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<path d="M61 35 c6.5 0 8.5 9 1 11.5" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<rect x="46.7" y="53.5" width="6.6" height="8" fill="currentColor"/>' +
    '<rect x="39" y="61" width="22" height="5.5" rx="2" fill="currentColor"/>',
  crosshair:
    '<circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<g stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
    '<line x1="50" y1="27" x2="50" y2="37"/><line x1="50" y1="63" x2="50" y2="73"/>' +
    '<line x1="27" y1="50" x2="37" y2="50"/><line x1="63" y1="50" x2="73" y2="50"/></g>' +
    '<circle cx="50" cy="50" r="2.7" fill="currentColor"/>',
  trend:
    '<path d="M31 63 h4 M31 63 L44 51 L52 57 L67 37" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M60 35 L69 33 L68 43 Z" fill="currentColor"/>',
  fretboard:
    '<rect x="29" y="40" width="42" height="20" rx="3.5" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<g stroke="currentColor" stroke-width="2.3">' +
    '<line x1="39" y1="40" x2="39" y2="60"/><line x1="50" y1="40" x2="50" y2="60"/><line x1="61" y1="40" x2="61" y2="60"/></g>' +
    '<g fill="currentColor"><circle cx="44.5" cy="50" r="1.9"/><circle cx="55.5" cy="50" r="1.9"/></g>',
  // Longer board + an extra fret division and inlay — the bass neck (24 frets).
  fretboardLong:
    '<rect x="24" y="41" width="52" height="18" rx="3.2" fill="none" stroke="currentColor" stroke-width="2.8"/>' +
    '<g stroke="currentColor" stroke-width="2.1">' +
    '<line x1="34" y1="41" x2="34" y2="59"/><line x1="43" y1="41" x2="43" y2="59"/>' +
    '<line x1="52" y1="41" x2="52" y2="59"/><line x1="61" y1="41" x2="61" y2="59"/></g>' +
    '<g fill="currentColor"><circle cx="38.5" cy="50" r="1.8"/><circle cx="56.5" cy="50" r="1.8"/><circle cx="70" cy="50" r="1.8"/></g>',
  shield:
    '<path d="M50 27 L67 33 V49 C67 61 59 69 50 73 C41 69 33 61 33 49 V33 Z" ' +
    'fill="none" stroke="currentColor" stroke-width="3.3" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="46" r="4.2" fill="currentColor"/>' +
    '<path d="M47.9 48.5 h4.2 l-1.3 9 h-1.6 Z" fill="currentColor"/>',
  // Both Ends — square brackets hugging the two ends of the neck.
  span:
    '<g fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M40 31 h-8 v38 h8"/><path d="M60 31 h8 v38 h-8"/></g>' +
    '<line x1="46" y1="50" x2="54" y2="50" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>',
  // Bass variant — a wider, thicker span (a longer neck to bracket).
  spanBass:
    '<g fill="none" stroke="currentColor" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M37 29 h-9 v42 h9"/><path d="M63 29 h9 v42 h-9"/></g>' +
    '<line x1="44" y1="50" x2="56" y2="50" stroke="currentColor" stroke-width="4.4" stroke-linecap="round"/>',
  // Quick Read — an eye.
  eye:
    '<path d="M27 50 Q50 33 73 50 Q50 67 27 50 Z" fill="none" stroke="currentColor" stroke-width="3.2"/>' +
    '<circle cx="50" cy="50" r="5.2" fill="currentColor"/>',
  // Doubling Up — two interlocked rings.
  pair:
    '<circle cx="42" cy="50" r="12.5" fill="none" stroke="currentColor" stroke-width="3.6"/>' +
    '<circle cx="58" cy="50" r="12.5" fill="none" stroke="currentColor" stroke-width="3.6"/>',
  // Low End — one thick, slack low string.
  lowstring:
    '<path d="M28 50 q11 -9 22 0 t22 0" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="28" cy="50" r="4" fill="currentColor"/><circle cx="72" cy="50" r="4" fill="currentColor"/>',
  // Multi-Instrumentalist — three interlocked rings (Doubling Up's "pair" plus one).
  trio:
    '<circle cx="38" cy="46" r="11.5" fill="none" stroke="currentColor" stroke-width="3.4"/>' +
    '<circle cx="62" cy="46" r="11.5" fill="none" stroke="currentColor" stroke-width="3.4"/>' +
    '<circle cx="50" cy="62" r="11.5" fill="none" stroke="currentColor" stroke-width="3.4"/>',
  // Teacher — a mortarboard (graduation cap), earned by passing the test.
  mortarboard:
    '<path d="M50 30 L76 42 L50 54 L24 42 Z" fill="currentColor"/>' +
    '<path d="M35 46.5 V58 c0 4.5 6.7 8 15 8 s15 -3.5 15 -8 V46.5 L50 52 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
    '<line x1="76" y1="42" x2="76" y2="60" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
    '<circle cx="76" cy="62.5" r="2.6" fill="currentColor"/>',
  // Student — an open book, earned by joining a class.
  book:
    '<path d="M50 35 C45 31 36 29 30 30 V61 C36 60 45 62 50 66 C55 62 64 60 70 61 V30 C64 29 55 31 50 35 Z" ' +
    'fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
    '<line x1="50" y1="35" x2="50" y2="66" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M35 39 h10 M35 46 h10 M35 53 h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M65 39 h-10 M65 46 h-10 M65 53 h-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
} as const;

const INLAY: Record<Metal, string> = {
  bronze:     'rgba(46,23,7,0.86)',
  silver:     'rgba(30,36,46,0.86)',
  gold:       'rgba(62,42,4,0.86)',
  platinum:   'rgba(20,30,44,0.88)',
  diamond:    'rgba(10,40,48,0.86)',
  master:     'rgba(40,14,54,0.86)',
  legendary1: 'rgba(48,10,16,0.86)',
  legendary2: 'rgba(46,26,4,0.86)',
  legendary3: 'rgba(6,36,22,0.86)',
  legendary4: 'rgba(46,34,4,0.9)',
  onyx:       'rgba(224,230,244,0.9)',
};

// Which emblem a family wears — the instrument-identity axis. Metal (the tier)
// is picked entirely separately by the caller.
function familyEmblem(id: BadgeId, instrumentId?: string): Emblem {
  const bass = instrumentId === 'bass';
  if (id.startsWith('string_master_s')) return bass ? 'stringBass' : 'string';
  if (id === 'string_master_all' || id === 'every_string') return bass ? 'strings4' : 'strings6';
  if (id === 'full_neck') return bass ? 'fretboardLong' : 'fretboard';
  if (id === 'both_ends') return bass ? 'spanBass' : 'span';
  if (id === 'low_end') return 'lowstring';
  const map: Partial<Record<BadgeId, Emblem>> = {
    perfect_session: 'target',
    speed_demon: 'bolt',
    flawless_sprint: 'flag',
    on_fire: 'flame',
    comeback: 'comeback',
    week_warrior: 'calendar',
    dedicated: 'calcheck',
    total_reps: 'trophy',
    sharpshooter: 'crosshair',
    most_improved: 'trend',
    quick_read: 'eye',
    doubling_up: 'pair',
    multi_instrumentalist: 'trio',
    admin: 'shield',
    teacher: 'mortarboard',
    student: 'book',
  };
  return map[id] ?? 'target';
}

function medalSVG(metal: Metal, emblem: Emblem): string {
  const e = EMBLEMS[emblem];
  return (
    '<svg viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false">' +
      `<circle cx="50" cy="50" r="48" fill="url(#bm-rim-${metal})"/>` +
      '<circle cx="50" cy="50" r="47.2" fill="none" stroke="url(#bm-edge)" stroke-width="1.4"/>' +
      `<circle cx="50" cy="50" r="40" fill="url(#bm-dome-${metal})"/>` +
      '<circle cx="50" cy="50" r="40" fill="none" stroke="#000" stroke-opacity="0.16" stroke-width="1"/>' +
      `<g transform="translate(0,1.3)" style="color:rgba(255,255,255,0.3)">${e}</g>` +
      `<g style="color:${INLAY[metal]}">${e}</g>` +
      '<ellipse cx="40" cy="33" rx="21" ry="12.5" fill="url(#bm-gloss)"/>' +
    '</svg>'
  );
}

export function BadgeMedal({
  id, instrumentId, tier, size = 52,
}: {
  id: BadgeId;
  /** The instrument this badge is being shown for — picks the emblem variant. */
  instrumentId?: string;
  /** The metal to render — the tier reached (or 'onyx' for the Admin role). */
  tier: Metal;
  size?: number;
}) {
  const emblem = familyEmblem(id, instrumentId);
  return (
    <span
      className="badge-medal"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: medalSVG(tier, emblem) }}
    />
  );
}

/** Shared metal gradients — mount once per page that shows a <BadgeMedal/>. */
export function BadgeMedalDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <radialGradient id="bm-dome-bronze" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffe7cb" /><stop offset="0.34" stopColor="#e2a672" />
          <stop offset="0.7" stopColor="#a86440" /><stop offset="1" stopColor="#5d3418" />
        </radialGradient>
        <radialGradient id="bm-dome-silver" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffffff" /><stop offset="0.34" stopColor="#dee2e9" />
          <stop offset="0.7" stopColor="#a3abb8" /><stop offset="1" stopColor="#616976" />
        </radialGradient>
        <radialGradient id="bm-dome-gold" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#fff7d6" /><stop offset="0.34" stopColor="#f5d270" />
          <stop offset="0.7" stopColor="#cf9a2c" /><stop offset="1" stopColor="#87610f" />
        </radialGradient>
        <radialGradient id="bm-dome-platinum" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffffff" /><stop offset="0.3" stopColor="#eef6ff" />
          <stop offset="0.62" stopColor="#bcd6ee" /><stop offset="1" stopColor="#6f93b8" />
        </radialGradient>
        <radialGradient id="bm-dome-onyx" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#7c7c93" /><stop offset="0.34" stopColor="#45454f" />
          <stop offset="0.7" stopColor="#26262f" /><stop offset="1" stopColor="#111117" />
        </radialGradient>
        <radialGradient id="bm-dome-diamond" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#eafcff" /><stop offset="0.34" stopColor="#b9f0ff" />
          <stop offset="0.7" stopColor="#57c8e0" /><stop offset="1" stopColor="#1f6d82" />
        </radialGradient>
        <radialGradient id="bm-dome-master" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#f0e2ff" /><stop offset="0.34" stopColor="#c9a0f0" />
          <stop offset="0.7" stopColor="#8a4fd1" /><stop offset="1" stopColor="#4a1f80" />
        </radialGradient>
        <radialGradient id="bm-dome-legendary1" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffdada" /><stop offset="0.34" stopColor="#f0898a" />
          <stop offset="0.7" stopColor="#c23b4e" /><stop offset="1" stopColor="#6e1420" />
        </radialGradient>
        <radialGradient id="bm-dome-legendary2" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#fff0d0" /><stop offset="0.34" stopColor="#ffcf7a" />
          <stop offset="0.7" stopColor="#e08a1f" /><stop offset="1" stopColor="#8a4a06" />
        </radialGradient>
        <radialGradient id="bm-dome-legendary3" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#daffea" /><stop offset="0.34" stopColor="#7fe0b0" />
          <stop offset="0.7" stopColor="#1f9d63" /><stop offset="1" stopColor="#0a5c37" />
        </radialGradient>
        <radialGradient id="bm-dome-legendary4" cx="35%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffffff" /><stop offset="0.32" stopColor="#fff2c9" />
          <stop offset="0.68" stopColor="#f0c94a" /><stop offset="1" stopColor="#ad7a12" />
        </radialGradient>
        <linearGradient id="bm-rim-bronze" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4d0a9" /><stop offset="0.5" stopColor="#ac6c41" /><stop offset="1" stopColor="#61371b" />
        </linearGradient>
        <linearGradient id="bm-rim-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3f5f8" /><stop offset="0.5" stopColor="#aab1bd" /><stop offset="1" stopColor="#69717d" />
        </linearGradient>
        <linearGradient id="bm-rim-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffeab0" /><stop offset="0.5" stopColor="#c9942a" /><stop offset="1" stopColor="#79540e" />
        </linearGradient>
        <linearGradient id="bm-rim-platinum" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset="0.5" stopColor="#bcd9f2" /><stop offset="1" stopColor="#5c85ad" />
        </linearGradient>
        <linearGradient id="bm-rim-onyx" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9797ab" /><stop offset="0.5" stopColor="#3d3d49" /><stop offset="1" stopColor="#191920" />
        </linearGradient>
        <linearGradient id="bm-rim-diamond" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dffaff" /><stop offset="0.5" stopColor="#6fcbe0" /><stop offset="1" stopColor="#2c7f96" />
        </linearGradient>
        <linearGradient id="bm-rim-master" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ecd9ff" /><stop offset="0.5" stopColor="#a568de" /><stop offset="1" stopColor="#5c2a95" />
        </linearGradient>
        <linearGradient id="bm-rim-legendary1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc6c6" /><stop offset="0.5" stopColor="#d9576b" /><stop offset="1" stopColor="#7a1a29" />
        </linearGradient>
        <linearGradient id="bm-rim-legendary2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe0a3" /><stop offset="0.5" stopColor="#f0a635" /><stop offset="1" stopColor="#96570c" />
        </linearGradient>
        <linearGradient id="bm-rim-legendary3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bff5d6" /><stop offset="0.5" stopColor="#39b579" /><stop offset="1" stopColor="#0c6b40" />
        </linearGradient>
        <linearGradient id="bm-rim-legendary4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset="0.5" stopColor="#f5da84" /><stop offset="1" stopColor="#b8871c" />
        </linearGradient>
        <linearGradient id="bm-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="bm-gloss" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="0.68" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
