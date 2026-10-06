// ── Template-matching speech engine (shared) ───────────────────────────
//
// One `SpeechEngine` implementation, two configurations:
//
//   • 'profile' — matches against the user's own calibration recordings
//                 (IndexedDB, see `voiceProfile.ts`). Accent-perfect.
//   • 'general' — matches against a small bundled set of synthetic-TTS
//                 reference templates for the twelve note names
//                 (`generalVoiceTemplates.json`). Accent-neutral, no model
//                 download — the "works before you calibrate" fallback.
//
// Both share the whole pipeline: capture one spoken word → MFCC → DTW
// against every template → emit the best label as a single final result.
// The caller (`useVoiceAnswer`) drives a fresh turn per question.

import type {
  SpeechEngine,
  SpeechListenOptions,
  SpeechEngineKind,
  MicPermissionState,
} from './speech';
import { captureUtterance } from './utteranceCapture';
import { computeMfcc, framesFromJson } from './mfcc';
import { knnVote, matchTemplates, type Template } from './dtw';
import { recognizeSegmented } from './segmentedRecognizer';
import { verror, vlog } from './debugLog';

// A match is only emitted when the best template is clearly closer than the
// runner-up; otherwise the turn ends with no result and the caller's
// keep-alive listens again. Tunable per engine from the console, e.g.
//   localStorage.voiceProfileRelMax = '0.985'
function relMax(key: string, fallback: number): number {
  try {
    const v = parseFloat(localStorage.getItem(key) ?? '');
    if (!Number.isNaN(v) && v > 0.5 && v <= 1) return v;
  } catch { /* ignore */ }
  return fallback;
}

// Absolute ceiling on the nearest-template distance. Even when the best
// match is clearly ahead of the runner-up (the `relMax` ratio gate), reject
// it when nothing is actually close — a cough or an unrelated word can be
// "clearly closest" and still be nothing like any note.
//
// OFF by default: real phone-mic distances run higher than the synthetic
// numbers this was tuned against, and a too-tight cap silently rejected every
// in-game answer. Opt in per engine once you have watched the
// "[voice] template match" debug lines (localStorage.debugVoiceVerbose = '1')
// and know a safe number:
//   localStorage.voiceProfileAbsMax = '40'   /  localStorage.voiceGeneralAbsMax = '45'
function absMax(key: string): number {
  try {
    const v = parseFloat(localStorage.getItem(key) ?? '');
    if (!Number.isNaN(v) && v > 0) return v;
  } catch { /* ignore */ }
  return Infinity;
}

