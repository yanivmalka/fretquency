// End-to-end offline score for the personal-profile voice recogniser.
// Run by hand — not part of `npm run build`.
//
// Input: takes recorded with the in-app Voice test lab (🐞 → 🎙), exported
// as a .tar (or that .tar extracted into a folder). Each take is the RAW
// microphone stream from the moment listening started, named
//   <speaker>__<condition>__<device>__<notation>__<kind>__<label>__<id>.wav
// (`src/utils/voiceTestset.ts`).
//
// For every (speaker, device, notation) it builds a personal profile from
// that speaker's calibration takes exactly as the app's calibration does —
// the VAD replayed over the raw stream (`replayCapture`, calibration
// limits), `isolateWord`, `computeMfcc` — then runs every answer take
// through the SAME code the app runs per listen turn: `replayCapture` with
// the segmented engine's limits, then `recognizeSegmented`. Nothing here
// re-implements a decision; a change to either function is scored as is.
//
// Every answer take ends in one of three outcomes:
//   correct — the note it returned is the prompted one
//   wrong   — it returned a different note (the player is marked wrong)
//   reject  — no capture (onset timeout) or no confident note ("say again")
//
// Not modelled: the calibration screen's noise gate (`resemblesSpokenNote`)
// — a take the app would have refused is used here — and the keep-alive
// retry after a reject (each take is one listen turn).
//
// Usage:
//   node --experimental-strip-types scripts/eval-voice-e2e.mts <file.tar | dir> [...more]
// Options:
//   --cal-takes <n>        calibration takes per word (default 4, the app's)
//   --cal-condition <c>    build profiles from this condition's takes (default quiet,
//                          falling back to any)
//   --ls key=value         set a localStorage tuning key the app reads, e.g.
//                          --ls voiceAccidentalAbsMax=25 --ls voiceProfileZNorm=1
//   --ratio <r>            relMax ratio cap (default 0.97, the app's)
//   --only <text>          keep only takes whose file name contains this
//   --trace                print every take's outcome and the recogniser's debug lines
//   --json <out.json>      write per-take results, for comparing two runs

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { registerHooks } from 'node:module';
import { decodeWav } from './wav-lib.mts';

