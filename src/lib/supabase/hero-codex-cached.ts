import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";
import type { Hero } from "@/data/schema";
import { createSupabaseAnonymousServerClient } from "@/lib/supabase/anon-server-client";
import {
  fetchHeroCodexAll,
  fetchHeroCodexBySlug,
} from "@/lib/supabase/hero-codex-repository";

const ALL_TAG = "hero-codex-all";
const SLUG_TAG_PREFIX = "hero-codex-slug";

export function heroCodexAllTag(): string {
  return ALL_TAG;
}

export function heroCodexSlugTag(slug: string): string {
  return `${SLUG_TAG_PREFIX}-${slug.toLowerCase()}`;
}

export async function getCachedHeroCodexAll(): Promise<Hero[] | null> {
  return unstable_cache(
    async () => {
      const client = createSupabaseAnonymousServerClient();
      if (!client) return null;
      return fetchHeroCodexAll(client);
    },
    ["hero-codex-all"],
    { tags: [ALL_TAG], revalidate: 900 },
  )();
}

export async function getCachedHeroCodexBySlug(slug: string): Promise<Hero | null> {
  return unstable_cache(
    async () => {
      const client = createSupabaseAnonymousServerClient();
      if (!client) return null;
      return fetchHeroCodexBySlug(client, slug);
    },
    ["hero-codex-slug", slug.toLowerCase()],
    { tags: [heroCodexSlugTag(slug)], revalidate: 900 },
  )();
}

export function revalidateHeroCodexCaches(slug: string): void {
  revalidateTag(ALL_TAG, { expire: 0 });
  revalidateTag(heroCodexSlugTag(slug), { expire: 0 });
}
