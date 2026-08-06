"use client";

import {
  type KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type RivalsTab = {
  id: string;
  label: string;
  /** Shorter label for narrow viewports; falls back to `label`. */
  shortLabel?: string;
  icon?: ReactNode;
};

type RivalsTabBarProps = {
  tabs: RivalsTab[];
  activeTabId: string;
  onChange: (tabId: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
  idBase?: string;
  getPanelId?: (tabId: string) => string;
};

export function RivalsTabBar({
  tabs,
  activeTabId,
  onChange,
  className = "",
  orientation = "horizontal",
  idBase = "rivals-tab-bar",
  getPanelId,
}: RivalsTabBarProps) {
  const isVertical = orientation === "vertical";
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
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

  const focusTabByIndex = useCallback(
    (index: number) => {
      if (tabs.length === 0) return;
      const normalized = (index + tabs.length) % tabs.length;
      const nextTab = tabs[normalized];
      if (!nextTab) return;
      onChange(nextTab.id);
      buttonRefs.current[normalized]?.focus();
    },
    [tabs, onChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (tabs.length <= 1) return;
      const nextHorizontal =
        event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : null;
      const nextVertical =
        event.key === "ArrowDown" ? index + 1 : event.key === "ArrowUp" ? index - 1 : null;

      if (!isVertical && nextHorizontal !== null) {
        event.preventDefault();
        focusTabByIndex(nextHorizontal);
        return;
      }

      if (isVertical && nextVertical !== null) {
        event.preventDefault();
        focusTabByIndex(nextVertical);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusTabByIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        focusTabByIndex(tabs.length - 1);
      }
    },
    [tabs.length, isVertical, focusTabByIndex],
  );

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
          className="pointer-events-none absolute bottom-0 z-10 h-[3px] rounded-full bg-brand-gold shadow-[0_0_10px_rgb(var(--brand-gold-rgb)/0.5)] transition-[left,width] duration-[var(--motion-medium)] ease-[var(--ease-out-soft)]"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
      ) : null}

      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const panelId = getPanelId?.(tab.id);
        const tabId = `${idBase}-tab-${tab.id}`;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => onChange(tab.id)}
            className={`rivals-clip-tab inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap px-4 py-2.5 font-display text-xs font-bold uppercase italic tracking-[0.16em] transition-[background-color,color,box-shadow,transform] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-rivals-light-100 active:scale-[0.985] sm:px-5 sm:py-2 sm:text-base sm:tracking-[0.18em] ${
              isActive
                ? "bg-rivals-yellow-500 text-rivals-ink shadow-[0_4px_18px_rgba(251,220,44,0.35)]"
                : "bg-rivals-light-200 text-rivals-ink-soft hover:-translate-y-px hover:bg-rivals-light-300 hover:text-rivals-ink"
            }`}
          >
            {tab.icon ? <span aria-hidden>{tab.icon}</span> : null}
            <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
