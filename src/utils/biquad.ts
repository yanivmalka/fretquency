// ── biquad — RBJ-cookbook filters over plain sample arrays (pure) ────────
// The same 2nd-order low/high-pass Web Audio's `BiquadFilterNode` runs
// (Q = 1/√2), for code that filters samples itself: the metronome's click
// and the pluck-onset detector.

export interface Biquad {
  b0: number; b1: number; b2: number; a1: number; a2: number;
}

export function biquad(kind: 'lowpass' | 'highpass', freqHz: number, sampleRate: number): Biquad {
  const w0 = (2 * Math.PI * Math.min(freqHz, sampleRate * 0.49)) / sampleRate;
  const alpha = Math.sin(w0) / Math.SQRT2;
  const cos = Math.cos(w0);
  const a0 = 1 + alpha;
  const k = kind === 'lowpass' ? (1 - cos) / 2 : (1 + cos) / 2;
  const b1 = kind === 'lowpass' ? 1 - cos : -(1 + cos);
  return { b0: k / a0, b1: b1 / a0, b2: k / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

/** Run `samples[from..]` through `filter` `passes` times; returns a new array
 *  of the filtered tail. */
export function applyBiquad(
  samples: ArrayLike<number>, filter: Biquad, passes = 1, from = 0,
): Float32Array {
  const out = new Float32Array(samples.length - from);
  for (let i = 0; i < out.length; i++) out[i] = samples[from + i];
  const { b0, b1, b2, a1, a2 } = filter;
  for (let p = 0; p < passes; p++) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < out.length; i++) {
      const x = out[i];
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      out[i] = y;
    }
  }
  return out;
}
