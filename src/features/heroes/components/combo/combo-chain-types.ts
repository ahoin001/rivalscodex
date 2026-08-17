import type { ComboStep, ComboDifficulty, ComboResourceCost } from "@/data/schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import type { ComboChainVariant } from "@/features/heroes/components/combo-chain-theme";

export type ResolvedStep = {
  step: ComboStep;
  resolved: ResolvedAbilityRef | null;
  resourceDelta?: number;
};

export type CancelTargetPreview = {
  name: string;
  iconUrl?: string;
};

export type ComboChainProps = {
  name: string;
  structuredSteps: ComboStep[];
  abilityLookup: Map<string, ResolvedAbilityRef>;
  difficulty?: ComboDifficulty;
  resourceCost?: ComboResourceCost;
  condition?: string;
  notes?: string;
  className?: string;
  hideHeader?: boolean;
  hideContext?: boolean;
  /** Strip outer card chrome when a parent frame (e.g. ComboShowcaseCard) owns the border. */
  flush?: boolean;
  /** Light matches hero guide kit surfaces; dark for legacy/editor contrast. */
  variant?: ComboChainVariant;
};
