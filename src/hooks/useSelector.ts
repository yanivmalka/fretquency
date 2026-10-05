import { useState, useMemo, useEffect, useRef } from 'react';
import { loadSetting, saveSetting } from '../utils/settings';
import { FREE_MULTI_STRING_LIMIT } from '../utils/features';
import { openUpgrade } from '../utils/upgradeDrawer';
import type { AccidentalMode, OrderMode } from '../utils/music';
import type { InstrumentConfig } from '../utils/instruments';
import { calculateUniqueNotes } from '../utils/noteCalculator';
import {
  buildStageSequence, stageStepIndex, nextStageStep, type StageStep,
} from '../utils/stageSequence';

// ── Types ────────────────────────────────────────────────────────────────

export type Difficulty = 'dots' | 'naturals' | 'full';

export interface SelectorState {
  selectedStrings: number[];
  multiMode: boolean;
  mode: 'byNote' | 'byFret';
  lowerActive: boolean;
  upperActive: boolean;
  // Precise Pro fret window. Used *instead of* the free 0–12 / 12–max
  // half-picker only when `useFretRange` is on AND the user is Pro (see the
  // hook's `isPro` argument); otherwise it's ignored and kept for later.
  useFretRange: boolean;
  fretLo: number;
  fretHi: number;
  difficulty: Difficulty;
  autoAdvance: boolean;
}

// Minimum width (in frets) of the precise Pro fret-range window, so a round
// always has room for a handful of distinct frets to ask about.
// Also used as minimum unique notes when removing strings from multi-string mode.
export const MIN_FRET_WINDOW = 4;

// Clamp a precise-window [lo, hi] pair to something valid for this neck: both
// ends inside [0, maxFret], with lo at least MIN_FRET_WINDOW below hi (a bass
// has more frets than a guitar, so a window saved on one must survive a switch
// to the other).
export function clampFretWindow(lo: number, hi: number, maxFret: number): [number, number] {
  let l = Math.round(Number.isFinite(lo) ? lo : 0);
  let h = Math.round(Number.isFinite(hi) ? hi : maxFret);
  l = Math.max(0, Math.min(l, maxFret - MIN_FRET_WINDOW));
  h = Math.max(l + MIN_FRET_WINDOW, Math.min(h, maxFret));
  return [l, h];
}

// Difficulty-only progression, kept as the fallback for when the current
// selection is a custom combo that isn't part of the ordered stage sequence.
// Returns the next step up, or null if already at the hardest difficulty.
export function nextDifficulty(difficulty: Difficulty): Difficulty | null {
  if (difficulty === 'dots') return 'naturals';
  if (difficulty === 'naturals') return 'full';
  return null;
}

// The mirror of `nextDifficulty` — one step easier, or null if already at the
// gentlest difficulty. Used by the adaptive suggestion banner to offer a drop
// back when recent accuracy on a combination is low.
export function prevDifficulty(difficulty: Difficulty): Difficulty | null {
  if (difficulty === 'full') return 'naturals';
  if (difficulty === 'naturals') return 'dots';
  return null;
}

export interface DerivedSettings {
  guitarString: number;
  multiStrings: number[];
  fretFrom: number;
  fretTo: number;
  byNote: boolean;
  dotsOnly: boolean;
  wholeToneOnly: boolean;
  time: number;
  maxQuestions: number;
  accidental: AccidentalMode;
  order: OrderMode;
}

// ── History key ──────────────────────────────────────────────────────────

// The instrument id prefixes every key so guitar and bass stats never mix.
// Guitar keeps its original (unprefixed) key shape for back-compat with
// history/personal-best records saved before bass existed.
export function historyKey(state: SelectorState, instrument: InstrumentConfig, isPro = false): string {
  const strings = [...state.selectedStrings].sort((a, b) => a - b).join(',');
  const upper = state.upperActive ? instrument.maxFret : 12;
  // A precise Pro window gets its own `p<lo>-<hi>` fret segment so its stats
  // never mix with the half-picker's `0-12` / `12-max` shape. The non-precise
  // shape is unchanged byte-for-byte, so existing history / best_<key> records
  // keep resolving.
  const [winLo, winHi] = clampFretWindow(state.fretLo, state.fretHi, instrument.maxFret);
  const fret = (state.useFretRange && isPro)
    ? `p${winLo}-${winHi}`
    : `${state.lowerActive ? '0' : '12'}-${upper}`;
  const mode = state.mode;
  const diff = state.difficulty;
  const base = `${strings}|${fret}|${mode}|${diff}`;
  return instrument.id === 'guitar' ? base : `${instrument.id}|${base}`;
}

