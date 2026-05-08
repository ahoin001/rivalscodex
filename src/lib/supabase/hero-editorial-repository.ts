import type { SupabaseClient } from "@supabase/supabase-js";
import { RIVALSCODEX_APP_SCHEMA } from "@/lib/supabase/constants";

export type HeroEditorialScope = "draft" | "published";

/**
 * Reads curated hero JSON — exposed-schema table first, RPC fallback if needed.
 */
export async function fetchHeroEditorialContent(
  supabase: SupabaseClient,
  heroSlug: string,
  scope: HeroEditorialScope = "published",
): Promise<unknown | null> {
  const { data: row, error: tableError } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from("hero_editorial")
    .select("content")
    .eq("hero_slug", heroSlug)
    .eq("scope", scope)
    .maybeSingle();

  if (!tableError && row && row.content !== undefined && row.content !== null) {
    return row.content as unknown;
  }

  const { data, error } = await supabase.rpc("rivalscodex_get_hero_editorial", {
    p_hero_slug: heroSlug,
    p_scope: scope,
  });

  if (error) {
    console.warn(
      "[supabase] hero_editorial fetch failed",
      tableError?.message ?? error.message,
    );
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