// ── module loading ────────────────────────────────────────────────────
// App source uses extensionless relative imports (Vite resolution), and
// `debugLog.ts` touches `import.meta.env` / `window`. Resolve the former to
// `.ts`, and swap the latter for a stub that collects lines for --trace.
const trace: string[] = [];
(globalThis as Record<string, unknown>).__evalTrace = trace;
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (e) {
      if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw e;
    }
  },
  load(url, context, nextLoad) {
    if (url.endsWith('/src/utils/debugLog.ts')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const sink = globalThis.__evalTrace;
          export function vlog(tag, data) { sink.push(tag + ' ' + JSON.stringify(data ?? '')); }
          export function verror(tag, data) { sink.push('ERROR ' + tag + ' ' + JSON.stringify(data ?? '')); }
        `,
      };
    }
    return nextLoad(url, context);
  },
});

// ── args ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const VALUE_FLAGS = new Set(['--cal-takes', '--cal-condition', '--ls', '--ratio', '--only', '--json']);
const inputs = argv.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(argv[i - 1]));
const calTakes = Number(opt('--cal-takes') ?? 4);
const calCondition = opt('--cal-condition') ?? 'quiet';
const ratioCap = Number(opt('--ratio') ?? 0.97);
const only = opt('--only');
const showTrace = argv.includes('--trace');
const jsonOut = opt('--json');

// A Map-backed localStorage, so the app's own tuning keys can be set per run.
const ls = new Map<string, string>();
argv.forEach((a, i) => {
  if (argv[i - 1] !== '--ls') return;
  const eq = a.indexOf('=');
  if (eq > 0) ls.set(a.slice(0, eq), a.slice(eq + 1));
});
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => ls.get(k) ?? null,
  setItem: (k: string, v: string) => { ls.set(k, v); },
  removeItem: (k: string) => { ls.delete(k); },
};

if (!inputs.length) {
  console.error('usage: eval-voice-e2e.mts <file.tar | dir> [...] [--cal-takes n] [--cal-condition c] [--ls k=v] [--ratio r] [--only text] [--trace] [--json out]');
  process.exit(1);
}

const { replayCapture, isolateWord } = await import('../src/utils/utteranceCapture.ts');
const { recognizeSegmented } = await import('../src/utils/segmentedRecognizer.ts');
const { computeMfcc } = await import('../src/utils/mfcc.ts');

// ── read takes ────────────────────────────────────────────────────────
interface Take {
  file: string;
  speaker: string;
  condition: string;
  device: string;
  notation: string;
  kind: 'cal' | 'ans';
  label: string;
  id: number;
  pcm: Float32Array;
  sampleRate: number;
  liveCaptureSamples?: number;
}

function* tarEntries(buf: Buffer): Generator<{ name: string; data: Buffer }> {
  let pos = 0;
  while (pos + 512 <= buf.length) {
    const header = buf.subarray(pos, pos + 512);
    if (header.every((b) => b === 0)) return;
    const name = header.toString('latin1', 0, 100).replace(/\0.*$/s, '');
    const size = parseInt(header.toString('latin1', 124, 136).replace(/\0.*$/s, '').trim(), 8) || 0;
    const type = String.fromCharCode(header[156] || 48);
    if (type === '0') yield { name, data: buf.subarray(pos + 512, pos + 512 + size) };
    pos += 512 + Math.ceil(size / 512) * 512;
  }
}

const files: { name: string; data: Buffer }[] = [];
for (const input of inputs) {
  const p = resolve(input);
  if (statSync(p).isDirectory()) {
    for (const f of readdirSync(p)) {
      if (f.endsWith('.wav') || f === 'manifest.json') files.push({ name: f, data: readFileSync(resolve(p, f)) });
    }
  } else {
    for (const e of tarEntries(readFileSync(p))) files.push({ name: basename(e.name), data: e.data });
  }
}

// The manifest carries the real speaker name (a file name holds only an
// ASCII slug of it) and the live capture length for the replay check.
const manifestByFile = new Map<string, { speaker?: string; liveCaptureSamples?: number }>();
for (const f of files) {
  if (f.name !== 'manifest.json') continue;
  for (const m of JSON.parse(f.data.toString('utf8')) as { file: string; speaker?: string; liveCaptureSamples?: number }[]) {
    manifestByFile.set(m.file, m);
  }
}

const takes: Take[] = [];
let skipped = 0;
for (const f of files) {
  if (!f.name.endsWith('.wav')) continue;
  if (only && !f.name.includes(only)) continue;
  const parts = f.name.replace(/\.wav$/, '').split('__');
  if (parts.length !== 7 || (parts[4] !== 'cal' && parts[4] !== 'ans')) { skipped++; continue; }
  const [speaker, condition, device, notation, kind, label, id] = parts;
  const { pcm, sampleRate } = decodeWav(f.data);
  const m = manifestByFile.get(f.name);
  takes.push({
    file: f.name, speaker: m?.speaker || speaker, condition, device, notation, kind: kind as 'cal' | 'ans', label,
    id: Number(id), pcm, sampleRate, liveCaptureSamples: m?.liveCaptureSamples || undefined,
  });
}
takes.sort((a, b) => a.id - b.id);
if (skipped) console.log(`(skipped ${skipped} files with an unrecognised name)`);

// ── truth ─────────────────────────────────────────────────────────────
const FLAT_TRUTH: Record<string, string> = { D: 'C#', E: 'D#', G: 'F#', A: 'G#', B: 'A#' };
function truthOf(t: Take): string {
  if (t.label === 'sharp') return '#';
  if (t.label === 'flat') return 'b';
  if (t.label.length === 2 && t.label[1] === 's') return `${t.label[0]}#`;
  if (t.label.length === 2 && t.label[1] === 'b') return FLAT_TRUTH[t.label[0]] ?? '?';
  return t.label;
}
const spelling = (t: Take) => (t.label.length === 1 ? 'natural' : t.label[1] === 's' ? 'sharp' : 'flat');

// ── profiles ──────────────────────────────────────────────────────────
const CAL_VAD = { trailingSilenceMs: 350, maxSpeechMs: 2500 };
const ANS_VAD = { trailingSilenceMs: 500, maxSpeechMs: 3500 };

let replayChecked = 0;
let replayMismatch = 0;
function capture(t: Take, vad: typeof CAL_VAD): Float32Array | null {
  const pcm = replayCapture(t.pcm, t.sampleRate, vad);
  if (pcm && t.liveCaptureSamples) {
    replayChecked++;
    if (pcm.length !== t.liveCaptureSamples) replayMismatch++;
  }
  return pcm;
}

type Template = { label: string; frames: Float32Array[] };
const profileKey = (t: Take) => `${t.speaker}/${t.device}/${t.notation}`;
const profiles = new Map<string, Template[]>();
const profileNotes: string[] = [];

for (const key of new Set(takes.filter((t) => t.kind === 'ans').map(profileKey))) {
  const cal = takes.filter((t) => t.kind === 'cal' && profileKey(t) === key);
  const preferred = cal.filter((t) => t.condition === calCondition);
  const pool = preferred.length ? preferred : cal;
  const templates: Template[] = [];
  const perLabel = new Map<string, number>();
  let dropped = 0;
  for (const t of pool) {
    const label = truthOf(t);
    if ((perLabel.get(label) ?? 0) >= calTakes) continue;
    const pcm = capture(t, CAL_VAD);
    if (!pcm) { dropped++; continue; }
    const { frames } = computeMfcc(isolateWord(pcm, t.sampleRate), t.sampleRate);
    if (!frames.length) { dropped++; continue; }
    templates.push({ label, frames });
    perLabel.set(label, (perLabel.get(label) ?? 0) + 1);
  }
  const missing = ['C', 'D', 'E', 'F', 'G', 'A', 'B', '#', 'b'].filter((l) => !perLabel.get(l));
  profileNotes.push(`${key}: ${templates.length} templates from ${preferred.length ? calCondition : 'any condition'}`
    + `${dropped ? `, ${dropped} takes had no capture` : ''}${missing.length ? `, MISSING ${missing.join(' ')}` : ''}`);
  if (templates.length) profiles.set(key, templates);
}

// ── calibration leave-one-out (--cal-loo) ─────────────────────────────
// Each isolated calibration word matched against the speaker's other
// calibration takes — letters against letters, accidental words against
// accidental words, as the two stages do. No answer takes needed: it says how
// separable this speaker's own nine words are before any segmentation, i.e.
// the ceiling the letter stage works under.
if (argv.includes('--cal-loo')) {
  const { matchTemplates } = await import('../src/utils/dtw.ts');
  const isAcc = (l: string) => l === '#' || l === 'b';
  for (const key of new Set(takes.filter((t) => t.kind === 'cal').map(profileKey))) {
    const items: { label: string; frames: Float32Array[] }[] = [];
    for (const t of takes) {
      if (t.kind !== 'cal' || profileKey(t) !== key) continue;
      const pcm = capture(t, CAL_VAD);
      if (!pcm) continue;
      const { frames } = computeMfcc(isolateWord(pcm, t.sampleRate), t.sampleRate);
      if (frames.length) items.push({ label: truthOf(t), frames });
    }
    let ok = 0;
    const conf = new Map<string, number>();
    // For each word: distance to its own nearest take ÷ distance to the
    // nearest take of any other word. ≥ 1 means it was misread; close to 1
    // means it nearly was.
    const margins = new Map<string, { other: string; ratio: number }[]>();
    items.forEach((it, i) => {
      const pool = items.filter((o, j) => j !== i && isAcc(o.label) === isAcc(it.label));
      const ranked = matchTemplates(it.frames, pool);
      const own = ranked.find((r) => r.label === it.label);
      const other = ranked.find((r) => r.label !== it.label);
      if (ranked[0]?.label === it.label) ok++;
      else conf.set(`${it.label}→${ranked[0]?.label}`, (conf.get(`${it.label}→${ranked[0]?.label}`) ?? 0) + 1);
      if (own && other) {
        if (!margins.has(it.label)) margins.set(it.label, []);
        margins.get(it.label)!.push({ other: other.label, ratio: own.distance / other.distance });
      }
    });
    const [lo, hi] = wilson(ok, items.length);
    console.log(`\ncalibration leave-one-out — ${key}: ${ok}/${items.length} ${((100 * ok) / Math.max(1, items.length)).toFixed(1)}% [${lo.toFixed(0)}–${hi.toFixed(0)}]`);
    if (conf.size) console.log(`  misread: ${[...conf].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join('  ')}`);
    console.log('  per word: worst own/other distance ratio (≥1 = misread, near 1 = nearly), and the word it was closest to');
    for (const [label, ms] of [...margins].sort(([a], [b]) => a.localeCompare(b))) {
      const worst = ms.reduce((w, m) => (m.ratio > w.ratio ? m : w));
      const near = new Map<string, number>();
      for (const m of ms) near.set(m.other, (near.get(m.other) ?? 0) + 1);
      console.log(`  ${label.padEnd(2)} worst ${worst.ratio.toFixed(2)} (vs ${worst.other})   nearest other: ${[...near].map(([k, n]) => `${k}×${n}`).join(' ')}`);
    }
  }
}

// ── answers ───────────────────────────────────────────────────────────
type Outcome = 'correct' | 'wrong' | 'reject';
interface Row {
  file: string; group: string; spelling: string; truth: string;
  predicted: string | null; outcome: Outcome; nocapture: boolean;
}
const rows: Row[] = [];
const SHARP_WRAP: Record<string, string> = { 'E#': 'F', 'B#': 'C' };

for (const t of takes) {
  if (t.kind !== 'ans') continue;
  const templates = profiles.get(profileKey(t));
  if (!templates) continue;
  trace.length = 0;
  const pcm = capture(t, ANS_VAD);
  const note = pcm
    ? recognizeSegmented({ pcm, sampleRate: t.sampleRate }, templates, { kind: 'profile', ratioCap, absCap: Infinity })
    : null;
  const truth = truthOf(t);
  const predicted = note ? (SHARP_WRAP[note] ?? note) : null;
  const outcome: Outcome = predicted === null ? 'reject' : predicted === truth ? 'correct' : 'wrong';
  rows.push({
    file: t.file, group: `${t.speaker} · ${t.device} · ${t.condition} · ${t.notation}`,
    spelling: spelling(t), truth, predicted, outcome, nocapture: !pcm,
  });
  if (showTrace) {
    const mark = outcome === 'correct' ? '✓' : outcome === 'wrong' ? '✗' : '·';
    console.log(`${mark} ${t.file}  truth ${truth}  got ${predicted ?? (pcm ? '(reject)' : '(no capture)')}`);
    for (const line of trace) console.log(`    ${line}`);
  }
}

// ── report ────────────────────────────────────────────────────────────
/** Wilson 95% interval for k of n, as percentages. */
function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 0];
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [100 * Math.max(0, c - h), 100 * Math.min(1, c + h)];
}
const pct = (k: number, n: number) => (n ? ((100 * k) / n).toFixed(1) : '-').padStart(5) + '%';
function line(label: string, rs: Row[]): string {
  const n = rs.length;
  const ok = rs.filter((r) => r.outcome === 'correct').length;
  const bad = rs.filter((r) => r.outcome === 'wrong').length;
  const rej = n - ok - bad;
  const [lo, hi] = wilson(ok, n);
  return `${label.padEnd(44)} n=${String(n).padStart(4)}   correct ${pct(ok, n)} [${lo.toFixed(0)}–${hi.toFixed(0)}]`
    + `   wrong ${pct(bad, n)}   reject ${pct(rej, n)}`;
}

