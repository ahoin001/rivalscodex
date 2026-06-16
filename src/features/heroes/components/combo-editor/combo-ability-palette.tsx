"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";
import { MELEE_ABILITY_REF } from "@/features/heroes/combo-kit-abilities";
import { AbilityTooltip } from "@/features/heroes/components/ability-tooltip";
import { editorInputClass } from "@/components/ui/rivals-editor-field";

type ComboAbilityPaletteProps = {
  abilityLookup: Map<string, ResolvedAbilityRef>;
  onAddAbility: (slug: string) => void;
  onAddAction: () => void;
  /** Nested inside a disclosure — skip outer chrome. */
  compact?: boolean;
};

export function ComboAbilityPalette({
  abilityLookup,
  onAddAbility,
  onAddAction,
  compact = false,
}: ComboAbilityPaletteProps) {
  const [searchFilter, setSearchFilter] = useState("");

  const abilities = useMemo(
    () => Array.from(abilityLookup.entries()),
    [abilityLookup],
  );

  const filteredAbilities = useMemo(() => {
    if (!searchFilter.trim()) return abilities;
    const lower = searchFilter.toLowerCase();
    return abilities.filter(
      ([, ref]) =>
        ref.name.toLowerCase().includes(lower) ||
        ref.keybind.toLowerCase().includes(lower),
    );
  }, [abilities, searchFilter]);

  const kitAbilities = useMemo(
    () => filteredAbilities.filter(([slug]) => slug === MELEE_ABILITY_REF),
    [filteredAbilities],
  );

  const heroAbilities = useMemo(
    () => filteredAbilities.filter(([slug]) => slug !== MELEE_ABILITY_REF),
    [filteredAbilities],
  );

  return (
    <div className={compact ? "min-w-0" : "panel-enter rounded border border-rivals-light-300 bg-white p-3"}>
      {!compact ? (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
            Ability palette
          </span>
          <input
            type="search"
            className={`${editorInputClass()} sm:w-40`}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.currentTarget.value)}
            placeholder="Search abilities..."
          />
        </div>
      ) : (
        <div className="mb-3">
          <input
            type="search"
            className={`${editorInputClass()} w-full sm:max-w-xs`}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.currentTarget.value)}
            placeholder="Search abilities..."
          />
        </div>
      )}
      <p className="mb-3 text-[10px] leading-relaxed text-rivals-ink-muted">
        {compact
          ? "Same ability twice stacks repeats. Use Or (branch) on alternate steps for forks."
          : "Click the same ability again to stack repeats. For branches, add both options then set Or (branch) on alternate steps."}
      </p>

      {kitAbilities.length > 0 ? (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-gold">
            Universal kit
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
            {kitAbilities.map(([slug, ref]) => (
              <AbilityPaletteButton key={slug} ref_={ref} slug={slug} onAdd={onAddAbility} kit />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
        {heroAbilities.map(([slug, ref]) => (
          <AbilityPaletteButton key={slug} ref_={ref} slug={slug} onAdd={onAddAbility} />
        ))}
      </div>
      <button
        type="button"
        onClick={onAddAction}
        className="mt-2 rounded border border-dashed border-rivals-light-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-rivals-ink-muted hover:bg-rivals-light-100"
      >
        + Add freeform action
      </button>
    </div>
  );
}

function AbilityPaletteButton({
  slug,
  ref_,
  onAdd,
  kit = false,
}: {
  slug: string;
  ref_: ResolvedAbilityRef;
  onAdd: (slug: string) => void;
  kit?: boolean;
}) {
  return (
    <AbilityTooltip ability={ref_}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAdd(slug);
        }}
        className={`flex w-full flex-col items-center gap-1 rounded border p-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm ${
          kit
            ? "border-brand-gold/45 bg-brand-gold-muted/30 hover:border-brand-gold"
            : "border-rivals-light-300 bg-rivals-light-50 hover:border-brand-gold/40"
        }`}
      >
        {kit ? (
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1a1f2e] font-display text-[10px] font-bold uppercase text-brand-gold">
            V
          </div>
        ) : ref_.iconUrl ? (
          <Image
            src={ref_.iconUrl}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded bg-rivals-light-200 text-[8px] font-bold uppercase text-rivals-ink-muted">
            {ref_.name.slice(0, 3)}
          </div>
        )}
        <span className="text-[9px] font-semibold uppercase leading-tight text-rivals-ink-soft">
          {formatKeybindLabel(ref_.keybind)}
        </span>
        <span className="max-w-full truncate text-[9px] leading-tight text-rivals-ink-muted">
          {ref_.name}
        </span>
      </button>
    </AbilityTooltip>
  );
}
