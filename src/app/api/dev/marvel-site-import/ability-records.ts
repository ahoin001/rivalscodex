import type { HeroAbility, HeroAbilityStat } from "@/data/schema";
import {
  canonicalKeybindIconWebPath,
  normalizeKeybindText,
  resolveCanonicalKeybindIcon,
} from "@/lib/marvel-keybind-icons";
import { normalizeMarvelSlug } from "@/lib/marvel-official-html";
import type { AbilityInput } from "./schemas";
import {
  downloadAbilityIcon,
  downloadKeybindIcon,
  type AssetDownloadLedger,
} from "./assets";

function deriveCooldownSeconds(rawValue: string): number | undefined {
  const match = rawValue.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return undefined;
  const num = Number(match[1]);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

export function applyKnownStatLabels(
  ability: HeroAbility,
  stats: HeroAbilityStat[],
): HeroAbility {
  let damage = ability.damage;
  let cooldown = ability.cooldownSeconds;
  for (const stat of stats) {
    const label = stat.label.trim().toUpperCase();
    if (!damage && /\bDAMAGE\b/.test(label)) {
      damage = stat.value;
    }
    if (cooldown === undefined && /\bCOOLDOWN\b/.test(label)) {
      cooldown = deriveCooldownSeconds(stat.value);
    }
  }
  return {
    ...ability,
    damage,
    cooldownSeconds: cooldown,
    stats,
  };
}

export function buildAbilityRecord(args: {
  heroSlug: string;
  ability: AbilityInput;
  iconWebPath?: string;
  keybindIconWebPath?: string;
  needsKeybindSuffix?: boolean;
  formId?: string;
}): HeroAbility {
  const {
    heroSlug,
    ability,
    iconWebPath,
    keybindIconWebPath,
    needsKeybindSuffix,
    formId,
  } = args;
  const abilitySlug = normalizeMarvelSlug(ability.name);
  const keybind =
    normalizeKeybindText(ability.keybind ?? null) ??
    normalizeKeybindText(ability.keybindText ?? null) ??
    "Passive";

  const trimmedDescription = ability.description?.trim();
  const inlineStats = ability.stats?.filter(
    (stat) => stat.label.trim().length > 0 && stat.value.length > 0,
  );

  const partnerKey = ability.partnerName?.trim()
    ? normalizeMarvelSlug(ability.partnerName)
    : typeof ability.partnerIndex === "number"
      ? `partner-${ability.partnerIndex}`
      : "";
  const partnerSuffix = partnerKey ? `-${partnerKey}` : "";
  const idSuffix = needsKeybindSuffix
    ? `-${normalizeMarvelSlug(keybind) || "alt"}`
    : "";
  const formPrefix = formId ? `${formId}-` : "";
  const id = `${heroSlug}-${formPrefix}${abilitySlug}${partnerSuffix}${idSuffix}`;

  const base: HeroAbility = {
    id,
    name: ability.name,
    keybind,
    type: ability.category ?? "Ability",
    description: trimmedDescription || "Ability description pending detail capture.",
    category: ability.category,
    iconUrl: iconWebPath,
    keybindIconUrl: keybindIconWebPath,
    siteOrder: ability.siteOrder ?? undefined,
    siteFormIndex: ability.siteFormIndex ?? undefined,
  };

  if (!inlineStats || inlineStats.length === 0) {
    return base;
  }
  return applyKnownStatLabels(base, inlineStats);
}

export async function buildAbilitiesFromInput(args: {
  heroSlug: string;
  formId?: string;
  abilityInputs: AbilityInput[];
  ledger: AssetDownloadLedger;
  warnings: string[];
  forceRefresh?: boolean;
}): Promise<HeroAbility[]> {
  const { heroSlug, formId, abilityInputs, ledger, warnings, forceRefresh = false } = args;

  const duplicateNameKeys = new Set<string>();
  const seenNameKeys = new Set<string>();
  for (const ability of abilityInputs) {
    const nameKey = ability.name.trim().toLowerCase();
    if (seenNameKeys.has(nameKey)) {
      duplicateNameKeys.add(nameKey);
    } else {
      seenNameKeys.add(nameKey);
    }
  }

  const results: HeroAbility[] = [];
  for (const ability of abilityInputs) {
    let iconWebPath: string | undefined;
    let keybindIconWebPath: string | undefined;

    if (ability.iconUrl) {
      try {
        const abilitySlug = normalizeMarvelSlug(ability.name);
        iconWebPath = await downloadAbilityIcon(
          ability.iconUrl,
          heroSlug,
          abilitySlug,
          ledger,
          formId,
          forceRefresh,
        );
      } catch (error) {
        warnings.push(
          `Failed to download icon for "${ability.name}"${formId ? ` (form ${formId})` : ""}: ${
            error instanceof Error ? error.message : "unknown"
          }`,
        );
      }
    }

    if (ability.keybindIconUrl) {
      try {
        const canonical = resolveCanonicalKeybindIcon(ability.keybindIconUrl);
        if (canonical) {
          keybindIconWebPath = canonicalKeybindIconWebPath(canonical);
        }
        const downloaded = await downloadKeybindIcon(
          ability.keybindIconUrl,
          ledger,
          forceRefresh,
        );
        keybindIconWebPath = keybindIconWebPath ?? downloaded;
      } catch (error) {
        warnings.push(
          `Failed to download keybind icon for "${ability.name}"${formId ? ` (form ${formId})` : ""}: ${
            error instanceof Error ? error.message : "unknown"
          }`,
        );
      }
    }

    const nameKey = ability.name.trim().toLowerCase();
    results.push(
      buildAbilityRecord({
        heroSlug,
        ability,
        iconWebPath,
        keybindIconWebPath,
        needsKeybindSuffix: duplicateNameKeys.has(nameKey),
        formId,
      }),
    );
  }
  return results;
}
