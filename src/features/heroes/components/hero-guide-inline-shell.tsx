"use client";

import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { AbilityLookupProvider } from "@/features/heroes/components/ability-lookup-provider";
import { HeroGuideEditProvider } from "@/features/heroes/context/hero-guide-edit-context";
import { useHeroGuideEdit } from "@/features/heroes/hooks/use-hero-guide-edit";
import { HeroGuideConsole } from "@/features/heroes/components/hero-guide-console";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { inlineCombosEditEnabled, inlineGuideEditEnabled } from "@/lib/guide-edit-policy";

type HeroGuideInlineShellProps = {
  heroSlug: string;
  heroId: string;
  heroName: string;
  stackLogoUrl?: string;
  guideTabs: HeroGuideTabContent[];
  /** False when dossier fallback is used instead of Supabase editorial. */
  editorialLoaded?: boolean;
  abilityEntries: [string, ResolvedAbilityRef][];
  heroPortraits?: HeroPortraitEntry[];
  defaultTabId?: "overview" | "combos";
  /** From server env — avoids client bundle env mismatch during hydration. */
  supabaseEnabled: boolean;
  /** When set, shows “Open full tab editor” in the guide header. */
  fullTabEditorHref?: string | null;
};

function SaveStatusPill({
  status,
  error,
  hasUnsavedChanges,
}: {
  status: ReturnType<typeof useHeroGuideEdit>["saveStatus"];
  error: string | null;
  hasUnsavedChanges: boolean;
}) {
  if (status === "idle" && !hasUnsavedChanges) return null;

  const label =
    status === "saving"
      ? "Publishing…"
      : hasUnsavedChanges && status !== "error"
        ? "Unsaved changes"
        : status === "saved"
          ? "Published"
          : status === "local"
            ? "Saved locally"
            : "Publish failed";

  const tone =
    status === "error"
      ? "border-rose-400/50 bg-rose-950/90 text-rose-100"
      : hasUnsavedChanges && status !== "saving"
        ? "border-amber-400/45 bg-amber-950/90 text-amber-100"
        : status === "local"
          ? "border-amber-400/40 bg-amber-950/90 text-amber-100"
          : "border-brand-gold/45 bg-rivals-ink/92 text-brand-gold";

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex max-w-xs flex-col gap-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide shadow-lg ${tone}`}
      role="status"
    >
      <span>{label}</span>
      {status === "error" && error ? (
        <span className="text-[10px] font-normal normal-case tracking-normal text-rose-200/90">
          {error}
        </span>
      ) : null}
      {status === "local" ? (
        <span className="text-[10px] font-normal normal-case tracking-normal text-amber-200/80">
          Enable Supabase to sync across devices.
        </span>
      ) : null}
    </div>
  );
}

function InlineGuideInner({
  heroSlug,
  heroId,
  heroName,
  stackLogoUrl,
  guideTabs,
  editorialLoaded = true,
  heroPortraits,
  defaultTabId,
  supabaseEnabled,
  fullTabEditorHref = null,
}: Omit<HeroGuideInlineShellProps, "abilityEntries">) {
  const edit = useHeroGuideEdit({
    heroSlug,
    initialTabs: guideTabs,
    supabaseEnabled,
  });

  return (
    <HeroGuideEditProvider value={edit}>
      <SaveStatusPill
        status={edit.saveStatus}
        error={edit.saveError}
        hasUnsavedChanges={edit.hasUnsavedChanges}
      />
      {!supabaseEnabled ? (
        <p className="mx-auto mb-3 max-w-[min(100%,1680px)] px-5 text-center text-xs text-amber-800 sm:px-8">
          Guide edits save to this browser only until Supabase is enabled.
        </p>
      ) : null}
      {supabaseEnabled && !editorialLoaded ? (
        <p className="mx-auto mb-3 max-w-[min(100%,1680px)] rounded border border-amber-400/40 bg-amber-50 px-5 py-2 text-center text-xs text-amber-950 sm:px-8">
          Showing dossier fallback — published editorial did not load or failed validation.
          Publish from admin or check server logs.
        </p>
      ) : null}
      <HeroGuideConsole
        heroId={heroId}
        heroName={heroName}
        stackLogoUrl={stackLogoUrl}
        tabs={edit.tabs}
        defaultTabId={defaultTabId}
        heroPortraits={heroPortraits}
        fullTabEditorHref={fullTabEditorHref}
        className="hero-stage-shell hero-stage-guide"
      />
    </HeroGuideEditProvider>
  );
}

export function HeroGuideInlineShell(props: HeroGuideInlineShellProps) {
  const { abilityEntries, ...rest } = props;

  if (!inlineGuideEditEnabled() || !inlineCombosEditEnabled()) {
    return (
      <AbilityLookupProvider entries={abilityEntries}>
        <HeroGuideConsole
          heroId={rest.heroId}
          heroName={rest.heroName}
          stackLogoUrl={rest.stackLogoUrl}
          tabs={rest.guideTabs}
          defaultTabId={rest.defaultTabId}
          heroPortraits={rest.heroPortraits}
          fullTabEditorHref={rest.fullTabEditorHref}
          className="hero-stage-shell hero-stage-guide"
        />
      </AbilityLookupProvider>
    );
  }

  return (
    <AbilityLookupProvider entries={abilityEntries}>
      <InlineGuideInner {...rest} />
    </AbilityLookupProvider>
  );
}
