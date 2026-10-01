// ── Speech-recognition engine abstraction ───────────────────────────────
//
// WP-2 of the voice-recognition feature. One small interface, two
// implementations chosen at runtime:
//
//   • web    — the browser's SpeechRecognition / webkitSpeechRecognition
//              (Chrome/Edge desktop + Android Chrome). Needs a network
//              connection; unlike the rest of the PWA it does not work
//              offline.
//   • native — @capacitor-community/speech-recognition, used inside the
//              Capacitor Android app where the web API is absent. Loaded
//              lazily so the web build has no hard dependency on the plugin.
//   • none   — neither is available; callers fall back to tap input.
//
// The engine only produces raw transcripts. Turning a transcript into a
// note/fret is `speechVocab.ts`'s job.

import type { SpeechNotation } from './speechVocab';
import { speechVocabulary } from './speechVocab';
import { loadSetting } from './settings';
import {
  getActiveProfile, isProfileReady, loadTemplates as loadProfileTemplates,
} from './voiceProfile';
import { baseVocabId } from './voiceProfileVocab';
import { TemplateSpeechEngine } from './templateSpeechEngine';
import { vlog } from './debugLog';

export type SpeechEngineKind = 'web' | 'native' | 'none' | 'profile' | 'general';

/** User preference for which recogniser to use on the web platform. */
export type VoiceEnginePref = 'auto' | 'profile' | 'general' | 'web';

/** Result of a silent, non-prompting microphone-permission check. */
export type MicPermissionState = 'granted' | 'denied' | 'unknown';

export type SpeechEngineError =
  | 'not-supported'
  | 'no-permission'
  | 'no-speech'
  | 'aborted'
  | 'network'
  | 'unknown';

export interface SpeechResult {
  /** Top-ranked hypothesis. */
  transcript: string;
  /** All hypotheses for this result, best first (includes `transcript`). */
  alternatives: string[];
  isFinal: boolean;
  confidence?: number;
  /**
   * Everything settled so far in the *current listen turn*, and everything
   * still in flight, each as one string.
   *
   * A continuous recogniser does not keep its results partitioned stably:
   * Chrome re-splits an utterance across result indices while it listens (a
   * turn can go from two results to three and back, with words moving between
   * them), so a caller that appends result-by-result both loses and repeats
   * words. These two fields are rebuilt from the whole result list on every
   * event, so a caller can simply *replace* its turn text instead of
   * accumulating. Dictation wants these; the fixed-vocabulary answer path
   * still reads `transcript`/`alternatives` per result.
   */
  turnFinal?: string;
  turnInterim?: string;
}

export interface SpeechListenOptions {
  /** BCP-47 tag, e.g. "en-US" or "he-IL". */
  lang: string;
  /** Phrases to bias the recogniser towards (from `speechVocabulary()`). */
  vocabulary?: string[];
  /**
   * Grouping key for the on-device personal-profile engine — which set of
   * calibration recordings to match against (see `voiceProfileVocab.ts`).
   * Ignored by the Web and native engines.
   */
  profileVocabId?: string;
  /**
   * Keep the mic open past the first phrase (default true). The game's answer
   * path needs this — a question lasts longer than one utterance. Dictation
   * passes false so a tap of the mic captures exactly one phrase: Android ends
   * the recogniser after every utterance regardless, and each restart plays
   * the system's recognition chime, so restarting for a continuous feel turns
   * a thinking pause into a stream of beeps.
   */
  continuous?: boolean;
  onResult: (r: SpeechResult) => void;
  onError: (e: SpeechEngineError) => void;
  /** Fired once the recogniser has stopped, for any reason. */
  onEnd?: () => void;
}

