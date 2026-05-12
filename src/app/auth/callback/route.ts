import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { safeAdminNextPath } from "@/lib/admin/safe-next-path";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAdminNextPath(requestUrl.searchParams.get("next"));

  const cfg = getSupabasePublicConfig();
  if (!cfg || !code) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(cfg.url, cfg.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* ignore when response already committed */
        }
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
