import type { HeroRole } from "@/data/schema";
import {
  normalizeKeybindText,
  resolveCanonicalKeybindIcon,
} from "@/lib/marvel-keybind-icons";

/** Matches [`normalizeSlug`](src/lib/content-adapter.ts) for stable hero folder / JSON ids. */
export function normalizeMarvelSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleCaseHeroName(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return "";
  }

  const parts = cleaned.split(/([\s'-]+)/);
  return parts
    .map((part, index) => {
      if (/^[\s'-]+$/.test(part)) {
        return part;
      }

      // A segment that follows an apostrophe-only separator (e.g. the `s` in
      // "Devil's", "Assassin's") should stay lowercase rather than become its
      // own capitalized word. Hyphens still produce capitalized segments
      // ("Spider-Man"), and whitespace always does.
      const previousSeparator = index > 0 ? parts[index - 1] : "";
      const followsApostropheOnly =
        previousSeparator !== "" && /^'+$/.test(previousSeparator);
      if (followsApostropheOnly) {
        return part.toLowerCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

export function normalizeMarvelSiteRole(raw: string | null | undefined): HeroRole | null {
  if (!raw) {
    return null;
  }

  const key = raw.trim().toUpperCase();
  if (key === "VANGUARD") {
    return "Vanguard";
  }
  if (key === "DUELIST") {
    return "Duelist";
  }
  if (key === "STRATEGIST") {
    return "Strategist";
  }

  const lower = raw.trim().toLowerCase();
  if (lower === "vanguard" || lower === "duelist" || lower === "strategist") {
    return (lower.charAt(0).toUpperCase() + lower.slice(1)) as HeroRole;
  }

  return null;
}

export type MarvelSiteImageUrls = {
  frame: string | null;
  heroImage: string | null;
  stackLogo: string | null;
};

export type MarvelSiteParseResult = {
  roleRaw: string | null;
  role: HeroRole | null;
  codeNameRaw: string | null;
  /** Display name (title-cased from nick). */
  name: string | null;
  realName: string | null;
  intro: string | null;
  urls: MarvelSiteImageUrls;
  suggestedSlug: string | null;
  warnings: string[];
};

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractFirstMatch(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? null;
}

/**
 * Parses Marvel Rivals official hero page HTML (fragment or full document).
 * Selectors follow live site markup: `.hero-career`, `.hero-nick`, `.hero-name`, `.jyImg`, `.icon-hz`.
 */
export function parseMarvelOfficialHeroHtml(html: string): MarvelSiteParseResult {
  const warnings: string[] = [];

  if (!html.trim()) {
    warnings.push("HTML is empty.");
    return {
      roleRaw: null,
      role: null,
      codeNameRaw: null,
      name: null,
      realName: null,
      intro: null,
      urls: { frame: null, heroImage: null, stackLogo: null },
      suggestedSlug: null,
      warnings,
    };
  }

  const roleRaw =
    extractFirstMatch(html, /class="hero-career"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/i) ??
    extractFirstMatch(html, /hero-career[\s\S]*?<span[^>]*>([^<]*)<\/span>/i);

  const role = normalizeMarvelSiteRole(roleRaw);
  if (roleRaw && !role) {
    warnings.push(`Unrecognized role text: "${roleRaw}".`);
  }

  const codeNameRaw =
    extractFirstMatch(html, /<div[^>]*class="[^"]*hero-nick[^"]*"[^>]*>([^<]*)<\/div>/i) ??
    extractFirstMatch(html, /class="hero-nick"[^>]*>([^<]*)<\/div>/i);

  const name = codeNameRaw ? titleCaseHeroName(codeNameRaw) : null;

  const realNameRaw =
    extractFirstMatch(html, /class="hero-name"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/i) ??
    extractFirstMatch(html, /hero-name[\s\S]*?<span[^>]*>([^<]*)<\/span>/i);

  const realName = realNameRaw ? titleCaseHeroName(realNameRaw) : null;

  const pInIntro = html.match(
    /hero-intro[\s\S]*?scroll-box[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
  );
  let intro = pInIntro?.[1] ? stripHtmlTags(pInIntro[1]) : null;
  if (!intro) {
    const fallbackP = html.match(/hero-intro[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    intro = fallbackP?.[1] ? stripHtmlTags(fallbackP[1]) : null;
  }

  let frame: string | null = null;
  let heroImage: string | null = null;
  const jyMatch = html.match(/class="jyImg"[^>]*>([\s\S]*?)<\/div>/i);
  if (jyMatch?.[1]) {
    const srcs = [...jyMatch[1].matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
    frame = srcs[0] ?? null;
    heroImage = srcs[1] ?? null;
    if (srcs.length === 0) {
      warnings.push("Found .jyImg but no img[src] entries.");
    } else if (srcs.length === 1) {
      warnings.push("Only one image under .jyImg; expected frame + hero art.");
    }
  } else {
    warnings.push("Could not find .jyImg block.");
  }

  const stackMatch = html.match(/class="icon-hz"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i);
  const stackLogo = stackMatch?.[1] ?? null;
  if (!stackLogo) {
    warnings.push("Could not find stack logo (.icon-hz img).");
  }

  const suggestedSlug = codeNameRaw ? normalizeMarvelSlug(codeNameRaw) : null;

  if (!codeNameRaw) {
    warnings.push("Could not find .hero-nick.");
  }
  if (!realNameRaw) {
    warnings.push("Could not find .hero-name span.");
  }
  if (!intro) {
    warnings.push("Could not find intro paragraph under .hero-intro .scroll-box.");
  }

  return {
    roleRaw,
    role,
    codeNameRaw,
    name,
    realName,
    intro,
    urls: { frame, heroImage, stackLogo },
    suggestedSlug,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Ability list parser (`.skill-scroll > .scroll-box > .skill-info > ul > li`)
// ---------------------------------------------------------------------------

export type MarvelSiteAbilityStat = {
  label: string;
  value: string;
};

export type MarvelSiteAbilityCategory =
  | "Normal Attack"
  | "Abilities"
  | "Team-Up Abilities"
  | "Passive";

export type MarvelSiteAbility = {
  /** Site's `<li data-type="…">` value; useful for deterministic ordering and merging. */
  siteOrder: number | null;
  /** Verbatim h5 text (title-cased). Known values fold into `MarvelSiteAbilityCategory`. */
  category: string;
  /** Display name (title-cased) from `<p class="tag2">…`. */
  name: string;
  /** Raw text content of `.tag1` (e.g. "Q", "SHIFT", or empty when icon-only). */
  keybindText: string | null;
  /** Resolved keybind label after icon and text normalization (e.g. "LMB", "Q"). */
  keybind: string | null;
  /** Remote URL of the shared keybind icon (only present when `.tag1` rendered an img). */
  keybindIconUrl: string | null;
  /** Remote URL of the ability art under `.skill-info li .img > img`. */
  iconUrl: string | null;
};

export type MarvelSiteAbilityDetailParseResult = {
  /** Title-cased ability name pulled from `.jnsx-top h3`. */
  name: string | null;
  /** Long-form description from `.top-info span`. */
  description: string | null;
  /** Ordered key/value rows from `.sx-all.sx2-all .scroll-box .sxz`. */
  stats: MarvelSiteAbilityStat[];
  warnings: string[];
};

export type MarvelSiteBaseStatsParseResult = {
  stats: MarvelSiteAbilityStat[];
  warnings: string[];
};

export type MarvelSiteAbilitiesParseResult = {
  abilities: MarvelSiteAbility[];
  /** Embedded `.abilties-r.jnsx.on` detail (if the main paste had one open). */
  openDetail: MarvelSiteAbilityDetailParseResult | null;
  /** `.abilties-r.jcsx` Base Stats block when present on the full page paste. */
  baseStats: MarvelSiteBaseStatsParseResult | null;
  warnings: string[];
};

const SKILL_INFO_CATEGORY_MAP: Record<string, MarvelSiteAbilityCategory> = {
  "normal attack": "Normal Attack",
  abilities: "Abilities",
  "team-up abilities": "Team-Up Abilities",
  "team up abilities": "Team-Up Abilities",
  passive: "Passive",
  "passive abilities": "Passive",
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

function cleanText(value: string): string {
  return decodeHtmlEntities(stripHtmlTags(value));
}

/**
 * Slice every `<div class="skill-info">…</div>` block. We can't rely on a single regex with
 * a balanced-matching `</div>` (skill-info wraps a `<ul>` containing nested `<div class="img">`),
 * so we walk the string and balance opening / closing `<div>` tags after each match.
 */
function sliceSkillInfoBlocks(html: string): string[] {
  const blocks: string[] = [];
  const openRe = /<div\s+class="skill-info"[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = openRe.exec(html)) !== null) {
    const start = match.index;
    let depth = 1;
    let cursor = openRe.lastIndex;
    const innerRe = /<\/?div\b[^>]*>/gi;
    innerRe.lastIndex = cursor;
    let inner: RegExpExecArray | null;
    while ((inner = innerRe.exec(html)) !== null) {
      cursor = inner.index + inner[0].length;
      if (inner[0].startsWith("</")) {
        depth -= 1;
        if (depth === 0) break;
      } else {
        depth += 1;
      }
    }
    if (depth !== 0) {
      blocks.push(html.slice(start));
      break;
    }
    blocks.push(html.slice(start, cursor));
    openRe.lastIndex = cursor;
  }
  return blocks;
}

/** Same balanced-walk approach for any opening tag. */
function sliceBalancedDiv(html: string, openMatchIndex: number, openLen: number): string {
  let depth = 1;
  let cursor = openMatchIndex + openLen;
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = cursor;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    cursor = m.index + m[0].length;
    if (m[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0) return html.slice(openMatchIndex, cursor);
    } else {
      depth += 1;
    }
  }
  return html.slice(openMatchIndex);
}

function parseSkillInfoCategory(block: string, warnings: string[]): string {
  const heading = block.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)?.[1] ?? "";
  const text = cleanText(heading);
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  const mapped = SKILL_INFO_CATEGORY_MAP[normalized];
  if (mapped) return mapped;
  if (text) {
    warnings.push(`Unknown ability category heading: "${text}".`);
    return titleCaseHeroName(text);
  }
  warnings.push("Found .skill-info without an <h5> heading.");
  return "Abilities";
}

function extractLiBlocks(ulHtml: string): string[] {
  return [...ulHtml.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)].map(
    (m) => `<li${m[1]}>${m[2]}</li>`,
  );
}

function parseAbilityLi(
  liHtml: string,
  category: string,
  warnings: string[],
): MarvelSiteAbility | null {
  const openTag = liHtml.match(/<li\b[^>]*>/i)?.[0] ?? "";
  const dataTypeRaw = attrValue(openTag, "data-type");
  const siteOrder = dataTypeRaw ? Number.parseInt(dataTypeRaw, 10) : null;

  const tag1Match = liHtml.match(
    /<p[^>]*class="[^"]*\btag1\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
  );
  let keybindText: string | null = null;
  let keybindIconUrl: string | null = null;
  let resolvedKeybind: string | null = null;
  if (tag1Match?.[1]) {
    const tag1Inner = tag1Match[1];
    const innerImgSrc = extractSrcs(tag1Inner)[0] ?? null;
    if (innerImgSrc) {
      keybindIconUrl = innerImgSrc;
      const canonical = resolveCanonicalKeybindIcon(innerImgSrc);
      if (canonical) {
        resolvedKeybind = canonical.keybind;
      } else {
        warnings.push(`Unknown keybind icon URL: ${innerImgSrc}.`);
      }
    } else {
      const text = cleanText(tag1Inner);
      if (text) {
        keybindText = text;
        resolvedKeybind = normalizeKeybindText(text);
      }
    }
  }

  const imgDivMatch = liHtml.match(
    /<div[^>]*class="[^"]*\bimg\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  const iconUrl = imgDivMatch?.[1]
    ? (extractSrcs(imgDivMatch[1])[0] ?? null)
    : null;

  const tag2Match = liHtml.match(
    /<p[^>]*class="[^"]*\btag2\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
  );
  const tag2Raw = tag2Match?.[1] ? cleanText(tag2Match[1]) : "";
  const nameFromTag2 = tag2Raw ? titleCaseHeroName(tag2Raw) : "";
  const altName = imgDivMatch?.[1]
    ? (imgDivMatch[1].match(/<img[^>]+alt="([^"]+)"/i)?.[1] ?? null)
    : null;
  const name = nameFromTag2 || (altName ? titleCaseHeroName(altName) : "");

  if (!name) {
    warnings.push(`Skipping ability under "${category}" with no name (.tag2 missing).`);
    return null;
  }

  return {
    siteOrder: Number.isFinite(siteOrder) ? (siteOrder as number) : null,
    category,
    name,
    keybindText,
    keybind: resolvedKeybind,
    keybindIconUrl,
    iconUrl,
  };
}

/**
 * Walk `.sxz` rows inside an already-sliced `.sx-all…` outer HTML fragment.
 */
function extractSxzRowsFromSxAllOuterHtml(sxAllOuter: string): MarvelSiteAbilityStat[] {
  const stats: MarvelSiteAbilityStat[] = [];
  const sxzOpenRe = /<div[^>]*class="[^"]*\bsxz\b[^"]*"[^>]*>/gi;
  let openMatch: RegExpExecArray | null;
  while ((openMatch = sxzOpenRe.exec(sxAllOuter)) !== null) {
    const sxz = sliceBalancedDiv(sxAllOuter, openMatch.index, openMatch[0].length);
    sxzOpenRe.lastIndex = openMatch.index + sxz.length;
    const inner = sxz.replace(/^<div[^>]*>/i, "").replace(/<\/div>$/i, "");
    const label = inner.match(/<div[^>]*>([\s\S]*?)<\/div>/i)?.[1];
    const valueSpan = inner.match(
      /<span[^>]*class="[^"]*\bnum\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    )?.[1];
    let value = "";
    if (valueSpan) {
      const imgAlt = valueSpan.match(/<img[^>]+alt="([^"]*)"/i)?.[1];
      const imgSrc = valueSpan.match(/<img[^>]+src="([^"]+)"/i)?.[1];
      if (imgAlt && imgAlt.trim()) {
        value = imgAlt.trim();
      } else if (imgSrc) {
        const canonical = resolveCanonicalKeybindIcon(imgSrc);
        value = canonical?.keybind ?? imgSrc;
      } else {
        value = cleanText(valueSpan);
      }
    }
    const labelText = label ? cleanText(label) : "";
    if (labelText) {
      stats.push({ label: labelText, value });
    }
  }
  return stats;
}

/**
 * Pull ordered `.sxz` rows from inside a `.sx-all…` container (matches opening tag via `sxAllOpenRe`).
 */
function extractSxzStatRowsFromSxAllDiv(
  blockHtml: string,
  sxAllOpenRe: RegExp,
): MarvelSiteAbilityStat[] {
  const sxAllMatch = blockHtml.match(sxAllOpenRe);
  if (!sxAllMatch || sxAllMatch.index === undefined) {
    return [];
  }
  const sxBlock = sliceBalancedDiv(blockHtml, sxAllMatch.index, sxAllMatch[0].length);
  return extractSxzRowsFromSxAllOuterHtml(sxBlock);
}

const SX_ALL_SX2_OPEN_RE = /<div[^>]*class="[^"]*\bsx-all\b[^"]*\bsx2-all\b[^"]*"[^>]*>/i;
const SX_ALL_SX1_OPEN_RE = /<div[^>]*class="[^"]*\bsx-all\b[^"]*\bsx1-all\b[^"]*"[^>]*>/i;

/**
 * Extract the `<div class="abilties-r jcsx …">…</div>` block (prefers `.on` panel when present).
 */
function findOpenBaseStatsBlock(html: string): string | null {
  const reOn = /<div\s+class="abilties-r\s+jcsx[^"]*\bon\b[^"]*"[^>]*>/gi;
  const onMatch = reOn.exec(html);
  if (onMatch) {
    return sliceBalancedDiv(html, onMatch.index, onMatch[0].length);
  }
  const re = /<div\s+class="abilties-r\s+jcsx[^"]*"[^>]*>/gi;
  const m = re.exec(html);
  if (!m) return null;
  return sliceBalancedDiv(html, m.index, m[0].length);
}

export function parseMarvelOfficialBaseStatsBlock(
  blockHtml: string,
): MarvelSiteBaseStatsParseResult {
  const warnings: string[] = [];

  const basicHeading = blockHtml.match(
    /<h3[^>]*class="[^"]*\bbasic\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/i,
  )?.[1];
  const basicText = basicHeading ? cleanText(basicHeading).toLowerCase().replace(/\s+/g, " ") : "";
  if (!basicText.includes("base") || !basicText.includes("stat")) {
    warnings.push(
      'Base stats block: expected h3.basic heading containing "Base Stats" (site markup may have changed).',
    );
  }

  let stats = extractSxzStatRowsFromSxAllDiv(blockHtml, SX_ALL_SX1_OPEN_RE);
  if (stats.length === 0) {
    stats = extractSxzStatRowsFromSxAllDiv(blockHtml, SX_ALL_SX2_OPEN_RE);
  }
  if (stats.length === 0) {
    const loose = blockHtml.match(/<div[^>]*class="[^"]*\bsx-all\b[^"]*"[^>]*>/i);
    if (loose?.index !== undefined) {
      const sxOuter = sliceBalancedDiv(blockHtml, loose.index, loose[0].length);
      stats = extractSxzRowsFromSxAllOuterHtml(sxOuter);
    }
  }

  if (stats.length === 0) {
    warnings.push("Base stats block had no .sx-all .sxz stat rows.");
  }

  return { stats, warnings };
}

/** Parse Base Stats from a full snippet or the isolated `.abilties-r.jcsx` block. */
export function parseMarvelOfficialBaseStats(html: string): MarvelSiteBaseStatsParseResult | null {
  if (!html.trim()) {
    return null;
  }
  const block = findOpenBaseStatsBlock(html);
  if (block) {
    return parseMarvelOfficialBaseStatsBlock(block);
  }
  if (
    /<div[^>]*class="[^"]*\bjcsx\b/i.test(html) &&
    /<h3[^>]*class="[^"]*\bbasic\b/i.test(html)
  ) {
    return parseMarvelOfficialBaseStatsBlock(html);
  }
  return null;
}

