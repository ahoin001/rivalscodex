import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { HERO_GUIDE_TAB_ORDER } from "@/features/heroes/hero-guide-schema";

/**
 * Canonical tab order and fill-in from dossier fallback when editorial omits a tab
 * (e.g. older published guides without `overview`).
 */
export function mergeHeroGuideTabsWithFallback(
  editorial: HeroGuideTabContent[],
  fallback: HeroGuideTabContent[],
): HeroGuideTabContent[] {
  const editorialById = new Map(editorial.map((tab) => [tab.id, tab]));
  const fallbackById = new Map(fallback.map((tab) => [tab.id, tab]));

  return HERO_GUIDE_TAB_ORDER.map((id) => {
    const picked = editorialById.get(id) ?? fallbackById.get(id);
    if (!picked) {
      throw new Error(`mergeHeroGuideTabsWithFallback: missing tab "${id}" in fallback.`);
    }
    return picked;
  });
}