// Per-instrument localStorage keys for the string picks (a guitar's "string 6"
// selection is meaningless on a 4-string bass).
const stringsKey = (id: string) => `sel_strings_${id}`;
const multiKey = (id: string) => `sel_multi_${id}`;

function loadStrings(instrument: InstrumentConfig): number[] {
  // Guitar migrates its pre-bass unprefixed `sel_strings` key on first read.
  const legacy = instrument.id === 'guitar'
    ? loadSetting<number[] | null>('sel_strings', null)
    : null;
  const fallback = legacy ?? [instrument.stringCount];
  const raw = loadSetting<number[]>(stringsKey(instrument.id), fallback);
  const valid = raw.filter(s => s >= 1 && s <= instrument.stringCount);
  return valid.length > 0 ? valid : [instrument.stringCount];
}

function loadMulti(instrument: InstrumentConfig): boolean {
  const legacy = instrument.id === 'guitar'
    ? loadSetting<boolean | null>('sel_multi', null)
    : null;
  return loadSetting<boolean>(multiKey(instrument.id), legacy ?? false);
}

// ── Time lookup ──────────────────────────────────────────────────────────

function getTime(difficulty: Difficulty, lowerActive: boolean, upperActive: boolean): number {
  const both = lowerActive && upperActive;
  const upperOnly = !lowerActive && upperActive;

  switch (difficulty) {
    case 'dots':
      return upperOnly ? 7 : 8;
    case 'naturals':
      return both ? 7 : 6;
    case 'full':
      return 5;
  }
}

function getMaxQuestions(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'dots': return 15;
    case 'naturals': return 20;
    case 'full': return 25;
  }
}

// Difficulty-only run length — the fallback when the current selection isn't
// part of the ordered stage sequence (a custom combo).
export function totalRunQuestions(difficulty: Difficulty, autoAdvance: boolean): number {
  if (!autoAdvance) return getMaxQuestions(difficulty);
  let total = 0;
  let d: Difficulty | null = difficulty;
  while (d) {
    total += getMaxQuestions(d);
    d = nextDifficulty(d);
  }
  return total;
}

