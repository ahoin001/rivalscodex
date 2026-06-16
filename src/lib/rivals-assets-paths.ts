/**
 * Canonical web paths for assets under `public/rivals-assets/`.
 * All runtime hero art, UI frames, and shared icons resolve here.
 */
export const RIVALS_ASSETS_BASE = "/rivals-assets";

export function rivalsAsset(...parts: string[]): string {
  return `${RIVALS_ASSETS_BASE}/${parts.join("/")}`;
}

export const RIVALS_FRAMES = {
  hero: rivalsAsset("frames", "hero-frame.jpg"),
  abilitiesSection: rivalsAsset("frames", "abilities-section.jpg"),
} as const;

export const RIVALS_ICONS = {
  lmb: rivalsAsset("icons", "LMB-icon.png"),
  rmb: rivalsAsset("icons", "RMB-icon.png"),
} as const;

export const RIVALS_LUNA = {
  portrait: rivalsAsset("heros", "luna", "luna.png"),
  frame: rivalsAsset("heros", "luna", "luna-frame.png"),
  stackLogo: rivalsAsset("heros", "luna", "luna-stack-logo.png"),
} as const;

/** Codex + importer convention for per-hero asset URLs. */
export function heroAssetPaths(slug: string) {
  const base = rivalsAsset("heros", slug);
  return {
    portraitImage: `${base}/${slug}.png`,
    splashImage: `${base}/${slug}.png`,
    frameImage: `${base}/${slug}-frame.png`,
    stackLogoImage: `${base}/${slug}-stack-logo.png`,
  } as const;
}

/** Disk-relative path parts under `public/rivals-assets/` for server-side writes. */
export function heroAssetDiskParts(slug: string, filename: string): string[] {
  return ["heros", slug, filename];
}
