import type { MarvelSiteAbilityDetailParseResult } from "@/lib/marvel-official-html";
import { getTeamUpLoadoutsForHero } from "@/features/heroes/team-up-loadouts";
import type {
  MarvelImportAbility,
  MarvelImportAbilityDetail,
  MarvelImportFormDraft,
  MarvelImportTeamUpPath,
} from "./marvel-import-types";
import { isImportTeamUpAbility } from "./marvel-import-types";
import type { MarvelSiteAvailableTeamUpPartner } from "@/lib/marvel-official-html-teamup";

export function splitKitAndTeamUpAbilities(abilities: MarvelImportAbility[]): {
  kit: MarvelImportAbility[];
  teamUps: MarvelImportAbility[];
} {
  const kit: MarvelImportAbility[] = [];
  const teamUps: MarvelImportAbility[] = [];
  for (const ability of abilities) {
    if (isImportTeamUpAbility(ability)) teamUps.push(ability);
    else kit.push(ability);
  }
  return { kit, teamUps };
}

function emptyPath(partner: MarvelSiteAvailableTeamUpPartner): MarvelImportTeamUpPath {
  return {
    partnerIndex: partner.partnerIndex,
    portraitUrl: partner.portraitUrl ?? undefined,
    partnerName: undefined,
    pasteHtml: "",
    abilities: [],
    details: {},
    detailMessages: {},
    parseWarnings: [],
  };
}

function detailFromCopy(
  description: string | null | undefined,
  stats: MarvelImportAbilityDetail["stats"],
): MarvelImportAbilityDetail | undefined {
  const text = description?.trim() ?? "";
  if (!text && stats.length === 0) return undefined;
  return { description: text, stats };
}

/**
 * Apply an open `.jnsx` block onto skeleton rows. Team-Up details that carry
 * both Base and Enhanced copy fill matching variant rows in one pass.
 */
export function applyOpenDetailToAbilities(
  abilities: MarvelImportAbility[],
  openDetail: MarvelSiteAbilityDetailParseResult | null,
): {
  details: MarvelImportFormDraft["details"];
  messages: MarvelImportFormDraft["detailMessages"];
} {
  if (!openDetail?.name) {
    return { details: {}, messages: {} };
  }

  const target = openDetail.name.trim().toLowerCase();
  const hasSplit = Boolean(openDetail.baseEffect || openDetail.enhancedEffect);
  const details: MarvelImportFormDraft["details"] = {};
  const messages: MarvelImportFormDraft["detailMessages"] = {};

  if (hasSplit) {
    for (let index = 0; index < abilities.length; index++) {
      const ability = abilities[index];
      if (ability.name.trim().toLowerCase() !== target) continue;
      if (ability.teamUpVariant === "enhanced") {
        const detail = detailFromCopy(openDetail.enhancedEffect, openDetail.stats);
        if (detail) {
          details[index] = detail;
          messages[index] = "Filled Enhanced Effect from the open detail panel.";
        }
      } else if (ability.teamUpVariant === "base") {
        const detail = detailFromCopy(openDetail.baseEffect, openDetail.stats);
        if (detail) {
          details[index] = detail;
          messages[index] = "Filled Base Effect from the open detail panel.";
        }
      }
    }
    if (Object.keys(details).length > 0) {
      return { details, messages };
    }
  }

  const idx = abilities.findIndex(
    (ability) => ability.name.trim().toLowerCase() === target,
  );
  if (idx === -1) {
    return { details: {}, messages: {} };
  }
  return {
    details: {
      [idx]: {
        description: openDetail.description ?? "",
        stats: openDetail.stats,
      },
    },
    messages: {},
  };
}

function catalogPartnerName(
  heroSlug: string,
  abilityName: string | undefined,
): string | undefined {
  if (!heroSlug || !abilityName) return undefined;
  const matches = getTeamUpLoadoutsForHero(heroSlug).filter(
    (entry) => entry.name.trim().toLowerCase() === abilityName.trim().toLowerCase(),
  );
  if (matches.length === 1) return matches[0].partnerName;
  return undefined;
}

