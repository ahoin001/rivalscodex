"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HeroGuideTabContent, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";
import {
  HERO_GUIDE_TAB_ORDER,
  heroGuideTabsSchema,
} from "@/features/heroes/hero-guide-schema";
import { migrateHeroGuideTabs } from "@/features/heroes/hero-guide-migrate";
import { countComboBlocksInTabs, sanitizeHeroGuideTabsCandidate } from "@/features/heroes/hero-guide-sanitize";
import { HeroGuideBodyEditor } from "@/features/heroes/components/hero-guide-body-editor";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { useOptionalAbilityLookup } from "@/features/heroes/components/ability-lookup-provider";
import { publishHeroGuideTabsAction } from "@/features/heroes/actions/hero-guide-editorial-actions";
import { GoToHeroLink } from "@/features/heroes/components/go-to-hero-link";
import { RivalsDisclosure } from "@/components/ui/rivals-disclosure";

const DEFAULT_TAB_LABEL: Record<HeroGuideTabId, string> = {
  overview: "Overview & Playstyle",
  abilities: "Kit & Mechanics",
  combos: "Combos",
  matchups: "Matchups",
  resources: "Resources",
  notes: "Personal Notes",
};

type HeroGuideEditorProps = {
  heroSlug: string;
  heroName: string;
  initialTabs: HeroGuideTabContent[];
  publishedTabs: HeroGuideTabContent[] | null;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  heroRoster?: HeroPortraitEntry[];
};

