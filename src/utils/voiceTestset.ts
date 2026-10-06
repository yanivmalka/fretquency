// ── Voice test-set recording (admin tool) ──────────────────────────────
//
// Storage, prompt plan and export for the Voice test lab
// (`components/VoiceTestLab.tsx`). The lab records labelled takes from real
// speakers so the recogniser can be scored offline, end to end, by
// `scripts/eval-voice-e2e.mts`, instead of judged from a 10-word live round.
//
// Each take is the RAW microphone stream from the moment listening started
// (the prompt appearing) until a little after the live VAD ended it — not
// the trimmed capture — so the offline script can replay the endpointing
// itself (`replayCapture`) and score capture failures too, and so a changed
// VAD can be measured on the same audio.
//
// Takes live only on this device (IndexedDB) until exported as one .tar of
// WAVs + manifest.json. Nothing is uploaded.

import { encodeWav } from './wavEncode';

export type TakeKind = 'cal' | 'ans';
export type TestNotation = 'alpha' | 'solfege';

/**
 * One thing to say. `label` is the filename fragment the offline script
 * parses (`C`, `Cs`, `Db`, `sharp`, `flat`); `truth` is what a correct
 * recognition returns — a sharp-spelled note name, or `#`/`b` for an
 * isolated accidental word.
 */
export interface TestPrompt {
  kind: TakeKind;
  label: string;
  truth: string;
}

export interface TakeMeta {
  speaker: string;
  condition: string;
  device: string;
  notation: TestNotation;
  kind: TakeKind;
  label: string;
  truth: string;
}

export interface StoredTake extends TakeMeta {
  id: number;
  createdAt: number;
  sampleRate: number;
  /** Raw stream as 16-bit PCM. */
  pcm16: ArrayBuffer;
  /** Length of the capture the live VAD produced, for a replay sanity check. */
  liveCaptureSamples: number;
}

// ── prompt plan ──────────────────────────────────────────────────────

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const SHARPS = ['C', 'D', 'F', 'G', 'A'] as const;
const FLATS = ['D', 'E', 'G', 'A', 'B'] as const;
const FLAT_TRUTH: Record<string, string> = { D: 'C#', E: 'D#', G: 'F#', A: 'G#', B: 'A#' };

/** Calibration takes per word — the app's `SAMPLES_PER_LABEL`. */
export const CAL_TAKES = 4;

/** The nine isolated calibration words, `CAL_TAKES` each, word by word like the app. */
export function calibrationPlan(): TestPrompt[] {
  const words: TestPrompt[] = [
    ...LETTERS.map((l) => ({ kind: 'cal' as const, label: l, truth: l })),
    { kind: 'cal', label: 'sharp', truth: '#' },
    { kind: 'cal', label: 'flat', truth: 'b' },
  ];
  return words.flatMap((w) => Array.from({ length: CAL_TAKES }, () => w));
}

/** All seventeen spellings (7 naturals, 5 sharps, 5 flats), `rounds` times, shuffled. */
export function answerPlan(rounds: number): TestPrompt[] {
  const one: TestPrompt[] = [
    ...LETTERS.map((l) => ({ kind: 'ans' as const, label: l, truth: l })),
    ...SHARPS.map((l) => ({ kind: 'ans' as const, label: `${l}s`, truth: `${l}#` })),
    ...FLATS.map((l) => ({ kind: 'ans' as const, label: `${l}b`, truth: FLAT_TRUTH[l] })),
  ];
  const out: TestPrompt[] = [];
  for (let r = 0; r < rounds; r++) {
    const round = [...one];
    for (let i = round.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [round[i], round[j]] = [round[j], round[i]];
    }
    // No word twice in a row across a round boundary.
    if (out.length && round[0].label === out[out.length - 1].label) round.push(round.shift()!);
    out.push(...round);
  }
  return out;
}

const SOLFEGE: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };

/** What to show on screen, and how to say it. */
export function promptText(p: TestPrompt, notation: TestNotation): { show: string; say: string } {
  const sharpWord = notation === 'solfege' ? 'diez' : 'sharp';
  const flatWord = notation === 'solfege' ? 'bemol' : 'flat';
  if (p.label === 'sharp') return { show: sharpWord, say: sharpWord };
  if (p.label === 'flat') return { show: flatWord, say: flatWord };
  const letter = p.label[0];
  const name = notation === 'solfege' ? SOLFEGE[letter] : letter;
  if (p.label.endsWith('s')) return { show: `${name}♯`, say: `${name} ${sharpWord}` };
  if (p.label.length === 2 && p.label.endsWith('b')) return { show: `${name}♭`, say: `${name} ${flatWord}` };
  return { show: name, say: name };
}

// ── IndexedDB ────────────────────────────────────────────────────────

