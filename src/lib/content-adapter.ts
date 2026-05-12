import { cache } from "react";
import { Hero } from "@/data/schema";
import { fetchYoutubeGuides } from "@/lib/api/youtube";
import { ContentSource } from "@/lib/external-provider-config";
import { featureFlags } from "@/lib/feature-flags";
import {
  getCachedHeroCodexAll,
  getCachedHeroCodexBySlug,
} from "@/lib/supabase/hero-codex-cached";
import { getCachedPublishedHeroEditorial } from "@/lib/supabase/hero-editorial-cached";
import { mergeHeroWithEditorialPatch } from "@/lib/supabase/merge-hero-editorial";

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
  source: "codex",
  reason: "initial-codex-load",
};

async function getCodexHeroes(): Promise<Hero[] | null> {
  if (!featureFlags.enableSupabase) {
    throw new Error("Supabase is required for codex-only mode.");
  }
  return getCachedHeroCodexAll();
}

async function getHeroesWithSource(): Promise<HeroContentResult> {
  const codexHeroes = await getCodexHeroes();
  if (codexHeroes && codexHeroes.length > 0) {
    const lastSyncedAt = new Date().toISOString();
    adapterDiagnostics = {
      source: "codex",
      reason: "hero-codex-rows",
      lastSyncedAt,
    };
    return { heroes: codexHeroes, source: "codex", lastSyncedAt };
  }

  adapterDiagnostics = {
    source: "codex",
    reason: codexHeroes === null ? "codex-unavailable" : "codex-empty",
  };
  throw new Error("No codex heroes available.");
}

export function getContentAdapterDiagnostics(): AdapterDiagnostics {
  return adapterDiagnostics;
}

export async function getHeroes(): Promise<Hero[]> {
  const result = await getHeroesWithSource();
  return result.heroes;
}

async function augmentHeroWithExternals(hero: Hero): Promise<Hero> {
  let augmented = hero;
  if (featureFlags.enableExternalApis) {
    try {
      const videos = await fetchYoutubeGuides(`${hero.name} Marvel Rivals guide`);
      if (videos.length > 0) {
        augmented = {
          ...augmented,
          externalResources: [
            ...augmented.externalResources,
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
    const editorial = await getCachedPublishedHeroEditorial(augmented.slug);
    if (editorial) {
      augmented = mergeHeroWithEditorialPatch(augmented, editorial);
    }
  }

  return augmented;
}

async function resolveHeroBySlug(slug: string): Promise<Hero | undefined> {
  if (!featureFlags.enableSupabase) {
    throw new Error("Supabase is required for codex-only mode.");
  }

  const codexHero = await getCachedHeroCodexBySlug(slug);
  if (!codexHero) {
    return undefined;
  }

  return augmentHeroWithExternals(codexHero);
}

export const getHeroBySlug = cache(resolveHeroBySlug);

export async function getHeroSlugs(): Promise<string[]> {
  const result = await getHeroesWithSource();
  return result.heroes.map((hero) => hero.slug);
}
