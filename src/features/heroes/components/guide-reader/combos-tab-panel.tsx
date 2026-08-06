"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import { HeroGuideBody } from "@/features/heroes/components/hero-guide-body";
import { CombosReaderPanel } from "@/features/heroes/components/combos-reader-panel";
import { useHeroGuideEditContext } from "@/features/heroes/context/hero-guide-edit-context";
import { useOptionalAbilityLookup } from "@/features/heroes/components/ability-lookup-provider";
import { scrollTargetIntoPanel } from "@/features/heroes/components/guide-panel-scroll";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { inlineCombosEditEnabled } from "@/lib/guide-edit-policy";

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
    structuredSteps: [],
    difficulty: "bread-and-butter",
  };
}

function EditToolbarStatus({
  hasUnsavedChanges,
  isPublishing,
  saveStatus,
  saveError,
  publishFeedback,
}: {
  hasUnsavedChanges: boolean;
  isPublishing: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error" | "local";
  saveError: string | null;
  publishFeedback: string | null;
}) {
  if (publishFeedback) {
    return (
      <p className="text-xs font-medium text-emerald-900" role="status">
        {publishFeedback}
      </p>
    );
  }

  if (isPublishing) {
    return (
      <p className="text-xs font-medium text-rivals-ink-soft" role="status">
        Publishing your changes…
      </p>
    );
  }

  if (saveStatus === "error" && saveError) {
    return (
      <p className="text-xs font-medium text-rose-800" role="alert">
        Publish failed — {saveError}
      </p>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <p className="text-xs leading-relaxed text-rivals-ink-soft break-words" role="status">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden />
        Unsaved changes — auto-publishes in a moment, or press{" "}
        <span className="font-semibold text-rivals-ink">Publish</span>.
      </p>
    );
  }

  if (saveStatus === "saved") {
    return (
      <p className="text-xs font-medium text-emerald-800" role="status">
        Published — readers see your latest combos.
      </p>
    );
  }

  return (
    <p className="text-xs text-rivals-ink-soft">
      Edit combo routes, then publish to update the live guide.
    </p>
  );
}

export function CombosTabPanel({
  bodyBlocks,
  anchorPrefix,
  heroPortraits,
}: CombosTabPanelProps) {
  const edit = useHeroGuideEditContext();
  const abilityLookup = useOptionalAbilityLookup();
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showPublishFeedback = useCallback((message: string) => {
    setPublishFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setPublishFeedback(null), 4000);
  }, []);

  const handlePublish = useCallback(async () => {
    if (!edit) return;
    const result = await edit.publishNow();
    if (result.ok) {
      showPublishFeedback(
        result.scope === "local"
          ? "Saved locally — enable Supabase to sync to the live site."
          : "Published — your combo changes are live.",
      );
    }
  }, [edit, showPublishFeedback]);

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
      const node = addComboRef.current;
      if (!node) return;
      scrollTargetIntoPanel(node, {
        offset: 80,
        behavior: "smooth",
      });
    });
  }, [edit, comboBlocks, nonComboBlocks.length, updateBody]);

  const handleStopComboEdit = useCallback(async () => {
    if (!edit) return;
    edit.setEditingComboBlockIndex(null);
    await edit.publishNow();
  }, [edit]);

  const handleToggleEditMode = useCallback(async () => {
    if (!edit) return;
    if (edit.combosEditMode) {
      const result = await edit.exitCombosEditMode();
      if (result.ok) {
        showPublishFeedback(
          result.scope === "local"
            ? "Saved locally — edit mode closed."
            : "Published — edit mode closed.",
        );
      }
      return;
    }
    edit.setCombosEditMode(true);
  }, [edit, showPublishFeedback]);

  const editBody = (
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
      onComboStopEdit={() => {
        void handleStopComboEdit();
      }}
    />
  );

  const readerPanel = (
    <CombosReaderPanel
      bodyBlocks={bodyBlocks}
      anchorPrefix={anchorPrefix}
    />
  );

  if (!edit || !inlineCombosEditEnabled()) {
    return readerPanel;
  }

  const publishDisabled = edit.isPublishing;

  return (
    <div className="min-w-0 space-y-4" ref={addComboRef}>
      <div
        className={`sticky top-0 z-20 min-w-0 space-y-3 rounded-lg border px-3 py-3 backdrop-blur-sm sm:px-4 ${
          edit.combosEditMode
            ? "border-brand-gold/45 bg-brand-gold-muted/55 shadow-sm"
            : "border-brand-gold/30 bg-brand-gold-muted/30"
        }`}
      >
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.18em] text-rivals-ink">
              {edit.combosEditMode ? "Editing combos" : "Personal edit mode"}
            </p>
            <EditToolbarStatus
              hasUnsavedChanges={edit.hasUnsavedChanges}
              isPublishing={edit.isPublishing}
              saveStatus={edit.saveStatus}
              saveError={edit.saveError}
              publishFeedback={publishFeedback}
            />
          </div>

          <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
            {edit.combosEditMode ? (
              <>
                <button
                  type="button"
                  disabled={publishDisabled}
                  onClick={() => void handlePublish()}
                  className="min-h-10 flex-1 rounded bg-rivals-yellow-500 px-4 py-2 font-display text-[11px] font-bold uppercase italic tracking-wide text-rivals-ink transition-colors hover:bg-rivals-yellow-400 disabled:cursor-not-allowed disabled:opacity-55 sm:flex-none"
                >
                  {edit.isPublishing ? "Publishing…" : "Publish"}
                </button>
                <button
                  type="button"
                  disabled={publishDisabled}
                  onClick={() => void handleToggleEditMode()}
                  className="min-h-10 flex-1 rounded border border-rivals-light-300 bg-white px-3 py-2 font-display text-[11px] font-bold uppercase italic tracking-wide text-rivals-ink-soft transition-colors hover:bg-rivals-light-100 disabled:cursor-not-allowed disabled:opacity-55 sm:flex-none"
                >
                  Done editing
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleToggleEditMode()}
                className="min-h-10 flex-1 rounded border border-rivals-light-300 bg-white px-3 py-1.5 font-display text-[11px] font-bold uppercase italic tracking-wide text-rivals-ink-soft transition-colors hover:bg-rivals-light-100 sm:flex-none"
              >
                Edit combos
              </button>
            )}
            <button
              type="button"
              onClick={handleAddCombo}
              disabled={publishDisabled}
              className="min-h-10 flex-1 rounded bg-rivals-ink px-3 py-1.5 font-display text-[11px] font-bold uppercase italic tracking-wide text-white transition-colors hover:bg-rivals-ink-soft disabled:cursor-not-allowed disabled:opacity-55 sm:flex-none"
            >
              + Add combo
            </button>
          </div>
        </div>
      </div>
      {comboBlocks.length === 0 ? (
        <div className="panel-enter rounded-lg border border-dashed border-rivals-light-300 bg-white/70 px-6 py-10 text-center">
          <p className="font-display text-sm font-bold uppercase italic text-rivals-ink">
            No combo routes yet
          </p>
          <p className="mt-2 text-xs leading-relaxed text-rivals-ink-soft">
            Add your first combo route with the ability palette and chain builder below.
          </p>
          <button
            type="button"
            onClick={handleAddCombo}
            className="mt-4 rounded bg-rivals-yellow-500 px-4 py-2 font-display text-[11px] font-bold uppercase italic tracking-wide text-rivals-ink hover:bg-rivals-yellow-400"
          >
            + Add your first combo
          </button>
        </div>
      ) : null}
      {edit.combosEditMode ? editBody : readerPanel}
    </div>
  );
}
