import type { ExternalHero } from "@/lib/api/marvel-rivals";

export type AbilitySectionId = "normal-attack" | "abilities" | "team-ups" | "passives";

export type AbilityViewModel = {
  id: string;
  name: string;
  key: string;
  keyDisplay: string;
  description: string;
  iconUrl?: string;
  category?: string;
  fields: Array<{
    label: string;
    value: string;
    prose?: boolean;
  }>;
};

export type AbilitySection = {
  id: AbilitySectionId;
  title: string;
  abilities: AbilityViewModel[];
};

const keyPriority = [
  "left click",
  "right click",
  "q",
  "shift",
  "e",
  "f",
  "c",
  "passive",
];

/**
 * Lab sandbox placeholder only. Not a runtime fallback for codex pages.
 */
export const demoHero: ExternalHero = {
  name: "Black Widow",
  summary:
    "Natasha Romanova is the world's most elite spy in any era. Her mastery of the sniper rifle eliminates targets from afar, while her shock batons neutralize close-range threats.",
  transformations: [
    {
      id: "0",
      name: "Black Widow",
      health: "250",
      movementSpeed: "6m/s",
    },
  ],
  abilities: [
    {
      name: "Widow's Bite Baton",
      type: "Weapon",
      keybind: "Left Click",
      description: "Strike with the enhanced electric batons.",
    },
    {
      name: "Red Room Rifle",
      type: "Weapon",
      keybind: "Left Click",
      description: "Unleash a barrage of bullets with the Red Room Rifle.",
    },
    {
      name: "Electro-plasma Explosion",
      type: "Ultimate",
      keybind: "Q",
      description: "Unleash an electro-plasma blast that applies vulnerability and slow.",
    },
    {
      name: "Fleet Foot",
      type: "Normal",
      keybind: "SHIFT",
      description: "Dash forward and enable a powerful jump.",
    },
    {
      name: "Edge Dancer",
      type: "Normal",
      keybind: "E",
      description: "Unleash a spinning kick and follow-up grapple kick.",
    },
    {
      name: "Pulse Rifle",
      type: "Normal",
      keybind: "C",
      isCollab: true,
      description: "Team-up pulse mode upgrade for the Red Room Rifle.",
    },
  ],
};

export function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1).toLowerCase())
    .join(" ");
}

export function formatStatLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeKey(rawKey: string | undefined): string {
  if (!rawKey) return "Passive";
  return rawKey.trim().toLowerCase();
}

function getKeyDisplay(rawKey: string | undefined): string {
  const normalized = normalizeKey(rawKey);
  if (normalized.includes("left click")) return "LMB";
  if (normalized.includes("right click")) return "RMB";
  if (normalized === "shift") return "SHIFT";
  if (normalized === "q" || normalized === "e" || normalized === "f" || normalized === "c") {
    return normalized.toUpperCase();
  }
  if (normalized === "passive") return "Passive";
  return rawKey ?? "Passive";
}

function toAbilityViewModel(
  hero: ExternalHero,
  ability: NonNullable<ExternalHero["abilities"]>[number],
): AbilityViewModel {
  const orderedStatFields =
    ability.stats
      ?.filter((stat) => {
        const label = stat.label.trim().toLowerCase();
        return label !== "key" && label !== "hotkey" && stat.value.trim().length > 0;
      })
      .map((stat) => ({ label: stat.label, value: stat.value })) ?? [];

  const additionalEntries = Object.entries(ability.additionalFields ?? {})
    .filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return normalizedKey !== "key" && normalizedKey !== "hotkey" && value.trim().length > 0;
    })
    .map(([key, value]) => ({ label: key, value }));

  const resolvedFields =
    orderedStatFields.length > 0
      ? orderedStatFields
      : additionalEntries.length > 0
        ? additionalEntries
        : [
            { label: "Type", value: ability.type ?? "Ability" },
            { label: "Hero", value: hero.name },
          ];

  const fields = resolvedFields.map((field) => {
    const label = field.label.trim().toLowerCase();
    return {
      ...field,
      prose: label === "base effect" || label === "enhanced effect",
    };
  });

  const keyRaw = ability.additionalFields?.Key ?? ability.keybind;
  const stableId = `${hero.name}-${ability.name}-${ability.transformationId ?? "base"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return {
    id: stableId,
    name: ability.name,
    key: normalizeKey(keyRaw),
    keyDisplay: getKeyDisplay(keyRaw),
    description: ability.description ?? "Ability details coming soon.",
    iconUrl: ability.iconUrl,
    category: ability.category,
    fields,
  };
}

function normalizedCategory(category: string | undefined): AbilitySectionId | null {
  if (!category) return null;
  const c = category.trim().toLowerCase();
  if (c.includes("normal attack")) return "normal-attack";
  if (c.includes("team-up") || c.includes("team up")) return "team-ups";
  if (c === "passive" || c.includes("passive abilities")) return "passives";
  if (c === "abilities") return "abilities";
  return null;
}

function heuristicCategory(ability: AbilityViewModel, rawType?: string): AbilitySectionId {
  if (ability.key.includes("left click") || ability.key.includes("right click")) {
    return "normal-attack";
  }
  const typeIsPassive = (rawType ?? "").toLowerCase().includes("passive");
  if (ability.key === "passive" || typeIsPassive) return "passives";
  if (ability.key === "c") return "team-ups";
  return "abilities";
}

export function buildSections(hero: ExternalHero): AbilitySection[] {
  const sourceAbilities = hero.abilities ?? [];
  const deduped = Array.from(
    new Map(
      sourceAbilities.map((ability) => [ability.name.trim().toLowerCase(), ability]),
    ).values(),
  );

  const buckets: Record<AbilitySectionId, AbilityViewModel[]> = {
    "normal-attack": [],
    abilities: [],
    "team-ups": [],
    passives: [],
  };

  for (const ability of deduped) {
    const view = toAbilityViewModel(hero, ability);
    const bucket = normalizedCategory(view.category) ?? heuristicCategory(view, ability.type);
    buckets[bucket].push(view);
  }

  const sortByKeyPriority = (left: AbilityViewModel, right: AbilityViewModel) => {
    const leftRank = keyPriority.indexOf(left.key);
    const rightRank = keyPriority.indexOf(right.key);
    const normalizedLeftRank = leftRank === -1 ? 99 : leftRank;
    const normalizedRightRank = rightRank === -1 ? 99 : rightRank;
    return normalizedLeftRank - normalizedRightRank || left.name.localeCompare(right.name);
  };

  return [
    {
      id: "normal-attack" as const,
      title: "Normal Attack",
      abilities: buckets["normal-attack"].sort((l, r) => l.key.localeCompare(r.key)),
    },
    { id: "abilities" as const, title: "Abilities", abilities: buckets.abilities.sort(sortByKeyPriority) },
    {
      id: "team-ups" as const,
      title: "Team-Up Abilities",
      abilities: buckets["team-ups"].sort(sortByKeyPriority),
    },
    {
      id: "passives" as const,
      title: "Passives",
      abilities: buckets.passives.sort((l, r) => l.name.localeCompare(r.name)),
    },
  ].filter((section) => section.abilities.length > 0);
}
