import { NextResponse } from "next/server";
import { refreshMarvelRivalsHeroesFromNetwork } from "@/lib/api/marvel-rivals";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role-client";
import { upsertRosterSnapshot } from "@/lib/supabase/roster-snapshot-repository";

function authorize(request: Request): boolean {
  const secret = process.env.ROSTER_SNAPSHOT_SYNC_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY or Supabase URL." },
      { status: 500 },
    );
  }

  try {
    const heroes = await refreshMarvelRivalsHeroesFromNetwork();
    if (heroes.length === 0) {
      return NextResponse.json(
        { error: "Marvel API returned no heroes — snapshot not updated." },
        { status: 502 },
      );
    }

    const result = await upsertRosterSnapshot(
      supabase,
      heroes as Record<string, unknown>[],
      { route: "api/sync/roster-snapshot" },
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      heroCount: heroes.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Roster sync failed.",
      },
      { status: 500 },
    );
  }
}
