import type { ComboStep } from "@/data/schema";
import type {
  HeroGuideBlock,
  HeroGuideTabContent,
} from "@/features/heroes/hero-guide-schema";
import { heroGuideTabsSchema } from "@/features/heroes/hero-guide-schema";

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeClip(clip: unknown): { label: string; href: string } | undefined {
  if (!clip || typeof clip !== "object") return undefined;
  const c = clip as Record<string, unknown>;
  const href = typeof c.href === "string" ? c.href.trim() : "";
  const label = typeof c.label === "string" ? c.label.trim() : "";
  if (!isValidUrl(href) || label.length < 1) return undefined;
  return { label: label.slice(0, 120), href };
}

function structuredStepToText(step: ComboStep): string {
  if (step.kind === "action") {
    const repeat = step.repeat && step.repeat > 1 ? ` ×${step.repeat}` : "";
    return `${step.label}${repeat}`;
  }
  const repeat = step.repeat && step.repeat > 1 ? ` ×${step.repeat}` : "";
  return `${step.abilityRef}${repeat}`;
}

function sanitizeComboBlock(block: Record<string, unknown>): Record<string, unknown> {
  const next = { ...block };
  const name = typeof next.name === "string" ? next.name.trim() : "";
  next.name = name.length > 0 ? name.slice(0, 120) : "Unnamed combo";

  const structuredSteps = Array.isArray(next.structuredSteps)
    ? next.structuredSteps
    : undefined;

  let steps = Array.isArray(next.steps)
    ? next.steps
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 400))
    : [];

  if (steps.length === 0 && structuredSteps && structuredSteps.length > 0) {
    steps = structuredSteps.map((s) =>
      structuredStepToText(s as ComboStep).slice(0, 400),
    );
  }

  if (steps.length === 0) {
    steps = ["Step 1"];
  }

  next.steps = steps.slice(0, 12);

  const clip = sanitizeClip(next.clip);
  if (clip) {
    next.clip = clip;
  } else {
    delete next.clip;
  }

  if (typeof next.condition === "string") {
    const condition = next.condition.trim();
    if (condition) next.condition = condition.slice(0, 500);
    else delete next.condition;
  }

  if (typeof next.notes === "string") {
    const notes = next.notes.trim();
    if (notes) next.notes = notes.slice(0, 800);
    else delete next.notes;
  }

  return next;
}

function sanitizeBlock(block: unknown): unknown {
  if (!block || typeof block !== "object") return block;
  const b = block as Record<string, unknown>;
  const type = b.type;

  if (type === "combo") {
    return sanitizeComboBlock(b);
  }

  if (type === "matchup") {
    const clip = sanitizeClip(b.clip);
    const next = { ...b };
    if (
      next.disposition !== "target" &&
      next.disposition !== "even" &&
      next.disposition !== "threat"
    ) {
      next.disposition = "threat";
    }
    if (clip) next.clip = clip;
    else delete next.clip;
    return next;
  }

  if (type === "abilityTip") {
    const clip = sanitizeClip(b.clip);
    const next = { ...b };
    const abilityRef = typeof next.abilityRef === "string" ? next.abilityRef.trim() : "";
    next.abilityRef = abilityRef || "ability-ref";
    const body = typeof next.body === "string" ? next.body.trim() : "";
    next.body = body || "Add practical guidance for this ability.";
    if (typeof next.title === "string") {
      const title = next.title.trim();
      if (title) next.title = title.slice(0, 120);
      else delete next.title;
    }
    if (Array.isArray(next.tags)) {
      const tags = next.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 4);
      if (tags.length > 0) next.tags = tags;
      else delete next.tags;
    }
    if (clip) next.clip = clip;
    else delete next.clip;
    return next;
  }

  if (type === "video") {
    const watchUrl = typeof b.watchUrl === "string" ? b.watchUrl.trim() : "";
    if (!isValidUrl(watchUrl)) {
      return null;
    }
    const next: Record<string, unknown> = { ...b, watchUrl };
    const title = typeof next.title === "string" ? next.title.trim() : "";
    next.title = title.length > 0 ? title.slice(0, 160) : "Video";
    if (typeof next.note === "string") {
      const note = next.note.trim();
      if (note) next.note = note.slice(0, 500);
      else delete next.note;
    }
    return next;
  }

  if (type === "strengthsWeaknesses") {
    const next = { ...b };
    const sanitizeItems = (items: unknown) => {
      if (!Array.isArray(items)) return [];
      return items
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => {
          const title = typeof item.title === "string" ? item.title.trim() : "";
          const detail = typeof item.detail === "string" ? item.detail.trim() : "";
          if (title.length < 1) return null;
          return {
            title: title.slice(0, 160),
            ...(detail ? { detail: detail.slice(0, 900) } : {}),
          };
        })
        .filter(Boolean)
        .slice(0, 8);
    };

    const strengths = sanitizeItems(next.strengths);
    const weaknesses = sanitizeItems(next.weaknesses);
    if (strengths.length < 1 || weaknesses.length < 1) return null;

    next.strengths = strengths;
    next.weaknesses = weaknesses;

    if (typeof next.title === "string") {
      const title = next.title.trim();
      if (title) next.title = title.slice(0, 120);
      else delete next.title;
    }

    return next;
  }

  return block;
}

function sanitizeTab(tab: unknown): unknown {
  if (!tab || typeof tab !== "object") return tab;
  const t = tab as Record<string, unknown>;
  const next = { ...t };

  if (Array.isArray(next.links)) {
    const links = next.links
      .filter((link): link is Record<string, unknown> => !!link && typeof link === "object")
      .map((link) => {
        const label = typeof link.label === "string" ? link.label.trim() : "";
        const href = typeof link.href === "string" ? link.href.trim() : "";
        if (label.length < 1 || !isValidUrl(href)) return null;
        return { label: label.slice(0, 120), href };
      })
      .filter(Boolean);
    if (links.length > 0) next.links = links;
    else delete next.links;
  }

  if (Array.isArray(next.body)) {
    const body = next.body
      .map((block) => sanitizeBlock(block))
      .filter((block): block is HeroGuideBlock => block !== null);
    if (body.length > 0) next.body = body;
    else delete next.body;
  }

  const primaryLen = Array.isArray(next.primaryPoints) ? next.primaryPoints.length : 0;
  const bodyLen = Array.isArray(next.body) ? next.body.length : 0;
  if (primaryLen < 1 && bodyLen < 1) {
    next.primaryPoints = ["Add content for this tab."];
  }

  return next;
}

/** Best-effort cleanup of stored guide JSON before Zod parse. */
export function sanitizeHeroGuideTabsCandidate(candidate: unknown): unknown {
  if (!Array.isArray(candidate)) return candidate;
  return candidate.map((tab) => sanitizeTab(tab));
}

export function sanitizeAndParseHeroGuideTabs(
  candidate: unknown,
): HeroGuideTabContent[] | null {
  const sanitized = sanitizeHeroGuideTabsCandidate(candidate);
  const parsed = heroGuideTabsSchema.safeParse(sanitized);
  return parsed.success ? parsed.data : null;
}

export function countComboBlocksInTabs(tabs: HeroGuideTabContent[]): number {
  const combosTab = tabs.find((t) => t.id === "combos");
  return combosTab?.body?.filter((b) => b.type === "combo").length ?? 0;
}
