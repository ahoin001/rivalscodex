"use client";

import { useCallback, useMemo, useRef } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import { HeroGuideBody } from "@/features/heroes/components/hero-guide-body";
import { useHeroGuideEditContext } from "@/features/heroes/context/hero-guide-edit-context";
import { useOptionalAbilityLookup } from "@/features/heroes/components/ability-lookup-provider";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";

type CombosTabPanelProps = {
  bodyBlocks: HeroGuideBlock[];
  anchorPrefix: string;
  heroPortraits?: HeroPortraitEntry[];
};

function defaultComboBlock(): Extract<HeroGuideBlock, { type: "combo" }> {
  return {
    type: "combo",
    name: "New combo route",
    steps: ["Step 1"],
    difficulty: "bread-and-butter",
  };
}

export function CombosTabPanel({
  bodyBlocks,
  anchorPrefix,
  heroPortraits,
}: CombosTabPanelProps) {
  const edit = useHeroGuideEditContext();
  const abilityLookup = useOptionalAbilityLookup();

  const nonComboBlocks = useMemo(
    () => bodyBlocks.filter((b) => b.type !== "combo"),
    [bodyBlocks],
  );

  const comboBlocks = useMemo(
    () =>
      bodyBlocks.filter(
        (b): b is Extract<HeroGuideBlock, { type: "combo" }> => b.type === "combo",
      ),
    [bodyBlocks],
  );

  const addComboRef = useRef<HTMLDivElement>(null);

  const updateBody = useCallback(
    (nextCombos: Extract<HeroGuideBlock, { type: "combo" }>[]) => {
      if (!edit) return;
      edit.updateCombosBody([...nonComboBlocks, ...nextCombos]);
    },
    [edit, nonComboBlocks],
  );

  const handleAddCombo = useCallback(() => {
    if (!edit) return;
    const next = [...comboBlocks, defaultComboBlock()];
    updateBody(next);
    edit.setCombosEditMode(true);
    const globalIndex = nonComboBlocks.length + next.length - 1;
    edit.setEditingComboBlockIndex(globalIndex);
    requestAnimationFrame(() => {
      addComboRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [edit, comboBlocks, nonComboBlocks.length, updateBody]);

  const body = (
    <HeroGuideBody
      blocks={bodyBlocks}
      anchorPrefix={anchorPrefix}
      abilityLookup={abilityLookup}
      heroPortraits={heroPortraits}
      comboEditMode={edit?.combosEditMode}
      editingComboBlockIndex={edit?.editingComboBlockIndex ?? null}
      onComboBlockReplace={(index, next) => {
        const comboIndex = index - nonComboBlocks.length;
        if (comboIndex < 0 || comboIndex >= comboBlocks.length) return;
        const nextCombos = [...comboBlocks];
        nextCombos[comboIndex] = next;
        updateBody(nextCombos);
      }}
      onComboBlockDuplicate={(index) => {
        const comboIndex = index - nonComboBlocks.length;
        if (comboIndex < 0) return;
        const copy = structuredClone(comboBlocks[comboIndex]);
        copy.name = `${copy.name} (copy)`;
        updateBody([...comboBlocks, copy]);
      }}
      onComboBlockDelete={(index) => {
        const comboIndex = index - nonComboBlocks.length;
        if (comboIndex < 0) return;
        updateBody(comboBlocks.filter((_, i) => i !== comboIndex));
        edit?.setEditingComboBlockIndex(null);
      }}
      onComboBlockMove={(index, dir) => {
        const comboIndex = index - nonComboBlocks.length;
        if (comboIndex < 0) return;
        const j = comboIndex + dir;
        if (j < 0 || j >= comboBlocks.length) return;
        const next = [...comboBlocks];
        [next[comboIndex], next[j]] = [next[j], next[comboIndex]];
        updateBody(next);
      }}
      onComboStartEdit={(index) => {
        edit?.setEditingComboBlockIndex(index);
        edit?.setCombosEditMode(true);
      }}
      onComboStopEdit={() => edit?.setEditingComboBlockIndex(null)}
    />
  );

  if (!edit) {
    return body;
  }

  return (
    <div className="space-y-4" ref={addComboRef}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-gold/30 bg-brand-gold-muted/30 px-4 py-3">
        <p className="text-xs text-rivals-ink-soft">
          Personal edit mode — changes auto-save to the live guide.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              edit.setCombosEditMode((v) => !v);
              if (edit.combosEditMode) {
                edit.setEditingComboBlockIndex(null);
              }
            }}
            className={`rounded px-3 py-1.5 font-display text-[11px] font-bold uppercase italic tracking-wide transition-colors ${
              edit.combosEditMode
                ? "bg-rivals-yellow-500 text-rivals-ink"
                : "border border-rivals-light-300 bg-white text-rivals-ink-soft hover:bg-rivals-light-100"
            }`}
          >
            {edit.combosEditMode ? "Done editing" : "Edit combos"}
          </button>
          <button
            type="button"
            onClick={handleAddCombo}
            className="rounded bg-rivals-ink px-3 py-1.5 font-display text-[11px] font-bold uppercase italic tracking-wide text-white hover:bg-rivals-ink-soft"
          >
            + Add combo
          </button>
        </div>
      </div>
      {body}
    </div>
  );
}
