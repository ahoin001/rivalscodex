"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | undefined {
  const cfg =
    typeof window === "undefined" ? null : getSupabasePublicConfig();
  if (!cfg) {
    return undefined;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(cfg.url, cfg.publishableKey);
  }

  return browserClient;
}
