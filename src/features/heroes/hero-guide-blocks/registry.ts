import type { HeroGuideBlock, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";

export type HeroGuideBlockType = HeroGuideBlock["type"];

type BlockRegistryEntry = {
  type: HeroGuideBlockType;
  label: string;
  allowedTabs: HeroGuideTabId[];
  /** Stable reader module id for guide-body dispatch maps. */
  readerId: string;
};

export const HERO_GUIDE_BLOCK_REGISTRY: BlockRegistryEntry[] = [
  {
    type: "callout",
    label: "Callout",
    allowedTabs: ["overview"],
    readerId: "BlockCallout",
  },
  {
    type: "strengthsWeaknesses",
    label: "Strengths & weaknesses",
    allowedTabs: ["overview"],
    readerId: "BlockStrengthsWeaknesses",
  },
  {
    type: "bullets",
    label: "Bullets",
    allowedTabs: ["overview"],
    readerId: "BlockBullets",
  },
  {
    type: "twoColumn",
    label: "Two columns",
    allowedTabs: ["overview"],
    readerId: "BlockTwoColumn",
  },
  {
    type: "abilityTip",
    label: "Ability tip",
    allowedTabs: ["abilities"],
    readerId: "BlockAbilityTip",
  },
  {
    type: "combo",
    label: "Combo",
    allowedTabs: ["combos"],
    readerId: "ComboShowcaseCard",
  },
  {
    type: "matchup",
    label: "Matchup",
    allowedTabs: ["matchups"],
    readerId: "BlockMatchup",
  },
  {
    type: "loadout",
    label: "Team-Up loadout",
    allowedTabs: ["loadouts"],
    readerId: "BlockLoadout",
  },
  {
    type: "video",
    label: "Video",
    allowedTabs: ["overview", "abilities", "combos", "matchups", "loadouts", "resources"],
    readerId: "BlockVideo",
  },
];

export function canUseBlockOnTab(tabId: HeroGuideTabId, type: HeroGuideBlockType): boolean {
  const entry = HERO_GUIDE_BLOCK_REGISTRY.find((item) => item.type === type);
  return entry ? entry.allowedTabs.includes(tabId) : false;
}

export function getBlockRegistryEntry(type: HeroGuideBlockType): BlockRegistryEntry | undefined {
  return HERO_GUIDE_BLOCK_REGISTRY.find((item) => item.type === type);
}

