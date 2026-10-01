# Scales Learning — Design Specification

Status: **design resolved (§17), scope confirmed by the product owner,
Slice 1 (Minor Pentatonic) implementation IN PROGRESS — see "Session 1
progress" and then "Session 2 plan" below before writing more code.** This
document was drafted by mirroring the shipped Intervals Learning domain
(§0–§3 below explain how) so it could be reviewed against a concrete
precedent rather than from a blank page.

## Session 7 (2026-10-01) — answer "Tap the scale in order" by playing

The product owner asked to start improving Scales with answering by playing
the guitar, beginning with "Tap the scale in order" (a run is one note at a
time in a known order, so pitch alone is enough to judge it).

- `src/hooks/usePitchStream.ts` — a continuous listener on the tuner's
  detector: the mic stays open while the learner's turn lasts and each new
  note (stable for two ticks) is reported once; a ringing string is not
  reported again, and nothing is read while the app itself is sounding.
  `useGuitarAnswer` (one note per question, then the mic closes) is unchanged.
- `useScaleOrderEngine.hear(midi)` — same hit/miss rules as `tap`, judged by
  pitch: any tile with the step's pitch answers it, an octave off counts
  (low-string octave errors), the note just played is never a mistake, and
  nothing is played back. Tapping keeps working alongside it.
- Screen: an "Answer mode" switch (Tap / 🎸 Guitar, `ssel_order_guitar`,
  cloud-synced with the other `ssel_` picks) and a live status line. First
  shipped admin-only; **opened to every user the same day** by the product
  owner (shown wherever the device can listen — `getUserMedia` + Web
  Audio). The mic is off during the "Watch, then play" demo.

Verified in a real browser with a simulated microphone (an oscillator fed
through a stubbed `getUserMedia`): full runs complete and are recorded as
`orderScale`, a wrong note breaks the streak and slips the step, an
octave-high note is accepted, the mic never opens during the demo, English
and Hebrew. **Not yet tried on a real guitar.**

## Session 6 (2026-09-25) — a fourth exercise, "Tap the scale in order"

The product owner asked for **one more** scales exercise, in addition to the
existing three (not a replacement): a section of the neck, divided into
strings and frets, with every note of the scale lit; the learner taps them
in the right order to build the scale.

- `src/learning/scaleOrder.ts` (pure) — `buildOrderBoard` lays one
  `ScaleQuestion` (from the unchanged `pickScaleQuestion`) out as a still
  board: the section spans the shape's frets, and each shape tile is keyed
  to its step in `scaleRun`'s order (so the Direction tiles apply as-is). A
  pitch held on two strings is one step; either tile answers it. Checked by
  `scripts/check-scale-order.mts`.
- `src/hooks/useScaleOrderEngine.ts` — no falling, no countdown. A tap on
  the next step's tile is a hit (plays, turns green, shows its number in the
  run); any other tile — a lit note out of order or a dim non-scale note —
  plays, flashes red, penalises, and slips the step being looked for. One
  scale is one SRS answer judged by Exercise A's `isScaleCorrect`. History
  rows carry the new form `'orderScale'`.
- `src/components/ScaleOrderBoard.tsx` — one row per string, the highest
  string on top (box-diagram / tab reading), frets left to right with their
  numbers underneath, inline in the screen's card (not a full-screen
  overlay). Pinned `dir="ltr"`, mirrored only by the left-handed setting.
  The tonic keeps a gold ring.

Verified live (Playwright, 400×860, zero console errors) in English and in
Hebrew + left-handed: the board renders, a wrong tap flashes, a full run
records an `orderScale` row in `scaleHistory` and moves to the next scale.

**Follow-up, same day (product owner):**

- **The lowest string is on top**, like every other neck in the app — not
  the tab/box-diagram order the first version used.
- **Learning mode** ("Watch, then play", `ssel_order_demo`, off by default):
  before each scale the app plays the run itself, lighting and sounding each
  note in turn (`DEMO_NOTE_MS` apart), then hands over and the learner plays
  it back. Taps during the demo are ignored; the scale's time is measured
  from the end of the demo. A header line says whose turn it is.

## Session 5 correction (2026-09-24) — Exercise A is full-screen Piano Tiles

**This overrides the "Session 3 correction" below. Read it before touching
Exercise A again.** The product owner explained that the Session 3 change
came from a misunderstanding. The Session 2 falling-lane mechanic was what
they wanted; what was wrong is that it ran inside a small card in the top
part of the screen. They wanted it to **cover the whole app screen, like
Piano Tiles**: all rows falling down together, the learner tapping the
right notes to build the scale, every tap playing its note. Their answers,
asked directly:

- **Layout:** one lane per string; each row is a slice of the neck (one
  tile per string at one fret) with one lit tile — the next note to tap.
- **Wrong tap:** penalty, and the stream keeps falling (unchanged from
  Session 2 — no instant game over).
- **Order:** ascending, like a run up the scale. Tapping a lit tile of a
  row above the one that is due counts as a wrong tap.
- **Replaces** the whole-neck board; it is not an extra exercise.

Built and verified live in a real browser (Playwright, 400×860, zero console
errors): guitar and bass via `scale-spike.html` (`?bass` switches), and the
real app in English and Hebrew with `devSimulateTier` forced to
`'premium'`, including left-handed mode. Hits, the red wrong-tap flash, a
miss when a lit tile falls off, a full scale reaching `scaleHistory`, and the
exit button were all checked there.

- `src/learning/scaleFall.ts` (pure) — `scaleRun` orders the shape by pitch
  (a doubled pitch would be played once, on the thicker string; the check
  found none in the current boxes), `buildFallStream` lays out a banner row
  plus the run per scale, and the geometry/speed helpers work in rows, not
  pixels. Checked by `scripts/check-scale-fall.mts`.
