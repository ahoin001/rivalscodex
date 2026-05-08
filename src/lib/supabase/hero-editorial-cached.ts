import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabaseAnonymousServerClient } from "@/lib/supabase/anon-server-client";
import { fetchHeroEditorialContent } from "@/lib/supabase/hero-editorial-repository";

const EDITORIAL_TAG_PREFIX = "hero-editorial-published";

export function heroEditorialPublishedTag(slug: string): string {
  return `${EDITORIAL_TAG_PREFIX}-${slug}`;
}

export async function getCachedPublishedHeroEditorial(
  slug: string,
): Promise<unknown | null> {
  return unstable_cache(
    async () => {
      const client = createSupabaseAnonymousServerClient();
      if (!client) {
        return null;
      }

      return fetchHeroEditorialContent(client, slug, "published");
    },
    ["hero-editorial-published", slug.toLowerCase()],
    {
      tags: [heroEditorialPublishedTag(slug.toLowerCase())],
      revalidate: 900,
    },
  )();
}
