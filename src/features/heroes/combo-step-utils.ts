import type { ComboStep } from "@/data/schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { resolveAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";

export const COMBO_STEP_REPEAT_MIN = 1;
export const COMBO_STEP_REPEAT_MAX = 9;

export function normalizeComboRepeat(
  repeat: number | undefined,
): number | undefined {
  if (repeat === undefined || repeat <= 1) return undefined;
  return Math.min(COMBO_STEP_REPEAT_MAX, Math.max(2, repeat));
}

export function formatComboRepeatSuffix(repeat: number | undefined): string {
  const normalized = normalizeComboRepeat(repeat);
  return normalized ? ` ×${normalized}` : "";
}

export function comboStepsMatchForRepeat(a: ComboStep, b: ComboStep): boolean {
  if (a.kind !== b.kind) return false;
  if (a.modifier !== b.modifier) return false;
  if (a.kind === "ability" && b.kind === "ability") {
    return a.abilityRef === b.abilityRef;
  }
  if (a.kind === "action" && b.kind === "action") {
    return a.label.trim().toLowerCase() === b.label.trim().toLowerCase();
  }
  return false;
}

export function formatComboStepText(
  step: ComboStep,
  lookup: Map<string, ResolvedAbilityRef>,
): string {
  const suffix = formatComboRepeatSuffix(step.repeat);

  if (step.kind === "action") {
    const prefix = step.modifier === "or" ? "or " : "";
    return `${prefix}${step.label}${suffix}`;
  }

  const resolved = resolveAbilityRef(step.abilityRef, lookup);
  const base = resolved
    ? formatKeybindLabel(resolved.keybind)
    : step.abilityRef;
  const prefix = step.modifier === "or" ? "or " : "";
  return `${prefix}${base}${suffix}`;
}