/**
 * Extract the rendered `<div class="abilties-r jnsx …">…</div>` ability-detail
 * block from a paste. Prefers the `.on` variant (the currently-expanded
 * ability), but falls back to any `.jnsx` block whose `.jnsx-top h3` is
 * non-empty — Marvel's site occasionally keeps the previously-selected
 * detail rendered after a form toggle, dropping the `.on` class.
 */
function findOpenAbilityDetailBlock(html: string): string | null {
  const reOn = /<div\s+class="abilties-r\s+jnsx[^"]*\bon\b[^"]*"[^>]*>/gi;
  const onMatch = reOn.exec(html);
  if (onMatch) {
    return sliceBalancedDiv(html, onMatch.index, onMatch[0].length);
  }
  const re = /<div\s+class="abilties-r\s+jnsx[^"]*"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const block = sliceBalancedDiv(html, m.index, m[0].length);
    const h3Inner = block.match(
      /<div[^>]*class="[^"]*\bjnsx-top\b[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i,
    )?.[1];
    if (h3Inner && cleanText(h3Inner).length > 0) {
      return block;
    }
    re.lastIndex = m.index + block.length;
  }
  return null;
}

export function parseMarvelOfficialAbilityDetailBlock(
  blockHtml: string,
): MarvelSiteAbilityDetailParseResult {
  const warnings: string[] = [];

  const nameRaw = blockHtml.match(
    /<div[^>]*class="[^"]*\bjnsx-top\b[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i,
  )?.[1];
  const name = nameRaw ? titleCaseHeroName(cleanText(nameRaw)) : null;
  if (!name) warnings.push("Ability detail block missing .jnsx-top h3 name.");

  const descRaw = blockHtml.match(
    /<div[^>]*class="[^"]*\btop-info\b[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
  )?.[1];
  const description = descRaw ? cleanText(descRaw) : null;
  if (!description)
    warnings.push("Ability detail block missing .top-info span description.");

  const stats = extractSxzStatRowsFromSxAllDiv(blockHtml, SX_ALL_SX2_OPEN_RE);

  if (stats.length === 0) {
    warnings.push("Ability detail block had no .sx2-all .sxz stat rows.");
  }

  return { name, description, stats, warnings };
}

