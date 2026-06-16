"use client";

import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { resolveAbilityRef } from "@/features/heroes/ability-lookup";
import { MiniAbilityCard } from "@/features/heroes/components/mini-ability-card";
import { GuideClip } from "./guide-clip";

type AbilityTipBlock = Extract<HeroGuideBlock, { type: "abilityTip" }>;

export function BlockAbilityTip({
  block,
  abilityLookup,
}: {
  block: AbilityTipBlock;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
}) {
  const ability = abilityLookup
    ? resolveAbilityRef(block.abilityRef, abilityLookup)
    : null;

  return (
    <article className="rounded-lg border border-rivals-light-300 bg-white/80 p-3 sm:p-4">
      {ability ? (
        <MiniAbilityCard ability={ability} className="mb-3" />
      ) : (
        <p className="mb-3 font-display text-xs font-bold uppercase italic tracking-wide text-rivals-ink-muted">
          Ability ref: {block.abilityRef}
        </p>
      )}

      {block.title ? (
        <h4 className="font-display text-sm font-extrabold uppercase italic tracking-wide text-rivals-ink sm:text-base">
          {block.title}
        </h4>
      ) : null}

      <p className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
        {block.body}
      </p>

      {block.tags && block.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {block.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-rivals-yellow-500/35 bg-rivals-yellow-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rivals-yellow-700"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {block.clip ? (
        <div className="mt-3 border-t border-rivals-light-300 pt-3">
          <p className="mb-2 font-display text-[11px] font-bold uppercase italic tracking-[0.18em] text-rivals-ink-muted">
            Mechanics clip
          </p>
          <GuideClip label={block.clip.label} href={block.clip.href} />
        </div>
      ) : null}
    </article>
  );
}

