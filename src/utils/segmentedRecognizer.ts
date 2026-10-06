// ── Segmented personal-profile recognition (pure) ─────────────────────
//
// The decision logic of the personal-profile engine, with no microphone, no
// engine state and no turn bookkeeping: one captured utterance + the
// profile's templates in, one canonical note name (or `null` = "ask again")
// out. `templateSpeechEngine.ts` runs it live; `scripts/eval-voice-e2e.mts`
// runs the very same function over recorded test takes, so an offline score
// is a score of the shipped code, not of a re-implementation.

import { segmentUtterance, trimToVoice } from './utteranceCapture';
import { computeMfcc } from './mfcc';
import { matchTemplates, type Template } from './dtw';
import { isLetterLabel, isAccidentalLabel } from './voiceProfileVocab';
import { SHARP_WRAP, FLAT_TO_SHARP } from './speechVocab';
import { vlog } from './debugLog';

// Absolute ceiling for the accidental stage of a segmented profile match.
//
// Unlike the letter stage this one is on by default, because it is the only
// thing standing between a stray fragment of audio and a confidently wrong
// note. A 63ms burst of noise was once taken as a second word: its nearest
// accidental sat at 41.9 while the runner-up sat at 49.2, so the *ratio*
// gate happily passed it and turned a spoken "C" into "B". A genuine spoken
// "sharp" in the same session scored 8.9. This sits between the two with
// room on both sides, and is what makes the split-hypothesis search safe —
// half of a wrongly-split letter cannot clear it.
//   localStorage.voiceAccidentalAbsMax = '30'
export function accidentalAbsMax(): number {
  try {
    const v = parseFloat(localStorage.getItem('voiceAccidentalAbsMax') ?? '');
    if (!Number.isNaN(v) && v > 0) return v;
  } catch { /* ignore */ }
  // Was 25. In noisy-room rounds four wrong answers came from room noise
  // matched as an accidental at 23.2–24.4, while every correct accidental
  // logged the same day scored ≤ 22.2.
  return 22.5;
}

// The seventeen spellings the app ever shows: sharps on C D F G A, flats on
// D E G A B. Nobody answers "F flat" or "E sharp".
const SHARPABLE = new Set(['C', 'D', 'F', 'G', 'A']);
const FLATTABLE = new Set(['D', 'E', 'G', 'A', 'B']);
function canCarry(letter: string, accidental: string): boolean {
  return accidental === '#' ? SHARPABLE.has(letter) : FLATTABLE.has(letter);
}

// When the second segment fails the accidental gate, answer the letter alone
// only if it beat the runner-up letter by at least this ratio and the letter
// segment is at least this long.
const LETTER_FALLBACK_RATIO = 0.85;
const LETTER_FALLBACK_MIN_MS = 250;

// ── Standard-score ("z-norm") re-ranking ──────────────────────────────
//
// Opt-in via  localStorage.voiceProfileZNorm = '1'
//
// The default matcher picks the label with the smallest raw DTW distance.
// One calibration take that came out acoustically "central" is then close to
// *every* spoken word and wins every turn (the stuck-on-"F" symptom). Z-norm
// instead scores each label by how many standard deviations its distance
// sits below the mean label distance for this one utterance, so a globally
// close template stops standing out. A match is kept only when the best
// label leads the runner-up by at least `voiceProfileZGap` std-devs
// (default 0.5).
function zNormEnabled(): boolean {
  try { return localStorage.getItem('voiceProfileZNorm') === '1'; } catch { return false; }
}

function zGap(): number {
  try {
    const v = parseFloat(localStorage.getItem('voiceProfileZGap') ?? '');
    if (!Number.isNaN(v) && v >= 0) return v;
  } catch { /* ignore */ }
  return 0.5;
}

function zScores(
  ranked: { label: string; distance: number }[],
): { label: string; distance: number; z: number }[] {
  const ds = ranked.map((r) => r.distance).filter((d) => Number.isFinite(d));
  if (ds.length < 2) return ranked.map((r) => ({ ...r, z: 0 }));
  const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
  const variance = ds.reduce((a, b) => a + (b - mean) ** 2, 0) / (ds.length - 1);
  const std = Math.sqrt(variance) || 1;
  return ranked
    .map((r) => ({
      ...r,
      z: Number.isFinite(r.distance) ? (r.distance - mean) / std : Infinity,
    }))
    .sort((a, b) => a.z - b.z);
}

