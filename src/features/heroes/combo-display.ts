import type { ComboDifficulty, ComboModifier } from "@/data/schema";

/**
 * Single source of truth for combo difficulty + modifier presentation.
 *
 * Components rendering combos on **dark surfaces** (the `ComboChain` body)
 * use `darkClass`. Components rendering on **light surfaces** (block
 * headers, filter pills, legacy `BlockComboLegacy`) use `lightClass`.
 *
 * This file used to be duplicated three times (combo-chain, hero-guide-body,
 * combo-builder-editor); diverging colors and labels were the result.
 */

export type DifficultyTier = {
  key: ComboDifficulty;
  label: string;
  /** Pill styling against dark navy combo chains. */
  darkClass: string;
  /** Pill / group-header styling against the light spotlight surface. */
  lightClass: string;
};

export const DIFFICULTY_TIERS: readonly DifficultyTier[] = [
  {
    key: "bread-and-butter",
    label: "Bread & Butter",
    darkClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
    lightClass: "border-emerald-500/50 bg-emerald-50/80 text-emerald-800",
  },
  {
    key: "intermediate",
    label: "Intermediate",
    darkClass: "border-amber-500/50 bg-amber-500/15 text-amber-300",
    lightClass: "border-amber-500/50 bg-amber-50/80 text-amber-800",
  },
  {
    key: "advanced",
    label: "Advanced",
    darkClass: "border-rose-500/50 bg-rose-500/15 text-rose-300",
    lightClass: "border-rose-500/50 bg-rose-50/80 text-rose-800",
  },
  {
    key: "team",
    label: "Team Combo",
    darkClass: "border-sky-500/50 bg-sky-500/15 text-sky-300",
    lightClass: "border-sky-500/50 bg-sky-50/80 text-sky-800",
  },
];

const TIER_BY_KEY = new Map<ComboDifficulty, DifficultyTier>(
  DIFFICULTY_TIERS.map((tier) => [tier.key, tier]),
);

export function getDifficultyTier(
  difficulty: ComboDifficulty | string | undefined,
): DifficultyTier | null {
  if (!difficulty) return null;
  return TIER_BY_KEY.get(difficulty as ComboDifficulty) ?? null;
}

/** All difficulty keys for filter pills, dropdowns, etc. */
export const DIFFICULTY_KEYS = DIFFICULTY_TIERS.map((t) => t.key);

// --------------------------------------------------------------------------
// Modifier display
// --------------------------------------------------------------------------

export type ModifierDescriptor = {
  key: ComboModifier;
  /** Short authoring label for the editor dropdown (e.g. `Anim Cancel ⟩⟩`). */
  authorLabel: string;
  /** Glyph used in the rendered combo chain connector. */
  symbol: string;
  /** Tiny micro-label rendered below the connector (`HOLD`, `cancel`, …). */
  microLabel: string;
  /** Tailwind classes for the connector glyph. */
  arrowClass: string;
};

export const MODIFIER_DESCRIPTORS: readonly ModifierDescriptor[] = [
  {
    key: "tap",
    authorLabel: "Tap",
    symbol: "→",
    microLabel: "",
    arrowClass: "text-brand-gold/70",
  },
  {
    key: "hold",
    authorLabel: "Hold",
    symbol: "→",
    microLabel: "HOLD",
    arrowClass: "text-brand-gold gold-pulse",
  },
  {
    key: "buffer",
    authorLabel: "Buffer",
    symbol: "→",
    microLabel: "buffer",
    arrowClass: "text-brand-gold/50",
  },
  {
    key: "animation-cancel",
    authorLabel: "Anim Cancel ⟩⟩",
    symbol: "⟩⟩",
    microLabel: "cancel",
    arrowClass: "text-rose-400/80",
  },
  {
    key: "dash-cancel",
    authorLabel: "Dash Cancel",
    symbol: "⟩⟩",
    microLabel: "dash",
    arrowClass: "text-sky-400/80",
  },
  {
    key: "jump-cancel",
    authorLabel: "Jump Cancel",
    symbol: "↑⟩",
    microLabel: "jump",
    arrowClass: "text-emerald-400/80",
  },
  {
    key: "melee-weave",
    authorLabel: "Melee Weave",
    symbol: "⟩",
    microLabel: "weave",
    arrowClass: "text-brand-gold/60",
  },
  {
    key: "instant",
    authorLabel: "Instant ⚡",
    symbol: "⚡",
    microLabel: "instant",
    arrowClass: "text-amber-400/90",
  },
];

const MOD_BY_KEY = new Map<ComboModifier, ModifierDescriptor>(
  MODIFIER_DESCRIPTORS.map((m) => [m.key, m]),
);

/** Default to `tap` when no modifier specified (renders the plain gold arrow). */
export function getModifierDescriptor(
  modifier: ComboModifier | undefined,
): ModifierDescriptor {
  return MOD_BY_KEY.get(modifier ?? "tap") ?? MOD_BY_KEY.get("tap")!;
}
