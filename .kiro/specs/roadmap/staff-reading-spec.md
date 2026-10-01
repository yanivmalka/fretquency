# Staff Reading — Design Specification

Status: **Slices 1 and 2 built and shipped (2026-09-25).** The product owner
asked to add staff reading and left the design to Claude ("התחל כראות
עיניך"); Slice 1 shipped the two first exercises. The product owner then asked
for the whole deferred list at once — a Progress tab, cloud backup, the
reverse exercise, reading a short phrase, frets above 12 with key signatures,
and a daily goal — which is Slice 2. This document records what exists, the
decisions it rests on, and what is still open (§11).

## 0. Foundational principle

Staff reading is its **own learning domain**, a sibling of Intervals and
Scales, not a mode of the Notes Selector and not blended into another domain
(premium-product-plan.md §4: "Staff reading only needs pitch↔name and is
otherwise independent — an independent track"). It has its own screen, its own
engine, its own SRS lane, its own history and its own daily goal. It is
Premium, like every other new content domain (premium-product-plan.md §2:
"New content domains … are Premium only").

## 1. Product definition

Four exercises, all built on the same written pitch:

- **Name the note** — one note is written; pick its name from a chip row. The
  note plays after the answer, right or wrong, so the written note, its name
  and its sound connect.
- **Find it on the neck** — one note is written; tap a place on the neck that
  plays that exact pitch. Any string counts. After the answer every place
  that plays it is shown in green.
- **Where is it written?** (the reverse) — a place on the neck is marked; put
  the note where it is written on the staff (§6.3).
- **Read a phrase** — four notes are written in a row, one bar; name them in
  order, and hear the phrase played back at the end (§6.4).

The neck exercises are the real point for a guitarist: they link the page to
the instrument, the gap other reading apps (piano-centred) leave.

## 2. Where it lives

- `LearnHub` tile **Staff reading** (📖), `LearnDomain` `'staff'`, locked
  for non-Premium users (opens the upgrade page).
- `App.tsx` renders `StaffPracticeScreen` as a second home screen, exactly
  like the Scales branch (self-contained, no `DrillConfig` handed back). The
  screen has two tabs, **Practice** and **Progress** (§12).
- The **Daily practice** page shows a separate staff card (§8.1).
- Feature flag `staffReading: 'premium'` in `src/utils/features.ts`.

## 3. Staff theory (`src/utils/staff.ts`, pure)

- Staff positions count diatonic steps from the **bottom line** (0), one per
  line or space; 8 is the top line. Treble bottom line = E4, bass bottom
  line = G2.
- Ledger lines: every even position from −2 downward / from 10 upward, up to
  and including the note's own.
- **Clef per instrument** (`staffSpecFor`):
  - guitar, banjo — treble clef, written **one octave above** the sound, with
    the small 8 under the clef;
  - bass — bass clef, written one octave above the sound;
  - mandolin, ukulele — treble clef at pitch.
  The screen states this in one line of help text, because it is the first
  thing that confuses a guitarist reading the staff.
- `writtenMidiAt(position, clef, sign, key)` is the exact inverse of
  `staffPosition` (checked for every pitch, key and clef) — "Where is it
  written?" turns the learner's placed note back into a pitch with it.

### 3.1 Key signatures and spelling

Keys offered: C, G, D, A, E (0–4 sharps) and F, B♭, E♭, A♭ (1–4 flats),
drawn after the clef in the conventional order and positions
(`keySignaturePositions`; the bass clef is the treble shape two steps lower).
In every one of these keys the plain sharp-or-flat spelling of each pitch
class is already correct (no E♯ / C♭), so:

- **Spelling** — in a sharp key black keys are spelled as sharps, in a flat
  key as flats (`keySpelling`). **In C (no signature) the app-wide
  sharps/flats setting decides**, as it does everywhere else. Choosing a key is
  the learner explicitly choosing a spelling, so it overrides the setting
  only while that key is chosen. Chip labels follow the notation setting
  (A-B-C / Do-Re-Mi) always.
- **Which sign is written** (`passageSigns`) — a note gets a sign only when
  its alteration differs from what is in force on that line or space: the
  key signature, or an earlier accidental in the same bar (a phrase is one
  bar). So F in D major gets a ♮; a second C♯ on the same line in C gets
  none.

## 4. Item identity (`src/learning/staffItem.ts`)

`staff:<sounding MIDI>`. The clef is fixed per instrument and the learning
state is already per instrument, so the pitch alone identifies "the G on the
second line". Spelling and key are display only and are not part of the item
— reading G in G major and in C reviews the same item.

## 5. Pool (`src/learning/staffDrill.ts`)

Every pitch playable inside the chosen fret range on any string (respecting
banjo's short fifth string via `minFrets`), each with all its positions.
Three controls, persisted in `localStorage` (`staff_range`, `staff_key`,
`staff_naturalsOnly`, plus `staff_exercise`):

- **Range:** frets 0–3 (open position, the default), 0–5, 0–12, and **12 to
  the last fret** (the upper neck only, so it does not repeat the open
  notes). The neck boards show exactly the range's frets.
- **Key signature:** §3.1.
- **Notes:** the seven notes of the key only (default; in C that is "natural
  notes only") / every note, with accidentals where needed. The setting is
  still stored under its Slice 1 key `staff_naturalsOnly`.

The staff box grows to fit the pool: its height comes from the lowest and
highest position the whole session can ask, so it never jumps between
questions, the open position stays compact and the high range gets room for
its ledger lines (up to 6–7 on guitar and bass at the top fret — checked in
`scripts/check-staff.mts`).

## 6. Exercises (`src/hooks/useReadingEngine.ts`)

One small dedicated engine, a sibling of `useScaleChipEngine` (the prompt is a
written pitch and "find it" wants an exact pitch, not a pitch class, so the
shared `useGameEngine` does not fit). Originally `useStaffEngine`; since Tab
reading it is `useReadingEngine`, shared by both reading domains — the
screen passes the question picker, and "Where is it written?" answers
through `answerPitch` (tab-reading-spec.md §6). A question holds one note or a phrase;
**each note is its own answer** (its own SRS review, history row and score),
and the question ends when every note is answered or the time runs out
(every unanswered note then counts as missed). The usual `useScoring`
speed/streak scoring applies per note.

| Exercise | Questions | Seconds per note |
| --- | --- | --- |
| Name the note | 12 | 10 |
| Find it on the neck | 12 | 15 |
| Where is it written? | 12 | 20 |
| Read a phrase | 6 phrases × 4 notes | 8 (32 per phrase) |

### 6.1 Name the note
Chips: the key's 7 notes, or all 12 (reuses `IntervalChoiceRow`), labelled
in the key's spelling. Correct = same pitch class.

### 6.2 Find it on the neck
`StaffNeckBoard`: frets bottom…top of the range, lowest string on top like
every other neck, **blank tiles** (names would give the answer away),
open-string names on the side, fret numbers below with the inlay frets bold.
Reuses ScaleOrderBoard's grid styling and its left-handed mirroring. Correct =
exactly the written pitch (octave matters), on any string.

### 6.3 Where is it written?
The same neck board, read-only, with one place **marked** (a random one of
the item's positions, so every string gets practised). Above it the staff is
an input: a tap puts a note on the nearest line or space, ▲ / ▼ move it one
step (a phone tap on a 5-unit step is too coarse to be the only control), and
when every note is allowed a ♯ / ♭ (and ♮ in a key other than C) toggles the
sign. **Check** commits. Correct = the placed note, read with the key
signature, is exactly the marked pitch — so an enharmonic spelling (D♭ for
C♯) counts, as it sounds the same. After the answer the placed note turns
green or red and, when wrong, the right one appears beside it in green. The
marked note plays after the answer.

### 6.4 Read a phrase
`buildStaffPhrase`: the first note is an ordinary SRS-weighted pick; each
next one lies within `PHRASE_MAX_LEAP` (3) pool steps of the one before and
never repeats it, again SRS-weighted — so a phrase moves like a melody while
still visiting the notes that are due. Drawn as one bar of quarter notes with
a final bar line; the note to name next is highlighted, each answered note
turns green/red with its name written under it. At the end the phrase is
played back note by note ("hear what you read"), with the chime when every
note was right. No rhythm yet (§11).

## 7. Picking

`pickStaffQuestion` weights the pool by the staff SRS: due → 4, never seen →
3, known and not due → 1; never the same pitch twice in a row. It reads the
schedule fresh on every question, so a miss early in a session brings that
note back later in the same session (after the SRS lapse delay).

## 8. Persistence and cloud

`InstrumentLearningState` carries `staffSrs` (Leitner, same `srs.ts`),
`staffHistory` (capped ring buffer of 300 — a phrase session records 24 rows;
`form` = `nameNote` / `findOnNeck` / `findOnStaff` / `readPhrase`) and
`staffDaily` (§8.1), with normalise / merge helpers mirroring the scale ones.

**Cloud backup:** these fields ride the existing `user_learning_state` blob
(`learningSync.ts`; documented in `supabase/migrations/0017_*`, no DDL): SRS
merged per item, history as a union, the daily goal per day — never
last-writer-wins. The Staff reading screen (and, in the same change, the
Scales screen, whose fields had the same gap) pushes the blob after every
answer and re-reads on `learning-synced`, so progress survives a sign-out, a
reinstall and a second device. Guests stay local.

Nothing here touches note history, mastery, badges, the leaderboard or
personal bests.

### 8.1 Daily goal

`staffDaily` is the domain's own goal record (like `intervalDaily`, never the
note `daily`): target 12 answers (one session of single notes; a phrase
session counts each note), ticked by every staff answer, rolled over at local
midnight. Shown as a bar on the Staff reading start and end cards, and as a
separate **Today's staff reading** card on the Daily practice page with one
button that opens the Staff reading page. There is no planned staff session:
the page's own picker already favours the notes that are due.

## 9. Rendering (`src/components/StaffNotation.tsx`)

A self-contained SVG: five lines, the clef drawn as **paths** (no music font
— the U+1D11E glyph is missing on many Android WebViews), the key signature,
and one note or a phrase of them, each a filled head with a stem (up below
the middle line, down from it), ledger lines and a ♯/♭/♮. Note states colour
the head: live, current (the phrase note to name), correct, wrong, ghost (the
note being placed), and the Progress board's three statuses. Staff notation
always reads left to right: the SVG is pinned LTR (also against a Hebrew page,
where `direction` would flip SVG `text-anchor`) and is **not** mirrored by the
left-handed setting — that setting mirrors the instrument, and a staff is not
part of it. CSS: `src/styles/32-staff-reading.css`.

## 10. Verification

- `node --experimental-strip-types scripts/check-staff.mts` — staff positions
  in both clefs with sharps and flats, ledger lines, per-instrument octave
  shift, every pool position plays its pitch in all four ranges, the high
  range starts at fret 12, key signature positions and spelling, which notes
  need a sign in a bar, `writtenMidiAt` round-trips every pitch in every key
  and clef, key-filtered pools, phrase length / leap limit / no repeats, the
  progress statuses, `staffDaily` ticking (and never the note goal), its
  merge and normalisation.
- Live in a browser (Playwright, 400×860, Premium simulated), English and
  Hebrew: a D-major phrase, "Where is it written?" with a sharp placed, the
  high range on the neck, the Progress tab, the Daily practice card; answers
  reach `staffSrs` / `staffHistory` / `staffDaily` with the new forms, no
  console errors.
- Not verified live: the cloud round-trip between two signed-in devices (the
  merge itself is covered by the check script; the push reuses the existing
  reconcile).

## 11. Still open

1. **Rhythm** — phrases are plain quarter notes; reading rhythm (and a time
   signature) is its own step.
2. ~~**Play what you read**~~ — done: "Name the note" and "Read a phrase" can
   be answered by playing the guitar (`useReadingEngine.hear`, `usePitchStream`,
   an Answer mode card per screen, like Scales' "Tap the scale in order").
   Unlike Scales/Tab, the octave must match exactly (`pitchOctaveStrict`) —
   the staff is testing the written pitch, octave included, not just the
   letter name.
3. **8va** — the top frets are written with many ledger lines, as a learner
   reads them; real music often uses an 8va line there.
4. **Longer phrases** (6–8 notes, two bars) and keys beyond four sharps/flats
   (which need E♯ / C♭ spelling).
5. **Teacher integration** — a planned "today's notes to read" session with a
   "why these?" list, like the notes and intervals cards.
