import type { SupabaseClient } from "@supabase/supabase-js";
import { RIVALSCODEX_APP_SCHEMA } from "@/lib/supabase/constants";

const IMPORT_LOG_TABLE = "hero_import_log";

export type HeroImportAction = "apply-skeleton" | "apply-ability-detail";

export type HeroImportLogInput = {
  slug: string;
  action: HeroImportAction;
  ok: boolean;
  details: Record<string, unknown>;
};

/**
 * Best-effort audit trail for Marvel HTML import applies. Requires
 * `service_role` (sequence + table grants on `hero_import_log`).
 */
export async function logHeroImport(
  supabase: SupabaseClient,
  input: HeroImportLogInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(IMPORT_LOG_TABLE)
    .insert({
      hero_slug: input.slug,
      action: input.action,
      ok: input.ok,
      details: input.details,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
