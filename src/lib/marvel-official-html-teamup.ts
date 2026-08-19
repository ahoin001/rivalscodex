/**
 * Team-Up-specific slices of official marvelrivals.com ability HTML.
 *
 * Partner portraits live in `.lxbox > a.lx-hero[data-lx]`. The site only
 * renders one partner's Base/Enhanced rows at a time; remaining paths need
 * a second paste after the operator clicks the other portrait.
 */

export type MarvelSiteTeamUpVariant = "base" | "enhanced";

export type MarvelSiteAvailableTeamUpPartner = {
  /** `data-lx` on `.lx-hero`. Marvel uses 0-indexed integers. */
  partnerIndex: number;
  /** Whether this portrait carried `class="on"` (selected when captured). */
  isActive: boolean;
  /** Portrait `img src`. Alts are typically empty on the live site. */
  portraitUrl: string | null;
};

export type MarvelSiteTeamUpDetailSplit = {
  /** Flattened full copy (always set when the span had text). */
  description: string | null;
  baseEffect: string | null;
  enhancedEffect: string | null;
  /** From "When teaming up with X" in the Enhanced (or full) copy. */
  partnerName: string | null;
};

function attrValue(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i");
  return tag.match(re)?.[1] ?? null;
}

function extractSrcs(html: string): string[] {
  return [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanText(value: string): string {
  return decodeHtmlEntities(stripHtmlTags(value));
}

function firstHeadingText(block: string): string {
  const heading = block.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)?.[1] ?? "";
  return cleanText(heading);
}

/** True when this `.skill-info` is a Team-Up Base/Enhanced block (`.lx-info` or variant heading). */
export function isTeamUpSkillInfoBlock(block: string): boolean {
  const openClass = block.match(/<div\b[^>]*class="([^"]*)"/i)?.[1] ?? "";
  if (/\blx-info\b/.test(openClass)) return true;
  const normalized = firstHeadingText(block).toLowerCase().replace(/\s+/g, " ");
  return (
    normalized === "base effect" ||
    normalized === "enhanced effect" ||
    normalized === "team-up abilities" ||
    normalized === "team up abilities"
  );
}

export function inferTeamUpVariantFromBlock(block: string): MarvelSiteTeamUpVariant {
  const normalized = firstHeadingText(block).toLowerCase().replace(/\s+/g, " ");
  if (normalized.includes("enhanced")) return "enhanced";
  if (normalized.includes("base effect") || normalized === "base") return "base";

  const dataTypeRaw = block.match(/<li\b[^>]*data-type="(\d+)"/i)?.[1];
  const dataType = dataTypeRaw ? Number.parseInt(dataTypeRaw, 10) : NaN;
  if (dataType === 32) return "enhanced";
  return "base";
}

export function extractAvailableTeamUpPartners(
  html: string,
): MarvelSiteAvailableTeamUpPartner[] {
  const partners: MarvelSiteAvailableTeamUpPartner[] = [];
  const seen = new Set<number>();
  const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRe.exec(html)) !== null) {
    const attrsText = match[1] ?? "";
    const innerHtml = match[2] ?? "";
    const classText = attrValue(`<a${attrsText}>`, "class") ?? "";
    if (!/\blx-hero\b/.test(classText)) continue;
    const dataLxRaw = attrValue(`<a${attrsText}>`, "data-lx");
    if (dataLxRaw === null) continue;
    const partnerIndex = Number.parseInt(dataLxRaw, 10);
    if (!Number.isFinite(partnerIndex) || seen.has(partnerIndex)) continue;
    seen.add(partnerIndex);
    partners.push({
      partnerIndex,
      isActive: /\bon\b/.test(classText),
      portraitUrl: extractSrcs(innerHtml)[0] ?? null,
    });
  }
  return partners.sort((a, b) => a.partnerIndex - b.partnerIndex);
}

export function inferPartnerNameFromDescription(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/when teaming up with\s+([^.,]+)/i);
  const name = match?.[1]?.replace(/\s+/g, " ").trim();
  return name && name.length > 0 ? name : null;
}

/**
 * Split a `.top-info span` inner HTML that concatenates Base Effect / Enhanced
 * Effect with a `<br>`. When the labels are absent, only `description` is set.
 */
export function splitTeamUpDetailCopy(descInnerHtml: string): MarvelSiteTeamUpDetailSplit {
  const labeled = /base\s*effect\s*:|enhanced\s*effect\s*:/i.test(descInnerHtml);
  const description = cleanText(descInnerHtml) || null;

  if (!labeled) {
    return {
      description,
      baseEffect: null,
      enhancedEffect: null,
      partnerName: inferPartnerNameFromDescription(description),
    };
  }

  const enhancedSplit = descInnerHtml.split(/enhanced\s*effect\s*:/i);
  const beforeEnhanced = enhancedSplit[0] ?? "";
  const afterEnhanced = enhancedSplit.slice(1).join("Enhanced Effect:");

  const baseRaw = beforeEnhanced.replace(/base\s*effect\s*:/i, "");
  const baseEffect = cleanText(baseRaw) || null;
  const enhancedEffect = cleanText(afterEnhanced) || null;

  return {
    description,
    baseEffect,
    enhancedEffect,
    partnerName:
      inferPartnerNameFromDescription(enhancedEffect) ??
      inferPartnerNameFromDescription(description),
  };
}

export function isTeamUpAbilityCategory(category: string | null | undefined): boolean {
  const haystack = (category ?? "").toLowerCase();
  return haystack.includes("team-up") || haystack.includes("team up");
}
