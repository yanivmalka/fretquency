// Background beats — a quiet kick + hi-hat loop under a Practice round, to
// keep a steady pace. Off by default (Settings → Background beats).
//
// The loop is synthesized once into an AudioBuffer rather than shipped as an
// audio file: two bars of 4/4 at 90 BPM, a kick on beats 1 and 3, a softer
// kick on the "and" of 3, and a closed hi-hat on every eighth. The noise for
// the hi-hat comes from a fixed-seed generator so the loop sounds the same on
// every load.
//
// It plays on the same AudioContext as the drill notes (audio.ts) but into its
// own gain straight to the destination, NOT through the note makeup gain — the
// volume ladder boosts quiet samples, and the bed must stay under the question
// note at every step. Whether it should be playing at all (the setting, the
// feedback mode, the answer mode, running vs paused) is decided by
// useBackgroundBeat; this module only starts and stops it.
import { getAudioContext } from './audio';

const BPM = 90;
const BARS = 2;
const BEATS_PER_BAR = 4;
const BED_GAIN = 0.14;
const FADE_S = 0.08;

let _buffer: AudioBuffer | null = null;
let _source: AudioBufferSourceNode | null = null;
let _gain: GainNode | null = null;

function buildLoop(ctx: AudioContext): AudioBuffer {
  const rate = ctx.sampleRate;
  const beatS = 60 / BPM;
  const length = Math.round(beatS * BEATS_PER_BAR * BARS * rate);
  const buf = ctx.createBuffer(1, length, rate);
  const out = buf.getChannelData(0);

  // A kick: a sine sweeping from ~120Hz down to ~45Hz under a fast decay.
  const kick = (atS: number, level: number) => {
    const start = Math.round(atS * rate);
    const dur = Math.round(0.32 * rate);
    let phase = 0;
    for (let i = 0; i < dur && start + i < length; i++) {
      const t = i / rate;
      const freq = 45 + 75 * Math.exp(-t * 28);
      phase += (2 * Math.PI * freq) / rate;
      out[start + i] += Math.sin(phase) * Math.exp(-t * 11) * level;
    }
  };

  // A closed hi-hat: high-passed noise with a very short decay.
  let seed = 0x2f6b1d;
  const noise = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x80000000 - 1;
  };
  const hat = (atS: number, level: number) => {
    const start = Math.round(atS * rate);
    const dur = Math.round(0.05 * rate);
    let prevIn = 0;
    let prevOut = 0;
    for (let i = 0; i < dur && start + i < length; i++) {
      const x = noise();
      const y = 0.86 * (prevOut + x - prevIn); // one-pole high-pass
      prevIn = x;
      prevOut = y;
      out[start + i] += y * Math.exp(-(i / rate) * 70) * level;
    }
  };

  for (let bar = 0; bar < BARS; bar++) {
    const barS = bar * BEATS_PER_BAR * beatS;
    kick(barS, 0.9);
    kick(barS + 2 * beatS, 0.8);
    kick(barS + 2.5 * beatS, 0.45);
    for (let e = 0; e < BEATS_PER_BAR * 2; e++) {
      hat(barS + e * (beatS / 2), e % 2 === 0 ? 0.32 : 0.2);
    }
  }
  // Overlapping hits can sum past 1; normalise so BED_GAIN is the true peak.
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < length; i++) out[i] /= peak;
  return buf;
}

/** Start the loop (no-op if it is already playing). Fades in. */
export function startBackgroundBeat(): void {
  if (_source) return;
  let ctx: AudioContext;
  try { ctx = getAudioContext(); } catch { return; }
  if (ctx.state === 'suspended') ctx.resume();
  if (!_buffer || _buffer.sampleRate !== ctx.sampleRate) _buffer = buildLoop(ctx);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(BED_GAIN, ctx.currentTime + FADE_S);
  gain.connect(ctx.destination);
  const src = ctx.createBufferSource();
  src.buffer = _buffer;
  src.loop = true;
  src.connect(gain);
  src.start();
  _source = src;
  _gain = gain;
}

/** Stop the loop with a short fade (no-op if it isn't playing). */
export function stopBackgroundBeat(): void {
  const src = _source;
  const gain = _gain;
  _source = null;
  _gain = null;
  if (!src || !gain) return;
  const ctx = gain.context;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + FADE_S);
  try { src.stop(now + FADE_S); } catch { /* already stopped */ }
  src.onended = () => { src.disconnect(); gain.disconnect(); };
}
