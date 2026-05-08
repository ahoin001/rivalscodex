import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Hero } from "../src/data/schema";
import {
  ExternalHero,
  fetchMarvelRivalsHeroes,
} from "../src/lib/api/marvel-rivals";
import { externalProviderConfig } from "../src/lib/external-provider-config";
import { featureFlags } from "../src/lib/feature-flags";
import {
  collectContentHealthErrors,
  validateHeroesData,
} from "./validate-content";

type SyncOptions = {
  dryRun: boolean;
  skipImages: boolean;
};

type SyncMetricName =
  | "sync_success"
  | "sync_failure"
  | "candidate_hero_count"
  | "external_hero_count"
  | "image_cache_miss";

const WORKSPACE_ROOT = resolve(process.cwd());
const HEROES_PATH = join(WORKSPACE_ROOT, "src", "data", "heroes.json");
const STAGED_DIR = join(WORKSPACE_ROOT, "src", "data", ".staged");
const STAGED_CANDIDATE_PATH = join(STAGED_DIR, "heroes.candidate.json");
const PUBLIC_DIR = join(WORKSPACE_ROOT, "public");
const IMAGE_MAX_BYTES = {
  portrait: 300_000,
  splash: 500_000,
};

function parseOptions(args: string[]): SyncOptions {
  return {
    dryRun: args.includes("--dry-run"),
    skipImages: args.includes("--skip-images"),
  };
}

function metric(name: SyncMetricName, value: number) {
  console.log(JSON.stringify({ type: "metric", name, value }));
}

function syncLog(level: "info" | "warn" | "error", message: string, extra?: object) {
  console.log(
    JSON.stringify({
      type: "sync_log",
      level,
      message,
      ...extra,
    }),
  );
}

async function readLocalHeroes(): Promise<Hero[]> {
  const raw = await readFile(HEROES_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return validateHeroesData(parsed);
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeIsoDate(input?: string): string {
  if (!input) {
    return new Date().toISOString().slice(0, 10);
  }
  const match = input.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) {
    return match[0];
  }
  return new Date().toISOString().slice(0, 10);
}

function mergeHero(localHero: Hero, externalHero?: ExternalHero): Hero {
  if (!externalHero) {
    return localHero;
  }

  const mergedAbilities =
    externalHero.abilities && externalHero.abilities.length > 0
      ? localHero.abilities.map((ability) => {
          const externalAbility = externalHero.abilities?.find(
            (candidate) =>
              candidate.name.toLowerCase() === ability.name.toLowerCase(),
          );
          if (!externalAbility) {
            return ability;
          }

          return {
            ...ability,
            keybind: externalAbility.keybind ?? ability.keybind,
            type: externalAbility.type ?? ability.type,
            description: externalAbility.description ?? ability.description,
            damage: externalAbility.damage ?? ability.damage,
            cooldownSeconds:
              externalAbility.cooldownSeconds ?? ability.cooldownSeconds,
          };
        })
      : localHero.abilities;

  return {
    ...localHero,
    id: externalHero.id ? normalizeSlug(externalHero.id) : localHero.id,
    slug: externalHero.slug ? normalizeSlug(externalHero.slug) : localHero.slug,
    summary: externalHero.summary ?? localHero.summary,
    updatedAt: normalizeIsoDate(externalHero.updatedAt ?? localHero.updatedAt),
    abilities: mergedAbilities,
  };
}

function mergeHeroes(localHeroes: Hero[], externalHeroes: ExternalHero[]): Hero[] {
  const externalByName = new Map(
    externalHeroes.map((hero) => [hero.name.toLowerCase(), hero]),
  );

  return localHeroes.map((localHero) =>
    mergeHero(localHero, externalByName.get(localHero.name.toLowerCase())),
  );
}

function assertDiffThreshold(previousCount: number, nextCount: number) {
  const maxRatio = Number(process.env.SYNC_HERO_COUNT_DELTA_RATIO ?? "0.35");
  const delta = Math.abs(nextCount - previousCount);
  const ratio = previousCount === 0 ? 0 : delta / previousCount;
  if (ratio > maxRatio) {
    throw new Error(
      `Hero count changed by ${(ratio * 100).toFixed(1)}%, above threshold ${(maxRatio * 100).toFixed(1)}%.`,
    );
  }
}

function imageOutputPaths(slug: string, kind: "portrait" | "splash") {
  const relative = `/heroes/${slug}-${kind}.webp`;
  return {
    relative,
    absolute: join(PUBLIC_DIR, relative),
  };
}

async function ensureDirectory(pathValue: string) {
  await mkdir(dirname(pathValue), { recursive: true });
}

async function shouldDownload(pathValue: string) {
  try {
    await stat(pathValue);
    return featureFlags.allowImageRecache;
  } catch {
    return true;
  }
}

async function cacheImage(
  url: string,
  outputPath: string,
  maxBytes: number,
): Promise<boolean> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength > maxBytes) {
    throw new Error(
      `Image exceeds budget (${buffer.byteLength} > ${maxBytes}) for ${outputPath}`,
    );
  }

  await ensureDirectory(outputPath);
  await writeFile(outputPath, buffer);
  return true;
}

