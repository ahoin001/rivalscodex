import type { HeroAbility } from "@/data/schema";
import {
  buildAbilityLookup,
  slugifyAbilityName,
  type ResolvedAbilityRef,
} from "@/features/heroes/ability-lookup";

/** Stable abilityRef for the universal melee step in combo chains. */
export const MELEE_ABILITY_REF = "melee";

/** Every hero can press V (melee) independently of their LMB kit. Combo-only — not on the ability page. */
export const DEFAULT_MELEE_ABILITY: ResolvedAbilityRef = {
  name: "Melee",
  keybind: "V",
  iconUrl: undefined,
  keybindIconUrl: undefined,
  damage: undefined,
  cooldownSeconds: undefined,
  description: "Universal melee attack available to every hero (default V on PC).",
  type: "Melee",
};

function heroAlreadyHasMeleeSlug(abilities: HeroAbility[]): boolean {
  return abilities.some(
    (a) =>
      slugifyAbilityName(a.name) === MELEE_ABILITY_REF ||
      a.id === MELEE_ABILITY_REF,
  );
}

/**
 * Builds the ability lookup used by combo builder / chain display, including
 * synthetic kit entries that are not shown on the hero abilities panel.
 */
export function buildComboAbilityLookup(
  abilities: HeroAbility[],
): Map<string, ResolvedAbilityRef> {
  const map = buildAbilityLookup(abilities);

  if (!heroAlreadyHasMeleeSlug(abilities)) {
    map.set(MELEE_ABILITY_REF, DEFAULT_MELEE_ABILITY);
  }

  return map;
}
