/** Move an item from `fromIndex` to `toIndex` (inclusive). */
export function reorderByIndex<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** Remap a tracked index after reorderByIndex(from, to). */
export function remapTrackedIndex(
  tracked: number | null,
  fromIndex: number,
  toIndex: number,
): number | null {
  if (tracked === null) return null;
  if (tracked === fromIndex) return toIndex;
  if (fromIndex < tracked && toIndex >= tracked) return tracked - 1;
  if (fromIndex > tracked && toIndex <= tracked) return tracked + 1;
  return tracked;
}
