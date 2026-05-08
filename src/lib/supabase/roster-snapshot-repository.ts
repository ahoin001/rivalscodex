import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAnonymousServerClient } from "@/lib/supabase/anon-server-client";
import { RIVALSCODEX_APP_SCHEMA } from "@/lib/supabase/constants";

const SNAPSHOT_ROW_ID = "primary";
const SNAPSHOT_VERSION = 1;

function maxSnapshotAgeMs(): number {
  const raw = process.env.ROSTER_SNAPSHOT_MAX_AGE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : 3600;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 3600_000;
  }
  return parsed * 1000;
}

export function snapshotPayloadFromHeroes<
  Hero extends Record<string, unknown>,
>(heroes: Hero[]) {
  return {
    version: SNAPSHOT_VERSION,
    heroes,
  };
}

export function parseRosterSnapshotHeroes(payload: unknown): unknown[] | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typed = payload as { version?: unknown; heroes?: unknown };
  if (
    typed.version === SNAPSHOT_VERSION &&
    Array.isArray(typed.heroes)
  ) {
    const heroes = typed.heroes.filter(isLikelyStoredHeroRecord);
    return heroes.length > 0 ? heroes : null;
  }

  if (Array.isArray(payload)) {
    const heroes = payload.filter(isLikelyStoredHeroRecord);
    return heroes.length > 0 ? heroes : null;
  }

  return null;
}

function isLikelyStoredHeroRecord(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name?: unknown }).name === "string"
  );
}

export async function fetchRosterSnapshotRow(
  client: SupabaseClient,
): Promise<{
  heroes: unknown[] | null;
  fetchedAtIso: string | null;
  stale: boolean;
} | null> {
  const { data, error } = await client
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from("api_roster_snapshot")
    .select("payload,fetched_at")
    .eq("id", SNAPSHOT_ROW_ID)
    .maybeSingle();

  if (error) {
    console.warn("[supabase] api_roster_snapshot read failed", error.message);
    return null;
  }

  if (!data?.payload) {
    return { heroes: null, fetchedAtIso: null, stale: true };
  }

  const fetchedAtIso =
    typeof data.fetched_at === "string" ? data.fetched_at : null;
  const heroes = parseRosterSnapshotHeroes(data.payload);
  const fetchedMs = fetchedAtIso ? Date.parse(fetchedAtIso) : NaN;
  const ageOk = Number.isFinite(fetchedMs)
    ? Date.now() - fetchedMs <= maxSnapshotAgeMs()
    : false;

  return {
    heroes,
    fetchedAtIso,
    stale: !ageOk,
  };
}

/**
 * Prefers a recent snapshot; returns null if missing, empty, or stale.
 */
export async function readStrictRosterSnapshotHeroes(): Promise<
  unknown[] | null
> {
  const client = createSupabaseAnonymousServerClient();
  if (!client) {
    return null;
  }

  const row = await fetchRosterSnapshotRow(client);
  if (!row?.heroes?.length || row.stale) {
    return null;
  }

  return row.heroes;
}

export async function readStaleRosterSnapshotHeroes(): Promise<unknown[] | null> {
  const client = createSupabaseAnonymousServerClient();
  if (!client) {
    return null;
  }

  const row = await fetchRosterSnapshotRow(client);
  if (!row?.heroes?.length) {
    return null;
  }

  return row.heroes;
}

export async function upsertRosterSnapshot(
  client: SupabaseClient,
  heroes: Record<string, unknown>[],
  meta: Record<string, unknown> = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = snapshotPayloadFromHeroes(heroes);

  const { error } = await client
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from("api_roster_snapshot")
    .upsert(
      {
        id: SNAPSHOT_ROW_ID,
        payload,
        hero_count: heroes.length,
        fetched_at: new Date().toISOString(),
        meta: { ...meta, source: "rivalscodex-sync" },
      },
      { onConflict: "id" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
