"use client";

import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { getDifficultyTier } from "@/features/heroes/combo-display";
import { ComboChain } from "@/features/heroes/components/combo-chain";
import type { ComboChainVariant } from "@/features/heroes/components/combo-chain-theme";
import { GuideClip } from "./guide-clip";

type ComboBlock = Extract<HeroGuideBlock, { type: "combo" }>;

export function BlockCombo({
  block,
  abilityLookup,
  clip,
  embedded = false,
  variant = "light",
}: {
  block: ComboBlock;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  clip?: { label: string; href: string };
  /** When true, omits duplicate title/context — parent card owns the header. */
  embedded?: boolean;
  variant?: ComboChainVariant;
}) {
  const hasStructured =
    !!block.structuredSteps &&
    block.structuredSteps.length > 0 &&
    !!abilityLookup;

  const resolvedClip = clip ?? block.clip;

  if (!hasStructured) {
    return (
      <BlockComboLegacy
        name={block.name}
        steps={block.steps}
        difficulty={block.difficulty}
        condition={block.condition}
        notes={block.notes}
        clip={resolvedClip}
        embedded={embedded}
      />
    );
  }

  const chainProps = {
    name: block.name,
    structuredSteps: block.structuredSteps!,
    abilityLookup: abilityLookup!,
    difficulty: block.difficulty,
    resourceCost: block.resourceCost,
    condition: block.condition,
    notes: block.notes,
    hideHeader: embedded,
    hideContext: embedded,
    variant,
  };

  if (resolvedClip) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ComboChain {...chainProps} />
        <div className="overflow-hidden rounded-lg border border-rivals-ink/10 bg-white/60">
          <p className="border-b border-rivals-light-300 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-rivals-ink-muted">
            Example clip
          </p>
          <div className="p-2">
            <GuideClip label={resolvedClip.label} href={resolvedClip.href} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ComboChain {...chainProps} />
  );
}

function ComboDiffBadge({ difficulty }: { difficulty: string }) {
  const tier = getDifficultyTier(difficulty);
  if (!tier) return null;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${tier.lightClass}`}
    >
      {tier.label}
    </span>
  );
}

function BlockComboLegacy({
  name,
  steps,
  difficulty,
  condition,
  notes,
  clip,
  embedded = false,
}: {
  name: string;
  steps: string[];
  difficulty?: string;
  condition?: string;
  notes?: string;
  clip?: { label: string; href: string };
  embedded?: boolean;
}) {
  return (
    <div className="rounded border border-rivals-ink/12 bg-white/80 px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {!embedded ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-extrabold uppercase italic text-rivals-ink">
              {name}
            </p>
            {difficulty ? <ComboDiffBadge difficulty={difficulty} /> : null}
          </div>
          {condition ? (
            <p className="mt-1 text-xs leading-5 text-rivals-ink-muted">{condition}</p>
          ) : null}
          {notes ? (
            <p className="mt-1 text-xs leading-5 text-rivals-ink-soft">{notes}</p>
          ) : null}
        </>
      ) : null}
      <ol className={`list-decimal space-y-1 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px] ${embedded ? "" : "mt-2"}`}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {clip ? (
        <div className="mt-3 max-w-lg border-t border-rivals-light-300 pt-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-rivals-ink-muted">
            Example clip
          </p>
          <GuideClip label={clip.label} href={clip.href} />
        </div>
      ) : null}
    </div>
  );
}
