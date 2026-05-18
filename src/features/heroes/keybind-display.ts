/**
 * Single source of truth for translating the raw `ability.keybind` string
 * (e.g. `"Left Click"`, `"e"`, `"Shift"`, `"Passive"`) into the short label
 * we render in chips, tooltips, and combo nodes (e.g. `"LMB"`, `"E"`,
 * `"SHIFT"`, `"Passive"`).
 *
 * Components must NOT inline their own variant of this -- earlier copies
 * drifted (one returned `"Passive"` cased, another upper-cased it). Always
 * use `formatKeybindLabel` so labels stay consistent across the app.
 */

const NAMED_KEYS = new Set(["q", "e", "f", "c", "r", "v", "x", "z"]);

export function formatKeybindLabel(rawKey: string | null | undefined): string {
  if (!rawKey) return "Passive";
  const k = rawKey.trim().toLowerCase();
  if (!k) return "Passive";
  if (k.includes("left click") || k === "lmb") return "LMB";
  if (k.includes("right click") || k === "rmb") return "RMB";
  if (k === "shift") return "SHIFT";
  if (k === "space" || k === "spacebar") return "SPACE";
  if (k === "ctrl" || k === "control") return "CTRL";
  if (k === "alt") return "ALT";
  if (k === "passive") return "Passive";
  if (k === "ultimate" || k === "ult") return "ULT";
  if (NAMED_KEYS.has(k)) return k.toUpperCase();
  return rawKey;
}

/**
 * Returns true when the formatted label is one of the mouse buttons.
 * Useful for components that want to swap in a mouse icon rather than the
 * short text chip.
 */
export function isMouseKeybind(label: string): boolean {
  return label === "LMB" || label === "RMB";
}
