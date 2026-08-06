"use client";

import { lazy, Suspense } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { getDifficultyTier } from "@/features/heroes/combo-display";
import { RivalsBrandButton } from "@/components/ui/rivals-brand-button";
import { BlockCombo } from "@/features/heroes/components/hero-guide-body/block-combo";

const ComboRouteCardEdit = lazy(() =>
  import("./combo-route-card-edit").then((mod) => ({
    default: mod.ComboRouteCardEdit,
  })),
);

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
  /** Zero-based index among combo blocks in this tab. */
  comboIndex?: number;
  totalCombos?: number;
};

/** Edit-mode combo card — always expanded; readers use ComboShowcaseCard instead. */
export function ComboRouteCard({
  block,
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
  const tier = getDifficultyTier(block.difficulty);
  const subtitle = [block.condition, block.notes].filter(Boolean).join(" · ");

  return (
    <article className="overflow-hidden rounded-lg border border-rivals-ink/12 bg-white/90 shadow-sm transition-[border-color,box-shadow,transform,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:border-brand-gold/25 hover:shadow-md">
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
            <p className="text-xs leading-5 text-rivals-ink-muted">{subtitle}</p>
          ) : null}
        </div>

        {editMode ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <RivalsBrandButton
              size="sm"
              variant={isEditing ? "primary" : "outline"}
              onClick={() => {
                if (isEditing) {
                  onStopEdit?.();
                } else {
                  onStartEdit?.();
                }
              }}
            >
              {isEditing ? "Done & publish" : "Edit"}
            </RivalsBrandButton>
            <button
              type="button"
              className="rounded border border-rivals-light-300 px-2 py-1 text-[10px] font-semibold uppercase text-rivals-ink-soft transition-colors duration-[var(--motion-fast)] hover:bg-rivals-light-100"
              onClick={onDuplicate}
            >
              Copy
            </button>
            <button
              type="button"
              disabled={!canMoveUp}
              className="rounded border border-rivals-light-300 px-1.5 py-1 text-[10px] uppercase transition-colors duration-[var(--motion-fast)] hover:bg-rivals-light-100 disabled:opacity-30"
              onClick={() => onMove?.(-1)}
            >
              Up
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              className="rounded border border-rivals-light-300 px-1.5 py-1 text-[10px] uppercase transition-colors duration-[var(--motion-fast)] hover:bg-rivals-light-100 disabled:opacity-30"
              onClick={() => onMove?.(1)}
            >
              Down
            </button>
            <button
              type="button"
              className="rounded border border-rose-200 px-2 py-1 text-[10px] font-semibold uppercase text-rose-800 transition-colors duration-[var(--motion-fast)] hover:bg-rose-50"
              onClick={onDelete}
            >
              Del
            </button>
          </div>
        ) : null}
      </header>

      <div className="panel-enter space-y-4 p-4">
        {isEditing && abilityLookup && onReplace ? (
          <Suspense
            fallback={
              <p className="text-xs text-rivals-ink-muted">Loading combo editor…</p>
            }
          >
            <ComboRouteCardEdit
              block={block}
              abilityLookup={abilityLookup}
              onReplace={onReplace}
            />
          </Suspense>
        ) : (
          <BlockCombo block={block} abilityLookup={abilityLookup} clip={block.clip} />
        )}
      </div>
    </article>
  );
}
