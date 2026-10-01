// Whether the boot splash (index.html, driven by src/main.tsx) has gone.
//
// A tiny external store so a mounted component can hold back work that would
// compete with the splash — the native AdMob banner initialises the Google
// Mobile Ads SDK and its consent flow, heavy native work that made the splash's
// progress bar and intro scale stutter in the APK.

let done = false;
const listeners = new Set<() => void>();

/** Called once by src/main.tsx when the splash has been dismissed. */
export function markBootDone(): void {
  if (done) return;
  done = true;
  listeners.forEach((fn) => fn());
}

export function isBootDone(): boolean {
  return done;
}

export function subscribeBootDone(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
