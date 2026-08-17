"use client";

import { type KeyboardEvent, useCallback, useRef } from "react";

export type ClipSegmentOption = {
  id: string;
  label: string;
};

export type ClipSegmentChangeSource = "pointer" | "keyboard";

type RivalsClipSegmentProps = {
  options: ClipSegmentOption[];
  value: string;
  onChange: (id: string, source?: ClipSegmentChangeSource) => void;
  tone?: "gold" | "ink";
  className?: string;
  ariaLabel?: string;
};

const baseButtonClass =
  "rivals-clip-tab shrink-0 px-3 py-1.5 font-display text-[10px] font-bold uppercase italic tracking-[0.14em] transition-[background-color,color,border-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 active:scale-[0.97]";

function optionClass(tone: "gold" | "ink", active: boolean): string {
  if (tone === "ink") {
    return active
      ? "border border-rivals-ink/25 bg-rivals-ink text-white"
      : "border border-rivals-light-300 text-rivals-ink-muted hover:border-rivals-ink/20";
  }
  return active
    ? "border border-brand-gold bg-rivals-yellow-500 text-rivals-ink"
    : "border border-rivals-light-300 bg-rivals-light-200 text-rivals-ink-soft";
}

export function RivalsClipSegment({
  options,
  value,
  onChange,
  tone = "gold",
  className = "",
  ariaLabel,
}: RivalsClipSegmentProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusByIndex = useCallback(
    (index: number) => {
      if (options.length === 0) return;
      const normalized = (index + options.length) % options.length;
      const next = options[normalized];
      if (!next) return;
      onChange(next.id, "keyboard");
      buttonRefs.current[normalized]?.focus();
    },
    [onChange, options],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (options.length <= 1) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusByIndex(index + 1);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusByIndex(index - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusByIndex(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      focusByIndex(options.length - 1);
    }
  };

  return (
    <div
      className={`flex flex-wrap gap-1 ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option, index) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id, "pointer")}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`${baseButtonClass} ${optionClass(tone, active)}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
