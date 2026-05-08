"use client";

import { useState } from "react";

type SyncResult = {
  ok: boolean;
  message?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
};

export function HeroAssetsSyncPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function runSync() {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/dev/hero-assets/sync", {
        method: "POST",
      });
      const payload = (await response.json()) as SyncResult;
      setResult(payload);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected sync failure.",
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Rebuilds hero asset overrides from files under `rivals-assets/heros/&lt;slug&gt;/`.
        </p>
        <button
          type="button"
          onClick={runSync}
          disabled={isRunning}
          className="rounded border border-brand-gold/45 bg-brand-gold-muted px-4 py-2 text-xs uppercase tracking-[0.14em] text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold hover:text-[#10131f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? "Syncing..." : "Run Hero Asset Sync"}
        </button>
      </div>

      {result ? (
        <div className="space-y-2 border border-white/15 bg-black/20 p-3 text-xs text-white/85">
          <p className={result.ok ? "text-emerald-300" : "text-rose-300"}>
            {result.ok ? result.message ?? "Sync complete." : result.error ?? "Sync failed."}
          </p>
          {result.stdout ? <pre className="whitespace-pre-wrap">{result.stdout}</pre> : null}
          {result.stderr ? <pre className="whitespace-pre-wrap text-amber-200">{result.stderr}</pre> : null}
        </div>
      ) : null}
    </section>
  );
}
