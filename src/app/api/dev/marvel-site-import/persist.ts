import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Hero } from "@/data/schema";
import { heroSchema } from "@/data/schema";
import { heroAssetPaths as buildHeroAssetPaths } from "@/lib/rivals-assets-paths";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role-client";
import { revalidateHeroCodexCaches } from "@/lib/supabase/hero-codex-cached";
import {
  fetchHeroCodexBySlug,
  upsertHeroCodex,
} from "@/lib/supabase/hero-codex-repository";
import {
  logHeroImport,
  type HeroImportAction,
} from "@/lib/supabase/hero-import-log-repository";

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function healthFromBaseStatRows(
  rows: { label: string; value: string }[],
): number | undefined {
  const row = rows.find(
    (entry) => entry.label.toLowerCase().replace(/\s+/g, " ").trim() === "health",
  );
  if (!row) return undefined;
  const digits = row.value.replace(/[^\d]/g, "");
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

export async function findExistingHero(slug: string): Promise<{
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
  } catch (error) {
    return {
      source: "none",
      warning: `Could not read codex hero "${slug}": ${
        error instanceof Error ? error.message : "unknown"
      }`,
    };
  }

  return { source: "none" };
}

export async function logHeroImportEvent(args: {
  slug: string;
  action: HeroImportAction;
  ok: boolean;
  details: Record<string, unknown>;
}): Promise<void> {
  const service = createSupabaseServiceRoleClient();
  if (!service) return;

  const result = await logHeroImport(service, args);
  if (!result.ok) {
    console.warn("[hero-import] failed to write hero_import_log", result.error);
  }
}

export async function buildNewHeroFromTemplate(
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

export async function persistHero(
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
