import { Hero, HeroForm } from "@/data/schema";

export type ResolvedHeroForm = {
  id: string;
  name: string;
  shortLabel?: string;
  trigger?: string;
  role: Hero["role"];
  health: number;
  summary: string;
  resource: Hero["resource"];
  portraitImage: Hero["portraitImage"];
  splashImage: Hero["splashImage"];
  abilities: Hero["abilities"];
};

function resolveForm(hero: Hero, form: HeroForm): ResolvedHeroForm {
  return {
    id: form.id,
    name: form.name,
    shortLabel: form.shortLabel,
    trigger: form.trigger,
    role: form.role ?? hero.role,
    health: form.health,
    summary: form.summary ?? hero.summary,
    resource: form.resource ?? hero.resource,
    portraitImage: form.portraitImage ?? hero.portraitImage,
    splashImage: form.splashImage ?? hero.splashImage,
    abilities: form.abilities,
  };
}

export function getResolvedHeroForms(hero: Hero): ResolvedHeroForm[] {
  if (!hero.forms || hero.forms.length === 0) {
    return [
      {
        id: "base-form",
        name: hero.name,
        role: hero.role,
        health: hero.health,
        summary: hero.summary,
        resource: hero.resource,
        portraitImage: hero.portraitImage,
        splashImage: hero.splashImage,
        abilities: hero.abilities,
      },
    ];
  }

  return hero.forms.map((form) => resolveForm(hero, form));
}

export function getDefaultResolvedFormId(hero: Hero): string {
  const forms = getResolvedHeroForms(hero);
  if (hero.defaultFormId) {
    const hasDefaultForm = forms.some((form) => form.id === hero.defaultFormId);
    if (hasDefaultForm) {
      return hero.defaultFormId;
    }
  }
  return forms[0].id;
}
