// ── ScaleItem identity ───────────────────────────────────────────────────
//
// scales-learning-spec.md §3 / §4.3. The atomic thing the learner can be
// weak on is a (scale type, neck position) pair — "knowing the minor
// pentatonic shape, box 1" — regardless of which root it's currently drilled
// from (the root is a per-question property, not part of the item, mirroring
// how intervalItem.ts leaves direction out of the interval item).
//
// Mirrors intervalItem.ts exactly. Scale SRS lives in its OWN `SrsMap`
// (`InstrumentLearningState.scaleSrs`), never mixed into the note or interval
// schedules.

export const SCALE_ID_PREFIX = 'scale:';

/** The stable id for a (scale type, position) pair. `"scale:<type>:<position>"`.
 *  `positionIndex` 0 is reserved for the "connect the boxes" exercise's
 *  synthetic box-1-into-box-2 section (`connectBoxesPosition` in
 *  `scales.ts`) — not an authored box, but still a valid item id. */
export function scaleItemId(scaleTypeId: string, positionIndex: number): string {
  return `${SCALE_ID_PREFIX}${scaleTypeId}:${positionIndex}`;
}

export function isScaleItemId(id: string): boolean {
  return id.startsWith(SCALE_ID_PREFIX);
}

/** Parse a `"scale:<type>:<position>"` id back to its parts, or `null` if it
 *  is not a well-formed scale item id. `positionIndex` 0 (the "connect the
 *  boxes" section, see `scaleItemId`'s header) is accepted; negative values
 *  are not. */
export function parseScaleItemId(id: string): { scaleTypeId: string; positionIndex: number } | null {
  if (!isScaleItemId(id)) return null;
  const rest = id.slice(SCALE_ID_PREFIX.length);
  const sep = rest.lastIndexOf(':');
  if (sep < 0) return null;
  const scaleTypeId = rest.slice(0, sep);
  const positionPart = rest.slice(sep + 1);
  // `Number('')` is `0`, not `NaN` — reject the empty string explicitly so
  // "scale:<type>:" isn't mistaken for the reserved positionIndex 0.
  if (!positionPart) return null;
  const positionIndex = Number(positionPart);
  if (!scaleTypeId || !Number.isInteger(positionIndex) || positionIndex < 0) return null;
  return { scaleTypeId, positionIndex };
}