export interface SpeechEngine {
  readonly kind: SpeechEngineKind;
  isSupported(): boolean;
  /**
   * Silent, non-prompting permission check — used on start-up to seed the
   * permission state so an already-granted mic doesn't re-trigger the primer
   * card. Resolves to 'unknown' when the platform can't answer without a prompt.
   */
  checkPermission(): Promise<MicPermissionState>;
  /** Prompt for / verify microphone permission. Resolves to granted. */
  requestPermission(): Promise<boolean>;
  /** Begin a single listen turn. Rejects only on synchronous setup failure. */
  start(opts: SpeechListenOptions): Promise<void>;
  /** Stop the current listen turn early (safe to call when idle). */
  stop(): void;
  /** Release any retained resources. */
  destroy(): void;
  /**
   * Optional: pre-load whatever the engine needs for its first match
   * (template store, lazy chunk) so the first question is not slow. Only the
   * on-device template engines implement it.
   */
  warmUp?(vocabId?: string): Promise<void>;
}

// ── Language helper ───────────────────────────────────────────────────

/**
 * Best-effort BCP-47 tag for the active note notation. Solfège answers can
 * be spoken in Hebrew ("דו רה מי"), so callers may override.
 */
export function speechLangForNotation(
  _notation: SpeechNotation,
  override?: string,
): string {
  // Both alpha and solfège answers are recognised in English by default;
  // a caller wanting Hebrew solfège ("דו רה מי") passes override "he-IL".
  return override || 'en-US';
}

// ── Web implementation ───────────────────────────────────────────────

type SRConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  grammars?: unknown;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }
  >;
}

/**
 * Add one result's text to a turn's segment list, treating a result that
 * extends or restates its immediate predecessor as a revision of it rather
 * than as new speech.
 *
 * Browsers disagree about what a result index means. Chrome emits disjoint
 * segments that must be joined ("מה שלומך", then " 1 2 3"). Samsung Internet
 * never emits interim results at all — it marks every revision of the same
 * utterance final and appends it as a *new* index, each restating the whole
 * phrase ("מה", then "מה שלומך", then "מה שלומך"), so joining them repeats
 * the opening words. Collapsing a prefix-related pair and keeping the longer
 * text handles both: unrelated segments still concatenate.
 */
function pushSegment(segments: string[], raw: string): void {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return;
  const prev = segments.length ? segments[segments.length - 1] : undefined;
  if (prev !== undefined && (text.startsWith(prev) || prev.startsWith(text))) {
    segments[segments.length - 1] = text.length >= prev.length ? text : prev;
    return;
  }
  segments.push(text);
}

function getSRConstructor(): SRConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function getGrammarListConstructor(): (new () => {
  addFromString(s: string, weight?: number): void;
}) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechGrammarList || w.webkitSpeechGrammarList || null) as never;
}

class WebSpeechEngine implements SpeechEngine {
  readonly kind = 'web' as const;
  private rec: SpeechRecognitionLike | null = null;
  /** Bumped on every start()/stop() so late callbacks from a prior turn are ignored. */
  private turn = 0;

  isSupported(): boolean {
    return getSRConstructor() !== null;
  }

  async checkPermission(): Promise<MicPermissionState> {
    try {
      const status = await navigator.permissions?.query({
        name: 'microphone' as PermissionName,
      });
      if (status?.state === 'granted') return 'granted';
      if (status?.state === 'denied') return 'denied';
    } catch {
      /* Permissions API doesn't support "microphone" here — can't tell silently */
    }
    return 'unknown';
  }