function resolvePartnerName(args: {
  existing?: string;
  inferred?: string | null;
  heroSlug: string;
  abilityName?: string;
}): string | undefined {
  const existing = args.existing?.trim();
  if (existing) return existing;
  const inferred = args.inferred?.trim();
  if (inferred) return inferred;
  return catalogPartnerName(args.heroSlug, args.abilityName);
}

export function mergeTeamUpPathsFromParse(args: {
  existing: MarvelImportTeamUpPath[];
  partners: MarvelSiteAvailableTeamUpPartner[];
  parsedTeamUps: MarvelImportAbility[];
  openDetail: MarvelSiteAbilityDetailParseResult | null;
  pasteHtml: string;
  heroSlug: string;
  /** When set, only this path is overwritten; others are preserved. */
  targetPartnerIndex?: number;
}): MarvelImportTeamUpPath[] {
  const {
    existing,
    partners,
    parsedTeamUps,
    openDetail,
    pasteHtml,
    heroSlug,
    targetPartnerIndex,
  } = args;

  const activeFromHtml =
    partners.find((partner) => partner.isActive)?.partnerIndex ??
    parsedTeamUps.find((ability) => ability.partnerIndex != null)?.partnerIndex ??
    targetPartnerIndex;

  const partnerList =
    partners.length > 0
      ? partners
      : parsedTeamUps.length > 0
        ? [
            {
              partnerIndex: activeFromHtml ?? 0,
              isActive: true,
              portraitUrl: parsedTeamUps[0]?.partnerPortraitUrl ?? null,
            } satisfies MarvelSiteAvailableTeamUpPartner,
          ]
        : existing.map((path) => ({
            partnerIndex: path.partnerIndex,
            isActive: false,
            portraitUrl: path.portraitUrl ?? null,
          }));

  if (partnerList.length === 0) return existing;

  const existingByIndex = new Map(existing.map((path) => [path.partnerIndex, path]));
  const fillIndex = activeFromHtml ?? targetPartnerIndex;
  const rollup = applyOpenDetailToAbilities(parsedTeamUps, openDetail);
  const inferredName =
    openDetail?.partnerName ??
    parsedTeamUps.find((ability) => ability.partnerName)?.partnerName ??
    null;
  const abilityName = parsedTeamUps[0]?.name;

  return partnerList.map((partner) => {
    const prior = existingByIndex.get(partner.partnerIndex);
    const shouldFill =
      parsedTeamUps.length > 0 &&
      fillIndex != null &&
      partner.partnerIndex === fillIndex;

    if (!shouldFill) {
      if (prior) return prior;
      return {
        ...emptyPath(partner),
        partnerName: resolvePartnerName({
          existing: undefined,
          inferred: null,
          heroSlug,
          abilityName,
        }),
      };
    }

    return {
      partnerIndex: partner.partnerIndex,
      portraitUrl: partner.portraitUrl ?? prior?.portraitUrl,
      partnerName: resolvePartnerName({
        existing: prior?.partnerName,
        inferred: inferredName,
        heroSlug,
        abilityName,
      }),
      pasteHtml,
      abilities: parsedTeamUps,
      details: rollup.details,
      detailMessages: rollup.messages,
      parseWarnings: [],
    };
  });
}

