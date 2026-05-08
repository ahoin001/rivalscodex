"use client";

import { useMemo, useState } from "react";
import {
  ClippedButton,
  ClippedPanel,
  HudSection,
  StatRow,
} from "@/components/ui";
import { Hero } from "@/data/schema";
import { ResolvedHeroForm } from "@/features/heroes/hero-forms";
import { externalResourceTypeLabels } from "@/components/ui/presets";
import { HeroAbilitiesTabPanel } from "@/features/heroes/components/hero-abilities-tab-panel";
import { FormContextBadge } from "@/features/heroes/components/form-context-badge";
import { useHeroNotes } from "@/features/heroes/use-hero-notes";
import { LazyVideoEmbed } from "@/features/heroes/components/lazy-video-embed";
import { getYoutubeEmbedUrl } from "@/features/heroes/youtube";

type TabId = "abilities" | "combos" | "playstyle" | "resources" | "notes";

type HeroInfoTabsProps = {
  hero: Hero;
  activeForm: ResolvedHeroForm;
  forms: ResolvedHeroForm[];
};

const tabLabels: Record<TabId, string> = {
  abilities: "Abilities",
  combos: "Combos & Synergies",
  playstyle: "Playstyle Guide",
  resources: "Resources",
  notes: "Personal Notes",
};

