import Link from "next/link";
import { canEditHeroGuides } from "@/lib/auth/guide-editor";
import { isAdminGuideEdit } from "@/lib/guide-edit-policy";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type HeroGuideAdminLinkProps = {
  heroSlug: string;
};

/** Shows an edit link when Supabase is on and the viewer may edit guides (dev or profiles flag). */
export async function HeroGuideAdminLink({ heroSlug }: HeroGuideAdminLinkProps) {
  if (!isAdminGuideEdit()) {
    return null;
  }

  if (!isSupabaseEnabled()) {
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

  return (
    <p className="mt-4 text-center text-xs text-rivals-ink-soft">
      <Link
        href={`/admin/guides/${heroSlug}`}
        className="font-semibold underline decoration-rivals-ink/25 underline-offset-2 hover:text-rivals-ink"
      >
        Edit hero guide in admin
      </Link>
    </p>
  );
}