export function applyTeamUpDetailPaste(
  path: MarvelImportTeamUpPath,
  abilityIndex: number,
  parsed: MarvelSiteAbilityDetailParseResult,
): MarvelImportTeamUpPath {
  const hasSplit = Boolean(parsed.baseEffect || parsed.enhancedEffect);
  const details = { ...path.details };
  const messages = { ...path.detailMessages };
  const targetName = (parsed.name ?? path.abilities[abilityIndex]?.name ?? "")
    .trim()
    .toLowerCase();

  if (hasSplit && targetName) {
    for (let index = 0; index < path.abilities.length; index++) {
      const ability = path.abilities[index];
      if (ability.name.trim().toLowerCase() !== targetName) continue;
      if (ability.teamUpVariant === "enhanced" && parsed.enhancedEffect) {
        details[index] = {
          description: parsed.enhancedEffect,
          stats: parsed.stats,
        };
        messages[index] =
          parsed.warnings.length > 0
            ? parsed.warnings.join(" ")
            : "Filled Enhanced Effect from this paste.";
      } else if (ability.teamUpVariant === "base" && parsed.baseEffect) {
        details[index] = {
          description: parsed.baseEffect,
          stats: parsed.stats,
        };
        messages[index] =
          parsed.warnings.length > 0
            ? parsed.warnings.join(" ")
            : "Filled Base Effect from this paste.";
      }
    }
  } else {
    details[abilityIndex] = {
      description: parsed.description ?? "",
      stats: parsed.stats,
    };
    messages[abilityIndex] =
      parsed.warnings.length > 0
        ? parsed.warnings.join(" ")
        : `Parsed ${parsed.stats.length} stat rows.`;
  }

  const partnerName = resolvePartnerName({
    existing: path.partnerName,
    inferred: parsed.partnerName,
    heroSlug: "",
    abilityName: path.abilities[0]?.name,
  });

  return {
    ...path,
    partnerName,
    details,
    detailMessages: messages,
    abilities: path.abilities.map((ability) =>
      parsed.partnerName && isImportTeamUpAbility(ability)
        ? { ...ability, partnerName: parsed.partnerName }
        : ability,
    ),
  };
}

const LAYER_STAT_LABELS = new Set(["partner", "base effect", "enhanced effect"]);

export function collapseTeamUpPathToAbilityInput(path: MarvelImportTeamUpPath): {
  name: string;
  category: string;
  keybind?: string;
  keybindText?: string;
  keybindIconUrl?: string | null;
  iconUrl?: string | null;
  siteOrder?: number | null;
  partnerName?: string;
  partnerIndex?: number;
  description: string;
  stats: { label: string; value: string }[];
} | null {
  if (path.abilities.length === 0) return null;

  const base =
    path.abilities.find((ability) => ability.teamUpVariant === "base") ??
    path.abilities[0];
  const enhanced = path.abilities.find((ability) => ability.teamUpVariant === "enhanced");
  const baseIndex = path.abilities.indexOf(base);
  const enhancedIndex = enhanced ? path.abilities.indexOf(enhanced) : -1;
  const baseDetail = path.details[baseIndex];
  const enhancedDetail = enhancedIndex >= 0 ? path.details[enhancedIndex] : undefined;

  const partnerName =
    path.partnerName?.trim() ||
    base.partnerName?.trim() ||
    "Unknown partner";

  const extraStats = (baseDetail?.stats ?? enhancedDetail?.stats ?? []).filter(
    (stat) => !LAYER_STAT_LABELS.has(stat.label.trim().toLowerCase()),
  );

  const stats: { label: string; value: string }[] = [
    { label: "Partner", value: partnerName },
  ];
  if (baseDetail?.description?.trim()) {
    stats.push({ label: "Base Effect", value: baseDetail.description.trim() });
  }
  if (enhancedDetail?.description?.trim()) {
    stats.push({ label: "Enhanced Effect", value: enhancedDetail.description.trim() });
  }
  stats.push(...extraStats);

  return {
    name: base.name,
    category: "Team-Up Abilities",
    keybind: base.keybind ?? undefined,
    keybindText: base.keybindText ?? undefined,
    keybindIconUrl: base.keybindIconUrl ?? undefined,
    iconUrl: base.iconUrl ?? undefined,
    siteOrder: base.siteOrder ?? undefined,
    partnerName,
    partnerIndex: path.partnerIndex,
    description: `Team-Up with ${partnerName}.`,
    stats,
  };
}

export function countCapturedTeamUpDetails(paths: MarvelImportTeamUpPath[]): {
  total: number;
  captured: number;
} {
  let total = 0;
  let captured = 0;
  for (const path of paths) {
    total += path.abilities.length;
    for (let index = 0; index < path.abilities.length; index++) {
      const detail = path.details[index];
      if (detail && (detail.description || detail.stats.length > 0)) captured += 1;
    }
  }
  return { total, captured };
}
