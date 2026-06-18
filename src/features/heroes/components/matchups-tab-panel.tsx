"use client";

import { type ReactNode, useMemo, useState } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import {
  buildPortraitLookup,
  findPortraitByOpponent,
} from "@/features/heroes/components/hero-guide-body/types";
import { BlockMatchup } from "@/features/heroes/components/hero-guide-body/block-matchup";
import { MatchupTierChart } from "@/features/heroes/components/matchup-tier-chart";

type MatchupBlock = Extract<HeroGuideBlock, { type: "matchup" }>;

const LANE_ORDER: Array<{ key: MatchupBlock["disposition"]; label: string }> = [
  { key: "target", label: "Favorable" },
  { key: "even", label: "Even / Skill" },
  { key: "threat", label: "Unfavorable" },
];

type ViewMode = "chart" | "list";

export function MatchupsTabPanel({
  blocks,
  heroPortraits,
}: {
  blocks: HeroGuideBlock[];
  heroPortraits?: HeroPortraitEntry[];
}) {
  const [filter, setFilter] = useState<"all" | MatchupBlock["disposition"]>("all");
  const [view, setView] = useState<ViewMode>("chart");
  const matchups = useMemo(
    () => blocks.filter((b): b is MatchupBlock => b.type === "matchup"),
    [blocks],
  );
  const portraitLookup = useMemo(
    () => buildPortraitLookup(heroPortraits),
    [heroPortraits],
  );

  const grouped = useMemo(() => {
    const map: Record<MatchupBlock["disposition"], MatchupBlock[]> = {
      target: [],
      even: [],
      threat: [],
    };
    for (const block of matchups) {
      map[block.disposition].push(block);
    }
    return map;
  }, [matchups]);

  if (matchups.length === 0) {
    return (
      <div className="rounded-lg border border-rivals-light-300 bg-white/75 p-5">
        <h4 className="font-display text-sm font-extrabold uppercase italic tracking-wide text-rivals-ink">
          Matchups not added yet
        </h4>
        <p className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
          Add favorable, even, and threat opponents in the guide editor to build a pre-queue matchup board.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          <ViewPill active={view === "chart"} onClick={() => setView("chart")}>
            Tier chart
          </ViewPill>
          <ViewPill active={view === "list"} onClick={() => setView("list")}>
            Detail list
          </ViewPill>
        </div>
        {view === "list" ? (
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterPill>
            {LANE_ORDER.map((lane) =>
              grouped[lane.key].length > 0 ? (
                <FilterPill
                  key={lane.key}
                  active={filter === lane.key}
                  onClick={() => setFilter(lane.key)}
                >
                  {lane.label}
                </FilterPill>
              ) : null,
            )}
          </div>
        ) : null}
      </div>

      {view === "chart" ? (
        <MatchupTierChart
          threats={grouped.threat}
          targets={grouped.target}
          evens={grouped.even}
          heroPortraits={heroPortraits}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {LANE_ORDER.map((lane) => {
            const items = grouped[lane.key];
            if (items.length === 0) return null;
            if (filter !== "all" && filter !== lane.key) return null;

            return (
              <section
                key={lane.key}
                className="rounded-lg border border-rivals-light-300 bg-rivals-light-50/70 p-3"
              >
                <h4 className="font-display text-xs font-extrabold uppercase italic tracking-[0.16em] text-rivals-ink-muted">
                  {lane.label}
                </h4>
                <div className="mt-3 space-y-3">
                  {items.map((block, index) => (
                    <BlockMatchup
                      key={`${lane.key}-${block.opponent}-${index}`}
                      disposition={block.disposition}
                      opponent={block.opponent}
                      summary={block.summary}
                      clip={block.clip}
                      portrait={findPortraitByOpponent(portraitLookup, block.opponent)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ViewPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
        active
          ? "border-rivals-ink/25 bg-rivals-ink text-white"
          : "border-rivals-light-300 text-rivals-ink-muted hover:border-rivals-ink/20"
      }`}
    >
      {children}
    </button>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
        active
          ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
          : "border-rivals-light-300 text-rivals-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}
