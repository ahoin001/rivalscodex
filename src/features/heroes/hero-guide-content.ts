import "server-only";

import { unstable_noStore } from "next/cache";
import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { mergeHeroGuideTabsWithFallback } from "@/features/heroes/hero-guide-merge";
import { featureFlags } from "@/lib/feature-flags";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getCachedPublishedHeroGuideTabs } from "@/lib/supabase/hero-guide-cached";
import { fetchHeroGuideTabsFromEditorial } from "@/lib/supabase/hero-guide-editorial";

export type HeroGuideContentScope = "published" | "draft";

export async function resolveHeroGuideTabs(input: {
  heroSlug: string;
  fallbackTabs: HeroGuideTabContent[];
  scope?: HeroGuideContentScope;
}): Promise<HeroGuideTabContent[]> {
  if (!featureFlags.enableSupabase) {
    return mergeHeroGuideTabsWithFallback(input.fallbackTabs, input.fallbackTabs);
  }

  if (input.scope === "draft") {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return mergeHeroGuideTabsWithFallback(input.fallbackTabs, input.fallbackTabs);
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      const publishedTabs = await getCachedPublishedHeroGuideTabs(input.heroSlug);
      return mergeHeroGuideTabsWithFallback(
        publishedTabs ?? input.fallbackTabs,
        input.fallbackTabs,
      );
    }

    unstable_noStore();

    const draftTabs = await fetchHeroGuideTabsFromEditorial(supabase, input.heroSlug, "draft");
    return mergeHeroGuideTabsWithFallback(draftTabs ?? input.fallbackTabs, input.fallbackTabs);
  }

  const publishedTabs = await getCachedPublishedHeroGuideTabs(input.heroSlug);
  return mergeHeroGuideTabsWithFallback(publishedTabs ?? input.fallbackTabs, input.fallbackTabs);
}

