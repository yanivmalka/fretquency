// Focused checks for the Scales metronome + timing judgement:
// src/learning/scaleTiming.ts, src/utils/onset.ts, src/utils/metronome.ts's
// click (renderClick).
//
//   node --experimental-strip-types scripts/check-scale-timing.mts
//
// Covers:
//   • tempo: clamp to 40–160, +4 after a clean run only, the stored map
//   • judging a note against the nearest click (±⅙ beat), tempo changes
//   • the per-run summary, rushing/dragging, the clean-run rule
//   • the click is never a note: the real pitch detector finds no pitch in
//     it, it doesn't move a ringing note's pitch, and the onset detector
//     doesn't fire on it — while it does fire on a real pluck, close to the
//     pluck's true start

import { register } from 'node:module';

register(
  'data:text/javascript,' + encodeURIComponent(
    "export async function resolve(s,c,n){" +
    "if((s.startsWith('./')||s.startsWith('../'))&&!/\\.(m?ts|m?js|json|node)$/i.test(s)){" +
    "try{return await n(s+'.ts',c);}catch{}}" +
    "return n(s,c);}",
  ),
  import.meta.url,
);

const T = await import('../src/learning/scaleTiming.ts');
const { lowBandFrame, createOnsetTracker, LOW_BAND_HZ, locatePitchStart, chooseNoteOnset, agreesWithRecent } = await import('../src/utils/onset.ts');
const { applyBiquad, biquad } = await import('../src/utils/biquad.ts');
const { renderClick } = await import('../src/utils/metronome.ts');
const { detectPitch } = await import('../src/tuner/pitchDetect.ts');
const { frequencyToNote } = await import('../src/tuner/noteUtils.ts');

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

// ── Tempo ────────────────────────────────────────────────────────────────
console.log('tempo');
check('clamp low', T.clampTempo(10) === 40);
check('clamp high', T.clampTempo(300) === 160);
check('clamp NaN → default', T.clampTempo(Number.NaN) === T.TEMPO_DEFAULT);
check('clean run → +4', T.nextTempo(60, true) === 64);
check('not clean → same', T.nextTempo(60, false) === 60);
check('+4 caps at 160', T.nextTempo(158, true) === 160);
check('beatMs at 120', T.beatMsFor(120) === 500);

const map = T.normalizeTempoMap({ 'scale:minorPentatonic:1': 72, 'scale:major:2': 999, junk: 50, 'scale:x:1': 'fast' });
check('map keeps scale ids, clamps', map['scale:minorPentatonic:1'] === 72 && map['scale:major:2'] === 160);
check('map drops junk', !('junk' in map) && !('scale:x:1' in map));
check('map from non-object', Object.keys(T.normalizeTempoMap([1, 2])).length === 0 && Object.keys(T.normalizeTempoMap(null)).length === 0);
check('tempoFor falls back', T.tempoFor(map, 'scale:blues:1') === T.TEMPO_DEFAULT && T.tempoFor(map, 'scale:blues:1', 52) === 52);

// ── Judging one note ─────────────────────────────────────────────────────
console.log('judging');
const grid = [0, 500, 1000, 1500, 2000]; // 120 BPM
const v = (at: number) => T.judgeNote(at, grid, 500)?.verdict;
check('on the beat', v(1000) === 'onTime');
check('+⅙ beat is on time', v(1000 + 500 / 6) === 'onTime');
check('just past +⅙ is late', v(1000 + 500 / 6 + 1) === 'late');
check('−⅙ beat is on time', v(1000 - 500 / 6) === 'onTime');
check('just before −⅙ is early', v(1000 - 500 / 6 - 1) === 'early');
check('0.48 beat after → late', v(1240) === 'late');
check('0.52 beat after → early for the next beat', v(1260) === 'early');
const j = T.judgeNote(1260, grid, 500)!;
check('…judged against 1500', j.beatAt === 1500 && Math.abs(j.offsetBeats + 0.48) < 1e-9);
check('no clicks → null', T.judgeNote(100, [], 500) === null);
check('one click uses the fallback beat', T.judgeNote(1100, [1000], 1000)?.verdict === 'onTime'
  && T.judgeNote(1200, [1000], 1000)?.verdict === 'late');
// 60 → 120 BPM between the 2nd and 3rd click: each side uses its own gap.
const changed = [0, 1000, 1500, 2000];
check('slow side of a tempo change', T.judgeNote(900, changed, 500)?.verdict === 'onTime'); // −0.1 of 1000 ms
check('fast side of a tempo change', T.judgeNote(1100, changed, 500)?.verdict === 'late'); // +0.2 of 500 ms

