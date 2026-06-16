import "server-only";

import { canEditHeroGuides } from "@/lib/auth/guide-editor";
import {
  inlineGuideEditEnabled,
  isAdminGuideEdit,
} from "@/lib/guide-edit-policy";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

/** Resolves admin full-tab editor URL when the viewer may open it. */
export async function getFullTabEditorHref(
  heroSlug: string,
): Promise<string | null> {
  if (!isSupabaseEnabled()) {
    return null;
  }

  if (inlineGuideEditEnabled()) {
    return `/admin/guides/${heroSlug}`;
  }

  if (!isAdminGuideEdit()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  if (!(await canEditHeroGuides(supabase, data.user ?? null))) {
    return null;
  }

  return `/admin/guides/${heroSlug}`;
}
