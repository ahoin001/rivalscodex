"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClippedButton,
  ClippedPanel,
  HudSection,
  RivalsPill,
  StatRow,
} from "@/components/ui";
import { Hero } from "@/data/schema";
import { ResolvedHeroForm } from "@/features/heroes/hero-forms";
import { externalResourceTypeLabels } from "@/components/ui/presets";
import { HeroAbilitiesTabPanel } from "@/features/heroes/components/hero-abilities-tab-panel";
import { FormContextBadge } from "@/features/heroes/components/form-context-badge";
import { useHeroNotes } from "@/features/heroes/use-hero-notes";
import { useHeroAdminDraft } from "@/features/heroes/use-hero-admin-draft";
import { LazyVideoEmbed } from "@/features/heroes/components/lazy-video-embed";
import { getYoutubeEmbedUrl } from "@/features/heroes/youtube";
import { featureFlags } from "@/lib/feature-flags";
import {
  publishHeroEditorialToSupabaseAction,
  saveHeroDraftToSupabaseAction,
} from "@/features/heroes/actions/hero-editorial-actions";

type TabId = "abilities" | "combos" | "playstyle" | "resources" | "notes";

type HeroInfoTabsProps = {
  hero: Hero;
  activeForm: ResolvedHeroForm;
  forms: ResolvedHeroForm[];
  allowAdminTools?: boolean;
};

const tabLabels: Record<TabId, string> = {
  abilities: "Abilities",
  combos: "Combos & Synergies",
  playstyle: "Playstyle Guide",
  resources: "Resources",
  notes: "Personal Notes",
};

