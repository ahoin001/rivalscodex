import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createSupabaseServerClient(): Promise<
  SupabaseClient | undefined
> {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return undefined;
  }

  const cookieStore = await cookies();

  return createServerClient(cfg.url, cfg.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieList: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookieList.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Server Components may omit cookie writes — proxy handles refresh when possible */
        }
      },
    },
  });
}
