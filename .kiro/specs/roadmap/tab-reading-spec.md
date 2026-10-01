# Tab Reading — Design Specification

Status: **Slices 1 and 2 built and shipped (2026-09-25).** The product owner
asked to add tab reading; Claude proposed the domain, its four exercises and
a two-slice split, and the owner approved it as proposed ("מתאים. התחל
ביצוע"), including the orientation decision in §3. The owner then asked for
Slice 2 ("המשך לשלב השני") — chords and technique symbols, §13. What is still
open is in §12.

## 0. Foundational principle

Tab reading is its **own learning domain**, a sibling of Staff reading,
Scales and Intervals, not a mode of the Notes Selector and not blended into
another domain. It has its own screen, its own SRS lane, its own history,
its own daily goal and its own Progress tab. It is Premium, like every other
content domain.

It shares the **drill engine** with Staff reading (`useReadingEngine`, §6),
because Premium is one learning mechanism, not an engine per domain: the two
domains differ only in what a question holds and how it is drawn.

## 1. Product definition

Four exercises, all built on a fret number written on a tab line:

- **Name the note** — one number is written on one line; pick the note it
  plays from a chip row. The note plays after the answer.
- **Find it on the neck** — one number is written on one line; tap exactly
  that place on the neck. Only the written place counts (the line *is* the
  string), unlike Staff reading where any place with the pitch counts. After
  the answer the right place is shown in green.
- **Write it in tab** (the reverse) — a place on the neck is marked; tap the
  tab line of its string, pick the fret number, press Check.
- **Read a riff** — five numbers in a row; name them in order, then hear the
  riff played back.

## 2. Where it lives

- `LearnHub` tile **Tab reading** (📝), `LearnDomain` `'tabs'`, locked for
  non-Premium users (opens the upgrade page).
- `App.tsx` renders `TabPracticeScreen` as a second home screen, exactly like
  the Staff reading branch. Two tabs, **Practice** and **Progress**.
- The **Daily practice** page shows a separate `TabTodayCard` (§8).
- Feature flag `tabReading: 'premium'` in `src/utils/features.ts`.

## 3. Orientation — the one deliberate break from the app

Every real tab puts **string 1, the thinnest and highest, on the top line**.
The app's necks put the lowest string on top (a standing product rule). The
owner approved this split:

- the tab (`TabNotation`) follows the real-world convention, so the learner
  reads the tabs they will meet everywhere else;
- the neck board beside it (`StaffNeckBoard`) keeps the app's layout;
- the start card says so in one line ("…upside down from the neck in this
  app…"), because this flip is exactly what beginners get wrong — "Find it on
  the neck" and "Write it in tab" train it directly.

When the top and bottom strings share a name (guitar e … E), the top one is
written in lower case, as real tabs do. String names follow the notation and
sharps/flats settings.

The tab is notation, not the instrument: pinned LTR on a Hebrew page and not
mirrored by left-handed mode (same as the staff).

## 4. Item identity (`src/learning/tabItem.ts`)

`tab:<string>:<fret>`. A tab writes a place, not a pitch, so two places that
sound the same are two items — reading them means reading two different
lines. Kept in its own `tabSrs` map, never the note `srs` (whose
`"<string>:<fret>"` ids look alike but mean "name this fret").

## 5. Pool (`src/learning/tabDrill.ts`)

Every (string, fret) inside the chosen range (banjo's short fifth string
respected via `minFrets`). Controls, persisted in `localStorage`
(`tab_exercise`, `tab_range`, `tab_naturalsOnly`):

- **Range:** the Staff reading ranges — 0–3 (default), 0–5, 0–12, 12 to the
  last fret. Only the range constants are shared.
- **Notes:** natural notes only (default) / with sharps and flats. Tabs have
  no key, so there is no key signature.

## 6. Engine (`src/hooks/useReadingEngine.ts`)

The former `useStaffEngine`, generalised: the domain passes `pickItems`
(the items of the next question), `markPosition` (the "write it" exercises)
and `exactPosition` (tab: a neck tap must be the written place). Answers:
`selectName`, `tapPosition`, `answerPitch` (staff) and `answerPosition` (tab).
Staff reading's behaviour is unchanged.

| Exercise | Questions | Seconds per note |
| --- | --- | --- |
| Name the note | 12 | 10 |
| Find it on the neck | 12 | 12 |
| Write it in tab | 12 | 20 |
| Read a riff | 6 riffs × 5 notes | 8 (40 per riff) |

## 7. Picking

`pickTabQuestion` weights by the tab SRS (due 4, new 3, known 1) and never
repeats the previous place. `buildTabRiff`: the first note is an ordinary
pick; each next one is on the same or a neighbouring string and within two
frets (`RIFF_MAX_STRING_STEP` / `RIFF_MAX_FRET_STEP`), never the same place
twice in a row, again SRS-weighted — so a riff sits under one hand. If no
neighbour exists (a sparse naturals-only high range) any other place is used.

## 8. Persistence and cloud

`InstrumentLearningState` carries `tabSrs`, `tabHistory` (ring buffer of 300;
`form` = `nameNote` / `findOnNeck` / `writeTab` / `readRiff`) and `tabDaily`
(target 12, its own goal, never the note or staff goal). They ride the
existing `user_learning_state` blob (`supabase/migrations/0018_*`, doc-only):
SRS merged per item, history as a union, the daily goal per day. The screen
pushes after every answer and re-reads on `learning-synced`. Nothing touches
note history, mastery, badges, the leaderboard or personal bests.

## 9. Progress tab (`tabMastery.ts`, `TabProgressBoard.tsx`)

Every position of the range on a neck grid (app orientation), its fret number
in the tile, coloured not started / learning / mastered with Staff reading's
thresholds (own constants).

## 10. Rendering (`TabNotation.tsx`)

SVG: one line per string, TAB down the start, open-string names on the left,
each number on its line over a knock-out so the line does not cross it.
States: live, current (the riff note to name), correct, wrong, ghost (being
written). With `onPickString` a tap selects the nearest line. CSS:
`src/styles/33-tab-reading.css` (reuses the staff card classes).

## 11. Verification

- `node --experimental-strip-types scripts/check-tabs.mts` — ids, pools for
  every instrument / range / notes setting, picker, riff limits, board
  statuses, `tabDaily` ticking alone, merge, normalisation (foreign ids and
  forms dropped, older blobs get empty fields). `check-staff` and
  `check-learning` still pass.
- Live (Playwright, 400×860, Premium simulated), English and Hebrew: all four
  exercises, the Progress tab, the Learn tile and the Daily practice card;
  answers reach `tabSrs` / `tabHistory` / `tabDaily` with every form, no
  console errors. Staff reading's four exercises re-checked on the shared
  engine.
- Not verified live: the cloud round-trip between two devices (merge covered
  by the check script).

## 12. Still open

1. **Mandolin tab has eight lines.** The app models the mandolin as eight
   separate strings, so its tab shows eight lines; real mandolin tab has four
   (one per pair). Fixing it means modelling courses app-wide; until then
   chords are not offered on the mandolin (§13.1).
2. **More chord kinds** — major 7, minor 7, sus, slash chords; strummed
   rhythm patterns written under a chord.
3. **More symbols** — release bends (7b9r7), half bends, harmonics (<12>),
   tapping (t), let ring.
4. **Rhythm** — tabs usually omit it; a later step could pair tab with the
   staff's rhythm.
5. ~~**Play what you read**~~ — done: "Name the note" and "Read a riff" can
   be answered by playing the guitar (`useReadingEngine.hear`, `usePitchStream`,
   an Answer mode card, like Staff reading and Scales' "Tap the scale in
   order"). A played pitch can't say which string it came from, so this only
   covers the exercises already judged by name, not `findOnNeck`/`writeTab`
   (which ask for the place itself); the octave is folded (same as Scales),
   not strict (unlike Staff), since a tab item is a place, not a tested pitch.
6. **Teacher integration** — a planned "today's tab" session with a "why
   these?" list.

## 13. Slice 2 — chords and technique symbols

The screen gets a **Topic** switch — *Single notes* (Slice 1), *Chords*,
*Techniques* — and each topic its own exercises. Range and the notes setting
apply to all three; everything records into the same tab lane (`tabSrs`,
`tabHistory`, `tabDaily`), with the forms `nameChord` / `playChord` /
`nameTechnique` / `techniqueNote`. The Progress tab follows the topic.

### 13.1 Chords (`src/learning/tabChords.ts`)

- **Name the chord** — a column of numbers; pick the root and the kind
  (major / minor / 7 / 5); the answer is judged once both are picked, and the
  chord is strummed. On bass only power chords exist, so only the root is
  asked.
- **Play the chord** — tap every place it plays on the neck, one per string
  (a new tap on a string replaces the old one), then Check. After the answer
  the right places are green and wrong taps red.

The shapes are **found in the instrument's own tuning**, not typed in: root on
the bass string, every string tuned higher played with no gap, every chord
note present (a seventh chord may drop its fifth), at most a four-fret
stretch and four fingers (a barre counts as one). Two rules keep the shapes
the ones players actually use: a shape with an open string stays within the
first three frets (C = x32010, never B = x21402), and a shape with no open
string has its root at the lowest fret (B = 799877, never 764447). One
voicing per root, kind and bass string (the three lowest-tuned strings). On
ukulele, whose chords are not root-in-bass (G = 0232), all four strings play
and the root may be anywhere. Kinds per instrument: guitar all four, bass
power chords, ukulele and banjo major / minor / 7 (banjo's drone string
left out), mandolin none (§12.1). Items: `tab:chord:<frets low→high>`.

### 13.2 Technique symbols (`src/learning/tabTechniques.ts`)

Eight symbols: `5h7` hammer-on, `7p5` pull-off, `5/7` slide up, `7\5`
slide down, `7b9` bend (a whole step; the second number is the pitch it
reaches), `7~` vibrato, `x` muted note, and PM written above the tab.

- **What does it mean?** — pick the technique's name; after the answer a
  one-line explanation of how to play it, and its sound.
- **Which note do you hear at the end?** — name the note the technique ends
  on (the muted note, which has no pitch, is left out).

The item is the symbol (`tab:tech:<technique>`); each question writes it on a
fresh string and fret inside the range (with *Natural notes only*, the note
it ends on is natural).

### 13.3 Sound (`src/utils/audio.ts`)

`playChordStrum` strums the places low to high, all ringing together;
`playNoteGlide` glides a sampled note's pitch for slides and bends (the
synthesized mandolin and baritone ukulele play the two notes instead).
Hammer-ons and pull-offs play the two notes in quick succession.

### 13.4 Shared pieces touched

`useReadingEngine.answerWith` (an answer the screen judged), a neutral
`selected` state on `IntervalChoiceRow` (a two-part answer shows its first
part without green or red), `selected` / `wrong` lists on `StaffNeckBoard`,
and `TabNotation` columns that hold several cells (a chord) or a label above
(PM).

### 13.5 Verification

`scripts/check-tabs.mts` additionally checks the open guitar shapes, barre
shapes, ukulele shapes and bass power chords by name; that every chord on
every instrument and range sounds only and all of its notes with the root in
the bass, stays in range and round-trips its id; each symbol's writing,
direction, range and end note; and the new forms. Live (Playwright, English
and Hebrew): both chord exercises, both technique exercises, both Progress
lists, no console errors, answers recorded with the new forms.
