import "server-only";

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GuideEditorDenialCode = "UNAUTHORIZED" | "FORBIDDEN";

/**
 * Development: any signed-in user may edit when NEXT_PUBLIC_ALLOW_DEV_GUIDE_EDIT !== "false".
 * Production (and staging): requires profiles.is_guide_editor = true.
 */
export async function canEditHeroGuides(
  supabase: SupabaseClient,
  user: User | null,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  const devEditDisabled = process.env.NEXT_PUBLIC_ALLOW_DEV_GUIDE_EDIT === "false";
  if (process.env.NODE_ENV === "development" && !devEditDisabled) {
    return true;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("is_guide_editor")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[guide-editor] profiles lookup failed:", error.message);
    return false;
  }

  return data?.is_guide_editor === true;
}

export function describeGuideEditorDenial(
  user: User | null,
): { code: GuideEditorDenialCode; message: string } {
  if (!user) {
    return {
      code: "UNAUTHORIZED",
      message: "Sign in with Supabase to edit hero guides.",
    };
  }
  return {
    code: "FORBIDDEN",
    message:
      "Your account does not have guide editor access. Ask an admin to set profiles.is_guide_editor.",
  };
}
