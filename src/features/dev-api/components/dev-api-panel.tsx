"use client";

import { useMemo, useState } from "react";
import { ClippedButton, ClippedPanel, RivalsInput, RivalsPill } from "@/components/ui";

type EndpointId =
  | "heroes.list"
  | "heroes.search"
  | "heroes.stats"
  | "heroes.leaderboard"
  | "heroes.costumes";

type EndpointDefinition = {
  id: EndpointId;
  label: string;
  description: string;
  needsHeroId?: boolean;
  needsQuery?: boolean;
};

type EndpointRunResult = {
  endpointId: EndpointId;
  requestUrl?: string;
  ok: boolean;
  status: number;
  elapsedMs: number;
  data?: unknown;
  error?: string;
};

const endpointDefinitions: EndpointDefinition[] = [
  {
    id: "heroes.list",
    label: "List Heroes",
    description: "GET /heroes",
  },
  {
    id: "heroes.search",
    label: "Search Hero",
    description: "GET /heroes/search?query={name}",
    needsQuery: true,
  },
  {
    id: "heroes.stats",
    label: "Hero Stats",
    description: "GET /heroes/stats?id={heroId}",
    needsHeroId: true,
  },
  {
    id: "heroes.leaderboard",
    label: "Hero Leaderboard",
    description: "GET /heroes/leaderboard?id={heroId}",
    needsHeroId: true,
  },
  {
    id: "heroes.costumes",
    label: "Hero Costumes",
    description: "GET /heroes/costumes?id={heroId}",
    needsHeroId: true,
  },
];

type DevApiPanelProps = {
  truncateResponse?: boolean;
  maxJsonChars?: number;
  responseMaxHeightClassName?: string;
};

export function DevApiPanel({
  truncateResponse = true,
  maxJsonChars = 20000,
  responseMaxHeightClassName = "max-h-[420px]",
}: DevApiPanelProps) {
  const [selectedEndpointId, setSelectedEndpointId] = useState<EndpointId>("heroes.list");
  const [heroId, setHeroId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EndpointRunResult | null>(null);

  const selectedEndpoint = useMemo(
    () =>
      endpointDefinitions.find((endpoint) => endpoint.id === selectedEndpointId) ??
      endpointDefinitions[0],
    [selectedEndpointId],
  );

  async function runEndpoint() {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/dev/marvel-rivals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          endpointId: selectedEndpoint.id,
          heroId,
          query,
        }),
      });

      const payload = (await response.json()) as EndpointRunResult;
      setResult(payload);
    } catch (error) {
      setResult({
        endpointId: selectedEndpoint.id,
        ok: false,
        status: 0,
        elapsedMs: 0,
        error: error instanceof Error ? error.message : "Unknown request error.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const prettyData = useMemo(() => {
    if (!result) {
      return "";
    }

    const serialized = JSON.stringify(result.data ?? { error: result.error }, null, 2);
    if (!truncateResponse || serialized.length <= maxJsonChars) {
      return serialized;
    }

    return `${serialized.slice(0, maxJsonChars)}\n\n...truncated (${serialized.length - maxJsonChars} characters hidden)`;
  }, [maxJsonChars, result, truncateResponse]);

  return (
    <ClippedPanel tone="gold" className="border border-brand-gold/35 p-4 md:p-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold md:text-xs">
              Development Tools
            </p>
            <h3 className="mt-1 font-display text-2xl italic uppercase leading-[0.94] md:text-3xl">
              Endpoint Tester
            </h3>
          </div>
          <RivalsPill tone="brand">Dev Only</RivalsPill>
        </div>

        <p className="text-sm text-muted-foreground">
          Organize and test Marvel Rivals heroes endpoints without exposing API keys in the
          browser.
        </p>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-brand-gold/90">Endpoint</span>
            <select
              value={selectedEndpoint.id}
              onChange={(event) => setSelectedEndpointId(event.currentTarget.value as EndpointId)}
              className="w-full border border-brand-gold/45 bg-[#111523]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
            >
              {endpointDefinitions.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{selectedEndpoint.description}</p>
          </label>

          <div className="flex items-end">
            <ClippedButton tone="brand" className="w-full" onClick={runEndpoint} disabled={isLoading}>
              {isLoading ? "Running..." : "Run Endpoint"}
            </ClippedButton>
          </div>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-brand-gold/90">
              Hero ID (if needed)
            </span>
            <RivalsInput
              value={heroId}
              onChange={(event) => setHeroId(event.currentTarget.value)}
              placeholder="hero_001"
              disabled={!selectedEndpoint.needsHeroId}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-brand-gold/90">
              Search Query (if needed)
            </span>
            <RivalsInput
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="iron man"
              disabled={!selectedEndpoint.needsQuery}
            />
          </label>
        </div>

        {result && (
          <div className="space-y-2 border-t border-brand-gold/30 pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
              <RivalsPill tone={result.ok ? "brand" : "default"}>
                {result.ok ? "Success" : "Failed"}
              </RivalsPill>
              <span className="text-muted-foreground">HTTP {result.status}</span>
              <span className="text-muted-foreground">{result.elapsedMs}ms</span>
              {result.requestUrl ? (
                <span className="break-all text-muted-foreground">{result.requestUrl}</span>
              ) : null}
            </div>
            <pre
              className={`${responseMaxHeightClassName} overflow-auto border border-brand-gold/30 bg-[#0b0f1a]/90 p-3 text-xs text-slate-100`}
            >
              {prettyData}
            </pre>
          </div>
        )}
      </div>
    </ClippedPanel>
  );
}
