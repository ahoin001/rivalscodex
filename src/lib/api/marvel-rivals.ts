import { externalProviderConfig } from "@/lib/external-provider-config";
import { featureFlags } from "@/lib/feature-flags";
import {
  readStaleRosterSnapshotHeroes,
  readStrictRosterSnapshotHeroes,
} from "@/lib/supabase/roster-snapshot-repository";

type ExternalAbilityStat = {
  label: string;
  value: string;
};

type ExternalAbility = {
  name: string;
  keybind?: string;
  type?: string;
  description?: string;
  damage?: string;
  cooldownSeconds?: number;
  iconUrl?: string;
  isCollab?: boolean;
  transformationId?: string;
  additionalFields?: Record<string, string>;
  /** Site grouping when known: "Normal Attack" | "Abilities" | "Team-Up Abilities" | "Passive". */
  category?: string;
  /** Web-relative path or absolute URL for the keybind icon (e.g. LMB / RMB). */
  keybindIconUrl?: string;
  /** Ordered detail-panel stat rows (lossless, preserves site order). */
  stats?: ExternalAbilityStat[];
};

type ExternalTransformation = {
  id: string;
  name: string;
  iconUrl?: string;
  health?: string;
  movementSpeed?: string;
};

export type ExternalHero = {
  id?: string;
  slug?: string;
  name: string;
  role?: string;
  attackType?: string;
  difficulty?: number;
  summary?: string;
  updatedAt?: string;
  portraitImageUrl?: string;
  splashImageUrl?: string;
  abilities?: ExternalAbility[];
  transformations?: ExternalTransformation[];
};

export type { ExternalAbility, ExternalAbilityStat };

type AnyRecord = Record<string, unknown>;
const MARVEL_RIVALS_ROOT_URL = "https://marvelrivalsapi.com";
const MARVEL_RIVALS_IMAGE_BASE_URL = `${MARVEL_RIVALS_ROOT_URL}/rivals`;

function pickString(record: AnyRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function pickNumber(record: AnyRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function normalizeAbilities(rawAbilities: unknown): ExternalAbility[] | undefined {
  if (!Array.isArray(rawAbilities)) {
    return undefined;
  }

  const abilities: ExternalAbility[] = rawAbilities
    .map((rawAbility) => {
      if (!rawAbility || typeof rawAbility !== "object") {
        return undefined;
      }

      const abilityRecord = rawAbility as AnyRecord;
      const name = pickString(abilityRecord, ["name", "abilityName", "title"]);
      if (!name) {
        return undefined;
      }

      return {
        name,
        keybind: pickString(abilityRecord, ["keybind", "key", "hotkey"]),
        type: pickString(abilityRecord, ["type", "category"]),
        description: pickString(abilityRecord, ["description", "desc"]),
        damage: pickString(abilityRecord, ["damage", "damageText"]),
        cooldownSeconds: pickNumber(abilityRecord, [
          "cooldownSeconds",
          "cooldown",
          "cd",
        ]),
        iconUrl: pickString(abilityRecord, ["iconUrl", "icon", "image", "img"]),
        isCollab:
          typeof abilityRecord.isCollab === "boolean"
            ? abilityRecord.isCollab
            : undefined,
        transformationId: pickString(abilityRecord, [
          "transformationId",
          "transformation_id",
        ]),
        additionalFields: normalizeAdditionalFields(abilityRecord.additional_fields),
      };
    })
    .filter((ability) => ability !== undefined);

  return abilities.length > 0 ? abilities : undefined;
}

function normalizeAdditionalFields(input: unknown): Record<string, string> | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const entries = Object.entries(input as AnyRecord)
    .filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === "string" && value.trim().length > 0;
    })
    .map(([key, value]) => [key, value.trim()] as const);

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function normalizeTransformations(
  rawTransformations: unknown,
): ExternalTransformation[] | undefined {
  if (!Array.isArray(rawTransformations)) {
    return undefined;
  }

  const transformations = rawTransformations.flatMap((rawTransformation) => {
      if (!rawTransformation || typeof rawTransformation !== "object") {
        return [];
      }

      const transformationRecord = rawTransformation as AnyRecord;
      const id = pickString(transformationRecord, ["id", "transformation_id"]);
      const name = pickString(transformationRecord, ["name", "title"]);
      if (!id || !name) {
        return [];
      }

      return [{
        id,
        name,
        iconUrl: pickString(transformationRecord, ["iconUrl", "icon", "image"]),
        health: pickString(transformationRecord, ["health", "hp"]),
        movementSpeed: pickString(transformationRecord, [
          "movementSpeed",
          "movement_speed",
          "speed",
        ]),
      }];
    });

  return transformations.length > 0 ? transformations : undefined;
}

