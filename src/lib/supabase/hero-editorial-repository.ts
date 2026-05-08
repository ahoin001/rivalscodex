import type { SupabaseClient } from "@supabase/supabase-js";

export type HeroEditorialScope = "draft" | "published";

/**
 * Reads editorial JSON via public RPC (works without exposing app_rivalscodex_v1 to PostgREST).
 */
export async function fetchHeroEditorialContent(
  supabase: SupabaseClient,
  heroSlug: string,
  scope: HeroEditorialScope = "published",
): Promise<unknown | null> {
  const { data, error } = await supabase.rpc("rivalscodex_get_hero_editorial", {
    p_hero_slug: heroSlug,
    p_scope: scope,
  });

  if (error) {
    console.warn("[supabase] rivalscodex_get_hero_editorial failed", error.message);
    return null;
  }

  return data ?? null;
}

export type UpsertHeroEditorialInput = {
  heroSlug: string;
  scope: HeroEditorialScope;
  content: Record<string, unknown>;
};

export async function upsertHeroEditorial(
  supabase: SupabaseClient,
  input: UpsertHeroEditorialInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("rivalscodex_upsert_hero_editorial", {
    p_hero_slug: input.heroSlug,
    p_scope: input.scope,
    p_content: input.content,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
