"use client";

import Image from "next/image";
import type { ComboModifier, ComboStep } from "@/data/schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { slugifyAbilityName } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";
import { COMBO_STEP_REPEAT_MAX } from "@/features/heroes/combo-step-utils";
import { MODIFIER_DESCRIPTORS } from "@/features/heroes/combo-display";
import { editorInputClass } from "@/components/ui/rivals-editor-field";
import { SortableDragHandle, useSortableDrag } from "@/components/ui/rivals-sortable";

const MODIFIER_OPTIONS: { value: ComboModifier | ""; label: string }[] = [
  { value: "", label: "Normal →" },
  ...MODIFIER_DESCRIPTORS.map((m) => ({
    value: m.key as ComboModifier | "",
    label: m.authorLabel,
  })),
];

export type ComboStepListProps = {
  steps: ComboStep[];
  abilityLookup: Map<string, ResolvedAbilityRef>;
  onUpdateModifier: (index: number, modifier: ComboModifier | undefined) => void;
  onUpdateActionLabel: (index: number, label: string) => void;
  onUpdateRepeat: (index: number, repeat: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
};

export function ComboStepList({
  steps,
  abilityLookup,
  onUpdateModifier,
  onUpdateActionLabel,
  onUpdateRepeat,
  onReorder,
  onRemove,
}: ComboStepListProps) {
  const sortable = useSortableDrag({ onReorder });

  if (steps.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-brand-gold/25 bg-brand-gold-muted/15 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-rivals-ink">
          Combo chain
        </span>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-rivals-ink-muted">
          {steps.length} step{steps.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-[10px] leading-relaxed text-rivals-ink-muted">
        Drag steps by the handle to reorder the chain.
      </p>
      <ol className="space-y-1">
        {steps.map((step, index) => {
          const ref =
            step.kind === "ability"
              ? abilityLookup.get(slugifyAbilityName(step.abilityRef)) ??
                abilityLookup.get(step.abilityRef)
              : null;
          const repeatValue = step.repeat ?? 1;

          return (
            <li
              key={`step-${index}`}
              {...sortable.getItemProps(index)}
              className={sortable.itemClassName(
                index,
                "flex flex-wrap items-center gap-2 rounded-md border border-rivals-light-300/90 bg-white px-2 py-1.5 transition-[box-shadow,opacity]",
              )}
            >
              <SortableDragHandle {...sortable.getHandleProps(index)} />
              <span className="w-5 shrink-0 text-center text-[10px] font-bold text-rivals-ink-muted">
                {index + 1}
              </span>

              {step.kind === "ability" && ref ? (
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  {ref.iconUrl ? (
                    <Image
                      src={ref.iconUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  ) : null}
                  <span className="truncate text-xs font-semibold text-rivals-ink">
                    {ref.name}
                  </span>
                  <span className="text-[9px] text-rivals-ink-muted">
                    [{formatKeybindLabel(ref.keybind)}]
                  </span>
                </div>
              ) : step.kind === "action" ? (
                <input
                  className={`${editorInputClass()} min-w-0 flex-1 text-xs`}
                  value={step.label}
                  onChange={(e) => onUpdateActionLabel(index, e.currentTarget.value)}
                  placeholder="Action label"
                />
              ) : step.kind === "ability" ? (
                <span className="min-w-0 flex-1 text-xs italic text-rivals-ink-muted">
                  (unresolved: {step.abilityRef})
                </span>
              ) : null}

              <label className="flex shrink-0 items-center gap-1 text-[10px] text-rivals-ink-muted">
                <span className="font-bold text-brand-gold">×</span>
                <select
                  className="rounded border border-rivals-light-300 px-1 py-0.5 text-[10px] tabular-nums"
                  value={repeatValue}
                  onChange={(e) => onUpdateRepeat(index, parseInt(e.currentTarget.value, 10))}
                  aria-label={`Repeat step ${index + 1}`}
                >
                  {Array.from({ length: COMBO_STEP_REPEAT_MAX }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              {index > 0 ? (
                <select
                  className={`shrink-0 rounded border px-1 py-0.5 text-[10px] ${
                    step.modifier === "or"
                      ? "border-violet-400/50 bg-violet-500/10 text-violet-800"
                      : "border-rivals-light-300"
                  }`}
                  value={step.modifier ?? ""}
                  onChange={(e) =>
                    onUpdateModifier(
                      index,
                      e.currentTarget.value
                        ? (e.currentTarget.value as ComboModifier)
                        : undefined,
                    )
                  }
                >
                  {MODIFIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="shrink-0 text-[9px] text-rivals-ink-muted">start</span>
              )}

              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label="Remove step"
                className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] text-rose-700 hover:bg-rose-50"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
