/**
 * Guide editing policy — personal (inline, no auth) vs admin (gated /admin/guides).
 *
 * Set `NEXT_PUBLIC_GUIDE_EDIT_POLICY=admin` when sharing the site publicly.
 * Default / unset: personal mode for local authoring.
 */

export type GuideEditPolicy = "personal" | "admin";

export function guideEditPolicy(): GuideEditPolicy {
  const raw = process.env.NEXT_PUBLIC_GUIDE_EDIT_POLICY?.trim().toLowerCase();
  if (raw === "admin") {
    return "admin";
  }
  return "personal";
}

export function isPersonalGuideEdit(): boolean {
  return guideEditPolicy() === "personal";
}

export function isAdminGuideEdit(): boolean {
  return guideEditPolicy() === "admin";
}

/** Inline edit chrome on hero pages (personal policy only). */
export function inlineGuideEditEnabled(): boolean {
  return isPersonalGuideEdit();
}

/**
 * Inline combos tab editor on hero detail pages (toolbar + in-place combo builder).
 * Disabled by default — use the full tab editor at `/admin/guides/[slug]` instead.
 * Set `NEXT_PUBLIC_INLINE_COMBOS_EDIT=true` to re-enable.
 */
export function inlineCombosEditEnabled(): boolean {
  if (!inlineGuideEditEnabled()) {
    return false;
  }
  return process.env.NEXT_PUBLIC_INLINE_COMBOS_EDIT === "true";
}
