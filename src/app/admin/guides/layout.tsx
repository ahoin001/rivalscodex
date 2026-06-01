import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { canEditHeroGuides } from "@/lib/auth/guide-editor";
import { isPersonalGuideEdit } from "@/lib/guide-edit-policy";

export const dynamic = "force-dynamic";

export default async function AdminGuidesLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseEnabled()) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-rivals-ink-soft">
        Enable Supabase (<code className="rounded bg-rivals-light-200 px-1">NEXT_PUBLIC_ENABLE_SUPABASE</code>{" "}
        and keys) to use the guide editor.
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-rivals-ink-soft">
        Could not initialize Supabase client.
      </div>
    );
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user && !isPersonalGuideEdit()) {
    redirect("/admin/login?next=/admin/guides");
  }

  if (!(await canEditHeroGuides(supabase, user))) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-xl font-bold uppercase italic text-rivals-ink">
          Access denied
        </h1>
        <p className="mt-3 text-sm text-rivals-ink-soft">
          Signed in, but this account does not have guide editor access. Ask an admin to set{" "}
          <code className="rounded bg-rivals-light-200 px-1">profiles.is_guide_editor</code> for your
          user (production). In development, any signed-in user can edit unless{" "}
          <code className="rounded bg-rivals-light-200 px-1">NEXT_PUBLIC_ALLOW_DEV_GUIDE_EDIT=false</code>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