// ── Summary + clean run ──────────────────────────────────────────────────
console.log('summary');
const mk = (offsets: number[]) => offsets.map((o) => T.judgeNote(1000 + o * 500, grid, 500)!);
const allOn = T.summarizeTiming(mk([0, 0.05, -0.05, 0.1, -0.1, 0, 0, 0, 0, 0]));
check('counts', allOn.total === 10 && allOn.onTime === 10 && allOn.early === 0 && allOn.late === 0);
check('no tendency when centred', allOn.tendency === null);
const rush = T.summarizeTiming(mk([-0.1, -0.15, -0.3, -0.12, 0]));
check('rushing', rush.tendency === 'rushing' && rush.early === 1);
const drag = T.summarizeTiming(mk([0.1, 0.15, 0.3, 0.12, 0]));
check('dragging', drag.tendency === 'dragging' && drag.late === 1);
check('empty summary', T.summarizeTiming([]).total === 0 && T.summarizeTiming([]).tendency === null);
check('clean: all on time, no slips', T.isCleanRun(allOn, 10, 0));
check('not clean: one slip', !T.isCleanRun(allOn, 10, 1));
check('not clean: notes missing (tapped part, played part)', !T.isCleanRun(allOn, 12, 0));
check('clean: 9 of 10 on time', T.isCleanRun(T.summarizeTiming(mk([0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3])), 10, 0));
check('not clean: 8 of 10 on time', !T.isCleanRun(T.summarizeTiming(mk([0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.3])), 10, 0));
check('not clean: empty run', !T.isCleanRun(T.summarizeTiming([]), 0, 0));

// ── The click is not a note ──────────────────────────────────────────────
console.log('click vs. pitch detector');
const FFT = 8192;
for (const sr of [44100, 48000]) {
  for (const accent of [true, false]) {
    const click = renderClick(sr, accent);
    check(`click ${accent ? 'accent' : 'beat'} @${sr}: ~30 ms, loud`, Math.abs(click.length - sr * 0.03) <= 1
      && Math.max(...Array.from(click, Math.abs)) > 0.4);
    // The click at every position of the detector's window, alone.
    let detected = 0;
    for (let pos = 0; pos + click.length <= FFT; pos += 512) {
      const buf = new Float32Array(FFT);
      buf.set(click, pos);
      if (detectPitch(buf, sr)) detected++;
    }
    check(`click ${accent ? 'accent' : 'beat'} @${sr}: no pitch anywhere in the window`, detected === 0, `${detected} windows read a pitch`);
  }
}

/** A plucked string: harmonics 1–6, 3 ms attack, ~0.6 s decay. */
function pluck(sr: number, freq: number, seconds: number, amp = 0.3): Float32Array {
  const out = new Float32Array(Math.round(sr * seconds));
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    let s = 0;
    for (let k = 1; k <= 6; k++) s += Math.sin(2 * Math.PI * freq * k * t) / k;
    out[i] = amp * s * Math.min(1, t / 0.003) * Math.exp(-t / 0.6);
  }
  return out;
}

// With the metronome on, the listener low-passes the mic to the guitar band
// (`usePitchStream`'s `timing` option: two Web Audio biquads at LOW_BAND_HZ —
// the same RBJ filter as `biquad.ts`). Unfiltered, a loud click on top of a
// fading note does spoil the detector's periodicity test; filtered, it must
// not.
const SR = 48000;
const toBand = (x: Float32Array) => applyBiquad(x, biquad('lowpass', LOW_BAND_HZ, SR), 2);
for (const freq of [82.41, 196.0, 659.26, 1046.5]) {
  const expect = frequencyToNote(freq).midi;
  for (const accent of [true, false]) {
    const ring = pluck(SR, freq, 0.6);
    const mixed = Float32Array.from(ring);
    const click = renderClick(SR, accent);
    // Clicks all through the window the detector reads.
    for (let at = ring.length - FFT; at + click.length < ring.length; at += 1500) {
      for (let k = 0; k < click.length; k++) mixed[at + k] += click[k];
    }
    const read = detectPitch(toBand(mixed).slice(-FFT), SR);
    check(`${freq} Hz ringing + ${accent ? 'accent' : 'beat'} clicks: same note through the band filter`,
      !!read && frequencyToNote(read.frequency).midi === expect,
      `got ${read ? frequencyToNote(read.frequency).midi : 'null'}, want ${expect}`);
  }
}
for (const accent of [true, false]) {
  const buf = new Float32Array(FFT);
  for (let at = 0; at + 1440 < FFT; at += 1500) buf.set(renderClick(SR, accent), at);
  check(`band-filtered ${accent ? 'accent' : 'beat'} clicks alone: no pitch`, detectPitch(toBand(buf), SR) === null);
}

