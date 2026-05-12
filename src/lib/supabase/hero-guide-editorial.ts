import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type HeroGuideTabContent,
  heroGuideTabsSchema,
} from "@/features/heroes/hero-guide-schema";
import {
  type HeroEditorialScope,
  fetchHeroEditorialContent,
  upsertHeroEditorial,
} from "@/lib/supabase/hero-editorial-repository";

const HERO_GUIDE_TABS_KEY = "heroGuideTabs";

function getObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractGuideTabsCandidate(value: unknown): unknown {
  // Transitional compatibility: accept legacy direct-array payloads.
  if (Array.isArray(value)) {
    return value;
  }
  const asObject = getObject(value);
  return asObject?.[HERO_GUIDE_TABS_KEY];
}

export async function fetchHeroGuideTabsFromEditorial(
  supabase: SupabaseClient,
  heroSlug: string,
  scope: HeroEditorialScope = "published",
): Promise<HeroGuideTabContent[] | null> {
  const editorial = await fetchHeroEditorialContent(supabase, heroSlug, scope);
  if (!editorial) {
    return null;
  }

  const candidate = extractGuideTabsCandidate(editorial);
  const parsed = heroGuideTabsSchema.safeParse(candidate);
  if (!parsed.success) {
    console.warn(
      `[supabase] hero guide tabs parse failed for "${heroSlug}" (${scope})`,
      parsed.error.issues.map((issue) => issue.message).join("; "),
    );
    return null;
  }

  return parsed.data;
}

export async function upsertHeroGuideTabsToEditorial(
  supabase: SupabaseClient,
  input: {
    heroSlug: string;
    scope: HeroEditorialScope;
    tabs: HeroGuideTabContent[];
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = heroGuideTabsSchema.safeParse(input.tabs);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const existing = await fetchHeroEditorialContent(supabase, input.heroSlug, input.scope);
  const base = getObject(existing) ?? {};

  return upsertHeroEditorial(supabase, {
    heroSlug: input.heroSlug,
    scope: input.scope,
    content: {
      ...base,
      [HERO_GUIDE_TABS_KEY]: parsed.data,
    },
  });
}