  async requestPermission(): Promise<boolean> {
    // Prefer a silent check when the Permissions API knows the answer.
    try {
      const status = await navigator.permissions?.query({
        name: 'microphone' as PermissionName,
      });
      if (status?.state === 'granted') return true;
      if (status?.state === 'denied') return false;
    } catch {
      /* Permissions API not available for "microphone" — fall through */
    }
    // Otherwise trigger the OS prompt via getUserMedia and release the stream.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  async start(opts: SpeechListenOptions): Promise<void> {
    const Ctor = getSRConstructor();
    if (!Ctor) {
      opts.onError('not-supported');
      return;
    }
    this.stop(); // end any previous turn
    const myTurn = ++this.turn;
    const rec = new Ctor();
    this.rec = rec;
    rec.lang = opts.lang;
    // Keep the mic open for the whole question. In non-continuous mode the
    // browser ends the turn after the first phrase or a brief silence, which
    // left the app deaf for the rest of the question.
    rec.continuous = opts.continuous !== false;
    rec.interimResults = true;
    rec.maxAlternatives = 5;

    const GLCtor = getGrammarListConstructor();
    const vocab = opts.vocabulary;
    if (GLCtor && vocab && vocab.length) {
      try {
        const list = new GLCtor();
        const escaped = vocab.map(v => v.replace(/[;{}]/g, '')).join(' | ');
        list.addFromString(
          `#JSGF V1.0; grammar answers; public <answer> = ${escaped} ;`,
          1,
        );
        rec.grammars = list;
      } catch {
        /* grammar is an optimisation only — ignore build failures */
      }
    }

    rec.onresult = (e: SpeechRecognitionEventLike) => {
      if (myTurn !== this.turn) return;
      // Rebuild the whole turn from the current result list. Chrome moves text
      // between result indices as it listens, so this snapshot — not any
      // per-index bookkeeping — is the only sound view of what was said.
      const finalSegs: string[] = [];
      const interimSegs: string[] = [];
      const dump: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? '';
        pushSegment(r.isFinal ? finalSegs : interimSegs, t);
        dump.push(`${i}${r.isFinal ? 'F' : 'i'}:${t}`);
      }
      const turnFinal = finalSegs.join(' ');
      const turnInterim = interimSegs.join(' ');
      vlog('[voice] web onresult', {
        turn: myTurn,
        idx: e.resultIndex,
        n: e.results.length,
        turnFinal,
        turnInterim,
        results: dump,
      });
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const alt = res[0];
        if (!alt) continue;
        // Pass every alternative, not just the top one: an isolated note
        // letter is often ranked below a common homophone ("see" over "C",
        // "for" over "four"), and the caller keeps the first that parses.
        const alternatives: string[] = [];
        for (let a = 0; a < res.length; a++) {
          const t = res[a]?.transcript;
          if (t) alternatives.push(t);
        }
        opts.onResult({
          transcript: alt.transcript,
          alternatives,
          isFinal: res.isFinal,
          confidence: alt.confidence,
          turnFinal,
          turnInterim,
        });
      }
    };
    rec.onerror = (e: { error: string }) => {
      vlog('[voice] web onerror', { turn: myTurn, live: myTurn === this.turn, error: e.error });
      if (myTurn !== this.turn) return;
      opts.onError(mapWebError(e.error));
    };
    rec.onend = () => {
      vlog('[voice] web onend', { turn: myTurn, live: myTurn === this.turn });
      if (myTurn !== this.turn) return;
      this.rec = null;
      opts.onEnd?.();
    };

    try {
      rec.start();
      vlog('[voice] web started', { turn: myTurn, lang: rec.lang, continuous: rec.continuous });
    } catch {
      // start() throws if called while already running — treat as aborted
      vlog('[voice] web start threw', { turn: myTurn });
      this.rec = null;
      opts.onError('aborted');
    }
  }

  stop(): void {
    this.turn++;
    const rec = this.rec;
    this.rec = null;
    if (rec) {
      try { rec.stop(); } catch { /* already stopped */ }
    }
  }

  destroy(): void {
    this.turn++;
    const rec = this.rec;
    this.rec = null;
    if (rec) {
      try { rec.abort(); } catch { /* noop */ }
    }
  }
}

function mapWebError(code: string): SpeechEngineError {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
    case 'audio-capture':
      return 'no-permission';
    case 'no-speech':
      return 'no-speech';
    case 'aborted':
      return 'aborted';
    case 'network':
      return 'network';
    default:
      return 'unknown';
  }
}

