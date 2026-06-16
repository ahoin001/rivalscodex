"use client";

import { useState, type ReactNode } from "react";

type RivalsDisclosureProps = {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  tone?: "default" | "quiet";
};

/** Animated expand/collapse using CSS grid rows + motion tokens. */
export function RivalsDisclosure({
  title,
  description,
  badge,
  children,
  defaultOpen = false,
  className = "",
  tone = "default",
}: RivalsDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  const shellClass =
    tone === "quiet"
      ? "editor-disclosure overflow-hidden rounded-lg border border-rivals-light-300/80 bg-white"
      : "editor-disclosure overflow-hidden rounded-lg border border-rivals-light-300 bg-rivals-light-50";

  return (
    <div className={`${shellClass} ${className}`.trim()}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-rivals-light-100/60"
      >
        <span className="min-w-0 space-y-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-rivals-ink">
              {title}
            </span>
            {badge ? (
              <span className="rounded-full border border-rivals-light-300 bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-rivals-ink-muted">
                {badge}
              </span>
            ) : null}
          </span>
          {description ? (
            <span className="block text-[11px] leading-relaxed text-rivals-ink-muted">
              {description}
            </span>
          ) : null}
        </span>
        <span
          className={`mt-0.5 shrink-0 text-[10px] text-rivals-ink-muted transition-transform duration-[var(--motion-medium)] ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      <div className={`collapse-grid ${open ? "collapse-grid-open" : ""}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="panel-enter border-t border-rivals-light-300/80 px-3 pb-3 pt-2.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
