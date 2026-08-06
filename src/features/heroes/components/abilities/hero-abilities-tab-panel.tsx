"use client";

import { Hero } from "@/data/schema";
import { HeroAbilitiesSection } from "@/features/heroes/components/hero-abilities-section";
import { ResolvedHeroForm } from "@/features/heroes/hero-forms";
import { ExternalHero } from "@/lib/api/marvel-rivals";

type HeroAbilitiesTabPanelProps = {
  hero: Hero;
  activeForm: ResolvedHeroForm;
};

export function HeroAbilitiesTabPanel({ hero, activeForm }: HeroAbilitiesTabPanelProps) {
  const mappedHero = mapHeroToAbilitiesPanel(hero, activeForm);

  return <HeroAbilitiesSection hero={mappedHero} />;
}

function mapHeroToAbilitiesPanel(hero: Hero, activeForm: ResolvedHeroForm): ExternalHero {
  return {
    id: hero.id,
    slug: hero.slug,
    name: hero.name,
    role: activeForm.role,
    summary: activeForm.summary,
    portraitImageUrl: activeForm.portraitImage,
    splashImageUrl: activeForm.splashImage,
    transformations: [
      {
        id: activeForm.id,
        name: activeForm.name,
        iconUrl: activeForm.portraitImage,
        health: `${activeForm.health}`,
        movementSpeed: "6m/s",
      },
    ],
    abilities: activeForm.abilities.map((ability) => ({
      name: ability.name,
      keybind: ability.keybind,
      type: ability.type,
      description: ability.description,
      damage: ability.damage,
      cooldownSeconds: ability.cooldownSeconds,
      iconUrl: ability.videoUrl,
      additionalFields: {
        Key: ability.keybind,
        ...(ability.damage ? { Damage: ability.damage } : {}),
        ...(ability.cooldownSeconds !== undefined
          ? { Cooldown: `${ability.cooldownSeconds}s` }
          : {}),
      },
    })),
  };
}
