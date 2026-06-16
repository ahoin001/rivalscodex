import type {
  HeroGuideBlock,
  HeroGuideTabContent,
  HeroGuideTabId,
} from "@/features/heroes/hero-guide-schema";
import { HERO_GUIDE_TAB_ORDER } from "@/features/heroes/hero-guide-schema";

function normalizeTabLabel(id: HeroGuideTabId): string {
  switch (id) {
    case "overview":
      return "Overview & Playstyle";
    case "abilities":
      return "Kit & Mechanics";
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

function asMatchup(block: HeroGuideBlock): block is Extract<HeroGuideBlock, { type: "matchup" }> {
  return block.type === "matchup";
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

/**
 * Compatibility migration for older guide payloads:
 * - Merge legacy `playstyle` tab into `overview`
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

  const candidateTabs: HeroGuideTabId[] = ["overview", "abilities", "combos", "matchups"];
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

  const result: HeroGuideTabContent[] = [];
  for (const id of HERO_GUIDE_TAB_ORDER) {
    const tab = byId.get(id);
    if (!tab) continue;
    result.push({
      ...tab,
      id,
      label: tab.label?.trim() ? tab.label : normalizeTabLabel(id),
    });
  }
  return result;
}

