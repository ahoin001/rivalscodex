/**
 * Canonical mapping for Marvel Rivals shared keybind icons hosted on marvelrivals.com.
 *
 * Source URLs look like `https://www.marvelrivals.com/pc/gw/<build>/img/<prefix>_<hash>.png`.
 * The hash segment varies across patches, but the prefix is stable (e.g. `sbzj` = LMB,
 * `sbyj` = RMB). When we encounter one of these, we redirect the download to a stable
 * canonical filename under `rivals-assets/icons/` so we never duplicate the same icon.
 */

export type CanonicalKeybindIcon = {
  /** Stable filename written into `rivals-assets/icons/`. */
  filename: string;
  /** Human keybind label used on hero cards / ability rows. */
  keybind: string;
};

/**
 * Filename-prefix → canonical icon mapping.
 * Keys are matched case-insensitively against `path.basename(url).split("_")[0]`.
 */
export const MARVEL_KEYBIND_ICONS: Record<string, CanonicalKeybindIcon> = {
  sbzj: { filename: "LMB-icon.png", keybind: "LMB" },
  sbyj: { filename: "RMB-icon.png", keybind: "RMB" },
};

const KEYBIND_TEXT_NORMALIZATIONS: Record<string, string> = {
  Q: "Q",
  E: "E",
  F: "F",
  R: "R",
  V: "V",
  C: "C",
  SHIFT: "SHIFT",
  CTRL: "CTRL",
  ALT: "ALT",
  SPACE: "SPACE",
  PASSIVE: "PASSIVE",
  ULT: "ULT",
  ULTIMATE: "ULTIMATE",
  LMB: "LMB",
  RMB: "RMB",
};

export function normalizeKeybindText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  return KEYBIND_TEXT_NORMALIZATIONS[upper] ?? trimmed;
}

/** Pull the prefix segment of a marvelrivals icon URL (e.g. `sbzj` from `sbzj_5901af42.png`). */
export function parseKeybindIconPrefix(url: string): string | null {
  try {
    const u = new URL(url);
    const base = u.pathname.split("/").pop() ?? "";
    const dot = base.lastIndexOf(".");
    const noExt = dot >= 0 ? base.slice(0, dot) : base;
    const underscore = noExt.indexOf("_");
    const prefix = underscore >= 0 ? noExt.slice(0, underscore) : noExt;
    return prefix.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function resolveCanonicalKeybindIcon(
  url: string,
): CanonicalKeybindIcon | null {
  const prefix = parseKeybindIconPrefix(url);
  if (!prefix) return null;
  return MARVEL_KEYBIND_ICONS[prefix] ?? null;
}

/** Public web path that the UI uses to load the canonical icon. */
export const KEYBIND_ICONS_WEB_BASE = "/rivals-assets/icons";

export function canonicalKeybindIconWebPath(icon: CanonicalKeybindIcon): string {
  return `${KEYBIND_ICONS_WEB_BASE}/${icon.filename}`;
}
