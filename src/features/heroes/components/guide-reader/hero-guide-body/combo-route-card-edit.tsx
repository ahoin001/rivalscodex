"use client";

import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { ComboBlockEditor } from "@/features/heroes/components/combo-editor";

type ComboBlock = Extract<HeroGuideBlock, { type: "combo" }>;

type ComboRouteCardEditProps = {
  block: ComboBlock;
  abilityLookup: Map<string, ResolvedAbilityRef>;
  onReplace: (next: ComboBlock) => void;
};

/** Isolated editor surface so reader cards do not statically import the combo builder. */
export function ComboRouteCardEdit({
  block,
  abilityLookup,
  onReplace,
}: ComboRouteCardEditProps) {
  return (
    <ComboBlockEditor
      block={block}
      abilityLookup={abilityLookup}
      onReplace={onReplace}
    />
  );
}
