// The three-way feedback preference, modelled on a phone's ringer switch:
//  - 'sound'   — note playback, chimes and UI click sounds; no vibration.
//  - 'vibrate' — no sound at all; a haptic pulse on every button press and on
//                right / wrong answers instead.
//  - 'silent'  — no sound and no per-button buzz, but a haptic pulse still
//                fires on right / wrong answers (and achievements). On-screen
//                celebrations always run.
export type FeedbackMode = 'sound' | 'vibrate' | 'silent';

// ── The unified loudness ladder ──────────────────────────────────────
// The Settings screen and the Quick Access strip present "how the drill
// answers back" as ONE control with seven ascending stops rather than a
// mode picker plus a separate volume bar:
//
//   0  silent   1  vibrate   2..6  sound at loudness level 1..5
//
// It still writes the two long-standing prefs underneath — `pref_feedbackMode`
// ('silent' | 'vibrate' | 'sound') and, for the five sound stops, the makeup
// gain `pref_noteVolume` (one of NOTE_VOLUME_LEVELS). Nothing downstream
// (audio.ts, useFeedbackModeEffect, settingsSync) changed; only the UI folds
// the two into a single slider.
import { NOTE_VOLUME_LEVELS, noteVolumeLevelIndex, NOTE_VOLUME_DEFAULT } from './audio';

export const SOUND_LEVEL_COUNT = 2 + NOTE_VOLUME_LEVELS.length; // silent + vibrate + 5

/** Ladder stop (0..SOUND_LEVEL_COUNT-1) for a given mode + stored gain. */
export function soundLevelFromPrefs(mode: FeedbackMode, noteVolume: number): number {
  if (mode === 'silent') return 0;
  if (mode === 'vibrate') return 1;
  return 2 + noteVolumeLevelIndex(noteVolume);
}

/** The two prefs a ladder stop maps to. `noteVolume` is omitted for the
 *  silent / vibrate stops, which leave the stored gain untouched. */
export function soundLevelToPrefs(level: number): { feedbackMode: FeedbackMode; noteVolume?: number } {
  const n = Math.round(level);
  if (n <= 0) return { feedbackMode: 'silent' };
  if (n === 1) return { feedbackMode: 'vibrate' };
  const idx = Math.min(NOTE_VOLUME_LEVELS.length - 1, n - 2);
  return { feedbackMode: 'sound', noteVolume: NOTE_VOLUME_LEVELS[idx] ?? NOTE_VOLUME_DEFAULT };
}

/** Immediate, ungated confirmation for picking a ladder stop directly on the
 *  Sound & vibration control. `vibrate()`/`playClickSound()` are gated by the
 *  mode already in effect, which on this control is always the mode BEFORE
 *  this tap — that gate would silently skip confirming the very tap that
 *  turns e.g. Vibrate on, since haptics don't apply their new setting until
 *  the mode change round-trips through React state. */
export function previewSoundLevel(level: number) {
  const { feedbackMode } = soundLevelToPrefs(level);
  if (feedbackMode === 'vibrate') {
    try { navigator.vibrate?.(10); } catch { /* not supported */ }
  } else if (feedbackMode === 'sound') {
    playClickSound();
  }
}

/** Human label for a ladder stop: "Silent" / "Vibrate" / "Sound N". */
export function soundLevelLabel(level: number, t: (s: string) => string): string {
  const n = Math.round(level);
  if (n <= 0) return t('Silent');
  if (n === 1) return t('Vibrate');
  return `${t('Sound')} ${n - 1}`;
}

// How much haptic feedback fires, set by `useFeedbackModeEffect` from the mode:
//  - 'off'    — nothing ('sound' mode).
//  - 'events' — answer / achievement pulses only ('silent' mode).
//  - 'all'    — those plus a pulse on every button press ('vibrate' mode).
// Gating it here in the one `vibrate()` chokepoint covers every `haptic.*`
// call site at once; `haptic.tap` (button presses) passes level 'all' so it
// stays silent in 'events'.
export type HapticLevel = 'off' | 'events' | 'all';
let _hapticLevel: HapticLevel = 'off';
export function setHapticLevel(v: HapticLevel) { _hapticLevel = v; }

// Whether the small UI sounds (click / toggle / countdown stick) play. On for
// 'sound' mode only; 'vibrate' and 'silent' both mute them.
let _uiSoundsOn = true;
export function setUiSoundsEnabled(v: boolean) { _uiSoundsOn = v; }

// Haptic feedback via navigator.vibrate. `need` is the minimum level this
// pulse requires: 'events' pulses fire in both 'events' and 'all'; 'all'
// pulses (button taps) fire only in 'all'.
function vibrate(pattern: number | number[], need: 'events' | 'all' = 'events') {
  if (_hapticLevel === 'off') return;
  if (need === 'all' && _hapticLevel !== 'all') return;
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
}

export const haptic = {
  correct:     () => vibrate(30),
  wrong:       () => vibrate([30, 40, 30]),
  milestone:   () => vibrate([60, 40, 60]),
  stageChange: () => vibrate(60),
  tap:         () => vibrate(10, 'all'),
};