- `src/hooks/useScaleFallEngine.ts` — one `requestAnimationFrame` loop; the
  scroll lives in a ref and is written to the board as a transform each
  frame. The speed ramps from `fallSpeed.start` to `fallSpeed.max`
  (`useScaleSelector`'s envelope, per difficulty). A lit tile that falls off
  is a miss. Only the first note starts lit; a hidden note that reaches the
  last row of the screen is revealed as a rescue (`HINT_BOTTOM_ROWS`). A note
  *slips* on a wrong tap while it is live, a miss, or a hint, and stays ringed
  on the board. One scale is one SRS answer, correct when at most one note in
  five slipped (`isScaleCorrect`) — a single stumble no longer voids the run.
- `src/components/ScaleFallBoard.tsx` — a `position: fixed` full-screen
  overlay: a header (scale · root · box, progress, score, exit), the play
  area (5 rows tall), and string names under the lanes. The lowest string is
  on the left; lanes are `dir="ltr"` and only the left-handed setting mirrors
  them. The tonic gets a gold ring.
- Deleted: `ScaleShapeBoard.tsx`, `useScaleBoardEngine.ts`.

**Resolved (2026-09-25):** the run used to start at the box's lowest note,
which confused the product owner (a B major run did not start on B). Both
"Build the scale" and "Tap the scale in order" now play `tonicRun`: it starts
and ends on the tonic and still covers the whole box — going up, tonic →
highest note → lowest note → tonic; going down, the mirror. Runs are about
twice as long as before. Checked by `scripts/check-scale-fall.mts`.

## Session 1 progress (2026-09-22) — read this before continuing

**Built and shipped to `main`, in this order (4 commits):**

1. **Data layer** (§4) — `src/utils/scales.ts` (`SCALE_TYPES` with only
   `minorPentatonic` so far, `stepPattern`, `scalePositionsFor`,
   `shapeAtRoot`) and `src/learning/scaleItem.ts` (`scale:<type>:<position>`
   id). Verified by `scripts/check-scales.mts` (21 checks, guitar + bass).
2. **Exercise A question picking** — `src/learning/scaleDrill.ts`
   (`buildScalePool`, `pickScaleQuestion`: picks a `(scaleType, position)` +
   a root fret and resolves the concrete shape). Verified by
   `scripts/check-scale-drill.mts` (16 checks incl. 200-draw randomised
   stress on guitar + bass).
3. **A new engine + answer surface** (see the "§8.1 correction" below) —
   `src/hooks/useScaleDrillEngine.ts` (dedicated session/timer/scoring
   runner, reuses `useScoring` + `audio.ts`/`feedback.ts`) and
   `src/components/ScaleShapeBoard.tsx` (the "piano tiles" multi-string
   board + `src/styles/30-scale-board.css`). Verified in a real browser
   (dev server + Playwright) via `scale-spike.html` — a standalone harness
   page, same pattern as the existing `pitch-spike.html` — before and after
   fixing a real bug found there (see below).
4. **Wired into the real app** — `scaleDrill` feature key in
   `src/utils/features.ts` (Premium, mirrors `intervalDrill`); a live
   "Scales" tile in `LearnHub.tsx` (`LearnDomain` gained `'scales'`,
   replacing the old inert "coming soon" placeholder); a new
   `ScalePracticeScreen.tsx`; a render branch in `App.tsx` right after the
   Intervals one. Verified end-to-end in a real browser: drawer → Learn →
   Scales tile (unlocked with `devSimulateTier` forced to `'premium'`) →
   Scale training screen → Start → the board renders and taps register
   inside the actual app, zero console errors.

**Important correction to §2 / §8.1 — read before assuming any more "free"
reuse.** §8.1 claimed Exercise A needs **no new engine capability** because
it could reuse the existing `byNote` + `candidates` flow (`FretGrid` +
`useGameEngine`'s `remainingFrets`/`foundFrets`). **This turned out to be
false, verified by reading the code and then confirming live in a browser:**
`FretGrid` renders exactly **one string** per question, and when a candidate
set is active `useGameEngine.nextByNote` narrows every question to **one
string + one specific note name** (`allFretsForNote = validFrets.filter(f
=> notesMatch(notes[qString-1][f], note))` — every candidate frets on *that
string* that share *that note's name*, nothing else). A scale shape spans
several strings with several different note names — that flow cannot
render or answer it. Building the multi-string "piano tiles" board
(`ScaleShapeBoard.tsx`) as a genuinely new, self-contained capability — with
its own dedicated engine (`useScaleDrillEngine.ts`) rather than any change to
the shared ~1000-line `useGameEngine` — was necessary and is now done. A
second bug was caught and fixed the same way (browser-verified): the first
version of the board only rendered true shape members as tappable, so a
question had no way to be answered wrong; it now renders every fret in the
window, decoys included, exactly like `FretGrid` does for its filter range.
**Any future increment that assumes "free" reuse from the Notes/Intervals
mapping table in §2 should be re-verified the same way (read the actual code
path, then confirm live in a browser) before being taken on faith.**

**Not built yet — next steps, in a sensible order:**

1. **Selector controls (§5).** `ScalePracticeScreen` currently has no
   picker at all — it always runs Minor Pentatonic, all positions, a fixed
   10-question/14s envelope. Needs `useScaleSelector.ts` (mirrors
   `useIntervalSelector.ts`) plus the exercise/scale/position/difficulty
   controls §5.1–§5.6 describe, once there is more than one scale type and
   exercise to choose between.
2. **Exercises B and C (§8.2/§8.3)** — "identify the scale" (chip row) and
   "name the degree" (note-chip row). These two genuinely *are* cheap reuse
   (chip-row answer surfaces, no new board), unlike Exercise A — good
   candidates for the next session.
3. **SRS + weakness + mastery (§10/§11)** — `scaleSrs` in
   `InstrumentLearningState`, `scaleWeakness.ts`, `scaleMastery.ts`. Right
   now a session's score is thrown away when the screen closes; nothing is
   tracked.
4. **Progress board (§12)** — the flat, grouped-by-scale-type board.
5. **Daily/Teacher integration (§13/§14)**, **persistence/cloud sync
   (§15)** — `scaleSrs`/`scaleDaily`/`scaleHistory` fields in
   `learningState.ts` + `learningSync.ts`.
6. **Curriculum ordering (§6)** and **per-scale content (§7)** —
   `scaleCurriculum.ts`, `scaleContent.ts` — only matter once a second scale
   type ships (§4.2's "2nd" row, Major Pentatonic).
7. Only once the above are solid: ship scale type 2 (Major Pentatonic) as
   the close-to-pure-data addition §4.2 describes — a new `SCALE_TYPES` row
   in `scales.ts` + a `SCALE_POSITION_SPECS` pair + its `scaleContent.ts`
   entry.

Nothing in `src/` outside the files named above is changed by this
document.

**Ships incrementally, one scale type per implementation session — start
with §4.2's "1st" row (Minor Pentatonic) only, build the whole generic
system for it, then treat every later row as a data-only addition.** This is
a product-owner decision, not a fallback: "we'll start with the most basic
scales and gradually work through the next ones until everything is mapped."
Each future implementation session should re-read this document in full
before writing code, rather than relying on memory of this conversation.
Triads (`premium-product-plan.md` P5's other half) are explicitly **out of
scope** of this document and are not folded into it.

## Session 3 correction (2026-09-23) — Exercise A is a whole-neck board

**The product owner replaced the falling-lane Piano Tiles mechanic. Read
this before touching Exercise A again; it overrides §8.1 and the Session 2
correction below.** In their words: the exercise should show *all* the
notes, everything at once, with the notes that aren't in the scale **off**
(dim) and the notes that are part of the scale **lit** — across the whole
screen, not a narrow window. Tapping any note plays that note; tapping a
note of the scale turns it another colour; tapping a note that isn't in the
scale lights it red. Confirmed with them directly that this **replaces**
"Build the scale" rather than joining it as a fourth exercise.

Built and live-verified in a real browser via `scale-spike.html` (guitar,
whole neck on screen at 400px wide, zero console errors, lit/dim counts and
the green-found / red-wrong feedback all correct):
- `src/components/ScaleShapeBoard.tsx` — one row per string, one tile per
  fret from 0 to `maxFret`, each carrying its real note name through
  `displayNote` (so the accidental/notation settings still govern it).
  Permanent `dir="ltr"`, mirrored only by `[data-hand="left"]`, same rule as
  `.fret-grid`.
- `src/hooks/useScaleBoardEngine.ts` — per-question countdown runner (the
  envelope's `timeLimit` again, `beatMs` is gone). Tapping a dim note
  penalises but does **not** end the question, keeping the continue-on-
  mistake rule: with the shape already lit, a stray tap is exploration.
- Deleted: `scaleTiles.ts`, `useScaleTilesEngine.ts`, `ScaleTilesBoard.tsx`,
  `scripts/check-scale-tiles.mts` — the scheduling they existed for no
  longer exists.

Everything below this section describes the superseded design and is kept
for the history of why each version was rejected.

## Session 2 progress (2026-09-22) — read this before continuing

**Steps 0 and 1 of the plan below are done, live-verified in a real browser
in English and Hebrew/RTL (zero console errors in either):**

- **Step 0, the RTL bug, is fixed.** `ScaleShapeBoard.tsx`'s root now has a
  permanent `dir="ltr"`. Re-verified live: string labels and the root tile
  now stay on the same physical side regardless of `pref_language`, matching
  `.fret-grid`'s existing rule.
- **Step 1, Exercises B and C, are built and wired in.** `scaleDrill.ts`
  gained `pickScaleIdentifyQuestion` (Exercise B) and `pickScaleDegreeQuestion`
  (Exercise C), both covered by a new `scripts/check-scale-chip-drill.mts`
  (15 checks, guitar + bass, all passing). A new `useScaleChipEngine.ts`
  runs both (one dedicated engine, not merged with Exercise A's
  `useScaleDrillEngine` — the answer shapes differ too much). The chip
  answer surface reuses `IntervalChoiceRow.tsx` unchanged (a `'scale'`
  variant was added to its type union for the identify-the-scale chips;
  `'note'` is reused as-is for name-the-degree, exactly like Intervals
  Exercise B). `ScalePracticeScreen.tsx` gained a minimal exercise switcher
  (three buttons — explicitly **not** the real Selector, §5's picker is
  still step 2) so all three exercises are reachable. All Hebrew strings
  have translations; note names in Exercise C render as letters via the
  existing `displayNote`, not solfège.

**One known, accepted limitation, not a bug:** with only Minor Pentatonic
shipped, Exercise B ("identify the scale") always shows exactly **one**
chip — the correct answer, so it's currently un-loseable. This is the
direct, foreseen consequence of §4.2's "one scale type at a time" rollout
(the option-building code already pulls from the full catalogue and pads
correctly; verified by the check script's "degrades to exactly 1" case) —
it will stop being degenerate the moment scale type 2 ships (step 7). Not
worth special-casing around; ship as-is.

**Step 2 (Selector controls, §5) is now wired in — `useScaleSelector` is no
longer inert, and its own "not yet imported" note above is out of date.**
`ScalePracticeScreen.tsx` now calls `useScaleSelector(instrument.stringCount)`
directly: the old local `exercise` state and the hardcoded
`QUESTION_COUNT`/`BEAT_MS`/`CHIP_QUESTION_COUNT`/`CHIP_TIME_LIMIT` constants
are gone, replaced by the hook's `exercise`/`pool`/`buildEnvelope(...)`. The
screen's own duplicate `ScaleExercise` type is gone too — it now uses the one
type `useScaleSelector.ts` exports. Both engines take the envelope's derived
values (`useScaleChipEngine` gained a `naturalsOnly` option it didn't have
before, threaded through to `pickScaleIdentifyQuestion`/
`pickScaleDegreeQuestion`; Exercise A's tile-fall tempo, which isn't part of
`ScaleEnvelope`, is derived from `difficulty` via a small local
`BEAT_MS_BY_DIFFICULTY` map in the screen instead). Position (§5.3) and
Difficulty (§5.4) now have real, minimal segmented-button UI in
`ScalePracticeScreen.tsx` (new `.scale-position-switcher` /
`.scale-difficulty-switcher` blocks + matching `30-scale-board.css` rules),
gated the same way the hook gates the logic: the Position row only renders
once more than one position exists (`sel.positionChoiceAvailable`), and
picking "one position" visibly disables the Difficulty row and shows a "why"
line, mirroring the hook's own `focused`-clamp. New strings added with
Hebrew translations (`Position`, `All positions`, `Box`, the clamp-explainer
line); `Difficulty`/`Focused`/`Mixed`/`Full` were already translated from the
Intervals Selector and are reused as-is. §5.2 ("scale selection") is still
correctly absent — see the hook's own header comment.

**Verified: `tsc -b` and `npm run lint` are clean on the touched files, and
all three `check-scale-*` diagnostic scripts still pass unchanged** (they
exercise the pure question-picking/tile-scheduling functions, not this
screen, so an unchanged pass here is expected, not a substitute for a UI
check). **Not verified: a live browser click-through.** Earlier sessions used
a Playwright-driven browser to catch the RTL-mirroring bug and the
tap-any-order bug — no such tool was available in this session, so the new
Position/Difficulty UI, the `naturalsOnly` wiring into `useScaleChipEngine`,
and the difficulty→tempo mapping for Exercise A have only been verified by
reading the code and by `tsc`/lint/the diagnostics above, not by actually
clicking through the dev server. Per this doc's own standing rule (the
Session 1 "free reuse" correction), **treat this increment as unverified in
a real browser until someone actually does that** — start the dev server and
walk: Learn → Scales (with `devSimulateTier` forced to `'premium'`) → confirm
the new Position row appears with two "Box" buttons plus "All positions",
confirm the Difficulty row disables and explains itself when a single
position is picked, and confirm picking `focused` vs `full` visibly changes
Exercise A's tile speed and the chip exercises' timer/option count.

**Correction from the product owner, same session, overrides §8.1's
"Exercise A" design as built so far — read before touching
`ScaleShapeBoard.tsx` / `useScaleDrillEngine.ts` again.** The static grid
board (tap any of N visible tiles, any order, no clock) was a
misunderstanding: "piano-tiles-style" in this doc and in the component's own
comments only ever meant "looks like a grid of small rectangular buttons,"
never the actual mobile game — and was never checked against what that game
actually does. Confirmed by research (web search, not assumed): real Piano
Tiles streams four lanes of tiles continuously downward; the player taps
each tile in time as it crosses a fixed line; the tempo ramps up over the
run; **one missed or wrong tap ends the run immediately.**

**Exercise A's real design (per the product owner's explicit description) is
a genuine scrolling rhythm mechanic, not a static tap-in-any-order grid:**
the neck effectively scrolls past the player over time (or equivalently, the
tap-line moves along the neck) — **one lane per string** (explicit
instruction: lane count = the active instrument's `stringCount`, for every
instrument and variant, not a fixed six) — and only the scale shape's real
notes ever appear as tiles to tap, arriving in each lane at the moment their
fret position reaches the line. The player taps the right string at the
right moment.

**Built and shipped, same session, live-verified via `scale-spike.html`
(guitar, 6 lanes, zero console errors, hits register and score climbs, a
miss does not end the run):**
- `src/learning/scaleTiles.ts` (pure) — `scheduleTiles` orders a shape
  ascending by fret (ties by string) and assigns evenly spaced arrival
  times; `pickScaleTilesRun` wraps the unchanged `pickScaleQuestion` and
  schedules its shape. Covered by `scripts/check-scale-tiles.mts` (12
  checks, guitar + bass).
- `src/hooks/useScaleTilesEngine.ts` — the real-time engine. **No
  `requestAnimationFrame` loop**: each tile's fall is a pure CSS animation
  (`animation-delay` computed once from `tile.atMs`), so the engine only
  needs one `setTimeout` per tile (fired at the close of its hit window) to
  auto-resolve a miss. `tapLane(stringNum)` finds the nearest unresolved
  tile in that lane within the hit window (`HIT_WINDOW_MS`, 260ms either
  side) and resolves it.
- `src/components/ScaleTilesBoard.tsx` + the rewritten
  `src/styles/30-scale-board.css` — one lane (a full-height tappable button)
  per string, a fixed hit-line, tiles as absolutely-positioned divs driving
  a `@keyframes scale-tile-fall` animation.
- **Resolved, the open question this note originally left:** a missed or
  wrong-lane tap does **not** end the run — it scores a penalty
  (`useScoring`'s normal `onWrong`) and the run continues, explicitly
  *unlike* the real game's one-mistake-ends-everything rule. This was the
  product owner's explicit choice when asked directly.
- The old static-grid board/engine (`ScaleShapeBoard.tsx`,
  `useScaleDrillEngine.ts`) are **deleted**, not kept — every caller
  (`ScalePracticeScreen.tsx`, `scale-spike.html`'s `ScaleSpike.tsx`) now
  runs the tiles engine.

**Not done / explicitly out of scope for this pass** (say so plainly rather
than claiming more than was verified): the real game's tempo-ramps-up-over-
the-run behaviour was **not** implemented — `beatMs` is currently a fixed
constant per run (wired to the Selector's difficulty envelope once §5's real
picker lands, §9.1's tempo dimension), not a live mid-run ramp. Revisit only
if the product owner asks for it; the core ask (lanes = strings, real
falling-tile timing, tap-in-time scoring, continue-on-miss) is what was
actually requested and is what got built.

---

## Session 2 plan (2026-09-22) — read this before continuing

Written after live-verifying Session 1's build in a real browser (English
**and** Hebrew/RTL, `devSimulateTier` forced to `'premium'`): the drawer →
Learn → Scales → Start flow works end to end with zero console errors in
both languages, and the board's tap/found/wrong feedback (green on a correct
shape-member tap, red on a decoy tap, a live "Found N / M" counter) all work
as designed. Two things came out of that verification that change the plan
below.

### 0. Fix first — a real RTL bug, not a nice-to-have

**`ScaleShapeBoard.tsx` physically mirrors under Hebrew, and it should not.**
Verified live: with `pref_language: 'he'`, the string-number labels swap from
the left of each row to the right, and the root tile jumps from the first
column to the last. This breaks an existing, deliberate app rule: the main
fretboard (`.fret-grid`, `src/styles/09-fretboard.css` /
`27-left-handed.css`) is **direction-locked** regardless of UI language —
Hebrew changes text direction only, never the neck's physical layout; only
the separate "left-handed" setting is allowed to mirror it
(`[data-hand="left"] .fret-grid { direction: rtl; }`). `ScaleShapeBoard` has
no equivalent lock, so it silently inherits the page's `dir="rtl"` and
mirrors — a Hebrew-speaking learner sees a shape laid out backwards compared
to every other drill screen in the app.

**Fix:** add a fixed `dir="ltr"` on the `.scale-board` root (mirroring how
`ScalePracticeScreen.tsx`'s `dir={lang === 'he' ? 'rtl' : undefined}` already
proves the pattern one level up — the board itself needs the opposite, a
permanent `ltr`, not a language-conditional one), then re-verify live in
Hebrew: string labels stay on the physical left, root tile stays in the
physical column it started in, independent of `pref_language`. Small,
isolated, and should land before any of the feature work below so it is not
compounded by more screens/positions being added on top of a mirrored board.

### 1. Exercises B and C (§8.2 / §8.3) — before the Selector, not after

Session 1's own "not built yet" list put Selector controls ahead of
Exercises B/C, but re-reading §5.1 shows that ordering doesn't quite work:
the Selector's exercise-choice control (§5.1) is meaningless while there is
only one exercise to choose from ("once there is more than one scale type
**and exercise** to choose between" — §5's own words). Build B and C first:

- **Exercise B — Identify the scale** (§8.2): extend the two-note sequential
  player already built for Intervals Exercise A to an N-note ascending
  player (N = 5 for the one shipped scale type so far), root to top only
  (OD-S1). Answer surface is a new small scale-name chip row — same shape as
  the interval-chip row, different label set. No new engine capability.
- **Exercise C — Name the degree** (§8.3): show scale + root + a degree
  number/label, learner picks the target note from the existing note-chip
  row (`buildTargetNoteOptions`, `noteNameAtSemitones`, `notesMatch` —
  reused verbatim from Intervals Exercise B). No new engine capability.

Both are cheap by design (§2's mapping table marks them REUSE /
NEW-S-small) — this is the session to prove that out.

### 2. Selector controls (§5) — once B and C exist

`useScaleSelector.ts` (mirrors `useIntervalSelector.ts`) plus the
exercise/scale/position/difficulty controls, now meaningful because there
are three exercises to pick between. Also the first point where the "?"
summary bubble (§5.6) and per-scale content's step-formula framing (§1.4,
§7) become worth writing — before this, with one fixed exercise and no
picker, there was nothing for a bubble to summarize.

### 3. SRS + weakness + mastery (§10 / §11)

`scaleSrs` in `InstrumentLearningState`, `scaleWeakness.ts`,
`scaleMastery.ts`. Right now a session's score is thrown away when the
screen closes; nothing is tracked. Needed before the progress board (next)
has anything real to show.

### 4. Progress board (§12)

The flat, grouped-by-scale-type board — trivial with one scale type shipped,
but write it against the full catalogue shape per §12 so it needs no rework
when scale type 2 lands.

### 5. Daily/Teacher integration (§13/§14), persistence/cloud sync (§15)

`scaleSrs`/`scaleDaily`/`scaleHistory` fields in `learningState.ts` +
`learningSync.ts`, riding along in the existing `user_learning_state` JSONB
blob — no new Supabase migration, same as how `intervalSrs` shipped.

### 6. Curriculum ordering (§6) and per-scale content (§7)

`scaleCurriculum.ts`, `scaleContent.ts` — only matter once a second scale
type ships, per §6's own framing.

### 7. Ship scale type 2 (Major Pentatonic)

The close-to-pure-data addition §4.2 describes: a new `SCALE_TYPES` row in
`scales.ts` + a `SCALE_POSITION_SPECS` pair + its `scaleContent.ts` entry —
only attempt this once steps 0–6 are solid, per the product owner's
"one scale type at a time" decision (§4.2).

Each future implementation session should re-read this document in full —
this plan included — before writing code, rather than relying on memory of
any prior conversation.

---

## Session 3 progress (2026-09-22) — read this before continuing

**Step 3 of the plan above (SRS + weakness + mastery, §10/§11) is now built,
scoped to LOCAL persistence only — cloud sync (the other half of §15) is
still not wired.** "A session's score is thrown away when the screen closes"
(step 3's own framing) is no longer true: every answer from all three
exercises now folds into a real, per-`(scaleType, position)` Leitner
schedule that survives a page reload.

- **New `src/learning/scaleMastery.ts`** — mirrors `intervalMastery.ts`
  one level down (own constants, not imported from the interval or note
  mastery files, per §11/§19): `isScaleMastered`, `scaleStatus`,
  `masteredScaleItems`, and `buildScaleBoard` (the flat §12 board — one row
  per pool item, in the pool's own order, which already groups by scale type
  since `buildScalePool` iterates types outer, positions inner).
- **New `src/learning/scaleWeakness.ts`** — mirrors `intervalWeakness.ts`
  exactly: the same four signals (low recency-weighted accuracy, slow
  correct answers, repeated recent misses, overdue SRS), same recency-decay
  engine (`recency.ts`, reused unchanged), same deterministic scoring/
  ordering. `analyzeScaleWeakness` unions ids from `scaleHistory` +
  `scaleSrs` — no `pool` argument needed (mirrors `intervalWeakness.ts`,
  unlike `scaleMastery.ts`'s board which does need a pool to show
  not-yet-touched items).
- **`src/learning/learningState.ts`** (shared file, additive changes only —
  verified against `check-learning.mts` / `check-learning-path.mts`, both
  still pass unchanged) gained: `ScaleHistoryRow`, `InstrumentLearningState.
  scaleSrs: SrsMap` / `.scaleHistory: ScaleHistoryRow[]`, `SCALE_HISTORY_CAP`
  (200, same as intervals), `normalizeScaleHistory`, `mergeScaleHistory`, and
  `recordScaleAnswer(st, itemId, form, correct, seconds, now)`. Unlike
  Intervals' free/guided split (`recordIntervalAnswer` vs.
  `recordIntervalTeacherAnswer`), Scales has only ONE recording path — there
  is no guided Scale Today session yet (§13/§14, still not built) — so
  `recordScaleAnswer` always does both the SRS review AND the capped history
  append in one call, mirroring `recordIntervalTeacherAnswer`'s shape but
  without touching any daily-goal field (`scaleDaily` does not exist yet).
  `mergeInstrumentState` folds the two new fields in the same
  never-last-writer-wins way as every other field here.
- **`useScaleTilesEngine.ts` / `useScaleChipEngine.ts`** both gained an
  `onAnswer` callback, fired once per resolved question (Exercise A: once
  every tile in the run has hit or missed, `correct` = every tile was a hit;
  Exercises B/C: on a tap or a timeout). `ScalePracticeScreen.tsx` wires both
  into a small `recordAnswer` closure that loads the instrument's learning
  state, calls `recordScaleAnswer`, and saves it back — no new hook, no
  changes to `App.tsx` or `useLearning.ts` (deliberately: those are shared
  across Notes/Intervals and §19 says not to touch them; Scales stays
  self-contained by reading/writing `learningState.ts` directly, exactly how
  this screen already avoids `useGameEngine`/`DrillConfig`).
- **New `scripts/check-scale-mastery.mts`** (32 checks) covers all of the
  above: SRS bucket transitions, history capping, `normalizeScaleHistory`
  dropping malformed rows, `mergeScaleHistory`/`mergeInstrumentState` proving
  a real union (a review made on one device is never dropped by a merge
  against a blob written later on the other device — the same property
  `mergeIntervalHistory` guarantees), the three-state mastery transitions,
  and all four weakness signals firing independently. All pass, alongside
  the three existing `check-scale-*` scripts (drill/chip-drill/tiles) and
  `check-learning`/`check-learning-path` (proving this didn't disturb the
  note or interval lanes). `tsc -b` and `npm run lint` are both clean (lint:
  0 errors; 2 new warnings are the same pre-existing, already-tolerated
  "ref written during render" pattern `useRoundLifecycle.ts:93` already has
  elsewhere in this codebase, not a new problem).

**Not verified: a live browser click-through, again — no browser/Playwright
tool was available this session either.** Everything above is unit-tested at
the pure-function level (`check-scale-mastery.mts`) and type/lint-clean, but
nobody has actually run a scale session in a real browser and confirmed
`scaleSrs`/`scaleHistory` show up correctly in `localStorage['learningState']`
afterward, or that repeated sessions actually move an item from `notStarted`
through `learning` to `mastered` the way a person would expect. Treat this as
unverified in a real browser (same standing rule as Session 2's own note)
until someone does that.

**Deliberately NOT done this session (still exactly where the plan above
leaves them):**
- **§15's cloud half.** `learningSync.ts` does not carry `scaleSrs`/
  `scaleHistory` yet — they persist to `localStorage` today (survive a
  reload) but not to a sign-out, a reinstall, or a second device. This is
  the very next gap to close before scale progress can be called durable.
- **§14 `scaleDaily`.** No scale daily goal exists; `recordScaleAnswer`
  rolls the shared note `daily` for stale-day hygiene only (a no-op most of
  the time), exactly like `recordIntervalAnswer` does for the note domain.
- **§13 Today/Teacher integration.** No guided scale session, no "why
  these?" list, no `scaleTrackedCount`/`buildScalePlan` on `useLearning()`.
  `analyzeScaleWeakness` exists and is tested but nothing calls it yet
  outside the check script.
- **§12 progress board.** `buildScaleBoard` exists and is tested but no
  component renders it — there is still no visible place in the app to see
  "2 mastered, 0 learning" for scales.
- **§6 curriculum ordering / §4.2 scale type 2.** Unchanged from Session 2 —
  still correctly deferred.

---

## Session 4 progress (2026-09-22) — read this before continuing

**Live-verified in a real browser (Playwright/Chromium, zero console errors)
both of Session 3's own open items, and built the progress board (§12) that
was next in the plan.**

- **Session 2's Position/Difficulty UI and Session 3's SRS/history wiring
  are no longer "unverified" — both were driven end to end.** Drawer → Learn
  → Scales (via `devSimulateTier` forced to `'premium'`) → the Position row
  (Box 1 / Box 2 / All positions) and Difficulty row (Focused / Mixed / Full,
  disabling with the "one position selected" explainer exactly as designed)
  both work as built. One buildScale run and a full identifyScale session
  (10/10 correct, since the single-scale-type degenerate case makes every
  identify question have exactly one, always-correct chip) were played;
  `localStorage['learningState']` was read directly afterward and shows real
  `scaleSrs` entries (`scale:minorPentatonic:1` / `:2`, bucket/reps/lapses all
  moving) and capped `scaleHistory` rows (`itemId`, `form`, `correct`,
  `seconds`, `createdAt`) for the current instrument — confirming Session 3's
  `recordScaleAnswer` wiring actually persists, not just unit-tests clean.
- **New `src/components/ScaleProgressBoard.tsx`** — the flat board §12
  describes: one section header per scale type (currently just "Minor
  Pentatonic"), one row per position underneath showing `not started` /
  `learning` / `mastered` plus a recent-accuracy bar, mirroring
  `IntervalBoard.tsx`'s presentation (same `string-bar-*` classes from
  `11-progress-bars.css`, same status colour/label vocabulary) with the one
  addition Intervals' single flat list doesn't need: the group header. Fed by
  `buildScaleBoard` (already built + unit-tested in Session 3) called against
  `buildScalePool(SCALE_TYPES.map(s => s.id), stringCount)` — every shipped
  scale type, not the Selector's own (possibly position-narrowed) `pool` — so
  the board always reflects the full catalogue regardless of what's currently
  picked to practise, and needs no rework when scale type 2 ships (per the
  plan's own instruction for this step).
- **Wired into `ScalePracticeScreen.tsx`, not into the shared
  Stats/`ProgressPanel`/`useLearning.ts` path Intervals' board uses.** This
  was a deliberate call, not an oversight: Session 3's own note re-affirmed
  that Scales must stay self-contained by reading/writing `learningState.ts`
  directly rather than touching `useLearning.ts`/`App.tsx` (§19), and
  `IntervalBoard` only ever renders inside the shared central Stats screen
  fed from `useLearning()`'s `intervalBoard`. So instead of the Stats screen,
  a small **Practice / Progress** segmented tab was added at the top of
  `ScalePracticeScreen.tsx` itself (reusing the existing `.stats-tabs`/
  `.stats-tab` classes from `11-progress-bars.css`) — visible whenever a
  session isn't running, switching between the existing exercise UI and the
  new board. The board is recomputed from a `now` state bumped on every
  `recordAnswer` call (needed anyway: an initial `Date.now()` call inside the
  board's `useMemo` tripped this repo's "no impure calls during render" lint
  rule, same fix pattern `useLearning.ts` already uses for its own board).
- **One real bug caught by the live Hebrew/RTL check and fixed the same
  way Session 2's RTL bug was:** the new `'Progress'` tab label had no
  Hebrew entry in `translations.ts` — it silently rendered in English inside
  an otherwise fully-Hebrew screen until the browser check surfaced it. Now
  translated (`'התקדמות'`). A second, smaller layout issue from the same
  check — the board's row labels (`not started` etc.) sat flush against the
  physical screen edge in RTL because `ScaleProgressBoard` wasn't wrapped in
  the `.set-card` padding every other block on this screen already uses —
  is also fixed (wrapped in a `.set-card` like the rest of the screen).
  Re-verified live afterward in both languages: the board now sits inside a
  padded card with no clipped text, and the tab row plus board content mirror
  correctly for Hebrew (labels/status swap sides, nothing physically flips
  the wrong way).
- **New Hebrew i18n keys** (`translations.ts`): `'Practice'`, `'Progress'`,
  `'Scales mastered'`, `'No scales shipped yet.'`. `tsc -b` and `eslint` are
  clean on every touched file (`ScalePracticeScreen.tsx`,
  `ScaleProgressBoard.tsx`, `translations.ts`, `30-scale-board.css`); all
  four `check-scale-*` diagnostic scripts still pass unchanged.

**Noticed, not investigated — not this session's concern:** `git status`
shows `src/utils/badges.ts` as modified even though this session never
opened or edited it, and it wasn't listed as changed at session start. Likely
a concurrent edit from elsewhere (another worktree/session/editor on this
checkout — see this file's own `CLAUDE.md` staleness warning) rather than
anything this session's Scales work touched; left as-is rather than guessed
at or reverted.

**Not done / still exactly where the plan leaves them:** §15's cloud sync
half (`learningSync.ts` still doesn't carry `scaleSrs`/`scaleHistory`), §14
`scaleDaily`, §13 Today/Teacher integration, §6 curriculum ordering / §4.2
scale type 2 — all unchanged from Session 3's own list.

---

Reference documents:
- `intervals-learning-spec.md` — the domain this spec is structurally copied
  from, section for section. Read alongside this one; most "why" reasoning
  that also applies to scales is not repeated here.
- `premium-product-plan.md` §4 (prerequisite graph — "Scales need notes; go
  faster after intervals but do not strictly require them"), §9 P5 ("Scales &
  triads — build on P4's proven pattern").
- `product-wishlist.md` §6 — the original flat "new game modes: … scales …"
  entry this design supersedes with the one-engine framing.

---

## 0. Foundational principle — same as Intervals

Two independent systems exist in the app: **Learning** (the adaptive teacher)
and **Game** (`src/game/**` — points, stars, Worlds). This spec concerns
**Learning only**, and inherits every constraint `intervals-learning-spec.md`
§0 states for Intervals: no points/combo/stars/XP, no Worlds/Stages, no
checkpoint ladder unless explicitly decided otherwise below.

Scales Learning is a **sibling** of Notes and Intervals, not a layer on top of
either. It has its own item identity, its own SRS map, its own weakness
analysis, its own internal curriculum ordering, its own daily planner slice,
its own flat progress view, its own translation keys. It **shares** the drill
runner, the Leitner SRS engine, the persistence blob + cloud sync mechanism,
the scoring/feedback/haptics infra, the full-page/card UI shells, and the
entitlement gate — exactly the reuse list `intervals-learning-spec.md` §1.3
gives for Intervals.

Gate: a new `scaleDrill` feature key in `src/utils/features.ts`, `MIN_TIER:
'premium'`, following the `intervalDrill` pattern exactly (§16 below).

---

## 1. Product definition

### 1.1 What Scales Learning is

Guitarists think of a scale as a **shape on the neck**, not an abstract list
of scale-degree names — that is the one place this domain must diverge from
Intervals' quality-only abstraction, and it is also the app's natural
strength: the whole codebase already centres on `(string, fret)` positions.

By working through it the learner should be able to:

- know the five core scale/mode shapes drilled (§4.2) and where each sits
  relative to a root note;
- **build a scale from a given root** — given a scale name and a root note
  (or a marked root position), tap every note of that scale inside one neck
  position (reuses the existing multi-fret "by note" mechanic — §8.1);
- **recognise a scale shape by ear** — hear it played as an ascending run and
  name which scale it is (mirrors Intervals Exercise A — §8.2);
- **name a scale degree** — given a scale + root, name the note that is its
  Nth degree (e.g. "the 3rd degree of G major pentatonic") — a direct
  generalisation of Intervals Exercise B, since a scale degree *is* an
  interval above the root (§8.3);
- begin to associate a scale's sound with its name and its "box" shape on the
  neck, and see how the same shape moves for different roots;
- **understand a scale as a formula of whole and half steps from the root**,
  not a fixed, memorised picture — and be able to say why moving the same
  formula to a different root produces "the same scale in a different key"
  (§1.4). This is the one piece of understanding every learner must come away
  with, independent of which of the three exercises they are running.

Full fretboard-wide scale fluency (playing a scale correctly starting from
*any* fret, or connecting boxes across the neck) is **not** an MVP goal — see
§8.5 Future Extensions, exactly mirroring how Intervals deferred a full neck
trainer.

### 1.2 What it is not

- Not a modal-theory course. No key-signature spelling, no circle-of-fifths
  derivation of modes, no chord-scale-theory screens. Per-scale content is
  short, inline, optional (§7).
- Not a re-imagined UX. Reuses the Notes/Intervals surfaces and rhythm
  (choose → practise → feedback → review → progress) wherever they fit.
- Not a Game mode. No stars, points, combos, XP, or achievements.
- Not (in the MVP): fingering/technique guidance, multi-position "connect the
  boxes" drilling, scale-over-chord application exercises, modes beyond the
  five in §4.2, or a "which scale fits this chord" exercise. Catalogued as
  Future Extensions (§8.5).

### 1.3 Relationship to Notes and Intervals Learning

Scales sits **after** Intervals in the prerequisite graph
(`premium-product-plan.md` §4: "Scales need notes; go faster after intervals
but do not strictly require them") because a scale degree is explained to the
learner in interval terms ("the 3rd degree is a major or minor 3rd above the
root") wherever that helps, but Scales Learning does **not** require the
learner to have touched Intervals Learning first — it is a free-standing
Selector-gated domain like Intervals is, with its own entry card.

### 1.4 Foundational concepts every learner must come away understanding

This is the conceptual payload the whole domain exists to deliver — everything
in §5–§13 (Selector, exercises, curriculum, content) is a delivery mechanism
for it, not an end in itself. Every scale, in any key, on any instrument, is
built from exactly three ideas:

1. **The root (tonic)** — the note a scale is named after and built from. It
   is the note that makes a phrase sound "finished" when it lands there. "C
   major" is the major-scale formula (below) applied starting from C; "A
   minor" is the natural-minor formula applied starting from A. The app
   already has this concept fully worked out for Notes and Intervals (every
   fret has a name); Scales Learning's job is to connect it to "and a scale
   is just a formula counted off from one."
2. **The octave** — the point where a scale's pattern repeats: the note with
   the same name as the root, at double its frequency. A scale is defined
   over one octave and then repeats identically in the next.
3. **Whole step and half step** — the only two distances between consecutive
   notes of a Western scale. The app must reuse, not reinvent, the language
   Intervals Learning already establishes: a **half step** is exactly a
   Minor 2nd (1 semitone) and a **whole step** is exactly a Major 2nd (2
   semitones) — `intervalContent.ts` already describes the Major 2nd as "a
   whole step; the plain next note of a scale" (§2 mapping table). Scale
   content should say this explicitly ("a whole step is what Intervals
   Learning calls a Major 2nd") wherever a learner meets both domains, so the
   two reinforce each other instead of teaching the same idea twice with
   different words.

**The formula.** A scale type is nothing more than a fixed sequence of whole
(W) and half (H) steps, counted off from whichever root is chosen. The
sequence is what makes a scale *that* scale — the root only decides where it
starts:

- **Major scale**: W–W–H–W–W–W–H. From C: C, D, E, F, G, A, B, (C).
- **Natural minor scale**: W–H–W–W–H–W–W. From A: A, B, C, D, E, F, G, (A).

The single most important thing the learner should take from this domain is
that **the same formula, started from a different root, gives the same scale
in a different key** — the formula is fixed, only the starting note moves.
This is exactly the "movable shape" intuition §3 below uses to justify the
item model (a shape moved to a different fret *is* the same formula counted
off from a different root), so the conceptual teaching and the technical
design reinforce one another rather than being two unrelated ideas bolted
together.

**Where this is taught (not a standalone theory screen — see §1.2):**
- The **"?" summary bubble** (§5.6), for any exercise, states the active
  scale's step formula in plain W/H notation alongside its name.
- **Per-scale content** (§7) states the formula, then a worked example from
  the scale's most natural root, spelled in **letter note names** (e.g. `A,
  C, D, E, G` for A minor pentatonic) — **never solfège** (`דו/רה/מי`), to
  match how every other note-facing surface in this app already writes note
  names (see `noteNameAtSemitones`, `INTERVALS`, and this repo's own
  convention of writing note names as letters).
- **Post-answer feedback**, on a miss, restates the formula and points out
  which step in it the missed note belongs to (e.g. "that's the H step
  between the 5th and 6th degree").
- The **progress board** (§12) — a "how scales are built" one-line link/
  disclosure, shown once, not repeated per row.

This section has no code deliverable of its own; it is the authoring brief
`scaleContent.ts` (§7) and `ScalePrompt.tsx` copy must satisfy, and the
measure of "sufficiency" (§8.4) that any exercise design must serve.

---

## 2. Notes/Intervals → Scales mapping

Same decision codes as `intervals-learning-spec.md` §3: **REUSE** (same code
unchanged) · **SHARED** (existing domain-agnostic seam, new caller) ·
**NEW-S** (new Scales-specific code, mirrors an existing domain) · **N/A** ·
**FUTURE**.

| Notes / Intervals | Scales | Decision | Detail |
|---|---|---|---|
| Note Item `(string,fret)` / Interval Item (quality) | Scale Item `(scaleType, position)` | **NEW-S** | §4. Root is a question property, not part of the item — mirrors how Intervals made direction a question property, not a second SRS key. |
| `DrillConfig.candidates` (`DrillPosition[]`) | Same field, populated per question from the scale's shape at the chosen root | **REUSE** | The exact seam `intervals-learning-spec.md` §2.1 calls "already the explicit item list seam." No new `DrillConfig` field needed for Exercise A (§8.1) — only a `scale` spec analogous to `interval` (§19). |
| Fret by Note (`mode:'byNote'`, `FretGrid`, `remainingFrets`/`foundFrets`) | **Exercise A — Build the scale**: tap every note of the shape | **REUSE (direct)** | This is the single biggest reuse win over Intervals: Intervals had *no* neck exercise in its MVP; Scales' primary exercise **is** the existing multi-fret find flow, unmodified, driven by an explicit `candidates` list computed from the shape + root. §8.1. |
| *(no Notes analogue)* — mirrors Intervals Exercise A | **Exercise B — Identify the scale**: hear it played ascending → pick the scale name from a chip row | **NEW-S (mirrors Intervals A)** | Reuses the sequential-playback capability built for Intervals Exercise A (`audio.ts` note-after-note) extended from 2 notes to N. §8.2. |
| Intervals Exercise B (`findTargetNote` — name the note an interval above a root) | **Exercise C — Name the degree**: given scale + root + degree number, pick the target note | **REUSE (direct)** | A scale degree is exactly an interval above the root; the interval-to-semitones table already exists (`INTERVALS` / `noteNameAtSemitones` in `src/utils/intervals.ts`). Degree → semitones is a lookup, computed from the scale's interval formula (§4.1). Reuses `buildTargetNoteOptions`, `noteNameAtSemitones`, `notesMatch`, and a note-chip answer row wholesale. §8.3. |
| `NoteCircle` | Answer surface for Exercise C (note-chip row, per Intervals OD-11 precedent) | **REUSE** | |
| `FretGrid` | Answer surface for Exercise A | **REUSE** | |
| Interval-chip row (built for Intervals Exercise A) | Scale-name chip row for Exercise B | **NEW-S (small)** | Same component shape as the interval chip row; different label set (5 scale names instead of 11 interval shorts). |
| `intervals.ts` (`INTERVALS`, `noteNameAtSemitones`, `positionMidi`, `targetPositionsForInterval`) | `scales.ts` (new, §4) | **NEW-S**, built **on top of** `intervals.ts` | A scale is defined as a list of interval-formula degrees (semitones from the root); `scales.ts` imports `intervals.ts`, does not duplicate it. |
| `intervalItem.ts` | `scaleItem.ts` | **NEW-S (mirrors)** | `scale:<scaleTypeId>:<positionIndex>`. §4.3. |
| `intervalDrill.ts` | `scaleDrill.ts` | **NEW-S (mirrors)** | Builds the `DrillConfig` with a `scale` spec; computes the concrete `candidates` for the chosen root + position + scale type. |
| `intervalCurriculum.ts` | `scaleCurriculum.ts` | **NEW-S (mirrors)** | §6. |
| `intervalContent.ts` | `scaleContent.ts` | **NEW-S (mirrors)** | §7. |
| `intervalMastery.ts` | `scaleMastery.ts` | **NEW-S (mirrors, own constants)** | §11. |
| `intervalWeakness.ts` | `scaleWeakness.ts` | **NEW-S (mirrors)** | §10.5. |
| `IntervalCard.tsx` / `IntervalPracticeScreen.tsx` / `IntervalPrompt.tsx` | `ScaleCard.tsx` / `ScalePracticeScreen.tsx` / `ScalePrompt.tsx` | **NEW-S (mirrors), reuses page shell** | §5.7, §16. |
| `useIntervalSelector` | `useScaleSelector` | **NEW-S (mirrors)** | §5. |
| `InstrumentLearningState.intervalSrs` / `intervalDaily` / `intervalHistory` | `scaleSrs` / `scaleDaily` / `scaleHistory` | **NEW-S (mirrors), same blob** | §15. |
| `useLearning.ts` interval bits (`intervalTrackedCount`, `recordIntervalAnswer`, `buildIntervalPlan`) | `scaleTrackedCount`, `recordScaleAnswer`, `buildScalePlan` | **NEW-S (mirrors)** | §13, §14. |
| `useDrillHistorySink` isolation (`intervalSink`, `wasIntervalRunRef`) | `scaleSink`, `wasScaleRunRef` | **REUSE (same pattern)** | Scale answers never touch note history/mastery/badges/leaderboard/personal-best, exactly like Intervals. |
| `LearnDomain = 'notes' \| 'daily' \| 'intervals'` | `LearnDomain` gains `'scales'` | **NEW-S (small)** | `LearnHub.tsx`. |
| `intervalDrill` feature key | `scaleDrill` feature key | **NEW-S (mirrors)** | `MIN_TIER.scaleDrill = 'premium'`. §16. |
| SRS (`srs.ts`), planner shell, mastery-status shell, `ProGate`, `click()`, countdown/`SpeedBar` timing | Same | **REUSE** | Fully domain-agnostic already; nothing here changes for Scales. |

---

## 3. Why the item is `(scaleType, position)`, not `(scaleType, root)`

This is the one modelling decision that has no Intervals precedent and needs
its own reasoning (Intervals' analogous choice was direction; here it is
root vs. shape).

A scale drilled "in G" and the same scale drilled "in D" are, to a guitarist,
**the same shape moved to a different fret** — exactly the "movable shape"
intuition the app already has no code for, because Notes and Intervals are
both key/root-agnostic by design. Two options:

- **(A) Item keyed on root** (`scale:major:G`) — 5 scale types × 12 roots = 60
  items (before positions). Mirrors "per-root granularity" that
  `intervals-learning-spec.md` §4.2 explicitly rejected for Intervals as a
  **Future** refinement, for the same reason: too many items for a first,
  visible, learnable SRS/progress board.
- **(B) Item keyed on neck position** (`scale:major:pos1`), root is a
  **question property** — 5 scale types × up to 5 positions = 25 items.
  Mirrors Intervals' actual decision (quality-only, root/direction left to
  the question generator).

**Proposed decision (mirrors OD-1's reasoning):** **(B)**. The root moves
every question (like Intervals' first note moves every question); what the
learner is actually building muscle memory for — and what SRS/mastery should
track — is "I know the minor pentatonic shape starting at the root, box 1",
regardless of which fret that box currently sits at. Root-per-item
granularity is catalogued as a Future refinement exactly as
`intervals-learning-spec.md` §4.2 catalogues per-root intervals, and could be
added later by extending `scaleItemId` without disturbing the schedule, same
escape hatch.

---

## 4. Scale content model

### 4.1 Scale type table (`src/utils/scales.ts`)

Mirrors `INTERVALS` in `intervals.ts`: a scale type is its **interval formula**
— the degrees' semitone distances from the root, ascending, using the
existing `IntervalDef`/semitone vocabulary so a scale degree can be rendered
through `noteNameAtSemitones` unchanged.

```ts
export interface ScaleTypeDef {
  id: string;            // 'majorPentatonic', 'minorPentatonic', 'major', 'naturalMinor', 'blues'
  nameKey: string;       // i18n key, e.g. 'Major Pentatonic'
  /** Ascending semitone offsets from the root, root itself omitted (always 0). */
  degrees: number[];     // e.g. minor pentatonic: [3, 5, 7, 10]
  degreeLabels: string[]; // display label per degree, e.g. ['1','b3','4','5','b7']
}

/** The W/H step pattern between consecutive degrees (root → d1 → d2 → … →
 *  octave), derived from `degrees` — never authored separately, so the
 *  formula shown to the learner (§1.4) can never drift from the semitone
 *  data the engine actually drills. `'W'` = 2 semitones, `'H'` = 1,
 *  `'W+H'` (a step-and-a-half, e.g. pentatonic/blues) rendered as its own
 *  glyph in the UI. */
export function stepPattern(scale: ScaleTypeDef): ('W' | 'H' | 'W+H')[] {
  const bounds = [0, ...scale.degrees, 12];
  return bounds.slice(1).map((n, i) => {
    const gap = n - bounds[i];
    return gap === 2 ? 'W' : gap === 1 ? 'H' : 'W+H';
  });
}
```

### 4.2 The scale-type catalogue and how it ships (revised — phased, not all-at-once)

**Product-owner decision (this session):** Scales Learning does **not** launch
with all five types at once. It ships **one scale type at a time**, starting
from the single most basic and useful one, and each later type is added as
its own follow-up — "we'll start with the most basic scales and gradually
work through the next ones until everything is mapped." Concretely, this
turns §6.1's teaching-order reasoning (originally described as an *internal*
ordering the Teacher consults, never shown as a path) into the literal
**build order** as well:

| Ship order | id | Name | Degrees (semitones from root) | Notes | Step formula | Example from its natural root |
|---|---|---|---|---|---|---|
| **1st (first shippable slice)** | `minorPentatonic` | Minor Pentatonic | 3, 5, 7, 10 | 5 | W+H–W–W–W+H–W | A, C, D, E, G, (A) |
| 2nd | `majorPentatonic` | Major Pentatonic | 2, 4, 7, 9 | 5 | W–W–W+H–W–W+H | C, D, E, G, A, (C) |
| 3rd | `blues` | Blues Scale | 3, 5, 6, 7, 10 | 6 | W+H–W–H–H–W+H–W | A, C, D, D#, E, G, (A) |
| 4th | `naturalMinor` | Natural Minor (Aeolian) | 2, 3, 5, 7, 8, 10 | 7 | W–H–W–W–H–W–W | A, B, C, D, E, F, G, (A) |
| 5th | `major` | Major (Ionian) | 2, 4, 5, 7, 9, 11 | 7 | W–W–H–W–W–W–H | C, D, E, F, G, A, B, (C) |

Rationale per row is unchanged from the original §4.2/§6.1 reasoning (minor
pentatonic is the smallest, most-used shape; major pentatonic is the same
shape from its relative root; blues is a one-note delta from minor
pentatonic; natural minor is the first 7-note extension; major is its
relative-minor pair). What changes is that **each row is now also a release
milestone**, not just a teaching-priority ranking:

- **Slice 1 ships the entire generic system** (Selector, all three
  exercises, SRS, mastery, progress board, Today-card integration, gating) —
  built once, for the one scale type. Every later slice is close to **pure
  data**: a new `ScaleTypeDef` row plus, if warranted, new
  `ScalePositionDef` rows. This is only possible because of the generative
  shape design in §4.3 below — there is no per-type hand-authored fret chart
  to write, so adding scale type *N+1* is cheap and low-risk by design, which
  is exactly what makes a gradual, session-by-session rollout practical
  rather than something that reopens the whole engine each time.
- "Mixed mastery of everything" (§6.2's final curriculum group) only starts
  to mean anything once at least two types have shipped, and only becomes the
  full picture once all five (or more, §8.5) exist — the curriculum/progress
  board code is written once, against the full catalogue, but naturally
  shows only what has shipped so far (an empty catalogue slot is simply not
  drilled, the same way a Future scale type is simply absent today).
- Modes beyond these five (Dorian, Mixolydian, Lydian, Phrygian, Locrian,
  harmonic/melodic minor) remain a catalogued **Future Extension** (§8.5),
  picked up after the five-row catalogue above is fully mapped, per this
  decision.

Note that **Natural Minor from A** and **Major from C** are the textbook
W–H / W–W–H formulas — the table deliberately keeps that recognisable
worked example intact (letters, not solfège) as the anchor case §1.4's
content points to, while the pentatonic/blues rows show the learner that the
same "fixed formula, moving root" idea holds even when the steps include a
step-and-a-half, not just whole/half.

### 4.3 Scale positions and item identity — generated, not hand-authored

**Revised from the original draft.** A scale "position" (a movable neck
shape, e.g. guitarists' conventional "box 1" / "box 2") was originally going
to be hand-authored as a fret-by-fret chart per scale type — mirroring, on
the surface, how a real fingering chart looks. Working through even one
example by hand (minor pentatonic box 1) showed this is exactly the kind of
data entry that is easy to get subtly wrong (one fret off on one string is
invisible in a spec but breaks the drill). It also has to be redone per
instrument (guitar, bass, ukulele, …), each with different tuning intervals.

**Better: a position is a *window*, and the actual fret positions are
computed**, using the same technique `targetPositionsForInterval`
(`intervals.ts`) already uses for Intervals — walk the fretboard's note
table and keep whatever matches. Nothing is hand-typed per shape, so there
is nothing to get wrong, and the same definition works for every instrument
without per-instrument authoring:

```ts
export interface ScalePositionDef {
  scaleTypeId: string;
  positionIndex: number;   // 1-based; which occurrence of the root, low to high
  /** Which string this position's root sits on — this, not a fret chart, is
   *  what makes "position 1" different from "position 2": the root simply
   *  moves to the next string down (or up) the instrument. */
  rootString: number;
  /** Fret window around the root fret, inclusive, e.g. { from: -1, to: 3 }.
   *  Every fret in [rootFret+from, rootFret+to], on every string, whose note
   *  matches one of the scale's pitch classes is part of the shape — this
   *  is the generative replacement for a hand-authored chart, and it is
   *  exactly how a "box" is conventionally taught (a handful of frets around
   *  a root, on every string). */
  window: { from: number; to: number };
}

/** Every neck position inside `position`'s window, at the given root fret,
 *  whose note is one of `scale`'s pitch classes above `rootFret`'s note.
 *  `noteTable` is the active `[string-1][fret] -> name` table
 *  (`InstrumentConfig.notes`), exactly as `targetPositionsForInterval` takes
 *  it. Returns `null` if the window would leave the fretboard, so the
 *  question generator tries a different root. */
export function shapeAtRoot(
  scale: ScaleTypeDef,
  position: ScalePositionDef,
  rootFret: number,
  noteTable: readonly (readonly string[])[],
): NeckPos[] | null {
  const rootName = noteTable[position.rootString - 1]?.[rootFret];
  if (!rootName) return null;
  const lo = rootFret + position.window.from;
  const hi = rootFret + position.window.to;
  if (lo < 0) return null;
  const scaleTones = new Set(
    [0, ...scale.degrees].map((s) => noteNameAtSemitones(rootName, s)),
  );
  const out: NeckPos[] = [];
  for (let s = 1; s <= noteTable.length; s++) {
    const row = noteTable[s - 1];
    for (let f = lo; f <= hi && f < (row?.length ?? 0); f++) {
      if (scaleTones.has(row[f])) out.push({ string: s, fret: f });
    }
  }
  return out;
}
```

For the MVP's two positions per shipped scale type: **position 1** roots on
the lowest string the instrument has (window roughly `{ from: -1, to: 3 }`,
matching the conventional "box 1" span); **position 2** roots on the next
string up (same window shape). Both are the *same* `ScalePositionDef` idea
applied to a different `rootString` — no per-type, per-position hand tuning.

**Item id** (`src/learning/scaleItem.ts`, mirrors `intervalItem.ts` exactly):

```ts
export const SCALE_ID_PREFIX = 'scale:';
export function scaleItemId(scaleTypeId: string, positionIndex: number): string {
  return `${SCALE_ID_PREFIX}${scaleTypeId}:${positionIndex}`;
}
```

Item count is now a per-slice number, not a single MVP total: **2 items per
shipped scale type** (its 2 positions). Slice 1 (minor pentatonic) ships 2
items; the full 5-row catalogue eventually reaches 10 — still the same order
of magnitude as Intervals' 11, for the same reason (a learnable, visible
curriculum and a small SRS), just arrived at incrementally.

### 4.4 Root selection per question

The root is **not** part of the item (§3). Each question picks a concrete
root string/fret the way Intervals picks a first note: difficulty-biased
(naturals first, any note at `full`), constrained so `shapeAtRoot` returns
non-`null` (the window fits the fretboard) — the same window-clamping
`targetPositionsForInterval` already does for Intervals, reused as-is.

---

## 5. Scale Selector specification

New `ScalePracticeScreen` (mirrors `IntervalPracticeScreen`: `app
settings-page lp-page` shell + hero + `<ProGate feature="scaleDrill"
variant="replace">`), body is a `useScaleSelector(instrument, isPremium)`
hook mirroring `useIntervalSelector` field-for-field: each control persisted
to its own `localStorage` key (`ssel_*` prefix), a derived settings object, a
`buildDrill()` producing a `DrillConfig` carrying a `scale` spec (§19).

### 5.1 Exercise (required)

Three options (detail in §8):

- **Build the scale** (`exercise: 'buildScale'`) — the app names a scale +
  root and marks the root on the neck; the learner taps every other note of
  the shape on `FretGrid`. Reuses the existing multi-find flow.
- **Identify the scale** (`exercise: 'identifyScale'`) — the app plays the
  scale ascending, root to top only (OD-S1, §17); the learner picks the scale
  name from a chip row.
- **Name the degree** (`exercise: 'nameDegree'`) — the app shows a scale +
  root + a degree number (e.g. "the 3rd of C major pentatonic"); the learner
  picks the target note from a note-chip row.

### 5.2 Scale selection (required)

Mirrors Intervals §5.2 exactly: **One scale** (single `(type, position)`
chip) / **A group** (curriculum group, §6.2) / **All learned** (default) /
**All 5 types** (every authored position, regardless of curriculum
progress).

### 5.3 Position

A second-level control, only shown once more than one position exists for the
selected scale type(s): **This position** / **All positions** for the current
selection. No "direction" axis exists for scales (a scale run is always
played root-up, OD-S1, §17).

### 5.4 Difficulty

`ScaleDifficulty = 'focused' | 'mixed' | 'full'`, same placement and shape as
`IntervalDifficulty` (§9). Clamped to `focused` when "One scale" is picked,
mirroring the Intervals clamp rule exactly.

### 5.5 Auto Advance — not in the MVP

Same as Intervals §5.5: no toggle, no scale stage sequence. Free Selector
practice plus the optional Today card / Teacher session (§13).

### 5.6 "?" summary bubble

Matched to the chosen exercise, same slot as Intervals §5.6, e.g.: *"You'll
see a root marked on the neck. Tap every note of the minor pentatonic shape
around it."*

### 5.7 Layout / reuse

Identical reuse list to `intervals-learning-spec.md` §5.7: `SettingCard` /
segmented-control / chip-row styles from `14-selector.css` /
`06-controls.css`; Start/countdown/`SpeedBar`/feedback unchanged;
`FretGrid` (Exercise A), a scale-name chip row (Exercise B, new small
component), a note-chip row (Exercise C, reused from Intervals).

---

## 6. Curriculum — an internal ordering, not a screen

Same non-negotiable framing as `intervals-learning-spec.md` §6: **not**
rendered as a path, no checkpoints, no unlock thresholds. Exists only so the
Teacher (§13) knows what to introduce next.

**This ordering is now also the literal build order (§4.2).** Originally this
section only meant "the order the Teacher introduces already-shipped scale
types in" — Notes and Intervals both ship their whole catalogue at once, so
that distinction never mattered there. Scales ships incrementally (one scale
type per session, per the product owner's decision), so §6.1's ranking below
doubles as the release plan: whichever scale type is not built yet simply
does not exist in the curriculum, the Selector, or the progress board yet —
there is no partial/disabled state to design for, the same way a Future
scale type (§8.5) is simply absent today.

### 6.1 Ordering rationale

1. **Minor pentatonic, box 1.** The smallest shape, the most immediately
   usable, and the one most learners already have some ear-familiarity with.
2. **Major pentatonic, box 1.** Same shape, learner discovers the relative-
   major relationship (two names, one shape, root moved).
3. **Blues scale, box 1.** One-note delta from a shape just learned — high
   payoff, low new load, and reinforces "a scale is a formula, not a fixed
   picture."
4. **Natural minor, box 1 (the 7-note extension).** Introduces the fuller
   diatonic shape once the pentatonic anchors are solid.
5. **Major (Ionian), box 1.** Relative-minor pair with the above, same
   pattern as pentatonic → its relative.
6. **Box 2 for each type** (pentatonic/blues first, then the diatonic pair).
   Reinforces that the *shape* moves and repeats up the neck.
7. **Mixed mastery.** Everything interleaved.

### 6.2 Curriculum groups (`src/learning/scaleCurriculum.ts`, mirrors
`intervalCurriculum.ts` data shape exactly — `IntervalGroup` → `ScaleGroup`,
`introduces: string[]` of item ids, `review`, and **confuser pairs**
(shapes that are easy to mix up, e.g. minor pentatonic box 1 vs. blues box 1,
which differ by exactly one note): same `currentGroupIndex` /
`sizesThroughGroup`-shaped API, renamed to operate on item ids instead of
semitone sizes.

---

## 7. Learning units — per-scale content

Mirrors `intervals-learning-spec.md` §7 exactly, in `scaleContent.ts`, with
one addition §1.4 makes mandatory: **the step formula and a letter-spelled
worked example come first**, before the degree-label shorthand, because that
formula is the one idea this whole domain must land. Per scale type:

- **Step formula**, in W/H notation, from `stepPattern()` — never re-authored
  by hand (§4.1's derivation guarantee).
- **Worked example**, root → root, in **letter note names** (from §4.2's
  table) — e.g. natural minor: *"W–H–W–W–H–W–W. From A: A, B, C, D, E, F, G,
  (A)."* This is the sentence every scale's content leads with.
- Degree formula in plain shorthand ("1, b3, 4, 5, b7") — the existing
  interval-degree framing, kept as a secondary, more compact restatement of
  the same formula for a learner who already has it.
- A one-line description, a "🔊 hear it" ascending playback, the
  nearest-neighbour confuser + discriminator (e.g. "the blues scale is the
  minor pentatonic plus one note — the b5, between the 4 and 5"), and a brief
  musical-role line ("the go-to rock/blues soloing scale").
- Wherever the formula's whole/half steps are named, the copy cross-links the
  Intervals vocabulary once per scale ("a whole step here is the same Major
  2nd Intervals Learning drills") — reinforcing §1.4's sibling-domain framing
  rather than teaching the same idea twice under different names.

No standalone theory screen; surfaced inline in the "?" bubble, post-answer
feedback, and the progress board rows (§1.4 lists exactly which surfaces).

---

## 8. Practice types

### 8.1 Exercise A — Build the scale

- **Stimulus:** the app marks the **root** on `FretGrid` (or names it, e.g.
  "root: A, string 5") and states the scale name.
- **Answer:** the learner taps every other note of the shape. Directly reuses
  the existing byNote multi-fret mechanic (`remainingFrets`/`foundFrets` in
  `useGameEngine.ts`) — the engine is handed an explicit `candidates` list
  (the shape's positions at the chosen root, from `shapeAtRoot`) exactly the
  way a Game stage or Teacher session already hands it position candidates
  today. **No new engine capability required for this exercise** — the
  biggest single reuse win in this design.
- **Correct:** all shape positions found before timeout (existing logic,
  unchanged).
- **Engine work:** none beyond a `scale` spec on `DrillConfig` that
  `deriveDrillConfig`'s scale-analogue computes `candidates` from per
  question (mirrors how the `interval` spec sits beside `candidates` without
  touching it).

### 8.2 Exercise B — Identify the scale

- **Stimulus:** the app plays the scale's notes in sequence, root to top,
  via `audio.ts` — a direct extension of the two-note sequential playback
  already built for Intervals Exercise A to N notes (N = 5, 6, or 7 depending
  on scale type).
- **Answer:** the learner picks the scale name from a **chip row** (5 scale
  names, or fewer with the group/one-scale pool).
- **Correct:** chosen chip's `scaleTypeId` matches.
- **Replay:** "🔊 hear it again," no penalty — same convention as Intervals.
- **Engine work:** small — generalise the Intervals two-note player to an
  N-note player; the interval-chip answer surface (§2 mapping table) is
  reused verbatim with a different label set.

### 8.3 Exercise C — Name the degree

- **Stimulus:** the app shows a scale name + root + a degree number/label
  (e.g. "5th degree of A minor pentatonic").
- **Answer:** the learner picks the target note from a note-chip row.
- **Correct:** enharmonic match of the picked note to
  `noteNameAtSemitones(root, ScaleTypeDef.degrees[n])`, via the existing
  `notesMatch`.
- **Engine work:** none beyond wiring — this is Intervals Exercise B with the
  interval size looked up from the scale's degree table instead of chosen
  directly. `buildTargetNoteOptions` is reused as-is.

### 8.4 Sufficiency

The three cover: recognising a shape by touch (A), recognising it by ear (B),
and understanding it as a formula of degrees rather than a fixed picture (C,
which also reinforces the Intervals connection). Proposed sufficient for a
first release, mirroring how Intervals shipped with exactly two.

### 8.5 Future Extensions (documented, not proposed for the MVP)

| Extension | What it adds | New dependencies |
|---|---|---|
| **Additional modes** (Dorian, Mixolydian, Lydian, Phrygian, Locrian, harmonic/melodic minor) | Wider scale-type table | More `ScaleTypeDef` rows; curriculum groups extend |
| **Full 5-box system per scale type** | All conventional positions, not just 1–2 | More `ScalePositionDef` rows; larger item count |
| **Connect-the-boxes** | A drill that spans two adjacent positions as one shape | New multi-position candidate geometry |
| **Auto Advance + scale stage sequence** | Guided walk through the curriculum groups automatically | `scaleStageSequence.ts`; a Selector toggle |
| **Scale-over-chord application** | "Which scale fits this chord?" | Chord content (premium-product-plan.md P6) |
| **Fingering / technique guidance** | Recommended fingering overlay | Out of scope for a note-recognition-first app |

---

## 9. Scale Difficulty model

Mirrors `intervals-learning-spec.md` §9 structurally.

### 9.1 Dimensions

| Dimension | Easier → Harder | In MVP? |
|---|---|---|
| Pool size | one scale/position → a group → all learned → all 5 types | **Yes** |
| Confuser presence | far-apart scale names as options → nearest confuser forced in (Exercise B) | **Yes** (mixed/full) |
| Number of answer options | 2–3 → 4 → 5 | **Yes** |
| Root bias | naturals-biased root → any root incl. accidentals | **Yes** |
| Position spread | box 1 only → any authored position | **Yes** |
| Per-question time | generous → tight | **Yes**, same ramp mechanism |
| Number of positions drilled per session | one position → all positions of the pool | **Future** (interleaving, mirrors Intervals §9.4) |

### 9.2 The three tiers (proposed envelope, tune in playtest)

| tier | pool | positions | answer options | root bias |
|---|---|---|---|---|
| focused | 1 scale | 1 | 2–3 | naturals |
| mixed | current group | 1 (per question, within the pool) | 4 | any |
| full | all learned / all 5 | any authored | 5 | any |

Base `questionCount`/`timeLimit` proposed the same order as Intervals (§9.3
there): `focused` more generous, `full` tighter — exact numbers deferred to
playtest, same as Intervals left them.

---

## 10. Scale SRS and weakness

### 10.1 Reuse

`src/learning/srs.ts` used **unchanged**, exactly as Intervals does. New
`InstrumentLearningState.scaleSrs: SrsMap`, id = `scale:<type>:<position>`.
Do not modify `srs.ts`; if scale-specific tuning is wanted, pass per-domain
constants the way §19 requires for Intervals.

### 10.2 Definitions

Identical shape to `intervals-learning-spec.md` §10.2: SRS item = one
`(scaleType, position)` pair; enters the schedule on first answer; correct →
bucket up, wrong/timeout → bucket reset to 0 + short lapse delay.

### 10.3 `scaleWeakness.ts`

Mirrors `intervalWeakness.ts` mirroring `weakness.ts`: over scale-tagged
history rows + `scaleSrs` — low recent accuracy, slow answers, repeated
misses, overdue SRS. A capped, synced `scaleHistory` (proposed ~200 rows per
instrument) in the learning-state blob, same as Intervals' `intervalHistory`
(OD-6 precedent).

---

## 11. Scale Mastery

Mirrors `intervals-learning-spec.md` §11 exactly: a `(scaleType, position)`
is **mastered** when its `scaleSrs` bucket ≥ a threshold (proposed 3, same as
Intervals) **or** recent accuracy ≥ 0.85 over ≥ 4 attempts. Own constants in
`scaleMastery.ts` (not imported from `intervalMastery.ts`, same
non-cross-contamination rule §19 states for Intervals vs. Notes).

"Scales mastered" surfaced as a count (`n/~12`) plus the flat board (§12). No
completion tier, no checkpoint, no star.

---

## 12. Scale progress — a flat board, grouped by scale type

Same non-negotiable as Intervals §12: **no Scale Learning Path**, no
checkpoint screen, no stage ladder. Proposed presentation: a flat board
grouped by the 5 scale types (each a small section header), each section
listing its authored positions as *not started / learning / mastered* rows —
this is the one presentational difference from the Intervals board (which is
a single flat list of 11), because "grouped by scale type" is how a guitarist
actually thinks about the material and the item count (§4.3) is designed to
stay small enough that this is still a single screen, not a drill-down.

---

## 13. Daily / Teacher for scales

Mirrors `intervals-learning-spec.md` §13 structurally: a "Today" card that
pulls overdue `scaleSrs` items first, then weak items from
`scaleWeakness.ts`, then the current curriculum group's not-yet-mastered
items, into a `mixed`-tier session; a "why these?" list (Due for review /
Often confused / New / Needs reinforcement) reusing the `.teacher-card` shell
and why-list pattern. Runs through the same `useLearning()` hook, additively
(`scaleTrackedCount`, `recordScaleAnswer`, `buildScalePlan`).

---

## 14. Daily goal

Own `scaleDaily` goal in the blob, separate from both the note daily goal and
`intervalDaily` — reviewing a scale never ticks either of the other two
goals, mirroring Intervals OD-5.

---

## 15. Persistence / cloud

`learningState.ts` gains, per instrument, alongside the existing `srs` /
`intervalSrs` / `daily` / `intervalDaily` / `intervalHistory` / `path`:
`scaleSrs: SrsMap`, `scaleDaily: DailyGoal`, `scaleHistory: HistoryRow[]`
(capped). Same normaliser / per-item merge treatment as the interval fields;
`learningSync.ts` carries the new keys through the existing pull → merge →
write-back → upsert cycle, no new sync module (exactly how `intervalSrs`
rode along inside the existing `user_learning_state` row without a new
migration table — a new column-less addition to the same JSONB blob needs no
new Supabase migration, only a doc-only note in the migration list the way
`0014` is annotated for intervals).

---

## 16. Gating

New feature key `scaleDrill` in `src/utils/features.ts`, `MIN_TIER:
'premium'`, added to the `Feature` union and `MIN_TIER` map next to
`intervalDrill`. `<ProGate feature="scaleDrill" variant="replace">` wraps
`ScalePracticeScreen`, mirroring `IntervalPracticeScreen` line for line.

---

## 17. Open Decisions — resolved

Mirroring `intervals-learning-spec.md` §24, the four questions this
document previously left open are resolved here so implementation has
nothing left to improvise. Each is a real product call, decided the way the
Intervals precedent decided its own OD list — in favour of the smaller,
sooner-shippable option, with the larger option catalogued rather than
dropped.

**OD-S1 — Exercise B playback is root-to-top only, not a full up/down run.**
A full run is more idiomatic but doubles Exercise B's per-question playback
time, and Intervals shipped its own listening exercise (two notes) at the
minimal footprint rather than the maximal one. A "play it both ways" toggle
is catalogued in §8.5.

**OD-S2 — the root is always pre-marked in Exercise A ("Build the scale").**
Exercise A stays squarely about the *shape*; asking the learner to also
locate the root note tests note-finding, which is Notes Learning's job, not
this domain's. This also keeps Exercise A a pure reuse of the existing
byNote/`FretGrid` flow (§2 mapping table) with zero new finding logic.

**OD-S3 — box naming shows both: the plain description leads, the
conventional number trails in parentheses.** e.g. *"Minor Pentatonic — near
the open position (Position 1)"* / *"Minor Pentatonic — around the 5th fret
(Position 2)"*. This matches how this app already prefers a plain-language
label with the technical term as a secondary cue (the same pattern the
Hebrew-facing copy in this repo uses: describe the control in plain words,
name the on-screen label parenthetically) rather than assuming the learner
already knows guitar-pedagogy box numbering.

**OD-S4 — exactly two positions per scale type, shipped one type at a time
(§4.2).** Now that positions are generated, not hand-authored (§4.3), the
reason to cap this is no longer authoring effort — it is keeping the SRS
schedule and the progress board (§12) small and legible while each new scale
type is still landing on its own. Two positions per type, ten items at the
full five-type catalogue, is the same order of magnitude as Intervals' 11,
for that reason. Position 1 roots on the instrument's lowest string; Position
2 on the next string up. The remaining conventional boxes (3, 4, 5) are §8.5
Future work, added later by extending `SCALE_POSITIONS` — trivial once
generation replaces authoring, since a new position is one `rootString`/
`window` row, not a new fret chart.

---

## 18. Architecture — target file layout (proposed, mirrors §20 for Intervals)

**All of this is built once, in the Slice 1 session (Minor Pentatonic, §4.2)
— every later scale type only touches `scales.ts` (a new `ScaleTypeDef` row)
and `scaleContent.ts` (its authored copy), never the files below it.**

```
src/utils/scales.ts                  # ScaleTypeDef, ScalePositionDef, shapeAtRoot — pure, imports intervals.ts
src/learning/scaleItem.ts            # scale:<type>:<position> id
src/learning/scaleCurriculum.ts      # ScaleGroup[], currentGroupIndex, sizesThroughGroup-equivalent
src/learning/scaleContent.ts         # per-scale-type authored copy (i18n keys)
src/learning/scaleDrill.ts           # builds DrillConfig with a `scale` spec; scaleDifficulty tiers
src/learning/scaleMastery.ts         # own thresholds; scaleStatus(); masteredItems()
src/learning/scaleWeakness.ts        # analyzeScaleWeakness over scaleHistory + scaleSrs
src/hooks/useScaleSelector.ts        # mirrors useIntervalSelector
src/components/ScaleCard.tsx         # entry card
src/components/ScalePracticeScreen.tsx
src/components/ScalePrompt.tsx
src/components/ScaleProgressBoard.tsx # the flat, grouped board (§12)
```

`useGameEngine.ts` gains a scale branch analogous to the interval branch:
`GameSettings.scale?`, a `buildScaleQuestion` that computes `candidates` for
Exercise A / plays the N-note sequence for Exercise B / looks up the target
note for Exercise C, and a `tagScale(entry)` helper stamping
`HistoryEntry.scaleItemId` — structurally identical to `tagInterval`.
`learningState.ts` / `learningSync.ts` gain the three new blob fields (§15).
`LearnHub.tsx`'s `LearnDomain` gains `'scales'`. `translations.ts` gains scale
name/degree/content keys, with Hebrew entries (per this repo's i18n
convention — every new user-facing string needs one).

---

## 19. What must not change

Same list `intervals-learning-spec.md` §19 gives for Intervals, restated for
Scales: `srs.ts` is not modified; `mastery.ts` (the Notes overlay) is not
touched; Notes' `buildDailyPlan` and `intervalDrill.ts`/`intervalCurriculum.ts`
etc. are not touched — Scales adds new files and new optional fields, it does
not edit the interval or note domains' logic. `useDrillHistorySink` isolation
must be proven the same way `wasIntervalRunRef` is proven for Intervals
(§2.1 mapping row): a scale run must never write to note history, mastery,
badges, leaderboard, or personal-best.