/** Parse `.skill-scroll` ability skeleton plus any inline open `.abilties-r.jnsx.on` detail. */
export function parseMarvelOfficialAbilities(
  html: string,
): MarvelSiteAbilitiesParseResult {
  const warnings: string[] = [];

  const baseStats = parseMarvelOfficialBaseStats(html);

  if (!html.trim()) {
    warnings.push("HTML is empty.");
    return { abilities: [], openDetail: null, baseStats, warnings };
  }

  const skillScrollMatch = html.match(
    /<div[^>]*class="[^"]*\bskill-scroll\b[^"]*"[^>]*>/i,
  );
  if (!skillScrollMatch) {
    warnings.push("Could not find .skill-scroll container.");
    return { abilities: [], openDetail: null, baseStats, warnings };
  }

  const skillScrollBlock = sliceBalancedDiv(
    html,
    skillScrollMatch.index!,
    skillScrollMatch[0].length,
  );

  const scrollBoxMatch = skillScrollBlock.match(
    /<div[^>]*class="[^"]*\bscroll-box\b[^"]*"[^>]*>/i,
  );
  if (!scrollBoxMatch) {
    warnings.push("Could not find .scroll-box inside .skill-scroll.");
    return { abilities: [], openDetail: null, baseStats, warnings };
  }

  const scrollBoxBlock = sliceBalancedDiv(
    skillScrollBlock,
    scrollBoxMatch.index!,
    scrollBoxMatch[0].length,
  );

  const abilities: MarvelSiteAbility[] = [];
  const skillInfoBlocks = sliceSkillInfoBlocks(scrollBoxBlock);
  for (const block of skillInfoBlocks) {
    const category = parseSkillInfoCategory(block, warnings);
    const ulMatch = block.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (!ulMatch) {
      warnings.push(`No <ul> inside .skill-info "${category}".`);
      continue;
    }
    const liBlocks = extractLiBlocks(ulMatch[1]);
    for (const li of liBlocks) {
      const ability = parseAbilityLi(li, category, warnings);
      if (ability) abilities.push(ability);
    }
  }

  if (abilities.length === 0) {
    warnings.push("No abilities extracted from .skill-scroll.");
  }

  const openBlock = findOpenAbilityDetailBlock(html);
  const openDetail = openBlock
    ? parseMarvelOfficialAbilityDetailBlock(openBlock)
    : null;
  if (openDetail) warnings.push(...openDetail.warnings);

  return { abilities, openDetail, baseStats, warnings };
}

