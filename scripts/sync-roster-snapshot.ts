/**
 * CLI: refresh Supabase api_roster_snapshot from Marvel Rivals API.
 * Requires MARVEL_RIVALS_API_KEY and SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { config as loadEnv } from "dotenv";
import { refreshMarvelRivalsHeroesFromNetwork } from "../src/lib/api/marvel-rivals";
import { createSupabaseServiceRoleClient } from "../src/lib/supabase/service-role-client";
import { upsertRosterSnapshot } from "../src/lib/supabase/roster-snapshot-repository";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const heroes = await refreshMarvelRivalsHeroesFromNetwork();
  const result = await upsertRosterSnapshot(
    supabase,
    heroes as Record<string, unknown>[],
    { script: "sync-roster-snapshot" },
  );

  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }

  console.log(`Snapshot updated: ${heroes.length} heroes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
