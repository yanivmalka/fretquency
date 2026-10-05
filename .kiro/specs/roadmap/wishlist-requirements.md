# Fretquency — Roadmap

Based on everything we discussed, here's the full roadmap organized by version.

---

## v1.0 — "Ready to Ship"

Polished core experience. No rough edges. Worth showing to the guitar community.

### Core Game

- Balanced questioning: all notes covered approximately evenly, failed notes re-queued once
- Stage progression: dots → natural → chromatic per string, clock method
- Adaptive suggestion: auto-suggest harder/easier based on accuracy
- Per-stage history and stats (localStorage)

### Settings Menu (new design)

- String selector: 6, 5, 4, 3 | 2, 1, Multi (low strings first)
- Frets: preset buttons (0-12, 12-21) + Custom toggle with +/- controls
- Question Type: By Fret / By Note
- Filter: Whole Only, Dot Frets, then ♯/♭ on second line (disabled when Whole Only)
- Notes (By Note mode): toggleable per-note selection, at least 1 required
- Circle Order (By Fret mode): By String (independent toggle) + Fifths/Alpha (radio)
- Time: 3s, 4s, 5s, 7s, 10s
- Note Names: A B C / Do Re Mi (solfege with ♭ symbol)
- Custom Stage section at bottom: rename + clear

### Stage Navigation

- Chevron arrows ‹ › (distinct from play ▶ button)
- Progress bar with per-string colored dashes
- Tap title → stage picker overlay (grouped headers, jump to first step)
- Title glows on stage change
- Swipe left/right to change stage (horizontal only, bounds-checked)
- Stage change always stops game

### Custom Stage

- When settings don't match built-in stage → "Custom Stage" mode
- Shows custom name in progress title
- Snapshot saved to localStorage, restorable from picker
- Rename and Clear buttons in settings menu
- Free user: 1 custom stage

### UX Polish

- Haptics: correct (short pulse), wrong (double pulse), stage change (medium), tap (micro)
- Click sound on ALL buttons (oscillator burst, no audio file)
- Fret button: no lingering color, glow clears 400ms after click
- No zoom, no scrollbars, app feels native
- Settings as floating burger menu overlay (tap outside to dismiss)
- Toggle buttons have dashed border (distinguishable before click)
- ? info button at bottom center, auto-dismisses after 3s
- Refresh ↻ icon near version number
- Question sound stops immediately when user answers
- Order switcher placeholder prevents layout jump between modes

### Onboarding

- First launch: instrument choice (Guitar / Bass "coming soon")
- Level: Beginner → Stage 1 / Experienced → 3-question placement test
- Skip always available
- Never shows again after completing

---

## v1.1 — "Game Feel"

The app feels rewarding. Users want another session.

### Scoring

- Points: 10 correct, +5 speed bonus (<50% timer), +10 (<25% timer)
- Streak multiplier: ×1.5 at 3, ×2 at 5, ×3 at 10. Resets quietly on wrong
- Live score counter: small, top corner, pulses on multiplier change
- Session summary card on stop: score, streak, accuracy, avg speed, personal best highlight

### Celebrations (Radial Pulse)

- Tier 1 (small win): single cyan ring from score corner (400ms), floating "+15", short tone
- Tier 2 (milestone): three gold rings from center (700ms), drop banner, medium haptic, 1.5s pause
- Tier 3 (major award): three gold→white rings (1200ms), game pauses, overlay card, share button

### Adaptive Timer

- Tightens 0.5s every 5 correct streak
- Relaxes 0.5s on wrong/timeout
- Min 2s, max stage default
- Notification: "⚡ Getting faster!" / "Take your time"

### Audio

- Question sound: reduce from 3 notes to 1, advance with user speed
- Correct: satisfying chime
- Wrong: no negative sound (just multiplier reset)
- Streak: escalating tone on consecutive correct
- Optional background practice beats (toggle, off by default)

### Multi-string emphasis

- String label flashes + scales up on string change
- Haptic pulse on string switch

### Silent Mode (premium)

- No audio, visual questions only
- For practicing in public, transit, bed

---

## v1.2 — "Know Your Progress"

Users can see improvement over time. All local, no backend.

### Mastery Visualization

- String heatmap on circle view: each string colored by success rate, fill = coverage
- Green+full = mastered, orange+half = learning, grey+empty = not started

### History & Charts

- Session history stored locally
- Progress chart: accuracy % and avg response time over last 14 sessions
- Contextual message: "You are 40% faster than when you started this stage"

### Badges

- Speed Demon: answered 10 in a row under 2s
- Perfect Session: 100% accuracy
- String Master: completed all stages for one string
- 5-of-7 Streak: practiced 5 days in any rolling 7-day window (10+ questions = 1 day)
- Most Improved: largest single-session improvement

### Practice Schedule

- Set: days/week, preferred time, session duration
- Local push notification at chosen time
- Snooze: 30min / 1hr / tomorrow
- Streak counter (gentle, not guilt-tripping)

---