// ── Onsets ───────────────────────────────────────────────────────────────
console.log('onsets');
const FRAME_MS = 16;
const HISTORY = 32768;
/** Run the listener's frame loop over `signal`; returns the onset times (ms). */
function onsetsIn(signal: Float32Array): number[] {
  const tracker = createOnsetTracker();
  const found: number[] = [];
  const hop = Math.round((SR * FRAME_MS) / 1000);
  for (let end = hop; end <= signal.length; end += hop) {
    const from = Math.max(0, end - FFT);
    const buf = new Float32Array(FFT);
    buf.set(signal.subarray(from, end), FFT - (end - from));
    const at = tracker.push((end / SR) * 1000, lowBandFrame(buf, SR));
    if (at != null) found.push(at);
  }
  return found;
}
const ms = (t: number) => Math.round((t / 1000) * SR);

// Clicks at 160 BPM over silence (a little room noise).
{
  const sig = new Float32Array(ms(2000));
  let seed = 7;
  for (let i = 0; i < sig.length; i++) { seed = (seed * 1103515245 + 12345) >>> 0; sig[i] = ((seed / 2 ** 32) - 0.5) * 0.002; }
  for (let b = 0; ms(100 + b * 375) + ms(30) < sig.length; b++) sig.set(renderClick(SR, b % 4 === 0), ms(100 + b * 375));
  const found = onsetsIn(sig);
  check('clicks alone: no onsets', found.length === 0, `${found.length} onsets`);
}

// Plucks on a 500 ms grid, with a click on every beat too.
{
  const sig = new Float32Array(ms(3000));
  const plucks = [200, 700, 1200, 1700, 2200];
  const freqs = [110, 130.81, 146.83, 164.81, 196];
  plucks.forEach((t, i) => {
    const p = pluck(SR, freqs[i], 1.2, 0.25);
    const at = ms(t);
    for (let k = 0; k < p.length && at + k < sig.length; k++) sig[at + k] += p[k];
  });
  for (let b = 0; b < 6; b++) {
    const c = renderClick(SR, b % 4 === 0);
    const at = ms(200 + b * 500);
    for (let k = 0; k < c.length; k++) sig[at + k] += c[k];
  }
  const found = onsetsIn(sig);
  check('one onset per pluck, none for the clicks', found.length === plucks.length, `${found.length} onsets: ${found.map(Math.round).join(', ')}`);
  const errs = plucks.map((t) => found.reduce((b, f) => Math.abs(f - t) < Math.abs(b - t) ? f : b, Infinity) - t);
  const worst = Math.max(...errs.map(Math.abs));
  check('each onset within 10 ms of its pluck', worst <= 10, `errors ${errs.map((e) => e.toFixed(1)).join(', ')} ms`);
}

// The same string plucked again while still ringing.
{
  const sig = new Float32Array(ms(1500));
  for (const t of [100, 700]) {
    const p = pluck(SR, 110, 1.0, 0.25);
    for (let k = 0; k < p.length && ms(t) + k < sig.length; k++) sig[ms(t) + k] += p[k];
  }
  const found = onsetsIn(sig);
  check('re-pluck of a ringing string is a new onset', found.length === 2 && Math.abs(found[1] - 700) <= 10,
    found.map(Math.round).join(', '));
}

