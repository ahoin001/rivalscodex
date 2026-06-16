import "server-only";

import { unstable_noStore } from "next/cache";
import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { mergeHeroGuideTabsWithFallback } from "@/features/heroes/hero-guide-merge";
import { featureFlags } from "@/lib/feature-flags";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getCachedPublishedHeroGuideTabs } from "@/lib/supabase/hero-guide-cached";
import { fetchHeroGuideTabsFromEditorial } from "@/lib/supabase/hero-guide-editorial";

export type HeroGuideContentScope = "published" | "draft";

export type ResolvedHeroGuideTabs = {
  tabs: HeroGuideTabContent[];
  /** True when editorial JSON loaded from Supabase (not dossier-only fallback). */
  editorialLoaded: boolean;
};

export async function resolveHeroGuideTabs(input: {
  heroSlug: string;
  fallbackTabs: HeroGuideTabContent[];
  scope?: HeroGuideContentScope;
}): Promise<ResolvedHeroGuideTabs> {
  if (!featureFlags.enableSupabase) {
    return {
      tabs: mergeHeroGuideTabsWithFallback(input.fallbackTabs, input.fallbackTabs),
      editorialLoaded: false,
    };
  }

  if (input.scope === "draft") {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return {
        tabs: mergeHeroGuideTabsWithFallback(input.fallbackTabs, input.fallbackTabs),
        editorialLoaded: false,
      };
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      const publishedTabs = await getCachedPublishedHeroGuideTabs(input.heroSlug);
      return {
        tabs: mergeHeroGuideTabsWithFallback(
          publishedTabs ?? input.fallbackTabs,
          input.fallbackTabs,
        ),
        editorialLoaded: publishedTabs !== null,
      };
    }

    unstable_noStore();

    const draftTabs = await fetchHeroGuideTabsFromEditorial(supabase, input.heroSlug, "draft");
    return {
      tabs: mergeHeroGuideTabsWithFallback(draftTabs ?? input.fallbackTabs, input.fallbackTabs),
      editorialLoaded: draftTabs !== null,
    };
  }

  const publishedTabs = await getCachedPublishedHeroGuideTabs(input.heroSlug);
  return {
    tabs: mergeHeroGuideTabsWithFallback(publishedTabs ?? input.fallbackTabs, input.fallbackTabs),
    editorialLoaded: publishedTabs !== null,
  };
}
