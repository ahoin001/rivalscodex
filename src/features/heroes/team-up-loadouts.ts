import type { HeroAbility, HeroRole } from "@/data/schema";
import type { ExternalAbility } from "@/lib/api/marvel-rivals";
import catalogJson from "@/data/team-up-loadouts.json";
import {
  teamUpLoadoutCatalogSchema,
  type TeamUpLoadoutEntry,
} from "@/data/team-up-loadouts-schema";

const catalog = teamUpLoadoutCatalogSchema.parse(catalogJson);

const SLUG_ALIASES: Record<string, string> = {
  luna: "luna-snow",
  "luna-snow": "luna-snow",
  hulk: "hulk",
  "bruce-banner": "hulk",
  "cloak-dagger": "cloak-and-dagger",
  "cloak-and-dagger": "cloak-and-dagger",
  "mr-fantastic": "mister-fantastic",
  "mister-fantastic": "mister-fantastic",
  "jeff": "jeff-the-land-shark",
  "jeff-the-land-shark": "jeff-the-land-shark",
  punisher: "the-punisher",
  "the-punisher": "the-punisher",
  thing: "the-thing",
  "the-thing": "the-thing",
  hood: "the-hood",
  "the-hood": "the-hood",
};

export function canonicalHeroSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return SLUG_ALIASES[normalized] ?? normalized;
}

export function getTeamUpLoadoutCatalog() {
  return catalog;
}

export function getTeamUpLoadoutsForHero(
  slug: string,
  role?: HeroRole,
): TeamUpLoadoutEntry[] {
  const ownerSlug = canonicalHeroSlug(slug);
  const matches = catalog.loadouts.filter((entry) => entry.ownerSlug === ownerSlug);
  if (!role) return matches;
  const roleMatches = matches.filter((entry) => entry.ownerRole === role);
  return roleMatches.length > 0 ? roleMatches : matches;
}

function isTeamUpAbility(ability: { category?: string; type?: string }): boolean {
  const haystack = `${ability.category ?? ""} ${ability.type ?? ""}`.toLowerCase();
  return haystack.includes("team-up") || haystack.includes("team up");
}

function slugifyAbilityName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function catalogTeamUpStats(entry: TeamUpLoadoutEntry) {
  return [
    { label: "Partner", value: entry.partnerName },
    { label: "Base Effect", value: entry.baseEffect },
    { label: "Enhanced Effect", value: entry.enhancedEffect },
  ];
}

export function catalogEntryToHeroAbility(entry: TeamUpLoadoutEntry): HeroAbility {
  return {
    id: `${entry.ownerSlug}-${slugifyAbilityName(entry.name)}`,
    name: entry.name,
    keybind: entry.keybind ?? "C",
    type: "Team-Up Abilities",
    category: "Team-Up Abilities",
    description: `Team-Up with ${entry.partnerName}.`,
    iconUrl: entry.iconUrl,
    stats: catalogTeamUpStats(entry),
  };
}

export function overlayCatalogTeamUpAbilities(
  abilities: HeroAbility[],
  slug: string,
  role?: HeroRole,
): HeroAbility[] {
  if (abilities.some(isTeamUpAbility)) return abilities;
  const loadouts = getTeamUpLoadoutsForHero(slug, role);
  if (loadouts.length === 0) return abilities;

  const kept = abilities.filter((ability) => !isTeamUpAbility(ability));
  const catalogAbilities = loadouts.map(catalogEntryToHeroAbility);
  return [...kept, ...catalogAbilities];
}

export function overlayCatalogTeamUpExternalAbilities(
  abilities: ExternalAbility[] | undefined,
  slug: string | undefined,
  role?: string,
): ExternalAbility[] | undefined {
  if (!slug) return abilities;
  if ((abilities ?? []).some(isTeamUpAbility)) return abilities;
  const normalizedRole =
    role === "Vanguard" || role === "Duelist" || role === "Strategist" ? role : undefined;
  const loadouts = getTeamUpLoadoutsForHero(slug, normalizedRole);
  if (loadouts.length === 0) return abilities;

  const kept = (abilities ?? []).filter((ability) => !isTeamUpAbility(ability));
  const catalogAbilities: ExternalAbility[] = loadouts.map((entry) => ({
    name: entry.name,
    keybind: entry.keybind ?? "C",
    type: "Team-Up Abilities",
    category: "Team-Up Abilities",
    description: `Team-Up with ${entry.partnerName}.`,
    iconUrl: entry.iconUrl,
    stats: catalogTeamUpStats(entry),
  }));
  return [...kept, ...catalogAbilities];
}

export function catalogEntriesToGuideBlocks(entries: TeamUpLoadoutEntry[]) {
  return entries.map((entry, index) => ({
    type: "loadout" as const,
    name: entry.name,
    baseEffect: entry.baseEffect,
    enhancedEffect: entry.enhancedEffect,
    partnerSlug: entry.partnerSlug,
    partnerName: entry.partnerName,
    soloQueueDefault: index === 0,
  }));
}
