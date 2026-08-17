import type {
  HeroGuideBlock,
  HeroGuideTabContent,
  HeroGuideTabId,
} from "@/features/heroes/hero-guide-schema";
import { HERO_GUIDE_TAB_ORDER } from "@/features/heroes/hero-guide-schema";

function normalizeTabLabel(id: HeroGuideTabId): string {
  switch (id) {
    case "overview":
      return "Gameplan";
    case "abilities":
      return "Kit & Mechanics";
    case "loadouts":
      return "Loadouts";
    case "combos":
      return "Combos";
    case "matchups":
      return "Matchups";
    case "resources":
      return "Resources";
    case "notes":
      return "Personal Notes";
  }
}

function coerceTabLabel(id: HeroGuideTabId, label: string | undefined): string {
  const trimmed = label?.trim() ?? "";
  if (id === "overview" && (trimmed.length === 0 || /^overview/i.test(trimmed))) {
    return "Gameplan";
  }
  return trimmed || normalizeTabLabel(id);
}

function asMatchup(block: HeroGuideBlock): block is Extract<HeroGuideBlock, { type: "matchup" }> {
  return block.type === "matchup";
}

function asLoadout(block: HeroGuideBlock): block is Extract<HeroGuideBlock, { type: "loadout" }> {
  return block.type === "loadout";
}

function extractMatchupsFromBody(body: HeroGuideBlock[] | undefined): {
  strippedBody: HeroGuideBlock[] | undefined;
  extracted: Extract<HeroGuideBlock, { type: "matchup" }>[];
} {
  if (!body || body.length === 0) {
    return { strippedBody: body, extracted: [] };
  }
  const extracted = body.filter(asMatchup);
  if (extracted.length === 0) {
    return { strippedBody: body, extracted };
  }
  const strippedBody = body.filter((b) => b.type !== "matchup");
  return { strippedBody: strippedBody.length > 0 ? strippedBody : undefined, extracted };
}

function mergeUniqueLinks(
  primary: HeroGuideTabContent["links"],
  extra: HeroGuideTabContent["links"],
): HeroGuideTabContent["links"] {
  const merged = [...(primary ?? []), ...(extra ?? [])];
  if (merged.length === 0) return undefined;
  const seen = new Set<string>();
  const unique = merged.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
  return unique.slice(0, 12);
}

/**
 * Compatibility migration for older guide payloads:
 * - Merge legacy `playstyle` tab into `overview`
 * - Fold `resources` into `overview` (links + body + cues)
 * - Pull matchup blocks from overview/abilities/combos/playstyle into `matchups`
 * - Normalize labels to the current IA
 */
export function migrateHeroGuideTabs(input: HeroGuideTabContent[]): HeroGuideTabContent[] {
  const byId = new Map(input.map((tab) => [tab.id, { ...tab }]));

  const legacyPlaystyle = byId.get("playstyle" as HeroGuideTabId);
  const overview = byId.get("overview");

  if (legacyPlaystyle) {
    const mergedSummary = overview?.summary?.trim()
      ? overview.summary
      : legacyPlaystyle.summary;

    const overviewBody = overview?.body ?? [];
    const playstyleBody = legacyPlaystyle.body ?? [];
    const mergedBody = [...overviewBody, ...playstyleBody];

    byId.set("overview", {
      id: "overview",
      label: normalizeTabLabel("overview"),
      summary: mergedSummary,
      primaryPoints: overview?.primaryPoints ?? legacyPlaystyle.primaryPoints,
      secondaryPoints: overview?.secondaryPoints ?? legacyPlaystyle.secondaryPoints,
      links: overview?.links,
      body: mergedBody.length > 0 ? mergedBody : overview?.body,
    });
  }

  const legacyResources = byId.get("resources");
  if (legacyResources) {
    const currentOverview = byId.get("overview");
    const mergedBody = [...(currentOverview?.body ?? []), ...(legacyResources.body ?? [])];
    const mergedPrimary = [
      ...(currentOverview?.primaryPoints ?? []),
      ...(legacyResources.primaryPoints ?? []),
    ].slice(0, 20);
    const mergedSecondary = [
      ...(currentOverview?.secondaryPoints ?? []),
      ...(legacyResources.secondaryPoints ?? []),
    ].slice(0, 20);

    byId.set("overview", {
      id: "overview",
      label: currentOverview?.label?.trim()
        ? currentOverview.label
        : normalizeTabLabel("overview"),
      summary: currentOverview?.summary ?? legacyResources.summary,
      primaryPoints: mergedPrimary.length > 0 ? mergedPrimary : undefined,
      secondaryPoints: mergedSecondary.length > 0 ? mergedSecondary : undefined,
      links: mergeUniqueLinks(currentOverview?.links, legacyResources.links),
      body: mergedBody.length > 0 ? mergedBody : currentOverview?.body,
    });
    byId.delete("resources");
  }

  const candidateTabs: HeroGuideTabId[] = ["overview", "abilities", "combos", "matchups", "loadouts"];
  const extractedMatchups: Extract<HeroGuideBlock, { type: "matchup" }>[] = [];

  for (const id of candidateTabs) {
    const tab = byId.get(id);
    if (!tab) continue;
    const { strippedBody, extracted } = extractMatchupsFromBody(tab.body);
    if (extracted.length > 0) {
      extractedMatchups.push(...extracted);
      byId.set(id, { ...tab, body: strippedBody });
    }
  }

  const matchupsTab = byId.get("matchups");
  if (extractedMatchups.length > 0) {
    const existing = matchupsTab?.body?.filter(asMatchup) ?? [];
    byId.set("matchups", {
      id: "matchups",
      label: normalizeTabLabel("matchups"),
      summary:
        matchupsTab?.summary ??
        "Quickly scan favorable, even, and dangerous matchups before queueing.",
      primaryPoints: matchupsTab?.primaryPoints,
      secondaryPoints: matchupsTab?.secondaryPoints,
      links: matchupsTab?.links,
      body: [...existing, ...extractedMatchups],
    });
  }

  if (!byId.has("loadouts")) {
    const strayLoadouts = (byId.get("overview")?.body ?? []).filter(asLoadout);
    byId.set("loadouts", {
      id: "loadouts",
      label: normalizeTabLabel("loadouts"),
      summary: "Pick a Team-Up loadout for solo queue value, then swap in spawn if your partner is present.",
      body: strayLoadouts.length > 0 ? strayLoadouts : [],
    });
    if (strayLoadouts.length > 0) {
      const overviewTab = byId.get("overview");
      if (overviewTab?.body) {
        byId.set("overview", {
          ...overviewTab,
          body: overviewTab.body.filter((block) => block.type !== "loadout"),
        });
      }
    }
  }

  const result: HeroGuideTabContent[] = [];
  for (const id of HERO_GUIDE_TAB_ORDER) {
    const tab = byId.get(id);
    if (!tab) continue;
    result.push({
      ...tab,
      id,
      label: coerceTabLabel(id, tab.label),
    });
  }
  return result;
}
