import type { ReactNode } from "react";

type HudReadoutProps = {
  label: string;
  value: ReactNode;
  className?: string;
  showDivider?: boolean;
  tone?: "chrome" | "lab";
  /** Sentence-case wrapping for long Base/Enhanced copy instead of stat uppercase. */
  prose?: boolean;
};

export function HudReadout({
  label,
  value,
  className = "",
  showDivider = true,
  tone = "chrome",
  prose = false,
}: HudReadoutProps) {
  const isChrome = tone === "chrome";

  return (
    <div
      className={`flex justify-between gap-4 px-1 py-2 last:border-b-0 ${
        prose ? "items-start" : "items-end"
      } ${
        showDivider
          ? isChrome
            ? "border-b border-white/20"
            : "border-b border-rivals-light-300"
          : ""
      } ${className}`.trim()}
    >
      <span
        className={`shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.16em] sm:text-xs ${
          isChrome ? "text-white/70" : "text-rivals-ink-soft"
        }`}
      >
        {label}
      </span>
      <span
        className={
          prose
            ? `max-w-[min(100%,22rem)] text-right text-sm font-medium leading-snug tracking-normal ${
                isChrome ? "text-white/90" : "text-rivals-ink"
              }`
            : `text-right text-sm font-semibold uppercase tabular-nums tracking-wide ${
                isChrome ? "text-white/90" : "text-rivals-ink"
              }`
        }
      >
        {value}
      </span>
    </div>
  );
}
