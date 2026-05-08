import { NextRequest, NextResponse } from "next/server";
import { externalProviderConfig } from "@/lib/external-provider-config";

type EndpointId =
  | "heroes.list"
  | "heroes.search"
  | "heroes.stats"
  | "heroes.leaderboard"
  | "heroes.costumes";

type DevRequestBody = {
  endpointId?: EndpointId;
  heroId?: string;
  query?: string;
};

const endpointDefinitions: Record<
  EndpointId,
  {
    path: string;
    needsHeroId?: boolean;
    needsQuery?: boolean;
  }
> = {
  "heroes.list": { path: "/heroes" },
  "heroes.search": { path: "/heroes/search", needsQuery: true },
  "heroes.stats": { path: "/heroes/stats", needsHeroId: true },
  "heroes.leaderboard": { path: "/heroes/leaderboard", needsHeroId: true },
  "heroes.costumes": { path: "/heroes/costumes", needsHeroId: true },
};

function sanitizeInput(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function parseBody(request: NextRequest): Promise<DevRequestBody> {
  try {
    const body = (await request.json()) as DevRequestBody;
    return body;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Dev endpoint testing is only available in development." },
      { status: 404 },
    );
  }

  const apiKey = externalProviderConfig.marvelRivals.apiKey;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing MARVEL_RIVALS_API_KEY. Add it to .env.local before testing endpoints.",
      },
      { status: 400 },
    );
  }

  const body = await parseBody(request);
  const endpointId = body.endpointId;

  if (!endpointId || !(endpointId in endpointDefinitions)) {
    return NextResponse.json(
      { error: "Invalid endpointId." },
      { status: 400 },
    );
  }

  const definition = endpointDefinitions[endpointId];
  const heroId = sanitizeInput(body.heroId);
  const query = sanitizeInput(body.query);

  if (definition.needsHeroId && !heroId) {
    return NextResponse.json(
      { error: "heroId is required for this endpoint." },
      { status: 400 },
    );
  }

  if (definition.needsQuery && !query) {
    return NextResponse.json(
      { error: "query is required for this endpoint." },
      { status: 400 },
    );
  }

  const baseUrl = externalProviderConfig.marvelRivals.baseUrl.replace(/\/$/, "");
  const url = new URL(`${baseUrl}${definition.path}`);

  if (heroId) {
    url.searchParams.set("id", heroId);
  }
  if (query) {
    url.searchParams.set("query", query);
  }

  const start = Date.now();

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store",
    });

    const elapsedMs = Date.now() - start;
    const text = await response.text();

    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    return NextResponse.json(
      {
        endpointId,
        requestUrl: url.toString(),
        ok: response.ok,
        status: response.status,
        elapsedMs,
        data: parsed,
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    const elapsedMs = Date.now() - start;
    return NextResponse.json(
      {
        endpointId,
        ok: false,
        status: 0,
        elapsedMs,
        error: error instanceof Error ? error.message : "Unknown fetch error.",
      },
      { status: 500 },
    );
  }
}
