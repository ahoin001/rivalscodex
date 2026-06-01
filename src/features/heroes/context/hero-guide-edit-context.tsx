"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { HeroGuideTabContent, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { useHeroGuideEdit } from "@/features/heroes/hooks/use-hero-guide-edit";

export type HeroGuideEditApi = ReturnType<typeof useHeroGuideEdit>;

const HeroGuideEditContext = createContext<HeroGuideEditApi | null>(null);

export function HeroGuideEditProvider({
  value,
  children,
}: {
  value: HeroGuideEditApi;
  children: ReactNode;
}) {
  return (
    <HeroGuideEditContext.Provider value={value}>{children}</HeroGuideEditContext.Provider>
  );
}

export function useHeroGuideEditContext(): HeroGuideEditApi | null {
  return useContext(HeroGuideEditContext);
}

export function useHeroGuideEditRequired(): HeroGuideEditApi {
  const ctx = useContext(HeroGuideEditContext);
  if (!ctx) {
    throw new Error("useHeroGuideEditRequired must be used within HeroGuideEditProvider");
  }
  return ctx;
}

export type { HeroGuideTabContent, HeroGuideTabId, HeroGuideBlock };