function hasGetUserMedia(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export interface TemplateEngineConfig {
  kind: Extract<SpeechEngineKind, 'profile' | 'general'>;
  /** Load every template for a vocab set (e.g. "notes-alpha"). */
  loadTemplates: (vocabId: string) => Promise<{ label: string; frames: number[][] }[]>;
  /** Whether this engine can run at all right now (mic aside). */
  isReady: () => boolean;
  /** localStorage key for the confidence-ratio override. */
  relMaxKey: string;
  /** Default confidence ratio (best.distance <= second.distance * this). */
  relMaxDefault: number;
  /** localStorage key for the absolute nearest-distance ceiling. */
  absMaxKey: string;
  /** Reject a match whose nearest template distance exceeds this. */
  absMaxDefault: number;
  /**
   * 'best' — single closest template wins (good when there are few, clean
   * templates per label, i.e. the personal profile).
   * 'knn'  — distance-weighted vote over the nearest few templates (more
   * robust with many uneven templates, i.e. the synthetic general set).
   */
  strategy: 'best' | 'knn';
  /**
   * When set, the spoken answer is split into one or two words
   * (`segmentUtterance`) and matched in two stages: segment 0 against the
   * seven letter templates, an optional segment 1 against the "#"/"b"
   * accidental templates, then composed into a note name. Only the personal
   * profile ('best') uses this; the bundled 'general' set stays whole-word.
   */
  segmented?: boolean;
}

export class TemplateSpeechEngine implements SpeechEngine {
  readonly kind: TemplateEngineConfig['kind'];
  private cfg: TemplateEngineConfig;
  private turn = 0;
  private abort: AbortController | null = null;
  private cache: { vocabId: string; templates: Template[] } | null = null;

  constructor(cfg: TemplateEngineConfig) {
    this.cfg = cfg;
    this.kind = cfg.kind;
  }

  isSupported(): boolean {
    return hasGetUserMedia() && this.cfg.isReady();
  }

  async checkPermission(): Promise<MicPermissionState> {
    try {
      const status = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
      if (status?.state === 'granted') return 'granted';
      if (status?.state === 'denied') return 'denied';
    } catch { /* Permissions API can't answer for "microphone" here */ }
    return 'unknown';
  }

  async requestPermission(): Promise<boolean> {
    try {
      const status = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
      if (status?.state === 'granted') return true;
      if (status?.state === 'denied') return false;
    } catch { /* fall through to a real prompt */ }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  private async getTemplates(vocabId: string): Promise<Template[]> {
    if (this.cache?.vocabId === vocabId) return this.cache.templates;
    const rows = await this.cfg.loadTemplates(vocabId);
    const templates = rows.map((r) => ({ label: r.label, frames: framesFromJson(r.frames) }));
    // Only memoise a non-empty load. An empty result can be a transient
    // IndexedDB / lazy-chunk failure (`loadTemplates` swallows errors and
    // returns []); caching that would disable this cached engine for the rest
    // of the session. A set that is genuinely empty just gets re-fetched on
    // the next turn — same observable behaviour, no permanent stick.
    if (templates.length) this.cache = { vocabId, templates };
    else this.cache = null;
    return templates;
  }

  async start(opts: SpeechListenOptions): Promise<void> {
    if (!hasGetUserMedia()) { opts.onError('not-supported'); return; }
    const vocabId = opts.profileVocabId ?? 'notes-alpha';

    this.stop();
    const myTurn = ++this.turn;
    const abort = new AbortController();
    this.abort = abort;

    try {
    const templates = await this.getTemplates(vocabId);
    if (myTurn !== this.turn) return;
    if (!templates.length) { opts.onError('not-supported'); return; }

    // Open a fresh microphone per listen turn. A shared long-lived MicSession
    // was tried here for latency, but on mobile browsers a reused
    // AudioContext/getUserMedia stream sometimes stopped delivering audio
    // mid-question, so every subsequent answer went unheard.
    const captured = await captureUtterance({
      signal: abort.signal,
      // A segmented answer has a mid-word pause ("C" … "sharp"); give it more
      // room before the trailing-silence cutoff, and a longer hard cap.
      ...(this.cfg.segmented ? { trailingSilenceMs: 500, maxSpeechMs: 3500 } : {}),
    });
    if (myTurn !== this.turn) return;
    vlog('[voice] capture', {
      engine: this.kind, vocabId,
      got: !!captured, samples: captured?.pcm.length ?? 0,
      sampleRate: captured?.sampleRate ?? 0,
    });
    if (!captured) { opts.onEnd?.(); return; }

    if (this.cfg.segmented) {
      await this.runSegmented(captured, templates, myTurn, opts);
      return;
    }

    const { frames } = computeMfcc(captured.pcm, captured.sampleRate);
    if (!frames.length) { opts.onEnd?.(); return; }
    if (myTurn !== this.turn) return;

    let firstLabel: string | undefined;
    let secondLabel: string | undefined;
    let confident: boolean;
    // Matching runs on the main thread against the whole template set, so the
    // debug line carries its cost — see the pre-filter note in `dtw.ts`.
    const t0 = performance.now();

    if (this.cfg.strategy === 'knn') {
      const { ranked, nearest } = knnVote(frames, templates, 5);
      firstLabel = ranked[0]?.label;
      secondLabel = ranked[1]?.label;
      const ratioCap = relMax(this.cfg.relMaxKey, this.cfg.relMaxDefault);
      const absCap = absMax(this.cfg.absMaxKey);
      const nearOk = Number.isFinite(nearest) && nearest <= absCap;
      const ratioOk = !ranked[1] || ranked[1].score <= ranked[0].score * ratioCap;
      confident = !!firstLabel && nearOk && ratioOk;
      vlog('[voice] template match', {
        engine: this.kind, vocabId, strategy: 'knn', absCap,
        pool: templates.length,
        first: ranked[0] && { label: ranked[0].label, s: +ranked[0].score.toFixed(3), v: ranked[0].votes },
        second: ranked[1] && { label: ranked[1].label, s: +ranked[1].score.toFixed(3), v: ranked[1].votes },
        voteRatio: ranked[1] ? +(ranked[1].score / ranked[0].score).toFixed(3) : null,
        nearest: +nearest.toFixed(2), frames: frames.length,
        ms: +(performance.now() - t0).toFixed(1),
        confident,
        reject: confident ? null : !firstLabel ? 'no-match' : !nearOk ? 'abs-cap' : 'ratio-cap',
      });
    } else {
      const ranked = matchTemplates(frames, templates);
      const best = ranked[0];
      const second = ranked[1];
      firstLabel = best?.label;
      secondLabel = second?.label;
      const ratioCap = relMax(this.cfg.relMaxKey, this.cfg.relMaxDefault);
      const absCap = absMax(this.cfg.absMaxKey);
      const absOk = !!best && Number.isFinite(best.distance) && best.distance <= absCap;
      const ratioOk = !!best && (!second || best.distance <= second.distance * ratioCap);
      confident = absOk && ratioOk;
      vlog('[voice] template match', {
        engine: this.kind, vocabId, strategy: 'best', absCap,
        pool: templates.length,
        best: best && { label: best.label, d: +best.distance.toFixed(2) },
        second: second && { label: second.label, d: +second.distance.toFixed(2) },
        ratio: best && second ? +(best.distance / second.distance).toFixed(3) : null,
        frames: frames.length,
        ms: +(performance.now() - t0).toFixed(1),
        confident,
        reject: confident ? null : !best ? 'no-match' : !absOk ? 'abs-cap' : 'ratio-cap',
      });
    }

    if (myTurn !== this.turn) return;

    if (confident && firstLabel) {
      const alts = secondLabel ? [firstLabel, secondLabel] : [firstLabel];
      opts.onResult({ transcript: firstLabel, alternatives: alts, isFinal: true });
    }
    opts.onEnd?.();
    } catch (e) {
      // An unexpected throw somewhere in the async start flow — AudioContext
      // construction, the getUserMedia audio graph, an IndexedDB read, MFCC
      // extraction. `useVoiceAnswer` calls `start()` as `void`, so a reject
      // here would be an unhandled rejection that leaves voice stuck on
      // 'listening'. Surface it and still fire `onEnd` so the caller's
      // keep-alive / recovery path runs. A stale turn (a concurrent
      // stop()/start(), including a deliberate abort) is not an error.
      if (myTurn === this.turn) {
        verror('[voice] start failed', String(e));
        opts.onError('unknown');
        opts.onEnd?.();
      }
    }
  }

  /**
   * Two-stage segmented match for the personal profile — the decision logic
   * lives in `segmentedRecognizer.ts` so it can be replayed offline. Emits
   * nothing (so the caller listens again) when it returns no note.
   */
  private async runSegmented(
    captured: { pcm: Float32Array; sampleRate: number },
    templates: Template[],
    myTurn: number,
    opts: SpeechListenOptions,
  ): Promise<void> {
    const note = recognizeSegmented(captured, templates, {
      kind: this.kind,
      ratioCap: relMax(this.cfg.relMaxKey, this.cfg.relMaxDefault),
      absCap: absMax(this.cfg.absMaxKey),
    });
    if (myTurn !== this.turn) return;
    if (note) {
      opts.onResult({ transcript: note, alternatives: [note], isFinal: true });
    }
    opts.onEnd?.();
  }

  /** Drop the in-memory template cache (after re-calibration). */
  invalidate(): void {
    this.cache = null;
  }

  /**
   * Warm the template cache (IndexedDB read for the profile engine, lazy
   * chunk import for the general one) so the first question does not pay for
   * it. Best-effort — failures are swallowed.
   */
  async warmUp(vocabId = 'notes-alpha'): Promise<void> {
    try { await this.getTemplates(vocabId); } catch { /* best effort */ }
  }

  stop(): void {
    this.turn++;
    if (this.abort) {
      this.abort.abort();
      this.abort = null;
    }
  }

  destroy(): void {
    this.stop();
    this.cache = null;
  }
}
