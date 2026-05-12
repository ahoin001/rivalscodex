import "server-only";

import type { Hero } from "@/data/schema";
import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { buildHeroGuideTabsFromHero } from "@/features/heroes/hero-lab-data";
import { getHeroBySlug } from "@/lib/content-adapter";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { fetchHeroGuideTabsFromEditorial } from "@/lib/supabase/hero-guide-editorial";

export type HeroGuideEditorLoadResult = {
  hero: Hero;
  /** Generated from dossier when editorial is missing or invalid. */
  fallbackTabs: HeroGuideTabContent[];
  /** Saved draft from Supabase (validated); null if none or invalid. */
  draftTabs: HeroGuideTabContent[] | null;
  /** Published editorial tabs; null if none or invalid. */
  publishedTabs: HeroGuideTabContent[] | null;
  /** Working copy for the editor: draft wins over fallback. */
  initialTabs: HeroGuideTabContent[];
};

export async function loadHeroGuideEditorState(
  heroSlug: string,
): Promise<HeroGuideEditorLoadResult | null> {
  const hero = await getHeroBySlug(heroSlug);
  if (!hero) {
    return null;
  }

  const fallbackTabs = buildHeroGuideTabsFromHero(hero);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      hero,
      fallbackTabs,
      draftTabs: null,
      publishedTabs: null,
      initialTabs: fallbackTabs,
    };
  }

  const [draftTabs, publishedTabs] = await Promise.all([
    fetchHeroGuideTabsFromEditorial(supabase, hero.slug, "draft"),
    fetchHeroGuideTabsFromEditorial(supabase, hero.slug, "published"),
  ]);

  const initialTabs = draftTabs ?? fallbackTabs;

  return {
    hero,
    fallbackTabs,
    draftTabs,
    publishedTabs,
    initialTabs,
  };
}
