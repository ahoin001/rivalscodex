"use client";

import { ReactNode } from "react";

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

  return (
    <div
      className={`${
        isVertical
          ? "flex flex-col gap-2"
          : "flex flex-wrap gap-2 overflow-x-auto"
      } ${className}`.trim()}
      role="tablist"
      aria-orientation={orientation}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`rivals-clip-tab inline-flex items-center gap-2 px-5 py-2 font-display text-sm font-bold uppercase italic tracking-[0.18em] transition-colors duration-150 sm:text-base ${
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
