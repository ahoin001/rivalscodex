import type { Hero } from "@/data/schema";

function mergePlaystyle(
  base: Hero["playstyle"],
  raw: unknown,
): Hero["playstyle"] {
  if (raw == null || typeof raw !== "object") {
    return base;
  }

  const patch = raw as Record<string, unknown>;

  return {
    overview:
      typeof patch.overview === "string" ? patch.overview : base.overview,
    positioning:
      typeof patch.positioning === "string"
        ? patch.positioning
        : base.positioning,
    targetPriority: Array.isArray(patch.targetPriority)
      ? patch.targetPriority.filter((item): item is string => typeof item === "string")
      : base.targetPriority,
    avoidPriority: Array.isArray(patch.avoidPriority)
      ? patch.avoidPriority.filter((item): item is string => typeof item === "string")
      : base.avoidPriority,
  };
}

/**
 * Safely merges a Supabase `content` JSON blob onto a hero.
 * Unknown keys are ignored; partial playstyle is shallow-merged.
 */
export function mergeHeroWithEditorialPatch(hero: Hero, raw: unknown): Hero {
  if (raw == null || typeof raw !== "object") {
    return hero;
  }

  const patch = raw as Record<string, unknown>;

  return {
    ...hero,
    playstyle: mergePlaystyle(hero.playstyle, patch.playstyle),
    combos: Array.isArray(patch.combos) ? (patch.combos as Hero["combos"]) : hero.combos,
    synergies: Array.isArray(patch.synergies)
      ? (patch.synergies as Hero["synergies"])
      : hero.synergies,
    externalResources: Array.isArray(patch.externalResources)
      ? (patch.externalResources as Hero["externalResources"])
      : hero.externalResources,
  };
}
