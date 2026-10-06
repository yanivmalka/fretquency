# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This repo has many long-lived `claude/*` branches and sibling worktrees, and the checkout is often well behind `origin/main` — the session-start git snapshot and even `git status` "up to date" can be stale. **Run `git fetch origin` and compare `HEAD` to `origin/main` before starting any non-trivial work**, including documentation.

## Project

A single-page React + TypeScript PWA that drills guitar and bass fretboard note recognition. Also packaged as an Android app via Capacitor.

Guests run **entirely client-side** (localStorage + IndexedDB + in-memory) and never touch the network for state. Signing in with Google adds an **optional Supabase backend** that is purely a cross-device backup/restore layer — localStorage/IndexedDB stay the source of truth the UI reads from. A build with no Supabase env vars degrades cleanly to pure guest mode (`supabase` is `null`, nothing calls the network).

Three entitlement tiers: **Free**, **Pro**, **Premium** (`free < pro < premium`; each includes everything below it). Paid tiers unlock features inside the app; the app itself is free to install.

## Commands

- `npm run dev` — start Vite dev server (binds to all interfaces for LAN/phone testing at `http://<host>:5173/fretquency/`)
- `npm run build` — type-check (`tsc -b`) then production build via Vite
- `npm run lint` — ESLint over the whole repo
- `npm run preview` — serve the production build locally
- `npm run gen:icons` — regenerate PWA/app icons from `assets/note-mark.png` into `public/`

There is no test suite/runner configured in this repo. Instead, `scripts/check-*.mts` are hand-run diagnostics that assert an invariant of one subsystem (`check-intervals`, `check-learning`, `check-learning-path`, `check-game-curriculum`, `check-game-progress`, `check-game-sync`, `check-candidates`, `check-candidate-rendering`, `check-tiering-db`, `check-staff`, `check-tabs`, `check-app-search`, `eval-voice`, `eval-voice-e2e` — the end-to-end voice score over takes recorded in the admin Voice test lab, 🐞 → 🎙). Run one with `node --experimental-strip-types scripts/<name>.mts`. They are never part of a build.

### Supabase env

Cloud features read `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env` (copy `.env.example`). The anon key is safe to ship — row access is enforced by Postgres RLS. `dev`/`build` work without these; the app just stays in guest mode.

SQL lives in `supabase/migrations/` (`0001`…`0021`, applied via the Supabase SQL Editor or `supabase db push` — no local Supabase CLI wiring). Each migration's header comment explains its table + RLS shape. Roughly: `0001` history/personal-best, `0002` voice templates, `0003` deletion tombstones, `0004` settings blob, `0005` feedback board, `0006` leaderboard, `0007`–`0010` Pro entitlements, `0011` Premium tier, `0012` learning state (SRS), `0013` learning path, `0014` interval SRS, `0015` game progress, `0016` registered-user count, `0017` scale + staff learning keys, `0018` tab learning keys (both doc-only, same blob), `0019` the private `app-releases` Storage bucket + `apk_testers` allowlist for the in-app APK update, `0020` leaderboard weekly XP, `0021` interval daily goal + history (doc-only, same blob — numbered after 0020 rather than alongside 0015 because the CLI's migration-history table needs a unique numeric version per file, and it originally collided with `0015_user_game_progress.sql`).

`scripts/grant-pro.mts` grants/revokes a Pro **or Premium** entitlement out of band — needs `SUPABASE_SERVICE_ROLE_KEY` (a secret; git-ignored `.env` only, never a `VITE_*` var).

### Android (Capacitor)

