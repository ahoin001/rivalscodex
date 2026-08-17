"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import { Tooltip } from "@/components/ui/tooltip";
import { HeroPartnerLink } from "@/features/heroes/components/hero-partner-link";
import {
  buildPortraitLookup,
  findPortraitByOpponent,
  type HeroPortraitEntry,
} from "@/features/heroes/components/hero-guide-body/types";

type MatchupBlock = Extract<HeroGuideBlock, { type: "matchup" }>;

export const MATCHUP_TIER_KEYS = ["S", "A", "B", "C", "D", "F"] as const;
export type MatchupTierKey = (typeof MATCHUP_TIER_KEYS)[number];

type TieredMatchup = {
  block: MatchupBlock;
  portrait?: HeroPortraitEntry;
};

const TIER_STYLE: Record<
  MatchupTierKey,
  { label: string; className: string }
> = {
  S: {
    label: "S",
    className:
      "bg-gradient-to-b from-violet-400 via-fuchsia-500 to-violet-700 text-white shadow-[0_0_18px_rgb(192_132_252/35%)]",
  },
  A: {
    label: "A",
    className:
      "bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 text-white shadow-[0_0_14px_rgb(56_189_248/30%)]",
  },
  B: {
    label: "B",
    className:
      "bg-gradient-to-b from-cyan-300 via-teal-400 to-cyan-600 text-rivals-ink shadow-[0_0_12px_rgb(45_212_191/28%)]",
  },
  C: {
    label: "C",
    className:
      "bg-gradient-to-b from-lime-300 via-yellow-400 to-amber-500 text-rivals-ink shadow-[0_0_10px_rgb(250_204_21/25%)]",
  },
  D: {
    label: "D",
    className:
      "bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700 text-white shadow-[0_0_10px_rgb(251_146_60/25%)]",
  },
  F: {
    label: "F",
    className:
      "bg-gradient-to-b from-rose-400 via-red-500 to-rose-800 text-white shadow-[0_0_12px_rgb(244_63_94/30%)]",
  },
};

/** First matchup → S tier, second → A, … extras stack on F. */
export function bucketMatchupsByTier(blocks: MatchupBlock[]): Record<MatchupTierKey, TieredMatchup[]> {
  const buckets = Object.fromEntries(
    MATCHUP_TIER_KEYS.map((tier) => [tier, [] as TieredMatchup[]]),
  ) as Record<MatchupTierKey, TieredMatchup[]>;

  blocks.forEach((block, index) => {
    const tier = MATCHUP_TIER_KEYS[Math.min(index, MATCHUP_TIER_KEYS.length - 1)];
    buckets[tier].push({ block });
  });

  return buckets;
}

type MatchupTierChartProps = {
  threats: MatchupBlock[];
  targets: MatchupBlock[];
  evens: MatchupBlock[];
  heroPortraits?: HeroPortraitEntry[];
};

export function MatchupTierChart({
  threats,
  targets,
  evens,
  heroPortraits,
}: MatchupTierChartProps) {
  const portraitLookup = useMemo(
    () => buildPortraitLookup(heroPortraits),
    [heroPortraits],
  );

  const threatTiers = useMemo(() => {
    const buckets = bucketMatchupsByTier(threats);
    for (const tier of MATCHUP_TIER_KEYS) {
      buckets[tier] = buckets[tier].map((entry) => ({
        ...entry,
        portrait: findPortraitByOpponent(portraitLookup, entry.block.opponent),
      }));
    }
    return buckets;
  }, [threats, portraitLookup]);

  const targetTiers = useMemo(() => {
    const buckets = bucketMatchupsByTier(targets);
    for (const tier of MATCHUP_TIER_KEYS) {
      buckets[tier] = buckets[tier].map((entry) => ({
        ...entry,
        portrait: findPortraitByOpponent(portraitLookup, entry.block.opponent),
      }));
    }
    return buckets;
  }, [targets, portraitLookup]);

  const evenEntries = useMemo(
    () =>
      evens.map((block) => ({
        block,
        portrait: findPortraitByOpponent(portraitLookup, block.opponent),
      })),
    [evens, portraitLookup],
  );

  const hasThreats = threats.length > 0;
  const hasTargets = targets.length > 0;

  return (
    <div className="overflow-hidden rivals-clip-row border border-white/12 bg-surface-hud shadow-[inset_0_1px_0_rgb(255_255_255/6%)]">
      <div className="border-b border-white/8 px-4 py-3 sm:px-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">
          Matchup board
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          Counters on the left, strong targets on the right. Top rows are highest priority — hover an icon for notes.
        </p>
      </div>

      <div className="px-2 py-3 sm:px-4 sm:py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] gap-x-1 sm:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] sm:gap-x-2">
          {MATCHUP_TIER_KEYS.map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              left={threatTiers[tier]}
              right={targetTiers[tier]}
            />
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/8 pt-3 text-center sm:mt-4">
          <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.2em] text-rose-300/90">
            Counters
          </p>
          <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.2em] text-emerald-300/90">
            Strong vs
          </p>
        </div>
      </div>

      {evenEntries.length > 0 ? (
        <div className="border-t border-white/8 bg-black/20 px-4 py-3 sm:px-5">
          <p className="mb-2 font-display text-[10px] font-bold uppercase italic tracking-[0.18em] text-amber-200/80">
            Skill / even matchups
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {evenEntries.map((entry, index) => (
              <MatchupIcon
                key={`even-${entry.block.opponent}-${index}`}
                entry={entry}
                side="even"
              />
            ))}
          </div>
        </div>
      ) : null}

      {!hasThreats && !hasTargets && evenEntries.length === 0 ? (
        <p className="px-4 pb-4 text-center text-xs text-white/50">
          Add threat and target matchups in the guide editor to populate this chart.
        </p>
      ) : null}
    </div>
  );
}

