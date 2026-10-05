# Fretquency — Premium Product Plan

Status: **product planning only. No code, no schema, nothing built in this pass.**

This document turns the loose "Premium" bullets in `product-wishlist.md` §6 into a coherent
product: one learning system, not a bundle of paid mini-games. It assumes the Free/Pro split that
is **already built and shipped** (`.kiro/specs/free-pro-tiering/design.md`, phases 1–6) and models
the third tier on top of it.

Ground rules carried in from the product owner:

- **The Selector Panel stays the centre of the app.** The old Stage-navigation model is not
  revived. If Premium has a guided journey it is a **Learning Path that lives *alongside* the
  Selector**, never a replacement for it. A Premium user can ignore the Path entirely and free-drill
  through the Selector; their answers still feed everything Premium does.
- **Premium is one learning product.** Scales, chords, intervals, triads, staff reading and
  playing-on-the-guitar are *content* inside a shared engine, not separate engines and not separate
  "modes" on a menu.
- **Gating hides, it never deletes or stops collecting** (inherited from the Free/Pro design).

---

## 1. What Premium is

**The one-sentence promise:**

> Premium turns Fretquency from a drill you configure into a teacher that plans your
> practice — it finds your weak spots, decides what you should do next, brings them back on a
> schedule, and grows with you from single notes into intervals, scales, triads, chords and
> reading.

**Why it is a product, not "more features":**

The Free and Pro tiers are both *self-directed*: the user opens the Selector, picks a string, a
fret range and a difficulty, and drills. Pro makes that self-direction serious — permanent history,
a mastery view you can slice any way, precise fret windows, large multi-string drills, a personal
voice profile. But the user is still the one who has to know what to work on.

Premium removes that burden. The value is **a practice loop that runs itself**:

1. You open the app and it shows you one short session to do today.
2. That session is built from *your* actual mistakes and what is *due for review*, not a menu you
   picked.
3. What you get wrong comes back — spaced out — until it sticks.
4. As you improve, the app widens the material (more frets, accidentals, then intervals, then
   scales…) and walks you along a path you can see.

The paid thing is not any single screen. It is that a Premium user **does not have to decide what
to practise** and can trust that nothing they are weak on quietly falls through the cracks.

---

## 2. Boundaries between Free, Pro and Premium

### Role of each tier

| Tier | One line | The user's mental model |
|---|---|---|
| **Free** | "Learn the neck." | *A complete, honest app. I can genuinely learn every note name on a guitar or bass for nothing.* |
| **Pro** | "Train seriously and keep the record." | *I know what I want to practise — give me the tools and the history to do it properly.* |
| **Premium** | "A teacher, not a timer." | *I don't want to plan my practice. Tell me what to do, watch how I do it, and adjust.* |

Free is breadth-complete for one skill (note recognition). Pro is **depth on that same skill,
self-driven**. Premium is **direction** — the app drives — **and new skills** (intervals, scales,
chords, triads, staff, playing).

### What must not leak downward

These are the lines that keep the tiers distinct. Getting any of them wrong collapses Premium into
"Pro with extra buttons".

- **The recommendation engine — "what should I practise now" — is Premium only.**
  Pro/Free may keep a *reactive* nudge ("you're at 95% here — try adding ♯♭?") that only looks at
  the round you just finished. The moment the app **maintains a model of you and a plan across
  sessions**, that is Premium. Draw the line at *reacts to the last round* (Pro-OK) vs *keeps a
  standing model and a plan* (Premium).
- **Spaced-repetition scheduling (SRS) is Premium only.** A "review my weak notes" button that
  pulls items on a schedule must not appear in Pro. Pro's mastery overlay *shows* weak notes;
  turning that into a review queue is the Premium mechanism.
- **New content domains (intervals, scales, chords, triads, staff, guitar-audio answering) are
  Premium only.** Do not ship "Chords mode" as a Pro drill surface. If Pro gets new content types,
  Premium is just "more of the same" and there is no reason to pay for it.