// Mutes the drill's *content* audio — the correct-answer chime, the badge
// fanfare and the ascending tone inside the tier-3 celebration. Set whenever
// the feedback mode is not 'sound' (i.e. 'vibrate' or 'silent'). On-screen
// celebrations keep running; audio.ts carries its own copy of this flag for
// the question note, and UI sounds are gated separately by `_uiSoundsOn`.
let _silent = false;
export function setSilent(v: boolean) { _silent = v; }

// UI click sound — tiny oscillator burst (~20ms), no audio file needed
let _audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    return _audioCtx;
  } catch { return null; }
}

/**
 * The persistent AudioContext this module already uses for click/toggle/chime
 * sounds — proven to produce audible sound on this device (unlike a
 * freshly-constructed context, which some browsers keep silent). Reuse it for
 * any other one-off playback, e.g. "play back my calibration recording",
 * instead of constructing a new context per use.
 */
export function getFeedbackAudioCtx(): AudioContext | null {
  return getCtx();
}

export function playClickSound() {
  if (!_uiSoundsOn) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.025);
}

// Countdown "stick click" — real recorded drumstick tap sample, decoded once
// and cached (bundled locally at public/sounds/stick-click.mp3, no network
// fetch after the first load; also precached by the PWA service worker).
let _stickClickBuffer: AudioBuffer | null = null;
let _stickClickLoading: Promise<AudioBuffer | null> | null = null;

async function loadStickClickBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (_stickClickBuffer) return _stickClickBuffer;
  if (!_stickClickLoading) {
    _stickClickLoading = (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}sounds/stick-click.mp3`);
        const arrayBuffer = await res.arrayBuffer();
        _stickClickBuffer = await ctx.decodeAudioData(arrayBuffer);
        return _stickClickBuffer;
      } catch {
        return null;
      }
    })();
  }
  return _stickClickLoading;
}

export function playStickClick() {
  if (!_uiSoundsOn) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  loadStickClickBuffer(ctx).then((buffer) => {
    if (!buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    // A quiet, clear pulse — like drumsticks tapped together to count a band
    // in — not a sound that fills the room.
    gain.gain.value = 0.4;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  });
}

export function playToggleOnSound() {
  if (!_uiSoundsOn) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 1600;
  gain.gain.setValueAtTime(0.07, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
}

export function playToggleOffSound() {
  if (!_uiSoundsOn) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.07, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
}

// Satisfying chime for correct answer (major triad: C5 + E5 + G5)
const CHIME_STAGGER = 0.03; // gap between the three notes
const CHIME_TAIL = 0.26;    // per-note ring-out — kept short so it doesn't bleed into the next question note
const CHIME_GAP = 0.1;      // extra silence held after the tail before the next question note
let _chimeEndTime = 0;      // wall-clock ms when the chime has fully finished (incl. CHIME_GAP)

export function playCorrectChime() {
  if (_silent) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime + i * CHIME_STAGGER;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.02); // softer peak so it doesn't compete with the question note
    gain.gain.exponentialRampToValueAtTime(0.001, t + CHIME_TAIL);

    osc.start(t);
    osc.stop(t + CHIME_TAIL);
  });
  _chimeEndTime = Date.now() + Math.ceil((2 * CHIME_STAGGER + CHIME_TAIL + CHIME_GAP) * 1000);
}

/** Milliseconds until the correct-answer chime has fully finished (0 if done). */
export function correctChimeRemainingMs(): number {
  return Math.max(0, _chimeEndTime - Date.now());
}

// Escalating streak tone, layered over the chime from a streak of 3 on: one
// short triangle note whose pitch climbs with the streak (the steps line up
// with useScoring's multiplier tiers at 3/5/7/10/15/20), so a run of right
// answers is heard climbing, not just seen in the HUD.
const STREAK_TONE_STEPS = [
  { min: 20, freq: 1567.98, gain: 0.11, dur: 0.13 }, // G6
  { min: 15, freq: 1318.51, gain: 0.10, dur: 0.12 }, // E6
  { min: 10, freq: 1174.66, gain: 0.09, dur: 0.12 }, // D6
  { min: 7,  freq: 987.77,  gain: 0.08, dur: 0.11 }, // B5
  { min: 5,  freq: 783.99,  gain: 0.07, dur: 0.10 }, // G5
  { min: 3,  freq: 659.25,  gain: 0.06, dur: 0.10 }, // E5
] as const;

/** Play the streak tone for a streak just reached by a correct answer. Silent
 *  below 3. Call right after `playCorrectChime()`; it is shorter than the
 *  chime's tail, so `correctChimeRemainingMs()` already covers it. */
export function playStreakTone(streak: number) {
  if (_silent) return;
  const step = STREAK_TONE_STEPS.find((s) => streak >= s.min);
  if (!step) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = step.freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t = ctx.currentTime + 0.04; // 40ms after the chime's onset, so the attacks don't collide
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(step.gain, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + step.dur);
  osc.start(t);
  osc.stop(t + step.dur);
}

// Badge fanfare — a bright rising triad + octave, capped with a fast sparkle.
// Used by the achievement toast and the end-of-round reveal. Reuses the shared
// AudioContext so it stays audible on mobile like the other feedback sounds.
export function playBadgeFanfare() {
  if (_silent) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;

  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = now + i * 0.12;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);
  });

  [1568, 2093, 1760].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = now + 0.5 + i * 0.06;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// Celebration overlay element
let _celebrationContainer: HTMLElement | null = null;
function getContainer(): HTMLElement {
  if (!_celebrationContainer) {
    _celebrationContainer = document.createElement('div');
    _celebrationContainer.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 999;
      overflow: visible;
    `;
    document.body.appendChild(_celebrationContainer);
  }
  return _celebrationContainer;
}

