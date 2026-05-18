"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

export type RivalsTab = {
  id: string;
  label: string;
  icon?: ReactNode;
};

type RivalsTabBarProps = {
  tabs: RivalsTab[];
  activeTabId: string;
  onChange: (tabId: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
};

export function RivalsTabBar({
  tabs,
  activeTabId,
  onChange,
  className = "",
  orientation = "horizontal",
}: RivalsTabBarProps) {
  const isVertical = orientation === "vertical";
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (!containerRef.current || isVertical) return;
    const container = containerRef.current;
    const buttons = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    for (const btn of buttons) {
      if (btn.getAttribute("aria-selected") === "true") {
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        setIndicator({
          left: btnRect.left - containerRect.left + container.scrollLeft,
          width: btnRect.width,
        });
        break;
      }
    }
  }, [isVertical]);

  useEffect(() => {
    updateIndicator();
  }, [activeTabId, updateIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      className={`relative ${
        isVertical
          ? "flex flex-col gap-2"
          : "flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      } ${className}`.trim()}
      role="tablist"
      aria-orientation={orientation}
    >
      {!isVertical ? (
        <div
          className="pointer-events-none absolute bottom-0 z-10 h-[3px] rounded-full bg-brand-gold shadow-[0_0_10px_rgba(201,162,93,0.5)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
      ) : null}

      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`rivals-clip-tab inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap px-4 py-2.5 font-display text-xs font-bold uppercase italic tracking-[0.16em] transition-colors duration-150 sm:px-5 sm:py-2 sm:text-base sm:tracking-[0.18em] ${
              isActive
                ? "bg-rivals-yellow-500 text-rivals-ink shadow-[0_4px_18px_rgba(251,220,44,0.35)]"
                : "bg-rivals-light-200 text-rivals-ink-soft hover:bg-rivals-light-300 hover:text-rivals-ink"
            }`}
          >
            {tab.icon ? <span aria-hidden>{tab.icon}</span> : null}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
