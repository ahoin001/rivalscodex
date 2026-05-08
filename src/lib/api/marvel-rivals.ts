import { externalProviderConfig } from "@/lib/external-provider-config";

type ExternalAbility = {
  name: string;
  keybind?: string;
  type?: string;
  description?: string;
  damage?: string;
  cooldownSeconds?: number;
};

export type ExternalHero = {
  id?: string;
  slug?: string;
  name: string;
  role?: string;
  summary?: string;
  updatedAt?: string;
  portraitImageUrl?: string;
  splashImageUrl?: string;
  abilities?: ExternalAbility[];
};

type AnyRecord = Record<string, unknown>;

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
      };
    })
    .filter((ability) => ability !== undefined);

  return abilities.length > 0 ? abilities : undefined;
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
    summary: pickString(hero, ["summary", "description", "bio"]),
    updatedAt: pickString(hero, ["updatedAt", "updated_at", "lastUpdated"]),
    portraitImageUrl:
      portraitImageUrl && /^https?:\/\//i.test(portraitImageUrl)
        ? portraitImageUrl
        : undefined,
    splashImageUrl:
      splashImageUrl && /^https?:\/\//i.test(splashImageUrl)
        ? splashImageUrl
        : undefined,
    abilities: normalizeAbilities(hero.abilities ?? hero.skills),
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

async function fetchHeroesPayload(apiKey: string): Promise<unknown> {
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

export async function fetchMarvelRivalsHeroes(): Promise<ExternalHero[]> {
  const apiKey = externalProviderConfig.marvelRivals.apiKey;
  if (!apiKey) {
    return [];
  }

  const payload = await fetchHeroesPayload(apiKey);
  const rawHeroes = Array.isArray((payload as { data?: unknown })?.data)
    ? (payload as { data: unknown[] }).data
    : Array.isArray(payload)
      ? payload
      : [];

  const normalized = rawHeroes
    .map((hero) => normalizeHero(hero))
    .filter((hero): hero is ExternalHero => hero !== null);

  if (normalized.length === 0) {
    return [];
  }

  return normalized;
}
