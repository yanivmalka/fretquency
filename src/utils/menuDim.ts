// Whether the hamburger menu's list is on screen, for <MenuDim> — the menu's
// dim layer, mounted once outside <App> and never unmounted. Every screen is
// its own return in App, so the list mounts and unmounts with whatever screen
// it sits over; the dim can't live inside it without being torn down and
// re-created on every open, close and page handoff. Creating a fresh
// full-screen translucent layer at that moment (and animating its
// background-color, which repaints the whole screen every frame) is what
// flashed in the Android WebView: the seasonal backdrop popping in full
// colour on open, and the dimmed strip flashing black on close. A layer that
// already exists and only changes its opacity stays on the compositor.
//
// A tiny external store so the signal crosses that boundary without a
// context; read with useSyncExternalStore.

let open = false;
const listeners = new Set<() => void>();

/** The list mounted (true) or unmounted (false). */
export function setMenuDim(on: boolean): void {
  if (open === on) return;
  open = on;
  listeners.forEach((fn) => fn());
}

export function getMenuDim(): boolean {
  return open;
}

export function subscribeMenuDim(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
