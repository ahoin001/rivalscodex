import type { Hero } from "@/data/schema";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";

/**
 * Build a list of hero portrait entries from the full heroes array.
 * Used by the guide body to show opponent portraits in matchup cards.
 */
export function buildHeroPortraitEntries(heroes: Hero[]): HeroPortraitEntry[] {
  return heroes.map((hero) => ({
    slug: hero.slug,
    name: hero.name,
    portraitUrl: hero.portraitImage,
  }));
}

/**
 * Find a single hero's portrait by name or slug. Useful when only
 * the opponent name string is available.
 */
export function findHeroPortrait(
  heroes: Hero[],
  opponentName: string,
): HeroPortraitEntry | undefined {
  const lower = opponentName.toLowerCase().trim();
  const hero = heroes.find(
    (h) =>
      h.name.toLowerCase() === lower ||
      h.slug === lower.replace(/\s+/g, "-"),
  );
  if (!hero) return undefined;
  return {
    slug: hero.slug,
    name: hero.name,
    portraitUrl: hero.portraitImage,
  };
}