/** Convenience for the per-ability paste flow: accepts either the bare block or a wider snippet. */
export function parseMarvelOfficialAbilityDetail(
  html: string,
): MarvelSiteAbilityDetailParseResult {
  const block = findOpenAbilityDetailBlock(html) ?? html;
  return parseMarvelOfficialAbilityDetailBlock(block);
}

// ---------------------------------------------------------------------------
// Multi-form parser (`.xt-wrap` tab strip + per-form `.abilties-wrap` block)
// ---------------------------------------------------------------------------

/** One entry from a hero's `.xt-wrap` tab strip. */
export type MarvelSiteAvailableForm = {
  /** `data-type` value on the `xt-wrap > a`. Marvel uses 0-indexed integers. */
  siteFormIndex: number;
  /** Whether this tab's anchor carried `class="on"` (active form when captured). */
  isActive: boolean;
  /** URL of the form's circular portrait badge (`xt-wrap > a > img`). */
  portraitUrl: string | null;
};

export type MarvelSiteFormParseResult = {
  /** `data-type` of the active form, or `null` when no `.xt-wrap` was found (single-form hero). */
  siteFormIndex: number | null;
  /** Active form's full body image (`.role-picture > .role-pic`). */
  roleImage: string | null;
  /** Active form's tab portrait (`.xt-wrap > a.on > img`). */
  formPortrait: string | null;
  /** Every form detected in the `.xt-wrap`. Empty when single-form. */
  availableForms: MarvelSiteAvailableForm[];
  /** Active form's ability skeleton. */
  abilities: MarvelSiteAbility[];
  /** Rendered ability-detail block, when present. */
  openDetail: MarvelSiteAbilityDetailParseResult | null;
  /** Base stats panel for the active form. */
  baseStats: MarvelSiteBaseStatsParseResult | null;
  /** True when the paste contains more than one `.abilties-wrap` block — caller should warn. */
  hasConcatenatedForms: boolean;
  warnings: string[];
};

