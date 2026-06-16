import type { HeroGuideBlock, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";

export type HeroGuideBlockType = HeroGuideBlock["type"];

type BlockRegistryEntry = {
  type: HeroGuideBlockType;
  label: string;
  allowedTabs: HeroGuideTabId[];
};

export const HERO_GUIDE_BLOCK_REGISTRY: BlockRegistryEntry[] = [
  {
    type: "callout",
    label: "Callout",
    allowedTabs: ["overview", "resources"],
  },
  {
    type: "strengthsWeaknesses",
    label: "Strengths & weaknesses",
    allowedTabs: ["overview"],
  },
  {
    type: "bullets",
    label: "Bullets",
    allowedTabs: ["overview", "resources"],
  },
  {
    type: "twoColumn",
    label: "Two columns",
    allowedTabs: ["overview", "resources"],
  },
  {
    type: "abilityTip",
    label: "Ability tip",
    allowedTabs: ["abilities"],
  },
  {
    type: "combo",
    label: "Combo",
    allowedTabs: ["combos"],
  },
  {
    type: "matchup",
    label: "Matchup",
    allowedTabs: ["matchups"],
  },
  {
    type: "video",
    label: "Video",
    allowedTabs: ["overview", "abilities", "combos", "matchups", "resources"],
  },
];

export function canUseBlockOnTab(tabId: HeroGuideTabId, type: HeroGuideBlockType): boolean {
  const entry = HERO_GUIDE_BLOCK_REGISTRY.find((item) => item.type === type);
  return entry ? entry.allowedTabs.includes(tabId) : false;
}