export function HeroGuideEditor({
  heroSlug,
  heroName,
  initialTabs,
  publishedTabs,
  abilityLookup: abilityLookupProp,
  heroRoster,
}: HeroGuideEditorProps) {
  const router = useRouter();
  const optionalAbilityLookup = useOptionalAbilityLookup();
  const abilityLookup = abilityLookupProp ?? optionalAbilityLookup;
  const [tabs, setTabs] = useState<HeroGuideTabContent[]>(() =>
    normalizeTabs(initialTabs),
  );
  const [publishedSnapshot, setPublishedSnapshot] = useState<HeroGuideTabContent[] | null>(
    publishedTabs ? normalizeTabs(publishedTabs) : null,
  );
  const [activeId, setActiveId] = useState<HeroGuideTabId>("overview");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [liveHeroHref, setLiveHeroHref] = useState<string | null>(null);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeId) ?? tabs[0],
    [tabs, activeId],
  );

  const updateActive = (patch: Partial<HeroGuideTabContent>) => {
    setTabs((current) =>
      current.map((tab) => (tab.id === activeId ? { ...tab, ...patch } : tab)),
    );
  };

  const runPublish = async () => {
    setMessage(null);
    setError(null);

    const parsed = heroGuideTabsSchema.safeParse(
      sanitizeHeroGuideTabsCandidate(normalizeTabs(tabs)),
    );
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join("; "));
      return;
    }

    setPending(true);

    const result = await publishHeroGuideTabsAction({ heroSlug, tabs: parsed.data });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setPublishedSnapshot(parsed.data);
    setLiveHeroHref(`/heroes/${heroSlug}?t=${Date.now()}`);
    router.refresh();

    const comboCount = countComboBlocksInTabs(parsed.data);

    setMessage(
      `Published — changes are live now (${comboCount} combo block${comboCount === 1 ? "" : "s"} in the Combos tab).`,
    );
  };
  const loadPublishedIntoEditor = () => {
    if (!publishedSnapshot) return;
    setTabs(normalizeTabs(publishedSnapshot));
    setMessage("Reverted to the current live version.");
    setError(null);
  };

  const publishedFingerprint = publishedSnapshot
    ? JSON.stringify(publishedSnapshot)
    : "";
  const dirtyVersusPublished =
    publishedSnapshot !== null &&
    JSON.stringify(normalizeTabs(tabs)) !== publishedFingerprint;
  const hasStructuredBody = (activeTab.body?.length ?? 0) > 0;
  const isCombosTab = activeId === "combos";

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
      <nav className="flex flex-wrap gap-2 lg:sticky lg:top-4 lg:flex-col lg:gap-1 lg:self-start">
        {HERO_GUIDE_TAB_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveId(id)}
            className={`min-w-0 rounded px-3 py-2 text-left font-display text-sm font-bold uppercase italic tracking-wide transition-colors ${
              activeId === id
                ? "bg-rivals-yellow-500 text-rivals-ink"
                : "bg-rivals-light-200 text-rivals-ink-soft hover:bg-rivals-light-300"
            }`}
          >
            <span className="block truncate">
              {tabs.find((t) => t.id === id)?.label ?? id}
            </span>
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 border-b border-rivals-light-300 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-rivals-ink-muted">
              Editing · {heroName}
            </p>
            <h2 className="font-display text-xl font-bold uppercase italic text-rivals-ink break-words">
              {activeTab.label}
            </h2>
          </div>
          <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
            <GoToHeroLink
              heroSlug={heroSlug}
              heroName={heroName}
              className="flex-1 sm:flex-none"
            />
            <button
              type="button"
              disabled={pending}
              onClick={runPublish}
              className="min-h-10 flex-1 rounded bg-rivals-yellow-500 px-4 py-2 font-display text-xs font-bold uppercase italic tracking-wide text-rivals-ink hover:bg-rivals-yellow-400 disabled:opacity-50 sm:flex-none"
            >
              {pending ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>

        {dirtyVersusPublished ? (
          <p className="rounded border border-amber-400/40 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 break-words">
            Unsaved changes — click Publish to update the live hero page.
            {publishedSnapshot ? (
              <button
                type="button"
                onClick={loadPublishedIntoEditor}
                className="ml-2 font-semibold underline underline-offset-2 hover:text-amber-900"
              >
                Revert to live
              </button>
            ) : null}
          </p>
        ) : null}
        {error ? (
          <p className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-900 break-words">
            {error}
          </p>
        ) : null}
        {message ? (
          <div
            className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950"
            role="status"
          >
            <p className="leading-relaxed break-words">{message}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
              <Link
                className="underline underline-offset-2"
                href={liveHeroHref ?? `/heroes/${heroSlug}`}
              >
                View live page
              </Link>
            </div>
          </div>
        ) : null}

        {activeId === "notes" ? (
          <p className="rounded-lg border border-rivals-light-300 bg-rivals-light-50 px-3 py-2 text-sm leading-relaxed text-rivals-ink-soft">
            Personal notes are player-owned and stored locally on the reader side. This tab is
            intentionally read-only in admin.
          </p>
        ) : (
          <div className="space-y-4">
            {isCombosTab && hasStructuredBody ? (
              <HeroGuideBodyEditor
                tabId={activeId}
                blocks={activeTab.body ?? []}
                onChange={(body) =>
                  updateActive({ body: body && body.length > 0 ? body : undefined })
                }
                abilityLookup={abilityLookup}
                heroRoster={heroRoster}
              />
            ) : null}

            <RivalsDisclosure
              title="Tab settings"
              description="Label, summary, and resource links shown on the live page"
              defaultOpen={!hasStructuredBody}
              tone="quiet"
            >
              <div className="space-y-3">
                <label className="block min-w-0 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
                    Tab label
                  </span>
                  <input
                    type="text"
                    value={activeTab.label}
                    onChange={(event) => updateActive({ label: event.currentTarget.value })}
                    className="w-full min-w-0 rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
                  />
                </label>

                <label className="block min-w-0 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
                    Summary
                  </span>
                  <textarea
                    value={activeTab.summary}
                    onChange={(event) => updateActive({ summary: event.currentTarget.value })}
                    rows={3}
                    className="w-full min-w-0 rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
                  />
                </label>

                <LinksEditor
                  links={activeTab.links ?? []}
                  onChange={(links) =>
                    updateActive({ links: links.length > 0 ? links : undefined })
                  }
                />
              </div>
            </RivalsDisclosure>

            {!isCombosTab ? (
              <RivalsDisclosure
                title="Priority & supporting cues"
                description="Two-column cue cards shown at the top of this tab on the live page"
                defaultOpen={!hasStructuredBody}
                tone="quiet"
              >
                <div className="space-y-4">
                  <BulletListEditor
                    title="Priority cues"
                    items={activeTab.primaryPoints ?? []}
                    onChange={(primaryPoints) =>
                      updateActive({
                        primaryPoints: primaryPoints.length > 0 ? primaryPoints : undefined,
                      })
                    }
                    minItems={hasStructuredBody ? 0 : 1}
                  />

                  <BulletListEditor
                    title="Supporting cues (optional)"
                    items={activeTab.secondaryPoints ?? []}
                    onChange={(secondaryPoints) =>
                      updateActive({
                        secondaryPoints:
                          secondaryPoints.length > 0 ? secondaryPoints : undefined,
                      })
                    }
                    minItems={0}
                  />
                </div>
              </RivalsDisclosure>
            ) : null}

            {!isCombosTab || !hasStructuredBody ? (
              <HeroGuideBodyEditor
                tabId={activeId}
                blocks={activeTab.body ?? []}
                onChange={(body) =>
                  updateActive({ body: body && body.length > 0 ? body : undefined })
                }
                abilityLookup={abilityLookup}
                heroRoster={heroRoster}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function BulletListEditor({
  title,
  items,
  onChange,
  minItems,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  minItems: number;
}) {
  const updateAt = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (items.length <= minItems) return;
    onChange(items.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
          {title}
        </span>
        <button
          type="button"
          onClick={() => onChange([...items, "New point"])}
          className="text-xs font-semibold uppercase tracking-wide text-rivals-yellow-700 hover:underline"
        >
          Add line
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((line, index) => (
          <li key={`${title}-${index}`} className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <textarea
              value={line}
              onChange={(event) => updateAt(index, event.currentTarget.value)}
              rows={2}
              className="min-h-[2.5rem] min-w-0 flex-1 rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              disabled={items.length <= minItems}
              className="shrink-0 rounded border border-rivals-light-300 px-2 text-xs text-rivals-ink-soft hover:bg-rivals-light-100 disabled:opacity-40"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinksEditor({
  links,
  onChange,
}: {
  links: Array<{ label: string; href: string }>;
  onChange: (links: Array<{ label: string; href: string }>) => void;
}) {
  const updateAt = (
    index: number,
    patch: Partial<{ label: string; href: string }>,
  ) => {
    const next = links.map((link, idx) => (idx === index ? { ...link, ...patch } : link));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
          Links (optional)
        </span>
        <button
          type="button"
          onClick={() => onChange([...links, { label: "Resource", href: "https://" }])}
          className="text-xs font-semibold uppercase tracking-wide text-rivals-yellow-700 hover:underline"
        >
          Add link
        </button>
      </div>
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={`link-${index}`} className="grid min-w-0 gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <input
              type="text"
              value={link.label}
              onChange={(event) => updateAt(index, { label: event.currentTarget.value })}
              placeholder="Label"
              className="min-w-0 rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
            />
            <input
              type="url"
              value={link.href}
              onChange={(event) => updateAt(index, { href: event.currentTarget.value })}
              placeholder="https://"
              className="min-w-0 rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
            />
            <button
              type="button"
              onClick={() => onChange(links.filter((_, idx) => idx !== index))}
              className="rounded border border-rivals-light-300 px-2 text-xs text-rivals-ink-soft hover:bg-rivals-light-100"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function normalizeTabs(input: HeroGuideTabContent[]): HeroGuideTabContent[] {
  const byId = new Map(migrateHeroGuideTabs(input).map((tab) => [tab.id, tab]));
  return HERO_GUIDE_TAB_ORDER.map((id) => {
    const existing = byId.get(id);
    if (existing) {
      return {
        ...existing,
        primaryPoints:
          existing.primaryPoints && existing.primaryPoints.length > 0
            ? existing.primaryPoints
            : undefined,
        secondaryPoints: existing.secondaryPoints?.length
          ? existing.secondaryPoints
          : undefined,
        links: existing.links?.length ? existing.links : undefined,
        body: existing.body?.length ? existing.body : undefined,
      };
    }
    return {
      id,
      label: DEFAULT_TAB_LABEL[id],
      summary: "Add a short summary for this tab.",
      ...(id === "notes" ? {} : { primaryPoints: ["First priority cue"] }),
    };
  });
}
