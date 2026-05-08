function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

export const externalProviderConfig = {
  marvelRivals: {
    baseUrl: process.env.MARVEL_RIVALS_API_BASE_URL ?? "https://marvelrivalsapi.com/api/v1",
    apiKey: process.env.MARVEL_RIVALS_API_KEY,
    timeoutMs: parseNumber(process.env.MARVEL_RIVALS_TIMEOUT_MS, 8000),
    retryCount: parseNumber(process.env.MARVEL_RIVALS_RETRY_COUNT, 1),
    cacheTtlSeconds: parseNumber(process.env.MARVEL_RIVALS_CACHE_TTL_SECONDS, 3600),
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    cacheTtlSeconds: parseNumber(process.env.YOUTUBE_CACHE_TTL_SECONDS, 3600),
  },
};

export type ContentSource = "api" | "local";