export function HeroInfoTabs({
  hero,
  activeForm,
  forms,
  allowAdminTools = false,
}: HeroInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("abilities");
  const hasTransformations = forms.length > 1;
  const { notes, setNotes, clearNotes, hydrated } = useHeroNotes(hero.id);
  const {
    draft,
    displayHero,
    isEditing,
    beginEdit,
    cancelEdit,
    resetToHero,
    copyPatchJson,
    updateDraft,
  } = useHeroAdminDraft(hero);

  const [copiedPatch, setCopiedPatch] = useState(false);
  const [combosJson, setCombosJson] = useState("");
  const [synergiesJson, setSynergiesJson] = useState("");
  const [resourcesJson, setResourcesJson] = useState("");
  const [jsonErrors, setJsonErrors] = useState<{
    combos?: string;
    synergies?: string;
    resources?: string;
  }>({});

  const [draftRemoteMessage, setDraftRemoteMessage] = useState<string | null>(null);
  const [remoteSaveKind, setRemoteSaveKind] = useState<"idle" | "draft" | "publish">(
    "idle",
  );

  useEffect(() => {
    cancelEdit();
    setCopiedPatch(false);
    setDraftRemoteMessage(null);
  }, [hero.id, cancelEdit]);

  const seedJsonEditors = () => {
    setCombosJson(JSON.stringify(hero.combos, null, 2));
    setSynergiesJson(JSON.stringify(hero.synergies, null, 2));
    setResourcesJson(JSON.stringify(hero.externalResources, null, 2));
    setJsonErrors({});
  };

  const handleBeginEdit = () => {
    seedJsonEditors();
    beginEdit();
  };

  const handleResetDraft = () => {
    resetToHero();
    seedJsonEditors();
  };

  const handleCopyPatch = async () => {
    const ok = await copyPatchJson();
    if (ok) {
      setCopiedPatch(true);
      window.setTimeout(() => setCopiedPatch(false), 1600);
    }
  };

  const handleSaveDraftToSupabase = async () => {
    if (!draft) {
      return;
    }

    setRemoteSaveKind("draft");
    setDraftRemoteMessage(null);
    try {
      const outcome = await saveHeroDraftToSupabaseAction({
        heroSlug: hero.slug,
        snapshot: draft,
      });
      setDraftRemoteMessage(
        outcome.ok ? "Draft saved to Supabase (scope: draft)." : outcome.error,
      );
    } finally {
      setRemoteSaveKind("idle");
    }
  };

  const handlePublishEditorialToSupabase = async () => {
    if (!draft) {
      return;
    }

    setRemoteSaveKind("publish");
    setDraftRemoteMessage(null);
    try {
      const outcome = await publishHeroEditorialToSupabaseAction({
        heroSlug: hero.slug,
        snapshot: draft,
      });
      setDraftRemoteMessage(
        outcome.ok
          ? "Published to Supabase. Live hero pages will pick this up (may require a refresh)."
          : outcome.error,
      );
    } finally {
      setRemoteSaveKind("idle");
    }
  };

  const savingDraftRemote = remoteSaveKind === "draft";
  const publishingRemote = remoteSaveKind === "publish";
  const savingRemoteBusy = remoteSaveKind !== "idle";

  const applyCombosJson = useCallback(() => {
    try {
      const parsed = JSON.parse(combosJson) as unknown;
      validateCombosJson(parsed);
      updateDraft((current) => ({ ...current, combos: parsed }));
      setJsonErrors((current) => ({ ...current, combos: undefined }));
    } catch (error) {
      setJsonErrors((current) => ({
        ...current,
        combos: error instanceof Error ? error.message : "Invalid JSON.",
      }));
    }
  }, [combosJson, updateDraft]);

  const applySynergiesJson = useCallback(() => {
    try {
      const parsed = JSON.parse(synergiesJson) as unknown;
      validateSynergiesJson(parsed);
      updateDraft((current) => ({ ...current, synergies: parsed }));
      setJsonErrors((current) => ({ ...current, synergies: undefined }));
    } catch (error) {
      setJsonErrors((current) => ({
        ...current,
        synergies: error instanceof Error ? error.message : "Invalid JSON.",
      }));
    }
  }, [synergiesJson, updateDraft]);

  const applyResourcesJson = useCallback(() => {
    try {
      const parsed = JSON.parse(resourcesJson) as unknown;
      validateResourcesJson(parsed);
      updateDraft((current) => ({ ...current, externalResources: parsed }));
      setJsonErrors((current) => ({ ...current, resources: undefined }));
    } catch (error) {
      setJsonErrors((current) => ({
        ...current,
        resources: error instanceof Error ? error.message : "Invalid JSON.",
      }));
    }
  }, [resourcesJson, updateDraft]);

  const combosWithContext = useMemo(
    () =>
      displayHero.combos
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
    [activeForm.id, displayHero.combos, forms],
  );

  const tabContent = useMemo(
    () => ({
      abilities: (
        <div className="space-y-4">
          {allowAdminTools && isEditing ? (
            <p className="border border-brand-gold/35 bg-brand-gold-muted px-3 py-2 text-xs text-brand-gold/95">
              Abilities mirror live dossier or API-backed data here. Editing is not surfaced in this
              tab—use combos, playstyle, resources, notes, then copy patch JSON into your hero
              content source.
            </p>
          ) : null}
          <HeroAbilitiesTabPanel hero={displayHero} activeForm={activeForm} />
        </div>
      ),
      combos: (
        <div className="grid gap-4 lg:grid-cols-2">
          <HudSection title="Combo Recipes">
            {allowAdminTools && isEditing && draft ? (
              <div className="mb-4 space-y-2 border-b border-brand-gold/25 pb-4">
                <label className="block space-y-1">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-brand-gold/90">
                    Combos JSON
                  </span>
                  <textarea
                    value={combosJson}
                    onChange={(event) => setCombosJson(event.currentTarget.value)}
                    spellCheck={false}
                    className="min-h-40 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-gold"
                  />
                </label>
                {jsonErrors.combos ? (
                  <p className="text-xs text-rose-400">{jsonErrors.combos}</p>
                ) : null}
                <button
                  type="button"
                  onClick={applyCombosJson}
                  className="rounded border border-brand-gold/40 px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold/15"
                >
                  Apply combos
                </button>
              </div>
            ) : null}
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
            {allowAdminTools && isEditing && draft ? (
              <div className="mb-4 space-y-2 border-b border-white/15 pb-4">
                <label className="block space-y-1">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-brand-gold/90">
                    Synergies JSON
                  </span>
                  <textarea
                    value={synergiesJson}
                    onChange={(event) => setSynergiesJson(event.currentTarget.value)}
                    spellCheck={false}
                    className="min-h-32 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-gold"
                  />
                </label>
                {jsonErrors.synergies ? (
                  <p className="text-xs text-rose-400">{jsonErrors.synergies}</p>
                ) : null}
                <button
                  type="button"
                  onClick={applySynergiesJson}
                  className="rounded border border-brand-gold/40 px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold/15"
                >
                  Apply synergies
                </button>
              </div>
            ) : null}
            {hasTransformations && (
              <p className="mb-3 text-xs text-muted-foreground">
                Synergy guidance remains hero-level and should be applied across forms.
              </p>
            )}
            <ul className="space-y-2 text-sm text-white/85">
              {displayHero.synergies.map((synergy) => (
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
            {allowAdminTools && isEditing && draft ? (
              <div className="space-y-4">
                <label className="block space-y-1">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-brand-gold/90">
                    Positioning
                  </span>
                  <textarea
                    value={draft.playstyle.positioning}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        playstyle: {
                          ...current.playstyle,
                          positioning: event.currentTarget.value,
                        },
                      }))
                    }
                    rows={6}
                    className="w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-brand-gold/90">
                    Overview / kit rhythm
                  </span>
                  <textarea
                    value={draft.playstyle.overview}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        playstyle: {
                          ...current.playstyle,
                          overview: event.currentTarget.value,
                        },
                      }))
                    }
                    rows={8}
                    className="w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
                  />
                </label>
              </div>
            ) : (
              <>
                <p className="text-sm text-white/85">{displayHero.playstyle.positioning}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {displayHero.playstyle.overview}
                </p>
              </>
            )}
          </HudSection>

          <HudSection title="Target Calls" tone="secondary">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-gold">
                  Who To Target
                </p>
                {allowAdminTools && isEditing && draft ? (
                  <textarea
                    value={draft.playstyle.targetPriority.join("\n")}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        playstyle: {
                          ...current.playstyle,
                          targetPriority: linesToList(event.currentTarget.value),
                        },
                      }))
                    }
                    rows={14}
                    placeholder="One call per line"
                    className="mt-2 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
                  />
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/85">
                    {displayHero.playstyle.targetPriority.map((target) => (
                      <li key={target}>{target}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-gold">
                  Who To Avoid
                </p>
                {allowAdminTools && isEditing && draft ? (
                  <textarea
                    value={draft.playstyle.avoidPriority.join("\n")}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        playstyle: {
                          ...current.playstyle,
                          avoidPriority: linesToList(event.currentTarget.value),
                        },
                      }))
                    }
                    rows={14}
                    placeholder="One avoid per line"
                    className="mt-2 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
                  />
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/85">
                    {displayHero.playstyle.avoidPriority.map((target) => (
                      <li key={target}>{target}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </HudSection>
        </div>
      ),
      resources: (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr]">
          <HudSection title="Guides & Links">
            {allowAdminTools && isEditing && draft ? (
              <div className="mb-4 space-y-2 border-b border-brand-gold/25 pb-4">
                <label className="block space-y-1">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-brand-gold/90">
                    External resources JSON
                  </span>
                  <textarea
                    value={resourcesJson}
                    onChange={(event) => setResourcesJson(event.currentTarget.value)}
                    spellCheck={false}
                    className="min-h-40 w-full border border-brand-gold/35 bg-[#0f1422]/90 px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-gold"
                  />
                </label>
                {jsonErrors.resources ? (
                  <p className="text-xs text-rose-400">{jsonErrors.resources}</p>
                ) : null}
                <button
                  type="button"
                  onClick={applyResourcesJson}
                  className="rounded border border-brand-gold/40 px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold/15"
                >
                  Apply resources
                </button>
              </div>
            ) : null}
            {hasTransformations && (
              <p className="mb-3 text-xs text-muted-foreground">
                External resources are curated at hero level and may cover multiple forms in one
                guide.
              </p>
            )}
            <ul className="space-y-2 text-sm">
              {displayHero.externalResources.map((resource) => {
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
              <StatRow label="Difficulty" value={`${displayHero.difficulty}/5`} />
              <StatRow label="Last Updated" value={displayHero.updatedAt} showDivider={false} />
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
      applyCombosJson,
      applyResourcesJson,
      applySynergiesJson,
      allowAdminTools,
      combosJson,
      clearNotes,
      combosWithContext,
      displayHero,
      draft,
      hasTransformations,
      hydrated,
      isEditing,
      jsonErrors.combos,
      jsonErrors.resources,
      jsonErrors.synergies,
      notes,
      resourcesJson,
      synergiesJson,
      updateDraft,
      hero.name,
      setNotes,
    ],
  );

  return (
    <ClippedPanel
      tone="gold"
      className="border border-brand-gold/35 p-4 md:flex md:h-[min(46rem,calc(100vh-8rem))] md:flex-col"
    >
      {allowAdminTools ? (
        <div className="mb-3 flex flex-col gap-2 border-b border-brand-gold/25 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <RivalsPill tone="brand">Admin draft</RivalsPill>
            <span className="text-xs text-muted-foreground">
              {featureFlags.enableSupabase ? (
                <>
                  Preview here, copy JSON into git when you want versioning, or save a draft to
                  Supabase when signed in. Use Publish when you want live pages to merge this
                  editorial snapshot.
                </>
              ) : (
                <>Client-only previews and JSON export; enable Supabase to save drafts remotely.</>
              )}
            </span>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {!isEditing ? (
                <ClippedButton tone="brand" onClick={handleBeginEdit}>
                  Edit content
                </ClippedButton>
              ) : (
                <>
                  <ClippedButton tone="brand" onClick={() => cancelEdit()} className="px-3 py-2 text-[11px]">
                    Close editor
                  </ClippedButton>
                  <ClippedButton onClick={handleResetDraft} className="px-3 py-2 text-[11px]">
                    Reset from dossier
                  </ClippedButton>
                  <ClippedButton tone="brand" onClick={handleCopyPatch} className="px-3 py-2 text-[11px]">
                    {copiedPatch ? "Copied" : "Copy patch JSON"}
                  </ClippedButton>
                  {featureFlags.enableSupabase && draft ? (
                    <>
                      <ClippedButton
                        tone="brand"
                        onClick={handleSaveDraftToSupabase}
                        disabled={savingRemoteBusy}
                        className="px-3 py-2 text-[11px]"
                      >
                        {savingDraftRemote ? "Saving…" : "Save draft to Supabase"}
                      </ClippedButton>
                      <ClippedButton
                        tone="brand"
                        onClick={handlePublishEditorialToSupabase}
                        disabled={savingRemoteBusy}
                        className="border border-brand-gold/65 px-3 py-2 text-[11px]"
                      >
                        {publishingRemote ? "Publishing…" : "Publish to site"}
                      </ClippedButton>
                    </>
                  ) : null}
                </>
              )}
            </div>
            {draftRemoteMessage ? (
              <p
                className={`max-w-xl text-right text-[11px] ${
                  draftRemoteMessage.startsWith("Draft saved") ||
                  draftRemoteMessage.startsWith("Published to Supabase")
                    ? "text-emerald-200"
                    : draftRemoteMessage.includes("Sign in") ||
                        draftRemoteMessage.includes("not enabled")
                      ? "text-amber-200"
                      : "text-rose-200"
                }`}
              >
                {draftRemoteMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
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

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const resourceTypeSet = new Set<Hero["externalResources"][number]["type"]>([
  "youtube",
  "guide",
  "community",
]);

function validateCombosJson(value: unknown): asserts value is Hero["combos"] {
  if (!Array.isArray(value)) {
    throw new Error('Expected combos to be a JSON array (e.g. `[{ "id": "...", "name": "...", "steps": ["..."] }]`).');
  }

  value.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Combo ${index}: each entry must be an object.`);
    }

    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.name !== "string") {
      throw new Error(`Combo ${index}: require string "id" and "name".`);
    }

    if (!Array.isArray(row.steps)) {
      throw new Error(`Combo ${index}: "steps" must be an array of strings.`);
    }

    row.steps.forEach((step, stepIndex) => {
      if (typeof step !== "string") {
        throw new Error(`Combo ${index}: step ${stepIndex} must be a string.`);
      }
    });

    if (row.steps.length < 1) {
      throw new Error(`Combo ${index}: supply at least one step.`);
    }

    if (
      row.teamUp !== undefined &&
      row.teamUp !== null &&
      typeof row.teamUp !== "string"
    ) {
      throw new Error(`Combo ${index}: optional "teamUp" must be a string.`);
    }
  });
}

function validateSynergiesJson(value: unknown): asserts value is Hero["synergies"] {
  if (!Array.isArray(value)) {
    throw new Error('Expected synergies to be a JSON array.');
  }

  value.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Synergy ${index}: each entry must be an object.`);
    }

    const row = entry as Record<string, unknown>;
    if (typeof row.hero !== "string" || typeof row.reason !== "string") {
      throw new Error(`Synergy ${index}: require string fields "hero" and "reason".`);
    }
  });
}

function validateResourcesJson(value: unknown): asserts value is Hero["externalResources"] {
  if (!Array.isArray(value)) {
    throw new Error('Expected externalResources to be a JSON array.');
  }

  value.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Resource ${index}: each entry must be an object.`);
    }

    const row = entry as Record<string, unknown>;
    if (typeof row.title !== "string" || typeof row.url !== "string") {
      throw new Error(`Resource ${index}: require string "title" and "url".`);
    }

    if (typeof row.type !== "string" || !resourceTypeSet.has(row.type as Hero["externalResources"][number]["type"])) {
      throw new Error(
        `Resource ${index}: "type" must be one of: youtube | guide | community.`,
      );
    }
  });
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
