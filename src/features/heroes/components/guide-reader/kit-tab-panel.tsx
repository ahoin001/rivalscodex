"use client";

import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { BlockAbilityTip } from "@/features/heroes/components/hero-guide-body/block-ability-tip";
import { GuideTabFallback } from "@/features/heroes/components/guide-tab-fallback";

type AbilityTipBlock = Extract<HeroGuideBlock, { type: "abilityTip" }>;

export function KitTabPanel({
  blocks,
  abilityLookup,
  primaryPoints,
  secondaryPoints,
}: {
  blocks: HeroGuideBlock[];
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  primaryPoints?: string[];
  secondaryPoints?: string[];
}) {
  const tips = blocks.filter((b): b is AbilityTipBlock => b.type === "abilityTip");

  return (
    <div className="space-y-4">
      <a
        href="#hero-codex-abilities"
        className="inline-flex items-center gap-2 rounded border border-brand-gold/40 bg-brand-gold/10 px-3 py-1.5 font-display text-[11px] font-bold uppercase italic tracking-[0.16em] text-rivals-ink transition-colors duration-[var(--motion-fast)] hover:bg-brand-gold/20"
      >
        Full ability reference above
        <span aria-hidden>↑</span>
      </a>

      {tips.length > 0 ? (
        <div className="space-y-3">
          {tips.map((block, index) => (
            <BlockAbilityTip key={`ability-tip-${index}-${block.abilityRef}`} block={block} abilityLookup={abilityLookup} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-rivals-light-300 bg-white/75 p-4">
            <h4 className="font-display text-sm font-extrabold uppercase italic tracking-wide text-rivals-ink">
              No ability tips added yet
            </h4>
            <p className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
              Use the full ability reference for baseline tooltips, then add kit-specific tech in admin.
            </p>
          </div>
          <GuideTabFallback primaryPoints={primaryPoints} secondaryPoints={secondaryPoints} />
        </div>
      )}
    </div>
  );
}

