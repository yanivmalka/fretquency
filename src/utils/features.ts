// The capability map: the single place that says which tier a feature needs
// (design .kiro/specs/free-pro-tiering §4.1). Nothing else in the app should
// compare tiers directly — call `can(feature, tier)` instead, so "what needs
// which tier" stays greppable and adding a tier is a `MIN_TIER` edit.

import { TIER_RANK, type Tier } from './entitlement';
import type { InstrumentId } from './instruments';

export type Feature =
  | 'historyBeyond7Days'   // the Stats & Progress screen's "All time" scope + trends
  | 'masteryMaps'          // "questions counted" window control for the mastery overlay
  | 'allPersonalBests'     // browse bests across every settings combination
  | 'fretRange'            // the precise "fret N–M" window control in Settings → Playing
  | 'multiStringFull'      // multi-string drilling on more than FREE_MULTI_STRING_LIMIT strings
  | 'voiceProfile'         // personal voice profile + calibration
  | 'extraInstruments'     // mandolin / banjo — everything past guitar, bass & ukulele
  | 'noAds'                // future: suppress Free-tier ads
  | 'seasonalBackdrop'     // the snow / flowers / leaves layer behind the app
  | 'premiumTeacher'       // The adaptive "Teacher" surface: the Today card
                           // beside the Selector, weak-spot targeting, Leitner
                           // SRS review and the daily practice goal (P2, notes
                           // only).
  | 'learningPath'         // The Learning Path screen: a visible, ordered
                           // multi-checkpoint journey shown alongside the
                           // Selector, with per-checkpoint % mastered and the
                           // planner steering sessions toward the current
                           // checkpoint (P3, notes only).
  | 'intervalDrill'        // The interval training drill and its entry card
                           // (P4, first slice): "what is a 5th above G" /
                           // "tap a M6 above this fret", with its own interval
                           // SRS schedule. The second learning domain.
  | 'scaleDrill'           // The scale training drill and its entry card
                           // (P5 scales half, first slice): "build the scale"
                           // on a multi-string board, with its own scale SRS
                           // schedule. A sibling of intervalDrill, not a layer
                           // on top of it — see scales-learning-spec.md.
  | 'staffReading'         // Staff reading: a note written on the staff →
                           // name it / find it on the neck, with its own
                           // staff SRS schedule. Its own domain, independent
                           // of the others — see staff-reading-spec.md.
  | 'tabReading'           // Tab reading: a fret number on a tab line →
                           // name it / find that place / write it / read a
                           // riff, with its own tab SRS schedule. Its own
                           // domain — see tab-reading-spec.md.
  | 'classroomJoin';       // Joining a class as a student (not creating one).
                           // Owner decision 2026-10-06, interim child-safety/
                           // consent base layer: a paid tier stands in as a
                           // COPPA-recognized signal an adult's payment method
                           // was involved, paired with a join-time self-
                           // certification checkbox (join_class RPC, migration
                           // 0031). Full legal/COPPA review is deferred to the
                           // Google Play publishing phase.

const MIN_TIER: Record<Feature, Tier> = {
  historyBeyond7Days: 'pro',
  masteryMaps:        'pro',
  allPersonalBests:   'pro',
  fretRange:          'pro',
  multiStringFull:    'pro',
  voiceProfile:       'pro',
  extraInstruments:   'pro',
  noAds:              'pro',
  seasonalBackdrop:   'pro',
  premiumTeacher:     'premium',
  learningPath:       'premium',
  intervalDrill:      'premium',
  scaleDrill:         'premium',
  staffReading:       'premium',
  tabReading:         'premium',
  classroomJoin:      'pro',
};
// `fretRange` gates the precise "from fret N to fret M" window control that
// lives in Settings → Playing (its "Precise fret range" toggle + two-handle
// slider + neck picture). The 0–12 / 12–max half-picker on the home-screen
// neck is NOT this feature and stays free for everyone; the precise window is
// an extra layer, and when it is on the home-screen neck reflects it.
//
// NOT in this map on purpose (free on every tier, design §2.3): cloud sync and
// full multi-device restore, the leaderboard (XP / questions / accuracy),
// badges / Achievements, the personal best for the combination currently being
// drilled, and the 0–12 / 12–max fret-range half-picker.
//
// Multi-string drilling is partly free: every tier can drill up to
// FREE_MULTI_STRING_LIMIT strings at once; going beyond that needs
// `multiStringFull` (Pro). `useSelector` caps a Free user's selection and
// opens the upgrade drawer when they reach for a third string.

export function can(feature: Feature, tier: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[MIN_TIER[feature]];
}

/** The minimum tier a feature needs. Lets a gate label itself ("Pro" vs
 *  "Premium") without duplicating the capability map. */
export function minTier(feature: Feature): Tier {
  return MIN_TIER[feature];
}

/** How many strings a Free user may drill at once in multi-string mode. Pro
 *  lifts this to the full string count of the instrument. */
export const FREE_MULTI_STRING_LIMIT = 2;

/** Free users still see this many days of their own history in the Stats &
 *  Progress screen. The full history is still recorded, synced and restored —
 *  this is a view filter over one screen, never a data cut (design §5.1). */
export const FREE_HISTORY_DAYS = 7;

/** Instrument ids gated behind `extraInstruments` — mandolin and banjo.
 *  Ukulele is free (owner decision, 2026-10-05): a beginner instrument with
 *  almost no good fretboard trainers of its own, worth having in the Free
 *  funnel. Single source of truth: App.tsx reads this to clamp a Free /
 *  downgraded user's saved instrument choice back to guitar (the real gate;
 *  the instrument picker's ProGate is presentation-only), and it's what
 *  `extraInstruments` itself exists to describe. */
export const PRO_ONLY_INSTRUMENTS: readonly InstrumentId[] = ['mandolin', 'banjo'];