The `android/` project is generated, not committed (it's in `.gitignore`). Config in `capacitor.config.ts` (`appId: com.fretquency.app`); native overrides that survive a regen live in `android-overrides/` (`AndroidManifest.xml`, `MainActivity.java`, `AppUpdaterPlugin.java`, `xml/file_paths.xml`, a committed `debug.keystore`).

- `npx cap add android` — one-time, regenerates `android/`
- `npm run cap:sync` — `npm run build` then `npx cap sync android`
- `npm run android` — `cap:sync` then opens Android Studio
- `.github/workflows/android.yml` — manual (`workflow_dispatch`) debug-APK build. Uses Node 22 + JDK 21, signs with the stable `android-overrides/debug.keystore` so updates install in place (the build **fails** if that file is missing on the branch, and a post-build `apksigner` check fails it if the APK's cert does not match the keystore — never regenerate the key, a new one forces an uninstall on every device), and builds with `CAP_BUILD=1` so Vite uses a **relative `base`** (`./`) instead of the Pages sub-path.

Native plugins: `@capacitor/app`, `@capacitor/browser` (deep-link OAuth callback so Google sign-in stays inside the APK), `@capacitor/splash-screen`, `@capacitor-community/speech-recognition`. The speech plugin's library manifest contributes `RECORD_AUDIO` + the `RecognitionService` `<queries>` entry through Gradle manifest merging. The override manifest also declares `MODIFY_AUDIO_SETTINGS` (+ `RECORD_AUDIO`): Capacitor's WebView grants a `getUserMedia` mic request (tuner, guitar-answer pitch detection, personal-voice engine) only when both come back granted, and an undeclared one is always denied.

**In-app self-update** (`android-overrides/AppUpdaterPlugin.java` — a local Capacitor plugin `AppUpdater` registered in `MainActivity` — plus `src/utils/appUpdate.ts` and the Account section's `AppUpdateCard`): downloads a newer APK inside the app and opens the system installer (manifest adds `REQUEST_INSTALL_PACKAGES`). The APK is deliberately **not** public — no GitHub Releases (the repo is public). The workflow uploads each build to the **private** Supabase Storage bucket `app-releases` (`apk/app-<versionCode>.apk` + a `latest.json` pointer) with the `SUPABASE_SERVICE_ROLE_KEY` repository **secret** (skipped with a warning if it is missing); storage RLS lets only admins and `public.apk_testers` read it, and the app signs a 2-hour URL for the download (reused across taps so a DownloadManager download that outlived the app resumes instead of restarting); the plugin downloads into `app-update/` under the external files dir, mapped by `android-overrides/xml/file_paths.xml`. Everyone else never sees the card.

### Build/deploy notes

Vite `base` is `/fretquency/` for the GitHub Pages target (`.github/workflows/deploy.yml` builds + deploys on push to `main`); `CAP_BUILD=1` switches it to `./`. The build embeds `__COMMIT_HASH__`/`__COMMIT_DATE__` (from `git rev-parse`/`git log`), so `npm run build` must run inside a git checkout. The PWA manifest uses `display: 'minimal-ui'` (not `standalone`) because Android Chrome disables the Web Speech API inside a standalone PWA. The service worker precaches app assets and runtime-caches the soundfont sample URLs + the lazy synthetic-voice template chunk. `vite.config.ts` also builds two extra standalone HTML entries (`design-preview.html`, `stats-redesign.html`) used as design labs.

## Architecture

The whole app is one page (`src/App.tsx`, ~2000 lines) composed from hooks that each own one concern plus dumb presentational components. `src/main.tsx` wraps `<App>` in `<LanguageProvider>` (the only React context) and drives the boot splash. App-level screen routing is plain nested conditionals in `App.tsx` — no router. `data-theme` on `<html>` selects the palette.

### Practice — the original drill

**State/derivation pipeline** (each feeds the next):
1. `useSelector` — the user's raw picks (strings, multi-string mode, byNote/byFret, fret-range halves, a precise fret window, difficulty). Persists each field to localStorage and derives `DerivedSettings` via `useMemo`. Produces `historyKey()`, the string key that scopes history/stats to the current settings combination. Takes `tier` so Pro-only picks fall back to a free default when the entitlement lapses (multi-string is capped at `FREE_MULTI_STRING_LIMIT` for Free; the precise fret window is Pro-gated).
2. `useDerivedNotes` — turns `DerivedSettings` (or an explicit candidate set) into concrete note/fret data for rendering.
3. `useGameEngine` — the quiz state machine: countdown timers, question picking (shuffle-bag / coverage pool, `pickSmartFret`), byFret vs byNote flow, scoring, an interval-question branch. Talks to `useHistory` and `useScoring`. Uses refs (`runningRef`, `sessionRef`, `answeredRef`, …) alongside state so timer callbacks see current values and stale callbacks from a previous "session" (bumped on every `start()`/`resume()`) are ignored.
4. `useScoring` — session score, streak, fire-multiplier level; reset per round.

**Two quiz modes**: **by fret** (a fret is highlighted, pick the note on the circle-of-fifths `NoteCircle`) and **by note** (a note is shown, tap every matching fret on `FretGrid`; the engine tracks `remainingFrets`/`foundFrets`).

Sharps/flats and circle-of-fifths/alphabetical ordering are centralized in `src/utils/music.ts` (`notes` = master `[string][fret] -> note name` table; always go through `notesMatch`/`displayNote`/`getCofNotes`, never compare note strings directly). `src/utils/instruments.ts` holds per-instrument tuning/string-count/fret-range and `CHROMATIC`.

### The drill seam — `src/drill/`

`DrillConfig` (`src/drill/DrillConfig.ts`) is the platform-neutral description of one drill: which strings/frets/notes it may ask about, byFret/byNote, question count, base time — and nothing about Practice's selector UI. Practice turns `DerivedSettings` into a `DrillConfig` (`deriveDrillConfig`); the Game builds one straight from a stage. A `DrillConfig` may carry an explicit `candidates` list (`src/drill/candidates.ts`) — exact `(string, fret)` positions — instead of filter-derived whole strings, which is how a Game stage or a Teacher session says "only these positions" without a new engine filter. `useDrillSession` (`src/hooks/useDrillSession.ts`) is a thin facade over `useGameEngine` that both Practice and the Game run a drill through; it reimplements no drill logic.

### Game layer — `src/game/`

**Disconnected from the app since 2026-10-01 (owner: "not relevant now")** — no entry point, no screen, no cloud sync is wired; the code below stays on disk so it can be re-hooked (see the wishlist's "Parked" item). Leave it out of reviews and design passes. Two pieces are still live because other code uses them: `stageResult.ts`/`models.ts` (Learning Path) and `useDrillHistorySink.ts` (the Practice interval drill).

A separate progression layer (**not** unified with Practice's Auto Advance curriculum in `src/utils/stageSequence.ts`). Data model in `models.ts` (`World` / `Stage` / `StageTargets`); the curriculum is **15 worlds / 139 stages** in `worlds.ts` + `stages.ts`, each stage a single skill whose `stage.drill` is a plain `DrillConfig` (relationships the engine can't ask directly are rendered as position `candidates`, with the concept in the title). `stageResult.ts` has pure `evaluateStars`/`meetsGoal` (0–3★ against three ascending goal tiers). `GameFlow.tsx` is one component with three nested screens (Home → World → Drill) — no router, no per-screen files. `gameProgress.ts` persists `bestStars` per stage to `localStorage['gameProgress']` (monotonic max, drives stage unlock); `gameSync.ts` reconciles it to `public.user_game_progress` (per-stage max merge, idempotent). `useDrillHistorySink.ts` gives the Game an **in-memory-only** `HistoryOps` so a Game drill never writes Practice's history / mastery / stats / badges / leaderboard.

### Premium Teacher & Learn area — `src/learning/`, `src/hooks/useLearning.ts`

An adaptive layer that sits *alongside* the Selector (a Premium user can ignore it and free-drill). Reached from the "Learn" drawer page (`LearnHub.tsx`, `LearnDomain` = `'notes' | 'daily' | 'intervals' | 'scales' | 'staff' | 'tabs'`).

- **Notes (P2)** — `weakness.ts` (which `(string,fret)` positions need work, read from the same `HistoryEntry` rows — it does **not** replace `src/utils/mastery.ts`, which still owns the fretboard overlay), `srs.ts` (a small transparent Leitner scheduler), `planner.ts` (emits a `DrillConfig` with `candidates` = the chosen positions). Everything keys on `noteItemId` = `"<string>:<fret>"` (deliberately notes-only, no generic cross-domain `Item` type).
- **Learning Path (P3)** — `path.ts` / `pathProgress.ts`: a fixed ordered sequence of checkpoints, each a neck region scored by "% of its positions mastered" against three tiers. Reuses **only** the threshold math from `src/game/stageResult.ts`, not the World/Stage/GameProgress framing.
- **Intervals (P4)** — `src/utils/intervals.ts` (pure interval theory: semitones ⇄ note name) plus a parallel learning set (`intervalCurriculum.ts`, `intervalPlanner.ts`, `intervalWeakness.ts`, `intervalMastery.ts`, `intervalDrill.ts`) keyed on `interval:<n>`. Two exercises (identify the interval / find the target note) in both directions, its own SRS lane, no path screen.
- **Staff reading** — `src/utils/staff.ts` (pure staff theory: clef + octave shift per instrument, staff position, ledger lines), `src/learning/staffItem.ts` / `staffDrill.ts` (items keyed `staff:<midi>`, pool per fret range + key, SRS-weighted picker and phrase builder), `staffMastery.ts` (Progress tab statuses), `useReadingEngine` (the drill engine shared with Tab reading) + `StaffPracticeScreen` (self-contained like Scales, four exercises: name the written note / find it on the neck / where is it written / read a phrase; key signatures; its own `staffDaily` goal, also shown by `StaffTodayCard` on the Daily practice page). `StaffNotation.tsx` draws the staff as SVG paths (no music font) and is never mirrored by left-handed mode. See `.kiro/specs/roadmap/staff-reading-spec.md`.
- **Tab reading** — `src/learning/tabItem.ts` / `tabDrill.ts` (items keyed `tab:<string>:<fret>` — a place, not a pitch; pool per fret range, SRS-weighted picker and a riff builder that stays under one hand), `tabChords.ts` (chord shapes *found* in each instrument's tuning by rule, not typed in — ids `tab:chord:<frets>`), `tabTechniques.ts` (h, p, slides, b, ~, x, PM — ids `tab:tech:<technique>`), `tabMastery.ts`, the shared `useReadingEngine` + `TabPracticeScreen` (three topics: single notes — name / find the exact place / write in tab / read a riff; chords — name / play on the neck; techniques — what it means / the note at its end; its own `tabDaily` goal and `TabTodayCard`). `TabNotation.tsx` draws the tab with **string 1 (the thinnest) on the top line**, like every real tab — a deliberate, owner-approved exception to the app's lowest-string-on-top necks, explained on screen; the neck boards beside it keep the app's layout. See `.kiro/specs/roadmap/tab-reading-spec.md`.
- **Persistence** — `learningState.ts` holds one `localStorage['learningState']` blob: instrument id → `{ srs, intervalSrs, daily, intervalDaily, intervalHistory, path, scaleSrs, scaleHistory, staffSrs, staffHistory, staffDaily, tabSrs, tabHistory, tabDaily, updatedAt }`. `learningSync.ts` reconciles it to `public.user_learning_state` — **per-item SRS merge** (`mergeSrsItem`), never last-writer-wins, so a review on another device is never lost. Fires a `learning-synced` window event on change. `useLearning()` is inert for non-Premium users.

### Auth & tiering

**Auth** (`src/hooks/useAuth.ts`, `src/utils/supabase.ts`): one shared Supabase client. `useAuth()` is **not** context-backed — every consumer mounts its own instance, so cross-instance flags use tiny external stores + `useSyncExternalStore` (`devSimulateTier.ts`, `adminViewAsUser.ts`). Google OAuth only. Admin = a row in `public.admins` (`fetchIsAdmin` in `src/utils/board.ts`); `adminViewAsUser` lets an admin mask their own admin flag in the UI (client-side only, no RLS change).

**Tiering** (`.kiro/specs/free-pro-tiering/design.md`, `.kiro/specs/roadmap/premium-product-plan.md`):
- `src/utils/entitlement.ts` — reads `public.entitlements`. No row = Free; `tier` in `('pro','premium')` with null/future `expires_at` = that tier. `TIER_RANK` + `tierAtLeast(tier, min)` are the single source of tier comparison. Fail **open** on a read error (fall back to the `entitlementCache:<uid>` localStorage copy), fail **closed** on an absent row. Written server-side only (`grant-pro.mts`), except the admin self-serve toggle from migration `0010` (`setOwnEntitlement`).
- `src/utils/features.ts` — the capability map. `can(feature, tier)` / `minTier(feature)` are the **only** place tiers are compared; never branch on `tier`/`isPro` elsewhere. Pro: `historyBeyond7Days`, `masteryMaps`, `allPersonalBests`, `fretRange`, `multiStringFull`, `voiceProfile`, `seasonalBackdrop`. Premium: `premiumTeacher`, `learningPath`, `intervalDrill`, `scaleDrill`, `staffReading`, `tabReading`. Free on every tier by design: cloud sync + multi-device restore, leaderboard, badges, the current-combination personal best, and the 0–12 / 12–max fret half-picker.
- `src/components/ProGate.tsx` — the presentational lock (`overlay` / `replace` / `inline-badge`), labels itself "Pro" vs "Premium" via `minTier`. It enforces nothing security-sensitive; the real gate is the entitlement row + the host component's own logic.
- Free-tier limits are **view filters, never data cuts** — e.g. a Free user still records, syncs and restores full history, but the Stats screen only *shows* the trailing `FREE_HISTORY_DAYS` (7).
- Dev-only: `devSimulateTier` (`'off' | 'pro' | 'premium'`) forces the effective tier with no DB change; constant-folded away in a production bundle.

### Cloud sync

One module per data type, all local-first + best-effort; guests never enter any of it. Each keeps a `cloudSynced*User` localStorage flag so the initial pull→merge→push bootstrap runs once per account per device; debounced write-through keeps things current, and an idempotent reconcile re-runs on reconnect / later app starts. `App.tsx` wires the bootstrap/reconcile effects (keyed on `user`) and clears the flags on sign-out.
- `src/utils/sync.ts` — History + Personal Best. Union by row `id`; deletions propagate via **tombstones** (`deleted_keys`, plus a global `'*'`). `orphan_practice` captures a declining guest's local rows, unlinked from any account.
- `src/utils/settingsSync.ts` — selector picks + UI prefs (incl. `pref_language`, `pref_theme`). Can't merge field-wise → **last-synced-device-wins**: one JSON blob with `updated_at`; adopting a newer cloud blob writes every key and reloads.
- `src/utils/badgeSync.ts` — earned badges. Field-wise union keeping the earliest `earnedAt`; admin "Reset" writes a per-family retirement tombstone. Fires `badges-synced` instead of reloading.
- `src/learning/learningSync.ts` — see the Teacher section above. Merges the meaningful field (SRS per item), never last-writer-wins. (`src/utils/gameSync.ts`, stars per stage as a max, is not wired while the Game is disconnected.)
- `src/utils/voiceSync.ts` — personal voice profile (IndexedDB). Union by template `key`; only calibration-screen takes sync.
- `src/utils/leaderboard.ts` — public `leaderboard_entries` (world-readable, self-write). XP = lifetime correct-answer count, per instrument.
- `src/utils/board.ts` — feedback board (self-read for authors, full read + moderate for admins).

### Audio, voice, theme

**Audio** (`src/utils/audio.ts`): guitar note samples from the `gleitz.github.io/midi-js-soundfonts` CDN via Web Audio, keyed by MIDI number, in-memory cache + `preloadAllSamples()`. `unlockAudio()` must run from a user gesture (in `App.tsx`'s `start()`) before mobile playback works. A **Silent mode** mutes drill-content audio while keeping UI sounds/celebrations.

**Voice input** (`src/utils/speech.ts`, `src/hooks/useVoiceAnswer.ts`, `src/hooks/useDictation.ts`): an optional answer mode. `getSpeechEngine()` picks per platform — `WebSpeechEngine` (browser `SpeechRecognition`, needs network, flaky in a standalone PWA), `NativeSpeechEngine` (`@capacitor-community/speech-recognition`, lazily imported so the web bundle never loads it), `TemplateSpeechEngine` (on-device MFCC + DTW against a personal voice profile — `src/utils/{mfcc,dtw,voiceProfile,templateSpeechEngine}.ts`), or `NullSpeechEngine` (tap only). Engines yield raw transcripts; `speechVocab.ts` / `voiceProfileVocab.ts` parse them into a note/fret/interval and `useVoiceAnswer` routes through the same `selectAnswer`/`selectFret` the tap handlers use.

**Theme** (`src/utils/theme.ts`, `src/styles/00-tokens.css`): `pref_theme` = `'dark'` (default, original look) / `'night'` (warm dim) / `'day'` (light). `App.tsx` sets `document.documentElement.dataset.theme` and pushes `THEME_BG` / `THEME_COLOR_SCHEME` into the `<meta>` tags. The season half of `data-theme` also draws a light decorative backdrop (`src/styles/35-seasonal-backdrop.css`, pure CSS on `#root::before/::after`): snowflakes in winter, anemones in spring, sunflowers in summer, falling leaves in autumn; Pro only (`seasonalBackdrop`; `index.html` boots it off until the entitlement loads); Settings → General → Seasonal background (`pref_seasonDeco`, `data-deco`) turns it off. CSS is split into per-domain partials under `src/styles/` (numbered `00`–`23`); new CSS belongs in the matching partial, not a monolith.

### i18n

`src/i18n/` — a lightweight in-house system, no library. The **English source string is the lookup key**: call sites wrap literals in `t('English text')`; missing entries (and English) fall back to the literal. Hebrew (`he`) is a full **RTL** translation; Spanish (`es`, `translations.es.ts`), Brazilian Portuguese (`pt-BR`, `translations.ptBR.ts`), French (`fr`, `translations.fr.ts`) and Italian (`it`, `translations.it.ts`) are LTR and partial — they land in stages (see the wishlist) and currently cover the same screens with the same key set, so a new string needs a `he` entry and, when it belongs to an already-translated screen, an `es`, a `pt-BR`, an `fr` and an `it` entry too. Anything that switches on `lang` must handle all six (`isLang`, `dateLocale`); Spanish, Portuguese, French and Italian default note names to Do-Re-Mi, and new layout must work in both directions (see the direction-driven chevrons / nav rows). Some deeper Game/stage keys are intentionally rendered raw for now. Every dictionary (Hebrew included, `translations.he.ts`) is a **lazy chunk**: `loadDictionary(lang)` fetches only the player's language — `main.tsx` preloads the starting one (stored pick, else the time-zone guess in `src/utils/region.ts`) behind the boot splash, and `setLang` downloads a new pick before switching. The service worker keeps these chunks out of the precache and runtime-caches them, so an English player downloads none; `translate` falls back to English while a dictionary is missing (a script calling it must `await loadDictionary` first).

## Conventions

- Sound effects and haptics (`src/utils/feedback.ts`) fire alongside UI actions via a small `click()` wrapper in `App.tsx` — follow that (`playClickSound()` + `haptic.tap()`) for new interactive controls.
- Timer-driven game logic prefers refs over state for values read inside `setTimeout`/`setInterval` callbacks, to avoid stale closures; state is kept in sync alongside the ref for rendering. Don't add effects that re-derive from state instead.
- Never compare subscription tiers directly — go through `can(feature, tier)` / `tierAtLeast` / `minTier`.
- Every Supabase data-access helper must no-op / return an empty result when `supabase` is `null`, so a config-less guest build never breaks.
- A cloud-sync module reads/writes its own localStorage key directly and stays independent of its model module (as `badgeSync` is of `badges`), to avoid import cycles; it signals a mounted view with a `*-synced` window event rather than forcing a reload.
- New user-facing copy needs a Hebrew entry in `src/i18n/translations.ts`.
- The hamburger menu has a search field backed by `src/utils/appSearch.ts` (`SEARCH_ENTRIES`: title, menu trail, target, multilingual keywords). A new menu page, settings card or learning screen needs an entry there; a card it should scroll to gets a matching `anchor` on its `<SettingCard>` (and on a `variant="replace"` `<ProGate>` around it). Run `scripts/check-app-search.mts` after editing it.
- New CSS goes in the matching numbered partial under `src/styles/`.
- `.kiro/specs/` holds design docs (`free-pro-tiering`, `roadmap/premium-product-plan.md`, `roadmap/intervals-learning-spec.md`, `roadmap/scales-learning-spec.md`, `roadmap/staff-reading-spec.md`, `roadmap/tab-reading-spec.md`, `roadmap/notes-system-map.md`, `roadmap/product-wishlist.md`, `simplified-nav`, `custom-stage-nav`); `.kiro/steering/` holds older overview notes that are partly stale — prefer this file and the source.
