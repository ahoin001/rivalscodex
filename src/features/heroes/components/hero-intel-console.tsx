"use client";

import { useMemo, useState } from "react";
import { ClippedButton, ClippedPanel, HudSection, RivalsPill } from "@/components/ui";
import { Hero } from "@/data/schema";

type IntelTabId = "abilities" | "combos" | "playstyle" | "resources" | "notes";

export type IntelLink = {
  label: string;
  href: string;
};

export type IntelTabContent = {
  id: IntelTabId;
  label: string;
  summary: string;
  primaryPoints: string[];
  secondaryPoints: string[];
  links: IntelLink[];
};

type HeroIntelConsoleProps = {
  heroName: string;
  initialContent: IntelTabContent[];
  allowAdminTools?: boolean;
};

function toMultiline(value: string[]): string {
  return value.join("\n");
}

function fromMultiline(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function HeroIntelConsole({
  heroName,
  initialContent,
  allowAdminTools = false,
}: HeroIntelConsoleProps) {
  const [activeTabId, setActiveTabId] = useState<IntelTabId>(initialContent[0].id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<IntelTabContent[]>(initialContent);
  const [copied, setCopied] = useState(false);

  const activeTab = useMemo(
    () => content.find((tab) => tab.id === activeTabId) ?? content[0],
    [activeTabId, content],
  );

  const updateActiveTab = (updater: (current: IntelTabContent) => IntelTabContent) => {
    setContent((current) =>
      current.map((tab) => (tab.id === activeTab.id ? updater(tab) : tab)),
    );
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ClippedPanel tone="gold" className="border border-brand-gold/35 p-4 md:p-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">Hero Data Core</p>
            <h3 className="mt-1 font-display text-3xl italic uppercase leading-none text-white md:text-4xl">
              {heroName} Intel Console
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Premium quick-read layer for players and a structured edit surface for admins.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RivalsPill tone="brand">{isEditMode ? "Edit Mode" : "Live View"}</RivalsPill>
            {allowAdminTools && (
              <ClippedButton tone="brand" onClick={() => setIsEditMode((current) => !current)}>
                {isEditMode ? "Close Editor" : "Admin Edit"}
              </ClippedButton>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.75fr]">
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {content.map((tab) => (
                <ClippedButton
                  key={tab.id}
                  tone="brand"
                  active={tab.id === activeTab.id}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {tab.label}
                </ClippedButton>
              ))}
            </div>

            <HudSection title={activeTab.label}>
              {!isEditMode || !allowAdminTools ? (
                <div className="space-y-4">
                  <p className="text-sm text-white/90">{activeTab.summary}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-gold">
                        Priority Cues
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/85">
                        {activeTab.primaryPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-gold">
                        Secondary Cues
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/85">
                        {activeTab.secondaryPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-wide text-brand-gold/90">
                      Summary
                    </span>
                    <textarea
                      value={activeTab.summary}
                      onChange={(event) =>
                        updateActiveTab((current) => ({
                          ...current,
                          summary: event.currentTarget.value,
                        }))
                      }
                      className="min-h-20 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-wide text-brand-gold/90">
                      Priority Cues (one per line)
                    </span>
                    <textarea
                      value={toMultiline(activeTab.primaryPoints)}
                      onChange={(event) =>
                        updateActiveTab((current) => ({
                          ...current,
                          primaryPoints: fromMultiline(event.currentTarget.value),
                        }))
                      }
                      className="min-h-24 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-wide text-brand-gold/90">
                      Secondary Cues (one per line)
                    </span>
                    <textarea
                      value={toMultiline(activeTab.secondaryPoints)}
                      onChange={(event) =>
                        updateActiveTab((current) => ({
                          ...current,
                          secondaryPoints: fromMultiline(event.currentTarget.value),
                        }))
                      }
                      className="min-h-24 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
                    />
                  </label>
                </div>
              )}
            </HudSection>
          </section>

          <section className="space-y-4">
            <HudSection title="Quick Resources" tone="secondary">
              {activeTab.links.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {activeTab.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-white hover:text-brand-gold"
                      >
                        <span className="rounded border border-brand-gold/40 px-2 py-1 text-[10px] uppercase tracking-wide text-brand-gold/90">
                          Link
                        </span>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No external links for this tab.</p>
              )}
            </HudSection>

            <HudSection title="Admin Workflow" tone="secondary">
              {allowAdminTools ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Edit content inline, then export JSON for CMS or content seed updates.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ClippedButton tone="brand" onClick={copyJson}>
                      {copied ? "Copied JSON" : "Copy JSON"}
                    </ClippedButton>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Admin editing controls are enabled in development environment only.
                </p>
              )}
            </HudSection>
          </section>
        </div>
      </div>
    </ClippedPanel>
  );
}

export function buildIntelContentFromHero(hero: Hero): IntelTabContent[] {
  const abilityNames = hero.abilities.slice(0, 4).map((ability) => ability.name);
  const comboNames = hero.combos.slice(0, 4).map((combo) => combo.name);
  const targetPriority = hero.playstyle.targetPriority.slice(0, 4);
  const avoidPriority = hero.playstyle.avoidPriority.slice(0, 4);

  return [
    {
      id: "abilities",
      label: "Abilities",
      summary: `${hero.name} ability profile: ${hero.summary}`,
      primaryPoints:
        abilityNames.length > 0
          ? abilityNames.map((name) => `Master ${name} timing and practical use cases.`)
          : ["Review each core ability and map it to a specific fight scenario."],
      secondaryPoints: [
        "Track cooldown sequencing before committing high-risk engages.",
        "Use ability overlap intentionally to avoid redundant utility usage.",
      ],
      links: [],
    },
    {
      id: "combos",
      label: "Combos & Synergies",
      summary:
        comboNames.length > 0
          ? `Primary conversion routes include ${comboNames.join(", ")}.`
          : "Use micro-combos that chain utility into reliable damage conversion.",
      primaryPoints:
        hero.combos.length > 0
          ? hero.combos.map((combo) => `${combo.name}: ${combo.steps[0]}`)
          : ["Open with setup utility, then commit damage during displacement windows."],
      secondaryPoints:
        hero.synergies.length > 0
          ? hero.synergies.slice(0, 4).map((synergy) => `${synergy.hero}: ${synergy.reason}`)
          : ["Coordinate team cooldowns to maximize combo conversion reliability."],
      links: [],
    },
    {
      id: "playstyle",
      label: "Playstyle Guide",
      summary: hero.playstyle.overview,
      primaryPoints:
        targetPriority.length > 0
          ? targetPriority.map((target) => `Prioritize ${target}.`)
          : ["Prioritize isolated targets and maintain crossfire-friendly angles."],
      secondaryPoints:
        avoidPriority.length > 0
          ? avoidPriority.map((target) => `Avoid ${target}.`)
          : ["Disengage early when multiple hard counters focus your lane."],
      links: [],
    },
    {
      id: "resources",
      label: "Resources",
      summary: "Curated hero references for mechanics, matchups, and patch adaptation.",
      primaryPoints: [
        "Use short-form guides for warm-up and long-form VODs for macro adaptation.",
        "Refresh resource priorities after major patch updates.",
      ],
      secondaryPoints: [
        "Favor sources with clear decision criteria over montage-only highlights.",
        "Maintain a small trusted list of references per hero.",
      ],
      links: hero.externalResources.map((resource) => ({
        label: resource.title,
        href: resource.url,
      })),
    },
    {
      id: "notes",
      label: "Personal Notes",
      summary: "Store personal reminders for this hero: matchup reads and execution cues.",
      primaryPoints: [
        "Write concise queue-time reminders for consistency under pressure.",
        "Capture mistakes immediately after matches while memory is fresh.",
      ],
      secondaryPoints: [
        "Retire stale notes when balance updates invalidate old patterns.",
        "Keep note entries short enough to scan in under 10 seconds.",
      ],
      links: [],
    },
  ];
}
