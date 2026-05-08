import {
  isPaletteId,
  PALETTE_STORAGE_KEY,
  type PaletteId,
} from "@/features/theme/palette-constants";

const listeners = new Set<() => void>();

export function subscribePaletteStore(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getPaletteSnapshot(): PaletteId {
  if (typeof window === "undefined") {
    return "default";
  }

  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return isPaletteId(stored) ? stored : "default";
  } catch {
    return "default";
  }
}

export function emitPaletteStoreChange() {
  listeners.forEach((listener) => listener());
}

export function persistAndApplyPalette(paletteId: PaletteId) {
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);
  } catch {
    /* ignore */
  }
  emitPaletteStoreChange();
}
