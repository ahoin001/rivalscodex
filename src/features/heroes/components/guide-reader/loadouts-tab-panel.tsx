"use client";

import { useState } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { HudEmptyState, RivalsClipSegment } from "@/components/ui";
import { HeroPartnerLink } from "@/features/heroes/components/hero-partner-link";
import {
  buildPortraitLookup,
  findPortraitByOpponent,
} from "@/features/heroes/components/hero-guide-body/types";

type LoadoutBlock = Extract<HeroGuideBlock, { type: "loadout" }>;

export function LoadoutsTabPanel({
  blocks,
  heroPortraits,
}: {
  blocks: HeroGuideBlock[];
  heroPortraits?: HeroPortraitEntry[];
}) {
  const loadouts = blocks.filter((block): block is LoadoutBlock => block.type === "loadout");
  const lookup = buildPortraitLookup(heroPortraits);

  if (loadouts.length === 0) {
    return (
      <HudEmptyState title="No Team-Up loadouts yet">
        Season 9 loadouts attach automatically when this hero is in the catalog. Editors can also
        add Base and Enhanced effects in the guide.
      </HudEmptyState>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {loadouts.map((block, index) => (
        <LoadoutCard
          key={`${block.name}-${index}`}
          block={block}
          portrait={
            block.partnerName || block.partnerSlug
              ? findPortraitByOpponent(lookup, block.partnerName ?? block.partnerSlug ?? "")
              : undefined
          }
        />
      ))}
    </div>
  );
}

function LoadoutCard({
  block,
  portrait,
}: {
  block: LoadoutBlock;
  portrait?: HeroPortraitEntry;
}) {
  const [layer, setLayer] = useState<"base" | "enhanced">("base");
  const canShowEnhanced = Boolean(block.enhancedEffect?.trim());

  return (
    <article className="rivals-clip-row border border-rivals-light-300 bg-white/80 p-4 shadow-[0_8px_24px_rgb(26_29_38/10%)]">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-[10px] font-bold uppercase italic tracking-[0.22em] text-brand-gold">
            {block.soloQueueDefault ? "Solo default" : "Team-Up loadout"}
          </p>
          <h4 className="mt-1 font-display text-lg font-extrabold uppercase italic text-rivals-ink">
            {block.name}
          </h4>
        </div>
        {canShowEnhanced ? (
          <RivalsClipSegment
            ariaLabel={`${block.name} layers`}
            value={layer}
            onChange={(id) => setLayer(id as "base" | "enhanced")}
            options={[
              { id: "base", label: "Base" },
              { id: "enhanced", label: "Enhanced" },
            ]}
          />
        ) : null}
      </header>

      <div className="relative mt-3 min-h-[5.5rem] overflow-hidden">
        <p
          className={`text-sm leading-6 text-rivals-ink-soft transition-[opacity,filter] duration-[var(--motion-medium)] ease-[var(--ease-out-soft)] ${
            layer === "base"
              ? "opacity-100"
              : "pointer-events-none absolute inset-0 opacity-0 blur-[2px]"
          }`}
        >
          {block.baseEffect}
        </p>
        {canShowEnhanced ? (
          <p
            className={`text-sm leading-6 text-rivals-ink-soft transition-[opacity,filter] duration-[var(--motion-medium)] ease-[var(--ease-out-soft)] ${
              layer === "enhanced"
                ? "opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0 blur-[2px]"
            }`}
          >
            {block.enhancedEffect}
          </p>
        ) : null}
      </div>

      {block.whenToPick ? (
        <p className="mt-3 border-t border-rivals-light-300 pt-3 text-xs leading-5 text-rivals-ink-muted">
          <span className="font-display font-bold uppercase tracking-[0.16em] text-rivals-ink-soft">
            When to pick ·{" "}
          </span>
          {block.whenToPick}
        </p>
      ) : null}

      {portrait ? (
        <HeroPartnerLink
          slug={portrait.slug}
          name={block.partnerName ?? portrait.name}
          portraitUrl={portrait.portraitUrl}
        />
      ) : block.partnerName ? (
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-rivals-ink-muted">
          Partner · {block.partnerName}
        </p>
      ) : null}
    </article>
  );
}
