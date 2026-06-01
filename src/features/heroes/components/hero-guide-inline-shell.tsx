"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { AbilityLookupProvider } from "@/features/heroes/components/ability-lookup-provider";
import { HeroGuideEditProvider } from "@/features/heroes/context/hero-guide-edit-context";
import { useHeroGuideEdit } from "@/features/heroes/hooks/use-hero-guide-edit";
import { HeroGuideConsole } from "@/features/heroes/components/hero-guide-console";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { inlineGuideEditEnabled } from "@/lib/guide-edit-policy";

type HeroGuideInlineShellProps = {
  heroSlug: string;
  heroName: string;
  stackLogoUrl?: string;
  guideTabs: HeroGuideTabContent[];
  abilityEntries: [string, ResolvedAbilityRef][];
  heroPortraits?: HeroPortraitEntry[];
  defaultTabId?: "overview" | "combos";
  /** From server env — avoids client bundle env mismatch during hydration. */
  supabaseEnabled: boolean;
};

function SaveStatusPill({
  status,
  error,
}: {
  status: ReturnType<typeof useHeroGuideEdit>["saveStatus"];
  error: string | null;
}) {
  if (status === "idle") return null;

  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "local"
          ? "Saved locally"
          : "Save failed";

  const tone =
    status === "error"
      ? "border-rose-400/50 bg-rose-950/90 text-rose-100"
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
  heroName,
  stackLogoUrl,
  guideTabs,
  heroPortraits,
  defaultTabId,
  supabaseEnabled,
}: Omit<HeroGuideInlineShellProps, "abilityEntries">) {
  const edit = useHeroGuideEdit({
    heroSlug,
    initialTabs: guideTabs,
    supabaseEnabled,
  });

  return (
    <HeroGuideEditProvider value={edit}>
      <SaveStatusPill status={edit.saveStatus} error={edit.saveError} />
      {!supabaseEnabled ? (
        <p className="mx-auto mb-3 max-w-[min(100%,1680px)] px-5 text-center text-xs text-amber-800 sm:px-8">
          Guide edits save to this browser only until Supabase is enabled.
        </p>
      ) : null}
      <HeroGuideConsole
        heroName={heroName}
        stackLogoUrl={stackLogoUrl}
        tabs={edit.tabs}
        defaultTabId={defaultTabId}
        heroPortraits={heroPortraits}
        inlineEdit
      />
      {supabaseEnabled ? (
        <p className="mt-3 text-center text-[11px] text-rivals-ink-soft">
          <Link
            href={`/admin/guides/${heroSlug}`}
            className="underline decoration-rivals-ink/20 underline-offset-2 hover:text-rivals-ink"
          >
            Open full tab editor
          </Link>
        </p>
      ) : null}
    </HeroGuideEditProvider>
  );
}

export function HeroGuideInlineShell(props: HeroGuideInlineShellProps) {
  const { abilityEntries, ...rest } = props;

  if (!inlineGuideEditEnabled()) {
    return (
      <AbilityLookupProvider entries={abilityEntries}>
        <HeroGuideConsole
          heroName={rest.heroName}
          stackLogoUrl={rest.stackLogoUrl}
          tabs={rest.guideTabs}
          defaultTabId={rest.defaultTabId}
          heroPortraits={rest.heroPortraits}
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
