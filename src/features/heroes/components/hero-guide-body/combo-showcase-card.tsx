"use client";

import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { getDifficultyTier } from "@/features/heroes/combo-display";
import { BlockCombo } from "@/features/heroes/components/hero-guide-body/block-combo";

type ComboBlock = Extract<HeroGuideBlock, { type: "combo" }>;

type ComboShowcaseCardProps = {
  block: ComboBlock;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  /** DOM id for in-panel scroll targets. */
  sectionId?: string;
  sectionRef?: (node: HTMLElement | null) => void;
};

function hasStructuredChain(
  block: ComboBlock,
  abilityLookup?: Map<string, ResolvedAbilityRef>,
): boolean {
  return (
    !!block.structuredSteps &&
    block.structuredSteps.length > 0 &&
    !!abilityLookup
  );
}

function LegacyComboFallback({ block }: { block: ComboBlock }) {
  const tier = getDifficultyTier(block.difficulty);

  return (
    <div className="rounded-md border border-rivals-light-300/80 bg-rivals-light-50/70 px-3 py-2.5">
      <p className="font-display text-[10px] font-bold uppercase italic tracking-wide text-rivals-ink-muted">
        Text route · {block.steps.length} step{block.steps.length === 1 ? "" : "s"}
      </p>
      <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs leading-5 text-rivals-ink-soft sm:text-sm">
        {block.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {tier ? (
        <span
          className={`mt-3 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${tier.lightClass}`}
        >
          {tier.label}
        </span>
      ) : null}
    </div>
  );
}

/** Read-only combo card — always expanded; per-step tips surface via ComboChain nodes. */
export function ComboShowcaseCard({
  block,
  abilityLookup,
  sectionId,
  sectionRef,
}: ComboShowcaseCardProps) {
  const tier = getDifficultyTier(block.difficulty);
  const structured = hasStructuredChain(block, abilityLookup);
  const contextLine = [block.condition, block.notes].filter(Boolean).join(" · ");

  return (
    <article
      id={sectionId}
      ref={sectionRef}
      className="scroll-mt-24 overflow-hidden rounded-lg border border-rivals-ink/10 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] hover:border-brand-gold/20"
    >
      <header className="border-b border-rivals-light-300/80 bg-gradient-to-r from-white via-rivals-light-50/40 to-white px-4 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-base font-extrabold uppercase italic text-rivals-ink sm:text-lg">
            {block.name}
          </h4>
          {tier ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${tier.lightClass}`}
            >
              {tier.label}
            </span>
          ) : null}
          {(block.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-rivals-light-300 bg-rivals-light-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rivals-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        {contextLine ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-rivals-ink-soft">
            {contextLine}
          </p>
        ) : null}
      </header>

      <div className="border-t border-rivals-light-300/60 bg-rivals-light-50/40">
        {structured ? (
          <BlockCombo block={block} abilityLookup={abilityLookup} clip={block.clip} embedded />
        ) : (
          <LegacyComboFallback block={block} />
        )}
      </div>
    </article>
  );
}
