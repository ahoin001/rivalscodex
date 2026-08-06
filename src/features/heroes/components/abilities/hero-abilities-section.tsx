"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
// useEffect retained for the mobile auto-scroll behavior below; the
// previous "reset selected ability after a form switch" effect was replaced
// with a fully derived `selectedAbilityId` so React 19 no longer warns about
// cascading renders from setState-in-effect.
import Image from "next/image";
import { ClippedPanel } from "@/components/ui";
import { ExternalHero } from "@/lib/api/marvel-rivals";
import { RIVALS_ICONS } from "@/lib/rivals-assets-paths";

type HeroAbilitiesSectionProps = {
  hero: ExternalHero | null;
  /** Optional stack-logo wordmark URL for the section header (per-hero). */
  stackLogoUrl?: string;
  /**
   * Optional override for the hero's abilities. When provided, the section
   * renders this list instead of `hero.abilities`. Used by the multi-form
   * wrapper to swap in the active form's ability set without re-fetching the
   * hero or re-mounting the section.
   */
  abilities?: NonNullable<ExternalHero["abilities"]>;
  /**
   * Optional override for the section's transformations. Lets the wrapper
   * surface the active form's health / movement speed alongside its
   * abilities.
   */
  transformations?: ExternalHero["transformations"];
  /**
   * panel: gold ClippedPanel shell (hero detail tabs).
   * immersive: no outer panel; full-bleed-friendly layout for lab / wide pages.
   */
  variant?: "panel" | "immersive";
};

type AbilitySectionId = "normal-attack" | "abilities" | "team-ups" | "passives";

type AbilitySection = {
  id: AbilitySectionId;
  title: string;
  abilities: AbilityViewModel[];
};

type AbilityViewModel = {
  id: string;
  name: string;
  key: string;
  keyDisplay: string;
  description: string;
  iconUrl?: string;
  category?: string;
  fields: Array<{
    label: string;
    value: string;
  }>;
};

const abilitySurfaceStyles = {
  rolePictureBg:
    "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/role_bg_3f8f90f8.png)",
  skillScrollBorder:
    "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/border_6ebea6be.png)",
  sectionHeaderBg:
    "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/list_bg1_6ebea6be.png)",
  rowBg: "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/list_bg2_d1117604.png)",
  rowSelected:
    "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/list_select_2ba9d2cf.png)",
  baseStatsBtn:
    "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/jcsx_btn_d468190a.png)",
  keyPnl: "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/pnl_48315471.png)",
  statLabelBg:
    "url(https://www.marvelrivals.com/pc/gw/20241128194803/img/sxz_bg_60be7c9d.png)",
};
const abilityIconTintFilter =
  "brightness(0) saturate(100%) invert(20%) sepia(9%) saturate(395%) hue-rotate(174deg) brightness(92%) contrast(90%)";

const keyPriority = [
  "left click",
  "right click",
  "q",
  "shift",
  "e",
  "f",
  "c",
  "passive",
];

/**
 * Demo placeholder used only when the section renders without a real hero
 * (e.g. the lab sandbox before live data arrives). Not a runtime fallback
 * for codex-backed pages.
 */
const demoHero: ExternalHero = {
  name: "Black Widow",
  summary:
    "Natasha Romanova is the world's most elite spy in any era. Her mastery of the sniper rifle eliminates targets from afar, while her shock batons neutralize close-range threats.",
  transformations: [
    {
      id: "0",
      name: "Black Widow",
      health: "250",
      movementSpeed: "6m/s",
    },
  ],
  abilities: [
    {
      name: "Widow's Bite Baton",
      type: "Weapon",
      keybind: "Left Click",
      description: "Strike with the enhanced electric batons.",
    },
    {
      name: "Red Room Rifle",
      type: "Weapon",
      keybind: "Left Click",
      description: "Unleash a barrage of bullets with the Red Room Rifle.",
    },
    {
      name: "Electro-plasma Explosion",
      type: "Ultimate",
      keybind: "Q",
      description: "Unleash an electro-plasma blast that applies vulnerability and slow.",
    },
    {
      name: "Fleet Foot",
      type: "Normal",
      keybind: "SHIFT",
      description: "Dash forward and enable a powerful jump.",
    },
    {
      name: "Edge Dancer",
      type: "Normal",
      keybind: "E",
      description: "Unleash a spinning kick and follow-up grapple kick.",
    },
    {
      name: "Pulse Rifle",
      type: "Normal",
      keybind: "C",
      isCollab: true,
      description: "Team-up pulse mode upgrade for the Red Room Rifle.",
    },
  ],
};