## v2.0 — "Your Account"

Progress persists across devices. Community features become possible.

### Auth & Sync

- Google sign-in (Supabase Auth)
- Optional — can stay anonymous
- Progress syncs on session end (offline-first)
- Sign in on new device → full history restored

### Leaderboard

- Global: all-time score
- Weekly: most improved (not just top scorers — rewards growth)
- Your rank: "#342 of 4,800 players"

### Expertise Tests

- String Speed Test: all notes on one string, timed → notes/minute
- Full Neck Sprint: random notes, all strings, 60s → accuracy + speed
- Blind Ear Test: notes by sound only → ear training score
- Results permanent, badge + leaderboard per test type

### User Profile

- Badges, scores, stage mastery map
- Sharing controls (user chooses what's public)
- Auto-share suggestion on positive results only (never on bad sessions)

### Admin Dashboard

- DAU/MAU, session length by mode
- Most failed notes globally
- Uninstall rate + exit survey (Google Play native)
- Revenue tracking

---

## v2.1 — "Earn Your Way"

Practice earns reward. Monetization feels fair and transparent.

### Awards

- Weekly top improver (top 10): 1st = 7 days premium, 2-5 = 3 days, 6-10 = 2 days
- 5-of-7 streak: 2 days premium
- Stage mastered: 1 day premium
- Award = Tier 3 celebration moment

### Ad System (AdMob)

- Rewarded video: one per day, resets at midnight, does not accumulate
- Unlocks one feature for 24h (user chooses: all stages / walk mode / ad-free)
- High-score exception: above threshold + already used today's unlock → banks 1 for tomorrow
- Status icon always visible: available / used / banked

### Donations

- Any < $1 = 1 week premium
- $1 = 30 days
- $8 = 1 year
- Gift multiplier: donating for someone else → donor gets 1.5× equivalent days

### Community Donation Pool

- All donations enter shared pool
- Weekly weighted lottery distribution to active users
- Tiers: Bronze (500pts/wk = 1 ticket), Silver (1500 = 3), Gold (4000 = 7)
- Live pool counter visible to all
- Donors shown with 🎁 badge (opt-in), winners shown (opt-in)
- Rules TBD: can user win twice? win while on gifted plan?

### Free vs Premium

- Free: all stages, basic stats, ads shown
- Unlockable by: watching ad (1 day) / donation / earning through practice
- Premium: no ads, cloud sync, detailed analytics, walk mode, silent mode

---

## v2.2 — "Bass"

Add bass guitar support before publishing to store.

### Implementation

- Instrument selector: Guitar (6-string) / Bass (4-string)
- Bass tuning: E A D G (strings 4→1)
- Same stage system, same clock method
- Bass audio samples (free MIT-licensed library or Web Audio synthesis)
- String names and stage descriptions adapt to instrument
- All game features inherited automatically

---

## v2.3 — "Google Play"

Publish to Android app store.

### Requirements

- Capacitor Android build (already configured)
- App name, icon, store description communicating the clock method
- Privacy policy page
- Store screenshots + feature graphic
- AdMob integration for native app
- First release on Google Play

---

## v3.0 — "Walk Mode"

Practice away from screen. Completely new use case.

### Hands-Free Drill

- App speaks: "String 6, Fret 5"
- User answers by voice: "A"
- App confirms: "Correct" / "No — that was A"
- Screen can stay on or off
- Tap anywhere to stop

### Ear Training (advanced)

- Note sound plays only — no text or speech
- User says the note name
- Unlocked after completing full chromatic stage on any string

### Technical

- Web Speech API: SpeechRecognition with constrained grammar (note names only)
- SpeechSynthesis for questions
- Respects notation: solfege answers accepted
- Privacy notice: voice processed by Google (Chrome) / on-device (Safari)

---

## v3.1 — "More Instruments"

Expand to full fretted string community.

- Ukulele: G C E A (4 strings)
- Mandolin: G D A E (4 pairs, treated as 4 strings)
- Banjo (5-string): G D G B D

---

## v4.0 — "iOS"

After Android traction justifies the investment.

- Apple Developer account ($99/year)
- Mac build environment
- iOS-specific PWA push notification handling
- App Store review compliance
- Apple sign-in (required for App Store)

---

## Summary Table

| Version | Theme              | Backend        | Effort      |
|---------|--------------------|----------------|-------------|
| v1.0    | Ready to Ship      | No             | ~1 week     |
| v1.1    | Game Feel          | No             | ~1 week     |
| v1.2    | Know Your Progress | No (local)     | ~1 week     |
| v2.0    | Your Account       | Yes (Supabase) | ~2 weeks    |
| v2.1    | Earn Your Way      | Yes            | ~2 weeks    |
| v2.2    | Bass               | No             | ~3 days     |
| v2.3    | Google Play        | No             | ~2-3 days   |
| v3.0    | Walk Mode          | No             | ~1 week     |
| v3.1    | More Instruments   | No             | ~1 week     |
| v4.0    | iOS                | No             | ~1 week     |
