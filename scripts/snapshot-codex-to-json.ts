import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fetchHeroCodexAll } from "../src/lib/supabase/hero-codex-repository";

type Options = {
  dryRun: boolean;
};

function parseOptions(args: string[]): Options {
  return {
    dryRun: args.includes("--dry-run"),
  };
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  const service = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const heroes = await fetchHeroCodexAll(service);
  if (!heroes || heroes.length === 0) {
    throw new Error("No codex heroes found in Supabase.");
  }

  const sorted = [...heroes].sort((a, b) => a.name.localeCompare(b.name));
  const targetPath = resolve(process.cwd(), "src", "data", "heroes.json");
  const content = `${JSON.stringify(sorted, null, 2)}\n`;

  if (options.dryRun) {
    console.log(
      JSON.stringify({
        type: "snapshot",
        dryRun: true,
        heroes: sorted.length,
        targetPath,
      }),
    );
    return;
  }

  await writeFile(targetPath, content, "utf8");
  console.log(
    JSON.stringify({
      type: "snapshot",
      dryRun: false,
      heroes: sorted.length,
      targetPath,
    }),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      type: "snapshot_error",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
