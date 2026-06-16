import type { Hero } from "@/data/schema";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { heroAssetPaths } from "@/lib/rivals-assets-paths";

/**
 * Build roster entries from the full hero codex — used for matchup resolution and editor pickers.
 */
export function buildHeroPortraitEntries(heroes: Hero[]): HeroPortraitEntry[] {
  return heroes.map((hero) => {
    const paths = heroAssetPaths(hero.slug);
    const aliases: string[] = [];
    if (hero.realName) {
      aliases.push(hero.realName);
    }
    return {
      slug: hero.slug,
      name: hero.name,
      role: hero.role,
      portraitUrl: hero.portraitImage,
      stackLogoUrl: hero.stackLogoImage ?? paths.stackLogoImage,
      ...(aliases.length > 0 ? { aliases } : {}),
    };
  });
}

export function resolveHeroRosterEntry(
  opponent: string,
  heroes: HeroPortraitEntry[],
): HeroPortraitEntry | undefined {
  const lookup = buildPortraitLookup(heroes);
  if (!lookup) return undefined;
  return findPortraitByOpponent(lookup, opponent);
}

export function filterHeroRoster(
  query: string,
  heroes: HeroPortraitEntry[],
  options?: { limit?: number },
): HeroPortraitEntry[] {
  const limit = options?.limit ?? 12;
  const q = query.trim().toLowerCase();
  const qCompact = normalizeHeroSearchText(q);
  const pool = heroes;

  if (!q) {
    return [...pool].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
  }

  const scored = pool
    .map((hero) => {
      const name = hero.name.toLowerCase();
      const slug = hero.slug;
      const compactHaystack = heroSearchHaystack(hero);
      const aliasHits = (hero.aliases ?? []).some((a) =>
        normalizeHeroSearchText(a).includes(qCompact),
      );

      if (name === q || slug === q || compactHaystack === qCompact) return { hero, rank: 0 };
      if (
        name.startsWith(q) ||
        slug.startsWith(q.replace(/\s+/g, "-")) ||
        compactHaystack.startsWith(qCompact)
      ) {
        return { hero, rank: 1 };
      }
      if (
        name.includes(q) ||
        slug.includes(q.replace(/\s+/g, "-")) ||
        compactHaystack.includes(qCompact) ||
        aliasHits
      ) {
        return { hero, rank: 2 };
      }
      return { hero, rank: 99 };
    })
    .filter((entry) => entry.rank < 99)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.hero.name.localeCompare(b.hero.name);
    });

  return scored.slice(0, limit).map((entry) => entry.hero);
}

function normalizeHeroSearchText(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

function heroSearchHaystack(hero: HeroPortraitEntry): string {
  return normalizeHeroSearchText(
    [hero.name, hero.slug.replace(/-/g, " "), ...(hero.aliases ?? [])].join(" "),
  );
}

/**
 * Build a portrait lookup Map keyed by lowercased opponent name, slug, and aliases.
 */
export function buildPortraitLookup(
  portraits: HeroPortraitEntry[] | undefined,
): Map<string, HeroPortraitEntry> | null {
  if (!portraits || portraits.length === 0) return null;
  const map = new Map<string, HeroPortraitEntry>();
  for (const p of portraits) {
    map.set(p.name.toLowerCase(), p);
    map.set(p.slug, p);
    map.set(p.slug.replace(/-/g, " "), p);
    for (const alias of p.aliases ?? []) {
      map.set(alias.toLowerCase(), p);
    }
  }
  return map;
}

export function findPortraitByOpponent(
  lookup: Map<string, HeroPortraitEntry> | null,
  opponentName: string,
): HeroPortraitEntry | undefined {
  if (!lookup) return undefined;
  const lower = opponentName.toLowerCase().trim();
  return (
    lookup.get(lower) ??
    lookup.get(lower.replace(/\s+/g, "-")) ??
    lookup.get(lower.replace(/-/g, " "))
  );
}

/** @deprecated Use resolveHeroRosterEntry */
export function findHeroPortrait(
  heroes: Hero[],
  opponentName: string,
): HeroPortraitEntry | undefined {
  return resolveHeroRosterEntry(opponentName, buildHeroPortraitEntries(heroes));
}
