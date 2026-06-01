"use server";

import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import {
  describeGuideEditorDenial,
  canEditHeroGuides,
  type GuideEditorDenialCode,
} from "@/lib/auth/guide-editor";
import { revalidatePath, updateTag } from "next/cache";
import { isPersonalGuideEdit } from "@/lib/guide-edit-policy";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role-client";
import { upsertHeroGuideTabsToEditorial } from "@/lib/supabase/hero-guide-editorial";
import { heroGuidePublishedTag } from "@/lib/supabase/hero-guide-cached";
export type HeroGuideEditorialActionResult =
  | { ok: true }
  | { ok: false; error: string; code?: GuideEditorDenialCode | "SUPABASE_DISABLED" | "CLIENT_ERROR" };

export async function upsertHeroGuideTabsAction(input: {
  heroSlug: string;
  tabs: HeroGuideTabContent[];
  scope: "draft" | "published";
}): Promise<HeroGuideEditorialActionResult> {
  if (!isSupabaseEnabled()) {
    return {
      ok: false,
      code: "SUPABASE_DISABLED",
      error: "Supabase is not enabled.",
    };
  }

  let supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, code: "CLIENT_ERROR", error: "Supabase client could not be created." };
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (isPersonalGuideEdit()) {
    const service = createSupabaseServiceRoleClient();
    if (service) {
      supabase = service;
    }
  } else if (!(await canEditHeroGuides(supabase, user))) {
    const denial = describeGuideEditorDenial(user);
    return { ok: false, code: denial.code, error: denial.message };
  }

  const result = await upsertHeroGuideTabsToEditorial(supabase, input);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const slugLower = input.heroSlug.toLowerCase();

  if (input.scope === "published") {
    updateTag(heroGuidePublishedTag(slugLower));
    revalidatePath(`/heroes/${input.heroSlug}`);
    revalidatePath("/lab/hero-card");
  }

  if (input.scope === "draft") {
    revalidatePath(`/heroes/${input.heroSlug}`);
    revalidatePath("/lab/hero-card");
  }

  return { ok: true };
}

export async function saveHeroGuideDraftAction(input: {
  heroSlug: string;
  tabs: HeroGuideTabContent[];
}) {
  return upsertHeroGuideTabsAction({ ...input, scope: "draft" });
}

export async function publishHeroGuideTabsAction(input: {
  heroSlug: string;
  tabs: HeroGuideTabContent[];
}) {
  return upsertHeroGuideTabsAction({ ...input, scope: "published" });
}
