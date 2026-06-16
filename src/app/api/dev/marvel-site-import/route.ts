import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Hero, HeroAbility, HeroAbilityStat, HeroForm } from "@/data/schema";
import { heroSchema } from "@/data/schema";
import {
  canonicalKeybindIconWebPath,
  normalizeKeybindText,
  resolveCanonicalKeybindIcon,
} from "@/lib/marvel-keybind-icons";
import { heroAssetPaths as buildHeroAssetPaths } from "@/lib/rivals-assets-paths";
import { assertHttpsAllowedImageUrl } from "@/lib/marvel-site-import-url";
import { normalizeMarvelSlug } from "@/lib/marvel-official-html";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role-client";
import {
  revalidateHeroCodexCaches,
} from "@/lib/supabase/hero-codex-cached";
import {
  fetchHeroCodexBySlug,
  upsertHeroCodex,
} from "@/lib/supabase/hero-codex-repository";

const abilityDetailStatInputSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});

const abilityInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  keybind: z.string().optional(),
  keybindText: z.string().optional(),
  keybindIconUrl: z.string().url().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  siteOrder: z.number().int().optional().nullable(),
  /** `data-type` on the parent `xt-wrap > a` tab (multi-form heroes only). */
  siteFormIndex: z.number().int().optional().nullable(),
  /** Optional per-ability description captured from the official site's detail panel. */
  description: z.string().optional(),
  /** Optional ordered stat rows captured from the official site's detail panel. */
  stats: z.array(abilityDetailStatInputSchema).optional(),
});

const heroImageUrlsSchema = z
  .object({
    frame: z.string().optional(),
    heroImage: z.string().optional(),
    stackLogo: z.string().optional(),
  })
  .default({});

const baseStatRowInputSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});

const formInputSchema = z.object({
  /** Stable slug used as `hero_form.form_id` and prefix for ability ids in this form. */
  formId: z.string().regex(/^[a-z0-9-]+$/),
  /** Display name for the form, surfaced on the runtime tab strip. */
  label: z.string().min(1),
  /** Optional short label for compact UI surfaces. */
  shortLabel: z.string().optional(),
  /** `data-type` value from `.xt-wrap > a` so the runtime can match shared abilities. */
  siteFormIndex: z.number().int(),
  /** Exactly one form per request must set `isDefault: true`. */
  isDefault: z.boolean(),
  /** Form portrait badge URL (`.xt-wrap > a.on > img`). */
  portraitUrl: z.string().url().optional().nullable(),
  /** Per-form base stats from the form's `.abilties-r.jcsx` panel. */
  baseStatRows: z.array(baseStatRowInputSchema).optional(),
  abilities: z.array(abilityInputSchema).default([]),
});

const applySkeletonBodySchema = z
  .object({
    action: z.literal("apply-skeleton"),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    role: z.enum(["Vanguard", "Duelist", "Strategist"]),
    name: z.string().min(1),
    realName: z.string().optional(),
    summary: z.string().min(1),
    downloadAssets: z.boolean().optional().default(true),
    forceRefreshAssets: z.boolean().optional().default(false),
    urls: heroImageUrlsSchema,
    abilities: z.array(abilityInputSchema).default([]),
    /** When non-empty, stored on the hero and used to derive `health` from a HEALTH row. */
    baseStatRows: z.array(baseStatRowInputSchema).optional(),
    /**
     * Multi-form payload. When present and non-empty, the importer ignores the
     * top-level `abilities` / `baseStatRows` (those become a derived mirror of
     * the default form) and writes one `hero_form` row + scoped ability set
     * per entry.
     */
    forms: z.array(formInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.downloadAssets) return;
    const entries: [string, string | undefined][] = [
      ["frame", data.urls.frame],
      ["heroImage", data.urls.heroImage],
      ["stackLogo", data.urls.stackLogo],
    ];
    for (const [key, value] of entries) {
      if (!value?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `urls.${key} is required when downloadAssets is true.`,
          path: ["urls", key],
        });
        continue;
      }
      try {
        void new URL(value);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid URL.",
          path: ["urls", key],
        });
      }
    }

    if (data.forms && data.forms.length > 0) {
      const defaults = data.forms.filter((f) => f.isDefault);
      if (defaults.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `forms[] must include exactly one entry with isDefault: true (got ${defaults.length}).`,
          path: ["forms"],
        });
      }
      const seenIds = new Set<string>();
      for (let i = 0; i < data.forms.length; i++) {
        const form = data.forms[i];
        if (seenIds.has(form.formId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `forms[${i}].formId "${form.formId}" is duplicated.`,
            path: ["forms", i, "formId"],
          });
        }
        seenIds.add(form.formId);
        if (form.abilities.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `forms[${i}] ("${form.label}") has no abilities — paste required.`,
            path: ["forms", i, "abilities"],
          });
        }
      }
    }
  });