- **The Learning Path screen is Premium only.**
- **Prescriptive daily goals are Premium only.** Free already has a practice streak and
  daily-practice badges (`week_warrior`, `dedicated`). Those stay Free and stay *passive* ("you
  practised today ✓"). A Premium daily goal is *prescriptive* ("today: ~8 min — string 5 naturals
  + 6 chords due for review") and has its own done/not-done state.
- **Everything already gated Pro-over-Free stays there** (`features.ts`): history beyond 7 days,
  the mastery-window control, all-combination personal bests, precise fret range, multi-string
  beyond 2, the personal voice profile. Premium inherits all of it.

### Overlap check — places the tiers touch the same data without conflicting

- **Mastery maps.** Free gets the neck overlay (last 250 questions). Pro gets the window-size
  control. Premium *consumes* the same mastery data to drive recommendations. That is a different
  *use* of the data, not a bigger version of the same feature — no confusing overlap, but say so
  explicitly in any UI copy.
- **Adaptive difficulty.** The wishlist has a Pro-ish "auto-suggest a harder/easier Selector
  config" idea (§3). Under this plan that idea **becomes a Premium mechanism** — the planner
  *applies* difficulty changes inside a generated session rather than suggesting the user go edit
  the Selector. If a lightweight reactive suggestion is still wanted for Pro, it must be visibly
  smaller: one nudge, about the last round only, no memory.
- **Auto Advance (`stageSequence.ts`).** Stays a Free/Pro feature. It is a fixed hand-ordered walk
  of Selector states. The Premium planner is a *dynamic* version of the same idea; they may later
  share checkpoint data, but Auto Advance is **not** the Learning Path and does not become Premium.
- **Placement test.** Stays Free (it seeds Selector difficulty). Premium *extends* the same result
  into an initial skill estimate and a first Path — it does not add a second onboarding.

---

## 3. The Premium user experience over time

The whole experience is layered **on top of the Selector home screen**, never in place of it.

### Day one

1. The user completes the existing onboarding + placement test (unchanged, Free).
2. Premium adds one short question after placement: *"What do you most want to get better at?"* —
   note recognition / soloing & scales / chords / reading music. This sets the initial Path
   emphasis; it is not a hard commitment.
3. The placement result, which today only sets Selector difficulty, is **also** turned into an
   initial per-item mastery estimate (which regions of the neck the user already seems to know).
4. The app generates a first **Learning Path** and shows a **Today card** on the home screen,
   beside the Selector: *"Start here — 6 min: strings 6 & 5, natural notes, by fret."* One tap runs
   it.

### How the user discovers what to learn

The **Today card** is the answer. It sits next to the Selector and always offers exactly one
recommended session, with a **"Why this?"** that explains it in plain language ("you missed 40% of
B and E last session, and 5 notes are due for review"). It is always dismissible — the Selector is
right there for anyone who wants to pick their own drill instead.

### How the user progresses

The drill loop is unchanged: every answered question already flows into `useHistory`. Premium adds
a **skill model** on top — a mastery value per *item* (a specific note position, later a scale
shape, an interval, a chord) that goes up on success, down on a miss, and decays slowly over time.
The Learning Path is a sequence of **checkpoints**, each a cluster of items with a goal ("open
position naturals, 90% accuracy"). Each checkpoint shows a % mastered; the current one is
highlighted.

### How the app spots weaknesses

Reuse the existing aggregation (`mastery.ts`, `progress.ts` `weakNotes`). An item is **weak** when,
over a recent window, its accuracy is below a threshold **or** its average response time is above a
threshold **or** it is overdue for SRS review. That weakness list is the raw material for the next
session.

### How the app decides what to give next

A **session planner** picks a set of N items — a weighted mix of: overdue reviews, weak items, the
next Path item, and a little consolidation of items the user is already strong on. It emits a
`DrillConfig` (with `candidates` set to exactly those items) and runs it through the **existing**
`useDrillSession`. No new session engine.

### How the user sees progress

- The **Learning Path screen** — checkpoints, % mastered, next step.
- The existing **Stats & Progress screen** — unchanged (Pro-gated depth as today).
- The existing **neck mastery overlay** — unchanged.
- A Premium **skill summary** — per-domain mastery at a glance (note / interval / scale / …), once
  more than one domain exists.
- Streaks and badges — unchanged, still Free.

---

## 4. Learning domains and how they connect

Seven things Premium can teach. Six are **content**; one (guitar-audio) is a **way of answering**,
not a body of content.

| Domain | Depends on | Can run in parallel with |
|---|---|---|
| **Notes on the fretboard** | — (this is the root) | — |
| **Intervals** | Notes | Early scale shapes, staff reading |
| **Scales** | Notes; helped a lot by Intervals | Intervals, staff reading |
| **Triads** | Notes + Intervals (3rd, 5th) | Scales |
| **Chords** | Triads (or at least Intervals) | Scales |
| **Staff reading** | Note names (pitch ↔ name) | Everything — independent track |
| **Guitar-audio (play & detect)** | Notes solid; **a working pitch detector** | Any domain, as an answer modality |

### The prerequisite graph, in words

- **Notes is the root.** Everything else assumes you can find a note on the neck. The app should
  want you reasonably solid on at least open position + one octave before it pushes you into other
  domains — but this is a *planner weighting*, not a hard lock. A user who chose "chords" on day one
  can start chords; the planner just interleaves note review until the foundation is there.
- **Intervals** is the hinge. It needs notes, and it makes scales, triads and chords much easier.
  Worth introducing early, in parallel with the tail end of note mastery.
- **Scales** need notes; they go faster after intervals but do not strictly require them.
- **Triads** are the bridge from intervals to chords — needs the 3rd/5th idea.
- **Chords** need triads (or at least intervals) for chord-tone spelling.
- **Staff reading** only needs pitch↔name and is otherwise independent — it can run alongside
  anything from early on, and it pairs naturally with "play this note" once guitar-audio exists.
- **Guitar-audio** is a modality: once the detector is trusted, *any* domain's question can be
  answered by playing instead of tapping or speaking. Start with single notes, extend to scale
  sequences, treat polyphonic chord detection as maybe-never.

### How the Path weaves them

The Path is **not** "finish all notes, then all intervals". It is: *"you're at 80% on open-position
notes, so introduce intervals on strings 6–5 while keeping ~20% of each session as note review
elsewhere on the neck."* The planner mixes domains by what the skill model says you need.

---

## 5. The shared learning engine

The explicit requirement: **never** end up with a Note Game Engine, a Scale Game Engine, a Chord
Game Engine. One engine, parametrised by content. Good news: the seam for this **already exists** —
`src/drill/DrillConfig.ts` deliberately decouples the drill runner from Selector concepts, and its
`candidates?: DrillPosition[]` field is described in-code as *"the seam a future Game builds a stage
on."*

### The abstractions (data + responsibilities, no code)

1. **Item** — the atomic thing a learner can know. `{ domain, id, …descriptor }`.
   - Note item: a `(string, fret)` position (or `(note, region)`).
   - Interval item: `(interval, root context)`.
   - Scale item: `(scale type, key, neck position)`.
   - Triad item: `(triad type, root, string set)`.
   - Chord item: `(chord type, root, shape)`.
   - Staff item: `(pitch, staff position, clef)`.
   The item id is what **mastery and SRS are keyed on** — the generalisation of today's
   per-`historyKey` + per-note tracking.

2. **Question generator** — per domain, a pure function `Item → Question`, where a `Question` is
   `{ prompt, promptModality, answerType, acceptableAnswers, … }`. The prompt might be "show a
   fret", "show a note name", "show a staff glyph", "name this scale", "play this chord's audio".
   **This is the only substantial per-domain code, and it is small**: a prompt renderer + an answer
   matcher.

3. **Answer capture** — modality-agnostic. Three sources today: tap (`NoteCircle` / `FretGrid`),
   voice (`useVoiceAnswer`), and (future) guitar-audio. Each yields a candidate answer; the engine
   does not care which was used.

4. **Answer check** — `(question, candidateAnswer) → correct | partial | wrong`. The "by note" mode
   already has a *partial* state (some of N frets found). That generalises directly: a scale
   question wants all N notes, a chord wants all its tones.

5. **Outcome → mastery update** — one function, `(item, outcome, responseTime) → new mastery`,
   identical for every domain. This is `mastery.ts` generalised from notes to items.

6. **Weakness** — derived, domain-agnostic: recent accuracy + latency + SRS-due per item.

7. **SRS scheduler** — per item: an interval and a due date (Leitner buckets to start; SM-2 / FSRS
   later — cheap to swap because the state is per-item). Domain-agnostic. Feeds the planner.

8. **Session planner** — domain-agnostic. Inputs: the weakness list, SRS due items, Path position,
   and mix weights (review / new / consolidate). Output: a set of items → a `DrillConfig` with
   `candidates`.

### What runs a session already exists

`useDrillSession(DrillConfig) → SessionResult` is the runner. Premium's job is only to:
(a) generalise the **item / mastery / question** layer beyond notes,
(b) add **SRS + planner + Path** on top,
(c) render the **new prompt/answer types**.
It does **not** add a second session runner.

### Where today's code maps in

| Today | Under the shared engine |
|---|---|
| `useGameEngine` / `useDrillSession` | The session runner. Keep. Extend its question source to accept *generated* questions, not only note/fret from a position pool. |
| `DrillConfig.candidates` (`DrillPosition[]`) | Already the "explicit item list" seam. Generalise `DrillPosition` → `Item`. |
| `mastery.ts` (`MasteryWindow`, `applyMasteryWindow`, `historyForInstrument`) | Re-key from *note* to *item id*. The windowing/decay logic is reused as-is for weakness detection. |
| `useHistory` / `HistoryEntry` | Add nullable `domain?` + `itemId?`. Back-compat: absent ⇒ note domain, derived from `note`/`fret`/`string`. |
| `progress.ts` `weakNotes` | The seed of domain-agnostic weakness detection. |
| `speechVocab.ts` / answer parsing | Per-domain answer matchers already exist for notes/frets; add scale / chord / interval parsers as new matchers. |
| `src/game/` `StageGoal` / `StageTargets` / `evaluateStars` | The threshold-tier math is directly reusable as **Path checkpoint goals**. (See the open question in §13 about the rest of that module.) |

---

## 6. The "Teacher" system

### First version (ships with the Premium MVP) — notes only

- **Weakness detection** over note items only, reusing `mastery.ts` + `progress.ts` `weakNotes`.
  Weak = accuracy below X over the last N answers, or average latency above Y.
- **Targeted session**: one action — *"Practise my weak spots"* — the planner builds a `DrillConfig`
  whose `candidates` are the weak positions, and it runs through `useDrillSession`. This one feature
  alone is a sellable Premium capability and reuses the entire existing stack.
- **SRS for notes**: each note position gets a due date; overdue positions are pulled into
  generated sessions. **Leitner buckets** to start — simple and debuggable.
- **One prescribed daily session** ("~8 min: weak spots + review"), with its own done / not-done
  marker, separate from the Free practice streak.
- **The "what to practise now" card** on the home screen, beside the Selector, always dismissible.
- **Adaptive difficulty inside the planner**: item cluster above ~90% → promote (wider frets, add
  ♯♭, tighter timer); below ~60% → demote. This is the wishlist's "adaptive suggestion" idea, but
  the app *applies* it rather than asking the user to change the Selector.

### Advanced ideas (later, explicitly not first)

- Multi-domain skill model and a cross-domain Path.
- "Explain why" narratives on recommendations.
- Long-horizon planning ("in ~3 weeks you'll have open position + first octave").
- Plateau detection — noticing a skill has stopped improving and changing approach.
- Session-length adaptation to the user's real available time / attention.
- Interleaving vs blocked-practice tuning — needs real usage data before it can be designed well.

### First vs advanced — the dividing test

The first version keeps a model of *one* domain and schedules it. Anything that needs a model
*across* domains, or needs real Premium-user data to tune, is advanced.

---

## 7. Learning by playing the guitar

Keep these five concerns separate:

1. **Pitch detection** — monophonic fundamental-frequency estimation from the mic (autocorrelation
   / YIN / FFT-peak). This is a **from-scratch DSP problem** and shares essentially no code with the
   existing MFCC/DTW *word* recogniser in `speech.ts`. New util, e.g. `pitchDetect.ts`.
2. **"Play the note" questions** — a new prompt/answer type in the shared engine: show a note or a
   fret, the answer is *play it*, the detector confirms the pitch. A modality, not a new engine.
3. **Accuracy checking** — pitch within ±N cents, held for ≥M ms; decide whether octave
   equivalence counts and whether the correct string matters. Needs attack detection so a slow
   fretting hand is not scored as a wrong note.
4. **Integration with practice** — it is just another answer source on note (later scale) items;
   the planner does not care which modality was used.
5. **Integration with mastery / progress** — same `outcome → mastery` path. Possibly track "can
   identify" and "can play" as two facets of one item.

### Risks and what to validate *before* committing this as a product feature

The `voice-must-work-in-background-noise` standard applies here in full: a noisy room is a normal
usage condition, not an invalid test.

- **Does monophonic pitch detection actually work on a phone mic** with the app's own note
  playback, a metronome, string/room noise, and people talking nearby? The speech path was
  repeatedly defeated by exactly this. Assume the same exposure until measured on a real device.
- **Latency** — must resolve fast enough to feel responsive (target < ~150 ms).
- **Octave errors** — low strings + cheap mics cause octave-doubling in autocorrelation; this is a
  classic failure mode.
- **Out-of-tune guitars** — detect absolute pitch or relative? Offer a tuner first?
- **Bends / slides / buzz / "played near it then corrected"** — how is that scored?
- **Electric vs acoustic vs classical**, pickup vs room mic.
- **Standalone-PWA microphone reliability** — the same `getUserMedia`-in-WebView caveats already
  logged for voice apply.

**Recommendation:** a **timeboxed throwaway spike** with a scratch detector and the existing
debug-log channel, measured on a real device in a real (noisy) room, ending in a written go/no-go.
Until that passes, guitar-audio is **not** a roadmap commitment — it is a question.

---

## 8. Game Modes as one system

Do not present Chords / Scales / Intervals / Staff / Triads as separate games. There are two axes:

- **Content** — what you are learning: note · interval · scale · triad · chord · staff pitch.
- **Practice form** — how you are drilled: identify-from-name · identify-from-position ·
  identify-from-sound · play-it (guitar-audio) · spell-it (list every tone/note) · read-it (staff).

A "mode" is a **(content, form) pair**:

| Example pair | What the user does |
|---|---|
| (note, read-it) | Sight-reading: a staff glyph → name / find the note |
| (scale, play-it) | "Play C major in this position" |
| (chord, identify-from-sound) | "Which chord is this?" |
| (interval, identify-from-position) | Two dots on the neck → name the interval |
| (triad, spell-it) | "Spell the notes of a D major triad" |

Every pair is: one `Item` + one generated `Question` + the **shared runner**. The Path and the
planner choose pairs by what the user needs, so a Premium user never has to pick a "mode" off a
menu — though one browsing freely could. This also sharpens the tier line: **Free/Pro only ever
touch (note, identify-\*) and (note, play-via-voice); every other content type is Premium.**

---

## 9. Build order (Premium roadmap)

Ordered so each stage is a correct foundation for the next and delivers user value as early as
possible — not "coolest feature first".

### P0 — Premium tier plumbing
- **Goal:** `premium` is a real entitlement the app can gate on.
- **User gets:** nothing visible.
- **Build:** `entitlements.tier` CHECK gains `'premium'`; `features.ts` `RANK.premium = 2`; the
  `Tier` type gains `'premium'`; extend `ProGate` (or add `PremiumGate`) to take a minimum tier;
  dev "simulate Premium" toggle; admin grant path (mirror `scripts/grant-pro.mts`).
- **Depends on:** the shipped Free/Pro layer (done).
- **Why first:** everything else needs a gate to hang on, and it is ~a day of work with zero
  product risk.

### P1 — Item / mastery generalisation (notes only)
- **Goal:** mastery + history are keyed by a generic item id, still only note items.
- **User gets:** nothing visible (perhaps a marginally better mastery overlay).
- **Build:** the `Item` type; nullable `HistoryEntry.domain` / `itemId` (back-compat: absent ⇒
  note, derived); `mastery.ts` keyed by item id; item ↔ `(string, fret)` adapters.
- **Depends on:** nothing hard; can run parallel to P0.
- **Why before P2:** the teacher's weakness detection and SRS must key on items, or they get
  rewritten the moment a second domain lands.

### P2 — The MVP Teacher (notes only) — *the first sellable Premium*
- **Goal:** the app tells you what to practise and you can do it in one tap.
- **User gets:** a "Practise my weak spots" action; one prescribed daily session; a dismissible
  "do this now" card beside the Selector; Leitner SRS pulling overdue notes back; adaptive
  difficulty inside generated sessions.
- **Build:** `weakness.ts` (derive from mastery / latency / SRS-due); `srs.ts` (Leitner per item);
  `planner.ts` (item set → `DrillConfig` with `candidates`); the Today card UI; daily-goal state
  (separate from the Free streak); wire planner output into `useDrillSession`; sync tables for SRS
  state + daily-goal log (RLS read-own, following the `0007` conventions).
- **Depends on:** P0 (gate), P1 (item keys).
- **Why before P3:** proves the entire "directed learning" promise with **no new content types and
  no audio** — lowest risk, highest proof of value. If this does not feel like a teacher, adding
  scales will not save it.

### P3 — Learning Path (notes + structure)
- **Goal:** a visible, multi-checkpoint journey alongside the Selector.
- **User gets:** a Path screen — checkpoints ("open-position naturals" → "first 5 frets, all
  strings" → …), each with a % mastered and the next step highlighted; the planner now respects
  Path position.
- **Build:** Path checkpoint data (clusters of items + goals — reuse the
  `StageGoal`/`StageTargets`/`evaluateStars` math from `src/game/`); Path progress state + sync;
  the Path screen; planner takes Path position as a weight.
- **Depends on:** P2.
- **Why before P4:** the teacher needs a spine to plan against before there are multiple domains to
  sequence.

### P4 — Second domain: intervals
- **Goal:** prove the shared engine takes a new content type with only a generator + matcher +
  renderer.
- **User gets:** interval training, woven into the Path and the daily session automatically.
- **Build:** interval `Item`s; a `Question` generator + answer matcher + prompt renderer for
  intervals; interval checkpoints on the Path. SRS / mastery / planner **unchanged**.
- **Depends on:** P1, P2, P3.
- **Why intervals first (not scales/chords):** the answer is still a tap on the note circle / fret
  grid — smallest new UI — so it validates the abstraction cheaply.

### P5 — Scales & triads
- Build on P4's proven pattern; new answer forms (spell-it; play-a-sequence if the audio spike
  passed).
- Scales half of this phase has a resolved design (`scales-learning-spec.md`) and **Slice 1
  (Minor Pentatonic) implementation is IN PROGRESS as of 2026-09-22**: the data layer, question
  picking, a new dedicated engine + "piano tiles" multi-string board (a genuinely new capability —
  the spec's original assumption that this could reuse the existing byFret/byNote flow turned out
  to be wrong, see the spec's "Session 1 progress" note), and a live gated entry point (`Learn` →
  `Scales`) are built and shipped. Still open: Selector controls, exercises B/C, SRS/mastery/
  progress board, daily/Teacher integration, cloud sync — see the spec's own status section for the
  ordered next-steps list. Triads are not covered there yet.

### P6 — Chords
- Needs triads; new answer UI for chord shapes.

### P7 — Staff reading
- Parallel-safe; could move earlier if prioritised. Needs a staff renderer.

### Spike (parallel, any time after P0) — guitar-audio pitch detection
- Timeboxed, throwaway, measured on a real noisy device. **Go/no-go before it becomes a
  commitment.** If go, it slots in as an answer modality starting with notes.

---

## 10. The Premium MVP

**P0 + P1 + P2.**

> If we build only the notes-only Teacher — weak-spot targeting, Leitner SRS review, one prescribed
> daily session, a dismissible "practise this now" card beside the Selector, and adaptive
> difficulty inside generated sessions — **we already have a Premium worth charging for.**

It adds **no new content domain, no audio, no new input modality**. It reuses `useDrillSession`,
`DrillConfig.candidates`, `mastery.ts`, `progress.ts`, `useHistory`, the entitlement layer and the
sync layer. The pitch writes itself: **"Pro gives you the tools. Premium is the coach that uses
them for you."**

---

## 11. What not to do yet

| Deferred | Why |
|---|---|
| **Guitar-audio as a committed feature** | Unproven on noisy hardware; a from-scratch DSP problem. Spike only, with a go/no-go. |
| **Chords and full staff reading** | Need new answer UIs (and, for played chords, polyphonic detection). Heavy content + UI for little extra proof once intervals validate the engine. |
| **Multi-domain skill radar / long-horizon planning / plateau detection** | Cannot be tuned well before watching real Premium users hit the first version. |
| **New instruments (ukulele, mandolin, violin)** | Orthogonal to the teacher — a Free/Pro breadth play. The mastery/badge layers already generalise per instrument. Do it when instrument demand is proven. |
| **Friends / per-friend challenges** | The public leaderboard already covers the social hook; no evidence of demand; does not serve the "teacher" promise. |
| **Interleaving / blocked-practice research features** | Need data. |
| **A "course" with lesson text / video** | Premium is adaptive *drilling*, not a content library. Writing a prose curriculum is a different product and a scope explosion. |

---

## 12. Dependencies on the existing system

The goal is to **not rebuild what exists**.

| Existing piece | How Premium uses it |
|---|---|
| **Selector** | Stays the home screen and the free-practice entry. Premium's Today card sits beside it. The planner emits the **same `DrillConfig`** the Selector produces (via `deriveDrillConfig`), so a planned session and a hand-picked one run through identical code. |
| **`DrillConfig` + `useDrillSession` + `SessionResult`** | The session runner, reused as-is. `candidates` is already the explicit-item-list seam. **No second engine.** |
| **`mastery.ts`** (`MasteryWindow`, `applyMasteryWindow`, `historyForInstrument`, `FREE_MASTERY_WINDOW`) | Re-key note → item; reuse the windowing/decay for weakness detection. |
| **`progress.ts`** (`weakNotes`, `dailyStats`, `practiceStreak`, `lifetimeTotals`) | `weakNotes` seeds weakness detection; `dailyStats` feeds the daily-goal marker. |
| **Stats & Progress screen** | Unchanged. Premium adds a Path screen (and later a skill view), it does not touch this one. |
| **scoring (`useScoring`)** | Unchanged. Per-session score/streak still feed `SessionResult` and goal/star evaluation. |
| **badges** | Unchanged, stays Free. Premium *goals* ≠ badges (prescriptive vs retrospective). Premium-only badges are a possible later addition, not MVP. |
| **voice answering** | An existing answer modality; the shared engine treats it as one input source. Guitar-audio would be a **new sibling** modality, not a change to voice. |
| **onboarding / placement** | Placement already seeds Selector difficulty; Premium extends the same result into an initial item-mastery estimate + first Path. **No second onboarding.** |
| **sync** (`sync.ts`, `settingsSync.ts`, `voiceSync.ts`, `badgeSync.ts`) | History/bests/settings/badges/voice already sync. New Premium state (SRS schedule, Path progress, skill model, daily-goal log) must be **syncable from day one** — new tables, RLS read-own, `0007`-style conventions. |
| **Free/Pro entitlement system** (`entitlements.tier`, `features.ts`, `ProGate`, `useEntitlement`, dev simulate toggle, grant script) | All extend to `premium` with a CHECK change + a `RANK` bump. **No new entitlement mechanism.** |
| **`src/game/`** (`World` / `Stage` / `StageTargets` / `evaluateStars` WIP) | The `StageGoal`/`StageTargets`/`evaluateStars` **threshold math is directly reusable** as Path checkpoint goals. The `World`/`Stage`/seed-worlds framing needs a product decision first — see §13. |
| **`stageSequence.ts`** (Auto Advance curriculum) | Stays a Free/Pro feature. It is a hand-ordered walk of Selector states; the Premium planner is a dynamic version. They could later share checkpoint data. Auto Advance is **not** the Path. |
| **i18n** (`src/i18n/`) | Every new string goes through `translations.ts`, Hebrew + RTL, as today. |

---

## 13. Open product questions

Not decided here — flagged for later, deliberately.

- **Premium price**, and its relationship to Pro. (Assume **Premium includes everything Pro has** —
  `RANK` makes that automatic — unless the owner says otherwise.)
- **Free trial of Premium** — length, and whether it needs the payment rail first (it does; the
  payment rail itself is still unbuilt — Free/Pro phase 7).
- ~~**One Premium subscription vs per-domain unlocks** (a "chords pack", a "reading pack").~~
  **Decided: one Premium subscription.** Premium stays a single tier that unlocks every learning
  domain; there are no per-domain unlocks. The current one-tier-per-user `entitlements` model is
  kept as-is — P4 (intervals) and every later domain gate on the existing `premium` tier, not on a
  new per-pack shape.
- **Ads in Free** — still open from the Free/Pro spec; unchanged here.
- **Which instruments beyond guitar and bass**, and whether any is Premium-only.
- **SRS algorithm** — Leitner vs SM-2 vs FSRS. Pick a simple one at P2; low stakes to change later
  because the schedule state is per-item.
- **If the guitar-audio spike passes, is playing-the-note Premium-only or also a Pro feature?**
- **Does the Learning Path adopt the `src/game/` `World`/`Stage` data model, or a fresh one?**
  Tied to the contradiction in §16.1.
- **Offline** — the planner and SRS must work fully offline (Free/Pro already do). Confirm the
  recommendation loop makes no server round-trip.

---

## 14. Success criteria per stage

Not "the code runs" — what the *user* can do and the value they get.

| Stage | The user can… |
|---|---|
| **P0** | *(internal)* An admin can grant `premium`; a dev toggle flips the app into Premium; a `premium`-gated control is locked for Pro, open for Premium. |
| **P1** | *(internal)* The mastery overlay and stats are **identical** before/after the item-key refactor (no regression); a note's mastery is retrievable by item id. |
| **P2** | Open the app after a few days of practice, tap **one** thing, and get a session built from their **actual** recent mistakes. The next day, the notes they missed **come back**. After a week they can point at specific notes that went from red to green **because the app kept feeding them** — and they never opened the Selector to make it happen. |
| **P3** | See where they are on a **named journey**, what the next checkpoint is, and what % of it they have mastered. Finishing a checkpoint visibly advances them. |
| **P4** | Practise intervals without being able to tell (as a user) that it was "bolted on" — same session feel, same progress surfaces — and have intervals show up in their weak spots and daily session **automatically**. |
| **Audio spike** | *(internal)* A written go/no-go backed by **real-device measurements in a noisy room**, not reasoning about the code. |

---

## 15. The product picture when Free, Pro and Premium are all done

**Free** is a real app. You can learn every note on a guitar or bass neck, race a timer, earn
badges, climb a public leaderboard, and keep your progress across devices — forever, for nothing.

**Pro** is for the player who knows what they want. Permanent history, a mastery view you can slice
any way, precise fret windows, big multi-string drills, a voice profile tuned to your accent — the
same self-directed practice, with the tools and the record to take it seriously.

**Premium** is a teacher. You stop deciding what to practise. It watches what you miss, gives you a
short session every day built from exactly that, brings weak spots back on a schedule, and walks
you along a path from single notes into intervals, scales, triads, chords and reading — and, if the
guitar-audio spike pays off, lets you answer by playing the guitar.

The Selector is at the centre the whole way through. Premium just means you no longer have to touch
it unless you want to.

---

## 16. Contradictions and issues found while writing this

Per the instruction to surface conflicts rather than assume past them.

### 16.1 `src/game/` (World / Stage / Stars) vs "do not bring back Stages"

There is an **active work-in-progress branch** building `src/game/` — `World` → `Stage` →
`StageTargets` → `evaluateStars`, with seed `worlds.ts` / `stages.ts`. Its own code comments frame
it as a *separate "Game" progression layer*, explicitly **not** unified with Practice's Auto
Advance, and note that "a World/Stage is never a React component" yet.

This overlaps with the retired Stage-navigation system in **name and shape** (worlds containing
ordered, individually-goaled stages), even though it is framed as a distinct layer. The product
owner's direction here is: no revived Stages; a guided journey must be a **Learning Path alongside
the Selector**.

**Two readings, and this needs an explicit decision — do not assume:**
- **Reading A:** `src/game/` *is* the Learning Path infrastructure, mis-named. Adopt its
  `StageGoal`/`evaluateStars` math for Path checkpoints, rename `World`/`Stage` → `Path`/`Checkpoint`,
  drop the "Game screen" framing, and make sure it renders *beside* the Selector.
- **Reading B:** `src/game/` is a separate "arcade/progression" concept the owner has not signed
  off on for Premium, and this plan's Learning Path should be modelled fresh (reusing only the
  threshold math).

Until this is decided, §9 P3 assumes only the **threshold math** (`StageGoal` / `StageTargets` /
`evaluateStars`) is reused, not the `World`/`Stage`/`GameProgress` framing.

### 16.2 `.kiro/steering/product.md` is stale

It still describes the app as an "~86 auto-generated stages" curriculum with stage progression,
chevron nav and custom stages — the **retired** model. It does not mention the Selector, Free/Pro,
bass, the leaderboard, badges, Hebrew/RTL or sync. It should be rewritten to the Selector reality
before it misleads planning. (Doc hygiene, not Premium scope — noted so it is not lost.)

### 16.3 Wishlist §6 lists Premium content as discrete "game modes"

`product-wishlist.md` §6 lists "new game modes: chords, scales, intervals, staff notation reading,
triads" as a flat feature list. This plan **reframes them as content types inside one engine** (§5,
§8). The §6 bullet should point here rather than imply five separate modes.

### 16.4 "Real pitch detection from the microphone" is listed flatly as a Premium feature

In the wishlist it sits in the Premium list with no qualification. It is actually an **unvalidated
from-scratch DSP problem** with a known-hard noise dimension (§7). It should be reclassified as a
**spike with a go/no-go**, not a committed roadmap item.

### 16.5 The background-noise standard applies to guitar-audio, and the wishlist does not say so

The team has already been burned by background noise defeating the *speech* path
(`voice-must-work-in-background-noise`). Monophonic pitch detection has the same exposure —
metronome, the app's own note playback, string noise, people talking. Any guitar-audio spike must
be measured in a real noisy room, and a quiet-room result must be reported as "noise behaviour
unmeasured", not "works".