export function HeroInfoTabs({ hero, activeForm, forms }: HeroInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("abilities");
  const hasTransformations = forms.length > 1;
  const { notes, setNotes, clearNotes, hydrated } = useHeroNotes(hero.id);

  const combosWithContext = useMemo(
    () =>
      hero.combos
        .map((combo) => {
          const matchedFormIds = inferMatchedFormIds(combo, forms);
          const appliesToLabel =
            matchedFormIds.length === 0
              ? "All Forms"
              : getAppliesToLabel(matchedFormIds, forms);
          const contextRank = getComboContextRank(matchedFormIds, activeForm.id);

          return {
            combo,
            appliesToLabel,
            contextRank,
            isCurrentForm: matchedFormIds.includes(activeForm.id),
          };
        })
        .sort(
          (left, right) =>
            left.contextRank - right.contextRank ||
            left.combo.name.localeCompare(right.combo.name),
        ),
    [activeForm.id, forms, hero.combos],
  );

  const tabContent = useMemo(
    () => ({
      abilities: <HeroAbilitiesTabPanel hero={hero} activeForm={activeForm} />,
      combos: (
        <div className="grid gap-4 lg:grid-cols-2">
          <HudSection title="Combo Recipes">
            {hasTransformations && (
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-brand-gold/25 pb-3">
                <FormContextBadge
                  label={`Viewing Form: ${activeForm.name}`}
                  tone="active"
                />
                <p className="text-xs text-muted-foreground">
                  Guide content is shared hero-wide. Labels call out transformation context.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {combosWithContext.map(({ combo, appliesToLabel, isCurrentForm }) => (
                <article
                  key={combo.id}
                  className={`border-l pl-3 ${
                    isCurrentForm ? "border-brand-gold/75" : "border-brand-gold/45"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-brand-gold">
                      {combo.name}
                    </p>
                    {hasTransformations && (
                      <FormContextBadge
                        label={`Applies: ${appliesToLabel}`}
                        tone={isCurrentForm ? "active" : "secondary"}
                      />
                    )}
                  </div>
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
            {hasTransformations && (
              <p className="mb-3 text-xs text-muted-foreground">
                Synergy guidance remains hero-level and should be applied across forms.
              </p>
            )}
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
            {hasTransformations && (
              <p className="mb-3 text-xs text-muted-foreground">
                Playstyle guidance is holistic for the entire hero kit and transformation cycle.
              </p>
            )}
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
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr]">
          <HudSection title="Guides & Links">
            {hasTransformations && (
              <p className="mb-3 text-xs text-muted-foreground">
                External resources are curated at hero level and may cover multiple forms in one
                guide.
              </p>
            )}
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
          <HudSection title="Reference Snapshot" tone="secondary">
            <div className="space-y-2">
              <StatRow label="Role" value={activeForm.role} />
              <StatRow label="Form HP" value={`${activeForm.health}`} />
              <StatRow label="Difficulty" value={`${hero.difficulty}/5`} />
              <StatRow label="Last Updated" value={hero.updatedAt} showDivider={false} />
            </div>
            {activeForm.resource && (
              <div className="mt-4 border-t border-white/15 pt-3">
                <p className="text-xs uppercase tracking-wide text-brand-gold">Hero Resource</p>
                <p className="mt-1 text-sm text-white">{activeForm.resource.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeForm.resource.description}
                </p>
              </div>
            )}
          </HudSection>
        </div>
      ),
      notes: (
        <HudSection title="Personal Notes" tone="secondary">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Save matchup reminders, comfort picks, and hero-specific practice goals. Notes are
              stored locally for this hero.
            </p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              placeholder={`Write your ${hero.name} notes here...`}
              className="min-h-44 w-full resize-y border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-3 text-sm text-white outline-none focus:border-brand-gold"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground">
                {hydrated ? (
                  "Autosaves locally"
                ) : (
                  "Loading saved notes..."
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{`${notes.length} characters`}</span>
                <button
                  type="button"
                  onClick={clearNotes}
                  className="border border-brand-gold/40 px-2 py-1 uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </HudSection>
      ),
    }),
    [
      activeForm,
      clearNotes,
      combosWithContext,
      hasTransformations,
      hero,
      hydrated,
      notes,
      setNotes,
    ],
  );

  return (
    <ClippedPanel
      tone="gold"
      className="border border-brand-gold/35 p-4 md:flex md:h-[min(46rem,calc(100vh-8rem))] md:flex-col"
    >
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

      <div
        key={activeTab}
        className="fade-slide-in mt-4 hidden min-h-0 md:block md:flex-1 md:overflow-y-auto md:pr-1"
      >
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

function getNormalizedHaystack(heroCombo: Hero["combos"][number]): string {
  return [heroCombo.name, ...heroCombo.steps, heroCombo.teamUp]
    .filter(Boolean)
    .join(" ")
    .replace(/[^\w\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const genericAliases = new Set([
  "form",
  "default",
  "ultimate",
  "normal",
  "mode",
  "state",
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFormAliases(form: ResolvedHeroForm): string[] {
  const aliases = [form.name, form.shortLabel, form.id.replace(/-/g, " ")]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase().trim())
    .filter((value) => value.length >= 3)
    .filter((value) => !genericAliases.has(value));

  return Array.from(new Set(aliases));
}

function getAliasMatches(text: string, alias: string): boolean {
  const pattern = new RegExp(`(?:^|\\b)${escapeRegex(alias)}(?:\\b|$)`, "i");
  return pattern.test(text);
}

function inferMatchedFormIds(
  heroCombo: Hero["combos"][number],
  forms: ResolvedHeroForm[],
): string[] {
  if (forms.length <= 1) {
    return [];
  }

  const haystack = getNormalizedHaystack(heroCombo);
  const aliasMap = forms.map((form) => ({
    formId: form.id,
    aliases: getFormAliases(form),
  }));

  const matchedFormIds = aliasMap
    .filter((entry) => entry.aliases.some((alias) => getAliasMatches(haystack, alias)))
    .map((entry) => entry.formId);

  return matchedFormIds;
}

function getAppliesToLabel(matchedFormIds: string[], forms: ResolvedHeroForm[]): string {
  if (matchedFormIds.length === 0) {
    return "All Forms";
  }

  if (matchedFormIds.length > 1) {
    return "Multi-Form";
  }

  const form = forms.find((candidate) => candidate.id === matchedFormIds[0]);
  return form?.shortLabel ?? form?.name ?? "Specific Form";
}

function getComboContextRank(matchedFormIds: string[], activeFormId: string): number {
  if (matchedFormIds.includes(activeFormId)) {
    return 0;
  }

  if (matchedFormIds.length === 0) {
    return 1;
  }

  return 2;
}