/**
 * Split a paste containing multiple `<div class="abilties-wrap">…</div>` blocks
 * into individual snippets. Used by the import panel to detect and warn when
 * a user has concatenated several form captures into a single paste — each
 * form is expected to live in its own card.
 */
export function splitConcatenatedAbiltiesWraps(html: string): string[] {
  const blocks: string[] = [];
  if (!html.trim()) return blocks;
  const openRe = /<div[^>]*class="[^"]*\babilties-wrap\b[^"]*"[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = openRe.exec(html)) !== null) {
    const block = sliceBalancedDiv(html, match.index, match[0].length);
    blocks.push(block);
    openRe.lastIndex = match.index + block.length;
  }
  return blocks;
}

function extractAvailableForms(html: string): MarvelSiteAvailableForm[] {
  const xtMatch = html.match(/<div[^>]*class="[^"]*\bxt-wrap\b[^"]*"[^>]*>/i);
  if (!xtMatch || xtMatch.index === undefined) {
    return [];
  }
  const xtBlock = sliceBalancedDiv(html, xtMatch.index, xtMatch[0].length);
  const anchorRe = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
  const forms: MarvelSiteAvailableForm[] = [];
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(xtBlock)) !== null) {
    const attrsText = m[1] ?? "";
    const innerHtml = m[2] ?? "";
    const dataTypeRaw = attrValue(`<a${attrsText}>`, "data-type");
    if (dataTypeRaw === null) continue;
    const siteFormIndex = Number.parseInt(dataTypeRaw, 10);
    if (!Number.isFinite(siteFormIndex)) continue;
    const classText = attrValue(`<a${attrsText}>`, "class") ?? "";
    const isActive = /\bon\b/.test(classText);
    const portraitUrl = extractSrcs(innerHtml)[0] ?? null;
    forms.push({ siteFormIndex, isActive, portraitUrl });
  }
  return forms;
}

