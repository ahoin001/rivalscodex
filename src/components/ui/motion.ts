export type MotionDurationToken = "instant" | "fast" | "medium" | "slow";

const fallbackDurationMs: Record<MotionDurationToken, number> = {
  instant: 80,
  fast: 140,
  medium: 240,
  slow: 380,
};

const cssVarByDuration: Record<MotionDurationToken, string> = {
  instant: "--motion-instant",
  fast: "--motion-fast",
  medium: "--motion-medium",
  slow: "--motion-slow",
};

export function resolveMotionDurationMs(token: MotionDurationToken): number {
  if (typeof window === "undefined") {
    return fallbackDurationMs[token];
  }

  const cssVar = cssVarByDuration[token];
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();

  if (!raw) {
    return fallbackDurationMs[token];
  }

  if (raw.endsWith("ms")) {
    const parsed = Number.parseFloat(raw.slice(0, -2));
    return Number.isFinite(parsed) ? parsed : fallbackDurationMs[token];
  }

  if (raw.endsWith("s")) {
    const parsed = Number.parseFloat(raw.slice(0, -1));
    return Number.isFinite(parsed) ? parsed * 1000 : fallbackDurationMs[token];
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallbackDurationMs[token];
}
