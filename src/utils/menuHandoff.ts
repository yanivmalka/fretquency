// The hamburger menu's exit: when its list goes away (a page opened from it,
// a search pick, or plain close), the dim it laid over the screen fades out
// instead of cutting to bright. Every screen is its own return in App, so the
// list can't animate itself out — it signals this store as it unmounts and
// <MenuHandoff> (mounted once, outside <App>) draws the fading dim.
//
// A tiny external store so the signal crosses that boundary without a
// context; read with useSyncExternalStore.

let active = false;
let id = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

/** The list just unmounted: fade its dim out over whatever replaced it. */
export function startMenuHandoff(): void {
  id += 1;
  active = true;
  emit();
}

/** The list is (back) on screen, or the fade finished: draw nothing. */
export function endMenuHandoff(): void {
  if (!active) return;
  active = false;
  emit();
}

/** 0 when idle, else a fresh number per handoff (a key that restarts the fade). */
export function getMenuHandoff(): number {
  return active ? id : 0;
}

export function subscribeMenuHandoff(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
