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
    <div className="rounded-lg border border-rivals-light-300/80 bg-rivals-light-50/70 px-4 py-4">
      <p className="font-display text-[11px] font-bold uppercase italic tracking-wide text-rivals-ink-muted">
        Text route · {block.steps.length} step{block.steps.length === 1 ? "" : "s"}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-rivals-ink-muted">
        Structured ability chain not published yet — showing text steps below.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
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
  const showWhyCallout = !!(block.condition || block.notes);

  return (
    <article
      id={sectionId}
      ref={sectionRef}
      className="scroll-mt-4 overflow-hidden rounded-xl border border-rivals-ink/10 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow,transform] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] hover:border-brand-gold/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
    >
      <header className="border-b border-rivals-light-300/80 bg-gradient-to-r from-white via-rivals-light-50/40 to-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-base font-extrabold uppercase italic text-rivals-ink sm:text-lg">
            {block.name}
          </h4>
          {tier ? (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${tier.lightClass}`}
            >
              {tier.label}
            </span>
          ) : null}
          {(block.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-rivals-light-300 bg-rivals-light-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rivals-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {showWhyCallout ? (
        <div className="border-b border-brand-gold/20 bg-brand-gold-muted/35 px-5 py-3 sm:px-6">
          {block.condition ? (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rivals-ink-muted">
              Setup
            </p>
          ) : null}
          {block.condition ? (
            <p className="mt-0.5 text-sm leading-6 text-rivals-ink-soft">{block.condition}</p>
          ) : null}
          {block.notes ? (
            <>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.12em] text-rivals-ink-muted ${block.condition ? "mt-3" : ""}`}
              >
                Why this route
              </p>
              <p className="mt-0.5 text-sm leading-6 text-rivals-ink">{block.notes}</p>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-[8rem] p-5 sm:p-6">
        {structured ? (
          <BlockCombo block={block} abilityLookup={abilityLookup} clip={block.clip} embedded />
        ) : (
          <LegacyComboFallback block={block} />
        )}
      </div>
    </article>
  );
}
