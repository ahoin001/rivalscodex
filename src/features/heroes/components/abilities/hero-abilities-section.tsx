"use client";

import { useMemo, useState } from "react";
import { ClippedPanel } from "@/components/ui";
import type { ExternalHero } from "@/lib/api/marvel-rivals";
import { KeybindOverlay } from "@/features/heroes/components/keybind-overlay";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { overlayCatalogTeamUpExternalAbilities } from "@/features/heroes/team-up-loadouts";
import {
  AbilityDetail,
  detailPanelShellImmersiveClass,
  detailPanelShellPanelClass,
  PanelCornerAccent,
} from "./ability-detail-panel";
import { AbilityList } from "./ability-list";
import { buildSections, demoHero } from "./ability-view-model";
import { useAbilitySelectionFrame } from "./use-ability-selection-frame";

type HeroAbilitiesSectionProps = {
  hero: ExternalHero | null;
  stackLogoUrl?: string;
  abilities?: NonNullable<ExternalHero["abilities"]>;
  transformations?: ExternalHero["transformations"];
  variant?: "panel" | "immersive";
};

export function HeroAbilitiesSection({
  hero,
  stackLogoUrl,
  abilities,
  transformations,
  variant = "panel",
}: HeroAbilitiesSectionProps) {
  const baseHero = hero ?? demoHero;
  const sourceHero = useMemo<ExternalHero>(() => {
    const withOverrides =
      !abilities && !transformations
        ? baseHero
        : {
            ...baseHero,
            ...(abilities ? { abilities } : {}),
            ...(transformations ? { transformations } : {}),
          };
    return {
      ...withOverrides,
      abilities:
        overlayCatalogTeamUpExternalAbilities(
          withOverrides.abilities,
          withOverrides.slug,
          withOverrides.role,
        ) ?? withOverrides.abilities,
    };
  }, [baseHero, abilities, transformations]);

  const sections = useMemo(() => buildSections(sourceHero), [sourceHero]);
  const flatAbilityIds = useMemo(
    () => sections.flatMap((section) => section.abilities.map((ability) => ability.id)),
    [sections],
  );
  const [panelMode, setPanelMode] = useState<"base" | "ability">("base");
  const [preferredAbilityId, setPreferredAbilityId] = useState<string | null>(
    sections[0]?.abilities[0]?.id ?? null,
  );
  const selectedAbilityId = useMemo(() => {
    if (preferredAbilityId && flatAbilityIds.includes(preferredAbilityId)) {
      return preferredAbilityId;
    }
    return flatAbilityIds[0] ?? null;
  }, [preferredAbilityId, flatAbilityIds]);
  const selectedAbility = useMemo(
    () =>
      sections
        .flatMap((section) => section.abilities)
        .find((ability) => ability.id === selectedAbilityId) ?? sections[0]?.abilities[0],
    [sections, selectedAbilityId],
  );

  const abilityLookup = useMemo(() => {
    const map = new Map<string, ResolvedAbilityRef>();
    for (const ability of sourceHero.abilities ?? []) {
      map.set(ability.name.toLowerCase(), {
        name: ability.name,
        keybind: ability.keybind ?? "",
        iconUrl: ability.iconUrl,
        keybindIconUrl: ability.keybindIconUrl,
        damage: ability.damage,
        cooldownSeconds: ability.cooldownSeconds,
        description: ability.description ?? "",
        type: ability.type ?? "",
      });
    }
    return map;
  }, [sourceHero.abilities]);

  const { listRef, frameClip, frameActive } = useAbilitySelectionFrame(
    panelMode,
    selectedAbilityId,
    sections,
  );

  const transformation = sourceHero.transformations?.[0];
  const healthValue = transformation?.health ?? "250";
  const movementSpeedValue = transformation?.movementSpeed ?? "6m/s";

  const handleAbilityTap = (abilityId: string) => {
    setPanelMode((previousMode) => {
      const willCollapse = previousMode === "ability" && selectedAbilityId === abilityId;
      if (!willCollapse) setPreferredAbilityId(abilityId);
      return willCollapse ? "base" : "ability";
    });
  };

  const grid = (
    <div
      className={
        variant === "immersive"
          ? "grid items-stretch gap-5 lg:grid-cols-[minmax(0,6.5fr)_minmax(0,11.5fr)] lg:gap-8"
          : "grid gap-4 lg:grid-cols-[6.8fr_10.37fr]"
      }
    >
      <AbilityList
        sections={sections}
        selectedAbility={selectedAbility}
        panelMode={panelMode}
        variant={variant}
        heroName={sourceHero.name}
        stackLogoUrl={stackLogoUrl}
        transformationIconUrl={transformation?.iconUrl}
        healthValue={healthValue}
        movementSpeedValue={movementSpeedValue}
        listRef={listRef}
        frameClip={frameClip}
        frameActive={frameActive}
        onAbilityTap={handleAbilityTap}
        onShowBaseStats={() => setPanelMode("base")}
      />
      <section
        className={`hidden lg:flex ${
          variant === "immersive" ? detailPanelShellImmersiveClass : detailPanelShellPanelClass
        }`}
      >
        <PanelCornerAccent />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <AbilityDetail
            key={`${panelMode}-${selectedAbilityId}`}
            panelMode={panelMode}
            selectedAbility={selectedAbility}
            healthValue={healthValue}
            movementSpeedValue={movementSpeedValue}
          />
        </div>
      </section>
    </div>
  );

  if (variant === "immersive") {
    return (
      <div className="w-full space-y-6 sm:space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-display text-4xl italic uppercase leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-5xl lg:text-[3.75rem]">
            Abilities
          </h3>
          <div className="flex items-center gap-3">
            <KeybindOverlay abilityLookup={abilityLookup} heroName={sourceHero.name} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/55 sm:text-xs">
              Rivals
            </p>
          </div>
        </header>
        <div className="flex flex-col lg:min-h-0">{grid}</div>
      </div>
    );
  }

  return (
    <ClippedPanel tone="gold" className="border border-brand-gold/35 p-4 md:p-5">
      <div className="space-y-4">
        <h3 className="font-display text-3xl italic uppercase leading-none text-white md:text-4xl">
          Abilities
        </h3>
        <div>{grid}</div>
      </div>
    </ClippedPanel>
  );
}
