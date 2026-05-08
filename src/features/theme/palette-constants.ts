export const PALETTE_STORAGE_KEY = "rivalscodex.palette.v1";

export const PALETTE_OPTIONS = [
  { id: "default", label: "Gold Ops" },
  { id: "crimson", label: "Crimson" },
  { id: "aurora", label: "Aurora" },
  { id: "dawn", label: "Dawn" },
] as const;

export type PaletteId = (typeof PALETTE_OPTIONS)[number]["id"];

export const PALETTE_IDS: PaletteId[] = PALETTE_OPTIONS.map((entry) => entry.id);

export function isPaletteId(value: string | null | undefined): value is PaletteId {
  return value !== undefined && value !== null && (PALETTE_IDS as readonly string[]).includes(value);
}

export function applyPaletteToDocument(paletteId: PaletteId) {
  if (typeof document === "undefined") {
    return;
  }

  if (paletteId === "default") {
    document.documentElement.removeAttribute("data-palette");
  } else {
    document.documentElement.setAttribute("data-palette", paletteId);
  }
}
