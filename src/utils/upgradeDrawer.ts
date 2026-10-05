// A tiny module-level channel so a locked <ProGate> anywhere in the tree can
// open the `upgrade` drawer section (design .kiro/specs/free-pro-tiering §2.5).
// App.tsx owns the drawer state and registers the handler on mount; ProGate
// just calls `openUpgrade()`. Mirrors the `setSyncUser` singleton in
// utils/sync.ts rather than threading a callback prop through every gate.
//
// `openUpgrade` optionally names the `Feature` that was tapped, so the upgrade
// page can open on the tier that actually gates it (a Premium-only tile opens
// on the Premium card, not Pro) and explain what the feature does — see
// UpgradeCard's `FEATURE_PITCH`.

import type { Feature } from './features';

type Handler = (feature?: Feature) => void;

let handler: Handler | null = null;

/** App.tsx registers a handler that sets `drawerSection = 'upgrade'`; passes
 *  `null` on unmount. */
export function registerUpgradeHandler(h: Handler | null): void {
  handler = h;
}

/** Open the upgrade drawer section, optionally naming the feature that was
 *  tapped. No-op if nothing is registered yet. */
export function openUpgrade(feature?: Feature): void {
  handler?.(feature);
}
