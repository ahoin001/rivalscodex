"use server";

import type { HeroEditableSnapshot } from "@/features/heroes/hero-admin-types";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { upsertHeroEditorial } from "@/lib/supabase/hero-editorial-repository";
import { isSupabaseEnabled } from "@/lib/supabase/env";

function snapshotToContent(snapshot: HeroEditableSnapshot): Record<string, unknown> {
  return {
    playstyle: snapshot.playstyle,
    combos: snapshot.combos,
    synergies: snapshot.synergies,
    externalResources: snapshot.externalResources,
  };
}

export async function saveHeroDraftToSupabaseAction(input: {
  heroSlug: string;
  snapshot: HeroEditableSnapshot;
}) {
  if (!isSupabaseEnabled()) {
    return { ok: false as const, error: "Supabase is not enabled." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Supabase client could not be created." };
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return {
      ok: false as const,
      error: "Sign in with Supabase to save drafts. Published reads work without auth.",
    };
  }

  return upsertHeroEditorial(supabase, {
    heroSlug: input.heroSlug,
    scope: "draft",
    content: snapshotToContent(input.snapshot),
  });
}
