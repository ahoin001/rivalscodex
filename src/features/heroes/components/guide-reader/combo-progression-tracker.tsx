"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ComboStatus = "not-started" | "practicing" | "mastered";

type ComboProgressionTrackerProps = {
  heroSlug: string;
  comboNames: string[];
};

const STATUS_CONFIG: Record<
  ComboStatus,
  { label: string; emoji: string; cls: string; nextStatus: ComboStatus }
> = {
  "not-started": {
    label: "Not started",
    emoji: "○",
    cls: "border-rivals-ink/15 bg-rivals-light-100 text-rivals-ink-muted",
    nextStatus: "practicing",
  },
  practicing: {
    label: "Practicing",
    emoji: "◐",
    cls: "border-amber-500/40 bg-amber-50 text-amber-800",
    nextStatus: "mastered",
  },
  mastered: {
    label: "Mastered",
    emoji: "●",
    cls: "border-emerald-500/40 bg-emerald-50 text-emerald-800",
    nextStatus: "not-started",
  },
};

function getStorageKey(heroSlug: string) {
  return `rivalscodex:combo-progress:${heroSlug}`;
}

function loadProgress(heroSlug: string): Record<string, ComboStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey(heroSlug));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(heroSlug: string, data: Record<string, ComboStatus>) {
  try {
    localStorage.setItem(getStorageKey(heroSlug), JSON.stringify(data));
  } catch {
    // localStorage might be full or disabled
  }
}

export function ComboProgressionTracker({
  heroSlug,
  comboNames,
}: ComboProgressionTrackerProps) {
  const [progress, setProgress] = useState<Record<string, ComboStatus>>(() =>
    loadProgress(heroSlug),
  );

  useEffect(() => {
    queueMicrotask(() => {
      setProgress(loadProgress(heroSlug));
    });
  }, [heroSlug]);

  const toggle = useCallback(
    (comboName: string) => {
      setProgress((prev) => {
        const current = prev[comboName] ?? "not-started";
        const next = STATUS_CONFIG[current].nextStatus;
        const updated = { ...prev, [comboName]: next };
        if (next === "not-started") delete updated[comboName];
        saveProgress(heroSlug, updated);
        return updated;
      });
    },
    [heroSlug],
  );

  const stats = useMemo(() => {
    let mastered = 0;
    let practicing = 0;
    for (const name of comboNames) {
      const s = progress[name];
      if (s === "mastered") mastered++;
      else if (s === "practicing") practicing++;
    }
    return { mastered, practicing, total: comboNames.length };
  }, [progress, comboNames]);

  if (comboNames.length === 0) return null;

  const pct = Math.round((stats.mastered / stats.total) * 100);

  return (
    <div className="space-y-3 rounded-lg border border-rivals-ink/10 bg-white/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-[11px] font-bold uppercase italic tracking-[0.16em] text-rivals-ink">
          Combo Mastery
        </span>
        <span className="text-xs font-semibold tabular-nums text-rivals-ink-soft">
          {stats.mastered}/{stats.total} mastered
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-rivals-light-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {comboNames.map((name) => {
          const status = progress[name] ?? "not-started";
          const config = STATUS_CONFIG[status];
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`flex w-full items-center gap-2.5 rounded border px-3 py-1.5 text-left transition-all duration-150 hover:-translate-y-px hover:shadow-sm ${config.cls}`}
            >
              <span className="text-sm" aria-hidden>
                {config.emoji}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                {name}
              </span>
              <span className="shrink-0 text-[9px] uppercase tracking-wide opacity-70">
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-rivals-ink-muted">
        Click a combo to cycle: Not started → Practicing → Mastered
      </p>
    </div>
  );
}

/**
 * Compact progress bar for use in the Combos tab header.
 * Shows "3/8 combos mastered" with a small bar.
 */
export function ComboProgressBadge({
  heroSlug,
  comboNames,
}: {
  heroSlug: string;
  comboNames: string[];
}) {
  const [progress, setProgress] = useState<Record<string, ComboStatus>>(() =>
    loadProgress(heroSlug),
  );

  useEffect(() => {
    queueMicrotask(() => {
      setProgress(loadProgress(heroSlug));
    });
  }, [heroSlug]);

  const mastered = useMemo(
    () => comboNames.filter((n) => progress[n] === "mastered").length,
    [progress, comboNames],
  );

  if (comboNames.length === 0) return null;

  const pct = Math.round((mastered / comboNames.length) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-rivals-light-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-rivals-ink-muted">
        {mastered}/{comboNames.length}
      </span>
    </div>
  );
}
