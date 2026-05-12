import "server-only";

import { unstable_cache } from "next/cache";
import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { createSupabaseAnonymousServerClient } from "@/lib/supabase/anon-server-client";
import { fetchHeroGuideTabsFromEditorial } from "@/lib/supabase/hero-guide-editorial";

const HERO_GUIDE_PUBLISHED_TAG_PREFIX = "hero-guide-published";

/** Fallback `revalidate` window (seconds) for published guide tabs when using `unstable_cache`.
 * Publishes invalidate immediately via `updateTag` in `hero-guide-editorial-actions`.
 */
export const HERO_GUIDE_PUBLISHED_CACHE_REVALIDATE_SECONDS = 900;

export function heroGuidePublishedTag(slug: string): string {
  return `${HERO_GUIDE_PUBLISHED_TAG_PREFIX}-${slug}`;
}

export async function getCachedPublishedHeroGuideTabs(
  slug: string,
): Promise<HeroGuideTabContent[] | null> {
  return unstable_cache(
    async () => {
      const client = createSupabaseAnonymousServerClient();
      if (!client) {
        return null;
      }

      return fetchHeroGuideTabsFromEditorial(client, slug, "published");
    },
    [HERO_GUIDE_PUBLISHED_TAG_PREFIX, slug.toLowerCase()],
    {
      tags: [heroGuidePublishedTag(slug.toLowerCase())],
      revalidate: HERO_GUIDE_PUBLISHED_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