// ── Native (Capacitor) implementation ────────────────────────────────
//
// `@capacitor-community/speech-recognition` (WP-6) is a real dependency now.
// It is still imported lazily — via a code-split dynamic import — so the web
// bundle never has to load it: `isCapacitorNative()` is false in a browser,
// so `NativeSpeechEngine` is never constructed there and the chunk is never
// fetched. The plugin's Android library manifest contributes the
// `RECORD_AUDIO` permission and the `RecognitionService` <queries> entry via
// Gradle manifest merging, so `npx cap sync android` is all that is needed.
// It is typed loosely here to avoid coupling to the plugin's exact d.ts.

interface NativePlugin {
  available(): Promise<{ available: boolean }>;
  checkPermissions?(): Promise<{ speechRecognition: string }>;
  requestPermissions?(): Promise<{ speechRecognition: string }>;
  requestPermission?(): Promise<void>;
  hasPermission?(): Promise<{ permission: boolean }>;
  start(opts: {
    language: string;
    maxResults?: number;
    partialResults?: boolean;
    popup?: boolean;
  }): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  removeAllListeners?(): Promise<void>;
  addListener(
    event: 'partialResults',
    cb: (data: { matches?: string[] }) => void,
  ): Promise<{ remove: () => void }> | { remove: () => void };
}

// The plugin object is a Capacitor proxy that answers *every* property —
// `then` included — so it looks like a Promise. Resolving a Promise with it
// (returning it from an async function, awaiting it) calls `proxy.then()` as
// a native method that doesn't exist, and that await never settles: every
// permission check / request / start hung, so the mic card's "Allow" did
// nothing. Always pass it around inside this box.
interface NativePluginBox { plugin: NativePlugin }

async function loadNativePlugin(): Promise<NativePluginBox | null> {
  try {
    const mod = await import('@capacitor-community/speech-recognition');
    const plugin = (mod as unknown as { SpeechRecognition?: NativePlugin }).SpeechRecognition;
    return plugin ? { plugin } : null;
  } catch {
    return null;
  }
}

class NativeSpeechEngine implements SpeechEngine {
  readonly kind = 'native' as const;
  private plugin: NativePlugin | null = null;
  private listener: { remove: () => void } | null = null;
  private turn = 0;

  private async getPlugin(): Promise<NativePluginBox | null> {
    if (!this.plugin) this.plugin = (await loadNativePlugin())?.plugin ?? null;
    return this.plugin ? { plugin: this.plugin } : null;
  }

  isSupported(): boolean {
    // Cheap synchronous guess; the async check happens in start().
    return true;
  }

  async checkPermission(): Promise<MicPermissionState> {
    const box = await this.getPlugin();
    if (!box) return 'unknown';
    const p = box.plugin;
    try {
      if (p.checkPermissions) {
        const r = await p.checkPermissions();
        if (r.speechRecognition === 'granted') return 'granted';
        if (r.speechRecognition === 'denied') return 'denied';
        return 'unknown';
      }
      if (p.hasPermission) {
        const h = await p.hasPermission();
        return h.permission ? 'granted' : 'unknown';
      }
    } catch {
      /* can't determine silently */
    }
    return 'unknown';
  }

  async requestPermission(): Promise<boolean> {
    const box = await this.getPlugin();
    if (!box) return false;
    const p = box.plugin;
    try {
      if (p.requestPermissions) {
        const r = await p.requestPermissions();
        return r.speechRecognition === 'granted';
      }
      if (p.requestPermission) {
        await p.requestPermission();
        const h = await p.hasPermission?.();
        return h ? h.permission : true;
      }
    } catch {
      return false;
    }
    return true;
  }