/**
 * Parse a single form's `.abilties-wrap` block. When the input contains more
 * than one such block (concatenated paste), only the first is parsed and
 * `hasConcatenatedForms` is set to `true` so the caller can route the user
 * back to the multi-card flow.
 */
export function parseMarvelOfficialForm(html: string): MarvelSiteFormParseResult {
  const warnings: string[] = [];

  if (!html.trim()) {
    warnings.push("HTML is empty.");
    return {
      siteFormIndex: null,
      roleImage: null,
      formPortrait: null,
      availableForms: [],
      abilities: [],
      openDetail: null,
      baseStats: null,
      hasConcatenatedForms: false,
      warnings,
    };
  }

  const allWraps = splitConcatenatedAbiltiesWraps(html);
  const hasConcatenatedForms = allWraps.length > 1;
  // Scope to the first `.abilties-wrap` so a concatenated paste doesn't bleed
  // ability rows from form 2 into form 1's parse. The full HTML is still used
  // when no `.abilties-wrap` is present (single-form heroes don't always
  // render the wrapper, e.g. the existing Angela / Daredevil pastes).
  const scope = allWraps[0] ?? html;

  const availableForms = extractAvailableForms(scope);
  const active = availableForms.find((f) => f.isActive) ?? availableForms[0] ?? null;
  const siteFormIndex = active?.siteFormIndex ?? null;

  const rolePicMatch = scope.match(
    /<img[^>]*class="[^"]*\brole-pic\b[^"]*"[^>]*src="([^"]+)"/i,
  );
  const roleImage = rolePicMatch?.[1] ?? null;
  const formPortrait = active?.portraitUrl ?? null;

  const abilitiesResult = parseMarvelOfficialAbilities(scope);
  warnings.push(...abilitiesResult.warnings);

  if (availableForms.length === 0) {
    warnings.push("No .xt-wrap tab strip detected — treating as a single-form hero.");
  } else if (!active) {
    warnings.push(".xt-wrap had no active tab — defaulting to the first entry.");
  }

  return {
    siteFormIndex,
    roleImage,
    formPortrait,
    availableForms,
    abilities: abilitiesResult.abilities,
    openDetail: abilitiesResult.openDetail,
    baseStats: abilitiesResult.baseStats,
    hasConcatenatedForms,
    warnings,
  };
}