console.log('\nprofiles');
for (const p of profileNotes) console.log(`  ${p}`);
if (ls.size) console.log(`localStorage: ${[...ls].map(([k, v]) => `${k}=${v}`).join(' ')}`);
console.log(`ratio cap ${ratioCap}, ${calTakes} calibration takes per word`);
if (replayChecked) {
  console.log(`VAD replay vs live capture: ${replayChecked - replayMismatch}/${replayChecked} identical`
    + (replayMismatch ? '  ← the replay does not reproduce the live VAD; scores below are suspect' : ''));
}

if (!rows.length) {
  console.log('\nno answer takes with a matching calibration profile');
  process.exit(0);
}

console.log('\n' + line('ALL', rows));
console.log('  (correct = first try right; [..] = 95% interval; reject = "say it again")\n');
const by = (f: (r: Row) => string) => {
  const m = new Map<string, Row[]>();
  for (const r of rows) { const k = f(r); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
};
for (const [k, rs] of by((r) => r.group)) console.log(line(k, rs));
console.log();
for (const [k, rs] of by((r) => r.spelling)) console.log(line(k, rs));

console.log('\nper note (truth → what came back, wrong/reject only)');
for (const [truth, rs] of by((r) => r.truth)) {
  const miss = new Map<string, number>();
  for (const r of rs) {
    if (r.outcome === 'correct') continue;
    const k = r.predicted ?? (r.nocapture ? '(no capture)' : '(reject)');
    miss.set(k, (miss.get(k) ?? 0) + 1);
  }
  const ok = rs.filter((r) => r.outcome === 'correct').length;
  const tail = [...miss.entries()].sort((a, b) => b[1] - a[1]).map(([p, c]) => `${p}×${c}`).join(' ');
  console.log(`  ${truth.padEnd(3)} ${String(ok).padStart(3)}/${String(rs.length).padEnd(3)} ${tail}`);
}

if (jsonOut) {
  writeFileSync(resolve(jsonOut), JSON.stringify(rows, null, 1));
  console.log(`\nwrote ${rows.length} rows to ${jsonOut}`);
}