  async start(opts: SpeechListenOptions): Promise<void> {
    const box = await this.getPlugin();
    if (!box) { opts.onError('not-supported'); return; }
    const p = box.plugin;
    try {
      const avail = await p.available();
      if (!avail.available) { opts.onError('not-supported'); return; }
    } catch {
      opts.onError('not-supported');
      return;
    }

    this.stop();
    const myTurn = ++this.turn;

    try {
      const sub = await p.addListener('partialResults', (data) => {
        if (myTurn !== this.turn) return;
        const matches = (data.matches ?? []).filter(Boolean);
        if (matches.length) {
          // Android's partial results already carry the whole utterance so
          // far, so the turn snapshot is just the top match.
          opts.onResult({
            transcript: matches[0], alternatives: matches, isFinal: false,
            turnFinal: '', turnInterim: matches[0],
          });
        }
      });
      this.listener = sub as { remove: () => void };
    } catch {
      /* partial results are optional */
    }

    try {
      const res = await p.start({
        language: opts.lang,
        maxResults: 3,
        partialResults: true,
        popup: false,
      });
      if (myTurn !== this.turn) return;
      const matches = (res.matches ?? []).filter(Boolean);
      if (matches.length) {
        opts.onResult({
          transcript: matches[0], alternatives: matches, isFinal: true,
          turnFinal: matches[0], turnInterim: '',
        });
      }
      opts.onEnd?.();
    } catch (err) {
      if (myTurn !== this.turn) return;
      const msg = String((err as { message?: string })?.message ?? err).toLowerCase();
      if (msg.includes('permission')) opts.onError('no-permission');
      else if (msg.includes('no match') || msg.includes('speech')) opts.onError('no-speech');
      else if (msg.includes('network')) opts.onError('network');
      else opts.onError('unknown');
    } finally {
      this.clearListener();
    }
  }

  stop(): void {
    this.turn++;
    this.clearListener();
    this.plugin?.stop().catch(() => { /* not running */ });
  }

  destroy(): void {
    this.stop();
    this.plugin?.removeAllListeners?.().catch(() => { /* noop */ });
  }

  private clearListener(): void {
    try { this.listener?.remove(); } catch { /* noop */ }
    this.listener = null;
  }
}

class NullSpeechEngine implements SpeechEngine {
  readonly kind = 'none' as const;
  isSupported(): boolean { return false; }
  async checkPermission(): Promise<MicPermissionState> { return 'unknown'; }
  async requestPermission(): Promise<boolean> { return false; }
  async start(opts: SpeechListenOptions): Promise<void> { opts.onError('not-supported'); }
  stop(): void { /* noop */ }
  destroy(): void { /* noop */ }
}

// ── Engine selection ─────────────────────────────────────────────────

let cached: SpeechEngine | null = null;

/**
 * Drop the cached engine so the next `getSpeechEngine()` re-picks. Call
 * after the user finishes / clears a voice-profile calibration, since that
 * changes whether the on-device engine is eligible.
 */
export function resetSpeechEngine(): void {
  try { cached?.destroy(); } catch { /* noop */ }
  cached = null;
}

function isCapacitorNative(): boolean {
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  }).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function') return cap.isNativePlatform();
  return cap.getPlatform?.() === 'android' || cap.getPlatform?.() === 'ios';
}

function makeProfileEngine(): TemplateSpeechEngine {
  return new TemplateSpeechEngine({
    kind: 'profile',
    isReady: () => getActiveProfile() !== null && isProfileReady(),
    strategy: 'best',
    segmented: true,
    relMaxKey: 'voiceProfileRelMax',
    relMaxDefault: 0.97,
    // Matching the user's own voice — self-distances are small; this only
    // catches captures that look nothing like any recorded word.
    absMaxKey: 'voiceProfileAbsMax',
    absMaxDefault: 55,
    loadTemplates: async (vocabId) => {
      const profile = getActiveProfile();
      return profile ? loadProfileTemplates(profile, vocabId) : [];
    },
  });
}

