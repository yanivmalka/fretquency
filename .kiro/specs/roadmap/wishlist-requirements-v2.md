# Fretquency — Roadmap v2 (Selector-Model)

This supersedes the planning direction (not the content) of `wishlist-requirements.md`. That file is kept as-is for historical reference and is **not modified**.

**Why this exists:** the original roadmap's v1.0 was built around a "Stage" navigation model (chevron nav, stage picker, progress bar, custom-stage snapshots). The app that actually shipped uses a different, simpler model instead — the **Selector Panel**: string + fret range + difficulty, chosen directly rather than progressed through. This document re-plans around that reality, current as of the v1.0 audit on 2026-08-26.

Three buckets, per your request:
1. **Current Gaps** — things the (superseded) v1.0 roadmap wanted that still make sense under the Selector model, but aren't done yet.
2. **Future Features** — good ideas from v1.1+ that still apply and build cleanly on the Selector model.
3. **Needs Product Decision** — ideas from the old roadmap that may still have value, but depend on a call (keep Stage-model concept? monetize? build infra?) before they can be scoped. Nothing here is discarded.

---

## 1. Current Gaps

Things worth closing before calling the Selector-model experience "done."

### Core Game
- **Failed-note re-queue is a dead stub.** `failedFretsRef` in `useGameEngine.ts` is populated but never consumed — missed notes should reappear once more in the session instead of silently vanishing. This was in the original roadmap ("failed notes re-queued once") and still applies directly to the Selector model.
- **Settings redesign never got wired in.** `src/components/Settings.tsx` and `src/design-preview/` implement chips for time options, notation (A-B-C/solfege), circle order, and are otherwise close to spec — but they're orphaned, unused by `App.tsx`. Either finish integrating this into the live `SelectorPanel.tsx` or delete it as dead code; leaving it half-built is the worst option.
- **Per-selector-combination history/stats** — already done (`historyKey()`), no action needed, listed here only for completeness against the audit.

### UX Polish (small, low-risk, still-relevant items from old v1.0)
- Click sound not wired on every interactive control (e.g. game-end "OK" button uses a bare `onClick`).
- No `?` info affordance explaining the clock method / how to read the fretboard to a new user, auto-dismissing.
- Toggle-button dashed-border-before-click styling not present — minor discoverability polish.
- Settings panel is a persistent inline block rather than a dismissible floating overlay — worth revisiting now that Settings.tsx already explores a chip-based layout, but only as part of finishing the Settings redesign above, not as a separate stage-picker-style overlay.

### Onboarding
- Placement-test result doesn't auto-apply the suggested string/difficulty to the Selector Panel — it just tells the user to go set it manually. Given the Selector model is the actual UI now, this is a quick, high-value fix: pipe the placement-test result straight into `useSelector`'s persisted fields.

---

## 2. Future Features

Ideas from v1.1/v1.2 of the original roadmap that don't depend on the Stage model and still fit naturally on top of the Selector Panel.

### Scoring & Feel (from old v1.1)
- Points system with speed bonuses, streak multiplier, live score counter — orthogonal to navigation model, applies as-is.
- Session summary card on stop (score, streak, accuracy, avg speed, personal best) — personal-best tracking would key off `historyKey()`, same as today's stats.
- Celebration tiers (radial pulse / milestone rings / major award) — purely presentational, no dependency on Stage concept.
- Adaptive timer (tighten/relax based on streak) — applies per current session regardless of how string/frets/difficulty were chosen.
- Audio refinements (single-note question sound, chime on correct, escalating streak tone, optional background beats).
- Silent Mode — visual-only, no audio; independent of navigation model.

### Progress & Motivation (from old v1.2)
- Mastery heatmap on the note circle, colored by success rate per string/note — this actually maps *better* to the Selector model than to Stages, since accuracy is already tracked per `historyKey()` combination.
- Progress chart: accuracy % and avg response time over recent sessions.
- Badges (Speed Demon, Perfect Session, String Master, streak-based, Most Improved) — all computable from existing `useHistory` data.
- Practice schedule / local reminder notifications with streak counter.

### Adaptive Suggestion (carried over from old v1.0, still wanted)
- Auto-suggest a harder or easier Selector configuration (different fret range / difficulty) based on recent accuracy for the current combination — this is the Selector-model equivalent of the old "adaptive suggestion between stages" idea, just retargeted at Selector fields instead of a stage index.

---

## 3. Needs Product Decision

Ideas from the old roadmap that are plausible but require a call before scoping — either because they assume the retired Stage model, imply infrastructure/monetization not yet decided, or because the current shipped direction makes their scope ambiguous. **Not deleted, not scheduled — flagged for a decision.**

- **"Custom Stage" save/rename/clear (with a free-tier limit of 1).** Under the Selector model there's no "stage" to save a *snapshot of a stage* — but there may still be value in letting a user bookmark/name a specific Selector combination (string+range+difficulty+mode) for quick recall. Needs a decision: is a "saved preset" for the Selector Panel wanted, and if so is a free-tier limit even relevant before any monetization exists?
- **Stage-style navigation chrome** (chevron arrows, progress bar with per-string dashes, tap-title picker overlay, title glow, swipe-to-change). This entire bundle assumed discrete Stages to move between. Needs a decision: does the Selector model want *any* equivalent "quick switch between recent/favorite combinations" affordance, or is direct panel editing considered sufficient going forward?
- **Multi-string emphasis animations** (string label flash/scale on switch, haptic pulse on string switch) — still makes sense given Selector supports multi-string mode, but low priority until multi-string mode usage is confirmed to be common enough to warrant the polish.
- **Monetization-adjacent items carried from v2.1** (premium unlock via ad/donation, free-vs-premium feature gating) — out of scope until there's a decision to introduce a premium tier at all; several v1.0-era items (e.g. "Free user: 1 custom stage") implicitly assumed this existed earlier than it does in the original roadmap's own version sequence.
- **Auth/sync, leaderboard, expertise tests, admin dashboard (v2.0+)** — all still plausible long-term, but explicitly out of scope until there's a decision to add a backend at all; the current app is intentionally backend-free.

---

## Summary

| Bucket | Item count | Depends on |
|---|---|---|
| Current Gaps | 6 | Nothing — actionable now under existing Selector model |
| Future Features | 11 | Nothing structural — can be scheduled like any other feature work |
| Needs Product Decision | 5 groups | A explicit decision (preset UX? backend? monetization? nav chrome?) before scoping |
