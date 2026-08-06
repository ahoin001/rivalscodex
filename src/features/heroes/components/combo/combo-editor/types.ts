import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";

export type ComboGuideBlock = Extract<HeroGuideBlock, { type: "combo" }>;

export type ComboBlockEditorProps = {
  block: ComboGuideBlock;
  abilityLookup: Map<string, ResolvedAbilityRef>;
  onReplace: (next: ComboGuideBlock) => void;
};