function normalizeKey(rawKey: string | undefined): string {
  if (!rawKey) {
    return "Passive";
  }

  return rawKey.trim().toLowerCase();
}

function getKeyDisplay(rawKey: string | undefined): string {
  const normalized = normalizeKey(rawKey);
  if (normalized.includes("left click")) {
    return "LMB";
  }
  if (normalized.includes("right click")) {
    return "RMB";
  }
  if (normalized === "shift") {
    return "SHIFT";
  }
  if (normalized === "q" || normalized === "e" || normalized === "f" || normalized === "c") {
    return normalized.toUpperCase();
  }
  if (normalized === "passive") {
    return "Passive";
  }

  return rawKey ?? "Passive";
}

function getKeyIconSource(keyDisplay: string) {
  if (keyDisplay === "LMB") {
    return RIVALS_ICONS.lmb;
  }

  if (keyDisplay === "RMB") {
    return RIVALS_ICONS.rmb;
  }

  return null;
}

function toAbilityViewModel(
  hero: ExternalHero,
  ability: NonNullable<ExternalHero["abilities"]>[number],
): AbilityViewModel {
  const orderedStatFields =
    ability.stats
      ?.filter((stat) => {
        const label = stat.label.trim().toLowerCase();
        return label !== "key" && label !== "hotkey" && stat.value.trim().length > 0;
      })
      .map((stat) => ({ label: stat.label, value: stat.value })) ?? [];

  const additionalEntries = Object.entries(ability.additionalFields ?? {})
    .filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return normalizedKey !== "key" && normalizedKey !== "hotkey" && value.trim().length > 0;
    })
    .map(([key, value]) => ({
      label: key,
      value,
    }));

  const resolvedFields =
    orderedStatFields.length > 0
      ? orderedStatFields
      : additionalEntries.length > 0
      ? additionalEntries
      : [
          {
            label: "Type",
            value: ability.type ?? "Ability",
          },
          {
            label: "Hero",
            value: hero.name,
          },
        ];

  const keyRaw = ability.additionalFields?.Key ?? ability.keybind;
  const stableId = `${hero.name}-${ability.name}-${ability.transformationId ?? "base"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return {
    id: stableId,
    name: ability.name,
    key: normalizeKey(keyRaw),
    keyDisplay: getKeyDisplay(keyRaw),
    description: ability.description ?? "Ability details coming soon.",
    iconUrl: ability.iconUrl,
    category: ability.category,
    fields: resolvedFields,
  };
}

function normalizedCategory(category: string | undefined): AbilitySectionId | null {
  if (!category) return null;
  const c = category.trim().toLowerCase();
  if (c.includes("normal attack")) return "normal-attack";
  if (c.includes("team-up") || c.includes("team up")) return "team-ups";
  if (c === "passive" || c.includes("passive abilities")) return "passives";
  if (c === "abilities") return "abilities";
  return null;
}

function heuristicCategory(ability: AbilityViewModel, rawType?: string): AbilitySectionId {
  if (ability.key.includes("left click") || ability.key.includes("right click")) {
    return "normal-attack";
  }
  const typeIsPassive = (rawType ?? "").toLowerCase().includes("passive");
  if (ability.key === "passive" || typeIsPassive) return "passives";
  if (ability.key === "c") return "team-ups";
  return "abilities";
}

function buildSections(hero: ExternalHero): AbilitySection[] {
  const sourceAbilities = hero.abilities ?? [];

  const deduped = Array.from(
    new Map(
      sourceAbilities.map((ability) => {
        const normalizedName = ability.name.trim().toLowerCase();
        return [normalizedName, ability];
      }),
    ).values(),
  );

  const mapped = deduped.map((ability) => ({
    ability,
    view: toAbilityViewModel(hero, ability),
  }));

  const buckets: Record<AbilitySectionId, AbilityViewModel[]> = {
    "normal-attack": [],
    abilities: [],
    "team-ups": [],
    passives: [],
  };

  for (const { ability, view } of mapped) {
    const fromCategory = normalizedCategory(view.category);
    const bucket = fromCategory ?? heuristicCategory(view, ability.type);
    buckets[bucket].push(view);
  }

  const sortByKeyPriority = (left: AbilityViewModel, right: AbilityViewModel) => {
    const leftRank = keyPriority.indexOf(left.key);
    const rightRank = keyPriority.indexOf(right.key);
    const normalizedLeftRank = leftRank === -1 ? 99 : leftRank;
    const normalizedRightRank = rightRank === -1 ? 99 : rightRank;
    return normalizedLeftRank - normalizedRightRank || left.name.localeCompare(right.name);
  };

  const sections: AbilitySection[] = [
    {
      id: "normal-attack",
      title: "Normal Attack",
      abilities: buckets["normal-attack"].sort((l, r) => l.key.localeCompare(r.key)),
    },
    { id: "abilities", title: "Abilities", abilities: buckets.abilities.sort(sortByKeyPriority) },
    {
      id: "team-ups",
      title: "Team-Up Abilities",
      abilities: buckets["team-ups"].sort(sortByKeyPriority),
    },
    {
      id: "passives",
      title: "Passives",
      abilities: buckets.passives.sort((l, r) => l.name.localeCompare(r.name)),
    },
  ];

  return sections.filter((section) => section.abilities.length > 0);
}

function formatStatLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

const detailPanelShellPanelClass =
  "relative flex h-[31.2rem] flex-col overflow-hidden border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

const detailPanelShellImmersiveClass =
  "relative flex flex-col overflow-hidden border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] md:min-h-[28rem] lg:min-h-0 lg:h-full";

const detailPanelShellInlineClass =
  "relative flex flex-col overflow-hidden border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

/**
 * Light header slab. Sized to content (no stretched PNG) so the boundary
 * with the dark body always matches the actual title + description height.
 */
const detailHeaderBandClass =
  "shrink-0 border-b-2 border-[#1f2533]/20 bg-[#e8ebef] px-5 pb-4 pt-[1.125rem] sm:px-7 sm:pb-5 sm:pt-6";

/** Dark body band: stats only. Carries the navy fill that the PNG previously provided. */
const detailBodyBandClass =
  "min-h-0 flex-1 overflow-visible bg-surface-hud px-4 pb-5 pt-3 sm:px-6 sm:pb-7 sm:pt-4 md:overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#fc3] [&::-webkit-scrollbar-track]:bg-[#8893a8]/35 [&::-webkit-scrollbar-track]:bg-no-repeat [&::-webkit-scrollbar-track]:bg-center [&::-webkit-scrollbar-track]:bg-cover";

/**
 * Small gold parallelogram in the top-right corner of the detail panel —
 * recreates the bolt accent the previous PNG carried, without coupling
 * the band layout to image proportions.
 */
function PanelCornerAccent() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 z-[2] h-3 w-12 bg-[#f0c244]"
      style={{
        clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)",
      }}
    />
  );
}

function DetailKeyChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-6 shrink-0 min-w-[3.4rem] items-center justify-center bg-center bg-cover px-2 text-[11px] font-bold uppercase tracking-wide text-white"
      style={{
        backgroundImage: abilitySurfaceStyles.keyPnl,
      }}
    >
      {children}
    </span>
  );
}

type AbilityDetailProps = {
  panelMode: "base" | "ability";
  selectedAbility: AbilityViewModel | undefined;
  healthValue: string;
  movementSpeedValue: string;
};

/**
 * The two-band detail card body. Renders Base Stats or a selected ability,
 * with the CSS-driven light header / dark body so the boundary tracks the
 * actual title+description height (not a stretched PNG).
 */
function AbilityDetail({
  panelMode,
  selectedAbility,
  healthValue,
  movementSpeedValue,
}: AbilityDetailProps) {
  if (panelMode === "base" || !selectedAbility) {
    return (
      <>
        <header className={detailHeaderBandClass}>
          <h4 className="font-display text-2xl italic uppercase leading-none text-[#0c111c] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-3xl md:text-[2.15rem]">
            Base Stats
          </h4>
          <div className="mt-3 flex items-start gap-4 sm:mt-4 sm:gap-5">
            <DetailKeyChip>—</DetailKeyChip>
            <p className="min-h-0 flex-1 text-sm leading-snug text-[#2a3444]">
              Core survivability and mobility for this hero form. Values track the live
              data feed when available.
            </p>
          </div>
        </header>
        <div className={detailBodyBandClass}>
          <StatLine label="Health" value={healthValue} />
          <StatLine label="Movement Speed" value={movementSpeedValue} />
        </div>
      </>
    );
  }

  return (
    <>
      <header className={detailHeaderBandClass}>
        <h4 className="font-display text-2xl italic uppercase leading-[1.05] text-[#0c111c] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-3xl md:text-[2.15rem]">
          {selectedAbility.name}
        </h4>
        <div className="mt-3 flex items-start gap-4 sm:mt-4 sm:gap-5">
          <DetailKeyChip>
            <AbilityKeyDisplay keyDisplay={selectedAbility.keyDisplay} />
          </DetailKeyChip>
          <p className="min-h-0 flex-1 text-sm leading-snug text-[#2a3444] sm:leading-relaxed">
            {selectedAbility.description}
          </p>
        </div>
      </header>
      <div className={detailBodyBandClass}>
        {selectedAbility.fields.map((field) => (
          <StatLine
            key={`${selectedAbility.id}-${field.label}`}
            label={formatStatLabel(field.label)}
            value={field.value}
          />
        ))}
      </div>
    </>
  );
}

export function HeroAbilitiesSection({
  hero,
  stackLogoUrl,
  abilities,
  transformations,
  variant = "panel",
}: HeroAbilitiesSectionProps) {
  const baseHero = hero ?? demoHero;
  // Build a view-only hero with the optional ability / transformation overrides
  // applied so the rest of the component can keep reading off a single object.
  const sourceHero = useMemo<ExternalHero>(() => {
    if (!abilities && !transformations) return baseHero;
    return {
      ...baseHero,
      ...(abilities ? { abilities } : {}),
      ...(transformations ? { transformations } : {}),
    };
  }, [baseHero, abilities, transformations]);
  const heroStackLogo = stackLogoUrl;
  const sections = useMemo(() => buildSections(sourceHero), [sourceHero]);
  const flatAbilityIds = useMemo(
    () => sections.flatMap((section) => section.abilities.map((a) => a.id)),
    [sections],
  );
  const [panelMode, setPanelMode] = useState<"base" | "ability">("base");
  // The user's last-tapped ability id. The effective `selectedAbilityId` falls
  // back to the first ability when this id is stale (e.g. the parent swapped
  // the abilities prop, replacing the previously-selected ability).
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

  const transformation = sourceHero.transformations?.[0];
  const healthValue = transformation?.health ?? "250";
  const movementSpeedValue = transformation?.movementSpeed ?? "6m/s";

  // Mobile accordion: when an inline detail opens, gently bring it into view.
  // Refs keyed by ability id so we can target the just-opened panel directly.
  const inlineDetailRefs = useRef(new Map<string, HTMLDivElement | null>());

  useEffect(() => {
    if (panelMode !== "ability" || !selectedAbilityId) return;
    if (typeof window === "undefined") return;
    // Side panel handles >= lg; only auto-scroll the inline accordion.
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const node = inlineDetailRefs.current.get(selectedAbilityId);
    if (!node) return;

    // Defer to let the grid-template-rows transition begin before measuring.
    const handle = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(handle);
  }, [panelMode, selectedAbilityId]);

  const handleAbilityTap = (abilityId: string) => {
    // Tapping the currently-open ability collapses it (mobile) or swaps to
    // Base Stats (desktop). Tapping any other ability opens it and closes
    // the previous one - enforced by the single selectedAbilityId state.
    setPanelMode((previousMode) => {
      const willCollapse =
        previousMode === "ability" && selectedAbilityId === abilityId;
      if (!willCollapse) {
        setPreferredAbilityId(abilityId);
      }
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
          <div
            className={
              variant === "immersive"
                ? "flex min-h-0 flex-col gap-2 lg:h-full lg:min-h-0"
                : "space-y-2"
            }
          >
            <div
              className="relative ml-2 flex h-[4.8rem] items-end overflow-hidden"
              style={{
                backgroundImage: abilitySurfaceStyles.rolePictureBg,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
              }}
            >
              <div className="z-[1] flex min-w-0 items-center gap-3 pl-3 pb-2">
                {heroStackLogo ? (
                  <div className="hidden h-[3.2rem] w-[10.5rem] shrink-0 sm:block sm:w-[12.5rem]">
                    <Image
                      src={heroStackLogo}
                      alt={`${sourceHero.name} logo`}
                      width={200}
                      height={51}
                      className="h-full w-auto object-contain object-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                    />
                  </div>
                ) : transformation?.iconUrl ? (
                  <Image
                    src={transformation.iconUrl}
                    alt={`${sourceHero.name} portrait`}
                    width={68}
                    height={68}
                    className="h-[4.2rem] w-[4.2rem] shrink-0 object-contain"
                  />
                ) : (
                  <div className="h-[4.2rem] w-[4.2rem] shrink-0 bg-[#20263a]" />
                )}
                <p className="truncate font-display text-3xl italic leading-none text-white sm:text-4xl">
                  {toTitleCase(sourceHero.name)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPanelMode("base")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 h-[2.1rem] w-[8rem] text-left text-[11px] font-semibold uppercase tracking-wide ${
                  panelMode === "base"
                    ? "text-[#111623]"
                    : "text-white/85"
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
                className={`pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#fc3] [&::-webkit-scrollbar-track]:bg-[#999] [&::-webkit-scrollbar-track]:bg-no-repeat [&::-webkit-scrollbar-track]:bg-center [&::-webkit-scrollbar-track]:bg-cover ${
                  variant === "immersive"
                    ? "max-h-none overflow-visible md:min-h-0 md:flex-1 md:max-h-none md:overflow-y-auto lg:max-h-full"
                    : "h-full overflow-y-auto"
                }`}
              >
              {sections.map((section) => (
                <section key={section.id} className="mb-2">
                  <p
                    className="h-8 w-full pl-3 text-xs font-semibold uppercase tracking-wide leading-8 text-[#2f3440]"
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
                      const isActive = selectedAbility?.id === ability.id && panelMode === "ability";
                      return (
                        <li key={ability.id}>
                          <button
                            type="button"
                            aria-expanded={isActive}
                            onClick={() => handleAbilityTap(ability.id)}
                            className={`relative group flex h-[3.5rem] w-full items-center text-left transition ${
                              isActive
                                ? "text-[#c9962e]"
                                : "text-[#2c3340] hover:text-[#c9962e]"
                            }`}
                            style={{
                              backgroundImage: abilitySurfaceStyles.rowBg,
                              backgroundSize: "100% 100%",
                              backgroundPosition: "center",
                            }}
                          >
                            <span
                              className={`pointer-events-none absolute inset-0 ${
                                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              } transition-opacity`}
                              style={{
                                backgroundImage: abilitySurfaceStyles.rowSelected,
                                backgroundSize: "calc(100% + 0.8rem) calc(100% + 0.5rem)",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                              }}
                            />
                            <span className="relative z-[1] flex h-full w-[4.2rem] shrink-0 items-center justify-center text-xs font-semibold uppercase tracking-wide text-white">
                              <AbilityKeyDisplay keyDisplay={ability.keyDisplay} />
                            </span>
                            <span className="relative z-[1] flex h-full w-[8.3rem] shrink-0 items-center justify-center">
                              {ability.iconUrl ? (
                                <Image
                                  src={ability.iconUrl}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="h-8 w-auto object-contain"
                                  style={{
                                    filter: abilityIconTintFilter,
                                    opacity: 0.96,
                                  }}
                                />
                              ) : (
                                <span className="h-8 w-8 rounded-full border border-[#8290a8] bg-[#c1c9d8]" />
                              )}
                            </span>
                            <span className="relative z-[1] truncate px-3 text-[15px] font-semibold uppercase tracking-wide">
                              {ability.name}
                            </span>
                          </button>

                          {/*
                            Mobile-only inline accordion. Uses grid-template-rows
                            0fr <-> 1fr so the slide animation tracks the actual
                            content height with no JS measurement. Hidden on lg+
                            where the side panel takes over.
                          */}
                          <div
                            ref={(node) => {
                              if (node) {
                                inlineDetailRefs.current.set(ability.id, node);
                              } else {
                                inlineDetailRefs.current.delete(ability.id);
                              }
                            }}
                            aria-hidden={!isActive}
                            className={`grid overflow-hidden transition-[grid-template-rows] duration-[220ms] ease-out lg:hidden ${
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

          {/* Desktop side detail panel: hidden below lg, where the inline
              accordion takes over directly under each ability row. */}
          <section
            className={`hidden lg:flex ${
              variant === "immersive"
                ? detailPanelShellImmersiveClass
                : detailPanelShellPanelClass
            }`}
          >
            <PanelCornerAccent />
            <div className="relative flex min-h-0 flex-1 flex-col">
              <AbilityDetail
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/55 sm:text-xs">
            Rivals
          </p>
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

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1).toLowerCase())
    .join(" ");
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-white/20 px-1 py-2 last:border-b-0">
      <span
        className="inline-flex min-w-[8.5rem] items-center bg-center bg-cover px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
        style={{
          backgroundImage: abilitySurfaceStyles.statLabelBg,
        }}
      >
        {label}
      </span>
      <span className="text-right text-sm uppercase tracking-wide text-white/85">{value}</span>
    </div>
  );
}

function AbilityKeyDisplay({ keyDisplay }: { keyDisplay: string }) {
  const keyIconSource = getKeyIconSource(keyDisplay);

  if (!keyIconSource) {
    return keyDisplay;
  }

  return (
    <Image
      src={keyIconSource}
      alt={keyDisplay}
      width={18}
      height={18}
      className="h-[18px] w-auto object-contain"
    />
  );
}
