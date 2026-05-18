import type { HeroAbility } from "@/data/schema";

export type ResolvedAbilityRef = {
  name: string;
  keybind: string;
  iconUrl: string | undefined;
  keybindIconUrl: string | undefined;
  damage: string | undefined;
  cooldownSeconds: number | undefined;
  description: string;
  type: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build a Map keyed by slugified ability name for O(1) lookups.
 * Callers should memoize the result per hero to avoid rebuilding on every
 * combo chain render.
 */
export function buildAbilityLookup(
  abilities: HeroAbility[],
): Map<string, ResolvedAbilityRef> {
  const map = new Map<string, ResolvedAbilityRef>();

  for (const ability of abilities) {
    const slug = slugify(ability.name);
    map.set(slug, {
      name: ability.name,
      keybind: ability.keybind,
      iconUrl: ability.iconUrl,
      keybindIconUrl: ability.keybindIconUrl,
      damage: ability.damage,
      cooldownSeconds: ability.cooldownSeconds,
      description: ability.description,
      type: ability.type,
    });
  }

  return map;
}

/**
 * Resolve a single abilityRef string to full ability data.
 * The ref is matched by slugified name first, then by case-insensitive
 * substring as a fallback for loose references.
 */
export function resolveAbilityRef(
  ref: string,
  lookup: Map<string, ResolvedAbilityRef>,
): ResolvedAbilityRef | null {
  const slug = slugify(ref);
  const exact = lookup.get(slug);
  if (exact) return exact;

  const refLower = ref.toLowerCase().trim();
  for (const entry of lookup.values()) {
    if (entry.name.toLowerCase() === refLower) return entry;
  }

  for (const entry of lookup.values()) {
    if (entry.name.toLowerCase().includes(refLower)) return entry;
  }

  return null;
}

/**
 * Slugify helper exposed for admin components that need to generate
 * abilityRef values from ability names.
 */
export { slugify as slugifyAbilityName };
