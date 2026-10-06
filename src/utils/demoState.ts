// Per-domain "has the player seen the first-time guided demo" tracking.
// One localStorage blob keyed by domain, parallel in spirit to
// onboardingState.ts's single global flag but per-domain instead.

import { loadSetting, saveSetting } from './settings';

export type DemoDomain = 'practice' | 'intervals' | 'scales' | 'staff' | 'tabs' | 'daily';

const STORAGE_KEY = 'demoTours';

function readAll(): Partial<Record<DemoDomain, boolean>> {
  return loadSetting<Partial<Record<DemoDomain, boolean>>>(STORAGE_KEY, {});
}

export function hasSeenDemo(domain: DemoDomain): boolean {
  return !!readAll()[domain];
}

export function markDemoSeen(domain: DemoDomain): void {
  const all = readAll();
  if (all[domain]) return;
  saveSetting(STORAGE_KEY, { ...all, [domain]: true });
}

export function resetAllDemos(): void {
  saveSetting(STORAGE_KEY, {});
}
