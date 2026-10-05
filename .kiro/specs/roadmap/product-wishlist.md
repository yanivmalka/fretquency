# Fretquency — Product Wishlist (Selector Model)

Consolidated from `wishlist-requirements.md` (original Stage-based roadmap) and `wishlist-requirements-v2.md` (Selector-model re-plan). Both source files are kept as-is and unmodified — this document is the clean, decision-ready synthesis.

**Ground rules applied here:**
- The Selector Panel (string + fret range + difficulty, chosen directly) is the confirmed current product direction.
- The old Stage navigation model (chevrons, progress bar, stage picker, custom-stage snapshots) is **not** revived anywhere in this document.
- No item from the old roadmap is assumed wanted just because it was written down — anything not clearly re-affirmed by the Selector-model re-plan is marked Unconfirmed rather than promoted or discarded.

---

## 0. What's Left — Open Items Summary (added 2026-09-14)

A compressed, priority-ordered view of everything in this document that is **not** done yet. Full context, reasoning, and implementation plans live in the sections below (§1–§7) — this section only points at them; it does not replace them. Re-derive this list from the sections below rather than trusting it blindly if it's been a while, since the sections are the source of truth and this summary can drift out of date.

### A. Voice — live product bugs, most urgent (full detail: §1)
- **Real drill-session log analysed 2026-09-15 (`SAMPLES_PER_LABEL` already raised to 4 at this point) — four separate findings, none fixed yet, all from one live 15-question round:**
  1. **A recognised as B, undetected by the self-test.** The self-test (post-fix) only flagged B/D and D/E, but this live round misheard A as B, and the calibration log for this same profile shows A's nearest calibration neighbour was B at distance 19.1 — a real, present confusion the self-test's pairwise check missed.
  2. **A fluent "F sharp" (no pause) comes out as "F" — IN PROGRESS, diagnosis corrected 2026-09-15, next step is an offline test.** Reproduced: with a pause 11/11 F# correct across two rounds; without a pause 4/9, then 2/5 after a first fix attempt. The original reading above (`segments:1` = accidental never isolated) was wrong — the split hypothesis always runs. The real mechanism is that "ef" + "sharp" merge through the f/sh fricatives, any cut leaves a letter half that sounds like "E", and **E + "#" is normalised to F** (`SHARP_WRAP`), so it looks like a dropped sharp. A matcher-chosen cut was tried and did not help (uncommitted, see §1). **Offline comparison run 2026-09-15:** a "hybrid" (the shipped cut decides, except when whole-utterance matching against concatenated letter+accidental templates, with the ratio gate, reads an accidental) took sharps from 2 to 13 correct of 30, with wrong answers down from 15 to 9 and naturals unchanged. **Next: build the hybrid and verify it live** — the offline set also favoured attempt 1, which failed live. Numbers and caveats in §1, item 2.
  3. **A correct label can score worse than every wrong candidate.** One question whose correct answer was C matched with C ranked *worst* of all seven letters (`d:33.8`, furthest of the group) — the winning wrong guess (F) was nearly 10 points closer. Suggests either inconsistent C calibration takes or an unusually-shaped utterance that the current template set doesn't cover.
  4. **Frequent multi-attempt captures before any answer (or none at all) — PRODUCT OWNER'S TOP PRIORITY as of 2026-09-15 ("I have to shout", "I repeat myself again and again"), ahead of item 2.** One cause found and fixed 2026-09-15 (noise floor learned from the speaker's own repeated answer → deaf for 4s); a second cause (a short trailing fragment rejects a clear letter) found, not fixed, trade-off open. **Normal round with the fix read 2026-09-15:** 15/15 answered, 3 retries, no onset timeouts — cause A looks fixed. Cause B still split (1 helped / 1 would have been wrong); a margin-gated variant proposed. Two new capture-side bugs found and **fixed (not yet verified live)**: the concat override answered when the segmented path rejected, and a lone transient could be accepted as a letter. **Cause B deferred** by the product owner — options (a) plain rule / (b) margin-gated / (c) leave as is, recorded in §1 item 4. **Four noisy-room rounds read later the same day** (transient rule tightened to 2× gate and confirmed; `[voice] vad` now logs level stats; `[voice] timed out` logs the correct note). Endpointing turned out not to be the main noisy-room failure; segmentation is — room noise is cut as a "second word". A concat fallback for rejected captures was proposed and then **refuted** by the round with known truth. **Two candidates left, neither built, both need the product owner's go-ahead:** (1) cause B widened — answer the segmented letter when the second segment fails the accidental cap and the letter ratio is ≤ 0.85 (4 right / 0 wrong in the logs); (2) lower the accidental cap from 25 to ~22.5 (4 wrong answers today came from noise scoring 23.2–24.4; every correct accidental ≤ 22.2). **Next session: decide (1) and (2), build, then one noisy-room round and one quiet round to confirm neither costs correct answers.** Full evidence and steps in §1, item 4.

  Session totals: 13 of 15 questions got a scored answer at all; of those, 9/13 (69%) were correct. Full log and root-cause reasoning for each point sit in §1 under "Live drill-session findings, 2026-09-15."
