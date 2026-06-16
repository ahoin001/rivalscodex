"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { RivalsBrandButton, RivalsKeyChip, RivalsStatLine } from "@/components/ui";
import { RIVALS_FRAMES } from "@/lib/rivals-assets-paths";

export type LunaAbilityCategory = "Normal Attack" | "Abilities" | "Passive";

export type LunaAbility = {
  id: string;
  name: string;
  keyLabel: string;
  category: LunaAbilityCategory;
  description: string;
  stats: Array<{ label: string; value: string }>;
};

type LunaAbilitiesSectionProps = {
  heroName: string;
  heroSubtitle?: string;
  portraitImageUrl?: string;
  abilities: LunaAbility[];
  baseStats?: Array<{ label: string; value: string }>;
  className?: string;
};

const CATEGORY_ORDER: LunaAbilityCategory[] = ["Normal Attack", "Abilities", "Passive"];

function groupAbilities(abilities: LunaAbility[]) {
  return CATEGORY_ORDER.map((category) => ({
    category,
    abilities: abilities.filter((ability) => ability.category === category),
  })).filter((group) => group.abilities.length > 0);
}

export function LunaAbilitiesSection({
  heroName,
  heroSubtitle,
  portraitImageUrl,
  abilities,
  baseStats,
  className = "",
}: LunaAbilitiesSectionProps) {
  const [panelMode, setPanelMode] = useState<"base" | "ability">(
    abilities.length > 0 ? "ability" : "base",
  );
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(
    abilities[0]?.id ?? null,
  );

  const groupedAbilities = useMemo(() => groupAbilities(abilities), [abilities]);
  const selectedAbility = useMemo(
    () => abilities.find((ability) => ability.id === selectedAbilityId) ?? abilities[0],
    [abilities, selectedAbilityId],
  );

  const showBasePanel = panelMode === "base" || !selectedAbility;

  return (
    <section
      className={`relative w-full overflow-hidden text-rivals-light-100 ${className}`.trim()}
      aria-label="Luna Snow abilities"
    >
      <Image
        src={RIVALS_FRAMES.abilitiesSection}
        alt=""
        fill
        sizes="100vw"
        aria-hidden
        className="-z-10 object-cover object-center"
      />

      <div className="relative px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <h2 className="slanted-title font-display text-[3rem] font-extrabold uppercase italic leading-none text-white sm:text-[4rem] lg:text-[5.5rem]">
          <span>Abilities</span>
        </h2>
        <p className="mt-2 text-xs uppercase tracking-[0.32em] text-white/55 sm:text-sm">
          Rivals
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[6.4fr_9.6fr]">
          <div className="flex h-full flex-col gap-3">
            <div className="rivals-clip-row relative flex items-center gap-3 bg-rivals-yellow-500 px-4 py-3 sm:px-5 sm:py-4">
              {portraitImageUrl ? (
                <span className="relative inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-rivals-ink/30 bg-rivals-ink/10">
                  <Image
                    src={portraitImageUrl}
                    alt={`${heroName} portrait`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-rivals-ink/10 font-display text-base font-bold uppercase italic text-rivals-ink">
                  {heroName.slice(0, 2)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-2xl font-extrabold uppercase italic text-rivals-ink sm:text-3xl">
                  {heroName}
                </p>
                {heroSubtitle ? (
                  <p className="truncate text-[11px] uppercase tracking-[0.18em] text-rivals-ink/70">
                    {heroSubtitle}
                  </p>
                ) : null}
              </div>
              <RivalsBrandButton
                variant="ink"
                size="sm"
                className="ml-auto shrink-0"
                onClick={() => setPanelMode("base")}
              >
                Base Stats
                <span aria-hidden>&rsaquo;</span>
              </RivalsBrandButton>
            </div>

            <div className="rivals-clip-row flex-1 bg-rivals-light-100 p-3 sm:p-4">
              <div className="flex h-full flex-col gap-3">
                {groupedAbilities.map((group) => (
                  <div key={group.category}>
                    <div className="bg-rivals-ink px-3 py-1.5 font-display text-[11px] font-bold uppercase italic tracking-[0.22em] text-white sm:text-xs">
                      {group.category}
                    </div>
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {group.abilities.map((ability) => {
                        const isActive =
                          panelMode === "ability" && selectedAbility?.id === ability.id;
                        return (
                          <li key={ability.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setPanelMode("ability");
                                setSelectedAbilityId(ability.id);
                              }}
                              className={`group flex w-full items-center gap-3 px-2 py-2 text-left transition-colors duration-150 sm:gap-4 sm:px-3 ${
                                isActive
                                  ? "bg-rivals-yellow-500/35 text-rivals-ink ring-1 ring-rivals-yellow-500"
                                  : "bg-rivals-light-200/80 text-rivals-ink hover:bg-rivals-light-300"
                              }`}
                            >
                              <RivalsKeyChip
                                keyLabel={ability.keyLabel}
                                tone={isActive ? "yellow" : "ink"}
                                size="sm"
                              />
                              <span className="font-display text-sm font-bold uppercase italic tracking-[0.06em] sm:text-base">
                                {ability.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rivals-clip-row relative bg-rivals-light-100 text-rivals-ink shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            {showBasePanel ? (
              <div>
                <div className="border-b border-rivals-light-300 bg-gradient-to-br from-rivals-light-50 to-rivals-light-200 px-5 py-4 sm:px-6 sm:py-6">
                  <h3 className="font-display text-3xl font-extrabold uppercase italic text-rivals-ink sm:text-4xl">
                    Base Stats
                  </h3>
                </div>
                <div className="px-5 py-4 sm:px-6 sm:py-6">
                  {(baseStats ?? []).map((stat, index, arr) => (
                    <RivalsStatLine
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      showDivider={index !== arr.length - 1}
                    />
                  ))}
                  {(!baseStats || baseStats.length === 0) && (
                    <p className="text-sm text-rivals-ink-soft">No base stats configured.</p>
                  )}
                </div>
              </div>
            ) : selectedAbility ? (
              <div>
                <div className="border-b border-rivals-light-300 bg-gradient-to-br from-rivals-light-50 to-rivals-light-200 px-5 py-4 sm:px-6 sm:py-6">
                  <div className="flex flex-wrap items-start gap-3">
                    <h3 className="font-display text-3xl font-extrabold uppercase italic text-rivals-ink sm:text-4xl">
                      {selectedAbility.name}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <RivalsKeyChip keyLabel={selectedAbility.keyLabel} size="md" tone="ink" />
                    <p className="max-w-prose text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7">
                      {selectedAbility.description}
                    </p>
                  </div>
                </div>
                <div className="px-5 py-4 sm:px-6 sm:py-6">
                  {selectedAbility.stats.map((stat, index, arr) => (
                    <RivalsStatLine
                      key={`${selectedAbility.id}-${stat.label}`}
                      label={stat.label}
                      value={stat.value}
                      showDivider={index !== arr.length - 1}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