function makeGeneralEngine(): TemplateSpeechEngine {
  return new TemplateSpeechEngine({
    kind: 'general',
    isReady: () => true,
    strategy: 'knn',
    relMaxKey: 'voiceGeneralRelMax',
    // knn: accept only when the runner-up's vote score is <= this fraction
    // of the winner's (i.e. the winner is clearly ahead).
    relMaxDefault: 0.75,
    // Matching a real voice against synthetic templates — legitimate
    // distances run higher than the personal profile's, so keep this loose.
    absMaxKey: 'voiceGeneralAbsMax',
    absMaxDefault: 60,
    loadTemplates: async (vocabId) => {
      // The bundled synthetic-TTS set only (lazy chunk). Self-learned
      // templates used to be merged in here; they are not any more. A
      // template recorded through a real microphone sits about twice as
      // close as any synthetic one — in a captured session the nearest
      // distance halved, from ~20-28 to ~10.5, the moment one was added —
      // so a single learned template out-competed all 120 bundled ones for
      // every later utterance and locked the engine onto its label.
      const mod = await import('./generalVoiceTemplates');
      return mod.default[baseVocabId(vocabId)] ?? [];
    },
  });
}

/** Singleton engine for the current platform. */
export function getSpeechEngine(): SpeechEngine {
  if (cached) return cached;
  const pref = loadSetting<VoiceEnginePref>('pref_voiceEngine', 'auto');
  const hasMic =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  // iOS Safari exposes only `webkitAudioContext`; `utteranceCapture` already
  // falls back to it, so the template engines are usable there too. Checking
  // the un-prefixed name alone silently forced Safari onto the flaky Web
  // Speech path instead of the personal profile.
  const hasAudioContext =
    typeof AudioContext !== 'undefined' ||
    typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !==
      'undefined';
  const canTemplate = hasMic && hasAudioContext;
  const canProfile = canTemplate && getActiveProfile() !== null && isProfileReady();
  const web = getSRConstructor() ? new WebSpeechEngine() : null;

  if (isCapacitorNative()) {
    cached = new NativeSpeechEngine();
  } else if (pref === 'profile') {
    // Asked for the personal profile but it isn't calibrated/enabled yet:
    // fall back to the offline General template engine, not the flaky
    // network Web Speech API.
    cached = canProfile
      ? makeProfileEngine()
      : canTemplate
        ? makeGeneralEngine()
        : (web ?? new NullSpeechEngine());
  } else if (pref === 'general') {
    cached = canTemplate ? makeGeneralEngine() : (web ?? new NullSpeechEngine());
  } else if (pref === 'web') {
    cached = web ?? (canTemplate ? makeGeneralEngine() : new NullSpeechEngine());
  } else {
    // 'auto': personal profile if the user has calibrated one, otherwise
    // the bundled general template set, otherwise the browser's Web Speech
    // API. Nothing here needs a network round trip.
    if (canProfile) cached = makeProfileEngine();
    else if (canTemplate) cached = makeGeneralEngine();
    else cached = web ?? new NullSpeechEngine();
  }
  return cached;
}

/** True when *some* recogniser is expected to work on this platform. */
export function isSpeechAvailable(): boolean {
  return getSpeechEngine().kind !== 'none';
}

/**
 * A fresh engine for *free-text dictation* — the feedback board's compose
 * box — rather than the game's fixed twelve-word note/fret vocabulary.
 *
 * Unlike `getSpeechEngine()` this never routes to the on-device template
 * engines (they only recognise note names). It uses the platform's general
 * dictation instead:
 *   • the Capacitor native plugin inside the Android app, where the Gboard
 *     voice-typing key's text never reaches the WebView's text field;
 *   • the browser's SpeechRecognition on the web.
 *
 * Returns a new instance every call — the caller owns its lifecycle and must
 * call `destroy()` when finished.
 */
export function createDictationEngine(): SpeechEngine {
  if (isCapacitorNative()) return new NativeSpeechEngine();
  if (getSRConstructor()) return new WebSpeechEngine();
  return new NullSpeechEngine();
}

/** Convenience re-export so callers pass one thing to `start()`. */
export function vocabularyFor(notation: SpeechNotation): string[] {
  return speechVocabulary(notation);
}