export interface SegmentedParams {
  /** Engine kind, for the debug lines only. */
  kind: string;
  /** Confidence ratio: best.distance <= second.distance * this. */
  ratioCap: number;
  /** Absolute ceiling on the letter stage's nearest distance. */
  absCap: number;
}

/**
 * Two-stage segmented match for the personal profile: split the answer
 * into words, match the first against the letter templates and an optional
 * second against the "#"/"b" templates, then compose a canonical note
 * name. Returns `null` (so the caller listens again) unless every segment
 * present clears the confidence gate.
 */
export function recognizeSegmented(
  captured: { pcm: Float32Array; sampleRate: number },
  templates: Template[],
  { kind, ratioCap, absCap }: SegmentedParams,
): string | null {
  const rawSegs = segmentUtterance(captured.pcm, captured.sampleRate);
  const segFrames = rawSegs
    .map((s) => computeMfcc(s, captured.sampleRate).frames)
    .filter((f) => f.length);
  const ms = (n: number) => Math.round((n / captured.sampleRate) * 1000);
  // How the utterance was cut up, in ms, next to the whole capture. The
  // segmenter is the dominant failure mode: a fluent "C sharp" can come
  // back as one segment (then matched whole against single-letter
  // templates, which cannot fit), and a drawn-out single letter can come
  // back as two (the phantom second one matching an accidental).
  const segMs = rawSegs.map((s) => ms(s.length));
  if (!segFrames.length) return null;

  const t0 = performance.now();
  const letters = templates.filter((t) => isLetterLabel(t.label));
  const accidentals = templates.filter((t) => isAccidentalLabel(t.label));

  const gate = (
    ranked: { label: string; distance: number }[],
    part: string,
    cap = absCap,
  ): string | null => {
    const [best, second] = ranked;
    if (!best || !Number.isFinite(best.distance)) {
      vlog('[voice] segmented reject', { engine: kind, part, reason: 'no-match' });
      return null;
    }

    if (zNormEnabled()) {
      const [zb, zs] = zScores(ranked);
      const need = zGap();
      if (zs && zs.z - zb.z < need) {
        vlog('[voice] segmented reject', {
          engine: kind, part, reason: 'z-gap',
          zBest: +zb.z.toFixed(2), zSecond: +zs.z.toFixed(2), need,
        });
        return null;
      }
      vlog('[voice] segmented znorm', {
        engine: kind, part,
        best: { label: zb.label, z: +zb.z.toFixed(2), d: +zb.distance.toFixed(2) },
        second: zs ? { label: zs.label, z: +zs.z.toFixed(2) } : null,
      });
      return zb.label;
    }
    if (best.distance > cap) {
      vlog('[voice] segmented reject', {
        engine: kind, part, reason: 'abs-cap',
        d: +best.distance.toFixed(2), absCap: cap,
      });
      return null;
    }
    if (second && best.distance > second.distance * ratioCap) {
      vlog('[voice] segmented reject', {
        engine: kind, part, reason: 'ratio-cap',
        ratio: +(best.distance / second.distance).toFixed(3), ratioCap,
      });
      return null;
    }
    return best.label;
  };

  // The segmenter's own reading of the utterance is only a hypothesis, and
  // duration cannot tell a merged "F sharp" from one drawn-out letter (see
  // the note in `segmentUtterance`). So always score the alternative —
  // segment 0 split in two — and keep whichever the matcher prefers.
  //
  // This runs whatever the segmenter returned, not only for a lone
  // segment. A fluent "F sharp" was twice cut as [600ms, 80ms]: the whole
  // pair in segment 0 and a trailing fragment as the "accidental", which
  // the accidental cap then rightly rejected — costing the round, even
  // though splitting segment 0 was the correct reading and was right
  // there to be scored.
  //
  // `letterFrames` is what the letter stage should match; `accFrames` the
  // accidental stage's, if any.
  let letterFrames = segFrames[0];
  let accFrames: Float32Array[] | null = segFrames[1] ?? null;
  let usedSplit = false;
  let letterMs = segMs[0];

  {
    // Split *segment 0*, not the whole capture. Passing the capture back to
    // `segmentUtterance` only re-runs the same analysis: when it already
    // found two voiced runs it returns those two again, so the "alternative"
    // was identical to the reading it was meant to challenge — visible in
    // the log as `forcedMs` matching `segMs` exactly on every two-segment
    // turn. Segment 0 is the run that may hold a merged "F sharp".
    const forcedSegs = segmentUtterance(rawSegs[0], captured.sampleRate, { split: 'always' });
    const forced = forcedSegs
      .map((s) => computeMfcc(s, captured.sampleRate).frames)
      .filter((f) => f.length);
    if (forced.length >= 2) {
      const whole = matchTemplates(segFrames[0], letters)[0];
      const half = matchTemplates(forced[0], letters)[0];
      // A genuine single letter cut in half still matches its own label,
      // so a better letter distance alone would not be safe to act on —
      // the accidental stage is what tells the readings apart. Half a
      // letter looks nothing like "sharp" or "flat", and the accidental
      // gate's absolute cap rejects it; a real accidental clears it
      // easily (a measured session: 8.9 for a spoken "sharp", 41.9 for a
      // 63ms fragment of noise).
      const halfAcc = matchTemplates(forced[1], accidentals)[0];
      const better = !!half && !!whole && half.distance < whole.distance;
      const accPlausible = !!halfAcc && Number.isFinite(halfAcc.distance)
        && halfAcc.distance <= accidentalAbsMax();
      if (better && accPlausible) {
        letterFrames = forced[0];
        accFrames = forced[1];
        usedSplit = true;
        letterMs = ms(forcedSegs[0].length);
      }
      vlog('[voice] split hypothesis', {
        engine: kind,
        forcedMs: forcedSegs.map((s) => ms(s.length)),
        whole: whole && { label: whole.label, d: +whole.distance.toFixed(2) },
        half: half && { label: half.label, d: +half.distance.toFixed(2) },
        acc: halfAcc && { label: halfAcc.label, d: +halfAcc.distance.toFixed(2) },
        accCap: accidentalAbsMax(),
        taken: better && accPlausible,
      });
    }
  }

  const lRanked = matchTemplates(letterFrames, letters);
  const letter = gate(lRanked, 'letter');
  let note: string | null = letter;
  let accLabel: string | null = null;
  let aRanked: { label: string; distance: number }[] = [];
  let letterFallback = false;

  if (letter && accFrames) {
    aRanked = matchTemplates(accFrames, accidentals);
    accLabel = gate(aRanked, 'accidental', accidentalAbsMax());
    if (!accLabel) {
      // The second segment is not a clear "#"/"b". Usually that is a short
      // fragment or room noise after a plain letter, so when the letter won
      // by a wide margin answer it; otherwise ask again rather than guess.
      // Live logs with known truth: ratio ≤ 0.85 was 4 right, 0 wrong
      // (C 0.52, E 0.75 ×2, E 0.85); E 0.86 for a spoken A and B 0.96 for
      // a spoken E sat just above it. A short letter segment is not enough
      // on its own: D 0.76 on 180 ms (E said) and D 0.80 on 200 ms (B said)
      // were wrong, while every right fallback had a letter of 380 ms+.
      const [lb, ls] = lRanked;
      const letterRatio = ls && ls.distance > 0 ? lb.distance / ls.distance : 0;
      letterFallback = letterRatio <= LETTER_FALLBACK_RATIO
        && letterMs >= LETTER_FALLBACK_MIN_MS;
      note = letterFallback ? letter : null;
      vlog('[voice] letter fallback', {
        engine: kind, letter, ratio: +letterRatio.toFixed(3),
        need: LETTER_FALLBACK_RATIO, letterMs, minMs: LETTER_FALLBACK_MIN_MS,
        taken: letterFallback,
      });
    } else {
      // Only one of the seventeen spellings a player actually says. A letter
      // that cannot carry this accidental (F/C flat, E/B sharp) is the letter
      // stage being pulled by the accidental's own onset: in a fluent "B
      // flat" the letter segment ends on the "fl", matches F, and F + flat
      // composed to E — five of fifteen wrong answers in the first lab set.
      // Take the best letter that can carry it instead.
      let l = letter;
      if (!canCarry(letter, accLabel)) {
        l = lRanked.find((r) => canCarry(r.label, accLabel!))?.label ?? letter;
        vlog('[voice] spelling fix', { engine: kind, letter, accidental: accLabel, now: l });
      }
      note = accLabel === '#' ? SHARP_WRAP[`${l}#`] ?? `${l}#` : FLAT_TO_SHARP[l] ?? l;
    }
  }

  // Whole-utterance check for an accidental, with no cut at all. In a
  // fluent "F sharp" the /f/ and /sh/ fricatives merge, so any cut leaves a
  // letter half that sounds like "E" — and E + "#" composes to F, which
  // looks exactly like a dropped sharp. Instead, match the trimmed capture
  // against every letter take and every letter take followed by an
  // accidental take, and let DTW find the boundary.
  //
  // It only ever overrides with an accidental reading: on its own it misread
  // plain F as E, while the segmented path above reads naturals well. Offline
  // (scripts/eval-accidental-split.mts, `hybrid`) this took sharps from 2 to
  // 13 of 30, wrong answers 15 → 9, naturals unchanged. Not yet measured
  // live, and flats were not in that test set.
  const t1 = performance.now();
  const wholeFrames = computeMfcc(trimToVoice(captured.pcm, captured.sampleRate), captured.sampleRate).frames;
  let concatNote: string | null = null;
  let cRanked: { label: string; distance: number }[] = [];
  if (wholeFrames.length && accidentals.length) {
    const combos: Template[] = [...letters];
    for (const l of letters) {
      for (const a of accidentals) {
        if (!canCarry(l.label, a.label)) continue;
        const label = a.label === '#'
          ? SHARP_WRAP[`${l.label}#`] ?? `${l.label}#`
          : FLAT_TO_SHARP[l.label] ?? l.label;
        combos.push({ label, frames: [...l.frames, ...a.frames] });
      }
    }
    // Ranked by composed note name, exactly as measured: only a reading
    // whose note carries "#" (a sharp, or a flat composed to one) overrides.
    cRanked = matchTemplates(wholeFrames, combos);
    const [best, second] = cRanked;
    if (best && Number.isFinite(best.distance)
      && !(second && best.distance > second.distance * ratioCap)
      && best.label.includes('#')) {
      concatNote = best.label;
    }
  }
  // Only overrides an answer the segmented path already gave. When that
  // path rejected the capture ("ask again"), letting concat answer turned a
  // spoken plain "C" into C# in a live round; the one correct live override
  // (F → F#) had a segmented answer to correct.
  // Not a letter-fallback answer either: that capture held noise the
  // accidental gate rejected, and noisy captures are where concat misreads
  // (G#/D#/A# on long noisy captures in a live round).
  const concatTaken = !!concatNote && !!note && !letterFallback && concatNote !== note;
  if (concatTaken) note = concatNote;

  vlog('[voice] concat accidental', {
    engine: kind,
    ms: +(performance.now() - t1).toFixed(1),
    top: cRanked.slice(0, 4).map((r) => `${r.label}:${r.distance.toFixed(1)}`).join(' '),
    note: concatNote, overrode: concatTaken,
  });

  vlog('[voice] segmented match', {
    engine: kind, segments: segFrames.length,
    pool: { letters: letters.length, accidentals: accidentals.length },
    ms: +(performance.now() - t0).toFixed(1),
    capturedMs: ms(captured.pcm.length), segMs,
    usedSplit,
    // Every letter, not just the top two: when the wrong one wins it
    // matters whether the right one was second or last.
    letters: lRanked.map((r) => `${r.label}:${r.distance.toFixed(1)}`).join(' '),
    accidentals: aRanked.map((r) => `${r.label}:${r.distance.toFixed(1)}`).join(' '),
    accidental: accLabel, letterFallback, note, confident: !!note,
  });

  return note;
}