function TierRow({
  tier,
  left,
  right,
}: {
  tier: MatchupTierKey;
  left: TieredMatchup[];
  right: TieredMatchup[];
}) {
  const style = TIER_STYLE[tier];
  const isEmpty = left.length === 0 && right.length === 0;

  return (
    <>
      <TierCell icons={left} side="threat" tier={tier} />
      <div
        className={`flex items-center justify-center self-stretch border-y border-white/6 py-1 ${
          isEmpty ? "opacity-35" : ""
        }`}
        aria-hidden={isEmpty}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-sm font-display text-lg font-extrabold italic sm:h-10 sm:w-10 sm:text-xl ${style.className}`}
        >
          {style.label}
        </span>
      </div>
      <TierCell icons={right} side="target" tier={tier} />
    </>
  );
}

function TierCell({
  icons,
  side,
  tier,
}: {
  icons: TieredMatchup[];
  side: "threat" | "target";
  tier: MatchupTierKey;
}) {
  return (
    <div
      className={`flex min-h-[2.75rem] flex-wrap content-center gap-1 border-y border-white/6 py-1.5 sm:min-h-[3rem] sm:gap-1.5 ${
        side === "threat" ? "justify-end pe-1 sm:pe-2" : "justify-start ps-1 sm:ps-2"
      }`}
    >
      {icons.map((entry, index) => (
        <MatchupIcon
          key={`${side}-${tier}-${entry.block.opponent}-${index}`}
          entry={entry}
          side={side}
        />
      ))}
    </div>
  );
}

function MatchupIcon({
  entry,
  side,
}: {
  entry: TieredMatchup;
  side: "threat" | "target" | "even";
}) {
  const { block, portrait } = entry;
  const imageSrc = portrait?.portraitUrl ?? portrait?.stackLogoUrl;
  const dispositionLabel =
    side === "threat" ? "Counter" : side === "target" ? "Strong vs" : "Even";

  const ringClass =
    side === "threat"
      ? "ring-rose-400/50 hover:ring-rose-300/80"
      : side === "target"
        ? "ring-emerald-400/50 hover:ring-emerald-300/80"
        : "ring-amber-400/50 hover:ring-amber-300/80";

  const tooltip = (
    <span className="block max-w-[16rem] space-y-1.5">
      <span className="block font-display text-xs font-bold uppercase italic tracking-wide text-brand-gold">
        {block.opponent}
      </span>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/70">
        {dispositionLabel}
      </span>
      <span className="block text-[11px] leading-snug text-white/90">{block.summary}</span>
      {portrait ? (
        <span className="mt-1 block text-[10px] text-white/55">Click icon to open guide</span>
      ) : null}
    </span>
  );

  const iconVisual = (
    <span
      className={`relative block h-9 w-9 shrink-0 overflow-hidden rivals-clip-row bg-surface-input ring-1 transition-[transform,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] group-hover/matchup-icon:-translate-y-0.5 group-hover/matchup-icon:shadow-lg group-focus-within/matchup-icon:-translate-y-0.5 sm:h-10 sm:w-10 ${ringClass}`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="40px"
          className="object-cover object-top"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[9px] font-bold uppercase text-white/70">
          {block.opponent.slice(0, 2)}
        </span>
      )}
    </span>
  );

  return (
    <Tooltip content={tooltip} placement="top" maxWidth="18rem" className="group/matchup-icon">
      {portrait ? (
        <HeroPartnerLink
          variant="chip"
          slug={portrait.slug}
          name={block.opponent}
          portraitUrl={imageSrc ?? portrait.portraitUrl}
          ariaLabel={`${dispositionLabel}: ${block.opponent}`}
          frameClassName={`ring-1 transition-[transform,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] group-hover/matchup-icon:-translate-y-0.5 group-hover/matchup-icon:shadow-lg group-focus-within/matchup-icon:-translate-y-0.5 ${ringClass}`}
        />
      ) : (
        <button
          type="button"
          className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
          aria-label={`${dispositionLabel}: ${block.opponent}`}
        >
          {iconVisual}
        </button>
      )}
    </Tooltip>
  );
}
