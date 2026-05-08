import { cache } from "react";
import heroesJson from "@/data/heroes.json";
import { Hero, heroesSchema } from "@/data/schema";
import { ExternalHero, fetchMarvelRivalsHeroes } from "@/lib/api/marvel-rivals";
import { fetchYoutubeGuides } from "@/lib/api/youtube";
import { ContentSource } from "@/lib/external-provider-config";
import { featureFlags } from "@/lib/feature-flags";
import { getCachedPublishedHeroEditorial } from "@/lib/supabase/hero-editorial-cached";
import { mergeHeroWithEditorialPatch } from "@/lib/supabase/merge-hero-editorial";

const validatedHeroes = heroesSchema.parse(heroesJson);

type ExternalHeroMap = Map<string, ExternalHero>;

type HeroContentResult = {
  heroes: Hero[];
  source: ContentSource;
  lastSyncedAt?: string;
};

type AdapterDiagnostics = {
  source: ContentSource;
  reason: string;
  lastSyncedAt?: string;
};

let adapterDiagnostics: AdapterDiagnostics = {
  source: "local",
  reason: "initial-local-load",
};

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseHealth(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value.replace(/[^\d.]+/g, ""));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.round(parsed));
}

function parseCooldownSeconds(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replace(/[^\d.]+/g, ""));
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(0, parsed);
}

function deriveRole(externalHero: ExternalHero): Hero["role"] {
  const role = externalHero.role?.trim().toLowerCase();
  if (role === "vanguard" || role === "duelist" || role === "strategist") {
    return (role.charAt(0).toUpperCase() + role.slice(1)) as Hero["role"];
  }

  return "Duelist";
}

function mapExternalHeroToRuntimeHero(externalHero: ExternalHero): Hero {
  const role = deriveRole(externalHero);
  const slug = normalizeSlug(externalHero.slug ?? externalHero.name);
  const transformedForms =
    externalHero.transformations
      ?.map((form) => {
        const formAbilities =
          externalHero.abilities
            ?.filter((ability) => ability.transformationId === form.id)
            .map((ability) => ({
              id: `${slug}-${normalizeSlug(ability.name)}`,
              name: ability.name,
              keybind: ability.keybind ?? ability.additionalFields?.Key ?? "Passive",
              type: ability.type ?? "Ability",
              description: ability.description ?? "No description available yet.",
              damage: ability.damage ?? ability.additionalFields?.Damage,
              cooldownSeconds:
                ability.cooldownSeconds ??
                parseCooldownSeconds(ability.additionalFields?.Cooldown),
              videoUrl: ability.iconUrl,
            })) ?? [];

        return {
          id: `${slug}-${normalizeSlug(form.name)}`,
          name: form.name,
          shortLabel: form.name,
          trigger: "Transformation",
          role,
          health: parseHealth(form.health, 250),
          summary: externalHero.summary ?? `${externalHero.name} transformation profile.`,
          portraitImage: (form.iconUrl ?? externalHero.portraitImageUrl ?? "/heroes/captain-america-portrait.webp") as Hero["portraitImage"],
          splashImage: (externalHero.splashImageUrl ??
            externalHero.portraitImageUrl ??
            "/heroes/captain-america-splash.webp") as Hero["splashImage"],
          abilities: formAbilities,
        };
      })
      .filter((form) => form.abilities.length > 0) ?? [];

  const baseAbilities =
    externalHero.abilities?.map((ability) => ({
      id: `${slug}-${normalizeSlug(ability.name)}`,
      name: ability.name,
      keybind: ability.keybind ?? ability.additionalFields?.Key ?? "Passive",
      type: ability.type ?? "Ability",
      description: ability.description ?? "No description available yet.",
      damage: ability.damage ?? ability.additionalFields?.Damage,
      cooldownSeconds:
        ability.cooldownSeconds ?? parseCooldownSeconds(ability.additionalFields?.Cooldown),
      videoUrl: ability.iconUrl,
    })) ?? [];

  const resolvedAbilities =
    baseAbilities.length > 0
      ? baseAbilities
      : [
          {
            id: `${slug}-ability-1`,
            name: "Primary Ability",
            keybind: "LMB",
            type: "Ability",
            description: "Data source did not provide ability details yet.",
          },
        ];

  const today = new Date().toISOString().slice(0, 10);

  return {
    id: normalizeSlug(externalHero.id ?? externalHero.name),
    slug,
    name: externalHero.name,
    role,
    difficulty: Math.max(1, Math.min(5, Math.round(externalHero.difficulty ?? 3))),
    health: parseHealth(externalHero.transformations?.[0]?.health, 250),
    portraitImage: (externalHero.portraitImageUrl ??
      "/heroes/captain-america-portrait.webp") as Hero["portraitImage"],
    splashImage: (externalHero.splashImageUrl ??
      externalHero.portraitImageUrl ??
      "/heroes/captain-america-splash.webp") as Hero["splashImage"],
    summary: externalHero.summary ?? `${externalHero.name} tactical profile.`,
    abilities: resolvedAbilities,
    combos: [],
    synergies: [],
    playstyle: {
      overview: "Guide content is being expanded for this hero.",
      positioning: "Play around team sightlines and safe disengage routes.",
      targetPriority: ["Isolated targets", "Low mobility backline"],
      avoidPriority: ["Layered crowd control", "Crossfire choke points"],
    },
    externalResources: [],
    forms:
      transformedForms.length > 0
        ? transformedForms.map((form) => ({
            ...form,
            abilities:
              form.abilities.length > 0
                ? form.abilities
                : resolvedAbilities,
          }))
        : undefined,
    defaultFormId: transformedForms[0]?.id,
    updatedAt: externalHero.updatedAt?.slice(0, 10) ?? today,
  };
}