async function cacheHeroImages(heroes: Hero[], externalHeroes: ExternalHero[]) {
  const externalByName = new Map(
    externalHeroes.map((hero) => [hero.name.toLowerCase(), hero]),
  );

  for (const hero of heroes) {
    const externalHero = externalByName.get(hero.name.toLowerCase());
    if (!externalHero) {
      continue;
    }

    const portrait = externalHero.portraitImageUrl;
    const splash = externalHero.splashImageUrl;
    const updates: Partial<Pick<Hero, "portraitImage" | "splashImage">> = {};

    if (portrait) {
      const output = imageOutputPaths(hero.slug, "portrait");
      if (await shouldDownload(output.absolute)) {
        await cacheImage(portrait, output.absolute, IMAGE_MAX_BYTES.portrait);
        metric("image_cache_miss", 1);
      }
      updates.portraitImage = output.relative;
    }

    if (splash) {
      const output = imageOutputPaths(hero.slug, "splash");
      if (await shouldDownload(output.absolute)) {
        await cacheImage(splash, output.absolute, IMAGE_MAX_BYTES.splash);
        metric("image_cache_miss", 1);
      }
      updates.splashImage = output.relative;
    }

    Object.assign(hero, updates);
  }
}

async function stageCandidate(candidate: Hero[]) {
  await mkdir(STAGED_DIR, { recursive: true });
  await writeFile(STAGED_CANDIDATE_PATH, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
}

async function promoteCandidate(candidate: Hero[]) {
  await writeFile(HEROES_PATH, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const startedAt = Date.now();

  syncLog("info", "sync_started", {
    dryRun: options.dryRun,
    skipImages: options.skipImages,
    preferApiContent: featureFlags.preferApiContent,
    apiEnabled: featureFlags.enableExternalApis,
  });

  if (!featureFlags.enableExternalApis || !featureFlags.preferApiContent) {
    throw new Error(
      "API sync is disabled. Set NEXT_PUBLIC_ENABLE_EXTERNAL_APIS=true and NEXT_PUBLIC_PREFER_API_CONTENT=true.",
    );
  }

  if (!externalProviderConfig.marvelRivals.apiKey) {
    throw new Error("Missing MARVEL_RIVALS_API_KEY.");
  }

  const localHeroes = await readLocalHeroes();
  const externalHeroes = await fetchMarvelRivalsHeroes();
  metric("external_hero_count", externalHeroes.length);

  if (externalHeroes.length === 0) {
    throw new Error("No external heroes returned by provider.");
  }

  const candidate = mergeHeroes(localHeroes, externalHeroes);
  metric("candidate_hero_count", candidate.length);
  assertDiffThreshold(localHeroes.length, candidate.length);

  if (!options.skipImages) {
    await cacheHeroImages(candidate, externalHeroes);
  }

  const validated = validateHeroesData(candidate);
  const healthErrors = collectContentHealthErrors(validated);
  if (healthErrors.length > 0) {
    throw new Error(`Health checks failed: ${healthErrors.join(" | ")}`);
  }

  await stageCandidate(validated);
  syncLog("info", "candidate_staged", { stagedPath: STAGED_CANDIDATE_PATH });

  if (options.dryRun) {
    const elapsedMs = Date.now() - startedAt;
    syncLog("info", "dry_run_complete", { elapsedMs });
    metric("sync_success", 1);
    return;
  }

  await promoteCandidate(validated);
  const elapsedMs = Date.now() - startedAt;
  syncLog("info", "sync_promoted", { targetPath: HEROES_PATH, elapsedMs });
  metric("sync_success", 1);
}

main().catch((error) => {
  syncLog("error", "sync_failed", {
    reason: error instanceof Error ? error.message : String(error),
  });
  metric("sync_failure", 1);
  process.exit(1);
});
