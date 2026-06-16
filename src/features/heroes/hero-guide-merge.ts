import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { HERO_GUIDE_TAB_ORDER } from "@/features/heroes/hero-guide-schema";
import { migrateHeroGuideTabs } from "@/features/heroes/hero-guide-migrate";

/**
 * Canonical tab order and fill-in from dossier fallback when editorial omits a tab
 * (e.g. older published guides without `overview`).
 */
export function mergeHeroGuideTabsWithFallback(
  editorial: HeroGuideTabContent[],
  fallback: HeroGuideTabContent[],
): HeroGuideTabContent[] {
  const migratedEditorial = migrateHeroGuideTabs(editorial);
  const migratedFallback = migrateHeroGuideTabs(fallback);
  const editorialById = new Map(migratedEditorial.map((tab) => [tab.id, tab]));
  const fallbackById = new Map(migratedFallback.map((tab) => [tab.id, tab]));

  return HERO_GUIDE_TAB_ORDER.map((id) => {
    const picked = editorialById.get(id) ?? fallbackById.get(id);
    if (!picked) {
      throw new Error(`mergeHeroGuideTabsWithFallback: missing tab "${id}" in fallback.`);
    }
    return picked;
  });
}
