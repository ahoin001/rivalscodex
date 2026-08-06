"use client";

import type { ComboDifficulty } from "@/data/schema";
import { RivalsDisclosure } from "@/components/ui/rivals-disclosure";
import { RivalsEditorField, editorInputClass } from "@/components/ui/rivals-editor-field";
import { DIFFICULTY_TIERS } from "@/features/heroes/combo-display";
import type { ComboBlockEditorProps, ComboGuideBlock } from "./types";

const DIFFICULTY_OPTIONS: { value: ComboDifficulty | ""; label: string }[] = [
  { value: "", label: "No difficulty tag" },
  ...DIFFICULTY_TIERS.map((t) => ({
    value: t.key as ComboDifficulty | "",
    label: t.label,
  })),
];

type ComboBuilderMetadataProps = Pick<ComboBlockEditorProps, "block" | "onReplace">;

/** Name + difficulty — always visible at the top of the builder. */
export function ComboBuilderHeader({ block, onReplace }: ComboBuilderMetadataProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <RivalsEditorField label="Combo name">
        <input
          className={editorInputClass()}
          value={block.name}
          onChange={(e) => onReplace({ ...block, name: e.currentTarget.value })}
          placeholder="Combo name"
        />
      </RivalsEditorField>
      <RivalsEditorField label="Difficulty">
        <select
          className={editorInputClass()}
          value={block.difficulty ?? ""}
          onChange={(e) =>
            onReplace({
              ...block,
              difficulty: e.currentTarget.value
                ? (e.currentTarget.value as ComboDifficulty)
                : undefined,
            })
          }
        >
          {DIFFICULTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </RivalsEditorField>
    </div>
  );
}

/** Tags, notes, resource cost, clip — collapsed by default. */
export function ComboBuilderOptionalDetails({ block, onReplace }: ComboBuilderMetadataProps) {
  const optionalCount =
    (block.condition ? 1 : 0) +
    (block.tags?.length ? 1 : 0) +
    (block.notes ? 1 : 0) +
    (block.resourceCost ? 1 : 0) +
    (block.clip ? 1 : 0);

  return (
    <RivalsDisclosure
      title="Optional details"
      description="Condition, tags, notes, resource cost, clip"
      badge={optionalCount > 0 ? `${optionalCount} set` : undefined}
      defaultOpen={false}
      tone="quiet"
    >
      <div className="space-y-3">
        <RivalsEditorField label="Condition / prereq">
          <input
            className={editorInputClass()}
            value={block.condition ?? ""}
            onChange={(e) =>
              onReplace({
                ...block,
                condition: e.currentTarget.value.trim() ? e.currentTarget.value : undefined,
              })
            }
            placeholder="Short setup note (optional)"
          />
        </RivalsEditorField>

        <RivalsEditorField label="Tags (comma-separated, max 4)">
          <input
            className={editorInputClass()}
            value={(block.tags ?? []).join(", ")}
            onChange={(e) => {
              const tags = e.currentTarget.value
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
                .slice(0, 4);
              onReplace({
                ...block,
                tags: tags.length > 0 ? tags : undefined,
              });
            }}
            placeholder="275, Burst, Anti-dive"
          />
        </RivalsEditorField>

        <RivalsEditorField label="Notes">
          <textarea
            rows={2}
            className={editorInputClass()}
            value={block.notes ?? ""}
            onChange={(e) =>
              onReplace({
                ...block,
                notes: e.currentTarget.value.trim() ? e.currentTarget.value : undefined,
              })
            }
            placeholder="When to use this route, matchup context, etc."
          />
        </RivalsEditorField>

        <RivalsDisclosure title="Resource cost" defaultOpen={Boolean(block.resourceCost)} tone="quiet">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className={editorInputClass()}
              value={block.resourceCost?.resourceName ?? ""}
              onChange={(e) => {
                const name = e.currentTarget.value.trim();
                if (!name) {
                  onReplace({ ...block, resourceCost: undefined });
                  return;
                }
                onReplace({
                  ...block,
                  resourceCost: {
                    resourceName: name,
                    startingAmount: block.resourceCost?.startingAmount ?? 0,
                    perStepDelta: block.resourceCost?.perStepDelta,
                  },
                });
              }}
              placeholder="Resource name"
            />
            <input
              type="number"
              className={editorInputClass()}
              value={block.resourceCost?.startingAmount ?? ""}
              onChange={(e) => {
                const amount = parseInt(e.currentTarget.value, 10);
                if (isNaN(amount) || !block.resourceCost?.resourceName) return;
                onReplace({
                  ...block,
                  resourceCost: {
                    ...block.resourceCost,
                    resourceName: block.resourceCost.resourceName,
                    startingAmount: amount,
                  },
                });
              }}
              placeholder="Starting amount"
            />
            <input
              className={`${editorInputClass()} font-mono`}
              value={block.resourceCost?.perStepDelta?.join(", ") ?? ""}
              onChange={(e) => {
                const vals = e.currentTarget.value
                  .split(",")
                  .map((v) => parseInt(v.trim(), 10))
                  .filter((v) => !isNaN(v));
                if (!block.resourceCost?.resourceName) return;
                onReplace({
                  ...block,
                  resourceCost: {
                    ...block.resourceCost,
                    resourceName: block.resourceCost.resourceName,
                    startingAmount: block.resourceCost.startingAmount,
                    perStepDelta: vals.length > 0 ? vals : undefined,
                  },
                });
              }}
              placeholder="Per-step deltas"
            />
          </div>
        </RivalsDisclosure>

        <RivalsEditorField label="Clip (YouTube)">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={editorInputClass()}
              value={block.clip?.label ?? ""}
              onChange={(e) => {
                const label = e.currentTarget.value.trim();
                const href = block.clip?.href?.trim() ?? "";
                if (!href) {
                  onReplace({ ...block, clip: undefined });
                  return;
                }
                onReplace({
                  ...block,
                  clip: { label: label || "Watch clip", href },
                });
              }}
              placeholder="Clip label"
            />
            <input
              className={editorInputClass()}
              value={block.clip?.href ?? ""}
              onChange={(e) => {
                const href = e.currentTarget.value.trim();
                const label = block.clip?.label?.trim() ?? "";
                if (!href) {
                  onReplace({ ...block, clip: undefined });
                  return;
                }
                onReplace({
                  ...block,
                  clip: { label: label || "Watch clip", href },
                });
              }}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
        </RivalsEditorField>
      </div>
    </RivalsDisclosure>
  );
}

/** @deprecated Use ComboBuilderHeader + ComboBuilderOptionalDetails */
export function ComboBuilderMetadata(props: ComboBuilderMetadataProps) {
  return (
    <>
      <ComboBuilderHeader {...props} />
      <ComboBuilderOptionalDetails {...props} />
    </>
  );
}

export function ComboBuilderFallbackSteps({
  block,
  onReplace,
}: {
  block: ComboGuideBlock;
  onReplace: (next: ComboGuideBlock) => void;
}) {
  return (
    <textarea
      rows={3}
      className={`${editorInputClass()} font-mono text-xs`}
      value={block.steps.join("\n")}
      onChange={(e) => {
        const lines = e.currentTarget.value
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        onReplace({ ...block, steps: lines.length > 0 ? lines : ["Step 1"] });
      }}
    />
  );
}
