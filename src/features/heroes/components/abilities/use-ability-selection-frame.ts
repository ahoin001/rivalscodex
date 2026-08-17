"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { AbilitySection } from "./ability-view-model";

export function useAbilitySelectionFrame(
  panelMode: "base" | "ability",
  selectedAbilityId: string | null,
  sections: AbilitySection[],
) {
  const listRef = useRef<HTMLDivElement>(null);
  const [frameClip, setFrameClip] = useState("inset(0 0 100% 0)");
  const [frameActive, setFrameActive] = useState(false);

  useLayoutEffect(() => {
    const list = listRef.current;

    const updateFrame = () => {
      if (!list || panelMode !== "ability" || !selectedAbilityId) {
        setFrameActive(false);
        return;
      }
      const active = list.querySelector<HTMLElement>(
        `[data-ability-id="${selectedAbilityId}"]`,
      );
      if (!active) {
        setFrameActive(false);
        return;
      }
      const listRect = list.getBoundingClientRect();
      const rowRect = active.getBoundingClientRect();
      const top = Math.max(0, rowRect.top - listRect.top);
      const bottom = Math.max(0, listRect.bottom - rowRect.bottom);
      setFrameClip(`inset(${top}px 4px ${bottom}px 4px)`);
      setFrameActive(true);
    };

    updateFrame();
    if (!list) return;
    list.addEventListener("scroll", updateFrame, { passive: true });
    window.addEventListener("resize", updateFrame);
    return () => {
      list.removeEventListener("scroll", updateFrame);
      window.removeEventListener("resize", updateFrame);
    };
  }, [panelMode, selectedAbilityId, sections]);

  return { listRef, frameClip, frameActive };
}
