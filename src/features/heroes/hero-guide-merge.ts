import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { HERO_GUIDE_TAB_ORDER } from "@/features/heroes/hero-guide-schema";
import { migrateHeroGuideTabs } from "@/features/heroes/hero-guide-migrate";

function tabHasLoadoutBlocks(tab: HeroGuideTabContent | undefined): boolean {
  return Boolean(tab?.body?.some((block) => block.type === "loadout"));
}

/**
 * Canonical tab order and fill-in from dossier fallback when editorial omits a tab
 * (e.g. older published guides without `overview`).
 *
 * Loadouts: editorial `loadout` blocks win; otherwise use the catalog/kit fallback
 * so empty published tabs still pick up Season 9 Team-Ups.
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
    const editorialTab = editorialById.get(id);
    const fallbackTab = fallbackById.get(id);

    if (id === "loadouts") {
      if (tabHasLoadoutBlocks(editorialTab) && editorialTab) return editorialTab;
      const picked = fallbackTab ?? editorialTab;
      if (!picked) {
        throw new Error(`mergeHeroGuideTabsWithFallback: missing tab "${id}" in fallback.`);
      }
      return picked;
    }

    const picked = editorialTab ?? fallbackTab;
    if (!picked) {
      throw new Error(`mergeHeroGuideTabsWithFallback: missing tab "${id}" in fallback.`);
    }
    return picked;
  });
}
