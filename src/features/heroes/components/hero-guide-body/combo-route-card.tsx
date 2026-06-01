"use client";

import { useState } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { getDifficultyTier } from "@/features/heroes/combo-display";
import { BlockCombo } from "@/features/heroes/components/hero-guide-body/block-combo";
import { ComboMiniPreview } from "@/features/heroes/components/hero-guide-body/combo-mini-preview";
import { ComboBuilderEditor } from "@/features/heroes/components/combo-builder-editor";

type ComboBlock = Extract<HeroGuideBlock, { type: "combo" }>;

type ComboRouteCardProps = {
  block: ComboBlock;
  blockIndex: number;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  editMode?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onStopEdit?: () => void;
  onReplace?: (next: ComboBlock) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMove?: (dir: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export function ComboRouteCard({
  block,
  blockIndex,
  abilityLookup,
  editMode = false,
  isEditing = false,
  onStartEdit,
  onStopEdit,
  onReplace,
  onDuplicate,
  onDelete,
  onMove,
  canMoveUp = false,
  canMoveDown = false,
}: ComboRouteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = getDifficultyTier(block.difficulty);
  const hasStructured =
    !!block.structuredSteps &&
    block.structuredSteps.length > 0 &&
    !!abilityLookup;

  const showExpanded = expanded || isEditing;
  const subtitle = [block.condition, block.notes].filter(Boolean).join(" · ");

  return (
    <article className="overflow-hidden rounded-lg border border-rivals-ink/12 bg-white/90 shadow-sm transition-all duration-200 hover:border-brand-gold/25 hover:shadow-md">
      <header className="flex flex-wrap items-start gap-3 border-b border-rivals-light-300/80 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-sm font-extrabold uppercase italic text-rivals-ink sm:text-base">
              {block.name}
            </h4>
            {tier ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${tier.lightClass}`}
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
          {subtitle ? (
            <p
              className={`text-xs leading-5 text-rivals-ink-muted ${showExpanded ? "" : "line-clamp-2"}`}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {editMode ? (
            <>
              <button
                type="button"
                className="rounded border border-rivals-light-300 px-2 py-1 text-[10px] font-semibold uppercase text-rivals-ink hover:bg-rivals-light-100"
                onClick={() => {
                  if (isEditing) {
                    onStopEdit?.();
                  } else {
                    setExpanded(true);
                    onStartEdit?.();
                  }
                }}
              >
                {isEditing ? "Done" : "Edit"}
              </button>
              <button
                type="button"
                className="rounded border border-rivals-light-300 px-2 py-1 text-[10px] font-semibold uppercase text-rivals-ink-soft hover:bg-rivals-light-100"
                onClick={onDuplicate}
              >
                Copy
              </button>
              <button
                type="button"
                disabled={!canMoveUp}
                className="rounded border border-rivals-light-300 px-1.5 py-1 text-[10px] uppercase disabled:opacity-30"
                onClick={() => onMove?.(-1)}
              >
                Up
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                className="rounded border border-rivals-light-300 px-1.5 py-1 text-[10px] uppercase disabled:opacity-30"
                onClick={() => onMove?.(1)}
              >
                Down
              </button>
              <button
                type="button"
                className="rounded border border-rose-200 px-2 py-1 text-[10px] font-semibold uppercase text-rose-800 hover:bg-rose-50"
                onClick={onDelete}
              >
                Del
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded border border-brand-gold/40 bg-brand-gold-muted/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-gold hover:bg-brand-gold hover:text-rivals-ink"
              onClick={() => setExpanded((v) => !v)}
            >
              {showExpanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </header>

      {!showExpanded && hasStructured ? (
        <div className="px-4 py-3">
          <ComboMiniPreview
            structuredSteps={block.structuredSteps!}
            abilityLookup={abilityLookup!}
          />
        </div>
      ) : null}

      {showExpanded ? (
        <div className="space-y-4 p-4">
          {isEditing && abilityLookup && onReplace ? (
            <ComboBuilderEditor
              block={block}
              abilityLookup={abilityLookup}
              onReplace={onReplace}
            />
          ) : (
            <BlockCombo block={block} abilityLookup={abilityLookup} clip={block.clip} />
          )}
        </div>
      ) : null}
    </article>
  );
}
