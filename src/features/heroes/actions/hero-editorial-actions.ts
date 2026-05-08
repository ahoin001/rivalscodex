"use server";

import type { HeroEditableSnapshot } from "@/features/heroes/hero-admin-types";
import { revalidatePath, updateTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { upsertHeroEditorial } from "@/lib/supabase/hero-editorial-repository";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { heroEditorialPublishedTag } from "@/lib/supabase/hero-editorial-cached";

function snapshotToContent(snapshot: HeroEditableSnapshot): Record<string, unknown> {
  return {
    playstyle: snapshot.playstyle,
    combos: snapshot.combos,
    synergies: snapshot.synergies,
    externalResources: snapshot.externalResources,
  };
}

export async function upsertHeroEditorialSnapshotAction(input: {
  heroSlug: string;
  snapshot: HeroEditableSnapshot;
  scope: "draft" | "published";
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
      error: "Sign in with Supabase to save or publish drafts.",
    };
  }

  const result = await upsertHeroEditorial(supabase, {
    heroSlug: input.heroSlug,
    scope: input.scope,
    content: snapshotToContent(input.snapshot),
  });

  if (result.ok && input.scope === "published") {
    const slugLower = input.heroSlug.toLowerCase();
    updateTag(heroEditorialPublishedTag(slugLower));
    revalidatePath(`/heroes/${input.heroSlug}`);
  }

  return result;
}

export async function saveHeroDraftToSupabaseAction(input: {
  heroSlug: string;
  snapshot: HeroEditableSnapshot;
}) {
  return upsertHeroEditorialSnapshotAction({
    heroSlug: input.heroSlug,
    snapshot: input.snapshot,
    scope: "draft",
  });
}

export async function publishHeroEditorialToSupabaseAction(input: {
  heroSlug: string;
  snapshot: HeroEditableSnapshot;
}) {
  return upsertHeroEditorialSnapshotAction({
    heroSlug: input.heroSlug,
    snapshot: input.snapshot,
    scope: "published",
  });
}