- **Remove the "General" bundled model + "Auto" engine preference, personal profile only — requested 2026-09-14, blocked on a product decision.** Removing General with no other change strips Free-tier users of any working on-device voice path (they're on the General fallback today, since personal calibration is Pro-gated). Needs the product owner to pick what Free gets instead before any code changes; full map of what to touch is in §1.
- **B/D extra-takes-per-pair feature built and measured 2026-09-14 — works.** Personal leave-one-out: 0/4 correct at the 2-takes/label baseline → 11/16 (69%) after using the new "record N more" button to bring B and D to 8 takes each. Recommendation: let this product feature run with real users before spending effort on the acoustic-feature candidates (F2 slope, etc.) — see §1 item 5 for the full numbers and caveats.
- **Voice recogniser measured in a quiet room (2026-09-14): 5/10 spoken naturally, 8/10 with a short pause before "sharp"/"flat".** No code change between the two. The background-noise run of the verification protocol is still outstanding.
- **Nothing tells the user to pause between the letter and "sharp"/"flat"** — the pause alone took accidentals from 0/4 to 2/4. Add a short hint to the calibration screen and the 🎤 answer-mode hint (Hebrew copy included).
- **B and D are close in one session** — the cause of both remaining quiet-room failures. The proposed onset tie-break was **measured on real recordings (2026-09-14) and made B/D worse**; not built. The same recordings show C/E/G, not B/D, as the worst letters. Open, no validated direction. Recommended next step (2026-09-14): build a fixed multi-session test set before trying anything more; further ideas 6–11 (solfège labels, abstaining on close calls, learned frame weights, k-NN, augmentation, delta features) are listed in §1.
- **VAD breaks with background noise/talking.** `captureUtterance` gates onset/silence off a noise floor sampled before speech starts, so continuous room noise defeats both ends of capture. Fix direction: endpoint against the utterance's own peak, not a pre-sampled floor.
- **"Personal" engine silently falls back with no UI signal** when the profile isn't ready — Settings should show which recogniser is actually active.
- **"By note" mode can't be answered by voice at all** — needs a fret vocabulary for the template engines (currently only note names are recognized).
- **Personal voice profile never runs inside the Android app** — `getSpeechEngine()` short-circuits to the native engine before consulting the user's engine preference; needs `getUserMedia` verified inside the Capacitor WebView first.

### B. Finish the current product (full detail: §2, §3)
- **Badge art + earn-animation redesign** — direction agreed, **blocked on art assets** (Gemini-rendered PNGs per badge family × tier × face).
- **Adaptive timer** (tightens/relaxes with streak) — not built.
- **Audio refinements B1/B2** — escalating streak tone (`playStreakTone`) and the background-beats toggle — not built. (B3 Silent Mode is done.)
- **Practice schedule / reminders** (local notification, streak nudge) — not built.
- **More UI languages** — requested 2026-09-25; order Spanish → Portuguese (Brazil) → German/French/Italian/Japanese (German needs an H-notation mode). **Spanish, Portuguese (Brazil), French and Italian stage 1 landed 2026-09-25, and stage 2a (badges, guest merge, voice calibration, feedback board, Quick Access, Tuner) and stage 2b (the Premium Learn areas) the same day — every screen now has a translation in all four**; the privacy page, spoken answers in those languages, native-speaker reviews and the other languages are open — detail in §3 OPEN (continued).

### C. Approved by the product owner, not yet built (full detail: §4, §6)
- **Saved/named Selector presets** — approved as a lightweight bookmark feature (also folds in "quick-switch recent combos"); not built.
- **Chromatic tuner** — approved as a free tool for everyone, also serves as the go/no-go pitch-detection spike for Premium; not built. Needs real noisy-room measurement before the DSP is trusted.
- **Recency model: exponential time-decay** for weakness/mastery statistics (14-day half-life, 180-day cap, continuous per-position score) — approved 2026-09-08, not built. Scoped to `weakness.ts` and `intervalWeakness.ts`/`intervalMastery.ts` first; `pathProgress.ts` deliberately deferred.
- **Left-handed mode needs a real device visual QA pass** — built, but the SVG-neck text counter-flip, the Pro fret-range slider under mirroring, and drawer RTL flips were never verified on a device.
- **Premium Teacher: reclassify "consolidation" vs "overdue" + reword Today card** — approved 2026-09-08, not built.
- **Premium Teacher: `useLearning` perf refactor** (stop rebuilding both full plans every answer/60s tick) — real fix identified, not built (not urgent — card is unmounted during a session).
- **Intervals (P4) follow-ups** — no Learning Path checkpoints yet, no adaptive difficulty, SRS granularity is quality-only/ascending-only.
- **Scales (P5, scales half) — Slice 1 (Minor Pentatonic) implementation started 2026-09-22, not finished.** Design fully resolved in `scales-learning-spec.md`. Built and shipped: the data layer (`src/utils/scales.ts`, `src/learning/scaleItem.ts`), all three exercises' question picking (`src/learning/scaleDrill.ts`), a dedicated engine + "piano tiles" multi-string board for Exercise A (`src/hooks/useScaleDrillEngine.ts`, `src/components/ScaleShapeBoard.tsx` — a genuinely new capability, not a reuse of the existing byFret/byNote flow as the spec first assumed; see the spec's "Session 1 progress" section for why), a second dedicated engine for Exercises B/C reusing the Intervals chip row (`src/hooks/useScaleChipEngine.ts`, `IntervalChoiceRow.tsx`), and a live Premium-gated entry point (`Learn` → `Scales` → `ScalePracticeScreen`, now with a minimal 3-way exercise switcher). A pre-existing RTL bug (the neck board physically mirrored under Hebrew, unlike the main fretboard) was found and fixed in the same session — see the spec's "Session 2 progress". **Not built yet, in priority order:** the real Selector controls (scale-type/position/difficulty pickers — the exercise switcher is a stand-in, not the full §5 picker), SRS/weakness/mastery, the progress board, Daily/Teacher integration, cloud sync, then scale type 2 (Major Pentatonic) as a near-pure-data addition. Full ordered next-steps list lives in `scales-learning-spec.md`'s status section — **read it in full before continuing this**, per that document's own instruction.
  - **Update 2026-09-24:** Exercise A is now full-screen Piano Tiles (spec's "Session 5 correction"). **Deferred from that pass, not built:** keeping the screen awake (Wake Lock) during a run; long/held tiles and chords-in-one-row patterns like later Piano Tiles games; a visual reward for a scale played with no mistakes, beyond the chime; a pause/resume control (today the only control is Exit). **Awaiting product-owner decision:** whether the run should start at the tonic instead of the lowest note of the box.
  - **Update 2026-09-25:** cloud sync of `scaleSrs` / `scaleHistory` is now wired (spec §15's cloud half): the Scales screen pushes the learning blob after every answer and re-reads on `learning-synced` — done alongside Staff reading's cloud backup, see `supabase/migrations/0017_*`.
  - **Update 2026-10-01:** the home screen is simplified for a new learner (spec's "Session 9") — new-install defaults now land on Minor Pentatonic, Box 1, "Tap the scale in order" in its demo-first learning mode, and every other control is tucked behind a closed-by-default "More options" disclosure. A new "Meet the scale" full-screen view (`ScaleMeetScreen.tsx`/`ScaleMeetBoard.tsx`) shows the whole neck with every scale tone labelled by its degree, a root picker, the existing blurb, and a play button, reached before practicing. **Deferred, not built this pass:** a dedicated explanation of how Box 1 and Box 2 relate/overlap on the neck — "Meet the scale" shows one box's degrees across the whole neck, which isn't the same thing as explaining how the two authored boxes connect (Session 8's "Connect the boxes" exercise is a drill for that gap, not an explanation of it).
  - **Update 2026-10-02 — expert-teacher review: the 4 priority tasks.** A review of the Scales area as a guitar teacher would teach a beginner found the strengths (answer-by-playing, per-box SRS, Watch-then-play modelling, degree labels, tonic-to-tonic runs, ear identification, Connect the boxes) and four gaps worth building next, each handed to its own session on 2026-10-02. All four touch `ScalePracticeScreen.tsx` / `useScaleSelector.ts` / the translation dictionaries at the same time — keep changes additive, commit only your own hunks, `git pull --rebase` before pushing. Every task: read `scales-learning-spec.md` in full first, add a dated session note there when done, new strings in he/es/pt-BR/fr/it, CSS in `30-scale-board.css`, neck boards lowest string on top + `dir="ltr"`, live browser check in English and Hebrew with `devSimulateTier='premium'`.
    - **A. Recall mode — play the box from memory (highest priority).** Today every exercise shows the box lit, so the learner *recognises* the shape rather than *recalls* it. Plan: a `fadeLevel` pick (0 = all lit, 1 = only the tonic lit, 2 = empty neck) in `useScaleSelector` (`ssel_order_recall`, cloud-synced with the other `ssel_*` picks); `buildOrderBoard` / `ScaleOrderBoard` render shape tiles in the dim state per level (a dim shape tile still answers its step); optional auto-promotion to the next level after N clean runs of that item (derived from `scaleHistory`); a new history form `orderRecall` (`learningState.ts` type + `normalizeScaleHistory`). Works with the guitar answer mode too. Covered by a new `scripts/check-scale-recall.mts`. **Shipped 2026-10-02** (spec "Session 10 — task A"); auto level-up is off by default (3 good runs in a row, counted since the level was set). **Still open:** recall on "Connect the boxes" and "Build the scale"; the guitar answer mode on a faded board not yet tried with a real/simulated mic; level is one global pick, not per item.
    - **B. Metronome + gradual tempo, judged from the guitar.** Piano Tiles and timers train reaction speed, not playing in time; the standard method is slow and steady with a click, raising the tempo only after a clean pass. Plan: a new `src/utils/metronome.ts` (Web Audio look-ahead scheduler, accented first beat); a BPM control (40–160) on "Tap the scale in order"; each note `usePitchStream` hears is judged against the nearest beat (within ±⅙ beat = on time, else early/late), shown live and summarised per run; +4 BPM after a clean run, stored per scale/box. The click (like the app's own playback) must never be heard as an answer. The timing judgement is pure logic with its own check script.
    - **C. A guided beginner path, with the relative major/minor "aha".** 22 scale types is far too many for a beginner to choose from. Plan: `src/learning/scaleCurriculum.ts` — an ordered list of steps (scale type + box + exercise + a pass condition read from SRS/mastery): Minor Pentatonic Box 1 → Box 2 → Connect the boxes → Major Pentatonic taught as *the same box with a different home note* → Blues → Major / Natural Minor. A "Path" card at the top of the Practice tab shows the next step and unlocks steps in order; it does not replace "More options". A dedicated explanation step on `ScaleMeetBoard` marks both tonics (e.g. A minor pentatonic / C major pentatonic share one shape). Progress is derived from `scaleSrs` / `scaleHistory` — no new persistence field if avoidable.
    - **D. Fingering on the box.** No screen says which finger plays each note, so beginners build bad habits early. Plan: research the standard fingerings first (one finger per fret, pentatonic box conventions, where the stretch goes in a 5-fret window) — do not invent them; a pure `fingeringFor(shape, window)` in `scales.ts`; a "Show fingers" toggle (`ssel_fingers`); finger numbers drawn on `ScaleMeetBoard` (inside the box) and `ScaleOrderBoard`. A check script asserts every shipped box gets only fingers 1–4, non-decreasing with the fret on each string.
    - **Deferred from the same review, not assigned:** a drone / backing chord loop on the tonic plus a free-improvisation mode that listens and shows in-scale vs out-of-scale notes with no right/wrong; sequences (groups of 3/4, thirds) as Direction options; short licks built from the box.
  - **Update 2026-10-03 — teacher ↔ first-time-beginner dialogue: new ideas beyond A–D.** An ideation pass (no code), run after A–D shipped. The review was written as a role-play between a guitar teacher with 30 years of in-person teaching and a complete beginner who doesn't know what a scale is. A single expert review sees the app the way a teacher does. The beginner's questions show where a real first-time user gets stuck. The most revealing exchanges, trimmed:
    > **Beginner:** I opened Scales and it says "Minor Pentatonic, Box 1". I don't know what either word means. What's a box? Is "1" a finger? A fret?
    > **Teacher:** In a lesson I'd never say "box" in the first ten minutes. I'd say: "put your first finger here." The words come after the hand knows the place.
    > **Beginner:** The app also says "degree 3" and "root". If I don't understand the word on the first screen, I close it.
    > *(…)*
    > **Teacher:** Before any scale, I check whether you can press one note so it rings. Thumb behind the neck, fingertip just behind the fret wire, not on top of it. Half my beginners spend week one on that. If they skip it they buzz for months, and later they blame the scale.
    > **Beginner:** The app took my note, so I thought it was fine. It sounded kind of dead, but the app said ✓.
    > **Teacher:** That's the gap. The app hears *which* note, not *how* it sounded. In person, the first thing I listen for is a choked note: the finger is too flat and touches the next string, or the finger lifts before the note has rung. A pitch detector reads a buzzing A as an A.
    > *(…)*
    > **Beginner:** Why does it matter which finger? I can play it all with one finger, it's easier.
    > **Teacher:** It's easier today. At a real tempo, one finger can't get there in time, and unlearning that habit takes months. The finger numbers on the box are right (task D). But I'd start with one string and four fingers, 5-6-7-8, before any shape.
    > **Beginner:** So there's something to do *before* the first step of the path?
    > *(…)*
    > **Beginner:** I played the whole box up and down. It said "clean run". But I don't know if it *sounded* right. It's just notes. Is this music?
    > **Teacher:** That's why I never play a scale alone. I hold an A chord or a low A under the student. Then the home note sounds like home, and the 7th wants to go somewhere. Without that, a scale is a typing exercise.
    > **Beginner:** And when do I play something that sounds like a song? If it's only up and down for two weeks, I quit.
    > **Teacher:** In a lesson, from day two: I play three notes, you play them back. That builds the ear and the shape together. Then a small lick, then you make up your own over my chord. The scale is the vocabulary. Sentences have to come early, or you lose the student.
    > *(…)*
    > **Teacher:** Your picking hand. Down, up, down, up, from the first lesson. Not all downstrokes.
    > **Beginner:** The app never said anything about my right hand. I didn't know there was a rule.
    > **Teacher:** The app can't see it, but it can still *say* it. And with the click on, two notes per click forces alternate picking anyway.
    > *(…)*
    > **Beginner:** Once I can play it from memory, what next? Faster forever?
    > **Teacher:** Speed is the least of it. Next comes groups of three and four, and thirds. Then you know each note's neighbour, not only the whole line. But only after the box is solid. Sequences on a shaky box just confuse.
    > **Beginner:** Every time I open it, I don't know what to do for the next ten minutes.
    > **Teacher:** I give every student a routine: warm-up, review, today's new thing, then play. Five to fifteen minutes.

    **What the dialogue showed that A–D don't cover.** A–D teach the *shape* (recall, fingers, path) and *time* (metronome). Nothing teaches or checks: the beginner's vocabulary; whether a note *rang*; what the scale *sounds like* against a home note; the picking hand; making music with the box. The suggestions below are ordered by the gap each closes for a first-time user, weighed against cost.

    1. **Plain words, in place (cheap; the beginner's first give-up point).** "Box", "root", "degree", the string numbers and "fret" each get a tappable ⓘ. Tapping it gives one sentence and, where it applies, highlights the thing on the board (the root tiles, box 1's frets, string 6). It goes on the Path card, the current-pick card, `ScaleMeetScreen` and the order-run banner. *Build:* a small `ScaleTermHint` component + a `scaleTerms.ts` map (term → sentence + optional highlight set); `ScaleMeetBoard`/`ScaleOrderBoard` already take highlight-style props (`box`, `secondRootName`), so mostly reuse. Strings in all six languages. No logic or persistence.
    2. **A step 0 before the path: "One string, four fingers" + "Make it ring".** This is the teacher's never-skip. A short illustrated card (thumb behind the neck, fingertip just behind the fret, arch the finger), then a run of frets 5-6-7-8 on one string with fingers 1-2-3-4, up and down, then on the next string. *Build:* a new first `SCALE_PATH` step in `scaleCurriculum.ts`. The run is a synthetic one-string `ScalePositionDef` (the same trick as `RELATIVE_BOX_INDEX` / connect's `0`: a reserved position index) fed to `useScaleOrderEngine`. Fingers come from `fingeringFor` unchanged (one finger per fret is exactly its rule). The illustration is static SVG/CSS. It reuses Watch-then-play, the guitar answer mode and the metronome as-is.
    3. **"Did it ring?" — a clean-note check (the biggest gap; spike first).** Today any reading of the right pitch counts, including a buzzing, choked or cut-short note. Measure, per heard note, how long it holds above the noise floor and the detector's `clarity` while it rings. `detectPitch` already returns `clarity`, and `usePitchStream` already has the RMS and onset machinery. Flag a note as "short" or "unclear" and, in a slow "Clean notes" option of "Tap the scale in order", require each note to ring ~0.5 s before the next counts. *Build:* pure `src/utils/noteQuality.ts` (decay and clarity over the note's frames) + a check script with synthetic clean, damped and noisy plucks. `usePitchStream` gets an additive `quality` callback. **Spike on a real guitar first**, like `src/pitchSpike/README.md`: whether fret buzz measurably lowers clarity is unproven. Shorter sustain (a choked or lifted note) is very likely measurable. Ship only the signal that survives the spike, and never mark a note wrong on it at first, only show it.
    4. **Call and response by ear — "I play, you play it back" (new exercise).** The teacher's day-two method. It ties sound to shape and gives the first taste of music. The app plays a 2–4-note fragment from the current box, mostly stepwise and starting on the root, and the learner plays it back (guitar) or taps it. The fragment grows after clean answers. *Build:* pure `src/learning/scaleEcho.ts` (fragment generator over the box's run, weighted by `scaleSrs`); playback via `playNoteSequence`; judging reuses `useScaleOrderEngine`, with the fragment as the run and the board optionally dim (reuse Recall's `lit` set). New history form `echo` in `learningState.ts` + `normalizeScaleHistory`, same item id as the box. This is also the natural home of the deferred "short licks": a lick is a fixed fragment (item 7). **Built 2026-10-03** (spec "Session 11 — I play, you play it back") as a sixth exercise, "Play it back by ear": phrases of 2–4 notes from the root, by ear only, played back on the guitar or tapped, with an all-lit / root-only board. Playback is per note (`playNoteSingle`), not `playNoteSequence` (one string only). An `echo` row does not review the box in `scaleSrs` and does not count toward its mastery, so ear practice alone never passes a path step (owner to confirm). **Still open:** a real-guitar / Android check; rhythm in the phrase; phrases past 4 notes; a path step / Daily slot. Licks: built as item 7.
    5. **The drone, deepened (deferred item, now in two stages).** *Stage 1 (no mic, cheap):* a "Home note" toggle that holds a low tonic, or tonic + fifth, under Watch-then-play, tap answering and "Meet the scale". Then the 1 sounds like home and the learner hears each degree against it. *Build:* `src/utils/drone.ts` on `getAudioContext()` (looped sample or two soft oscillators, Silent mode respected). *Stage 2 (with the guitar answer mode, needs a spike):* today `usePitchStream` reads nothing while `isSoundPlaying()` is true, and the drone would sit in the guitar's band, so task B's low-pass trick doesn't apply. Options: play the drone an octave below the box and ignore readings of the drone's own pitch class in that octave, or require headphones in this mode. Decide after a spike. *Then free play:* a no-right/wrong mode on `ScaleMeetBoard` with the drone on, where each heard note lights its degree, an out-of-scale note flashes neutral (not red), plus a soft goal: "end your phrase on 1". It depends on stage 2.
    6. **Sequences (deferred item, deepened): a ladder after Recall, not a Direction option.** Groups of 3, groups of 4, thirds, each up and down. Unlock per box only once that box is mastered at Recall level ≥ 1 (the teacher: "sequences on a shaky box just confuse"). *Build:* pure `sequenceRun(run, pattern)` producing a new step order from the existing run; `useScaleOrderEngine` takes it as an alternate run (the board already numbers steps, so the learner sees 1-2-3, 2-3-4…). It works with the metronome and fingers unchanged. A path step after "Connect the boxes". History as `orderScale` with a `pattern` field, or a new form.
    7. **Short licks per box (deferred item, built on item 4).** 3–5 standard licks per beginner box (minor pentatonic / blues first), stored as box-relative steps, demoed then played back with the echo engine. *Build:* authored `src/learning/scaleLicks.ts`. **Research standard beginner licks before writing any** (the "don't invent" rule task D followed). It reuses item 4's engine entirely. **Built 2026-10-03** (spec "Session 11 — short licks per box"): a "Short phrases / Licks" pick on the "Play it back by ear" card. Four researched licks (12bar.de ×3, guitarchalk.com ×1), stored as (string, degree) steps, on Minor Pentatonic and Blues box 1 (the box rooted on the 6th string, so box 2 on a 7-string; guitar only). Each lick is shown lit as it plays, then played back twice in one key, recorded as `echo` rows. Bends are left out and the screen says so. **Still open:** bends/slides (needs a real-guitar spike), rhythm (the triplet feel), licks for other boxes and scales, a 🎸 real-guitar check, per-lick progress beyond the session.
    8. **The picking hand: say it, and make the click enforce it.** **Shipped 2026-10-03** (scales-learning-spec, Session 11 "the picking hand"): ↓/↑ on every tile beside the finger dot ("Pick strokes", on by default), and "Notes per click: 1 / 2" on the Metronome card, judged on the half-beats. Still open: checking that the down strokes land on the clicks. A ↓↑ stroke mark per step on `ScaleOrderBoard` (alternate picking from the first note, shown with the finger dot), and a metronome subdivision option: 2 notes per click. That forces even alternate picking without the app ever seeing the hand. *Build:* pure `pickStrokes(run)` (alternate by default); the subdivision is a `scaleTiming.ts` change (judge against half-beats) + one `metronome.ts` option. On screen, say plainly that the app can't check the stroke direction.
    9. **A 10-minute routine (glue, last).** A "Today" plan on the Scales tab that strings the pieces together: warm-up (step 0's four fingers) → review (the SRS-due box from memory) → today's new thing (the next path step or a sequence) → play (echo, or free play over the drone). *Build:* pure planner over `scaleSrs` / `scalePathProgress`, launching existing engines in order. It fits the existing Daily/Teacher integration (spec §13/§14). It only makes sense once 2, 4 and 5 exist.

    **Deliberately left out:** posture or hand-position checks by camera (not worth the cost or the privacy questions on a phone); pressure / sharp-note detection from cents deviation (too subtle and too dependent on the instrument to trust); any new scale types (the beginner's problem is depth, not breadth).
- **Staff reading — Slices 1 and 2 shipped 2026-09-25.** Design and status in `staff-reading-spec.md`. Built: a Premium `Learn` → `Staff reading` screen with four exercises (name the written note / find it on the neck / where is it written — a place on the neck is marked / read a four-note phrase), four fret ranges (0–3, 0–5, 0–12, 12–last fret), key signatures up to four sharps/flats, the key's notes only or every note, the right clef per instrument, a Progress tab (every note of the range on the staff, coloured by status), its own SRS lane and daily goal (`staffSrs` / `staffHistory` / `staffDaily`, also a card on the Daily practice page), all backed up to the cloud with the learning blob. **Still open (spec §11):** rhythm in phrases; an 8va line for the top frets; longer phrases and keys beyond four signs; a planned Teacher session with a "why these?" list.
  - **Update 2026-10-01:** "Name the note" and "Read a phrase" can now be answered by playing the guitar instead of naming it (spec §11 item 2) — an Answer mode card per screen, `useReadingEngine.hear` + `usePitchStream`, same shape as Scales' "Tap the scale in order." The octave must match exactly here (unlike Scales/Tab), since the staff is testing the written pitch, octave included.
- **Tab reading — Slices 1 and 2 shipped 2026-09-25.** Design and status in `tab-reading-spec.md`. Built: a Premium `Learn` → `Tab reading` screen with four exercises (name the note a tab number plays / find that exact place on the neck / write a marked place in tab / read a five-note riff), the four Staff reading fret ranges, natural notes only or every note, a Progress tab (every position on a neck grid, coloured by status), its own SRS lane and daily goal (`tabSrs` / `tabHistory` / `tabDaily`, also a card on the Daily practice page), cloud backup with the learning blob. The tab is drawn with the thinnest string on top like real tabs (owner-approved), the neck boards keep the app's layout. **Slice 2 (spec §13):** a Topic switch with Chords (name the chord a column spells / play it on the neck; shapes found in each instrument's own tuning — open, barre and power chords on guitar, root-anywhere shapes on ukulele, power chords on bass) and Techniques (what a symbol means / the note heard at its end, for h, p, / and \, b, ~, x, PM), with a strum and a pitch glide for slides and bends. **Still open (spec §12):** mandolin tab shows eight lines instead of four (the app models eight separate strings; chords are withheld on mandolin until courses are modelled); more chord kinds (maj7, m7, sus, slash) and symbols (release bend, harmonics, tapping); rhythm; a planned Teacher session with a "why these?" list.
  - **Update 2026-10-01:** "Name the note" and "Read a riff" can now be answered by playing the guitar instead of naming it (spec §12 item 5), same shape as Staff reading. A played pitch can't say which string it came from, so this covers only the name-judged exercises, not `findOnNeck`/`writeTab`; the octave is folded (same as Scales), not strict (unlike Staff), since a tab item is a place, not a tested pitch.

### D. Fully open decisions (no direction yet)
- **Pro price and trial length** — blocks building the payment rail (phase 7, RevenueCat expected).
- **Ads in Free** — undecided; current build has none.
- Longer-horizon, explicitly parked/low-priority: named expertise tests, dedicated admin dashboard, public user profiles, a real social/friends layer, iOS port — see §4 for each item's product-decision note. (Additional string instruments — ukulele/mandolin/banjo — have since shipped, gated `pro` via `extraInstruments`; see §4's Built & Shipped note.)

### E. Parked
- **The Game layer (worlds / stages, `src/game/`) — disconnected from the app 2026-10-01 at the product owner's request ("not relevant now").** It was dev/admin-only. Unhooked: the Learn hub's Game tile (`LearnHub.tsx`), the full-screen `<GameFlow>` takeover in `App.tsx`, `gameOpen` / `gameBackRef` in `useAppNavigation` and the Back ladder (`useBackNavigation`), and the `gameProgress` cloud sync effect in `useCloudSync`. Everything under `src/game/`, `src/utils/gameProgress.ts` / `gameSync.ts`, the `check-game-*` scripts and the `user_game_progress` table are left in place, so bringing it back is re-adding those four hooks. Still used elsewhere and **not** Game-only: `src/game/stageResult.ts` + `models.ts` (Learning Path threshold math) and `src/game/useDrillHistorySink.ts` (the Practice interval drill's history sink).

---

## 1. Fix Now
Bugs or behavior the product already promises but doesn't deliver.

### OPEN — Voice & Recognition

- **The current voice recogniser is live but not verified.** Seven commits landed on `main` (`d107cfb` … `279eb6e`) and deployed. The measured result — 9 of 9 recognition on the personal profile, up from 1 of 9 — was taken on `dae4b6c`. `c996e17` then changed which audio is handed to the forced split (segment 0 rather than the whole capture, because the old form was a no-op whenever the segmenter already returned two segments), and that also changes the single-segment path the 9-of-9 run exercised. **The shipped behaviour is therefore unmeasured.** No user impact was taken from the forced re-calibration this work required (IndexedDB v5 plus the `-v5` vocab suffix drop every stored template) because there were no users at the time.

  **MEASURED 2026-09-14 — run 1 (quiet room) is done; run 2 (background noise) is still outstanding.** Freshly calibrated profile (nine labels × two takes), `engine: "profile"` confirmed on every turn, `noiseFloor` 0.0001–0.0018 throughout, web build. The ten protocol words were said under two speaking styles, with no code change between them:

  | Speaking style | Total | Accidentals | Letters |
  |---|---|---|---|
  | Natural, no deliberate pause | **5/10** | **0/4** | 5/6 |
  | Steady mic distance + a short deliberate pause between letter and accidental | **8/10** | **2/4** | 6/6 |

  So the shipped recogniser is not the 9-of-9 engine the `dae4b6c` measurement suggested, but it is not broken either: with clean, separated input it is strong, and what remains has two identified causes, each its own item below — **"Accidentals need the speaker to pause"** and **"B and D are the one confusable letter pair"**. The debt `c996e17` left is cleared: the forced-split path is not what breaks accidentals.

  **Tried and reverted the same day — biasing the forced-split cut point by template length.** The hypothesis was that the forced split, which cuts a merged "F sharp" at the quietest frame anywhere in the middle 60% of the run, lands on an arbitrary energy dip rather than the word boundary; since "sharp"/"flat" templates run markedly longer than letter templates, the search was centred on the letter's expected share instead (`splitAt` = median letter frames ÷ (median letter + median accidental frames), which came out **0.39** for this profile, searched ±12%). It did not help, and the split hypothesis was taken *less* often (2 of 13 turns, against 4 of 11 on the baseline), because a cut forced near 0.39 yields worse halves whenever the real boundary is elsewhere. That run was also confounded by the speaker's input level varying about 10× within it (`peak` 0.025 → 0.34). The change was reverted before commit, and the 8-of-10 run afterwards showed the cut point was never the lever — separated input and the B/D pair are.

  ### Verification protocol — two runs, one sitting

  Both runs are the same setup: hard-refresh, 🐞 → **Simulate Pro** → **Voice: on** → **Clear**, answer mode 🎤, "by fret" mode, engine **Personal** with a completed calibration (all nine labels at two takes — an incomplete one silently falls back to another engine, see the item below). Confirm the log's `start` line says `engine: "profile"` before trusting anything. Say the ten words regardless of what the correct answer is, then 🐞 → **Copy**:

  **D, E, A, B, B♭, B♭, F#, F#, C, G**

  1. **Quiet room** — **DONE 2026-09-14, see the measured result above.** Clears the debt `c996e17` left. Expect the letters at distances of roughly 10–20; `usedSplit: true` on the fluent "F sharp" utterances with no second attempt; `taken: false` on every single letter (a single letter being dragged into a split would show up immediately as `taken: true` on a C or G row). "B♭" has never once been measured — watch `accidentals` for whether `b` beats `#` and by how much, and read the `note` field rather than the score, since A# and B♭ are the same note.
  2. **With the same background noise that produced the 3-of-10 run** — this is the one that matters. Read `[voice] vad`: how many rows say `reason: "cap"`, and what `peakOverGate` is on them. A low ratio confirms the mechanism below and sets the fraction for the relative-endpoint fix.

- **Voice answering collapses when anyone else is talking in the room.** This is a requirement, not an edge case: "אני לא יכול לצפות שאדם לא יוכל להשתמש בהקלטה רק כי מישהו מדבר לידו." A session recorded with people talking nearby scored **3 of 10** on the personal profile, against 9 of 9 for the same profile and the same speaker minutes earlier in a quiet room.

  The failure is in `captureUtterance` (`src/utils/utteranceCapture.ts`), not in the matcher. It learns a noise floor from roughly the first 200ms *before* speech starts, derives one gate from it (`max(0.012, noiseFloor * 3.5)` for onset, `max(0.010, noiseFloor * 2.5)` for the trailing-silence test), and uses that for the whole utterance. With continuous speech in the room that single sample is contaminated, and the recording fails in both directions at once:

  - **The end is never detected.** Three captures ran to the 3500ms `maxSpeechMs` hard cap where a quiet room produces 850–1300ms. The segmenter was then handed 1040ms and 1540ms "letters" against the 280–440ms a spoken letter actually takes, and nothing downstream can survive that.
  - **The start is never detected.** One question produced no capture at all — the onset gate sat above the speaker's own voice, and the turn ended on the onset timeout.

  Everything downstream degrades with it, which is easy to misread as a matcher problem: the *identical* profile scored its "#" template at 29–34 where it had scored 11.5–12.2 in the quiet run. The templates did not change; what was fed to them did. Note also that the browser's own `noiseSuppression: true` is already requested in `openMicSession()`, so this is not solved by asking for cleaner audio — the decision logic is what fails.

  **Direction:** endpoint against the utterance's own level rather than a floor sampled before it — track the running peak during speech and treat "silence" as a fixed fraction below that peak, keeping the absolute floor as a backstop. That adapts to a quiet room and a noisy one without either threshold being guessed. `279eb6e` added the `[voice] vad` debug line (stop reason `silence`/`cap`, noise floor, gate, peak, and `peakOverGate`) specifically to supply the ratio that fix needs to be calibrated against; it has not been read yet.

- **The personal voice profile never runs inside the Android app.** `getSpeechEngine()` in `src/utils/speech.ts` opens with `if (isCapacitorNative()) { cached = new NativeSpeechEngine(); }`, before the user's `pref_voiceEngine` setting is consulted at all. Inside the APK the recogniser is therefore always Google's, and the on-device template engines never load. The Settings screen still offers the **Voice engine** picker (Auto / Personal / General / Web) and **Calibrate my voice** there, so a user can complete a nine-word calibration on the platform the product is actually heading for and have it change nothing. This is squarely "behavior the product already promises but doesn't deliver".

  It matters more than it did: the personal-profile path has now been measured working. After the calibration/question-time preprocessing was made symmetric (`Trim calibration takes the way question-time segments are trimmed`) and the segmenter stopped being trusted to decide word boundaries (`Score both readings of a merged utterance instead of trusting the splitter`), a controlled desktop session — three "C", three "G", three fluent "F sharp" — recognised **9 of 9**, with letter distances of 10–20 and the accidental stage clearing at 11.5–12.2 against a 25 ceiling. That is the engine the Android build cannot reach.

  ### Implementation plan — let the engine preference win on native

  **Goal:** a calibrated personal profile is used inside the Android app, and the engine picker means what it says on every platform.

  - **`src/utils/speech.ts`, `getSpeechEngine()`:** stop short-circuiting on `isCapacitorNative()`. Fold native into the same preference ladder the web already uses: `pref === 'profile'` → the profile engine when `canProfile`; `pref === 'general'` → the template engine; `pref === 'web'` → `NativeSpeechEngine` on native (it is the platform recogniser there, the counterpart of Web Speech); `'auto'` → personal profile when one is calibrated, otherwise `NativeSpeechEngine` rather than the bundled synthetic set, which is a much weaker fallback than Google's recogniser and has no advantage on a platform where the native path exists.
  - **Verify `getUserMedia` inside the Capacitor WebView.** The template engines need `navigator.mediaDevices.getUserMedia` and an `AudioContext`, not just the speech plugin's `RECORD_AUDIO` grant. Android WebView also requires the host activity to answer `onPermissionRequest` before the WebView is allowed the microphone. **This must be confirmed on a device, not assumed** — if it does not work, the whole item is blocked and the plan needs rethinking, so check it before touching the selection logic. `TemplateSpeechEngine.checkPermission()`/`requestPermission()` go through `navigator.permissions` and `getUserMedia`, both of which behave differently in a WebView than in Chrome.
  - **`createDictationEngine()` keeps its native short-circuit** — free-text dictation genuinely wants the platform recogniser, not a twelve-word template matcher.
  - **Silent fallback needs a UI signal (see the separate note below).** Choosing "Personal" on a device where the profile is not ready currently drops to another engine with nothing shown; on Android that would be indistinguishable from this bug.

- **Choosing "Personal" silently falls back to another engine.** `getSpeechEngine()` demotes to the general template engine (web) whenever `isProfileReady()` is false, and `recomputeReady()` requires all nine labels at `SAMPLES_PER_LABEL` recordings each. An interrupted calibration, or takes rejected by the noise gate, therefore leave the user on a different recogniser than the one they picked, with no indication anywhere in the UI. This was hit during voice debugging: a full session was recorded, analysed and reported against the wrong engine before the `engine:` field in the debug log gave it away. The Settings screen should show which recogniser is actually active, and say when the personal profile is incomplete and why.

- **Voice answering cannot work at all in "by note" mode.** In that mode a note name is shown and the answer is a fret number, but `useVoiceAnswer` passes `profileVocabId(p.notation)` as the vocabulary on every turn regardless of mode (`src/hooks/useVoiceAnswer.ts`), and `profileVocabId()` only ever returns the note vocabulary. So a template engine can emit nothing but a letter such as `"C"`, and `ingest()` then runs `parseSpokenFret("C")`, which returns `null`. No spoken answer is ever parsed. The 240 bundled `frets-1-24` templates in `src/utils/generalVoiceTemplates.ts` are referenced nowhere in `src/` — roughly a third of a 1.8MB bundled file that no code path can reach.

  The Settings screen offers 🎤 Voice as an answer mode without qualification, so a user who picks "by fret" mode gets voice answering and a user who picks "by note" gets a microphone that never registers anything. This predates the current work and is not a regression from it.

  ### Implementation plan — a fret vocabulary for the template engines

  - **`src/utils/voiceProfileVocab.ts`:** `profileVocabId()` needs to take the mode as well as the notation, returning the fret vocabulary in by-note mode (the bundled key is `frets-1-24`; keep the same `-v{n}` layout suffix so `baseVocabId()`/`isCurrentVocabId()` keep working). Its callers — `useVoiceAnswer` (twice: `start()` and `warmUp()`), `VoiceCalibration`, and `App.tsx`'s profile-count read — all have the mode to hand or can be given it.
  - **The personal profile has no fret recordings.** `PROFILE_LABELS` is seven letters plus two accidentals; calibrating 24 more words is a much longer flow than the current nine and should not be forced on anyone. The sane split is: by-note mode uses the *general* template engine (which does have the 240 bundled fret templates) even when a personal profile exists, unless and until fret calibration is offered as an opt-in extra.
  - **The general engine's quality on frets is unmeasured.** Its note-name accuracy was poor enough on real microphone input to be the reason the personal profile became the main path; the leave-one-out check on the bundled set scored 100% for `frets-1-24`, but that is synthetic-against-synthetic and says nothing about a real voice. Measure it with the debug log before assuming this mode works, exactly as was done for note names.
  - **Alternative worth considering first:** twenty-five spoken numbers is a much larger vocabulary than twelve note names, and the failure modes ("fifteen"/"fifty", "two"/"to") are unforgiving. Routing by-note mode to the platform recogniser (Web Speech / native), which handles digits well and already has `parseSpokenFret` behind it, may be a better answer than template matching.

- **Accidentals need the speaker to pause between the letter and "sharp"/"flat" — and nothing tells them so.** Same speaker, same profile, same quiet room, no code change: accidentals went from **0/4** spoken naturally to **2/4** with a short deliberate pause ("F … sharp"), and the total from 5/10 to 8/10 (see the measured result under "The current voice recogniser is live but not verified").

  The mechanism is visible in the log. With the pause, three of the four accidental captures came back from the segmenter as two clean, near-equal segments (`segMs` `[400,400]`, `[400,400]`, `[420,420]`, `usedSplit: false`) and matched with wide margins — the two F♯ takes scored `F:10.9` against `A:21.5` for the runner-up letter, and `#:11.0` against `b:19.4`. Spoken fluently, the same words came back as one merged voiced run, and the letter half then matched poorly however the audio was cut. The one accidental that still merged despite the pause (`[760,100]`) went through the forced split and came out wrong (D#).

  **Direction:** tell the user, briefly, where it matters — the calibration screen and the 🎤 voice answer-mode hint: say the letter, a short pause, then "sharp" / "flat". Needs a Hebrew translation. This is a real fix rather than a workaround: the pause is exactly what lets the segmenter see two words, and it costs the speaker almost nothing. It does not replace the B/D item below, which failed even on a perfectly separated take.

  **DONE 2026-09-14.** Added the same hint text (Hebrew included) in two places: `VoiceCalibration.tsx` under the progress bar, and `GeneralSettingsSection.tsx` under the "How you answer" picker when Voice mode is selected — "Speak clearly and pause briefly between words — say the letter, pause, then 'sharp' / 'flat' as two separate words." Not yet measured against real recordings; the earlier measurement above (0/4 → 2/4 with a deliberate pause) is what justified adding it, not a fresh test of the hint itself changing behavior.

- **B and D are the one confusable letter pair.** Both failures in the 8-of-10 quiet-room run were "B♭", and the second one isolates the cause. Segmentation was perfect (`segMs [400,400]`, `usedSplit: false`), the accidental stage was certain (`b:9.5` against `#:21.4`) — and the note still came out C#, because the letter stage ranked `D:12.6` just above `B:13.2`. "B flat" became "D flat".

  The pair sat within about one distance unit on every turn where either was spoken, while F, C, G, A and E won by 5–10 units:

  | Spoken | D | B | Outcome |
  |---|---|---|---|
  | D | 9.2 | 11.9 | D — correct |
  | B, 1st attempt | 10.2 | 10.0 | too close; the ratio gate rejected it |
  | B, 2nd attempt | 11.3 | 10.8 | B — correct, by 0.5 |
  | B♭ | 12.6 | 13.2 | D — **wrong** |

  This is what the acoustics predict. Both are the same long /iː/ vowel behind a voiced plosive (/b/ vs /d/), so the only thing that tells them apart is the onset burst — a few tens of milliseconds that a whole-word MFCC + DTW distance barely weights, because the shared vowel dominates the alignment cost.

  **Direction (unmeasured):** when the two leading letters are B and D and their distances are close, re-score only the onset of the segment — the first few tens of milliseconds, where the burst lives; the exact window is a starting point to measure, not a known value — against the same two labels' template onsets, and let that break the tie. Keep it scoped to that tie-break so it cannot disturb letters that already win clearly. It is a matcher change, so judge it against real recorded voices with `scripts/eval-voice.mts`, not synthetic leave-one-out. Whether other letter pairs need the same treatment is unknown; this log shows no evidence for any.

  **Measured 2026-09-14 — the onset tie-break does not work; not built.** Tested offline on the git-ignored `scripts/testset/` (one speaker's real 48 kHz mic recordings, six takes of each letter). Each take was matched, through the app's own `segmentUtterance` → `computeMfcc` → `matchTemplates` letter stage, against every pair of the other takes stored through `isolateWord` (a two-take calibration). That is 60 turns per letter.

  - **Baseline:** B/D correct 106 of 120. B was taken as D 6 times, and D as B 5 times.
  - **Onset re-score** (B and D are the top two, the ratio is at or above a trigger, and the pair is decided by DTW over the first *N* frames of the segment and of each template):

    | Window | Trigger 0.97 | Trigger 0.90 |
    |---|---|---|
    | 30–80 ms (N 3–8) | 95–97 / 120 (≈11 correct answers flipped wrong, 1 fixed) | 84–86 / 120 |
    | 100–120 ms | 100–101 / 120 | 91–98 / 120 |
    | 150 ms | 103 / 120 | 104 / 120 |
    | 200 ms | 107 / 120 | 109 / 120 (3 fixed, 0 broken) |
    | 250 ms | 104 / 120 | 105 / 120 |

    The short windows the acoustics argued for are clearly harmful. The only gain sits at exactly 200 ms, and both neighbours lose. A single-point optimum in a sample of three flips is noise, not a tuning value.
  - **The burst is inside the segment.** The lead-in before 10% of peak energy is 20–50 ms on every B and D take, so the burst is not being trimmed off. The more likely limit is the features: 25 ms MFCC frames with a 10 ms hop, cepstral mean normalisation over the whole word, and the C0 down-weight smear a burst of 10–20 ms into one or two frames.
  - **B/D is not the worst pair in this data.** Letter-stage confusion over the same 60 turns per letter: A 60, B 54, D 52, F 50, C 42 (→E 10, →A 8), E 36 (→C 14), G 29 (→D 10, →E 8, →A 7). The claim that "B and D are the one confusable pair" rests on one 10-word session.

  Caveats: this is an older recording set from one speaker, not the phone session the log came from, and it has no "B flat" takes. It refutes the direction as specified. It does not prove that no burst feature could help. Any next attempt needs a feature that actually resolves the burst (for example a finer hop over the first ~60 ms, or a non-CMN energy/spectral-tilt cue), and the /iː/ letters B C D E G should be treated as one group rather than B/D alone.

  Tooling note: `scripts/eval-voice.mts` did not run as documented (`src/utils/utteranceCapture.ts` imports `./debugLog` with no extension, which plain `node --experimental-strip-types` can't resolve). **Fixed 2026-09-14**: the script now registers a resolve-hook fallback and dynamically imports `utteranceCapture.ts`, scoped entirely to the script. `VoiceCalibration.tsx` also gained a dev-only "Export recordings to a folder" toggle (File System Access API) that writes every accepted calibration take as a WAV named for `scripts/wav-lib.mts`'s `classify()`, so a real session builds an `eval-voice.mts`-ready testset with no manual file handling.

  **Measured again 2026-09-14, same day — on the product owner's own computer mic, not the older set above.** Repeated calibration to build up 10 B takes and 8 D takes (deleting and re-recording past the normal 2-per-label cap), then ran the identical leave-one-out matcher check.

  - **B/D confusion reproduces on this speaker/mic too, independent of the earlier dataset:** baseline 13/18 correct (B→D twice, D→B twice, D→E once) — a real, present confusion, not an artifact of one old recording set.
  - **The onset tie-break still does not help.** Scored only on the 16 turns where B and D were the top-2 candidates: baseline (no re-score) got 12/16 right. Every window from 30ms to 300ms was equal to or worse than baseline — never better:

    | Window | Correct / 16 | Flips: good / bad |
    |---|---|---|
    | 30 ms | 4 | 0 / 8 |
    | 50 ms | 5 | 0 / 7 |
    | 80 ms | 7 | 1 / 6 |
    | 100 ms | 10 | 3 / 5 |
    | 150 ms | 9 | 1 / 4 |
    | 200 ms | 11 | 1 / 2 |
    | 250–300 ms | 12 (ties baseline) | 1 / 1 |

  Two independent real-mic datasets now agree: no onset window, short or long, beats just trusting the whole-word DTW distance. **The onset-tie-break direction is closed — not a tuning problem, the approach itself doesn't isolate B from D with this feature pipeline.** The wishlist item above stays open; the next idea needs a feature that isn't whole-word DTW over 25ms/10-hop MFCC (per the burst-smearing note above), evaluated the same way before it touches the app.

  **Candidate directions to reach ≥90% on B/D-tie turns — none measured yet, all need `eval-voice.mts` evidence before touching app code.** Current baseline on the 16 B/D-tie turns is 12/16 (75%); the onset re-score never beat that. Ranked by how targeted they are at the actual acoustic cue (place of articulation: bilabial /b/ vs alveolar /d/), not by ease of implementation:

  1. **Formant-transition (F2 locus) feature.** The textbook cue that separates /b/ from /d/ is not burst loudness but the direction of the second-formant transition into the following vowel — falling into the vowel for /b/, rising for /d/. The failed onset re-score scored raw MFCC distance over a burst window; it never looked at formant *direction*. Track F2 (LPC or a lightweight autocorrelation pitch/formant estimate) over the first ~60–80ms after voicing onset and use its slope, not a DTW distance, as the tie-break. This targets the cue directly instead of hoping whole-word features contain it.
  2. **Un-normalized, finer-resolution onset spectrum.** The burst-smearing note above named two concrete limits: 25ms frames / 10ms hop are coarse next to a burst lasting 10–20ms, and cepstral mean normalisation is computed over the *whole word*, which can dilute an onset-only feature even when it's scored separately. Recompute just the onset window (first ~60ms) with a 5ms frame / 2.5ms hop and no CMN, and re-run the same B/D-tie DTW tie-break with this feature instead of the current one. Isolates whether the earlier failure was the tie-break idea or the low-resolution features it was built from.
  3. **Burst spectral-moment cue.** A different established acoustic-phonetics measure: the spectral centroid (and skew) of the release burst's first 10–20ms — bilabial bursts concentrate energy low, alveolar bursts run higher/more diffuse. Compute one or two scalar moments per candidate and use them as the tie-break instead of a DTW distance over raw MFCCs.
  4. **A tiny dedicated B/D classifier, not a DTW tie-break.** Rather than reusing DTW distance at all for the tie-break, fit a minimal classifier (e.g. logistic regression on 2–3 hand-picked features — F2 slope, burst centroid, VOT) from the user's own B and D calibration takes, invoked only when the main matcher's top two are B and D. Calibrate per speaker (every profile already stores several takes of each), evaluate with leave-one-out the same way this session did.
  5. **More calibration data as a product feature, not just a workaround.** Purely operational, not a new algorithm: this session's own numbers went from 1/4 correct (2 takes each) to 12/16 ties correct (8–10 takes each) on B/D from more recordings alone. `runSelfTest` in `VoiceCalibration.tsx` already flags acoustically-close label pairs — it could prompt the user to record a few extra takes specifically for a pair it flags as close, instead of stopping at the fixed `SAMPLES_PER_LABEL`. Cheap to build, and worth measuring before any of the above, since it might already close much of the gap to 90%.

     **Built 2026-09-14.** When `runSelfTest` flags a pair, each warning now carries a "record N more takes for X/Y" button (`EXTRA_TAKES = 3`) that raises just that pair's target above `SAMPLES_PER_LABEL` and confines auto-run to cycling between the two labels; the round re-runs `runSelfTest` on its own when both reach target. Found and fixed in the same pass: the "here / target" counter briefly showed a lower number than the take count actually on disk right after a focused round finished, because `stopRun()` resets `extraTarget` to `{}` and the display fell back to the raw `SAMPLES_PER_LABEL` baseline instead of the count already recorded — fixed by clamping the displayed target to `Math.max(SAMPLES_PER_LABEL, extraTarget[label] ?? 0, here)` (`VoiceCalibration.tsx`).

     **Tooling gotcha found while trying to measure this:** `scripts/eval-voice.mts`'s plain `<wav-dir>` mode matches against `--templates` (default: the bundled **general** model, `generalVoiceTemplates.ts`), *not* against the user's own recordings — it does not do a personal-profile leave-one-out on its own. Added `scripts/wav-to-templates.mts` (`node --experimental-strip-types scripts/wav-to-templates.mts <wav-dir> <out.json>`) to convert a personal WAV export into a template JSON, so `eval-voice.mts --loo --templates <out.json>` does the real personal-profile leave-one-out this section's own methodology needs. Use this combination, not the plain `<wav-dir>` mode, for any future personal-profile measurement.

     **Measured 2026-09-14, before/after, same session's voice, personal-profile leave-one-out (`wav-to-templates.mts` + `eval-voice.mts --loo`, not the general model):**
     - **Before** (2 takes/label, the app's `SAMPLES_PER_LABEL` baseline): B 0/2, D 0/2 — both confused only with each other. n=2/label is too small to be more than directional.
     - **After** (used the button above to bring B and D to 8 takes each, other labels left at baseline): B 6/8, D 5/8 — **B/D combined 11/16 (69%)**, up from 0/4 (0%). Consistent with the original 1/4→12/16 finding this item is named for — more calibration data on a flagged pair, alone, closes most of the gap. Residual confusion: B↔D twice each direction, plus D→E once. G (still only 2 takes) failed both times, confused with D — likely needs the same extra-takes treatment, not measured here.
     - **Caveat:** this "after" number is raw per-take accuracy across all 9 labels, not filtered to "turns where B/D were the top-two candidates" the way the original 12/16 was — a strict like-for-like re-run would need that same filtering re-applied to today's data before comparing the two precisely.

     **This closes the "worth measuring before any of the above" question from this item's own text: yes, it is.** Recommend giving the product surface (the button above) some runway with real users before spending effort on any of candidates 1–4; revisit if the real-world numbers don't hold up outside this one test session.

  **Built 2026-09-15: raised the baseline `SAMPLES_PER_LABEL` from 2 to 4** (`voiceProfileVocab.ts`), for a different reason than raw match accuracy — the product owner noticed `runSelfTest` was flagging nearly every label pair as "too close." Reading the self-test (`VoiceCalibration.tsx:295-343`) explains why: its "too close" yardstick (`within`) is the *tightest* pairwise distance between a label's own recordings, and at 2 takes/label there is only one such pair to draw from — one noisy take (background noise, a mic hiccup) inflates that single number and makes the threshold (`within * 1.15`) generous enough to flag unrelated pairs across the board. At 4 takes/label there are 6 within-label pairs instead of 1, so the yardstick stops depending on a single recording. Cost: calibration doubles from 18 to 36 takes (9 labels), borne only by Pro users calibrating a personal profile. **Confirmed 2026-09-15, same day, product owner's own calibration:** after recalibrating at 4 takes/label, the self-test dropped from flagging nearly every pair down to exactly two — B/D and D/E — both of which are real, previously-documented confusions (the /iː/-vowel letter group noted above), not noise artifacts. Supports the diagnosis: the single within-label pair at 2 takes/label was an unreliable yardstick, and 4 takes fixes it. No further self-test tuning needed for now.

  **Live drill-session findings, 2026-09-15 — from a real 15-question round's debug log (`[voice]` console lines), not yet fixed, high priority.** This is the same profile from the self-test fix above, so `SAMPLES_PER_LABEL` was already 4 for this round. Session totals: 13/15 questions produced a scored answer, 9/13 (69%) of those correct, 2/15 timed out with no answer at all after repeated failed capture attempts.

  1. **A misheard as B — a confusion the self-test did not flag.** The self-test after the `SAMPLES_PER_LABEL` fix flagged only B/D and D/E (see above), but this live round produced a wrong answer with A recognised as B. The calibration log for the *same* profile independently shows A's nearest calibration neighbour is B at distance 19.1 (`[voice] cal gate` entries) — i.e. there is a real, present A/B confusion the pairwise self-test check is not catching. Worth checking why: possibly A and B individually haven't accumulated enough takes yet for the self-test's within-label yardstick to be reliable for *this* pair specifically (the fix above was validated on B/D and D/E, not proven for every pair), or the self-test's `1.15` multiplier is too tight to catch a moderate-but-real confusion at this distance. Needs the same self-test methodology check applied to A/B specifically before deciding.
  2. **Accidental segmentation can silently drop "sharp"/"flat" outright, independent of the already-tracked distance-rejection failures.** One F# question was captured with `"segments":1` — the utterance was never split into a letter part and an accidental part to begin with, so "F" was scored with no accidental at all, rather than being scored with a rejected/wrong accidental. This is a different failure mode from the existing `abs-cap`/`ratio-cap` rejection logic (which assumes two segments were found and only disagrees about matching one of them) — the splitting step itself (`segmentUtterance`/the "split hypothesis" logic in `templateSpeechEngine.ts`) needs to be checked for why it sometimes returns one segment for an utterance that should have two, even after the "pause before sharp/flat" hint shipped.

     **Investigated 2026-09-15 — the paragraph above is superseded.** Evidence is three `[voice]` debug-log rounds of the product owner saying "F sharp" to every question (the correct answer was ignored; only the recognised note matters).

     - **With a pause:** 6/6 and 5/5 recognised as F#. Some turns needed a retry, but that is item 4, not this item.
     - **Without a pause, original code:** 4/9 F#, the other 5 came out as F.
     - **Without a pause, after the cut-search attempt below:** 2/5 F#. No better; the sample is too small to say it is worse.

     **What actually happens.** `segments:1` does not mean the accidental was never isolated: `runSegmented` always scores a "split hypothesis" (letter + accidental) on segment 0 and takes it when the letter half beats the whole run and the accidental half is within `accidentalAbsMax()` (25). Two failure paths produce the "F":
     - **E + "#" → F.** In most wrong turns the split *was* taken with a confident "#" (`"accidental":"#"`), but the letter half matched **E**, and `SHARP_WRAP` turns E# into F. Across all logged split hypotheses the letter half matched E in 14 of 17, even when the whole run matched F clearly.
     - **Split rejected, whole run read as plain F** — the letter half was not closer than the whole run, or the "#" landed just over the cap (25.8 vs 25).
     - (One further turn failed differently: segment 0 was a 50 ms noise burst and the whole "F sharp" sat in segment 1, so the split search never saw it.)

     Root cause (hypothesis strongly supported by the logs, not proven): in a fluent "ef-sharp" the /f/ and /ʃ/ fricatives merge. Cutting inside them leaves a letter half that is only the "e" vowel, which matches E. There is no single acoustically correct cut.

     **Attempt 1 — matcher-chosen cut (built, did not help, NOT committed).** Replaced the quietest-frame cut on segment 0 with a search over cuts every 20 ms across the middle 60%, keeping the cut with the lowest letter + accidental distance (`templateSpeechEngine.ts` split-hypothesis block; also removed the now-unused `split: 'always'` mode from `segmentUtterance`). It failed for a structural reason: moving the /f/ into the accidental half makes *both* halves fit better ("f-sharp" still matches "sharp" at ~12, "e" matches E), so the minimum-sum objective steers toward the wrong reading. Search cost was 15–46 ms per turn. This change exists only in the working tree of the machine it was made on; do not rebuild it.

     **Candidate fix — whole-utterance matching against concatenated templates (not built, untested).** No cut at all: match the trimmed utterance against every letter template *and* every letter-template + accidental-template concatenation, and let DTW find the alignment, so the blurred f/sh boundary decides nothing. Needs no extra calibration. A rejected alternative: refusing E#/B# and falling back to the whole run's letter only fixes about one of the three E# turns in the logs.

     **Next step — run the offline comparison before building anything.** `scripts/eval-accidental-split.mts` (committed) decodes every `scripts/testset/alpha_*.wav` (6 takes each of the 7 letters and 5 sharps, git-ignored, local to the original machine) three ways — `quiet` (original cut), `search` (attempt 1), `concat` (the candidate) — and reports sharps and naturals separately, so a method that helps sharps by breaking naturals shows up. It needs the personal profile, because the testset has no standalone "sharp" recording:
     1. In the app's browser tab, DevTools console, run this (read-only: it reads IndexedDB `voiceProfiles` and downloads `voice-profile.json`):
        `(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('voiceProfiles');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});const rows=await new Promise((r,j)=>{const q=db.transaction('templates').objectStore('templates').getAll();q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(rows)],{type:'application/json'}));a.download='voice-profile.json';a.click();console.log('rows',rows.length)})()`
     2. `node --experimental-strip-types scripts/eval-accidental-split.mts scripts/testset <path>/voice-profile.json`
     3. If `concat` clearly beats `quiet` on sharps without losing naturals, build it in `runSegmented`, then verify live: several "F sharp" answers with and without a pause, compared against the numbers above. If no method wins, record the numbers here before trying anything else.

     Caveats: the testset WAVs are an older sitting than the current profile, and whether they were spoken with a pause is unknown — check the concat top-3 column per file. If the testset is not available on the machine, the same comparison needs fresh fluent recordings.

     **Offline comparison run 2026-09-15.** No browser export was used: the profile was rebuilt from the calibration screen's dev WAV export of 2026-09-14 (`Documents/…/ייצוא הקלטות`, 33 takes — letters at 2–10 takes, `sharp`/`flat` at 2 each; the WAVs are already `isolateWord`-trimmed, so MFCC was computed on them directly, as `VoiceCalibration` does), with every label under `notes-alpha-v5` the way the app stores `#`/`b`. Wav-dir `scripts/testset` (72 files: 7 letters × 6 takes, 5 sharps × 6 takes). Two variants were added to the script beyond the planned three: `concatG` (concat plus the app's 0.97 ratio gate) and `concatI` (concat on `isolateWord` instead of `trimSilence`), plus `hybrid` — the `quiet` decision, except when gated concat reads an accidental. Result as correct / wrong answer / total (∅ = the app would listen again, not a wrong answer):

     | Method | Sharps | Naturals |
     |---|---|---|
     | quiet (shipped) | 2 / 15 / 30 | 26 / 6 / 42 |
     | search (attempt 1) | 11 / 11 / 30 | 26 / 6 / 42 |
     | concat | 16 / 14 / 30 | 32 / 10 / 42 |
     | concatG | 13 / 8 / 30 | 28 / 9 / 42 |
     | concatI | 9 / 21 / 30 | 36 / 6 / 42 |
     | **hybrid** | **13 / 9 / 30** | **26 / 6 / 42** |

     - `quiet` reproduces the live bug offline: F# came out as plain F on 4 of 6 takes.
     - Ungated `concat` wins the most sharps but breaks natural F (read as E on 4 of 6), so it fails the "without losing naturals" rule. **`hybrid` is the only method that meets it**: sharps 2 → 13 correct with wrong answers 15 → 9, and naturals identical to shipped by construction (concat can only override when it hears an accidental).
     - Remaining sharp failures are concentrated in A# (0/6 in hybrid, mostly read as F or F#) and D#.
     - **Warning on how far to trust this:** `search` also looks clearly better than `quiet` here (11 vs 2), yet live it did not help (4/9 → 2/5). The testset is an older sitting and possibly a different speaking style, and the profile has only 2 takes of "sharp". So an offline win is necessary, not sufficient — the live check in step 3 is what decides.
     - Not measured yet: the per-turn cost of concat inside the app (a 4-takes-per-label profile means 28 letter templates × 8 accidental takes = 224 concatenations per turn, on top of the segmented path).

     **Next step:** build `hybrid` in `runSegmented` (after discarding attempt 1 from the working tree), log `concat` top-3 and timing in the `[voice]` line, and repeat the live protocol — several fluent and paused "F sharp" answers plus plain letters, against the numbers above.

     **Hybrid built and run live once, 2026-09-15 (committed alongside the item 4 capture fix so work can continue on another device; it only ever overrides with a gated sharp/flat reading).** Attempt 1 was discarded; `runSegmented` now also runs the whole-utterance concat match (`trimToVoice` in `utteranceCapture.ts`, a copy of `wav-lib`'s `trimSilence`) and overrides only with a gated reading containing "#", logged as `[voice] concat accidental`. One round of about ten "F sharp" answers (fluent and paused mixed; which was which not yet recorded) plus a few letters:
     - **F# recognised on 6 of 10 answers**; the other 4 came out as F (three of them E + "#" → F through the split, one a plain F on one segment).
     - **The override changed the answer once** (F → F#, correct). In one more wrong turn concat had F# first but lost to the ratio gate (15.9 vs 16.2); in two others it had F first and F# a close second (16.3 / 16.4, 19.4 / 19.9).
     - Why it is so close: DTW lets a plain F template stretch over the whole "F sharp", so "F" versus "F + sharp" differ by under 3% on most fluent turns. The concat reading barely separates the two — that, not the gate, is the limit.
     - Cost: 20–45 ms per turn, 220–280 ms on a capture that ran to the 3.5 s cap.
     - It never produced a wrong answer on the plain letters said in this round (E, B, E).

     Not yet enough to call it a win or a failure: the sample is small and the paused/fluent split is unknown. Before changing anything further, repeat with the two styles in separate, labelled runs.
  3. **A correct label can match worse than every incorrect one.** One question with correct answer C matched with C ranked *last* of all seven letters (`d:33.8`, the largest/worst distance in the ranking) while the winning wrong guess (F) scored substantially closer. This implies either C's own calibration takes are unusually inconsistent (worth checking `within`-style spread for C specifically) or this particular utterance was atypical (background noise, mid-word hesitation) in a way nothing in the profile currently covers. Needs the raw audio/replay for this specific turn (or a repeat) to tell which.
  4. **Repeated failed-capture retries before an answer, or a full timeout, cost real time per question.** Several questions in this round needed 2–3 capture attempts (each logged as `segmented reject` with `reason: "ratio-cap"` or `"abs-cap"`) before a transcript was accepted, and two questions exhausted all retries with zero answer. This is a distinct, measurable UX cost (elapsed time / retries per question) from the wrong-answer-rate numbers tracked elsewhere in this section, and hasn't been quantified across sessions yet — worth instrumenting retry counts specifically, not just final correctness, in any future measurement.

     **Investigated 2026-09-15 from two live `[voice]` logs (an "F sharp" test round and a normal drill round), web build, app sound on.** Of 10 failed attempts in the first log: 5 were `abs-cap` on the accidental stage, 4 `ratio-cap` on a near-tie letter (E/A 0.993, B/D 0.979, D/B 0.976…), 1 an onset timeout with nothing logged about why. Two causes:

     - **Cause A — contaminated noise floor makes capture deaf (FIXED, uncommitted → committed with this entry).** `captureUtterance` averaged the first 5 blocks (~200ms) as the noise floor and set the onset gate at 3.5× it. After a rejected answer listening restarts ~90ms later, while the speaker is already repeating — so the "floor" is their voice. Evidence: a new `[voice] onset timeout` log line (added for this) showed `noiseFloor 0.1019`, `gate 0.3567`, `loudest 0.1296` — the speaker's loudest block during the 4s window was a third of the gate, so nothing short of shouting could start a capture. Normal floors in the same logs are 0.0004–0.008; elevated ones (0.0126–0.0212) cluster on retries. **Fix:** the floor is now the running minimum block RMS before onset, so it falls back as soon as there is any gap between words. In a quiet room the gates are unchanged (both clamp to their 0.010/0.012 minimum). Possible side effect to watch: in steady background noise the minimum is a little lower than the old mean, so the trailing-silence gate is slightly lower and captures may run to the cap a bit more often. The calibration screen uses the same capture and gets the same fix. **Not yet verified live.**
     - **Cause B — a short trailing fragment rejects a clear letter (NOT fixed).** When `segmentUtterance` returns a second segment of ~120–180ms that is not "sharp"/"flat", the accidental gate fails and `runSegmented` discards the whole answer. Evidence: `A:10.6` against `E:12.6` on `segMs [360,169]`, and `B:11.9` against `D:13.8` on `[480,140]` (twice across the two logs), each rejected and asked again. Real accidental segments in the same logs run 240–980ms. **Candidate rule:** if segment 0 is ≥ ~250ms, segment 1 is < ~200ms, and segment 1 fails the accidental cap, ignore it and answer the letter. **Trade-off to decide first:** in the "F sharp" round a short fragment was sometimes the tail of a real "sharp" (`[520,140]` with F first), so the rule would turn some "ask again" turns into a wrong "F". Measure how often each happens in a normal round before building.

     **To continue (from any session/device):** `git pull`, `npm install`, `npm run dev`; open the app on the port where the voice profile was calibrated (the profile is per-origin); hard-refresh; 🐞 → Simulate Pro → Voice: on → Clear; voice answer mode, "by fret", Personal engine; play a normal round answering the real questions; 🐞 → Copy. In the log, count per question the `segmented reject` / `onset timeout` lines before an answer, check `onset timeout` rows for `loudestOverGate` < 1 (still deaf) and `noiseFloor`, and count rejects that match cause B (short second `segMs`, clear letter). Then decide cause B.

     **Normal drill round with the cause-A fix, read 2026-09-15** (15 questions, real answers, web build, Personal engine, noise floors 0.0002–0.0007 except one). Per question, correct answer → recognised (attempts):

     | # | Correct | Heard | Attempts | Note |
     |---|---|---|---|---|
     | 1 | E | E | 1 | |
     | 2 | F# | E | 2 | 1st: letter `ratio-cap` E 22.1 / F 22.7; 2nd started at once, `noiseFloor 0.0228`, `peakOverGate 1.3`, read E |
     | 3 | E | E | 1 | |
     | 4 | C | **C#** | 2 | 1st: cause B (`[400,120]`, C 11.0 vs D 21.1, accidental 36.7); 2nd: segmented rejected again, **concat override answered C#** |
     | 5 | B | D | 1 | D 11.5 / B 12.0 |
     | 6 | D | E | 1 | E 12.7 / D 13.3 |
     | 7 | E | E | 2 | 1st: cause-B shape (`[420,180]`) but letter **B 12.2** / D 12.7, E 16.8 |
     | 8–12 | F#, C, E, A, A | all correct | 1 each | F# with a clean `[420,540]`, `#:11.4` |
     | 13 | C# | A# | 1 | letter half E 12.5, C last at 25.0; concat override A# |
     | 14 | C | E | 1 | **capture with post-onset `peak 0.0069` (`peakOverGate 0.7`)**, one 100 ms segment accepted at E 25.0 |
     | 15 | E | E | 1 | |

     - **Cause A looks fixed.** Every question got an answer (previous round: 2 of 15 timed out), 18 captures for 15 questions, **zero `onset timeout` lines**, and floors stayed at quiet-room levels on retries. The one elevated floor (Q2, 0.0228) is a capture that began immediately — there was no quiet block at all — which suggests the tail of the same utterance, not a deaf gate. Hypothesis only: a pause over the 350 ms `trailingSilenceMs` split "F … sharp" into two captures, and the second ("sharp") matched E.
     - **Cause B, still undecided — this round is one for, one against.** Q4 the rule would have answered C correctly; Q7 it would have answered **B, wrongly** (the question was E). A stricter variant fits all four cause-B turns seen so far: only ignore the fragment when the letter wins by a wide margin (ratio ≤ ~0.85 — Q4 0.52, earlier A/E 0.84 and B/D 0.86 borderline, Q7 0.96 stays "ask again"). Unmeasured against the "F sharp" round's `[520,140]` tails.
     - **New — the concat override turns "ask again" into a wrong answer (Q4).** In `runSegmented` the override is applied after the segmented gates, including when they returned `note: null`, so a rejected plain "C" came back as C#. The one correct override seen live (F → F#) had a segmented answer. Candidate: only let concat override a non-null segmented note.
     - **New — a single transient can become an answer (Q14).** Onset fires on one block over 0.012, `peak` (tracked only after onset) never reaches the silence gate, and the letter stage has no absolute cap by default (`voiceProfileAbsMax` unset), so a 100 ms segment at 25.0 was accepted. Real letters in this log run 260–460 ms at 8.7–13.7. Candidate: discard a capture whose post-onset peak is below the silence gate, or a lone segment under ~150 ms.
     - Wrong answers not caused by capture: B/D (Q5), D/E (Q6) — the known /iː/ group — and Q13 (C read as E, item 3's pattern again).

     **Built 2026-09-15 — the two new candidates, not yet verified live.**
     - `templateSpeechEngine.ts`: the concat override now applies only when the segmented path already produced a note; a segmented reject stays "ask again" (the concat line still logs its reading, with `overrode: false`).
     - `captureUtterance`: when trailing silence ends a capture whose post-onset `peak` never reached the silence gate, it is discarded in place — logged as `[voice] transient ignored` — and capture goes back to waiting for onset with a fresh onset timeout. Same change applies to calibration takes. A real letter spans five or more 43 ms blocks above the gate, so it cannot hit this path.
     - **Verify:** one normal round; look for `transient ignored` rows (and that no answer follows them), and confirm no `concat accidental` with `overrode: true` appears on a turn whose segmented match said `note: null`.

     **Two noisy-room rounds read 2026-09-15, same day, after the two fixes** (product owner: "I'm in a noisy room"). First round: 3 questions, 0 answers, 5 captures all rejected. Second: 6 questions, 2 correct (E, C#), 1 wrong, 3 no answer, 12 captures.
     - **The noise is the failure, not the two fixes.** Neither fix changed an outcome: no `transient ignored` line, and the concat reading never passed its own gate on a rejected turn. What broke: 4 of 17 captures ran to the 3.5 s cap and most others ran 1.5–2.6 s (a spoken letter is ~1 s in a quiet room), segmentation was garbage (`[120,1960]`, `[1600,300]`, `[80,540]`), and letter distances rose to 17–30 against 9–13 in quiet. `noiseFloor` often stayed at 0.0002–0.0015 on those same cap captures — the floor is the quietest pre-onset block, so intermittent noise does not raise it, and the absolute 0.010 silence gate then never sees 500 ms below it. This is the known "VAD breaks with background noise" item in §1, now reproduced in a normal drill round.
     - **A "noise filter" is not the lever.** `openMicSession()` already requests the browser's `noiseSuppression`; it targets steady noise, and competing speech sits in the same band as the answer. The fix direction stays the endpoint one: silence relative to the utterance's own peak.
     - **Transient fix was too lenient — tightened.** One more junk capture got through: post-onset peak 0.0104 against a 0.010 gate (1.0×), a 140 ms segment answered "E" (wrong, the question was G). Garbage captures so far peaked at 0.7×, 1.0×, 1.3× the gate; every real word at ≥ 3.9× (the lowest in the noisy round). The threshold is now 2× (`TRANSIENT_PEAK_OVER_GATE`).
     - **Instrumentation for the endpoint fix added.** `[voice] vad` now also logs the post-onset level distribution relative to the peak (`p10`, `p50`, `p90`) and `tail` (mean of the last ~500 ms relative to the peak), so a noisy-room round shows where "silence as a fraction of peak" would have to sit. **Next: one round in the same noisy room, then choose that fraction from the `tail` values on `cap` stops versus `silence` stops.**
     - **Cause B evidence +2:** Q4 of the second round was rejected twice on a clear E with a short fragment (`[460,180]` E 13.6 / B 15.7, ratio 0.87; `[380,220]` E 10.1 / A 13.4, ratio 0.75). Option (b) with ≤ 0.85 answers the second, not the first; (a) answers both. Six cause-B turns so far, all where the letter was right except Q7 of the earlier round.

     **Noisy-room round with the level instrumentation, read 2026-09-15.** 11 questions: 5 correct, 2 wrong, 4 no answer; 22 captures.
     - **Transient rule at 2× confirmed:** two `transient ignored` rows, one at peak 0.0132 (1.3× the gate) that the old rule would have passed.
     - **Endpointing is not the main failure in this round.** Only 2 of 22 captures ended on `cap` (`tail` 0.204 and 0.107 of peak); every `silence` stop had `tail` ≤ 0.045. Two cap stops are too few to choose a peak fraction, and even a perfect endpoint would have changed two captures. Not built.
     - **The dominant failure is segmentation of noisy captures.** 14 rejected captures ended on `silence`; most had a second segment of 220–820 ms that was room noise, failing the accidental cap (`[440,820]`, `[340,220]`, `[440,560]`, `[260,300]`, `[240,540]`), or a letter near-tie with distances raised by noise. The same noise also produced both wrong answers: a 260 ms noise segment read as "#" at 23.5 (under the 25 cap) turned a correct D into D#, and a weak capture (3.5× gate, letter at 26.2) plus a "#" at 24.3 gave F for E.
     - **The whole-utterance concat reading is far more decisive in noise** (it runs on `trimToVoice`, which trims relative to the capture's own peak). Q11 was rejected four times by the segmented path; concat read E three times with clear margins (10.5 / 14.4, 8.5 / 12.8, 14.6 / 17.5). In the previous noisy round Q4's two rejected clear-E captures read E at 12.5 / 15.0 and 9.5 / 12.8. Counterfactual across all three noisy rounds: letting a concat reading answer a rejected capture only when it wins by ratio ≤ 0.85 would have answered 7 of them, 5 consistent with what was said (E ×5), 2 with unknown truth (C, B); at the 0.97 gate it would also have answered the wrong C# case that the concat-override fix removed. **Candidate, not built:** a strict-margin concat fallback for rejected captures. Blocked on knowing what was said on unanswered questions.
     - **Instrumentation added:** `[voice] timed out` with `correctNote` when a question expires, so rejected captures can be scored against the truth in the next round.

     **Noisy-room round with `timed out` logging, read 2026-09-15.** 7 questions: 2 correct, 1 wrong, 4 timed out (truth now known for every rejected capture).
     - **The strict-margin concat fallback is refuted — do not build.** On the 7 rejected captures, concat never won by ≤ 0.85; its top readings were ties or wrong (G#/D#/A# on long noisy captures, E 11.3 vs A 11.7 when A was said). It would have answered nothing.
     - **The segmented letter stage was right on most rejected captures.** Letter winner vs truth, with ratio to runner-up: E 0.85 ✓ and E 0.75 ✓ (both said E; rejected only because a 840–1300 ms noise segment failed the accidental cap), A 0.93 ✓ (rejected by an 80 ms fragment), E 0.86 ✗ (A was said), F/E tie (E said). This is cause B widened: the failing second segment is often long room noise, not only a short fragment. Across every log with known truth, "answer the letter when the second segment fails the accidental cap and the letter ratio is ≤ 0.85" is 4 right, 0 wrong (C 0.52, E 0.75, E 0.75, E 0.85); at ≤ 0.87 it adds one right (E 0.87) and one wrong (E 0.86 for A). A thin, one-speaker sample.
     - **Noise read as an accidental just under the cap is a repeating wrong-answer source.** Four wrong answers today came from a noise segment clearing the 25 cap: `b` 23.2 (G → D#), `#` 23.5 (D → D#), `b` 24.4 (G → D#), `#` 24.3 (E → F). Every correct accidental logged today scored ≤ 22.2 (11.0, 11.4, 17.5, 17.6, 18.7, 20.7, 22.2). A cap of ~22.5 separates them, with a one-unit margin on each side. Candidate, not built.

     **Built 2026-09-15 (approved by the product owner) — the two remaining candidates, not yet verified live.**
     - **Letter fallback (cause B, option (b) widened):** in `runSegmented`, when the letter passed its gate but the second segment fails the accidental gate, the letter is answered alone if its distance ratio to the runner-up letter is ≤ 0.85 (`LETTER_FALLBACK_RATIO`); otherwise "ask again" as before. No length condition on either segment, since the failing second segment is often long room noise. Logged as `[voice] letter fallback` (`ratio`, `taken`) and `letterFallback` on the `segmented match` line. The concat override does not apply to a fallback answer (noisy captures are where concat misread). Known risk: the tail of a real "sharp" (`[520,140]`) can now come back as the plain letter when the letter wins clearly.
     - **Accidental cap 25 → 22.5** (`accidentalAbsMax` default). Also tightens the split-hypothesis check, which uses the same cap.
     - **Verify:** one noisy-room round and one quiet-room round. Score every `letter fallback` row with `taken: true` against the question's truth, check for `taken: false` rows that would have been right, and look for correct accidentals rejected at 22.5–25 (a sharp/flat said but answered as "ask again" or as the letter).

     **First round with the letter fallback and the 22.5 cap, read 2026-09-15.** Preceded by a recalibration (profile `notes-alpha-v5`, 4 takes per label); in its `cal gate` rows 6 of 24 new takes were nearest to a *different* label (E→A ×2, F→B, G→D ×3, b→#). Noise floors 0.0002–0.0015, so a quiet room (only one round in the log). 15 questions: 8 correct, 7 wrong, 0 timed out, 20 captures (previous quiet round: 5 wrong).
     - **Letter fallback: 5 taken, 3 right, 2 wrong.** Right: B 0.65 `[400,80]`, A 0.70 `[400,180]`, G 0.74 `[440,140]`. Wrong: D 0.76 `[180,320]` for a spoken E, D 0.80 `[200,520]` for a spoken B. Not taken, both correctly: A 0.95 (G said), C 0.87 (C# said). The ratio alone does not separate them; two things did in this round, each on n = 5: (1) segment 0 length — every right fallback had ≥ 400 ms, both wrong ones ≤ 200 ms (option (a)'s ≥ 250 ms condition); (2) the whole-utterance concat reading — it agreed with the letter on all three right ones (B 9.2, A 10.1, G 11.1) and read the true note clearly on both wrong ones (E 11.9 / 14.8, B 12.1 / 15.1). Not yet checked against the earlier fallback turns' segment lengths. Candidates, not built.
     - **The 22.5 cap does not separate noise from real accidentals.** It helped once (Q6: `b` 24.5 would have turned A into G#; now answered A), but noise still passed at `b` 22.2 (G said, 640 ms segment → C#) and `b` 21.8 (A said, `[420,200]` → G#), while a real `#` scored 21.6 the same round. On Q11 concat read plain A clearly (10.3 / 13.4, no accidental in its top four). Candidate, not built: let a clear natural concat reading veto an accidental.
     - **New repeating error — C# read as D#, 3 of 3.** Every C# question took the split hypothesis, the letter half matched D over C (D 17.9 / C 28.8, 17.2 / 19.3, 16.1 / 20.0), and a genuine `#` composed D#. The accidental was right each time; the letter half of a fluent "C sharp" is the /iː/ group confusion again.

     **Built 2026-09-15 (approved) — letter fallback also needs a letter segment ≥ 250 ms** (`LETTER_FALLBACK_MIN_MS`; the split half's length when the split hypothesis was taken). Checked against every fallback turn with a known length: right C 400, E 380, E 460 (earlier logs), B 400, A 400, G 440 (this round) all still answer; wrong D 180, D 200 now ask again. The two noisy-room fallbacks have no recorded length. The "concat must agree" alternative was rejected: on the earlier Q4 the letter C was right while concat read C#. `letter fallback` now logs `letterMs`. **Verify:** a quiet round including sharps; score `taken` rows and look for `taken: false` turns rejected only by length where the letter was right.

     **Quiet round with the 250 ms condition, read 2026-09-15.** 16 questions: 10 correct, 5 wrong, 1 abandoned by a pause (Q1). Sharps F# and C# both right (C# via the split, letter half C 15.2 this time).
     - **The length condition decided nothing:** two `letter fallback` rows, both refused by ratio (D 0.898 on 280 ms, D 0.857 on 320 ms — the second was a spoken C, so refusing was right).
     - **New dominant wrong-answer shape — a short leading fragment taken as the letter, the real word taken as a flat (3 of 5 wrong).** `[50,320]` D 23.4 + b 19.5 → C# (E said); `[140,440]` D 17.8 + b 17.9 → C# (C said; C ranked last in segment 0 at 31.4); `[100,340]` D 20.3 + b 19.1 → C# (E said). The fragment always matches D at a poor distance, the second segment clears the flat cap, and D + b composes C#. The previous round's two wrong fallbacks were the same short-segment-reads-D pattern (180 ms, 200 ms).
     - **Noise read as a flat again:** `[500,460]` A 14.2 + b 20.4 → G# (A said).
     - Q11: B 8.8 / E 14.6, very clear, but the question was D. Either a misspoken answer or B/D at its worst — unknown.
     - **Concat reading on the four accidental wrongs:** read the spoken natural clearly on three (E 11.3 / 14.2, C 10.8 / 21.2, A 11.9 / 15.0) and was unclear on one (B 23.0 / 24.5). With the previous round's A (10.3 / 13.4): 4 of 5 accidental wrongs across two rounds had a clear (ratio ≤ 0.85) natural concat reading. No correct accidental answer logged so far had one — the "F sharp" round's F-first readings were near-ties (16.3 / 16.4, 19.4 / 19.9). **Candidates, not built:** (1) when the segmented answer carries an accidental but concat's top reading is a natural winning by ratio ≤ 0.85, ask again; (2) require a letter segment ≥ 250 ms before composing a letter with an accidental (every correct accidental's letter segment so far was 320 ms or more), which covers the three leading-fragment turns including the one concat could not read.

     **Cause B — deferred by the product owner 2026-09-15, later built as above.** Options on the table, unchanged: (a) the plain rule above (segment 0 ≥ ~250 ms, segment 1 < ~200 ms and failing the accidental cap → answer the letter), (b) the margin variant (same, but only when the letter's ratio to the runner-up is ≤ ~0.85), (c) leave "ask again". Evidence so far: 4 cause-B turns across three logs — (b) matches all four, (a) would have produced one wrong answer (Q7 above). Before building either, check (b) against the "F sharp" round's `[520,140]` tails, where the fragment was the end of a real "sharp".

  Items 1 and 3 above still have no proposed fix; they only record the evidence and root-cause reasoning from reading the log, per the standing rule to diagnose from real evidence before changing the matching code.

  **Before any candidate above — fix the measurement itself (recommended 2026-09-14).** Every B/D number so far is one speaker, one sitting, one mic, n=16 or fewer, and the two headline figures (12/16 on B/D-tie turns vs 11/16 raw per-take) aren't computed the same way, so they can't be compared. At this sample size two or three flips is noise — exactly what the 200 ms onset "optimum" turned out to be. Build a fixed test set first: several sittings on different days, a phone mic as well as the computer mic, a quiet run and a background-noise run. Score every candidate against that same set with the same B/D-tie filter. Priority note: B/D is not obviously the biggest voice problem — the older dataset had C/E/G worse, the VAD collapses to 3/10 with talking in the room, and the missing "pause before sharp/flat" hint was worth 5/10 → 8/10. Those are likely better value than more B/D work. If B/D work does continue, try candidate 2 first (cheapest, and it tells whether the onset idea failed or only its features did), then candidate 1.

  **Further directions, added 2026-09-14 — none measured, same evaluation rule as above:**

  6. **Sidestep the acoustics with vocabulary.** Offer alternative spoken labels for the confusable letters: solfège (סי for B, רה for D — acoustically unrelated words, and familiar to Hebrew speakers) or NATO-style (Bravo / Delta). The personal engine matches whatever the user recorded for a label, so this may need little more than letting calibration record a different word per label plus the transcript/label mapping. Unverified — check how labels are tied to prompts in `VoiceCalibration.tsx` / `voiceProfileVocab.ts` first. Also covers the wider /iː/ group (C, E, G).
  7. **Abstain instead of guessing on a close B/D call.** The segmented note path (`templateSpeechEngine.ts` ~461) runs the letter through `gate()`, but a tight B-vs-D margin still yields an answer. When the top two letters are B and D and their distance ratio is close, return no answer ("say it again" / tap) instead of risking a wrong answer that breaks the streak. Pure UX, needs no recognition improvement. Measure how many correct answers it would also reject.
  8. **Learned per-frame weights from the user's own B/D takes.** Instead of assuming the difference sits in the onset (the assumption that failed twice), DTW-align the user's B takes against their D takes, find which aligned frames actually differ most, and weight those frames up in the B/D tie-break cost. A data-driven version of the onset idea.
  9. **k-NN vote for the personal profile.** `knnVote` (`dtw.ts:141`) exists but only the `knn` strategy (the general model) uses it; the personal path uses nearest-template `matchTemplates`. With 8+ takes per label from the extra-takes button, a small-k vote may resist a single outlier take winning. Cheap to test in `eval-voice.mts`.
  10. **Augment calibration takes.** Generate extra templates from each recording (slight speed/tempo change, added noise at a few SNRs) instead of asking the user to record more. It builds on the one thing measured to work (more takes), and may help the background-noise problem too. Watch DTW cost as the template pool grows (see the pre-filter note in `dtw.ts`).
  11. **Delta / delta-delta MFCC features.** `mfcc.ts` has none, by an explicit v1 choice ("static coefficients already separate them well"). Deltas are the standard way to capture spectral *movement* such as formant transitions — the cue candidate 1 targets — at almost no cost. Measure on the whole vocabulary, not only B/D, since it changes every match.

  Whichever is tried, evaluate it the same way this section did: leave-one-out over real recordings via `scripts/eval-voice.mts --loo --templates <personal.json>` (see item 5's tooling note — the plain `<wav-dir>` mode measures against the wrong model), scored specifically on the subset of turns where B and D are the top two candidates (not overall accuracy, which a small confusable subset barely moves) — and only then decide whether it's worth wiring into `templateSpeechEngine.ts`.

- **Remove the "General" bundled model and the "Auto" engine preference — personal calibrated profile only. Requested 2026-09-14, not started; needs a product decision before any code changes.** The user asked, mid-way through measuring item 5 above, to strip the app down to only the personal-profile voice path: remove "Auto" and "General" from the Settings → Voice engine picker (`GeneralSettingsSection.tsx:228-274`, labels at `translations.ts:114,116`) and their backing code in `src/utils/speech.ts`, then confirm only the personal `TemplateSpeechEngine` config (`makeProfileEngine`, `speech.ts:602-619`) still drives matching.

  **⚠️ Decision needed before starting — this is not just a cleanup, it changes who has a working voice mode:**
  - `voiceProfile` (personal calibration + the engine picker itself) is **Pro-gated** (`features.ts:14,36`; enforced at `App.tsx:1226-1227` and `GeneralSettingsSection.tsx:229-232` via `ProGate`).
  - The base Tap/Voice answer-mode toggle is **not** gated — every tier, including Free, can turn on `answerMode:'voice'` (`GeneralSettingsSection.tsx:200-224`, no `isPro` check).
  - Today, a Free user (or a Pro user who hasn't calibrated yet) gets voice answers via the **General** bundled model — it's the `'auto'`-pref fallback in `getSpeechEngine()` (`speech.ts:681-687`) and is explicitly documented there as "works before you calibrate."
  - **Remove General with no other change and Free users lose on-device voice matching entirely** — they'd fall through to the flaky online Web Speech API or nothing. The product owner needs to pick one before this is built: (a) make voice-answering itself Pro-only (matches "General" being removed cleanly), (b) leave Free on Web Speech only, (c) something else. Do not guess this — ask.

  **What else the removal touches, already mapped so the next session doesn't have to re-derive it:**
  - `makeGeneralEngine()` (`speech.ts:621-646`) and the `'general'`/`'auto'` branches of `getSpeechEngine()` (`speech.ts:649-690`) — the code to delete/simplify once the decision above is made.
  - `src/utils/generalVoiceTemplates.ts` (1.8MB generated file) and its generator `scripts/build-general-voice.mts` — only removable if nothing else needs the general model; `calibrationGate.ts:58`'s `refSet()` also lazy-imports it, but for a different purpose (gating *calibration* captures against noise/cough, not for answering) — check whether that gate still needs a reference set of some kind before deleting the file wholesale.
  - `eval-voice.mts`'s default `--templates` path and its `--loo` no-recordings-needed mode both depend on `generalVoiceTemplates.ts` existing — decide whether to keep it as a dev-only asset (not shipped, not imported by `speech.ts`) purely for that tooling, or drop general-model tooling entirely.
  - **The "automatic learning" (`ADAPTIVE_PROFILE`, `source: 'learned'`) storage path is already dead code** — nothing currently calls `addTemplate(..., 'learned')` (`useVoiceAnswer.ts`'s `learn()` and `App.tsx`'s `voiceLearnRef` call `engine.learn?.()`, but no `SpeechEngine` implements `.learn()` any more). Safe, low-risk cleanup regardless of the General decision: `ADAPTIVE_PROFILE` (`voiceProfile.ts:264`), `pruneLearnedTemplates` (`voiceProfile.ts:287-302`), the `'learned'` source value and its `calOnly` filtering (`voiceProfile.ts:39-55,188`), the "Reset automatic learning of the general mode" button + `wipeLearned()` (`VoiceCalibration.tsx`, button text at `:584`, translation at `translations.ts:619`), and the now-pointless `.learn?.()` call sites (`useVoiceAnswer.ts:414-415,418`, `App.tsx:395-411`).
  - `voiceSync.ts:51`'s `source: 'cal' | 'learned'` field on the synced row type becomes vestigial too once nothing writes `'learned'` rows — check whether removing it needs a migration note or is safe as a type-only cleanup (old synced rows, if any exist server-side, would just never match the narrower type).

**Section status:** the original four items below are resolved (three delivered, one closed by removing the dead code rather than building the behavior — see its note). The items above were added later and are open.

### DONE

- **Failed-note re-queue doesn't work.** — **RESOLVED, by removal.** `failedFretsRef` was dead code and has been deleted (`useGameEngine: drop dead failedFretsRef`); no code path claims a missed note comes back within the round anymore. This closes the bug but does **not** deliver the "missed notes come back once" behavior. **Product decision 2026-09-08: not wanted as an in-round mechanic.** The want is considered already served by the Premium personal-coach path (weakness detection + spaced repetition), which brings missed positions back across sessions rather than within one round. No further work here.
- **Click sound missing on some buttons.** — **DONE.** The game-end "OK" button (and every other interactive control checked) now goes through the `click()` wrapper.
- **Placement test result isn't applied.** — **DONE** (`Onboarding: apply placement result to Selector difficulty`). `Onboarding`'s `onPlacement` callback is wired to `selector.onDifficultySelect`, which persists the chosen difficulty via `saveSetting('sel_difficulty', …)` — the placement test now actually sets up the Selector, not just tells the user to.
- **Dead/orphaned code: `src/components/Settings.tsx` and `src/design-preview/`.** A substantial alternate settings UI exists but is never imported or rendered by `App.tsx`. This isn't a user-facing bug, but it's misleading to anyone reading the codebase and should be resolved (finish it or remove it) rather than left in limbo. — `Settings.tsx` removed (nothing salvageable; its notation toggle and circle-order controls already live in `SelectorPanel`, and its manual time picker was deliberately replaced by `getTime()`). `design-preview/` is kept intentionally as a design lab.

- **All-time stats mix instruments.** — **DONE.** `historyKey()` already prefixes non-guitar combinations (`bass|…`; guitar stays unprefixed for back-compat), so every *per-combination* stat was already instrument-clean, but the all-time roll-ups flattened the map and lost that. `src/utils/mastery.ts` now has `instrumentOfKey(key)` (numeric leading segment ⇒ guitar; any other token ⇒ that instrument id — generalises to future string instruments with no code change) and `historyForInstrument(allHistory, instrumentId)`. `App.tsx` (note-wheel / fret-grid mastery overlays) and `ProgressPanel.tsx` ("All time" scope + Personal bests, via `allBestsSummary(instrumentId)`) now scope to the played instrument. No `HistoryEntry` field, no schema/migration. This is also the prerequisite for the instrument-scoped Badges.

  ### Implementation plan — Instrument-scoped all-time aggregation

  **Goal:** all-time views show only the current instrument's history, and the mechanism generalises to any future string instrument (ukulele, mandolin, 5-string bass, …) with no per-instrument code.

  **Key insight:** a `historyKey` is `"{strings}|{fret}|{mode}|{diff}"` for guitar and `"{instrumentId}|{strings}|{fret}|{mode}|{diff}"` for everything else. The first `|`-segment of a guitar key is always the comma-joined string list — digits and commas only — so any non-numeric leading segment *is* an explicit instrument id. No registry needed.

  **`src/utils/mastery.ts` — new helpers:**
  ```ts
  // The instrument a stored historyKey belongs to. Guitar keys are unprefixed
  // and start with their string list ("3,4|…"); any other leading token is an
  // explicit instrument id ("bass|3,4|…", "ukulele|…"). Future instruments work
  // with no change here.
  export function instrumentOfKey(key: string): string {
    const first = key.split('|', 1)[0];
    return /^[0-9,]+$/.test(first) ? 'guitar' : first;
  }

  export function historyForInstrument(
    allHistory: Record<string, HistoryEntry[]>,
    instrumentId: string,
  ): HistoryEntry[] {
    const out: HistoryEntry[] = [];
    for (const [key, rows] of Object.entries(allHistory)) {
      if (instrumentOfKey(key) === instrumentId) out.push(...rows);
    }
    return out;
  }
  ```
  Keep `flattenHistory` (still used where an explicit cross-instrument total is wanted, and as the pre-migration fallback) but stop using it for the instrument-specific overlays.

  **`src/App.tsx`:** line ~276, replace
  `flattenHistory(historyOps.allHistory)` → `historyForInstrument(historyOps.allHistory, instrument.id)`, so `fretMasteryMap` / `noteMasteryMap` (the wheel + grid equalizer overlays) are scoped to the instrument being played. Update the `useMemo` deps to `instrument.id`.

  **`src/components/ProgressPanel.tsx`:** it already receives the `instrument` prop. Line 325, replace
  `const all = useMemo(() => flattenHistory(allHistory), [allHistory]);` →
  `const all = useMemo(() => historyForInstrument(allHistory, instrument.id), [allHistory, instrument.id]);`
  The "All time" scope caption becomes "across every settings combination for {instrument label}". `allBestsSummary()` (Personal bests expander) should likewise filter by `instrumentOfKey(key) === instrument.id` — add an optional `instrumentId` arg to `allBestsSummary` in `src/utils/progress.ts`.

  **`src/utils/progress.ts`:** no change to `dailyStats` / `practiceStreak` / `lifetimeTotals` / `weakNotes` themselves — they already take a pre-filtered `entries` array; callers just pass the instrument-scoped list now. `allBestsSummary` gains the optional filter described above.

  **Edge cases:**
  - Legacy guitar rows (saved before bass existed) have unprefixed keys → `instrumentOfKey` returns `'guitar'`. Correct.
  - A malformed / empty key → leading segment fails the numeric test → treated as its own "instrument"; harmless (its rows just never match a real instrument). 
  - Cloud sync: unaffected — keys are stored verbatim, the prefix already round-trips.
  - "Clear all history" still wipes everything across instruments (that is its stated contract).

  **Files touched:** `src/utils/mastery.ts` (2 new helpers), `src/App.tsx` (1 call + deps), `src/components/ProgressPanel.tsx` (1 call + caption), `src/utils/progress.ts` (`allBestsSummary` optional filter). No `HistoryEntry` field, no schema/migration.

---

## 2. Finish Current Product
Work needed to make the Selector-based experience feel complete and polished on its own terms — no new product concepts, just closing out what the current model implies.

### OPEN

- **Ad strip — real ad network + follow-ups** — **first slice landed, the rest OPEN.** The product owner wants ads as a single line pinned to the bottom (or top), never video, shown only while the user is browsing, never mid-drill: a guest sees it on every browsing screen with no close button; a signed-in Free user sees it from app launch (first launch included) and then after a random 1–3 rounds (finished or stopped part-way — both count). In the native app the AdMob banner swaps in a new ad every random 60–90 s while it stays up (set the ad unit's console "Automatic refresh" to Disabled so the two don't stack); the web AdSense strip does not auto-refresh, because AdSense forbids refreshing an ad unit without a user action. Landed: `src/utils/adPacing.ts` (pacing store — every drill engine reports a round end — natural or stopped — and a round start), `src/components/AdBanner.tsx` (mounted once in `main.tsx`, gated by `can('noAds', tier)`, so Pro and Premium never see it) and `src/styles/34-ad-strip.css`. The strip's body is a **house placeholder** ("Your ad could be here. Go Pro to remove ads."). Still open:
  - **Update — provider layer landed** (`src/ads/`): Android-first with iPhone and web behind the same seam. Native (Capacitor Android/iOS) uses AdMob via `@capacitor-community/admob` — an adaptive bottom banner, lazily imported, with the iOS tracking prompt and Google's UMP consent flow run before any ad request. Web uses an AdSense unit (`AdSenseSlot.tsx`) when `VITE_ADSENSE_*` are set, else the house line. With no real ids the native build serves Google's **test** ads only.
  - **Needs the owner's accounts/ids:** an AdMob app + banner unit per platform (put the Android *app* id in `android-overrides/AndroidManifest.xml`, replacing the sample id; the unit id in `VITE_ADMOB_ANDROID_BANNER_ID` as a repo variable), an AdSense publisher + slot for the web (`VITE_ADSENSE_*`), and the UMP consent message configured in the AdMob console.
  - **iPhone:** there is no `ios/` project yet. Once one exists it needs `GADApplicationIdentifier` and `NSUserTrackingUsageDescription` in Info.plist and the SKAdNetwork list; the JS side is ready.
  - **Web consent** — a CMP banner for EEA/UK visitors before AdSense goes live, and a privacy-policy update (native consent is already handled by UMP).
  - **Privacy policy — first draft landed, OPEN items.** `public/privacy.html` (Hebrew + English, deployed at `/fretquency/privacy.html`) is linked from the Account drawer. Still needed: (1) **contact address — deferred until the owner opens a company**: for now both languages point users to the in-app feedback board (sign-in required), and must be updated with a real email once one exists (Google Play and the OAuth consent screen expect one); (2) a real account-deletion path — today deletion is "email us" only, and Google Play requires an in-app way plus a web page to request it; (3) a legal review of the wording; (4) enter the URL in the Play Console (store listing + Data safety form), the Google OAuth consent screen, and AdMob/AdSense; (5) re-check the text against the ad consent flow once the web CMP banner exists.
  - Add a settings row that calls `openAdPrivacyOptions()` (already written) so users can revisit their ad-consent choice.
  - Make the placeholder line tappable so it opens the upgrade drawer.
  - Decide whether the pacing counter should persist across launches (today it is in-memory, so each launch starts a fresh 1–3 cycle) and whether the Game's own stage screens need any extra treatment.

- **Badge art + earn-animation redesign** — **PLANNED, in progress, blocked on art assets.** The product owner rejected the current uniform struck-metal disc (`src/components/BadgeMedal.tsx`) — every badge the same circle, only a thin line emblem and metal tint changing — as "round, uniform and boring". Target look: the app's hamburger-menu tab icons (`src/assets/menu-icons/*.png`) — chunky 3D-rendered metallic objects, each with its own silhouette and personality. Direction agreed:
  - Each badge *family* becomes its own sculpted object (a flame, a trophy cup, a neck slice, a target), rendered as **raster PNGs generated in Gemini**, not SVG. Tier (bronze/silver/gold/platinum) = the metal finish on that same object. Instrument variants stay visually distinct (see the badge-scoping memory).
  - **Front and back faces per (family × tier).** The back must be the *same meaningful object seen from behind* (a flame from the back is still a flame) — explicitly **not** a generic shared back-plate.
  - New `<BadgeImage>` component picks the PNG by (id, instrumentId, tier, face) from a manifest, with the existing `<BadgeMedal>` SVG as fallback for families without art yet. Touches `BadgeGrid.tsx`, `BadgeCelebration.tsx`, `PinnedBadges.tsx`.
  - **End-of-round reveal animation** (`badge-reveal-fly` in `src/styles/17-celebrations.css`): replace the current in-plane `rotate(-1080deg)` Z-spin with a **drop + bounce + horizontal Y-axis spin** (right-to-left, suits the RTL app), using `perspective` + two `backface-visibility: hidden` layers so the Gemini-rendered back face flashes past during the spin. Keep the existing `prefers-reduced-motion` and `rushing` (2×) handling.
  - First pass covers only the 4 prototype badges (On Fire, Marathoner, String Master, Perfect Session); pipeline proven there, then scaled. Asset volume across all ~25+ families × tiers × 2 faces × instrument variants is a real bundle / PWA-offline-cache concern to weigh when scaling.
  - SVG-filter exploration of the sculpted silhouettes (as an alternative to raster) lives in the "Badge Silhouettes" design canvas; the product owner chose the raster/Gemini route over it for the warmth the painted look gives.
  - **Update 2026-09-07:** a first sculpted-metal figurine for **On Fire** plus a new **Y-axis earn spin** were tried; the figurine was reverted (art not right yet) but the earn spin was kept. So the reveal-animation half of this item has a landed first step; the per-family art is still the blocker.

### DONE

- **Settings panel polish/completion.** — **DONE.** The hamburger settings now open each section as its own full page (`Hamburger settings: each section opens as its own full page`), rebuilt in the Stats & Progress visual language, including RTL layout for Hebrew (`Settings + stats panels: lay out right-to-left in Hebrew`). Notation (A-B-C/solfege), circle order, and time all live inside the live `SelectorPanel.tsx` / settings flow as intended.
- **`?` info affordance** — **DONE.** The bubble auto-pops once for a brand-new player with no history (`Selector "?" hint: auto-pop once for brand-new players`) and otherwise opens/closes manually via the "?" affordance, matching the originally described behavior.
- **Toggle button visual state before interaction** — **DONE.** Un-toggled controls carry a `1px dashed` border (`src/styles/02-settings.css`) to distinguish them before interaction.
- **Order-switcher layout stability** — **CLOSED, verified as a non-issue.** Code review found only one reflow vector: `.order-chip-active` (`src/styles/10-stages.css`) adds `font-weight: bold`, so the active Alpha/Fifths (and A-B-C / Do-Re-Mi) chip grows ~1–3px on toggle. It is horizontal only and bounded — `.mode-order-col` is `max-width: 80px` + `overflow: hidden`, and by explicit design does not drive `.mode-cards` row height, so there is no vertical jump and the fret neck below never moves. The product owner checked the running app (Alpha↔Fifths, A-B-C↔Do-Re-Mi) and judged the width shimmer not noticeable ("לא מפריע"). No fix needed; a `min-width` on `.order-chip` remains an option if it ever regresses.

---

## 3. Confirmed Future Features
Features from the old roadmap that are clearly still desired and map cleanly onto the Selector model with no dependency on Stages, backend, or monetization.

### OPEN

- **Adaptive timer** — tightens/relaxes based on streak, within a session. Not built — no evidence in `useGameEngine.ts`/`useScoring.ts`.
- **Session summary card on stop** — **DONE.** The `game-end-summary` card shows score, streak, accuracy vs. answered count, and feeds into the personal-best flow.

  ### Implementation plan — Celebration tiers

  Much of this already exists: `celebrateTier1` (cyan ring + floating `+points` on every correct answer), `celebrateTier2` (three gold rings + banner on streak milestone 3/5/10), and `celebrateTier3` (full-screen "NEW BEST!" card at game end) are all wired through `src/utils/feedback.ts`, `src/hooks/useGameEngine.ts`, and `src/App.tsx`. The work is completing and tiering it, not building from scratch.

  **Tier model (four in-session tiers + one end-of-game tier):**

  | Tier | Internal name | Trigger | Typical frequency |
  |---|---|---|---|
  | 0 | `tick` | Correct answer that does not open or continue a streak of ≥3 (i.e. streak 1–2) | Every correct answer early in a round |
  | 1 | `small` | Correct answer at streak ≥3 that is not a milestone | Frequent |
  | 2 | `milestone` | Streak reaches exactly 3 / 5 / 10 | Occasional |
  | 3 | `major` | Streak reaches 15 / 20 / 25 / 30… (`streak >= 15 && streak % 5 === 0`), **or** a new personal best streak is broken mid-game (`streak > longestStreakEver`) | Rare |
  | 4 | `grand` | Game ends with a new personal best score (the existing Tier3) | Very rare |

  Tier 0 keeps the start of a round visually quiet (chime + floating text, no ring) so excitement accumulates. From streak 15 up, every multiple of 5 is `major`, not only 15/20. A new personal-best streak is read from a new single-value localStorage key `stat_longestStreakEver` (all-time, not scoped to `historyKey()`), updated in `onCorrect`; by default it is **not** wiped by "Clear History".

  **`src/hooks/useScoring.ts`:**
  - Add `export type CelebrationTier = 'tick' | 'small' | 'milestone' | 'major';`
  - Extend `ScoreResult` with `tier: CelebrationTier` and `isStreakRecord: boolean` (keep `milestone` for now for backward compatibility).
  - In `onCorrect`, after computing `streak`:
    ```ts
    const prevRecord = loadSetting('stat_longestStreakEver', 0);
    const isStreakRecord = streak > prevRecord && streak >= 5;
    if (streak > prevRecord) saveSetting('stat_longestStreakEver', streak);

    let tier: CelebrationTier;
    if (streak >= 15 && streak % 5 === 0) tier = 'major';
    else if (isStreakRecord) tier = 'major';
    else if (streak === 3 || streak === 5 || streak === 10) tier = 'milestone';
    else if (streak >= 3) tier = 'small';
    else tier = 'tick';
    ```

  **`src/hooks/useGameEngine.ts` — `scoreCorrect`:**
  ```ts
  const scoreCorrect = useCallback((elapsedSeconds: number): ScoreResult => {
    const result = onCorrect(elapsedSeconds, questionTimeRef.current);
    playCorrectChime();
    playStreakTone(result.streak);            // see Audio refinements plan

    if (!showScore) { haptic.correct(); return result; }   // Score off: haptics only

    const scoreEl = document.getElementById('live-score');
    switch (result.tier) {
      case 'tick':
        if (scoreEl) celebrateTier1(scoreEl, `+${result.points}`, '#0ff', { ring: false });
        haptic.correct();
        break;
      case 'small':
        if (scoreEl) celebrateTier1(scoreEl, `+${result.points}`, '#0ff', { ring: true });
        haptic.correct();
        break;
      case 'milestone':
        celebrateTier2(`${result.streak} STREAK!`);
        haptic.milestone();
        break;
      case 'major':
        celebrateMajor(
          result.isStreakRecord ? `NEW BEST STREAK · ${result.streak}` : `${result.streak} STREAK!`,
        );
        haptic.major();
        break;
    }
    return result;
  }, [onCorrect, showScore]);
  ```
  `celebrateTier1` gains an optional fourth argument `{ ring?: boolean }` (default `true`); when `false` it renders only the floating text.

  **Per-tier visuals:**
  - `tick` — floating `+N` in `#0ff`, existing `float-up` animation (800ms), above `#live-score`. No ring.
  - `small` — same, plus the existing cyan ring: `radial-pulse-cyan`, 400ms, 40px start diameter, `border: 2px solid #0ff`, from the centre of `#live-score`.
  - `milestone` — three gold rings `celebrate-ring-gold` (existing: 96px, `border 3px #ffd700`, `radial-pulse-gold` 700ms) with `animation-delay` 0 / 100 / 200ms, from screen centre; plus the existing `milestone-banner` (`top: 34%`, gold, `milestone-drop` 300ms) reading `"{streak} STREAK!"`, removed after 1500ms.
  - `major` — new `celebrateMajor(text)`: four gold rings, 120px start diameter, `border: 4px solid #ffd700`, `animation-delay` 0/90/180/270ms, 900ms duration; a gentle screen shake via a `celebrate-shake` class on `document.body` for 320ms (`@keyframes celebrate-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }`); a larger banner variant `.milestone-banner.major` (`font-size: 1.6rem`, `top: 30%`, background `rgba(40,30,0,0.96)`, stays 1800ms); a pulsing `box-shadow` flare on `#live-score` for 400ms (class `score-flare`). Does **not** pause the game and does **not** wait for a click.
  - `grand` — unchanged `celebrateTier3` from `src/utils/feedback.ts`, called from `src/App.tsx` at game end; add a `celebrateGrand` alias for naming consistency.

  **Haptics — extend `haptic` in `src/utils/feedback.ts`:**
  ```ts
  export const haptic = {
    correct:     () => vibrate(30),
    wrong:       () => vibrate([30, 40, 30]),
    milestone:   () => vibrate([60, 40, 60]),
    major:       () => vibrate([90, 40, 90, 40, 140]),   // new
    stageChange: () => vibrate(60),
    tap:         () => vibrate(10),
  };
  ```
  (`grand` already vibrates `[100, 50, 100]` inside `celebrateTier3` — leave it.)

  **`prefers-reduced-motion`:** add `const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;` at the top of `src/utils/feedback.ts`. When true, `celebrateTier1` / `celebrateTier2` / `celebrateMajor` skip creating ring elements and the `celebrate-shake`, keeping only the floating text / banner, with duration cut to 600ms and a fade-only entrance (no `scale`). Sounds and haptics are unaffected by reduced-motion.

  **Lifecycle / edge cases:**
  - Score off (`showScore === false`): no visual celebration and no `playStreakTone`; only `haptic.correct` + `playCorrectChime`.
  - Pause mid-round: celebrations are fire-and-forget with a `setTimeout` cleanup and are short (<1s), so they are not pause-aware.
  - Stop: elements live under `getContainer()`, which stays in the DOM; their removal `setTimeout` still runs — no leak.
  - `stat_longestStreakEver` is an emotional record, not scoped stats; default is to leave it out of "Clear History" (product decision — flip only if desired).
  - Streak 12 → 15 fires `major`; 16–19 fire `small`; 20 fires `major` again.

  **Files touched:** `src/hooks/useScoring.ts`, `src/hooks/useGameEngine.ts`, `src/utils/feedback.ts`, `src/index.css` (`celebrate-shake`, `.milestone-banner.major`, `.score-flare`, major rings, reduced-motion variants).
- **Adaptive timer** — tightens/relaxes based on streak, within a session. Not built — no evidence in `useGameEngine.ts`/`useScoring.ts`.
- **Audio refinements (B1/B2)** — escalating streak tone (`playStreakTone`) and the background-beats toggle. Single-note question sound and satisfying correct chime already exist; what is missing is B1 (escalating streak tone), B2 (background beats toggle), and B3 (Silent Mode). B3 is **DONE** (see below). B1/B2 have detailed implementation plans below but are **not built**. `src/utils/audio.ts` and `src/utils/feedback.ts` each carry a module-level `_silent` flag with a `setSilent(v)` setter; the question-note entry points (`playNote` / `playNoteSingle` / `playNoteSequence` / `beep`) and the content-audio entry points (`playCorrectChime`, `playBadgeFanfare`, and the ascending tone block inside `celebrateTier3`) early-return when it is set. `App.tsx` holds `pref_silentMode` and pushes it to both modules via an effect (`setSilent` is imported aliased from each). A `SettingCard` toggle lives in the existing `settings` drawer section (not a new section — the plan below predates that refactor). UI clicks, all haptics and every on-screen celebration (rings, banners, NEW BEST card) keep working; not Pro-gated; no new CSS or assets. `advanceAfterSound` falls back to the normal read-the-answer `minDelay` when no sound is in flight. The B1/B2 pieces of the plan below (`playStreakTone`, background beats, `beat-loop.mp3`, `vite.config.ts` precache) remain unbuilt.

  ### Implementation plan — Audio refinements + Silent Mode

  Single-note question sound (`playNoteSingle`) and the satisfying correct chime (`playCorrectChime`, a C-E-G major triad) already exist in `src/utils/audio.ts` / `src/utils/feedback.ts`. What is missing is the **escalating streak tone**, the **background beats toggle**, and **Silent Mode**. All Web Audio sounds follow the existing convention: a short oscillator burst through `getCtx()`, `gain.setValueAtTime` → `exponentialRampToValueAtTime`, times in seconds of `ctx.currentTime`.

  #### B1 — Escalating streak tone `playStreakTone(streak)` (new, `src/utils/feedback.ts`)

  Played **together with** `playCorrectChime` on every correct answer (the escalation is the point, so it is not gated to high streaks — but it stays silent below streak 3). Pitch steps up with the streak, mirroring `STREAK_TIERS`:

  | Streak | Note | Freq (Hz) | Waveform | Peak gain | Duration |
  |---|---|---|---|---|---|
  | 0–2 | — | (does not play; chime alone) | | | |
  | 3–4 | E5 | 659.25 | `triangle` | 0.06 | 0.10s |
  | 5–6 | G5 | 783.99 | `triangle` | 0.07 | 0.10s |
  | 7–9 | B5 | 987.77 | `triangle` | 0.08 | 0.11s |
  | 10–14 | D6 | 1174.66 | `triangle` | 0.09 | 0.12s |
  | 15–19 | E6 | 1318.51 | `triangle` | 0.10 | 0.12s |
  | 20+ | G6 | 1567.98 | `triangle` | 0.11 | 0.13s |

  ```ts
  export function playStreakTone(streak: number) {
    if (_silent) return;                       // see B3
    const step = STREAK_TONE_STEPS.find(s => streak >= s.min && streak <= s.max);
    if (!step) return;                          // streak < 3
    const ctx = getCtx(); if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = step.freq;
    osc.connect(gain); gain.connect(ctx.destination);
    const t = ctx.currentTime + 0.04;          // 40ms after the chime onset, so attacks don't collide
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(step.gain, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + step.dur);
    osc.start(t); osc.stop(t + step.dur);
  }
  ```
  No need to update `_chimeEndTime`: the streak tone is shorter than `CHIME_TAIL` (0.4s) and is swallowed by it, so `correctChimeRemainingMs()` still covers it.

  #### B2 — Background beats toggle (new)

  **Asset:** `public/sounds/beat-loop.mp3` — a clean 1–2 bar loop (kick + hi-hat, ~90 BPM), 2–4s, normalised quiet. Loaded once and cached like `stick-click.mp3`. The service worker already precaches files under `sounds/`; confirm the pattern in `vite.config.ts` includes it.

  **`src/utils/audio.ts`:**
  ```ts
  let _beatBuffer: AudioBuffer | null = null;
  let _beatSource: AudioBufferSourceNode | null = null;
  let _beatGain: GainNode | null = null;

  export async function startBackgroundBeat() {
    if (_silent || _beatSource) return;
    const ctx = getAudioCtx();
    if (!_beatBuffer) _beatBuffer = await loadBeatBuffer(ctx);
    if (!_beatBuffer) return;
    _beatGain = ctx.createGain();
    _beatGain.gain.value = 0.14;               // low bed, doesn't compete with the question note
    _beatSource = ctx.createBufferSource();
    _beatSource.buffer = _beatBuffer;
    _beatSource.loop = true;
    _beatSource.connect(_beatGain);
    _beatGain.connect(ctx.destination);
    _beatSource.start();
  }

  export function stopBackgroundBeat() {
    try { _beatSource?.stop(); } catch { /* already stopped */ }
    _beatSource?.disconnect(); _beatGain?.disconnect();
    _beatSource = null; _beatGain = null;
  }

  export function pauseBackgroundBeat()  { if (_beatGain) _beatGain.gain.value = 0; }
  export function resumeBackgroundBeat() { if (_beatGain) _beatGain.gain.value = 0.14; }
  ```

  **Lifecycle in `src/App.tsx`:**
  - Preference: `const [backgroundBeats, setBackgroundBeats] = useState(() => loadSetting('pref_backgroundBeats', false));`
  - `start()`: if `backgroundBeats && !silentMode` → `startBackgroundBeat()`.
  - `stop()` (and game-end): `stopBackgroundBeat()`.
  - `pause()`: `pauseBackgroundBeat()`; `resume()`: `resumeBackgroundBeat()`.
  - Toggling mid-game: if `running`, start/stop immediately to match.

  **UI:** a new section in `settingsSections` (`src/App.tsx`), after `score`:
  ```
  id: 'beats'
  title: '🥁 Background beats'
  blurb: 'A quiet rhythm loop under the drill to keep your pace. Off by default. Muted automatically in Silent mode.'
  body: On/Off using notation-row + order-chip (like the Score section)
  ```
  When `silentMode` is on, the buttons get `chip-disabled` and do nothing.

  #### B3 — Silent Mode (new) — **DONE**, see the item summary above. The build follows this plan except: the flag guards `playBadgeFanfare` too (added after this plan was written), there is no `startBackgroundBeat` to guard (B2 unbuilt), and the toggle is a `SettingCard` in the existing `settings` section rather than a standalone drawer section.

  **Shared module flag.** In both `src/utils/audio.ts` and `src/utils/feedback.ts`:
  ```ts
  let _silent = false;
  export function setSilent(v: boolean) { _silent = v; }
  ```
  - `src/utils/audio.ts`: early-return `if (_silent) return;` at the top of `playNote`, `playNoteSingle`, `playNoteSequence`, `beep`, `startBackgroundBeat`. When `setSilent(true)` is called while the beat loop is running, also call `stopBackgroundBeat()`.
  - `src/utils/feedback.ts`: early-return `if (_silent) return;` at the top of `playCorrectChime`, `playStreakTone`, and the tone sequence inside `celebrateTier3`. **Not** in `playClickSound` / `playToggleOn/Off` / `playStickClick` — those are UI sounds, not drill content; Silent Mode only concerns the drill's content audio.
  - `celebrateTier1/2/major/grand` visuals and haptics keep working in Silent Mode.

  With no sound in flight, `correctChimeRemainingMs()` / `soundRemainingMs()` return 0, so `advanceAfterSound` in `src/hooks/useGameEngine.ts` falls back to `minDelay` (the normal read-the-answer pauses). Fine.

  **Preference + wiring in `src/App.tsx`:**
  ```ts
  const [silentMode, setSilentMode] = useState(() => loadSetting('pref_silentMode', false));
  useEffect(() => {
    setAudioSilent(silentMode);
    setFeedbackSilent(silentMode);
  }, [silentMode]);
  ```
  (Two named imports, since `setSilent` is exported from both modules.)

  **UI:** a new section in `settingsSections`, after `score`:
  ```
  id: 'silent'
  title: '🔇 Silent mode'
  blurb: 'Visual-only questions — no note playback, chime or beats. Haptics and on-screen celebrations stay on. Great for practising with headphones off or a guitar in hand.'
  body: On/Off (notation-row + order-chip)
  ```
  Turning Silent Mode on visually disables the Background beats section.

  #### Interaction between the three audio pieces

  | Mode | Question note | Chime | Streak tone | Background beats | UI sounds | Haptics | Visual celebrations |
  |---|---|---|---|---|---|---|---|
  | Normal | ✓ | ✓ | ✓ (streak ≥3) | per toggle | ✓ | ✓ | per Score |
  | Score off | ✓ | ✓ | ✗ | per toggle | ✓ | ✓ | ✗ |
  | Silent Mode | ✗ | ✗ | ✗ | ✗ (stopped) | ✓ | ✓ | per Score |

  **Files touched:** `src/utils/feedback.ts`, `src/utils/audio.ts`, `src/App.tsx` (`pref_silentMode` + `pref_backgroundBeats`, `setSilent` effect, `start/stop/pause/resume` wiring, two new drawer sections), `vite.config.ts` (ensure `beat-loop.mp3` is precached), `public/sounds/beat-loop.mp3` (new asset).

  #### Suggested build order (both features)

  1. `setSilent` + Silent Mode (flag infrastructure, drawer section) — small, self-contained.
  2. Celebration tiers (`useScoring` + `useGameEngine` + `celebrateMajor` + CSS).
  3. `playStreakTone` — depends on the streak number from step 2.
  4. Background beats — largest (asset + pause/resume/stop lifecycle).

### DONE

- **Scoring system** — **DONE.** Points, speed bonus, streak multiplier, live score counter all shipped (`useScoring.ts`).
- **Session summary card on stop** — **DONE.** The `game-end-summary` card shows score, streak, accuracy vs. answered count, and feeds into the personal-best flow.
- **Silent Mode (B3)** — visual-only questions, no audio. **DONE** (`Add Silent mode: mute drill content audio, keep UI sounds and celebrations`). `src/utils/audio.ts` and `src/utils/feedback.ts` each carry a module-level `_silent` flag with a `setSilent(v)` setter; the question-note entry points (`playNote` / `playNoteSingle` / `playNoteSequence` / `beep`) and the content-audio entry points (`playCorrectChime`, `playBadgeFanfare`, and the ascending tone block inside `celebrateTier3`) early-return when it is set. `App.tsx` holds `pref_silentMode` and pushes it to both modules via an effect (`setSilent` is imported aliased from each). A `SettingCard` toggle lives in the existing `settings` drawer section (not a new section — the plan below predates that refactor). UI clicks, all haptics and every on-screen celebration (rings, banners, NEW BEST card) keep working; not Pro-gated; no new CSS or assets. `advanceAfterSound` falls back to the normal read-the-answer `minDelay` when no sound is in flight. The B1/B2 pieces of the plan above (`playStreakTone`, background beats, `beat-loop.mp3`, `vite.config.ts` precache) remain unbuilt.
- **Mastery heatmap** on the note circle, colored by per-note/per-string success rate — **DONE.** `fretMasteryMap`/`noteMasteryMap` (`src/utils/mastery.ts`) drive the equalizer-style overlay on both the note wheel and fret grid, with a dedicated on/off toggle now living in the Stats & progress screen (`Move "Mastery on the fretboard" toggle into the Stats & progress screen`).
- **Progress chart** — accuracy % and avg response time trend across recent sessions. **DONE** (`Add a progress trend chart to the Daily timeline`). `ProgressPanel.tsx` now has a `TrendChart` component: two stacked inline-SVG sparklines over the last 30 dated days — accuracy % on a fixed 0–100 axis above, average response time in seconds below — sharing an X axis of dates, rendered above the existing daily bar list inside the "Daily timeline" expander. History has no session marker, so the trend is **per-day** via `dailyStats` (the wishlist's "across recent sessions" wording is per-day in practice). Hidden when fewer than two dated days exist, so the bar list / empty-state text carries the screen instead. The SVG wrapper is forced `dir="ltr"` so time reads oldest-left in Hebrew; styles in `src/styles/07-stats.css` (`.sp2-trend*`); no chart library, no schema change; it renders whatever `history` it is handed, so the free 7-day view window applies with no extra gating.
- **Badges** — Speed Demon, Perfect Session, String Master, streak-based (e.g. 5-of-7 days), Most Improved — all computable from existing history data. **DONE, and shipped well beyond this plan's original scope.** `src/utils/badges.ts` + `BadgeGrid.tsx`/`BadgeMedal.tsx` implement a full "Achievements wall": every session/lifetime badge is now a **family with up to four ordered levels** (Bronze/Silver/Gold, Platinum where a milestone earns a fourth rung), several badges beyond the original list (`every_string`, `both_ends`, `quick_read`, `doubling_up`, `low_end`), and a third badge kind — **role badges** (e.g. an `admin` badge tied to the new `public.admins` account role) — that the original plan didn't anticipate. The collection screen itself went through two redesign passes (`Badges: redesign the collection screen as a game-like Achievements wall`, `Badges: sharpen the Achievements wall — locked, tier ladder, density`). The API below (`evaluateSession`/`evaluateLifetime`/`awardBadge`) is superseded by the shipped tiered version; treat this plan as historical context, not the current shape.

  ### Implementation plan — Badges

  **Data reality (what's actually stored today):**
  - `useHistory` keeps a flat `allHistory: Record<historyKey, HistoryEntry[]>` in localStorage (`selectorHistory`) and mirrors it to the cloud per account. `HistoryEntry = { note, fret, string, seconds, skipped, correct: boolean|null, id?, createdAt? }`. `createdAt` (ISO) exists only on rows recorded after id/timestamp stamping was added — older rows have none.
  - **Sessions are not delimited in stored history** — there is no "round" record, only a flat list of questions. Per-session facts (score, streak, accuracy) live only in `useScoring.session` in memory during a round, plus the per-`historyKey` `best_<key>` `PersonalBest` record (`{ score, streak, accuracy }`).
  - `src/utils/progress.ts` already derives, as pure functions over the flattened history: `dailyStats` (per calendar day: count, accuracy, avgSeconds — skips rows with no `createdAt`), `practiceStreak` (current/longest consecutive practice-day run), `lifetimeTotals` (totalQuestions, accuracy, avgSeconds, bestSeconds, daysPracticed), `weakNotes`.
  - The celebration-tiers plan adds a single-value key `stat_longestStreakEver`.

  Consequence: **session badges are evaluated at game-end going forward** (from `useScoring.session` + this round's `historyOps.history`) and then persisted as an earned record; they are not back-computed from flat history. **Lifetime badges** are pure functions over `allHistory` and are re-checked both at game-end and whenever the Stats screen opens (retroactive catch-up).

  **Instrument scoping:** lifetime badges operate on `historyForInstrument(allHistory, instrument.id)` (see the "Instrument-scoped all-time aggregation" plan in §1, which is built first). String/fret-shaped badges are therefore per-instrument: earning `full_neck` on guitar is separate from earning it on bass. Per-instrument earned records are keyed `"{badgeId}@{instrumentId}"` in the store for the instrument-scoped badges; session badges and the non-instrument lifetime badges (`century`, `week_warrior`, …) use the bare `badgeId`.

  #### Badge set

  **Session badges** — `evaluateSession({ questionsAnswered, maxQuestions, longestStreak, entries })`, where `maxQuestions` is the whole run's total (`totalRunQuestions(...)`, so Auto Advance multi-stage runs count as one) and `entries` is this round's rows:

  | id | Name | Icon | Condition |
  |---|---|---|---|
  | `perfect_session` | Perfect Session | 🎯 | `questionsAnswered >= 10` and every answered question is `correct === true` (no wrong, no timeout, no skip) |
  | `speed_demon` | Speed Demon | ⚡ | `>= 10` correct answers in the round, and `>= 8` of them with `seconds <= 1.5` |
  | `flawless_sprint` | Flawless Sprint | 🏁 | round ran to completion (`questionsAnswered === maxQuestions`) with round accuracy `>= 90%` |
  | `on_fire` | On Fire | 🔥 | `longestStreak >= 15` in the round |
  | `comeback` | Comeback | 💪 | `>= 3` misses (wrong+timeout) in the first half of the round, then finished with a closing streak `>= 8` |

  **Lifetime badges** — `evaluateLifetime({ allEntries, instrument })`, pure over the flattened `allHistory`:

  | id | Name | Icon | Condition | Progress target |
  |---|---|---|---|---|
  | `string_master_s{n}` | String Master · {string label} | 🎸 | on string `n`: `>= 40` answered questions **and** accuracy `>= 90%`. One badge per string of the current instrument — 6 for guitar (`s1`…`s6`), 4 for bass — generated from `instrument.stringLabels`. | 40 |
  | `string_master_all` | Full String Master | 🎸✨ | every `string_master_s{n}` for the current instrument is earned | n of stringCount |
  | `week_warrior` | Week Warrior | 📅 | some window of 7 consecutive calendar days contains `>= 5` distinct practice days (slide a 7-day window over `dailyStats` dates) | 5 |
  | `dedicated` | Dedicated | 🗓️ | `practiceStreak().longest >= 7` | 7 |
  | `century` | Century | 💯 | `lifetimeTotals.totalQuestions >= 100` | 100 |
  | `marathoner` | Marathoner | 🏆 | `lifetimeTotals.totalQuestions >= 1000` | 1000 |
  | `sharpshooter` | Sharpshooter | 🎯 | lifetime accuracy `>= 85%` over `>= 200` questions | 200 (gated) |
  | `most_improved` | Most Improved | 📈 | `daysPracticed >= 10` and mean accuracy of the latest 5 practice days `>=` mean accuracy of the earliest 5 practice days `+ 0.20` | — |
  | `full_neck` | Full Neck | 🛤️ | at least one answered question on **every** fret `0..instrument.maxFret` across all-time history | `maxFret + 1` |

  #### New module — `src/utils/badges.ts`

  ```ts
  // Fixed-identity badges. String Master is per-string and generated at
  // runtime from the instrument (`string_master_s1`…), so those ids are not
  // listed here.
  export type FixedBadgeId =
    | 'perfect_session' | 'speed_demon' | 'flawless_sprint' | 'on_fire' | 'comeback'
    | 'string_master_all' | 'week_warrior' | 'dedicated' | 'century' | 'marathoner'
    | 'sharpshooter' | 'most_improved' | 'full_neck';
  export type BadgeId = FixedBadgeId | `string_master_s${number}`;

  export type BadgeKind = 'session' | 'lifetime';

  export interface BadgeDef {
    id: BadgeId;
    name: string;
    icon: string;
    blurb: string;           // one line: how to earn it
    kind: BadgeKind;
    instrumentScoped: boolean; // true → stored/earned per instrument
    target?: number;         // for the locked-state progress bar
  }
  // The fixed defs; the per-string String Master defs are produced by
  // stringMasterBadges(instrument) and concatenated by badgeList(instrument).
  export const FIXED_BADGES: readonly BadgeDef[];
  export function stringMasterBadges(instrument: InstrumentConfig): BadgeDef[];
  export function badgeList(instrument: InstrumentConfig): BadgeDef[];

  export interface EarnedBadge { earnedAt: string; }        // ISO
  // Store key: bare `badgeId` for non-instrument badges, `"{badgeId}@{instrumentId}"`
  // for instrument-scoped ones. localStorage key: 'badges'.
  export type BadgeStore = Record<string, EarnedBadge>;

  export function loadBadges(): BadgeStore;
  export function isEarned(id: BadgeId, instrumentId?: string): boolean;
  export function awardBadge(id: BadgeId, instrumentId?: string): boolean;  // true only if NEWLY earned

  export interface SessionSnapshot {
    questionsAnswered: number;
    maxQuestions: number;
    longestStreak: number;
    entries: HistoryEntry[];
    instrument: InstrumentConfig;
  }
  export interface LifetimeSnapshot {
    instrumentEntries: HistoryEntry[];   // already filtered via historyForInstrument
    instrument: InstrumentConfig;
  }
  export function evaluateSession(s: SessionSnapshot): BadgeId[];
  export function evaluateLifetime(l: LifetimeSnapshot): BadgeId[];
  export function badgeProgress(
    id: BadgeId, l: LifetimeSnapshot,
  ): { current: number; target: number } | null;
  ```
  `evaluateSession` returns only non-instrument-scoped ids plus, where relevant, none that are instrument-scoped (session badges are not instrument-scoped in v1). `evaluateLifetime` returns instrument-scoped ids; the caller passes `l.instrument.id` to `awardBadge`. `string_master_all` is derived: `evaluateLifetime` includes it when every `string_master_s{n}` for `l.instrument` is already earned (or earned in this same pass).

  Storage is local-only for v1, following `stat_longestStreakEver`. Cloud write-through (a `badges` table alongside `best_<key>`, plus merge on sign-in in `src/utils/sync.ts`) is a **phase 2** follow-up, noted here, not built now.

  #### Wiring

  **`src/App.tsx` — game-end effect (the `wasRunningRef` block, ~line 652):** after the personal-best branch, build a `SessionSnapshot` (`scoring.session.questionsAnswered`, `totalRunQuestions(selector.state.difficulty, selector.state.autoAdvance)`, `scoring.session.longestStreak`, `historyOps.history`, `instrument`) and a `LifetimeSnapshot` (`historyForInstrument(historyOps.allHistory, instrument.id)`, `instrument`). Call `evaluateSession` + `evaluateLifetime`; for each returned id call `awardBadge(id, instrument.id)` and collect the ones that come back `true` into a new `newBadges` state array. Guard with a `badgesFiredRef` like `tier3FiredRef` so a re-run of the effect doesn't double-fire.

  **Game-end summary card (~line 1233):** when `newBadges.length > 0`, render a row per newly earned badge — `🏅 New badge · {name}`. Fire one `celebrateTier2(`🏅 ${name of newBadges[0]}`)` (or a dedicated `celebrateBadge`, gold, same ring+banner language) — **gated on `showScore`** like every other celebration, and it inherits the `prefers-reduced-motion` handling from the celebration-tiers plan. Awarding itself is **not** gated — badges accrue in Silent Mode / Score-off.

  **Home of the badge grid — the Account section (`src/App.tsx`, `settingsSections` id `account`, ~line 924):** render a **Badges** block inside the Account section body, shown in both the signed-in and signed-out states (below the sign-in / sign-out card). Because that section only exists when `auth.configured`, also register a standalone always-present drawer section **`🏅 Badges`** (id `badges`) right after `account` whose body is the same `<BadgeGrid>` component — the Account block and the standalone section share one component. Add a one-line earned summary (`🏅 7 / 21`) to the Account card header.
  - `<BadgeGrid instrument={instrument} />`: on mount, run `evaluateLifetime` once over `historyForInstrument(allHistory, instrument.id)` and `awardBadge` any that qualify (retroactive catch-up). Then render `badgeList(instrument)` as a responsive grid. Earned → full-colour tile: icon, name, `earnedAt` date. Locked → greyed tile; if `badgeProgress` returns a value, a thin bar `current / target`. Instrument-scoped badges show the current instrument's state; a small caption notes "for {instrument label}".
  - `src/index.css`: add `.badge-grid`, `.badge-tile`, `.badge-tile.locked`, `.badge-progress`, reusing the `SettingCard` / drawer-page styling.
  - The Stats screen (`ProgressPanel`) does **not** get the grid; it may keep a single hero-tile "🏅 {earned count}" that deep-links to the Badges section. Optional, low priority.

  #### Lifecycle / edge cases

  - Badges are achievements: by default **not** wiped by "Clear history" / "Clear all history" (consistent with `stat_longestStreakEver`). Flip only on an explicit product call.
  - Score off / Silent Mode: badges are still evaluated and awarded; only the game-end badge *celebration* is suppressed (it's a `showScore` effect).
  - Auto Advance run: one run = one session evaluation; `maxQuestions` = summed run total so `flawless_sprint` means the whole run.
  - Legacy rows without `createdAt`: day-based badges (`week_warrior`, `dedicated`, `most_improved`) skip them (same as `dailyStats`); count-based badges (`century`, `marathoner`, `full_neck`, `string_master_s{n}`) include them.
  - Instrument-scoped badges depend on the §1 "Instrument-scoped all-time aggregation" work landing first (`historyForInstrument`). `string_master_s{n}` / `string_master_all` / `full_neck` are tracked separately per instrument via the `"{badgeId}@{instrumentId}"` store key, so a new string instrument added later automatically gets its own set with no code change.
  - `most_improved` needs `daysPracticed >= 10` to avoid rewarding two-day noise.
  - Re-award safety: `awardBadge` is idempotent — writes `earnedAt` only on first earn, returns `false` afterwards, so the "new badge" celebration never repeats.

  #### Files touched

  | File | Change |
  |---|---|
  | `src/utils/badges.ts` | **new** — `BADGES`, store load/award, `evaluateSession` / `evaluateLifetime` / `badgeProgress` |
  | `src/App.tsx` | game-end effect: build snapshots, evaluate, `awardBadge`, `newBadges` state + `badgesFiredRef`; game-end summary card: new-badge rows + `celebrateTier2` |
  | `src/App.tsx` | `settingsSections`: Badges block in the `account` section + standalone `badges` section; shared `<BadgeGrid>` component; earned-count line on the Account card |
  | `src/components/BadgeGrid.tsx` | **new** — mount-time lifetime catch-up + the responsive badge grid |
  | `src/index.css` | `.badge-grid`, `.badge-tile`, `.badge-tile.locked`, `.badge-progress` |
  | `src/utils/feedback.ts` | *(optional)* `celebrateBadge` alias over the Tier-2 visual |

  Phase 2 (separate): cloud sync for the `badges` store in `src/utils/sync.ts` + merge on sign-in.

  #### Build order

  0. **Prerequisite:** the §1 "Instrument-scoped all-time aggregation" task (`historyForInstrument`).
  1. `src/utils/badges.ts` — `FIXED_BADGES` + `stringMasterBadges` / `badgeList`, store (`loadBadges` / `isEarned` / `awardBadge` with the `@instrument` key convention).
  2. `evaluateLifetime` + `badgeProgress`, and `<BadgeGrid>` in the Account + standalone `badges` drawer sections (visible immediately from existing history via mount-time catch-up).
  3. `evaluateSession` + the game-end wiring in `App.tsx` (snapshots, `awardBadge`, `newBadges`).
  4. Game-end summary rows + `celebrateTier2` badge celebration + CSS polish.
- **Progress chart** — accuracy % and avg response time trend across recent sessions. **DONE** (`Add a progress trend chart to the Daily timeline`). `ProgressPanel.tsx` now has a `TrendChart` component: two stacked inline-SVG sparklines over the last 30 dated days — accuracy % on a fixed 0–100 axis above, average response time in seconds below — sharing an X axis of dates, rendered above the existing daily bar list inside the "Daily timeline" expander. History has no session marker, so the trend is **per-day** via `dailyStats` (the wishlist's "across recent sessions" wording is per-day in practice). Hidden when fewer than two dated days exist, so the bar list / empty-state text carries the screen instead. The SVG wrapper is forced `dir="ltr"` so time reads oldest-left in Hebrew; styles in `src/styles/07-stats.css` (`.sp2-trend*`); no chart library, no schema change; it renders whatever `history` it is handed, so the free 7-day view window applies with no extra gating.
- **Badges** — Speed Demon, Perfect Session, String Master, streak-based (e.g. 5-of-7 days), Most Improved — all computable from existing history data. **DONE, and shipped well beyond this plan's original scope.** `src/utils/badges.ts` + `BadgeGrid.tsx`/`BadgeMedal.tsx` implement a full "Achievements wall": every session/lifetime badge is now a **family with up to four ordered levels** (Bronze/Silver/Gold, Platinum where a milestone earns a fourth rung), several badges beyond the original list (`every_string`, `both_ends`, `quick_read`, `doubling_up`, `low_end`), and a third badge kind — **role badges** (e.g. an `admin` badge tied to the new `public.admins` account role) — that the original plan didn't anticipate. The collection screen itself went through two redesign passes (`Badges: redesign the collection screen as a game-like Achievements wall`, `Badges: sharpen the Achievements wall — locked, tier ladder, density`). The API below (`evaluateSession`/`evaluateLifetime`/`awardBadge`) is superseded by the shipped tiered version; treat this plan as historical context, not the current shape.
- **Adaptive suggestion, retargeted** — auto-suggest a harder/easier Selector configuration (fret range or difficulty) based on recent accuracy for the current settings combination. This keeps the *intent* of the old "adaptive suggestion between stages" idea while dropping the Stage mechanism itself. **DONE (v1, difficulty only).**

### OPEN (continued)

- **Practice schedule / reminders** — local notification at a chosen time, gentle streak counter. **Not built** — no notification/reminder code anywhere in `src/`.
- **Scales — "fret by fret" exercise (a new exercise type, not a change to Exercise A)** — requested 2026-09-24. One falling row per fret, ascending across the whole box (e.g. 5, 6, 7, 8), and every scale note sitting on that fret is lit on its string, so a row can hold several lit tiles and a fret with no scale note is an empty row. Unlike Exercise A it is not a run up by pitch. Open design question: within a row with several lit tiles, may they be tapped in any order or only left to right. **Not built.** Exercise A itself keeps its by-pitch run and only gained empty rows for the frets the run steps over (`gap` rows in `src/learning/scaleFall.ts`).
- **More UI languages (beyond English + Hebrew)** — requested 2026-09-25. `Lang` in `src/i18n/translations.ts` is now `'en' | 'he' | 'es' | 'pt-BR' | 'fr' | 'it'`; adding a locale means a new dictionary (~950 entries keyed by the English source string) plus a `LANGUAGES` row, an `isLang` / `dateLocale` case, and a branch in the few hand-built sentences that switch on `lang`. Missing entries fall back to English, so a language can land in stages (main screens first, then settings/Learn, then the rest). Order:
  1. **Spanish** — **stage 1 DONE (2026-09-25).** `src/i18n/translations.es.ts` (~370 entries, neutral Spanish, "tú"): app shell, settings, the drawer, the in-game screen, Selector, Onboarding, Stats, Leaderboard, the plan card, the difficulty banner, the Learn nav labels and the fret-range dialog; the boot splash (`main.tsx`) too. Spain + Spanish-speaking American time zones open in Spanish on first launch (`detectLanguage` in `src/utils/region.ts`). Note names default to Do-Re-Mi in Spanish until the player picks explicitly (`useAppPreferences`: an unset `pref_notation` follows the language). Dates use `es-ES`. **Stage 2a DONE (2026-09-25) for all four languages (es, pt-BR, fr, it):** the badge wall (tiers, names, every earning condition), the guest-merge prompt, voice calibration + the level meter (its hand-built `lang === 'he'` sentences now go through `t()` with `{a}`/`{b}`/`{n}`/`{prompt}` placeholders), the debug log panel, the feedback board, Quick Access and the Tuner — ~260 entries per language. **Stage 2b DONE (2026-09-25) for all four:** the Premium Learn areas — the Teacher's Today card, the Learning Path, interval training (names, groups, the per-interval explanations, the selector), scale training (scale names and the "?" blurbs), staff reading and tab reading (chords and technique symbols) — plus the admin / dev-panel copy, ~320 entries per language. Every key in the Hebrew dictionary now has an entry in all four languages. **Still open for Spanish:** (a) a check on a real device that the longer strings fit their buttons and cards; (b) the privacy policy page (`public/privacy.html` is Hebrew + English only and a legal text — a Spanish version needs the same legal review); (c) spoken Spanish for voice answers (Spanish solfège words work already; "sostenido"/"bemol" are not in `speechVocab.ts`); (d) a native-speaker review of the stage-1 wording.
  2. **Portuguese (Brazil)** — **stage 1 DONE (2026-09-25).** `src/i18n/translations.ptBR.ts` (Lang code `pt-BR`, "você") with exactly the same key set as Spanish stage 1, so it covers the same screens. "Guitar" is translated **"Violão"** (the word Brazilian learners use; "guitarra" means only the electric guitar in Brazil) — a product call worth confirming. Brazilian time zones (incl. the legacy `Brazil/*` aliases) open in Portuguese on first launch; Portugal stays on English until a European Portuguese dictionary exists. Note names default to Do-Re-Mi like Spanish, spelled the Brazilian way — "Dó", "Ré", "Fá", "Lá" — everywhere a note name is shown (`SOLFEGE_ACCENTS` in `music.ts`, display-only). Dates use `pt-BR`. The Language picker now wraps two-per-row (`PickRow wrap`) since four languages no longer fit one row. **Still open for Portuguese:** the same (a)–(d) list as Spanish — stage 2 screens, the privacy page, spoken Portuguese for voice answers ("sustenido"/"bemol"), and a native-speaker review of the stage-1 wording.
  3. **French** — **stage 1 DONE (2026-09-25),** requested ahead of German. `src/i18n/translations.fr.ts` (Lang code `fr`, "tu") with exactly the same key set as Spanish/Portuguese stage 1, so it covers the same screens; French typography (a narrow no-break space before ? ! : and %). France, Monaco, the French overseas departments/territories and the legacy `America/Montreal` alias open in French on first launch; Belgium, Switzerland, Luxembourg and today's Quebec zone (`America/Toronto`, shared with Ontario) stay on English, since they are multilingual. Note names default to Do-Re-Mi. In French the second degree is written "Ré" everywhere a note name is shown (`setSolfegeLanguage` in `music.ts`, set by `LanguageProvider`; display-only, so answer matching and voice parsing are untouched). Dates use `fr-FR`. With five languages the Language picker's last option takes a full row. **Still open for French:** the same (a)–(d) list as Spanish — stage 2 screens, the privacy page, spoken French for voice answers ("dièse"/"bémol"), and a native-speaker review of the stage-1 wording.
  4. **Italian** — **stage 1 DONE (2026-09-25).** `src/i18n/translations.it.ts` (Lang code `it`, "tu") with exactly the same key set as Spanish / Portuguese / French stage 1, so it covers the same screens. Italy, San Marino and Vatican City time zones open in Italian on first launch; Swiss Italian speakers stay on English with the rest of multilingual Switzerland. Note names default to Do-Re-Mi (Italian writes "Re" without an accent, so the app's solfège table is already right for it). Dates use `it-IT`. With six languages the Language picker fills three full rows. **Still open for Italian:** the same (a)–(d) list as Spanish — stage 2 screens, the privacy page, spoken Italian for voice answers ("diesis"/"bemolle"), and a native-speaker review of the stage-1 wording.
  5. **Then German / Japanese**, each with its own catch:
     - **German** needs a third notation: B is written H and B♭ is written B. A translation alone would show wrong note names — add a `NotationMode` (and route it through `displayNote`/`speechVocab`) rather than hardcoding, per the rule that cross-cutting display settings govern every feature.
     - **Japanese** — check text fit in tight layouts and font coverage.
  - **Cross-cutting notes:** voice input (`src/utils/speechVocab.ts`) understands English note names, solfège and Hebrew transliterations only — a new language can ship first with voice answers in letters/solfège, and add its own spoken vocabulary later. Some deep Game/stage strings are still rendered raw in Hebrew too, and will be in any new language. `pref_language` already syncs across devices, so no sync work is needed. **Not built.**

### DROPPED

- **Celebration tiers** (small win / milestone / major award pulses+haptics) — **DROPPED (product decision 2026-09-08).** The escalation plan below is **not relevant** and will not be built. It is the opposite direction from the deliberate `cee6c30` "In-game feedback: drop streak celebrations, soften the correct chime" call — in-game feedback stays minimal (a small floating `+N` + haptic on a correct answer, nothing on a streak milestone). Only the existing end-of-round "new personal best" celebration is kept. `celebrateTier1`/`celebrateTier2`/`celebrateTier3` in `src/utils/feedback.ts` are unchanged; `CelebrationTier`, `celebrateMajor`, `playStreakTone` and the tick/small/milestone/major split were never built and now won't be. The implementation plan below is kept only as provenance. A one-off nudge banner now sits under the Selector while the game is at rest. `suggestAdjustment(entries)` in `src/utils/progress.ts` is a pure read over the current `historyKey`'s entries: on the last 20 answered questions (minimum 15, so noise can't move anyone), accuracy ≥ 0.9 ⇒ `'harder'`, ≤ 0.6 ⇒ `'easier'`, else `null` — timeouts and skips count against accuracy the same way `mastery.ts`/`dailyStats` treat them. `App.tsx` turns that verdict into a concrete difficulty step via `nextDifficulty` / the new `prevDifficulty` (`src/hooks/useSelector.ts`) and renders `src/components/AdjustSuggestionBanner.tsx` (presentational, RTL-aware) with an **Apply** button that calls the existing `selector.onDifficultySelect(target)` — no new mutation path, and switching difficulty changes `historyKey` so the banner clears itself. **Not now** persists a per-combination dismissal (`sel_suggestDismissed_<historyKey>` in localStorage, device-local, not cloud-synced) so it doesn't nag again for that direction. Suppressed while Auto Advance is on (it already marches difficulty), while a precise Pro fret window pins difficulty to Full, and when already at the hardest/gentlest difficulty (no `'harder'` past Full / no `'easier'` below Dots — widening the fret-range half is left as a documented future fallback). Hebrew + English strings in `src/i18n/translations.ts`; styles in `src/styles/14-selector.css` (`.adjust-suggest*`). The app also still *displays* weak notes (`weakNotes` in `ProgressPanel`), which is complementary.

---

## 4. Unconfirmed Ideas
Old-roadmap ideas that may still have value but were never re-affirmed under the Selector model. None of these should be scheduled without a product-owner decision.

### OPEN / Awaiting decision

- **Saved/named Selector presets.** The old "Custom Stage" (save/rename/clear, free-tier limit of 1) doesn't apply directly since there's no Stage to snapshot — but a lighter equivalent (bookmark a specific string+range+difficulty+mode combo for quick recall) might still be wanted. **Product decision 2026-09-08: build a lightweight version.** A bookmark of a string+range+mode+difficulty combo: a "save" button names the current combo, a short list recalls one in a single tap. The separate "Quick-switch for recent/favorite Selector combinations" bullet folds into this as *automatic* bookmarks (most-recent combos) — one mechanism, not two. No free-tier limit while there is no paid tier live. **Still not built** — no preset/bookmark code found.
- **Multi-string emphasis animations** (string label flash/scale on switch, haptic pulse on string switch) — plausible polish for multi-string mode, but not confirmed as a priority; usage of multi-string mode isn't yet established as common enough to warrant it. **Product decision 2026-09-08: parked, opportunistic.** Can't be prioritised on data (no users, no analytics). It is also cheap and self-contained — a CSS keyframe on the string-number label plus a `haptic.tap()` in the multi-string question-advance branch, on the order of a few hours — so the call is: **do not schedule it as its own task; fold a minimal version in whenever the multi-string code is being touched for another reason.** Revisit as a deliberate feature only if usage telemetry (once it exists) shows multi-string mode gets real use.
- **Quick-switch affordance for recent/favorite Selector combinations** — distinct from reviving Stage navigation, but unconfirmed whether users need anything beyond directly editing the Selector Panel each time. (Folded into the Presets item above.)
- **Chromatic tuner.** A "is this string in tune?" screen — pluck an open string, see the detected note plus a cents-off needle, tune by ear against the target. Independent of the drill loop; it would live as its own **Tuner** drawer entry (or a tile in an eventual "tools" area) and be Free for everyone. **Product decision 2026-09-08: build it, as a free tool for everyone.** Rationale from the product owner: someone already inside the app to practise should not need a second app just to tune. It stays Free (not Pro/Premium-gated). It still doubles as the go/no-go pitch-detection spike, and still needs real-device noisy-room measurement before the DSP is trusted — but the decision to build the tuner itself is made. **Not built** — no pitch-detection code exists.
- **Left-handed mode.** ~~A setting that mirrors the fretboard for left-handed players.~~ **Built (2026-09-10)**, and wider in scope than this entry first assumed. **Still needs a real device visual QA pass** in the browser in both languages: the SVG-neck text counter-flip (`transform-box: fill-box`), the Pro fret-range drag slider under `scaleX(-1)`, and the drawer `direction` flips were not verified on a device.

### OVERTAKEN BY EVENTS / Built & Shipped

- **Auth & cross-device sync** (Google sign-in, Supabase) — plausible long-term, but the app is intentionally backend-free today; no decision has been made to introduce a backend. — **OVERTAKEN BY EVENTS: this is now built and live.** `useAuth.ts` + Supabase back Google sign-in; `sync.ts`/`settingsSync.ts`/`voiceSync.ts` push and merge history, personal bests, settings and the voice profile across devices. The backend-free framing in the Ground Rules above no longer describes the shipped app — a backend (Supabase) is now a real, live dependency, not a hypothetical.
- **Leaderboard, expertise tests (String Speed Test, Full Neck Sprint, Blind Ear Test), user profiles, admin dashboard** — all depend on the unconfirmed backend decision above. — **Partially overtaken:** the backend decision is made (see above). The **leaderboard itself has shipped** as a public, free, all-time-XP-ranked feature (`src/utils/leaderboard.ts`, `LeaderboardPanel.tsx` — see the Free tier in §6). A basic **admin role** also shipped (`public.admins`, `auth.admin`), gating the debug-log panel, an admin-only "Inbox" tab on the new Feedback Board (see the new §7 below), and an `admin` role-badge. Still not built: the named expertise tests (String Speed Test / Full Neck Sprint / Blind Ear Test), public user profiles beyond the leaderboard row, and any dedicated admin dashboard beyond the feedback inbox.
  - **Named expertise tests — product decision 2026-09-08: parked, defer to a later decision.** Not rejected; revisit after the current build queue.
  - **Dedicated admin dashboard — product decision 2026-09-08: parked; may be revisited.** The feedback inbox + debug panel cover current needs, but the product owner expects this could change as the tool grows.
  - **Public user profiles — product decision 2026-09-08: parked, per recommendation.** Not before there is a user base to be social with. Rough build estimate for when it is picked up, reusing the existing Supabase + auth + RLS + leaderboard + badge-sync + feedback-board-moderation infrastructure:
    - **A minimal read-only public profile** (tap a leaderboard row → that user's public badges, XP, lifetime accuracy, main instrument, join date): one migration + RLS (world-read / self-write), a write-through on the leaderboard/badge cadence, a `ProfilePanel` reached from a leaderboard row, RTL + Hebrew strings, guest/opt-out handling, display-name moderation, one `check-*.mts`. **≈ 1 – 1.5 weeks** for one developer.
    - **A real social layer** (friends / follow, friend-scoped leaderboards, invite-accept flow, activity feed, per-friend daily challenges, notifications — none of which exist today): friends table + RLS, friend-scoped queries, an invite flow, a notifications channel from scratch, a privacy/blocking model. **≈ 4 – 8 weeks**, and it needs its own product decision — this is the "Daily challenge / friends" item still listed undone in §6.
- **Monetization** (premium tier, ad-unlock, donations, community donation pool) — depends on both the backend decision and a separate, unmade business decision to monetize at all. The backend decision is now made (see above); the monetize-at-all decision is still open and is being actively drafted in §6.
- **Walk Mode / hands-free voice drilling, ear training, additional instruments (bass, ukulele, mandolin, banjo), iOS port** — all plausible long-term directions from the later original roadmap, none rejected, none confirmed; each represents a significant scope commitment that hasn't been revisited under the current product direction. Bass has since shipped as a full second instrument (not "hands-free voice drilling," which remains unbuilt).
  - **Additional instruments (ukulele / mandolin / banjo) — product decision 2026-09-08: yes, later, low priority. OVERTAKEN BY EVENTS: now built and shipped.** `src/utils/instruments.ts` carries full tuning/string-count/fret-range data for mandolin (real-time synth), banjo (5-string, open-G, short 5th string modeled as a real fret restriction), and ukulele — including a baritone ukulele variant (real-time synth) and standard sizes on real licensed samples (FreePats CC0, `public/audio/ukulele/`). Gated behind Pro via the new `extraInstruments` feature (`src/utils/features.ts`; `PRO_ONLY_INSTRUMENTS = ['mandolin', 'banjo', 'ukulele']`) rather than left as admin-only placeholder tiles. The instrument picker was also split into two rows (Guitar/Bass, then the rest) to make room, and guitar/bass separately gained their own string-count/fret-count variant pickers plus an acoustic/electric type selector — a broader "instrument variants" feature beyond just the new families.
  - **iOS port — product decision 2026-09-08: later.** Android has real traction (a signed debug APK is built and handed to developers). iOS is blocked on not having an iPhone to test on; it will be done further down the line.
  - Walk Mode / hands-free voice drilling and ear training in this bullet are unchanged.

---

## 5. Obsolete
Only items clearly and specifically superseded by the Selector model — not "deprioritized," but actually replaced by a shipped, different mechanism.

- **Stage progression system** (dots → natural → chromatic per string, moved through in sequence) — replaced by direct difficulty selection (Whole Only / Dot Frets / +♯♭) in the Selector Panel; there is no discrete sequence to progress through anymore.
- **Stage Navigation chrome** — chevron arrows, progress bar with per-string colored dashes, tap-title stage picker overlay, title glow on stage change, swipe-to-change-stage, "stage change always stops game." All of this assumed a stage index to navigate; the Selector Panel has no equivalent concept and none of this UI should be rebuilt in its original form.
- **"Custom Stage" as a stage-snapshot concept specifically** — the *mechanism* (snapshotting a Stage) is obsolete along with Stages themselves. (The underlying *want* — save a configuration for later — is carried forward as an Unconfirmed idea above, not as this obsolete mechanism.)

---

## 6. Monetization Tiering (Draft)

First-pass split of the feature set into paid vs free, to frame the monetization decision that §4 still lists as unmade. Model: **Free + Pro (subscription) + Premium (higher subscription or add-ons)**. The Android app itself is **free** on both web and Play Store — paid tiers unlock features inside it, they are not a paywall to install.

> **STATUS UPDATE — the Free/Pro split is now built and shipped (phases 1–6).** What was "a starting map for discussion" has been turned into a decision-made spec (`.kiro/specs/free-pro-tiering/design.md` + `tasks.md`) and implemented client-side:
> - **Entitlement data model** — `public.entitlements` (Supabase migration `0007`, RLS read-own, no client write) plus `public.orphan_practice`; grants tightened in `0009`; an admin self-toggle path added in `0010`.
> - **One source of truth** — `src/utils/entitlement.ts` (`fetchEntitlement`/`cachedEntitlement`, fail-open on read error, fail-closed on absence) surfaced through `useAuth.ts` as `tier` / `isPro`, read everywhere via the thin `useEntitlement()` hook.
> - **Gating layer** — `src/utils/features.ts` (`Feature` map, all `'pro'` for now, `FREE_HISTORY_DAYS = 7`), the presentational `<ProGate>` component (overlay / replace / inline-badge variants), `<UpgradeCard>` + a standalone **⭐ Pro** drawer section with an `openUpgrade` handler. CTA is still a disabled "Coming soon" placeholder — **no payment SDK, no real purchase**.
> - **What is actually gated for Free:** the mastery-map "questions counted" window-size control (the overlay itself is free — see below), the personal voice profile + calibration, all-combinations personal bests, multi-string drilling beyond 2 strings (`multiStringFull`), the precise fret-range window (`fretRange`), and history in the Stats & Progress screen older than 7 days (a **view filter only** — recording, sync and restore stay complete and free for everyone). *(The 0–12 / 12–max fret-range half-picker stays free for everyone; only the finer "fret N–M" window layered on top of it is Pro. Multi-string mode itself is free up to `FREE_MULTI_STRING_LIMIT` = 2 strings at once — reaching for a 3rd+ string is what's gated, reversing the "freed after the initial pass" note this line used to carry.)*
> - **Guest → account merge** is now an explicit prompt (`GuestMergePrompt.tsx`), with orphaned guest practice captured to `orphan_practice` when the user declines the merge.
> - **Testing seams** — `scripts/grant-pro.mts` (admin grant by email), `src/utils/devSimulatePro.ts` (DEV-only simulate-Pro toggle in the debug panel), and an admin-only in-app Pro toggle for one's own account.
> - **Deliberately NOT gated / still free:** cloud sync + multi-device restore, the leaderboard, XP, badges, guitar + bass, scoring/celebrations, notation options, onboarding, offline.
> - **Still open:** Pro's price and trial length, and the payment rail itself (RevenueCat expected) — carried as a separate phase-7 spec. The "Premium" third tier below stays parked and unmodelled.
>
> The rest of this section is the original draft, kept for context; where it says "the work is gating, not building," that gating work is now done.

### Free — "learn the neck"
A complete, genuinely useful app with no payment, or there is no adoption funnel.
- By-fret and by-note modes
- **Guitar and bass** (bass is a free instrument, not a Pro hook)
- Single-string selection, and multi-string drilling **up to `FREE_MULTI_STRING_LIMIT` (2) strings at once** (3rd+ is Pro, see below), the 0–12 / 12–max fret-range half-picker, difficulty stages, Auto Advance
- Scoring, streak, fire multiplier, celebrations, "serious learning" (score-off) mode
- Notation A-B-C / Do-Re-Mi, circle-of-fifths / alphabetical order
- Basic voice answering (Web Speech / native), no personal profile
- Stats in the Stats & Progress screen for the **last 7 days** (as shipped — a view filter; the full history is still recorded, synced and restored for every user)
- Onboarding + placement, full offline support
- **Public leaderboard** ranked by all-time XP (= correct-answer count) — already shipped and explicitly built as a free, open feature: anyone (including guests) can view the full standings via `fetchLeaderboard`; only appearing on it requires Google sign-in. See `src/utils/leaderboard.ts`.

### Pro (subscription) — "train seriously and track progress"
Core value = persistence of data over time + a wider drill surface. The gating for all of this is now **built** (phases 1–6, see the status update above); what remains is the price and the payment rail.
- **History older than 7 days** in the Stats & Progress screen — *gated via `<ProGate feature="historyBeyond7Days">`*
- **Mastery-map window size.** The fret / note equalizer overlays are now **free for everyone**, computed from the last 250 questions (`FREE_MASTERY_WINDOW` in `src/utils/mastery.ts`). Pro unlocks the "Questions counted" control (100 / 250 / 500 / 1000 / All) — *gated via `<ProGate feature="masteryMaps">`*. Persisted as a `MasteryWindow` object (`pref_masteryWindow`).
- All-combinations personal bests — *gated (`allPersonalBests`)*
- **Precise fret-range selector** (choose an arbitrary "fret N to fret M" window, not just a half) — *built. `<ProGate feature="fretRange">` around the "Precise fret range" toggle + two-handle slider under the neck in `SelectorPanel`; `useSelector` carries `useFretRange` / `fretLo` / `fretHi` and applies the window only for a Pro user. The 0–12 / 12–max half-picker underneath is unchanged and stays **free**.*
- **Multi-string drilling beyond 2 strings** — *built (`multiStringFull`, `27527cb`). Free drills at most `FREE_MULTI_STRING_LIMIT` = 2 strings at once; `useSelector`'s `safeStrings` clamps a Free user's selection at render time (so a downgrade takes effect immediately and an upgrade restores the full pick), `onStringSelect` blocks adding a 3rd+ string, and `onMultiToggle` seeds a 2-string default pair instead of selecting every string. `SelectorPanel` renders the remaining string pills locked past the cap — tapping one opens the Pro upsell — and tags the Multi pill "Pro 1-N" for a free user. This reverses the earlier "multi-string mode freed for everyone" note (`0382d9e`).*
- Personal voice profile + calibration — *gated (`voiceProfile`); free users fall back to basic Web Speech / native*
- No ads (if the free tier ever carries them)
- **NOT Pro:** Google account, cloud sync and multi-device restore all stay free (see the status update).

### Premium (higher tier / add-ons) — "a teacher, not just a timer"
Does not exist yet; needs to be built to justify a price above Pro. Justified only once 2–3 of these ship.

> **This list has been superseded by a full product plan: [`premium-product-plan.md`](./premium-product-plan.md).** That document organizes the items below into one learning system (Premium is a single adaptive learning product, not a bundle of paid game modes), defines the boundaries against Free/Pro, a shared learning engine, the "Teacher" system, a build order, a notes-only MVP, and the open decisions. The raw bullets are kept here for provenance; plan work should start from `premium-product-plan.md`.
- **New game modes**: chords, scales, intervals, staff notation reading, triads on a string set
- **Structured training plan / course**: daily goals, a guided path stage to stage
- **Automatic weakness-targeted drills**: engine reads the mastery map and builds a session from what the user gets wrong, plus spaced repetition (SRS) for notes
- **Real pitch detection from the microphone** — play the note on the guitar instead of tapping / speaking. **Partly built, open to every user (product owner, 2026-10-01):** Practice "by fret" (`useGuitarAnswer`) and Scales → "Tap the scale in order" (`usePitchStream`, a continuous listener; Answer mode switch on the Scales screen, `ssel_order_guitar`; an octave off counts). The option shows wherever the device can listen (Settings → How you answer, Quick Access, the Scales screen). The product owner chose to open it before the go/no-go in `src/pitchSpike/README.md`; verified with a simulated microphone (an oscillator) and tried by the product owner on a real guitar; a noisy room has not been measured. Still open: answering the other Scales exercises, a Staff phrase or a Tab riff by playing.
- Instruments from other families (ukulele, mandolin, violin) — **partially overtaken: ukulele, mandolin and banjo have shipped** (see §4's Built & Shipped note), but gated at **Pro**, not Premium (`extraInstruments`). Violin remains unbuilt and undecided.
- Daily challenge / friends — (the leaderboard itself has shipped, as a free feature — see Free tier above; only per-friend / daily-challenge framing around it remains undone)

### DONE — Free/Pro features built (phases 1–6)

- **Mastery "time-travel" view (Pro) — build the UI.** — **DONE.** The Pro "Questions counted" card in `GeneralSettingsSection.tsx` became a **"Mastery time window"** card: a `Recent` / `A day` / `A range` segmented control switches between the existing `lastN` `PickRow` (100 / 250 / 500 / 1000 / All), a single `<input type="date">` writing `{ kind: 'onDay', dayISO }`, and a from/to date pair writing `{ kind: 'dateRange', fromISO, toISO }` with the half-open upper bound `applyMasteryWindow` already expects (an incomplete or out-of-order range is never persisted). Still wrapped in `<ProGate feature="masteryMaps" variant="replace">`, and `useMasteryOverlay` still pins a non-Pro user to `FREE_MASTERY_WINDOW`. Persistence is unchanged (`setMasteryWindow` + `saveSetting('pref_masteryWindow', …)`), so a chosen day/range round-trips across devices with no migration; the card's help line shows a one-line summary of the active window ("showing last 500" / "showing 2026-04-12" / "showing 2026-03-01 – 2026-03-30"). New date-picker CSS lives in `src/styles/02-settings.css`; new strings have Hebrew entries in `translations.ts`. `src/utils/mastery.ts` gained two pure helpers — `isDefaultMasteryWindow` and `describeMasteryWindow(w, t)` (the shared label formatter the settings card and the overlay caption both use) — plus a `DEFAULT_MASTERY_LASTN` constant; no type/schema change. The overlay-caption half of the plan is **also built**: `useMasteryOverlay` returns `effectiveMasteryWindow` (post Free/Pro resolution) and `App.tsx` renders a small amber `.mastery-window-caption` pill above `.game-row` whenever the at-rest mastery overlay is showing and the window is not the default last-250 — so a time-travelled overlay is never mistaken for the live one. Inert for Free (always `FREE_MASTERY_WINDOW`) and while a round is live.

  ### Implementation plan — Mastery "time-travel" view

  **Goal:** a Pro user can point the fretboard / note-circle mastery overlay at (a) the last *N* questions (today's behaviour), (b) a single calendar day, or (c) an inclusive date range, and the choice persists like every other setting. Free stays pinned to the last 250.

  **What is already done and must not be re-touched:**
  - `MasteryWindow` is a discriminated union with `lastN` / `dateRange` / `onDay`; `applyMasteryWindow(entries, window)` already filters correctly for all three (`onDay` is turned into local-calendar-day bounds by `dayBoundsISO`).
  - `pref_masteryWindow` stores the whole object; it is in `settingsSync.ts`'s synced-keys list, so a chosen day/range round-trips across devices with no migration.
  - `useMasteryOverlay` already does `const effectiveMasteryWindow = isPro ? masteryWindow : FREE_MASTERY_WINDOW;` — a non-Pro user physically cannot leave the 250 window, so the gate is defence-in-depth only.
  - Rows with no `createdAt` (pre-timestamp localStorage entries) are excluded by the `dateRange` / `onDay` filters. That is acceptable and expected — say so in the help text ("older history without a date is not counted for a specific day").

  **UI — `src/components/settings/sections/GeneralSettingsSection.tsx`, inside the existing `<ProGate feature="masteryMaps" variant="replace">` block, below the current "Questions counted" card.** Add a second `SettingCard` labelled "Mastery time window" (or fold both into one card with a mode switch — see below). The control has three modes:
  - **Recent** — the existing `PickRow` of `PRO_MASTERY_LASTN_CHOICES` (100 / 250 / 500 / 1000 / All). Selecting a value writes `{ kind: 'lastN', n }`.
  - **A day** — a single `<input type="date">` (max = today, in the user's locale). Selecting a date writes `{ kind: 'onDay', dayISO: <value> }`. Show the chosen day formatted next to the input.
  - **A range** — two `<input type="date">`s (from / to, each clamped so `from <= to <= today`). Writes `{ kind: 'dateRange', fromISO: startOfDay(from).toISOString(), toISO: startOfDay(to + 1 day).toISOString() }` so the range is inclusive of the "to" day — reuse the half-open convention `applyMasteryWindow` already expects (`>= fromISO && < toISO`).

  A small segmented control (`Recent` / `Day` / `Range`) at the top of the card switches which sub-control is visible; the visible sub-control's current value is what gets persisted. On switching *to* `Recent`, restore the last `lastN` value (keep it in component state so toggling back and forth is lossless); default it to `250` if there was none.

  **Persistence:** exactly the current pattern — `setMasteryWindow(next); saveSetting('pref_masteryWindow', next);`. Nothing else. `useAppPreferences` already loads it with `DEFAULT_MASTERY_WINDOW` as the fallback, and `loadSetting` will happily rehydrate a stored `dateRange` / `onDay` object.

  **Overlay caption:** `useMasteryOverlay` (or the components that render the overlay — `NoteCircle` / `FretGrid` wrappers in `App.tsx`) should show a one-line note of the active window when it is not the default, e.g. "showing 12 Apr 2026" / "showing 1–30 Mar 2026" / "showing last 500", so a time-travelled overlay is never mistaken for the live one. Put the string next to the existing "Mastery on the fretboard" toggle area or as a subtitle on the overlay legend.

  **i18n:** new strings — "Mastery time window", "Recent", "A day", "A range", "From", "To", "showing {range}", "older history without a date is not counted for a specific day" — each needs a Hebrew entry in `src/i18n/translations.ts`. The date inputs are locale-rendered by the browser; no custom calendar.

  **Edge cases:**
  - Empty / partially filled range → keep the previous valid window, don't write an invalid one; disable the overlay-affecting write until both dates are set and ordered.
  - A day / range with zero dated rows → the overlay shows every position as `unplayed`. That is correct ("you didn't practise then"); the caption plus the no-date help text explain it.
  - Instrument switch does not touch the window — it is a global pref, same as the `lastN` choice today.
  - `applyMasteryWindow` is called once per overlay memo; no perf concern at these history sizes.

  **Files touched:** `src/components/settings/sections/GeneralSettingsSection.tsx` (the new control), `src/i18n/translations.ts` (strings), optionally `src/hooks/useMasteryOverlay.ts` + the overlay render sites in `src/App.tsx` (the caption). No change to `src/utils/mastery.ts`, no schema, no migration, no new settings key.

- **Precise fret-range selector (Pro) — DONE.** Built as an extra layer on top of the free 0–12 / 12–max half-picker (which is unchanged and stays free). A new **"Precise fret range"** on/off toggle plus a two-handle slider (`src/components/FretRangeControl.tsx`) sit under the neck SVG in `SelectorPanel`, wrapped in `<ProGate feature="fretRange" variant="overlay">`. `useSelector` now takes an `isPro` argument and carries an explicit window: `useFretRange` / `fretLo` / `fretHi` (persisted as `sel_useFretRange` / `sel_fretLo` / `sel_fretHi`, global, clamped to `[0, maxFret]` with a 3-fret minimum via `clampFretWindow`, re-clamped on instrument switch). The derivation applies the window only when `useFretRange && isPro` (`precise`), so a free user — or a Pro user with the toggle off — falls back to the halves and the stored window is kept untouched. `getTime` is fed effective halves derived from the window (`fretFrom < 12` / `fretTo > 12`). `historyKey(state, instrument, isPro)` emits a `p<lo>-<hi>` fret segment for a precise window so its stats never mix with the half-picker's `0-12` / `12-max` shape (the non-precise shape is byte-identical to before, so existing history / `best_<key>` records still resolve). `applyStage` forces `useFretRange` off — Auto Advance always runs on the standard half-picker.

### Premium Teacher (P2) — shipped; follow-ups

P0 (premium entitlement plumbing), P1 (item-keyed mastery), P2 (the notes-only
Teacher: `src/learning/*` — weakness detection, Leitner SRS, session planner,
`TodayCard`, per-instrument learning state + best-effort cloud sync) and the
P2.1 QA fixes are **built and shipped** on `main`. The items below came out of
the P2 QA audit and the P2.1 pass and were deliberately **not** taken then —
carried here so they are not re-discovered.

**Open product decisions (P2.1 made a deliberate call that may want revisiting):**
- **by-note Selector practice does not feed the SRS schedule. — DONE**
  (`Premium Teacher: feed by-note practice into SRS; widen the coverage span`).
  `addEntryWithKey` in `App.tsx` now feeds `recordPracticeAnswer` for by-note
  rows too, except explicit wrong taps (`entry.correct === false`), which are
  the only ones that record a fret other than a genuine match for the shown
  note. Correct taps and timeouts both carry a valid position and now advance
  the schedule. The daily goal is still never ticked by free-drilling.
- **Selector practice does not tick the prescribed daily goal.** By design —
  the daily goal is "do one Teacher session", and free-drilling must not
  complete it. **Product decision 2026-09-08: confirmed, keep as-is.** Free
  practice does not count toward the daily coach goal; the personal coach
  builds a tailored session from the user's own mistakes, and that session is
  what the daily goal tracks. No change to `recordPracticeAnswer`.
- **Sign-out discards unsynced offline Teacher progress.** `clearLocalLearningState()`
  on sign-out drops the on-device blob so it can't be merged into the next
  account on a shared device; a user who runs a Teacher session offline and
  signs out before the debounced cloud push lands loses that delta. Accepted as
  an explicit-action tradeoff; the alternative is per-user namespacing of the
  `learningState` localStorage key.
- **`WeaknessConfig.maxAgeDays = 45` is an untuned guess.** Rows older than the
  horizon (and rows with no `createdAt`) are ignored by `analyzeWeakness` so
  months-old performance can't stay a current weakness. A user who practises
  1–2×/week could see a position drop off the weakness list after ~6 weeks
  untouched (a genuinely due SRS item still surfaces via its schedule). Revisit
  against real Premium cadence. → **Superseded by "Recency model: exponential
  time-decay" under Open decisions below** — the hard cutoff is replaced by a
  decaying weight.

**Medium items from the audit, out of P2.1 scope:**
- **Consolidation rarely fires for a once-a-day user. — STILL OPEN, needs a
  product call.** The consolidation pool is `bucket >= 2 && dueAt > now`; with
  Leitner intervals of 20 min / 2 h / 1 day, an item answered correctly
  yesterday is overdue today, so for a once-a-day user only `bucket >= 4` items
  ever sit in the "healthy, not due" pool. Note that those overdue-but-healthy
  items *do* still return in the session — via step 1 (`overdue`), not as
  `consolidation` — so the session is not actually all-struggle; what is
  missing is the *framing* of a reinforcement bucket distinct from "weak" and
  "overdue reviews". A real fix is to **reclassify**: when step 1 pulls in a
  due item that has no weakness signal and a solid recent history, label it
  `consolidation` rather than `overdue` so the rationale reads honestly. That
  changes the rationale sentence the Today card shows, so it wants a product
  decision on wording before it is built — deliberately not taken in the
  by-note / coverage pass.

  **Product decision 2026-09-08: approved — reclassify, and reword the Today
  card.** When step 1 pulls in a due item that has no weakness signal and a
  solid recent history, label it `consolidation`, not `overdue`. The drill
  itself does not change; only the rationale copy does. Target wording (English
  source string, Hebrew entry needed in `translations.ts`): the consolidation
  bucket reads as *"refreshing a few notes you already know"* /
  「מרעננים כמה תווים שאתה כבר יודע」, kept distinct from the weak-item copy
  (*"notes you've been missing"*) and the genuinely-overdue copy
  (*"reviews that are due"*). When a session mixes buckets the sentence lists
  them together, e.g. 「היום נרענן כמה תווים שאתה כבר יודע, לצד כמה שצריכים עבודה」.
- **Coverage fallback span is hardcoded to frets 0–5, all strings. — DONE**
  (`Premium Teacher: feed by-note practice into SRS; widen the coverage span`).
  `coverageSpan` now returns `fretTo = clamp(max(5, highestFretEverPlayed + 3),
  5, maxFret)`, so a cold-start user is unchanged (0–5) but a Teacher session
  widens past the open position on its own as the learner works higher up. Full
  neck-region *progression* still belongs to P3 (Learning Path); this is the
  "if P3 slips, widen this" stopgap.
- **`useLearning` rebuilds both full plans on every Teacher answer and every
  60 s tick. — STILL OPEN, not a one-liner.** Each `buildDailyPlan` /
  `buildWeakSpotsPlan` runs `analyzeWeakness` over the whole instrument
  history, and the memo is keyed on `now` (60 s heartbeat + every answer). The
  clean fix threads a pre-computed `WeaknessSignal[]` through `PlannerOptions`
  so `build()` skips its internal `analyzeWeakness` call, with `useLearning`
  memoising `analyzeWeakness` on `[entries, srs]` only. The wrinkle:
  `analyzeWeakness` also takes `now` for the `maxAgeDays` cut-off and the
  `overdue` flags, so a `now`-independent memo goes slightly stale between
  ticks (negligible for a 45-day horizon; `overdue` is re-derived fresh by
  `dueItems` in step 1 anyway). Harmless today because the card is unmounted
  during a session — so this is a real perf/tidiness refactor for its own
  pass, not part of the small-fixes batch.
- **`learningSync.reconcile` does a full pull → merge → upsert per debounced
  push.** In a slow session that can be ~one Supabase round-trip per answer.
  Best-effort and non-blocking, but a coarser debounce or a dirty-flag gate
  would cut the chatter.
- **Latent: guard the daily-goal count if a by-note Teacher question type is
  ever added.** `recordTeacherAnswer` bumps `completed` once per history row;
  a by-note question emits one row per fret found, which would over-count the
  goal. Not reachable today (the planner only emits `mode: 'byFret'`).
- **Known / accepted: Teacher answers record under the Selector's current
  `historyKey`.** The roadmap chose "no historyKey for Teacher", so a Teacher
  session's rows land in whatever combo the Selector is set to and show up when
  that combo's stats are filtered. P2.1 fixed the misleading personal-best
  side-effect; the stats-filter mixing is the accepted cost of not scoping
  Teacher history.

### Interval drill (P4) — first slice shipped; follow-ups

The first vertical slice of intervals (premium-product-plan.md §9 P4) is built:
`src/utils/intervals.ts` (semitone / note math), `src/learning/intervalItem.ts`
(`interval:<semitones>` identity, quality-only, ascending), `intervalDrill.ts`
(`buildIntervalDrill` → a plain `DrillConfig` with an `interval` spec),
`intervalSrs` added to the per-instrument learning-state blob (migration `0014`,
doc-only), a tightly-scoped `interval` branch in `useGameEngine` that rides the
existing by-fret / by-note answer flow, an isolated in-memory history sink so
interval answers never touch note stats / mastery / badges / leaderboard, and a
Premium-gated `IntervalCard` (`intervalDrill` feature key) with a form toggle.
Two answer forms: **on-neck** ("M6 above ◉", tap the target fret) and
**by-name** ("Perfect 5th above G", tap the note on the circle). Validation:
`scripts/check-intervals.mts`.

**Update 2026-09-08 — second slice + polish shipped** (see §7's dated
subsection for the full list): a second on-neck exercise **"Find the target
position"** (engine branch + a `FretGrid` rendering branch keyed on
`intervalPrompt.exercise === 'findTargetPosition'`), both directions and a
separate SRS lane wired, an `IntervalTodayCard` and interval today / weak-spots
entry points folded into `DailyPracticeScreen`, interval feedback rendered in
the user's chosen notation, the wrong chip marked on an "identify the interval"
miss, a gentler first session (a fresh learner defaults to a `focused` register
and ascending-only), a degenerate-fret-window fallback across candidate strings,
and the Interval practice page re-skinned to the Notes-selector palette. The
bullets below are the parts of the follow-up list still **open** after that
pass.

Deliberately **not** in the first slice — carried here so they are not
re-discovered:
- **No Learning Path checkpoints for intervals.** The Path is still notes-only;
  interval checkpoints woven into the ladder are the next P4 step.
- **The planner (`buildDailyPlan`) does not fold interval items in — and by
  current product intent it should not.** Today drills by *understanding*: a
  learner who has not taken up intervals cannot use an intervals Today, so each
  learning component gets its own separate Today. As of 2026-09-08 the Learn
  area's daily screen (`DailyPracticeScreen`) surfaces a dedicated
  `IntervalTodayCard` with its own today / weak-spots entry points alongside the
  notes plan; this per-component split is the wanted shape for now. A single
  weighted daily mix that interleaves interval qualities and note items in one
  session is a **possible future direction, explicitly deferred**, not the next
  P4 step.
- **No adaptive difficulty for intervals.** Fixed fret window (0–12), fixed
  question count / timer; no promote/demote by cluster accuracy.
- **Interval SRS granularity is quality-only and ascending.** Per-root and
  per-string-set granularity (a M3 across strings 3–2 vs 6–5 is a different
  skill) and descending intervals are later refinements — `intervalItemId`
  takes only `semitones` today.
- **On-neck target acceptance is the single same-string ascending position.**
  Octave-equivalent targets elsewhere on the neck are computed by
  `targetPositionsForInterval` (used by the check script) but the engine asks
  for exactly one, to keep the SRS review count per question exact.
- **`buildIntervalDrill` uses all strings (multi-string by-note/by-fret).** Fine
  for variety, but if it feels noisy, restricting to one string is a one-line
  change.

### Recency model: exponential time-decay for the practice-statistics windows

**Status: approved 2026-09-08, not yet built.** A model change to how the
learning layer decides "how am I doing *now*" on a note position or an interval
quality.

**Problem.** Today every recency-scoped statistic uses the same shape: take the
last N answers, then drop anything past a hard `maxAgeDays` cutoff (45). Two
weaknesses:
- **A cliff, not a fade.** A strong learner who stops for 45 days loses the
  entire accuracy signal at once — e.g. the Learning Path's per-position "% 
  mastered" bar collapses (the monotonic checkpoint stars are kept, but the bar
  and the green-dot positions are not). The number should sag gently, not fall
  off a shelf.
- **Recent improvement is slow to register / old data lingers unweighted.**
  Inside the window every answer counts equally, so a fortnight-old answer masks
  today's.

  (A related array-order bug in `pathProgress.evaluatePath` — the trailing
  window was sliced from `entries` order, which concatenates history keys and is
  not chronological — was patched separately with a `createdAt` sort. That patch
  becomes redundant once the Path moves onto this model, which weights every
  answer by age and never "takes the last N in order".)

**Decision — replace the fixed window + hard cutoff with an exponential
time-decay weight.** Each answer gets a weight `w = 0.5 ** (ageMs / halfLifeMs)`;
a position's recent accuracy is the weighted mean `Σ(w·correct) / Σ(w)`, and its
"effective sample size" is `Σ(w)`.

Product-owner parameters (2026-09-08):
- **Half-life: 14 days.** An answer from two weeks ago counts half as much as
  one from today; a month ago a quarter; two months an eighth.
- **Hard cap: 180 days.** Rows older than this are still dropped entirely — but
  now purely as a performance / storage bound, not a signal boundary (the decay
  weight at 180 days with a 14-day half-life is ≈ 0.0001, already negligible).
  Rows with no `createdAt` are still treated as too old, as now.
- **Minimum evidence: effective sample size ≥ 3** (`Σ(w) >= 3`), matching
  today's `minAttempts: 3` — a position is not judged "weak" or "mastered" on
  accuracy until it has ~3 answers' worth of recent weight. The raw-count
  "repeated recent misses" trigger (2 misses within the last 4 answers) stays
  unweighted, so a position the learner just bombed still surfaces immediately.
- **Per-position mastery becomes continuous (decided 2026-09-08, product-owner
  preference).** Instead of a boolean `mastered`, each position carries a score
  in `0..1` = its weighted recent accuracy, blended with the SRS schedule as
  `positionScore = max(weightedAccuracy, bucket / MAX_BUCKET)` (so a
  well-scheduled position still scores high with little recent history; the
  exact blend curve is open — `max` is the starting proposal). A checkpoint's
  "%" is then the **mean of its positions' scores**, not `mastered / total`.
  - `evaluateStars` / `meetsGoal` already take `accuracy` as a 0–100 number, so
    the continuous checkpoint mean feeds the existing star math unchanged.
  - `effectiveN >= 3` still gates: a position with too little recent weight and
    no SRS row contributes `0` (unseen), not a noisy fraction.
  - **UI follow-ups this forces (decide before build):** the per-position
    green-dot display becomes an intensity / gradient rather than on-off; and
    the "N/M positions" line either becomes a secondary "N positions ≥ 85%"
    readout or is dropped in favour of the single continuous bar.

**Scope — for now, three models:**
- `src/learning/weakness.ts` — `analyzeWeakness` (feeds the notes daily-practice
  plan). Already ranks on a continuous `score` and only thresholds for
  inclusion, so the change here is the decay weighting + `effectiveN` gate, not
  a binary→continuous flip. `leastPractisedPositions` (the coverage fallback) is
  lifetime-count by design and is left alone.
- `src/learning/intervalWeakness.ts` — `analyzeIntervalWeakness` (same: decay
  weighting + gate).
- `src/learning/intervalMastery.ts` — `windowStats` / `isIntervalMastered` /
  `intervalStatus`. The board's 3-way label (`notStarted` / `learning` /
  `mastered`) stays, but is derived from a continuous per-quality strength
  score (same `max(weightedAccuracy, bucket/MAX_BUCKET)` shape); the strength
  can also be surfaced directly on the board.

**Deliberately deferred: `src/learning/pathProgress.ts`.** Its trailing-window
mastery test now has the `createdAt` sort as a stopgap. Folding the Path's
per-position scoring onto the same decay + continuous helper is the follow-up —
this is where the continuous-checkpoint-% change actually lands — so that all
four recency models share one definition of "recent" and one 0–1 position
score. Not in this first pass.

**Implementation sketch.** One pure shared helper module: `recencyWeight(ageMs,
halfLifeMs)`, `weightedAccuracy(rows, now, halfLifeDays)` → `{ accuracy,
effectiveN }`, and `positionScore(weightedAccuracy, effectiveN, srsBucket)` →
`0..1`. `now` injected as everywhere else in the learning layer. Each of the
three modules swaps its `slice(-windowSize)` + `filter(correct)` for the
weighted call and its `attempts >= minAttempts` gate for `effectiveN >= 3`.
Update `scripts/check-learning.mts` / `check-intervals.mts` with decay-curve
assertions (a 14-day-old correct answer contributes half; a position with only
>180-day rows is dropped; the `effectiveN` gate holds; `positionScore` rises
monotonically with recent accuracy and with SRS bucket).

### OPEN — Decisions still needed

- **Premium shape** — ~~a single higher-priced subscription tier, or one-time in-app purchases per game mode~~. **DECIDED 2026-09-08: a single higher-priced subscription tier.** No per-mode one-time purchases. This matches `premium-product-plan.md`, which frames Premium as one adaptive learning system rather than a bundle of separately bought modes. The tier is still parked (not yet priced or sold); only Free/Pro is built.
- **Cloud sync in Free** — ~~offer basic single-device backup for free and gate only multi-device restore behind Pro~~. **DECIDED: sync and multi-device restore both stay free** — the full history has to be present locally for scoring to stay correct, so restore cannot be gated.
- **Free history limit** — ~~"current combination only" vs "last 7 days"~~. **DECIDED: last 7 days**, as a view filter over the Stats & Progress screen and mastery overlays only, never a data/sync cut.
- **Ads in Free** — still open; the current build carries no ads and relies purely on the Pro upsell.
- **Grandfathering** — **DECIDED: none.** No user base yet, so everyone starts Free; `admin` does not imply Pro.
- **Pro price / trial length** — still open, needed before the payment rail (phase 7) can be built.

---

## 7. Shipped Since Last Audit (Not Previously Tracked)

Found while re-checking the codebase against this document — real, shipped features that this wishlist never listed as planned, confirmed, or otherwise. Recorded here so the document stays a true map of the product, not just of what was once proposed. All items in this section are **DONE / SHIPPED**.

- **Full Hebrew localization + RTL layout.** `src/i18n/` (`LanguageContext.tsx`, `translations.ts`, `useTranslation.ts`) — the whole app shell, Onboarding, SelectorPanel, ProgressPanel, and the settings/stats sub-pages are translated and, in Hebrew, laid out right-to-left (including mirrored back-chevrons and right-aligned settings pages).
- **Feedback Board.** `src/components/FeedbackBoard.tsx` + `src/utils/board.ts` — a hamburger settings sub-page where any signed-in user can post an idea/comment/suggestion. Admins (see below) get two tabs on the same page instead — "Write" and "Inbox" (every user's posts, with a handled/delete workflow); guests get a sign-in prompt. Backed by a public Supabase table added in migration `0005`.
- **Admin account role.** A row in `public.admins`, surfaced as `auth.admin` from `useAuth.ts`. Gates the debug-log panel (previously visible to everyone), the Feedback Board's admin Inbox tab, and a dedicated `admin` role-badge (a new, non-levelled third badge kind alongside session/lifetime badges).
- **Voice dictation for text input.** `useDictation` (used by the Feedback Board's compose box) — a distinct, smaller voice feature from the answer-mode `useVoiceAnswer`: speech-to-text for filling in a text field rather than answering a drill question.
- **Coming-soon instrument placeholders (admin-only).** `COMING_SOON_INSTRUMENTS` in `src/utils/instruments.ts` lists Ukulele (G C E A) and Mandolin (G D A E) as disabled tiles in the instrument picker, visible to admins only for now, "so the plan is visible in-app without implying they work." Deliberately not part of `InstrumentId` — nothing can actually select or drill them yet. Confirms intent but not delivery for the Premium "instruments from other families" idea in §6.

### Shipped after the §6 tiering pass

- **Free/Pro tiering, phases 1–6.** See the status update at the top of §6 for the full breakdown — entitlement table + model, `useEntitlement()`, `<ProGate>` / feature map, the four gated features, the 7-day free history window, the guest-merge prompt, and the dev/admin test toggles. Payment rail (phase 7) is still unbuilt.
- **Badge sync across devices.** `src/utils/badgeSync.ts` — earned badges now push/merge through Supabase like history and personal bests, so the Achievements wall follows the account. An admin "Reset" propagates across the admin's own devices.
- **Badge earn celebration.** `src/components/BadgeCelebration.tsx` — a mid-game toast plus an end-of-round reveal for newly earned badges (also fired when an admin Grants a badge by hand from a wall tile).
- **In-game feedback softened.** Streak celebrations were dropped and the "correct" chime softened (`In-game feedback: drop streak celebrations, soften the correct chime`) — a deliberate move *away* from the "Celebration tiers" escalation still drafted in §3; that plan should be re-read against this before being picked up.
- **`index.css` split into per-domain partials.** `src/styles/01-base.css` … `21-pro-gate.css`, `@import`-ed from `src/index.css`. Internal only, no behavior change, but the "Files touched" lists in the §3 implementation plans that name `src/index.css` now mean the relevant `src/styles/*.css` partial.
- **`pref_language` synced across devices.** Language choice now round-trips through the account like other settings.

### Shipped 2026-09-07 / 09-08 — Learn area, intervals polish, audio, sync, boot

A batch of work re-checked against this document after the fact. Grouped by area.

**Learn area / navigation**
- **One "Learn" page of tiles.** The separate drawer rows for Notes / Daily / Intervals were folded into a single `LearnHub` tile grid reached from a "Learn" drawer row (`LearnDomain = 'notes' | 'daily' | 'intervals'`, plus a dev/admin-only **Game** tile). The Learn menu icon (`src/assets/menu-icons/learn.png`) was added and sized/tinted to match its siblings. Learning-tab Back returns to the hub.
- **`DailyPracticeScreen` is the shared daily home.** It now hosts both the notes plan and an `IntervalTodayCard` (interval today / weak-spots entry points), which `IntervalPracticeScreen` dropped; that screen also took a `silentMode` prop.

**Intervals (P4) — second slice + polish** (see the dated update under §6's "Interval drill (P4)" section)
- Second on-neck exercise **"Find the target position"** — `useGameEngine` support plus a `FretGrid` branch on `intervalPrompt.exercise === 'findTargetPosition'`.
- Both interval **directions** and a separate interval **SRS lane** wired (`intervalSrs` in the per-instrument learning-state blob).
- Interval feedback now renders in the user's selected **notation** (sharp / flat), and the note area shows Natural / Sharp / Flat properly.
- A missed **"identify the interval"** question now marks the wrong chip.
- **Gentler first session**: a fresh interval learner defaults to a `focused` register and ascending-only direction (was `mixed` / `both`); existing users keep their saved picks.
- **Robustness**: when `buildIntervalQuestion` returns null on the chosen string (a degenerate fret window), the engine tries the other candidate strings before dropping to a plain note question; the last-tapped interval is kept when leaving Multi; space is reserved for the "About this interval" row; Hebrew singular "1 interval tracked" string added.
- Interval practice page **re-skinned** to the Notes-selector palette.
- **Teacher / interval sessions stay armed across a round.** A Teacher or interval session selected before a round starts is no longer discarded when the round begins.

**Audio**
- **Note volume redesigned.** The four-step Note volume picker became a draggable `StepperMeter` (− / + buttons + drag track, shown as a percentage of the old default). The makeup-gain multiplier (`pref_noteVolume`) is now a plain `1×–10×` number (was capped at `4.8×`) so drill notes can go noticeably louder, with the `DynamicsCompressor` limiter still catching peaks; legacy string values (`'low' | 'normal' | 'high' | 'max'`) are mapped forward on load. This is separate from the still-unbuilt B1/B2 audio-refinements plan in §3.

**Cross-device sync**
- **Theme and Silent mode now sync across devices**, joining `pref_language` — matching the standing preference that user-facing settings should follow the account, not the device.
- The **leaderboard opt-out was removed** (appearing on the leaderboard requires only Google sign-in, as the Free-tier description already assumed).

**Boot / build freshness**
- The boot splash is **held until the first data load** and draws into the Android notch.
- The boot splash **checks for a newer deployed build**, and the build-info "refresh" button now pulls the newest deploy rather than only re-reading the current one.

**Android / infra**
- The themed background is painted under the status-bar inset (no more system-coloured strip behind the notch).
- The debug APK stamps a real `versionName` and guards the `versionCode` bump.
- CI workflow actions bumped off the deprecated Node 20 majors.

**Internal — no behaviour change**
- **`src/App.tsx` (~2000 lines) decomposed into concern hooks + presentational pieces** across ~10 refactor commits: the settings drawer + its sections, the drill board + transport controls, the account cloud-sync effects, the voice-profile summary hook, the mastery-overlay memos, the global preference state, the navigation + back-handler state, the round lifecycle + celebrations, and assorted small UI pieces and self-contained effects/helpers. Like the `index.css` split noted above, the "Files touched: `src/App.tsx`" lines in the §3 implementation plans now often mean the relevant extracted hook.
