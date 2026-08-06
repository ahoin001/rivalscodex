"use client";

import { useCallback, useMemo } from "react";
import type { ComboStep } from "@/data/schema";
import {
  COMBO_STEP_REPEAT_MAX,
  comboStepsMatchForRepeat,
  formatComboStepText,
  normalizeComboRepeat,
} from "@/features/heroes/combo-step-utils";
import { ComboChain } from "@/features/heroes/components/combo-chain";
import { RivalsDisclosure } from "@/components/ui/rivals-disclosure";
import { reorderByIndex } from "@/lib/reorder-list";
import { ComboAbilityPalette } from "./combo-ability-palette";
import {
  ComboBuilderFallbackSteps,
  ComboBuilderHeader,
  ComboBuilderOptionalDetails,
} from "./combo-builder-metadata";
import { ComboStepList } from "./combo-step-list";
import type { ComboBlockEditorProps } from "./types";

export function ComboBuilderEditor({
  block,
  abilityLookup,
  onReplace,
}: ComboBlockEditorProps) {
  const steps = useMemo(() => block.structuredSteps ?? [], [block.structuredSteps]);

  const updateSteps = useCallback(
    (next: ComboStep[]) => {
      const textSteps = next.map((s) => formatComboStepText(s, abilityLookup));
      onReplace({
        ...block,
        structuredSteps: next.length > 0 ? next : undefined,
        steps: textSteps.length > 0 ? textSteps : block.steps,
      });
    },
    [abilityLookup, block, onReplace],
  );

  const appendStep = useCallback(
    (newStep: ComboStep) => {
      const last = steps[steps.length - 1];
      if (last && comboStepsMatchForRepeat(last, newStep)) {
        const currentRepeat = last.repeat ?? 1;
        if (currentRepeat < COMBO_STEP_REPEAT_MAX) {
          updateSteps([
            ...steps.slice(0, -1),
            { ...last, repeat: normalizeComboRepeat(currentRepeat + 1) },
          ]);
          return;
        }
      }
      updateSteps([...steps, newStep]);
    },
    [steps, updateSteps],
  );

  return (
    <div className="min-w-0 space-y-3">
      <ComboBuilderHeader block={block} onReplace={onReplace} />
      <ComboBuilderOptionalDetails block={block} onReplace={onReplace} />

      <RivalsDisclosure
        title="Ability palette"
        description="Click abilities to append steps to the chain below"
        defaultOpen={steps.length === 0}
        tone="quiet"
      >
        <ComboAbilityPalette
          abilityLookup={abilityLookup}
          onAddAbility={(slug) => appendStep({ kind: "ability", abilityRef: slug })}
          onAddAction={() => appendStep({ kind: "action", label: "action" })}
          compact
        />
      </RivalsDisclosure>

      {steps.length > 0 ? (
        <ComboStepList
          steps={steps}
          abilityLookup={abilityLookup}
          onUpdateModifier={(index, modifier) =>
            updateSteps(steps.map((s, i) => (i === index ? { ...s, modifier } : s)))
          }
          onUpdateActionLabel={(index, label) =>
            updateSteps(
              steps.map((s, i) =>
                i === index && s.kind === "action" ? { ...s, label } : s,
              ),
            )
          }
          onUpdateRepeat={(index, repeat) =>
            updateSteps(
              steps.map((s, i) =>
                i === index ? { ...s, repeat: normalizeComboRepeat(repeat) } : s,
              ),
            )
          }
          onReorder={(fromIndex, toIndex) =>
            updateSteps(reorderByIndex(steps, fromIndex, toIndex))
          }
          onRemove={(index) => updateSteps(steps.filter((_, i) => i !== index))}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-rivals-light-300 bg-rivals-light-50/80 px-3 py-4 text-center text-xs leading-relaxed text-rivals-ink-muted">
          No steps yet — open the ability palette above and click kit icons to build the chain.
        </p>
      )}

      {steps.length > 0 ? (
        <RivalsDisclosure
          title="Live preview"
          description="How readers see this combo on the hero page"
          defaultOpen={steps.length <= 8}
          tone="quiet"
        >
          <div className="min-w-0 overflow-x-auto rounded-lg border border-rivals-light-300/80 bg-rivals-light-50/60 p-3">
            <ComboChain
              name={block.name || "Unnamed combo"}
              structuredSteps={steps}
              abilityLookup={abilityLookup}
              difficulty={block.difficulty}
              resourceCost={block.resourceCost}
              condition={block.condition}
              notes={block.notes}
              variant="light"
            />
          </div>
        </RivalsDisclosure>
      ) : null}

      <RivalsDisclosure title="Advanced" description="Raw JSON and text fallback" defaultOpen={false} tone="quiet">
        <div className="space-y-3">
          <pre className="max-h-36 overflow-auto rounded border border-rivals-light-300 bg-rivals-light-50 p-2 font-mono text-[10px] leading-relaxed text-rivals-ink-soft">
            {JSON.stringify(block, null, 2)}
          </pre>
          <div>
            <p className="mb-1.5 text-[10px] leading-relaxed text-rivals-ink-muted">
              Fallback text steps (auto-synced from structured steps)
            </p>
            <ComboBuilderFallbackSteps block={block} onReplace={onReplace} />
          </div>
        </div>
      </RivalsDisclosure>
    </div>
  );
}