const DB_NAME = 'fretquency-voice-testset';
const STORE = 'takes';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => { resolve(req.result); db.close(); };
    req.onerror = () => { reject(req.error); db.close(); };
  }));
}

function toPcm16(pcm: Float32Array): ArrayBuffer {
  const out = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out.buffer;
}

function fromPcm16(buf: ArrayBuffer): Float32Array {
  const src = new Int16Array(buf);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) out[i] = src[i] / 32768;
  return out;
}

export async function saveTake(
  meta: TakeMeta,
  stream: Float32Array,
  sampleRate: number,
  liveCaptureSamples: number,
): Promise<number> {
  const row: Omit<StoredTake, 'id'> = {
    ...meta, createdAt: Date.now(), sampleRate, pcm16: toPcm16(stream), liveCaptureSamples,
  };
  return Number(await tx('readwrite', (s) => s.add(row)));
}

export async function deleteTake(id: number): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}

export async function clearTakes(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
}

export async function listTakes(): Promise<StoredTake[]> {
  return tx('readonly', (s) => s.getAll() as IDBRequest<StoredTake[]>);
}

/** Take counts per speaker / condition / device / notation / kind, for the lab's summary. */
export function summarize(takes: StoredTake[]): { key: string; n: number }[] {
  const m = new Map<string, number>();
  for (const t of takes) {
    const key = `${t.speaker} · ${t.condition} · ${t.device} · ${t.notation} · ${t.kind}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return [...m.entries()].sort().map(([key, n]) => ({ key, n }));
}

// ── export ───────────────────────────────────────────────────────────

/**
 * Lower-case, filename-safe, `__`-free (the field separator), ASCII only —
 * the tar header is single-byte. A name with no Latin letters at all (a
 * Hebrew name) becomes `s` + a short hash of it, so two such speakers stay
 * apart; the manifest keeps the real name.
 */
export function slug(s: string, max = 16): string {
  const ascii = s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
  if (ascii) return ascii;
  let h = 5381;
  for (const ch of s.trim()) h = ((h * 33) ^ ch.codePointAt(0)!) >>> 0;
  return `s${h.toString(36)}`;
}

/**
 * `<speaker>__<condition>__<device>__<notation>__<kind>__<label>__<id>.wav` —
 * the layout `scripts/eval-voice-e2e.mts` parses.
 */
export function takeFileName(t: StoredTake): string {
  return [slug(t.speaker), slug(t.condition), slug(t.device), t.notation, t.kind, t.label, t.id].join('__') + '.wav';
}

// Minimal ustar writer — one regular file per entry.
function tarHeader(name: string, size: number, mtime: number): Uint8Array {
  const h = new Uint8Array(512);
  const put = (off: number, len: number, s: string) => {
    for (let i = 0; i < Math.min(len, s.length); i++) h[off + i] = s.charCodeAt(i) & 0xff;
  };
  const oct = (n: number, len: number) => n.toString(8).padStart(len - 1, '0');
  put(0, 100, name);
  put(100, 8, '0000644');
  put(108, 8, '0000000');
  put(116, 8, '0000000');
  put(124, 12, oct(size, 12));
  put(136, 12, oct(Math.floor(mtime / 1000), 12));
  put(148, 8, '        ');
  put(156, 1, '0');
  put(257, 6, 'ustar');
  put(263, 2, '00');
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += h[i];
  put(148, 8, `${oct(sum, 7)}\0 `);
  return h;
}

export function buildTar(files: { name: string; data: ArrayBuffer }[]): Blob {
  const parts: BlobPart[] = [];
  const now = Date.now();
  for (const f of files) {
    parts.push(tarHeader(f.name, f.data.byteLength, now) as Uint8Array<ArrayBuffer>, f.data);
    const pad = (512 - (f.data.byteLength % 512)) % 512;
    if (pad) parts.push(new Uint8Array(pad));
  }
  parts.push(new Uint8Array(1024));
  return new Blob(parts, { type: 'application/x-tar' });
}

/** Every stored take as a WAV, plus a manifest, in one .tar. */
export function exportTar(takes: StoredTake[]): Blob {
  const enc = new TextEncoder();
  const files = takes.map((t) => ({
    name: takeFileName(t),
    data: encodeWav(fromPcm16(t.pcm16), t.sampleRate),
  }));
  const manifest = takes.map((t) => ({
    file: takeFileName(t), speaker: t.speaker, condition: t.condition, device: t.device,
    notation: t.notation, kind: t.kind, label: t.label, truth: t.truth,
    sampleRate: t.sampleRate, liveCaptureSamples: t.liveCaptureSamples, createdAt: t.createdAt,
  }));
  files.push({ name: 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 1)).buffer as ArrayBuffer });
  return buildTar(files);
}