function toAbsoluteAssetUrl(assetPath?: string): string | undefined {
  if (!assetPath) {
    return undefined;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;

  if (normalizedPath.startsWith("/rivals/") || normalizedPath.startsWith("/premium/")) {
    return `${MARVEL_RIVALS_ROOT_URL}${normalizedPath}`;
  }

  return `${MARVEL_RIVALS_IMAGE_BASE_URL}${normalizedPath}`;
}

function normalizeHero(rawHero: unknown): ExternalHero | null {
  if (!rawHero || typeof rawHero !== "object") {
    return null;
  }

  const hero = rawHero as AnyRecord;
  const name = pickString(hero, ["name", "heroName", "alias"]);
  if (!name) {
    return null;
  }

  const portraitImageUrl = pickString(hero, [
    "portraitImageUrl",
    "portrait",
    "portrait_url",
    "image",
    "imageUrl",
    "icon",
  ]);
  const splashImageUrl = pickString(hero, [
    "splashImageUrl",
    "splash",
    "splash_url",
    "splashImage",
    "imageLarge",
  ]);

  return {
    id: pickString(hero, ["id", "heroId"]),
    slug: pickString(hero, ["slug"]),
    name,
    role: pickString(hero, ["role", "class"]),
    attackType: pickString(hero, ["attackType", "attack_type", "attack"]),
    difficulty: pickNumber(hero, ["difficulty"]),
    summary: pickString(hero, ["summary", "description", "bio"]),
    updatedAt: pickString(hero, ["updatedAt", "updated_at", "lastUpdated"]),
    portraitImageUrl: toAbsoluteAssetUrl(portraitImageUrl),
    splashImageUrl: toAbsoluteAssetUrl(splashImageUrl),
    abilities: normalizeAbilities(hero.abilities ?? hero.skills)?.map((ability) => ({
      ...ability,
      iconUrl: toAbsoluteAssetUrl(ability.iconUrl),
    })),
    transformations: normalizeTransformations(hero.transformations)?.map(
      (transformation) => ({
        ...transformation,
        iconUrl: toAbsoluteAssetUrl(transformation.iconUrl),
      }),
    ),
  };
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchMarvelHeroesJsonPayload(apiKey: string): Promise<unknown> {
  const { baseUrl, cacheTtlSeconds, retryCount, timeoutMs } = externalProviderConfig.marvelRivals;
  const endpoint = `${baseUrl}/heroes`;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retryCount) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          headers: {
            "x-api-key": apiKey,
          },
          next: {
            revalidate: cacheTtlSeconds,
          },
        },
        timeoutMs,
      );

      if (!response.ok) {
        throw new Error(
          `Marvel Rivals API request failed with status ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > retryCount) {
        throw lastError;
      }
    }
  }

  throw new Error("Marvel Rivals API request failed.");
}

function extractHeroListFromPayload(payload: unknown): unknown[] {
  return Array.isArray((payload as { data?: unknown })?.data)
    ? (payload as { data: unknown[] }).data
    : Array.isArray((payload as { heroes?: unknown })?.heroes)
      ? (payload as { heroes: unknown[] }).heroes
      : Array.isArray(payload)
        ? payload
        : [];
}

export function heroesFromMarvelPayload(payload: unknown): ExternalHero[] {
  const rawHeroes = extractHeroListFromPayload(payload);

  const normalized = rawHeroes
    .map((hero) => normalizeHero(hero))
    .filter((hero): hero is ExternalHero => hero !== null);

  return normalized;
}

export async function refreshMarvelRivalsHeroesFromNetwork(): Promise<
  ExternalHero[]
> {
  const apiKey = externalProviderConfig.marvelRivals.apiKey;
  if (!apiKey) {
    throw new Error("Missing MARVEL_RIVALS_API_KEY — cannot refresh roster.");
  }

  const payload = await fetchMarvelHeroesJsonPayload(apiKey);
  return heroesFromMarvelPayload(payload);
}

/**
 * Loads roster heroes: prefers a fresh Supabase snapshot when configured, then Marvel API,
 * then stale snapshot fallback if the upstream call fails.
 */
export async function fetchMarvelRivalsHeroes(options?: {
  forceNetwork?: boolean;
}): Promise<ExternalHero[]> {
  const useSnapshotFirst =
    !options?.forceNetwork && featureFlags.useRosterSnapshot;

  if (useSnapshotFirst) {
    const heroes = await readStrictRosterSnapshotHeroes();
    if (heroes && heroes.length > 0) {
      return heroes as ExternalHero[];
    }
  }

  const apiKey = externalProviderConfig.marvelRivals.apiKey;

  if (!apiKey) {
    if (featureFlags.enableSupabase) {
      const fallback = await readStaleRosterSnapshotHeroes();
      return (fallback ?? []) as ExternalHero[];
    }

    return [];
  }

  try {
    const payload = await fetchMarvelHeroesJsonPayload(apiKey);
    return heroesFromMarvelPayload(payload);
  } catch {
    const fallback = await readStaleRosterSnapshotHeroes();
    return (fallback ?? []) as ExternalHero[];
  }
}
