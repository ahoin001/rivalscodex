import type { Hero } from "@/data/schema";
import { getResolvedHeroForms } from "@/features/heroes/hero-forms";
import type { ExternalHero } from "@/lib/api/marvel-rivals";

export function mapHeroToExternalHero(hero: Hero): ExternalHero {
  const forms = getResolvedHeroForms(hero);
  return {
    id: hero.id,
    slug: hero.slug,
    name: hero.name,
    role: hero.role,
    summary: hero.summary,
    portraitImageUrl: hero.portraitImage,
    splashImageUrl: hero.splashImage,
    abilities: hero.abilities.map((ability) => ({
      name: ability.name,
      keybind: ability.keybind,
      type: ability.type,
      description: ability.description,
      damage: ability.damage,
      cooldownSeconds: ability.cooldownSeconds,
      iconUrl: ability.iconUrl ?? ability.videoUrl,
      category: ability.category,
      keybindIconUrl: ability.keybindIconUrl,
      stats: ability.stats,
      transformationId:
        ability.siteFormIndex !== undefined
          ? hero.forms?.find((form) => form.siteFormIndex === ability.siteFormIndex)?.id
          : undefined,
    })),
    transformations: forms.map((form) => ({
      id: form.id,
      name: form.shortLabel ?? form.name,
      iconUrl: form.portraitImage,
      health: String(form.health),
      movementSpeed: "6m/s",
    })),
  };
}
