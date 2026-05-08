import heroesJson from "@/data/heroes.json";
import { Hero, heroesSchema } from "@/data/schema";
import { ExternalHero, fetchMarvelRivalsHeroes } from "@/lib/api/marvel-rivals";
import { fetchYoutubeGuides } from "@/lib/api/youtube";
import { ContentSource } from "@/lib/external-provider-config";
import { featureFlags } from "@/lib/feature-flags";

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

export async function getHeroBySlug(slug: string): Promise<Hero | undefined> {
  const result = await getHeroesWithSource();
  const hero = result.heroes.find((candidate) => candidate.slug === slug);

  if (!hero) {
    return undefined;
  }

  if (!featureFlags.enableExternalApis) {
    return hero;
  }

  try {
    const videos = await fetchYoutubeGuides(`${hero.name} Marvel Rivals guide`);
    if (videos.length === 0) {
      return hero;
    }

    return {
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
  } catch {
    return hero;
  }
}

export async function getHeroSlugs(): Promise<string[]> {
  const result = await getHeroesWithSource();
  return result.heroes.map((hero) => hero.slug);
}