// Total questions a run will ask. With Auto Advance on, that's every stage from
// the current position in the sequence through the last one; otherwise just
// this stage. Used to scale the continuous-run timing progression (useScoring).
function runQuestions(seq: StageStep[], state: SelectorState): number {
  if (!state.autoAdvance) return getMaxQuestions(state.difficulty);
  const idx = stageStepIndex(seq, state);
  if (idx < 0) return totalRunQuestions(state.difficulty, true);
  return seq.slice(idx).reduce((sum, s) => sum + getMaxQuestions(s.difficulty), 0);
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useSelector(instrument: InstrumentConfig, isPro = false) {
  const [selectedStrings, setSelectedStrings] = useState<number[]>(
    () => loadStrings(instrument)
  );
  const [multiMode, setMultiMode] = useState<boolean>(
    () => loadMulti(instrument)
  );
  // Precise Pro fret window — global (not per-instrument), clamped to the
  // active neck on read and on instrument switch.
  const [useFretRange, setUseFretRange] = useState<boolean>(
    () => loadSetting('sel_useFretRange', false)
  );
  const [fretLo, setFretLo] = useState<number>(
    () => loadSetting('sel_fretLo', 0)
  );
  const [fretHi, setFretHi] = useState<number>(
    () => loadSetting('sel_fretHi', instrument.maxFret)
  );

  // On instrument switch: reload that instrument's own string picks. The
  // effect only runs *after* this render, so `safeStrings` below also clamps
  // synchronously — otherwise the first render post-switch would index the new
  // (shorter) note table with an out-of-range string number and crash.
  const prevInstrumentRef = useRef(instrument.id);
  useEffect(() => {
    if (prevInstrumentRef.current === instrument.id) return;
    prevInstrumentRef.current = instrument.id;
    setSelectedStrings(loadStrings(instrument));
    setMultiMode(loadMulti(instrument));
    // The precise window is global; re-clamp it (and re-persist) to the new
    // neck's fret count so a guitar window doesn't overhang a switch to bass
    // or vice-versa.
    const [lo, hi] = clampFretWindow(
      loadSetting('sel_fretLo', 0),
      loadSetting('sel_fretHi', instrument.maxFret),
      instrument.maxFret,
    );
    setFretLo(lo);
    setFretHi(hi);
    saveSetting('sel_fretLo', lo);
    saveSetting('sel_fretHi', hi);
  }, [instrument]);

  const safeStrings = (() => {
    const valid = selectedStrings.filter(s => s >= 1 && s <= instrument.stringCount);
    const base = valid.length > 0 ? valid : [instrument.stringCount];
    // Free tier caps multi-string drilling at FREE_MULTI_STRING_LIMIT. Storage
    // keeps whatever was picked while on Pro; this render-time clamp is what the
    // drill and stats actually see, so dropping Pro (or a Pro-sim toggle) takes
    // effect immediately and a later upgrade restores the full pick.
    if (!isPro && multiMode && base.length > FREE_MULTI_STRING_LIMIT) {
      return base.slice(0, FREE_MULTI_STRING_LIMIT);
    }
    return base;
  })();
  // Render-safe precise window: the stored values re-clamped every render, the
  // same way `safeStrings` guards the string picks during an instrument switch.
  const [safeFretLo, safeFretHi] = clampFretWindow(fretLo, fretHi, instrument.maxFret);
  const [mode, setMode] = useState<'byNote' | 'byFret'>(
    () => loadSetting('sel_mode', 'byFret')
  );
  const [lowerActive, setLowerActive] = useState<boolean>(
    () => loadSetting('sel_lower', true)
  );
  const [upperActive, setUpperActive] = useState<boolean>(
    () => loadSetting('sel_upper', false)
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => loadSetting('sel_difficulty', 'dots')
  );
  const [autoAdvance, setAutoAdvance] = useState<boolean>(
    () => loadSetting('sel_autoAdvance', false)
  );
  const [fretRangeConflict, setFretRangeConflict] = useState<{
    isOpen: boolean;
    stringToRemove: number | null;
  } | null>(null);

  // ── Setters with persistence ───────────────────────────────────────

  const sKey = stringsKey(instrument.id);
  const mKey = multiKey(instrument.id);

  const onStringSelect = (stringNum: number) => {
    if (!multiMode) {
      const next = [stringNum];
      setSelectedStrings(next);
      saveSetting(sKey, next);
    } else {
      setSelectedStrings(prev => {
        const idx = prev.indexOf(stringNum);
        let next: number[];
        if (idx >= 0) {
          // Attempting to remove a string — check if it would violate the fret window constraint
          next = prev.filter(s => s !== stringNum);
          
          // Check if removing this string would result in insufficient notes
          if (next.length > 0) {
            const uniqueNotes = calculateUniqueNotes(instrument, next, safeFretLo, safeFretHi);
            
            if (uniqueNotes < MIN_FRET_WINDOW) {
              // Open conflict dialog instead of removing
              setFretRangeConflict({
                isOpen: true,
                stringToRemove: stringNum,
              });
              return prev; // Don't remove yet
            }
          }
          
          // Safe to remove
          if (next.length === 0) next = [stringNum]; // Keep at least one string
        } else {
          // Adding a string
          // Free tier can drill at most FREE_MULTI_STRING_LIMIT strings at
          // once; reaching for one more opens the upgrade drawer and leaves
          // the selection untouched.
          if (!isPro && prev.length >= FREE_MULTI_STRING_LIMIT) {
            openUpgrade('multiStringFull');
            return prev;
          }
          next = [...prev, stringNum];
        }
        saveSetting(sKey, next);
        return next;
      });
    }
  };

  const onMultiToggle = () => {
    setMultiMode(prev => {
      const next = !prev;
      saveSetting(mKey, next);
      if (next) {
        // Turning on multi: Pro gets ALL of this instrument's strings. A Free
        // user gets an adjacent pair (FREE_MULTI_STRING_LIMIT strings) anchored
        // on the string that was already selected, so the pick stays where they
        // were working.
        const all = Array.from({ length: instrument.stringCount }, (_, i) => i + 1);
        let picked = all;
        if (!isPro) {
          const anchor = selectedStrings[selectedStrings.length - 1] ?? instrument.stringCount;
          const partner = anchor > 1 ? anchor - 1 : anchor + 1;
          picked = [anchor, partner]
            .filter(s => s >= 1 && s <= instrument.stringCount)
            .slice(0, FREE_MULTI_STRING_LIMIT)
            .sort((a, b) => a - b);
        }
        setSelectedStrings(picked);
        saveSetting(sKey, picked);
      } else {
        // Turning off multi: keep only the last-selected string
        const last = selectedStrings[selectedStrings.length - 1];
        const kept = [last];
        setSelectedStrings(kept);
        saveSetting(sKey, kept);
      }
      return next;
    });
  };

  const onModeSelect = (m: 'byNote' | 'byFret') => {
    setMode(m);
    saveSetting('sel_mode', m);
  };

  const onFretRangeToggle = (half: 'lower' | 'upper') => {
    if (half === 'lower') {
      if (lowerActive && !upperActive) return; // can't deselect the only one
      const next = !lowerActive;
      setLowerActive(next);
      saveSetting('sel_lower', next);
    } else {
      if (upperActive && !lowerActive) return; // can't deselect the only one
      const next = !upperActive;
      setUpperActive(next);
      saveSetting('sel_upper', next);
    }
  };

  // Precise Pro window: move one or both handles. Clamped (and min-width
  // enforced) here as well as on read, so a bad pair never reaches storage.
  const onFretRangeWindow = (lo: number, hi: number) => {
    const [l, h] = clampFretWindow(lo, hi, instrument.maxFret);
    setFretLo(l);
    saveSetting('sel_fretLo', l);
    setFretHi(h);
    saveSetting('sel_fretHi', h);
  };

  // Handle fret range conflict resolution when removing strings
  const onFretRangeConflictResolve = (
    action: 'auto' | 'manual' | 'cancel',
    newLo?: number,
    newHi?: number,
  ) => {
    const stringToRemove = fretRangeConflict?.stringToRemove;
    
    if (action === 'cancel' || !stringToRemove) {
      setFretRangeConflict(null);
      return;
    }
    
    // Remove the string
    setSelectedStrings(prev => {
      const next = prev.filter(s => s !== stringToRemove);
      if (next.length === 0) return [stringToRemove]; // Keep at least one
      saveSetting(sKey, next);
      return next;
    });
    
    // Expand fret range if needed
    if ((action === 'auto' || action === 'manual') && newLo !== undefined && newHi !== undefined) {
      setFretLo(newLo);
      saveSetting('sel_fretLo', newLo);
      setFretHi(newHi);
      saveSetting('sel_fretHi', newHi);
    }
    
    setFretRangeConflict(null);
  };

  const onFretRangePreciseToggle = () => {
    setUseFretRange(prev => {
      const next = !prev;
      saveSetting('sel_useFretRange', next);
      // A precise window drills one narrow span, where "dots only" / "naturals
      // only" would leave too few (or no) notes — so it runs at Full only.
      // Snap the stored difficulty up when the window is switched on.
      if (next && difficulty !== 'full') {
        setDifficulty('full');
        saveSetting('sel_difficulty', 'full');
      }
      return next;
    });
  };

  const onDifficultySelect = (diff: Difficulty) => {
    // Locked to Full while a precise window is in effect (see toggle above).
    if (useFretRange && isPro && diff !== 'full') return;
    setDifficulty(diff);
    saveSetting('sel_difficulty', diff);
  };

  const onAutoAdvanceToggle = () => {
    setAutoAdvance(prev => {
      const next = !prev;
      saveSetting('sel_autoAdvance', next);
      return next;
    });
  };

  // Apply a whole stage at once (used by Auto Advance to march through the
  // ordered curriculum). Every field is set and persisted together so the one
  // resulting re-render carries the complete next stage.
  const applyStage = (step: StageStep) => {
    setSelectedStrings(step.selectedStrings);
    saveSetting(sKey, step.selectedStrings);
    setMultiMode(step.multiMode);
    saveSetting(mKey, step.multiMode);
    setMode(step.mode);
    saveSetting('sel_mode', step.mode);
    setLowerActive(step.lowerActive);
    saveSetting('sel_lower', step.lowerActive);
    setUpperActive(step.upperActive);
    saveSetting('sel_upper', step.upperActive);
    // Every curriculum stage is half-based; Auto Advance always runs on the
    // standard half-picker, so a precise window is switched off for the run.
    setUseFretRange(false);
    saveSetting('sel_useFretRange', false);
    setDifficulty(step.difficulty);
    saveSetting('sel_difficulty', step.difficulty);
  };

  // ── Selector state object ──────────────────────────────────────────

  const state: SelectorState = {
    selectedStrings: safeStrings,
    multiMode,
    mode,
    lowerActive,
    upperActive,
    useFretRange,
    fretLo: safeFretLo,
    fretHi: safeFretHi,
    difficulty,
    autoAdvance,
  };

  // The ordered stage curriculum for this instrument, and the stage Auto
  // Advance should move into after the current one completes (null at the end
  // of the sequence, or when the current selection is an off-sequence combo).
  const stageSequence = useMemo(() => buildStageSequence(instrument), [instrument]);
  const nextStage = (): StageStep | null => nextStageStep(stageSequence, state);
  const runQuestionCount = (): number => runQuestions(stageSequence, state);

  // ── Derived settings ───────────────────────────────────────────────

  const safeKey = safeStrings.join(',');
  const derivedSettings: DerivedSettings = useMemo(() => {
    const guitarString = Math.max(...safeStrings);
    // Multi-string drilling is free up to FREE_MULTI_STRING_LIMIT strings;
    // `safeStrings` is already clamped for a Free user, so this just reads it.
    const multiStrings = (multiMode && safeStrings.length > 1)
      ? safeStrings
      : [];
    // The precise Pro window overrides the half-picker, but only for a Pro
    // user. A free user who set one while on Pro keeps it in storage; it just
    // isn't applied — the derivation falls back to the halves.
    const precise = useFretRange && isPro;
    const fretFrom = precise ? safeFretLo : (lowerActive ? 0 : 12);
    const fretTo = precise ? safeFretHi : (upperActive ? instrument.maxFret : 12);
    const byNote = mode === 'byNote';
    // A precise window always runs at Full — "dots" / "naturals" would leave
    // too few notes in one narrow span. The stored `difficulty` is snapped to
    // 'full' on toggle-on, but coerce here too so a stale saved value obeys.
    const effDifficulty = precise ? 'full' : difficulty;
    const dotsOnly = effDifficulty === 'dots';
    const wholeToneOnly = effDifficulty === 'naturals';
    // Time limit keys off the halves the window effectively covers: a window
    // that reaches past fret 12 counts as the upper half, one below it as the
    // lower half (the reasonable approximation — see commit message).
    const lowerEff = precise ? fretFrom < 12 : lowerActive;
    const upperEff = precise ? fretTo > 12 : upperActive;
    const time = getTime(effDifficulty, lowerEff, upperEff);
    const maxQuestions = getMaxQuestions(effDifficulty);

    // Preserve existing user preferences for accidental and order
    const accidental: AccidentalMode = loadSetting('pref_accidental', 'sharps');
    const order: OrderMode = loadSetting('pref_order', 'fifths');

    return {
      guitarString,
      multiStrings,
      fretFrom,
      fretTo,
      byNote,
      dotsOnly,
      wholeToneOnly,
      time,
      maxQuestions,
      accidental,
      order,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeKey, multiMode, mode, lowerActive, upperActive, useFretRange, isPro, safeFretLo, safeFretHi, difficulty, instrument]);

  // ── Return ─────────────────────────────────────────────────────────

  return {
    state,
    onStringSelect,
    onMultiToggle,
    onModeSelect,
    onFretRangeToggle,
    onFretRangeWindow,
    onFretRangePreciseToggle,
    onDifficultySelect,
    onAutoAdvanceToggle,
    applyStage,
    nextStage,
    runQuestionCount,
    derivedSettings,
    historyKey: () => historyKey(state, instrument, isPro),
    fretRangeConflict,
    onFretRangeConflictResolve,
  };
}