function mergeExternalHeroData(localHeroes: Hero[], externalHeroes: ExternalHeroMap): Hero[] {
  return localHeroes.map((hero) => {
    const externalHero = externalHeroes.get(hero.name.toLowerCase());
    if (!externalHero) {
      return hero;
    }

    const mergedAbilities =
      externalHero.abilities && externalHero.abilities.length > 0
        ? hero.abilities.map((ability) => {
            const externalAbility = externalHero.abilities?.find(
              (candidate) =>
                candidate.name.toLowerCase() === ability.name.toLowerCase(),
            );
            if (!externalAbility) {
              return ability;
            }

            return {
              ...ability,
              description: externalAbility.description ?? ability.description,
              type: externalAbility.type ?? ability.type,
              keybind: externalAbility.keybind ?? ability.keybind,
              damage: externalAbility.damage ?? ability.damage,
              cooldownSeconds:
                externalAbility.cooldownSeconds ?? ability.cooldownSeconds,
            };
          })
        : hero.abilities;

    return {
      ...hero,
      summary: externalHero.summary ?? hero.summary,
      updatedAt: externalHero.updatedAt ?? hero.updatedAt,
      abilities: mergedAbilities,
    };
  });
}

async function getExternalHeroMap(): Promise<ExternalHeroMap> {
  const externalHeroes = await fetchMarvelRivalsHeroes();
  return new Map(
    externalHeroes.map((hero) => [hero.name.toLowerCase(), hero]),
  );
}

async function getHeroesWithSource(): Promise<HeroContentResult> {
  if (!featureFlags.enableExternalApis) {
    adapterDiagnostics = {
      source: "local",
      reason: "external-apis-disabled",
    };
    return { heroes: validatedHeroes, source: "local" };
  }

  const preferApiContent = featureFlags.preferApiContent;
  if (!preferApiContent) {
    adapterDiagnostics = {
      source: "local",
      reason: "prefer-api-content-disabled",
    };
    return { heroes: validatedHeroes, source: "local" };
  }

  try {
    const externalHeroMap = await getExternalHeroMap();
    if (externalHeroMap.size === 0) {
      adapterDiagnostics = {
        source: "local",
        reason: "empty-external-hero-map",
      };
      return { heroes: validatedHeroes, source: "local" };
    }

    const mergedHeroes = mergeExternalHeroData(validatedHeroes, externalHeroMap);
    const parsed = heroesSchema.safeParse(mergedHeroes);
    if (!parsed.success) {
      adapterDiagnostics = {
        source: "local",
        reason: "external-merge-schema-failed",
      };
      return { heroes: validatedHeroes, source: "local" };
    }

    const lastSyncedAt = new Date().toISOString();
    adapterDiagnostics = {
      source: "api",
      reason: "external-merge-success",
      lastSyncedAt,
    };
    return { heroes: parsed.data, source: "api", lastSyncedAt };
  } catch {
    adapterDiagnostics = {
      source: "local",
      reason: "external-fetch-failed",
    };
    return { heroes: validatedHeroes, source: "local" };
  }
}

export function getContentAdapterDiagnostics(): AdapterDiagnostics {
  return adapterDiagnostics;
}

export async function getHeroes(): Promise<Hero[]> {
  const result = await getHeroesWithSource();
  return result.heroes;
}

async function resolveHeroBySlug(slug: string): Promise<Hero | undefined> {
  const result = await getHeroesWithSource();
  let hero: Hero | undefined = result.heroes.find(
    (candidate) => candidate.slug === slug,
  );

  if (!hero) {
    try {
      const externalHeroes = await fetchMarvelRivalsHeroes();
      const externalHero = externalHeroes.find((candidate) => {
        const candidateSlug = normalizeSlug(candidate.slug ?? candidate.name);
        return candidateSlug === slug;
      });

      if (!externalHero) {
        return undefined;
      }

      hero = mapExternalHeroToRuntimeHero(externalHero);
    } catch {
      return undefined;
    }
  }

  if (!hero) {
    return undefined;
  }

  if (featureFlags.enableExternalApis) {
    try {
      const videos = await fetchYoutubeGuides(`${hero.name} Marvel Rivals guide`);
      if (videos.length > 0) {
        hero = {
          ...hero,
          externalResources: [
            ...hero.externalResources,
            ...videos.map((video) => ({
              title: video.title,
              url: video.url,
              type: "youtube" as const,
            })),
          ],
        };
      }
    } catch {
      /* keep hero as-is when YouTube augmentation fails */
    }
  }

  if (featureFlags.enableSupabase) {
    const editorial = await getCachedPublishedHeroEditorial(hero.slug);
    if (editorial) {
      hero = mergeHeroWithEditorialPatch(hero, editorial);
    }
  }

  return hero;
}

export const getHeroBySlug = cache(resolveHeroBySlug);

export async function getHeroSlugs(): Promise<string[]> {
  const result = await getHeroesWithSource();
  return result.heroes.map((hero) => hero.slug);
}
