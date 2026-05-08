"use client";

import { useMemo, useState } from "react";
import {
  ClippedButton,
  ClippedPanel,
  HudSection,
  RivalsDataTableSection,
  RivalsPill,
  StatRow,
} from "@/components/ui";
import { Hero } from "@/data/schema";
import {
  abilityMatrixColumns,
  baseStatRowsPreset,
  externalResourceTypeLabels,
} from "@/components/ui/presets";
import { AbilityCard } from "@/features/heroes/components/ability-card";
import { LazyVideoEmbed } from "@/features/heroes/components/lazy-video-embed";
import { getYoutubeEmbedUrl } from "@/features/heroes/youtube";

type TabId = "abilities" | "combos" | "playstyle" | "resources";

type HeroInfoTabsProps = {
  hero: Hero;
};

const tabLabels: Record<TabId, string> = {
  abilities: "Abilities",
  combos: "Combos & Synergies",
  playstyle: "Playstyle Guide",
  resources: "External Resources",
};

export function HeroInfoTabs({ hero }: HeroInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("abilities");

  const tabContent = useMemo(
    () => ({
      abilities: (
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.7fr]">
          <RivalsDataTableSection
            title="Abilities Matrix"
            columns={abilityMatrixColumns}
            rows={hero.abilities}
            getRowKey={(ability) => ability.id}
            renderCell={(ability, key) => {
              if (key === "keybind") {
                return (
                  <span className="inline-flex h-8 min-w-8 items-center justify-center border border-brand-gold/55 bg-brand-gold-muted px-2 text-xs font-bold text-brand-gold">
                    {ability.keybind}
                  </span>
                );
              }

              if (key === "name") {
                return (
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{ability.name}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {ability.description}
                    </p>
                  </div>
                );
              }

              if (key === "type") {
                return <RivalsPill tone="brand">{ability.type}</RivalsPill>;
              }

              return (
                <div className="flex flex-wrap gap-1">
                  {ability.damage && (
                    <RivalsPill tone="brand">Damage {ability.damage}</RivalsPill>
                  )}
                  {ability.cooldownSeconds !== undefined &&
                    ability.cooldownSeconds > 0 && (
                      <RivalsPill>CD {ability.cooldownSeconds}s</RivalsPill>
                    )}
                </div>
              );
            }}
            renderMobile={(ability) => <AbilityCard ability={ability} />}
          />
          <HudSection title="Base Stats" titleSize="lg">
            <div className="space-y-2 text-sm">
              {baseStatRowsPreset.map((statRow, index) => {
                const isLast = index === baseStatRowsPreset.length - 1;

                if (statRow.key === "health") {
                  return (
                    <StatRow
                      key={statRow.key}
                      label={statRow.label}
                      value={`${hero.health}`}
                      showDivider={!isLast}
                    />
                  );
                }

                if (statRow.key === "role") {
                  return (
                    <StatRow
                      key={statRow.key}
                      label={statRow.label}
                      value={hero.role}
                      showDivider={!isLast}
                    />
                  );
                }

                if (statRow.key === "difficulty") {
                  return (
                    <StatRow
                      key={statRow.key}
                      label={statRow.label}
                      value={`${hero.difficulty}/5`}
                      showDivider={!isLast}
                    />
                  );
                }

                return (
                  <StatRow
                    key={statRow.key}
                    label={statRow.label}
                    value={hero.updatedAt}
                    showDivider={!isLast}
                  />
                );
              })}
            </div>
          </HudSection>
        </div>
      ),
      combos: (
        <div className="grid gap-4 lg:grid-cols-2">
          <HudSection title="Combo Recipes">
            <div className="space-y-4">
              {hero.combos.map((combo) => (
                <article
                  key={combo.id}
                  className="border-l border-brand-gold/55 pl-3"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-brand-gold">
                    {combo.name}
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-white/85">
                    {combo.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  {combo.teamUp && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Team-Up: {combo.teamUp}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </HudSection>

          <HudSection title="Team Synergy Notes" tone="secondary">
            <ul className="space-y-2 text-sm text-white/85">
              {hero.synergies.map((synergy) => (
                <li key={synergy.hero}>
                  <span className="font-semibold text-white">{synergy.hero}: </span>
                  {synergy.reason}
                </li>
              ))}
            </ul>
          </HudSection>
        </div>
      ),
      playstyle: (
        <div className="grid gap-4 lg:grid-cols-2">
          <HudSection title="Positioning">
            <p className="text-sm text-white/85">{hero.playstyle.positioning}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {hero.playstyle.overview}
            </p>
          </HudSection>

          <HudSection title="Target Calls" tone="secondary">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-gold">
                  Who To Target
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/85">
                  {hero.playstyle.targetPriority.map((target) => (
                    <li key={target}>{target}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-gold">
                  Who To Avoid
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/85">
                  {hero.playstyle.avoidPriority.map((target) => (
                    <li key={target}>{target}</li>
                  ))}
                </ul>
              </div>
            </div>
          </HudSection>
        </div>
      ),
      resources: (
        <HudSection title="Guides & Links">
          <ul className="space-y-2 text-sm">
            {hero.externalResources.map((resource) => {
              const embedUrl =
                resource.type === "youtube"
                  ? getYoutubeEmbedUrl(resource.url)
                  : null;

              return (
                <li key={resource.url}>
                  <div className="space-y-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-white hover:text-brand-gold"
                    >
                      <span className="rounded border border-brand-gold/40 px-2 py-1 text-xs uppercase text-brand-gold/90">
                        {externalResourceTypeLabels[resource.type]}
                      </span>
                      {resource.title}
                    </a>
                    {embedUrl && (
                      <LazyVideoEmbed title={resource.title} embedUrl={embedUrl} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </HudSection>
      ),
    }),
    [hero],
  );

  return (
    <ClippedPanel tone="gold" className="border border-brand-gold/35 p-4">
      <div className="hidden gap-2 md:flex">
        {(Object.keys(tabLabels) as TabId[]).map((tabId) => (
          <ClippedButton
            key={tabId}
            active={activeTab === tabId}
            onClick={() => setActiveTab(tabId)}
            tone="brand"
          >
            {tabLabels[tabId]}
          </ClippedButton>
        ))}
      </div>

      <div key={activeTab} className="fade-slide-in mt-4 hidden md:block">
        {tabContent[activeTab]}
      </div>

      <div className="space-y-3 md:hidden">
        {(Object.keys(tabLabels) as TabId[]).map((tabId) => (
          <details
            key={tabId}
            className="clipped-edge border border-brand-gold/25 bg-[#121726]/90 p-3"
          >
            <summary className="cursor-pointer font-display text-2xl italic uppercase leading-none">
              {tabLabels[tabId]}
            </summary>
            <div className="mt-3">{tabContent[tabId]}</div>
          </details>
        ))}
      </div>
    </ClippedPanel>
  );
}
