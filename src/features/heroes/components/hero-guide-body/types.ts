import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";

export type HeroGuideBodyNavItem = {
  id: string;
  label: string;
};

export type HeroPortraitEntry = {
  slug: string;
  name: string;
  role?: string;
  portraitUrl: string;
  stackLogoUrl: string;
  aliases?: string[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getBlockLabel(block: HeroGuideBlock, index: number): string {
  switch (block.type) {
    case "callout":
      return block.title ?? `Callout ${index + 1}`;
    case "bullets":
      return block.title ?? `Key points ${index + 1}`;
    case "twoColumn":
      return `${block.leftTitle} / ${block.rightTitle}`;
    case "combo":
      return block.name;
    case "matchup":
      return `${block.disposition === "target" ? "Target" : block.disposition === "even" ? "Even" : "Threat"}: ${block.opponent}`;
    case "abilityTip":
      return block.title ?? `Ability tip ${index + 1}`;
    case "video":
      return block.title;
    case "strengthsWeaknesses":
      return block.title ?? "Strengths & Weaknesses";
  }
}

export function buildHeroGuideBodyNavItems(
  blocks: HeroGuideBlock[],
  anchorPrefix: string,
): HeroGuideBodyNavItem[] {
  return blocks.map((block, index) => {
    const label = getBlockLabel(block, index);
    const labelSlug = slugify(label) || `${block.type}-${index + 1}`;
    return {
      id: `${anchorPrefix}-${index + 1}-${labelSlug}`,
      label,
    };
  });
}

/**
 * Build a portrait lookup Map keyed by lowercased opponent name and slug.
 * @deprecated Prefer buildPortraitLookup from hero-portrait-map for full alias support.
 */
export function buildPortraitLookup(
  portraits: HeroPortraitEntry[] | undefined,
): Map<string, HeroPortraitEntry> | null {
  if (!portraits || portraits.length === 0) return null;
  const map = new Map<string, HeroPortraitEntry>();
  for (const p of portraits) {
    map.set(p.name.toLowerCase(), p);
    map.set(p.slug, p);
    map.set(p.slug.replace(/-/g, " "), p);
    for (const alias of p.aliases ?? []) {
      map.set(alias.toLowerCase(), p);
    }
  }
  return map;
}

export function findPortraitByOpponent(
  lookup: Map<string, HeroPortraitEntry> | null,
  opponentName: string,
): HeroPortraitEntry | undefined {
  if (!lookup) return undefined;
  const lower = opponentName.toLowerCase().trim();
  return (
    lookup.get(lower) ??
    lookup.get(lower.replace(/\s+/g, "-")) ??
    lookup.get(lower.replace(/-/g, " "))
  );
}
