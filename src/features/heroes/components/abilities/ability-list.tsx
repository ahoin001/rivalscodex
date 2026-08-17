"use client";

import { type RefObject, useEffect, useRef } from "react";
import Image from "next/image";
import { AbilityRow } from "./ability-row";
import {
  AbilityDetail,
  detailPanelShellInlineClass,
  PanelCornerAccent,
} from "./ability-detail-panel";
import { abilitySurfaceStyles } from "./ability-surface-styles";
import { toTitleCase, type AbilitySection, type AbilityViewModel } from "./ability-view-model";

type AbilityListProps = {
  sections: AbilitySection[];
  selectedAbility: AbilityViewModel | undefined;
  panelMode: "base" | "ability";
  variant: "panel" | "immersive";
  heroName: string;
  stackLogoUrl?: string;
  transformationIconUrl?: string;
  healthValue: string;
  movementSpeedValue: string;
  listRef: RefObject<HTMLDivElement | null>;
  frameClip: string;
  frameActive: boolean;
  onAbilityTap: (abilityId: string) => void;
  onShowBaseStats: () => void;
};

export function AbilityList({
  sections,
  selectedAbility,
  panelMode,
  variant,
  heroName,
  stackLogoUrl,
  transformationIconUrl,
  healthValue,
  movementSpeedValue,
  listRef,
  frameClip,
  frameActive,
  onAbilityTap,
  onShowBaseStats,
}: AbilityListProps) {
  const inlineDetailRefs = useRef(new Map<string, HTMLDivElement | null>());
  const selectedAbilityId = selectedAbility?.id ?? null;

  useEffect(() => {
    if (panelMode !== "ability" || !selectedAbilityId) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const node = inlineDetailRefs.current.get(selectedAbilityId);
    if (!node) return;
    const handle = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(handle);
  }, [panelMode, selectedAbilityId]);

  return (
    <div
      className={
        variant === "immersive"
          ? "flex min-h-0 flex-col gap-2 lg:h-full lg:min-h-0"
          : "space-y-2"
      }
    >
      <AbilityListHeader
        heroName={heroName}
        stackLogoUrl={stackLogoUrl}
        transformationIconUrl={transformationIconUrl}
        isBase={panelMode === "base"}
        onShowBaseStats={onShowBaseStats}
      />
      <div
        className={
          variant === "immersive"
            ? "relative flex min-h-0 flex-1 flex-col pb-2 lg:min-h-[24rem]"
            : "relative h-[24.6rem] w-full pb-2"
        }
        style={{
          backgroundImage: abilitySurfaceStyles.skillScrollBorder,
          backgroundSize: "94% 0.5rem",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0.6rem bottom",
        }}
      >
        <div
          className={`relative pr-2 ${
            variant === "immersive"
              ? "max-h-none md:min-h-0 md:flex-1 md:max-h-none lg:max-h-full"
              : "h-full"
          }`}
        >
          <span
            className="hud-ability-frame"
            data-active={frameActive ? "true" : "false"}
            style={{ clipPath: frameClip }}
            aria-hidden
          />
          <div
            ref={listRef}
            className={`h-full [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-brand-gold [&::-webkit-scrollbar-track]:bg-muted-foreground [&::-webkit-scrollbar-track]:bg-no-repeat [&::-webkit-scrollbar-track]:bg-center [&::-webkit-scrollbar-track]:bg-cover ${
              variant === "immersive" ? "overflow-visible md:overflow-y-auto" : "overflow-y-auto"
            }`}
          >
            {sections.map((section) => (
              <section key={section.id} className="mb-2">
                <p
                  className="h-8 w-full pl-3 text-xs font-semibold uppercase leading-8 tracking-wide text-rivals-ink-soft"
                  style={{
                    backgroundImage: abilitySurfaceStyles.sectionHeaderBg,
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                  }}
                >
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.abilities.map((ability) => {
                    const isActive =
                      selectedAbility?.id === ability.id && panelMode === "ability";
                    return (
                      <li key={ability.id}>
                        <AbilityRow
                          ability={ability}
                          isActive={isActive}
                          onTap={onAbilityTap}
                        />
                        <div
                          ref={(node) => {
                            if (node) inlineDetailRefs.current.set(ability.id, node);
                            else inlineDetailRefs.current.delete(ability.id);
                          }}
                          aria-hidden={!isActive}
                          className={`grid overflow-hidden transition-[grid-template-rows] duration-[var(--motion-medium)] ease-[var(--ease-out)] lg:hidden ${
                            isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            {isActive ? (
                              <section
                                className={detailPanelShellInlineClass}
                                aria-label={`${ability.name} details`}
                              >
                                <PanelCornerAccent />
                                <div className="relative flex flex-col">
                                  <AbilityDetail
                                    panelMode="ability"
                                    selectedAbility={ability}
                                    healthValue={healthValue}
                                    movementSpeedValue={movementSpeedValue}
                                  />
                                </div>
                              </section>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AbilityListHeader({
  heroName,
  stackLogoUrl,
  transformationIconUrl,
  isBase,
  onShowBaseStats,
}: {
  heroName: string;
  stackLogoUrl?: string;
  transformationIconUrl?: string;
  isBase: boolean;
  onShowBaseStats: () => void;
}) {
  return (
    <div
      className="relative ml-2 flex h-[4.8rem] items-end overflow-hidden"
      style={{
        backgroundImage: abilitySurfaceStyles.rolePictureBg,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
      }}
    >
      <div className="z-[1] flex min-w-0 items-center gap-3 pb-2 pl-3">
        {stackLogoUrl ? (
          <div className="hidden h-[3.2rem] w-[10.5rem] shrink-0 sm:block sm:w-[12.5rem]">
            <Image
              src={stackLogoUrl}
              alt={`${heroName} logo`}
              width={200}
              height={51}
              className="h-full w-auto object-contain object-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
            />
          </div>
        ) : transformationIconUrl ? (
          <Image
            src={transformationIconUrl}
            alt={`${heroName} portrait`}
            width={68}
            height={68}
            className="h-[4.2rem] w-[4.2rem] shrink-0 object-contain"
          />
        ) : (
          <div className="h-[4.2rem] w-[4.2rem] shrink-0 bg-surface-hud" />
        )}
        <p className="truncate font-display text-3xl italic leading-none text-white sm:text-4xl">
          {toTitleCase(heroName)}
        </p>
      </div>
      <button
        type="button"
        onClick={onShowBaseStats}
        className={`absolute right-3 top-1/2 h-[2.1rem] w-[8rem] -translate-y-1/2 text-left text-[11px] font-semibold uppercase tracking-wide ${
          isBase ? "text-ink-on-gold" : "text-white/85"
        }`}
        style={{
          backgroundImage: abilitySurfaceStyles.baseStatsBtn,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
        }}
      >
        <span className="pl-5">Base Stats</span>
      </button>
    </div>
  );
}
