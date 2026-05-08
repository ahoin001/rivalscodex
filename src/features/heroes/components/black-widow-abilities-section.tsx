"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ClippedPanel } from "@/components/ui";
import { ExternalHero } from "@/lib/api/marvel-rivals";
import abilityContainerImage from "../../../../rivals-assets/frames/ability-container.png";
import lmbIcon from "../../../../rivals-assets/icons/LMB-icon.png";
import rmbIcon from "../../../../rivals-assets/icons/RMB-icon.png";

type BlackWidowAbilitiesSectionProps = {
  hero: ExternalHero | null;
};

type AbilitySectionId = "normal-attack" | "abilities" | "passives";

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

const fallbackHero: ExternalHero = {
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
    return lmbIcon;
  }

  if (keyDisplay === "RMB") {
    return rmbIcon;
  }

  return null;
}

function toAbilityViewModel(
  hero: ExternalHero,
  ability: NonNullable<ExternalHero["abilities"]>[number],
): AbilityViewModel {
  const additionalEntries = Object.entries(ability.additionalFields ?? {})
    .filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return normalizedKey !== "key" && normalizedKey !== "hotkey" && value.trim().length > 0;
    })
    .map(([key, value]) => ({
      label: key,
      value,
    }));

  const fallbackFields =
    additionalEntries.length > 0
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
    fields: fallbackFields,
  };
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

  const mapped = deduped.map((ability) => toAbilityViewModel(hero, ability));

  const normalAttack = mapped
    .filter((ability) => ability.key.includes("left click") || ability.key.includes("right click"))
    .sort((left, right) => left.key.localeCompare(right.key));

  const passives = mapped
    .filter((ability) => {
      const original = sourceAbilities.find(
        (candidate) => candidate.name.toLowerCase() === ability.name.toLowerCase(),
      );
      const typeIsPassive = (original?.type ?? "").toLowerCase().includes("passive");
      return ability.key === "passive" || typeIsPassive;
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const abilities = mapped
    .filter(
      (ability) =>
        !normalAttack.some((candidate) => candidate.id === ability.id) &&
        !passives.some((candidate) => candidate.id === ability.id) &&
        // Team-up abilities are intentionally hidden for now.
        ability.key !== "c",
    )
    .sort((left, right) => {
      const leftRank = keyPriority.indexOf(left.key);
      const rightRank = keyPriority.indexOf(right.key);
      const normalizedLeftRank = leftRank === -1 ? 99 : leftRank;
      const normalizedRightRank = rightRank === -1 ? 99 : rightRank;
      return normalizedLeftRank - normalizedRightRank || left.name.localeCompare(right.name);
    });

  const sections: AbilitySection[] = [
    {
      id: "normal-attack",
      title: "Normal Attack",
      abilities: normalAttack,
    },
    {
      id: "abilities",
      title: "Abilities",
      abilities,
    },
    {
      id: "passives",
      title: "Passives",
      abilities: passives,
    },
  ];

  return sections.filter((section) => section.abilities.length > 0);
}

function formatStatLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

export function BlackWidowAbilitiesSection({ hero }: BlackWidowAbilitiesSectionProps) {
  const sourceHero = hero ?? fallbackHero;
  const sections = useMemo(() => buildSections(sourceHero), [sourceHero]);
  const [panelMode, setPanelMode] = useState<"base" | "ability">("base");
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(
    sections[0]?.abilities[0]?.id ?? null,
  );

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

  return (
    <ClippedPanel tone="gold" className="border border-brand-gold/35 p-4 md:p-5">
      <div className="space-y-4">
        <h3 className="font-display text-3xl italic uppercase leading-none text-white md:text-4xl">
          Abilities
        </h3>

        <div className="grid gap-4 lg:grid-cols-[6.8fr_10.37fr]">
          <div className="space-y-2">
            <div
              className="relative ml-2 flex h-[4.8rem] items-end overflow-hidden"
              style={{
                backgroundImage: abilitySurfaceStyles.rolePictureBg,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
              }}
            >
              <div className="z-[1] flex min-w-0 items-center gap-3 pl-3 pb-2">
                {transformation?.iconUrl ? (
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
                <p className="truncate font-display text-4xl italic leading-none text-white">
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
              className="relative h-[24.6rem] w-full pb-2"
              style={{
                backgroundImage: abilitySurfaceStyles.skillScrollBorder,
                backgroundSize: "94% 0.5rem",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "0.6rem bottom",
              }}
            >
              <div className="h-full overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#fc3] [&::-webkit-scrollbar-track]:bg-[#999] [&::-webkit-scrollbar-track]:bg-no-repeat [&::-webkit-scrollbar-track]:bg-center [&::-webkit-scrollbar-track]:bg-cover">
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
                            onClick={() => {
                              setPanelMode("ability");
                              setSelectedAbilityId(ability.id);
                            }}
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
                            {(isActive || !isActive) && (
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
                            )}
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
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
              </div>
            </div>
          </div>

          <section
            className="relative h-[31.2rem] overflow-hidden border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: `url(${abilityContainerImage.src})`,
            }}
          >
            <div className="relative">
              {panelMode === "base" || !selectedAbility ? (
                <div>
                  <h4 className="h-[5rem] border-b border-[#bfc8d7] bg-[linear-gradient(135deg,#f4f7fb_0%,#e4eaf3_55%,#d9e1ee_100%)] px-4 py-3 font-display text-4xl italic uppercase leading-[3rem] text-[#0f1522]">
                    Base Stats
                  </h4>
                  <div className="space-y-0 px-3 py-3">
                    <StatLine label="Health" value={healthValue} />
                    <StatLine label="Movement Speed" value={movementSpeedValue} />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="h-[8.4rem] border-b border-[#9ba9c2]/45 bg-[linear-gradient(135deg,#eef2f8_0%,#dce3ef_24%,#222c3f_24.4%,#1a2335_100%)] px-4 py-3">
                    <h4 className="font-display text-4xl italic uppercase leading-none text-[#0f1522]">
                      {selectedAbility.name}
                    </h4>
                    <div className="mt-2 flex items-start gap-3">
                      <span
                        className="mt-0.5 inline-flex h-6 min-w-[3.4rem] items-center justify-center bg-center bg-cover px-2 text-[11px] font-bold uppercase tracking-wide text-white"
                        style={{
                          backgroundImage: abilitySurfaceStyles.keyPnl,
                        }}
                      >
                        <AbilityKeyDisplay keyDisplay={selectedAbility.keyDisplay} />
                      </span>
                      <p className="max-h-[4.8rem] overflow-y-auto pr-1 text-sm text-[#2f3848] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#fc3] [&::-webkit-scrollbar-track]:bg-[#999] [&::-webkit-scrollbar-track]:bg-no-repeat [&::-webkit-scrollbar-track]:bg-center [&::-webkit-scrollbar-track]:bg-cover">
                        {selectedAbility.description}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-[22rem] overflow-y-auto px-3 py-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#fc3] [&::-webkit-scrollbar-track]:bg-[#999] [&::-webkit-scrollbar-track]:bg-no-repeat [&::-webkit-scrollbar-track]:bg-center [&::-webkit-scrollbar-track]:bg-cover">
                    {selectedAbility.fields.map((field) => (
                      <StatLine
                        key={`${selectedAbility.id}-${field.label}`}
                        label={formatStatLabel(field.label)}
                        value={field.value}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
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
