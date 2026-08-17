"use client";

import { useCallback, useState } from "react";
import type { HeroGuideBlock, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { SortableDragHandle, useSortableDrag } from "@/components/ui/rivals-sortable";
import { remapTrackedIndex, reorderByIndex } from "@/lib/reorder-list";
import { BlockAddToolbar, BlockAction } from "./block-add-toolbar";
import { BlockFields } from "./block-fields";
import { blockPreview, blockTypeChipClass } from "./block-editor-meta";

type HeroGuideBodyEditorProps = {
  tabId: HeroGuideTabId;
  blocks: HeroGuideBlock[];
  onChange: (next: HeroGuideBlock[] | undefined) => void;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  heroRoster?: HeroPortraitEntry[];
};

export function HeroGuideBodyEditor({
  tabId,
  blocks,
  onChange,
  abilityLookup,
  heroRoster,
}: HeroGuideBodyEditorProps) {
  const isCombosTab = tabId === "combos";
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    isCombosTab && blocks.length > 0 ? 0 : null,
  );
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

  const isBlockExpanded = (index: number) =>
    isCombosTab ? expandedIndex === index : (expandedMap[index] ?? false);

  const toggleBlockExpanded = (index: number) => {
    if (isCombosTab) {
      setExpandedIndex((current) => (current === index ? null : index));
      return;
    }
    setExpandedMap((current) => ({ ...current, [index]: !current[index] }));
  };

  const replaceAt = useCallback(
    (index: number, block: HeroGuideBlock) => {
      const next = blocks.map((entry, entryIndex) => (entryIndex === index ? block : entry));
      onChange(next.length > 0 ? next : undefined);
    },
    [blocks, onChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      const next = blocks.filter((_, entryIndex) => entryIndex !== index);
      onChange(next.length > 0 ? next : undefined);
    },
    [blocks, onChange],
  );

  const append = useCallback(
    (block: HeroGuideBlock) => {
      const next = [...blocks, block];
      onChange(next);
      if (isCombosTab && block.type === "combo") {
        setExpandedIndex(next.length - 1);
      }
    },
    [blocks, isCombosTab, onChange],
  );

  const reorderBlocks = useCallback(
    (fromIndex: number, toIndex: number) => {
      const next = reorderByIndex(blocks, fromIndex, toIndex);
      onChange(next);
      if (isCombosTab) {
        setExpandedIndex((current) => remapTrackedIndex(current, fromIndex, toIndex));
      }
    },
    [blocks, isCombosTab, onChange],
  );

  const sortable = useSortableDrag({ onReorder: reorderBlocks });

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-lg border border-rivals-light-300 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rivals-light-200 pb-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-display text-sm font-bold uppercase italic tracking-wide text-rivals-ink">
            {isCombosTab ? "Combos" : "Structured body"}
          </h3>
          <p className="max-w-prose text-[11px] leading-relaxed text-rivals-ink-muted">
            {isCombosTab
              ? "Drag combos by the handle to reorder. Expand one card at a time to edit its chain."
              : "When present, these blocks replace priority/secondary cue columns on the live page. Drag to reorder."}
          </p>
        </div>
        <BlockAddToolbar tabId={tabId} heroRoster={heroRoster} onAppend={append} />
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-rivals-light-300 bg-rivals-light-50 px-4 py-6 text-center text-xs leading-relaxed text-rivals-ink-muted">
          {isCombosTab
            ? "No combos yet — add one to build structured routes for this hero."
            : "No blocks yet — add one or rely on priority cues only."}
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block, index) => {
            const open = isBlockExpanded(index);
            const isCombo = block.type === "combo";

            return (
              <li
                key={`block-${index}`}
                {...sortable.getItemProps(index)}
                className={sortable.itemClassName(
                  index,
                  `min-w-0 rounded-lg border bg-rivals-light-50/50 transition-[box-shadow,opacity] ${
                    open ? "overflow-visible" : "overflow-hidden"
                  } ${
                    isCombo && open
                      ? "border-brand-gold/35 shadow-sm"
                      : "border-rivals-light-300"
                  }`,
                )}
              >
                <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <SortableDragHandle {...sortable.getHandleProps(index)} />
                  <button
                    type="button"
                    onClick={() => toggleBlockExpanded(index)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={open}
                  >
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 font-display text-[10px] font-bold uppercase italic tracking-wide ${blockTypeChipClass(block)}`}
                    >
                      {block.type}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold text-rivals-ink">
                      {blockPreview(block)}
                    </span>
                    <span
                      className={`ml-auto shrink-0 text-[10px] text-rivals-ink-muted transition-transform duration-[var(--motion-medium)] ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    >
                      ▼
                    </span>
                  </button>
                  <BlockAction label="Delete" onClick={() => removeAt(index)} danger />
                </div>
                {open ? (
                  <div className="border-t border-rivals-light-300/80 bg-white px-3 py-3">
                    <BlockFields
                      block={block}
                      onReplace={(next) => replaceAt(index, next)}
                      abilityLookup={abilityLookup}
                      heroRoster={heroRoster}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
