"use client";

import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { ComboBuilderEditor } from "./combo-builder-editor";
import type { ComboGuideBlock } from "./types";
import { editorInputClass } from "@/components/ui/rivals-editor-field";

type ComboBlockEditorProps = {
  block: ComboGuideBlock;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  onReplace: (next: ComboGuideBlock) => void;
};

/** Shared entry for admin body editor and inline combo route cards. */
export function ComboBlockEditor({
  block,
  abilityLookup,
  onReplace,
}: ComboBlockEditorProps) {
  if (abilityLookup && abilityLookup.size > 0) {
    return (
      <ComboBuilderEditor
        block={block}
        abilityLookup={abilityLookup}
        onReplace={onReplace}
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-2">
      <input
        className={editorInputClass()}
        value={block.name}
        onChange={(e) => onReplace({ ...block, name: e.currentTarget.value })}
        placeholder="Combo name"
      />
      <textarea
        rows={4}
        className={`${editorInputClass()} font-mono text-xs`}
        value={block.steps.join("\n")}
        onChange={(e) => {
          const lines = e.currentTarget.value
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          onReplace({ ...block, steps: lines.length > 0 ? lines : ["Step 1"] });
        }}
        placeholder="One step per line"
      />
    </div>
  );
}

export type { ComboBlockEditorProps as ComboBlockEditorShellProps };