// The listener end to end, the way `usePitchStream` runs with `timing` on:
// the mic band-filtered, a frame every 16 ms into the onset tracker, the
// detector every 120 ms with the two-tick rule, `locatePitchStart` when a
// pitch is first read, `chooseNoteOnset` when it is reported. Random runs
// played the way a scale is — one note at a time (the previous one stops
// within ~25 ms of the next pluck), E1…E4, one note per click at 40–160 BPM (375–1500 ms apart), ±4 dB, not lined up
// with frames or ticks, a click every 375 ms on top.
{
  let seed = 12345;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  const errors: number[] = [];
  const sources: Record<string, number> = { energy: 0, pitch: 0, report: 0 };
  let total = 0, onClick = 0, misread = 0;
  const outliers: string[] = [];
  for (let run = 0; run < 20; run++) {
    const raw = new Float32Array(ms(8000));
    const plucks: number[] = [];
    const pluckMidi: number[] = [];
    for (let t = 150 + rnd() * 50; t < 7400; t += run % 2 ? 375 + rnd() * 75 : 375 + rnd() * 1125) plucks.push(t);
    plucks.forEach((t, i) => {
      // A scale step from the previous note: 1–4 semitones, either way.
      const prev = pluckMidi[i - 1] ?? 40 + Math.floor(rnd() * 20);
      let midi = prev + (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 4));
      if (midi < 28 || midi > 80) midi = prev - (midi - prev);
      pluckMidi.push(midi);
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const p = pluck(SR, freq, 1.5, 0.15 * Math.pow(10, (rnd() * 8 - 4) / 20));
      const stop = i + 1 < plucks.length ? ms(plucks[i + 1]) : raw.length;
      for (let k = 0; k < p.length && ms(t) + k < raw.length; k++) {
        const past = ms(t) + k - stop;
        raw[ms(t) + k] += past <= 0 ? p[k] : p[k] * Math.exp(-past / (SR * 0.008));
      }
    });
    const clicks: number[] = [];
    for (let b = 0; ms(80 + b * 375) + ms(30) < raw.length; b++) {
      const c = renderClick(SR, b % 4 === 0);
      for (let k = 0; k < c.length; k++) raw[ms(80 + b * 375) + k] += c[k];
      clicks.push(80 + b * 375);
    }
    const sig = toBand(raw);
    const tracker = createOnsetTracker();
    const energyOnsets: number[] = [];
    let streak = { midi: -1, ticks: 0, firstSeenAt: 0, pitchStart: null as number | null };
    let reported = -1, lastHeardAt = 0, lastTick = -Infinity;
    const hop = ms(FRAME_MS);
    const offset = rnd() * 120;
    for (let end = hop; end <= sig.length; end += hop) {
      const now = (end / SR) * 1000;
      // The timing side reads a longer history (HISTORY samples); the
      // detector reads its usual FFT-sample tail of it.
      const hist = new Float32Array(HISTORY);
      const from = Math.max(0, end - HISTORY);
      hist.set(sig.subarray(from, end), HISTORY - (end - from));
      const buf = hist.subarray(HISTORY - FFT);
      const onset = tracker.push(now, lowBandFrame(hist, SR));
      if (onset != null) energyOnsets.push(onset);
      if (now - lastTick < 120 || now < offset) continue;
      lastTick = now;
      const r = detectPitch(buf as Float32Array<ArrayBuffer>, SR);
      if (!r) {
        streak = { midi: -1, ticks: 0, firstSeenAt: 0, pitchStart: null };
        if (now - lastHeardAt >= 300) reported = -1;
        continue;
      }
      lastHeardAt = now;
      const midi = frequencyToNote(r.frequency).midi;
      // As the app: a reading the newest ~85 ms disagrees with is a hand-over.
      if (!agreesWithRecent(hist, SR, midi)) { streak = { midi: -1, ticks: 0, firstSeenAt: 0, pitchStart: null }; continue; }
      if (streak.midi === midi) streak.ticks += 1;
      else {
        const age = locatePitchStart(hist, SR, r.frequency);
        streak = { midi, ticks: 1, firstSeenAt: now, pitchStart: age == null ? null : now - age };
      }
      if (streak.ticks >= 2 && midi !== reported) {
        reported = midi;
        const energy = energyOnsets.filter((t) => t <= streak.firstSeenAt + 20).pop() ?? null;
        const est = chooseNoteOnset(energy, streak.pitchStart, streak.firstSeenAt);
        sources[est.source] += 1;
        // The pluck this report is of: the latest one of that pitch (an
        // octave off counts, as in the engine).
        const idx = plucks.map((_, i) => i).filter((i) => plucks[i] <= now
          && (pluckMidi[i] === midi || Math.abs(pluckMidi[i] - midi) === 12)).pop();
        if (idx == null) { misread += 1; continue; }
        const err = est.at - plucks[idx];
        errors.push(err);
        if (Math.abs(err) > 20) outliers.push(`${est.source} ${err.toFixed(0)} ms, ${pluckMidi[idx - 1]}→${pluckMidi[idx]}`);
      }
    }
    total += plucks.length;
    onClick += energyOnsets.filter((f) => clicks.some((c) => Math.abs(f - c) <= 15)
      && plucks.every((t) => Math.abs(f - t) > 40)).length;
  }
  const within = (lim: number) => errors.filter((e) => Math.abs(e) <= lim).length;
  check('listener: ≥ 90% of plucks reported', errors.length >= total * 0.9, `${errors.length}/${total}`);
  check('listener: no note reported that was not played (or an octave of it)', misread === 0, `${misread} misread`);
  check('listener: ≥ 90% of reported notes timed within 30 ms', within(30) >= errors.length * 0.9,
    `${within(30)}/${errors.length}`);
  check('listener: every reported note within 62 ms (⅙ beat at 160 BPM)', within(62) === errors.length,
    `worst ${Math.max(...errors.map(Math.abs)).toFixed(0)} ms`);
  check('listener: no onset from a click', onClick === 0, `${onClick} on clicks`);
  if (process.env.VERBOSE) console.log(outliers.join('\n'));
  console.log(`      (${misread} misread; ${errors.length}/${total} reported; ≤10 ms ${within(10)}, ≤20 ms ${within(20)}; `
    + `sources energy ${sources.energy} / comb ${sources.pitch} / report ${sources.report})`);
}

if (failures > 0) { console.error(`\n${failures} check(s) FAILED`); process.exit(1); }
console.log('\nAll timing checks passed.');
