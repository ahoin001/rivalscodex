import Link from "next/link";
import { featureFlags } from "@/lib/feature-flags";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type DraftPreviewAuthBannerProps = {
  /** True when the URL requests draft preview (`?preview=draft`). */
  wantsDraftPreview: boolean;
  /** Post-login redirect target (path + query). */
  loginNextPath: string;
};

/**
 * When visitors use `?preview=draft` without a session, guide tabs resolve to
 * **published** editorial (see `resolveHeroGuideTabs`). This banner explains why
 * draft content is not shown and links to sign-in.
 */
export async function DraftPreviewAuthBanner({
  wantsDraftPreview,
  loginNextPath,
}: DraftPreviewAuthBannerProps) {
  if (!wantsDraftPreview || !featureFlags.enableSupabase) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return null;
  }

  const loginHref = `/admin/login?next=${encodeURIComponent(loginNextPath)}`;

  return (
    <div
      role="status"
      className="border-b border-amber-400/45 bg-amber-50 px-5 py-3 text-center text-sm leading-relaxed text-amber-950 sm:px-8"
    >
      <span>Draft preview needs an account. You’re seeing the </span>
      <strong>published</strong>
      <span> guide. </span>
      <Link href={loginHref} className="font-semibold underline underline-offset-2">
        Sign in
      </Link>
      <span> to load your draft.</span>
    </div>
  );
}
