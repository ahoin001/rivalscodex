import { HeroAssetOverride, generatedHeroAssetOverrides } from "@/features/heroes/hero-asset-overrides.generated";

const heroAssetSlugAliases: Record<string, string> = {
  "luna-snow": "luna",
};

export function getHeroAssetOverride(slug: string): HeroAssetOverride | undefined {
  const normalizedSlug = slug.toLowerCase();
  const direct = generatedHeroAssetOverrides[normalizedSlug];
  if (direct) {
    return direct;
  }

  const alias = heroAssetSlugAliases[normalizedSlug];
  if (!alias) {
    return undefined;
  }

  return generatedHeroAssetOverrides[alias];
}
