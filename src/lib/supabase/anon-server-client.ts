import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Server-only client for public (anon) reads (e.g. published editorial).
 * No cookie session — uses the publishable key only.
 */
export function createSupabaseAnonymousServerClient(): SupabaseClient | null {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return null;
  }

  return createClient(cfg.url, cfg.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
