"use client";

import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { BlockAbilityTip } from "@/features/heroes/components/hero-guide-body/block-ability-tip";
import { HudEmptyState, RivalsCta } from "@/components/ui";
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
      <RivalsCta href="#hero-codex-abilities" context="lab" variant="gold-outline" size="sm">
        Full ability reference above
        <span aria-hidden>↑</span>
      </RivalsCta>

      {tips.length > 0 ? (
        <div className="space-y-3">
          {tips.map((block, index) => (
            <BlockAbilityTip key={`ability-tip-${index}-${block.abilityRef}`} block={block} abilityLookup={abilityLookup} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <HudEmptyState title="No ability tips added yet">
            Use the full ability reference for baseline tooltips, then add kit-specific tech in
            admin.
          </HudEmptyState>
          <GuideTabFallback primaryPoints={primaryPoints} secondaryPoints={secondaryPoints} />
        </div>
      )}
    </div>
  );
}