const applyAbilityDetailBodySchema = z.object({
  action: z.literal("apply-ability-detail"),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  abilityName: z.string().min(1),
  description: z.string().optional(),
  stats: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string(),
      }),
    )
    .default([]),
});

const requestBodySchema = z.discriminatedUnion("action", [
  applySkeletonBodySchema,
  applyAbilityDetailBodySchema,
]);

const HERO_ASSET_STORAGE_BUCKET =
  process.env.SUPABASE_HERO_ASSET_BUCKET?.trim() || "";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function healthFromBaseStatRows(
  rows: { label: string; value: string }[],
): number | undefined {
  const row = rows.find(
    (r) => r.label.toLowerCase().replace(/\s+/g, " ").trim() === "health",
  );
  if (!row) return undefined;
  const digits = row.value.replace(/[^\d]/g, "");
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

async function fetchBinary(url: string, ms = 45_000): Promise<Buffer> {
  assertHttpsAllowedImageUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "RivalsCodex-dev-site-import/1.0" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function mirrorAssetToSupabaseStorage(
  relativePathParts: string[],
  buffer: Buffer,
): Promise<void> {
  if (!HERO_ASSET_STORAGE_BUCKET) return;
  const service = createSupabaseServiceRoleClient();
  if (!service) return;

  const storagePath = relativePathParts.join("/");
  const { error } = await service.storage
    .from(HERO_ASSET_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: "application/octet-stream",
    });

  if (error) {
    // Storage mirroring is additive. Do not fail the codex write when upload fails.
    console.warn(
      `[hero-import] failed to mirror asset to storage bucket "${HERO_ASSET_STORAGE_BUCKET}"`,
      error.message,
    );
  }
}

type DownloadResult = {
  webPath: string;
  writtenFiles: string[];
  status: "written" | "refreshed" | "skipped";
};

/**
 * Persist a remote image into `public/rivals-assets/...` so the returned web
 * path resolves at runtime through Next's static file serving. Optionally
 * mirrors to a Supabase Storage bucket when `SUPABASE_HERO_ASSET_BUCKET` is
 * configured. All runtime assets live under `public/rivals-assets/`.
 */
async function downloadAssetWithCache(
  remoteUrl: string,
  relativePathParts: string[],
  forceRefresh = false,
): Promise<DownloadResult> {
  const projectRoot = process.cwd();
  const publicPath = path.join(projectRoot, "public", "rivals-assets", ...relativePathParts);
  const webPath = `/rivals-assets/${relativePathParts.join("/")}`;
  const relativeDiskPath = path.relative(projectRoot, publicPath);
  const existed = existsSync(publicPath);

  if (existed && !forceRefresh) {
    return { webPath, writtenFiles: [], status: "skipped" };
  }

  const buffer = await fetchBinary(remoteUrl);
  await mirrorAssetToSupabaseStorage(relativePathParts, buffer);
  await mkdir(path.dirname(publicPath), { recursive: true });
  await writeFile(publicPath, buffer);

  return {
    webPath,
    writtenFiles: [relativeDiskPath],
    status: existed ? "refreshed" : "written",
  };
}

function fileExtensionFromUrl(url: string, fallback = ".png"): string {
  try {
    const u = new URL(url);
    const base = u.pathname.split("/").pop() ?? "";
    const dot = base.lastIndexOf(".");
    if (dot >= 0 && dot < base.length - 1) {
      const ext = base.slice(dot).toLowerCase();
      if (/^\.(png|jpg|jpeg|webp|gif|svg)$/.test(ext)) return ext;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

type AssetDownloadLedger = {
  writtenFiles: string[];
  refreshedFiles: string[];
  skippedCount: number;
};

function recordAssetDownload(ledger: AssetDownloadLedger, result: DownloadResult) {
  if (result.status === "skipped") {
    ledger.skippedCount += 1;
    return;
  }
  if (result.status === "refreshed") {
    ledger.refreshedFiles.push(...result.writtenFiles);
    return;
  }
  ledger.writtenFiles.push(...result.writtenFiles);
}

async function downloadKeybindIcon(
  url: string,
  ledger: AssetDownloadLedger,
  forceRefresh = false,
): Promise<string> {
  assertHttpsAllowedImageUrl(url);
  const canonical = resolveCanonicalKeybindIcon(url);
  const filename = canonical?.filename
    ?? (() => {
      const base = new URL(url).pathname.split("/").pop() ?? `keybind${fileExtensionFromUrl(url)}`;
      return base.replace(/[^a-zA-Z0-9._-]/g, "-");
    })();

  const result = await downloadAssetWithCache(url, ["icons", filename], forceRefresh);
  recordAssetDownload(ledger, result);
  return result.webPath;
}

async function downloadAbilityIcon(
  url: string,
  slug: string,
  abilitySlug: string,
  ledger: AssetDownloadLedger,
  formId?: string,
  forceRefresh = false,
): Promise<string> {
  assertHttpsAllowedImageUrl(url);
  const ext = fileExtensionFromUrl(url);
  const filename = formId ? `${formId}-${abilitySlug}${ext}` : `${abilitySlug}${ext}`;
  const result = await downloadAssetWithCache(
    url,
    ["heros", slug, "icons", filename],
    forceRefresh,
  );
  recordAssetDownload(ledger, result);
  return result.webPath;
}

async function downloadHeroAsset(
  url: string,
  slug: string,
  filename: string,
  ledger: AssetDownloadLedger,
  forceRefresh = false,
): Promise<void> {
  assertHttpsAllowedImageUrl(url);
  const result = await downloadAssetWithCache(
    url,
    ["heros", slug, filename],
    forceRefresh,
  );
  recordAssetDownload(ledger, result);
}

async function downloadFormPortrait(
  url: string,
  slug: string,
  formId: string,
  ledger: AssetDownloadLedger,
  forceRefresh = false,
): Promise<string> {
  assertHttpsAllowedImageUrl(url);
  const ext = fileExtensionFromUrl(url);
  const result = await downloadAssetWithCache(
    url,
    ["heros", slug, "forms", `${formId}${ext}`],
    forceRefresh,
  );
  recordAssetDownload(ledger, result);
  return result.webPath;
}

function deriveCooldownSeconds(rawValue: string): number | undefined {
  const match = rawValue.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return undefined;
  const num = Number(match[1]);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

/**
 * Map known stat labels onto the typed ability fields (damage, cooldownSeconds).
 * Unmapped rows are preserved verbatim in `stats`.
 */
function applyKnownStatLabels(
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

function buildAbilityRecord(args: {
  heroSlug: string;
  ability: z.infer<typeof abilityInputSchema>;
  iconWebPath?: string;
  keybindIconWebPath?: string;
  /**
   * When `true`, the caller has detected another ability with the same
   * normalized name in this hero's roster (e.g. Adam Warlock's two
   * Karmic Revival entries) and the id needs a stable disambiguating
   * suffix so the `hero_ability.ability_id` PK doesn't collide.
   */
  needsKeybindSuffix?: boolean;
  /**
   * Optional form scope for multi-form heroes. When provided the id becomes
   * `<heroSlug>-<formId>-<abilitySlug>[suffix]` so abilities that share a
   * slug between forms (e.g. Magik's "MAGIK SLASH" on both forms) each get
   * their own row.
   */
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

  const idSuffix = needsKeybindSuffix
    ? `-${normalizeMarvelSlug(keybind) || "alt"}`
    : "";

  const formPrefix = formId ? `${formId}-` : "";
  const id = `${heroSlug}-${formPrefix}${abilitySlug}${idSuffix}`;

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

async function findExistingHero(slug: string): Promise<{
  hero?: Hero;
  source: "codex" | "none";
  warning?: string;
}> {
  const service = createSupabaseServiceRoleClient();
  if (!service) {
    return {
      source: "none",
      warning: "Supabase service role client is unavailable in codex-only mode.",
    };
  }

  try {
    const codexHero = await fetchHeroCodexBySlug(service, slug);
    if (codexHero) {
      return { hero: codexHero, source: "codex" };
    }
  } catch (e) {
    return {
      source: "none",
      warning: `Could not read codex hero "${slug}": ${
        e instanceof Error ? e.message : "unknown"
      }`,
    };
  }

  return { source: "none" };
}

async function logHeroImport(args: {
  slug: string;
  action: "apply-skeleton" | "apply-ability-detail";
  ok: boolean;
  details: Record<string, unknown>;
}): Promise<void> {
  const service = createSupabaseServiceRoleClient();
  if (!service) return;

  const { error } = await service
    .schema("app_rivalscodex_v1")
    .from("hero_import_log")
    .insert({
      hero_slug: args.slug,
      action: args.action,
      ok: args.ok,
      details: args.details,
    });

  if (error) {
    // Logging is best-effort. The import should still succeed if this fails.
    console.warn("[hero-import] failed to write hero_import_log", error.message);
  }
}

async function buildNewHeroFromTemplate(
  slug: string,
  fields: {
    name: string;
    role: Hero["role"];
    summary: string;
    realName?: string;
  },
): Promise<Hero> {
  const templatePath = path.join(process.cwd(), "src/data/hero.template.json");
  const raw = JSON.parse(await readFile(templatePath, "utf8")) as Record<string, unknown>;
  const playstyle = raw.playstyle as Hero["playstyle"];

  const hero: Hero = {
    id: slug,
    slug,
    name: fields.name,
    realName: fields.realName?.trim() || undefined,
    role: fields.role,
    difficulty: typeof raw.difficulty === "number" ? raw.difficulty : 3,
    health: typeof raw.health === "number" ? raw.health : 650,
    // Canonical local asset paths for codex heroes.
    ...buildHeroAssetPaths(slug),
    summary: fields.summary,
    abilities: [
      {
        id: `${slug}-placeholder`,
        name: "Pending ability data",
        keybind: "—",
        type: "Placeholder",
        description: "Replace with real abilities from the parser.",
      },
    ],
    combos: [],
    synergies: [],
    playstyle,
    externalResources: [],
    updatedAt: todayIsoDate(),
  };

  return heroSchema.parse(hero);
}

async function persistHero(
  hero: Hero,
): Promise<{
  supabaseStatus: "ok" | "error";
  supabaseError?: string;
}> {
  let supabaseStatus: "ok" | "error" = "error";
  let supabaseError: string | undefined;

  const service = createSupabaseServiceRoleClient();
  if (!service) {
    return {
      supabaseStatus: "error",
      supabaseError: "Supabase service role client is unavailable in codex-only mode.",
    };
  }

  const result = await upsertHeroCodex(service, { slug: hero.slug, payload: hero });
  if (result.ok) {
    supabaseStatus = "ok";
    try {
      revalidateHeroCodexCaches(hero.slug);
    } catch {
      /* revalidateTag is best-effort and may throw outside a request context */
    }
  } else {
    supabaseError = result.error;
  }

  return { supabaseStatus, supabaseError };
}

/**
 * Build a `HeroAbility[]` from a parsed skeleton, downloading icons + keybind
 * art along the way. Shared between the single-form path and each form in the
 * multi-form path so dedup-by-name logic lives in exactly one place.
 */
async function buildAbilitiesFromInput(args: {
  heroSlug: string;
  formId?: string;
  abilityInputs: z.infer<typeof abilityInputSchema>[];
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
      } catch (e) {
        warnings.push(
          `Failed to download icon for "${ability.name}"${formId ? ` (form ${formId})` : ""}: ${
            e instanceof Error ? e.message : "unknown"
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
      } catch (e) {
        warnings.push(
          `Failed to download keybind icon for "${ability.name}"${formId ? ` (form ${formId})` : ""}: ${
            e instanceof Error ? e.message : "unknown"
          }`,
        );
      }
    }

    const nameKey = ability.name.trim().toLowerCase();
    const record = buildAbilityRecord({
      heroSlug,
      ability,
      iconWebPath,
      keybindIconWebPath,
      needsKeybindSuffix: duplicateNameKeys.has(nameKey),
      formId,
    });
    results.push(record);
  }
  return results;
}

async function handleApplySkeleton(
  body: z.infer<typeof applySkeletonBodySchema>,
): Promise<Response> {
  const ledger: AssetDownloadLedger = {
    writtenFiles: [],
    refreshedFiles: [],
    skippedCount: 0,
  };
  const warnings: string[] = [];
  const forceRefresh = body.forceRefreshAssets ?? false;

  const existingLookup = await findExistingHero(body.slug);
  const existing: Hero | undefined = existingLookup.hero;
  if (existingLookup.warning) {
    warnings.push(existingLookup.warning);
  }

  const codexAssetPaths = buildHeroAssetPaths(body.slug);

  if (body.downloadAssets) {
    const pairs: { url: string; filename: string }[] = [
      { url: body.urls.frame!, filename: `${body.slug}-frame.png` },
      { url: body.urls.heroImage!, filename: `${body.slug}.png` },
      { url: body.urls.stackLogo!, filename: `${body.slug}-stack-logo.png` },
    ];
    for (const { url, filename } of pairs) {
      try {
        await downloadHeroAsset(url, body.slug, filename, ledger, forceRefresh);
      } catch (e) {
        return NextResponse.json(
          {
            error: `Failed to download ${filename}: ${
              e instanceof Error ? e.message : "unknown"
            }`,
          },
          { status: 400 },
        );
      }
    }
  }

  const baseHero: Hero = existing
    ? {
        ...existing,
        name: body.name,
        role: body.role,
        realName: body.realName?.trim() || undefined,
        summary: body.summary,
        portraitImage: codexAssetPaths.portraitImage,
        splashImage: codexAssetPaths.splashImage,
        frameImage: codexAssetPaths.frameImage,
        stackLogoImage: codexAssetPaths.stackLogoImage,
        updatedAt: todayIsoDate(),
      }
    : await buildNewHeroFromTemplate(body.slug, {
        name: body.name,
        role: body.role,
        summary: body.summary,
        realName: body.realName,
      });

  // Helper that merges a freshly-built ability record with any existing
  // captured detail so a skeleton-only re-apply doesn't wipe descriptions /
  // stats the editor captured on a previous import.
  const mergeWithExisting = (
    newRecord: HeroAbility,
    existingAbility: HeroAbility | undefined,
  ): HeroAbility => {
    if (!existingAbility) return newRecord;
    const recordHasFreshDescription =
      newRecord.description !== "Ability description pending detail capture.";
    const recordHasFreshStats = (newRecord.stats?.length ?? 0) > 0;
    return {
      ...existingAbility,
      ...newRecord,
      description: recordHasFreshDescription
        ? newRecord.description
        : existingAbility.description ?? newRecord.description,
      damage: newRecord.damage ?? existingAbility.damage,
      cooldownSeconds: newRecord.cooldownSeconds ?? existingAbility.cooldownSeconds,
      stats: recordHasFreshStats ? newRecord.stats : existingAbility.stats ?? newRecord.stats,
    };
  };

  let heroForms: HeroForm[] | undefined;
  let heroDefaultFormId: string | undefined;
  let newAbilities: HeroAbility[];

  if (body.forms && body.forms.length > 0) {
    // Multi-form path: build a HeroForm[] and treat the default form's
    // abilities as the canonical `Hero.abilities` mirror.
    const builtForms: HeroForm[] = [];
    for (const formInput of body.forms) {
      let portraitImage: string | undefined;
      if (formInput.portraitUrl && body.downloadAssets) {
        try {
          portraitImage = await downloadFormPortrait(
            formInput.portraitUrl,
            body.slug,
            formInput.formId,
            ledger,
            forceRefresh,
          );
        } catch (e) {
          warnings.push(
            `Failed to download portrait for form "${formInput.label}": ${
              e instanceof Error ? e.message : "unknown"
            }`,
          );
        }
      }

      const formAbilitiesRaw = await buildAbilitiesFromInput({
        heroSlug: body.slug,
        formId: formInput.formId,
        abilityInputs: formInput.abilities,
        ledger,
        warnings,
        forceRefresh,
      });

      const formAbilities = formAbilitiesRaw.map((record) =>
        mergeWithExisting(
          record,
          existing?.forms?.find((f) => f.id === formInput.formId)?.abilities.find(
            (a) => a.id === record.id,
          ) ?? existing?.abilities.find((a) => a.id === record.id),
        ),
      );

      const rows = formInput.baseStatRows;
      const derivedHealth =
        rows && rows.length > 0 ? healthFromBaseStatRows(rows) : undefined;

      builtForms.push({
        id: formInput.formId,
        name: formInput.label,
        shortLabel: formInput.shortLabel,
        siteFormIndex: formInput.siteFormIndex,
        portraitImage: portraitImage as HeroForm["portraitImage"],
        health: derivedHealth ?? baseHero.health,
        baseStatRows: rows && rows.length > 0 ? rows : undefined,
        abilities: formAbilities,
      });
    }

    const defaultForm = builtForms.find((_, i) => body.forms![i].isDefault)
      ?? builtForms[0];
    heroForms = builtForms;
    heroDefaultFormId = defaultForm.id;
    newAbilities = defaultForm.abilities;
  } else {
    // Single-form path (legacy / Angela + Daredevil shape).
    const built = await buildAbilitiesFromInput({
      heroSlug: body.slug,
      abilityInputs: body.abilities,
      ledger,
      warnings,
      forceRefresh,
    });
    newAbilities = built.map((record) =>
      mergeWithExisting(
        record,
        existing?.abilities.find((a) => a.id === record.id),
      ),
    );
  }

  const finalAbilities = newAbilities.length > 0 ? newAbilities : baseHero.abilities;
  let merged: Hero = {
    ...baseHero,
    abilities: finalAbilities,
    forms: heroForms,
    defaultFormId: heroDefaultFormId,
  };

  // Top-level baseStatRows only apply to single-form heroes; multi-form heroes
  // get their stats per-form.
  if (!heroForms) {
    const rows = body.baseStatRows;
    if (rows && rows.length > 0) {
      merged = { ...merged, baseStatRows: rows };
      const derivedHealth = healthFromBaseStatRows(rows);
      if (derivedHealth !== undefined) {
        merged = { ...merged, health: derivedHealth };
      }
    }
  } else {
    // Use the default form's health as the hero-level health so legacy
    // surfaces that read `Hero.health` still see a sensible value.
    const defaultForm = heroForms.find((f) => f.id === heroDefaultFormId);
    if (defaultForm) {
      merged = { ...merged, health: defaultForm.health };
    }
    // Always clear the top-level baseStatRows on multi-form heroes — those
    // rows live per-form.
    if (merged.baseStatRows) {
      merged = { ...merged, baseStatRows: undefined };
    }
  }

  const validation = heroSchema.safeParse(merged);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Hero payload failed schema validation.",
        details: validation.error.flatten(),
      },
      { status: 400 },
    );
  }

  const persist = await persistHero(validation.data);
  const allAbilities = validation.data.forms
    ? validation.data.forms.flatMap((f) => f.abilities)
    : validation.data.abilities;
  const detailsCount = allAbilities.filter(
    (a) => (a.stats?.length ?? 0) > 0,
  ).length;
  const formsCount = validation.data.forms?.length ?? 0;

  await logHeroImport({
    slug: body.slug,
    action: "apply-skeleton",
    ok: persist.supabaseStatus === "ok",
    details: {
      existingSource: existingLookup.source,
      formsCount,
      abilitiesCount: allAbilities.length,
      abilityDetailsCount: detailsCount,
      baseStatRowsCount: validation.data.baseStatRows?.length ?? 0,
      writtenFilesCount: ledger.writtenFiles.length,
      refreshedFilesCount: ledger.refreshedFiles.length,
      skippedFilesCount: ledger.skippedCount,
      warnings,
      supabaseStatus: persist.supabaseStatus,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: body.slug,
    created: !existing,
    formsCount,
    abilitiesCount: allAbilities.length,
    abilityDetailsCount: detailsCount,
    baseStatRowsCount: validation.data.baseStatRows?.length ?? 0,
    downloadAssets: body.downloadAssets,
    forceRefreshAssets: body.forceRefreshAssets ?? false,
    writtenFiles: ledger.writtenFiles,
    refreshedFiles: ledger.refreshedFiles,
    skippedFilesCount: ledger.skippedCount,
    warnings,
    supabase: { status: persist.supabaseStatus, error: persist.supabaseError },
    message: "Hero codex written.",
  });
}

async function handleApplyAbilityDetail(
  body: z.infer<typeof applyAbilityDetailBodySchema>,
): Promise<Response> {
  const existingLookup = await findExistingHero(body.slug);
  if (!existingLookup.hero) {
    return NextResponse.json(
      { error: `No hero with slug "${body.slug}". Apply the skeleton first.` },
      { status: 404 },
    );
  }

  const hero = existingLookup.hero;
  const matchName = (a: HeroAbility) =>
    a.name.toLowerCase() === body.abilityName.toLowerCase();
  // Look across every form for the named ability; multi-form heroes can have
  // abilities that don't appear in `Hero.abilities` (which mirrors only the
  // default form).
  const abilityIdx = hero.abilities.findIndex(matchName);
  let matchingFormIdx = -1;
  let matchingFormAbilityIdx = -1;
  if (abilityIdx === -1 && hero.forms) {
    for (let fi = 0; fi < hero.forms.length; fi++) {
      const idx = hero.forms[fi].abilities.findIndex(matchName);
      if (idx !== -1) {
        matchingFormIdx = fi;
        matchingFormAbilityIdx = idx;
        break;
      }
    }
  }
  if (abilityIdx === -1 && matchingFormIdx === -1) {
    return NextResponse.json(
      {
        error: `No ability "${body.abilityName}" on "${body.slug}". Refresh the skeleton first.`,
      },
      { status: 404 },
    );
  }

  const mergeAbility = (a: HeroAbility): HeroAbility =>
    applyKnownStatLabels(
      {
        ...a,
        description: body.description?.trim() || a.description,
      },
      body.stats,
    );

  let newHero: Hero;
  let merged: HeroAbility;
  if (abilityIdx !== -1) {
    merged = mergeAbility(hero.abilities[abilityIdx]!);
    const mergedAbility = merged;
    newHero = {
      ...hero,
      abilities: hero.abilities.map((a, i) => (i === abilityIdx ? mergedAbility : a)),
      // Also patch the matching form so the normalized table stays in sync.
      forms: hero.forms?.map((f) =>
        f.id === hero.defaultFormId
          ? { ...f, abilities: f.abilities.map((a) => (matchName(a) ? mergedAbility : a)) }
          : f,
      ),
      updatedAt: todayIsoDate(),
    };
  } else {
    const targetForm = hero.forms![matchingFormIdx];
    merged = mergeAbility(targetForm.abilities[matchingFormAbilityIdx]);
    const mergedAbility = merged;
    newHero = {
      ...hero,
      abilities: hero.abilities,
      forms: hero.forms!.map((f, i) =>
        i === matchingFormIdx
          ? {
              ...f,
              abilities: f.abilities.map((a, j) =>
                j === matchingFormAbilityIdx ? mergedAbility : a,
              ),
            }
          : f,
      ),
      updatedAt: todayIsoDate(),
    };
  }

  const validation = heroSchema.safeParse(newHero);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Hero payload failed schema validation after detail merge.",
        details: validation.error.flatten(),
      },
      { status: 400 },
    );
  }

  const persist = await persistHero(validation.data);

  await logHeroImport({
    slug: body.slug,
    action: "apply-ability-detail",
    ok: persist.supabaseStatus === "ok",
    details: {
      existingSource: existingLookup.source,
      abilityName: merged.name,
      statsCount: merged.stats?.length ?? 0,
      supabaseStatus: persist.supabaseStatus,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: body.slug,
    abilityName: merged.name,
    statsCount: merged.stats?.length ?? 0,
    supabase: { status: persist.supabaseStatus, error: persist.supabaseError },
    message: "Ability detail merged.",
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = requestBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.action === "apply-skeleton") {
    return handleApplySkeleton(parsed.data);
  }
  return handleApplyAbilityDetail(parsed.data);
}