// Floating text animation
let _floatTextId = 0;
export function showFloatingText(text: string, color: string, duration = 800, x?: number, y?: number) {
  const el = document.createElement('div');
  const id = `float-${++_floatTextId}`;
  el.id = id;
  el.textContent = text;
  el.style.cssText = `
    position: absolute;
    color: ${color};
    font-weight: bold;
    font-size: 1.2rem;
    animation: float-up ${duration}ms ease-out forwards;
    left: ${x ?? window.innerWidth / 2}px;
    top: ${y ?? window.innerHeight / 2}px;
    transform: translateX(-50%);
    pointer-events: none;
  `;
  getContainer().appendChild(el);
  setTimeout(() => { const e = document.getElementById(id); e?.remove(); }, duration);
}

// Tier 1 celebration: cyan ring from score corner + floating text
export function celebrateTier1(targetElement: HTMLElement, text = '+15', color = '#0ff') {
  const rect = targetElement.getBoundingClientRect();
  const ring = document.createElement('div');
  const id = `ring-${Date.now()}`;
  ring.id = id;
  ring.style.cssText = `
    position: absolute;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top + rect.height / 2}px;
    width: 40px;
    height: 40px;
    border: 2px solid ${color};
    border-radius: 50%;
    animation: radial-pulse-cyan 400ms ease-out forwards;
    pointer-events: none;
  `;
  getContainer().appendChild(ring);
  setTimeout(() => { const e = document.getElementById(id); e?.remove(); }, 400);
  
  // Show floating text just above the score target
  showFloatingText(text, color, 800, rect.left + rect.width / 2, rect.top);
}

// Tier 2 celebration: three gold rings and a milestone banner from center
export function celebrateTier2(text = 'MILESTONE!', color = '#ffd700') {
  const container = getContainer();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const timestamp = Date.now();

  [1, 2, 3].forEach(i => {
    const ring = document.createElement('div');
    const id = `milestone-ring-${timestamp}-${i}`;
    ring.id = id;
    ring.className = 'celebrate-ring-gold';
    ring.style.left = `${centerX}px`;
    ring.style.top = `${centerY}px`;
    ring.style.borderColor = color;
    ring.style.animationDelay = `${(i - 1) * 100}ms`;
    container.appendChild(ring);
    setTimeout(() => document.getElementById(id)?.remove(), 800);
  });

  const banner = document.createElement('div');
  const bannerId = `milestone-banner-${timestamp}`;
  banner.id = bannerId;
  banner.className = 'milestone-banner';
  banner.textContent = text;
  container.appendChild(banner);
  setTimeout(() => document.getElementById(bannerId)?.remove(), 1500);
}

// Tier 3 celebration: game pause + overlay card (for best streaks)
export function celebrateTier3(score: number, streak: number, onComplete?: () => void) {
  // Pause game (caller should handle this)
  
  const card = document.createElement('div');
  card.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
  `;
  
  card.innerHTML = `
    <div style="
      background: #111122;
      border: 2px solid #ffd700;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 340px;
      width: 90%;
      text-align: center;
      box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
    ">
      <h2 style="font-size: 1.8rem; color: #ffd700; margin-bottom: 16px;">NEW BEST!</h2>
      <div style="display: flex; gap: 24px; justify-content: center; margin: 24px 0;">
        <div>
          <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 1px;">Score</div>
          <div style="font-size: 2.5rem; font-weight: bold; font-family: Georgia, serif; color: #fff;">${score}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 1px;">Streak</div>
          <div style="font-size: 2.5rem; font-weight: bold; color: #0ff;">${streak}</div>
        </div>
      </div>
      <button id="tier3-close" style="
        background: #0aa;
        border: none;
        border-radius: 12px;
        color: #fff;
        padding: 12px 24px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.15s;
      ">CONTINUE</button>
    </div>
  `;
  
  document.body.appendChild(card);
  
  // Play ascending tone sequence (drill content — muted in Silent mode; the
  // card, haptic and close handler below still run).
  if (!_silent) {
    const ctx = getCtx();
    if (ctx && ctx.state !== 'suspended') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    }
  }
  
  // Haptic: long pulse
  vibrate([100, 50, 100]);
  
  // Close handler
  setTimeout(() => {
    const btn = card.querySelector('#tier3-close');
    btn?.addEventListener('click', () => {
      card.remove();
      onComplete?.();
    });
  }, 100);
}
