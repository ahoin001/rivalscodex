"use client";

import { useMemo, useState } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import {
  buildPortraitLookup,
  findPortraitByOpponent,
} from "@/features/heroes/components/hero-guide-body/types";
import { BlockMatchup } from "@/features/heroes/components/hero-guide-body/block-matchup";
import { MatchupTierChart } from "./matchup-tier-chart";
import { HudEmptyState, RivalsClipSegment } from "@/components/ui";

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

  const filterOptions = [
    { id: "all", label: "All" },
    ...LANE_ORDER.filter((lane) => grouped[lane.key].length > 0).map((lane) => ({
      id: lane.key,
      label: lane.label,
    })),
  ];

  if (matchups.length === 0) {
    return (
      <HudEmptyState title="Matchups not added yet">
        Add favorable, even, and threat opponents in the guide editor to build a pre-queue matchup
        board.
      </HudEmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RivalsClipSegment
          ariaLabel="Matchup view"
          tone="ink"
          value={view}
          onChange={(id) => setView(id as ViewMode)}
          options={[
            { id: "chart", label: "Tier chart" },
            { id: "list", label: "Detail list" },
          ]}
        />
        {view === "list" ? (
          <RivalsClipSegment
            ariaLabel="Matchup filter"
            value={filter}
            onChange={(id) => setFilter(id as "all" | MatchupBlock["disposition"])}
            options={filterOptions}
          />
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
                className="rivals-clip-row border border-rivals-light-300 bg-rivals-light-50/70 p-3"
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
