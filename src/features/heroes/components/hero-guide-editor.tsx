"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { HeroGuideTabContent, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";
import {
  HERO_GUIDE_TAB_ORDER,
  heroGuideTabsSchema,
} from "@/features/heroes/hero-guide-schema";
import { HeroGuideBodyEditor } from "@/features/heroes/components/hero-guide-body-editor";
import {
  publishHeroGuideTabsAction,
  saveHeroGuideDraftAction,
} from "@/features/heroes/actions/hero-guide-editorial-actions";

const DEFAULT_TAB_LABEL: Record<HeroGuideTabId, string> = {
  overview: "Overview",
  abilities: "Abilities",
  combos: "Combos & Synergies",
  playstyle: "Playstyle Guide",
  resources: "Resources",
  notes: "Personal Notes",
};

type HeroGuideEditorProps = {
  heroSlug: string;
  heroName: string;
  initialTabs: HeroGuideTabContent[];
  publishedTabs: HeroGuideTabContent[] | null;
};

export function HeroGuideEditor({
  heroSlug,
  heroName,
  initialTabs,
  publishedTabs,
}: HeroGuideEditorProps) {
  const [tabs, setTabs] = useState<HeroGuideTabContent[]>(() =>
    normalizeTabs(initialTabs),
  );
  const [activeId, setActiveId] = useState<HeroGuideTabId>("overview");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"draft" | "publish" | null>(null);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeId) ?? tabs[0],
    [tabs, activeId],
  );

  const updateActive = (patch: Partial<HeroGuideTabContent>) => {
    setTabs((current) =>
      current.map((tab) => (tab.id === activeId ? { ...tab, ...patch } : tab)),
    );
  };

  const runSubmit = async (scope: "draft" | "published") => {
    setMessage(null);
    setError(null);

    const parsed = heroGuideTabsSchema.safeParse(normalizeTabs(tabs));
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join("; "));
      return;
    }

    setPending(scope === "draft" ? "draft" : "publish");

    const result =
      scope === "draft"
        ? await saveHeroGuideDraftAction({ heroSlug, tabs: parsed.data })
        : await publishHeroGuideTabsAction({ heroSlug, tabs: parsed.data });

    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(
      scope === "draft"
        ? "Draft saved. Preview on the hero page with ?preview=draft while signed in."
        : "Published. Live site will show this guide for readers.",
    );
  };

  const publishedFingerprint = publishedTabs
    ? JSON.stringify(normalizeTabs(publishedTabs))
    : "";
  const dirtyVersusPublished =
    publishedTabs !== null &&
    JSON.stringify(normalizeTabs(tabs)) !== publishedFingerprint;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {HERO_GUIDE_TAB_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveId(id)}
            className={`rounded px-3 py-2 text-left font-display text-sm font-bold uppercase italic tracking-wide transition-colors ${
              activeId === id
                ? "bg-rivals-yellow-500 text-rivals-ink"
                : "bg-rivals-light-200 text-rivals-ink-soft hover:bg-rivals-light-300"
            }`}
          >
            {tabs.find((t) => t.id === id)?.label ?? id}
          </button>
        ))}
      </nav>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rivals-light-300 pb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-rivals-ink-muted">
              Editing · {heroName}
            </p>
            <h2 className="font-display text-xl font-bold uppercase italic text-rivals-ink">
              {activeTab.label}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => runSubmit("draft")}
              className="rounded border border-rivals-ink/25 bg-white px-4 py-2 font-display text-xs font-bold uppercase italic tracking-wide text-rivals-ink hover:bg-rivals-light-100 disabled:opacity-50"
            >
              {pending === "draft" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => runSubmit("published")}
              className="rounded bg-rivals-yellow-500 px-4 py-2 font-display text-xs font-bold uppercase italic tracking-wide text-rivals-ink hover:bg-rivals-yellow-400 disabled:opacity-50"
            >
              {pending === "publish" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>

        {dirtyVersusPublished ? (
          <p className="rounded border border-amber-400/40 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Unpublished changes vs last published version.
          </p>
        ) : null}

        {error ? (
          <p className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            {message}{" "}
            <Link className="underline" href={`/heroes/${heroSlug}?preview=draft`}>
              Preview draft
            </Link>
            {" · "}
            <Link className="underline" href={`/heroes/${heroSlug}`}>
              Live page
            </Link>
          </p>
        ) : null}

        <p className="text-xs text-rivals-ink-muted">
          Concurrent edits: the latest successful save overwrites the previous draft for this hero
          (last write wins).
        </p>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
            Tab label
          </span>
          <input
            type="text"
            value={activeTab.label}
            onChange={(event) => updateActive({ label: event.currentTarget.value })}
            className="w-full rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
            Summary
          </span>
          <textarea
            value={activeTab.summary}
            onChange={(event) => updateActive({ summary: event.currentTarget.value })}
            rows={4}
            className="w-full rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
          />
        </label>

        {(activeTab.body?.length ?? 0) > 0 ? (
          <p className="rounded border border-cyan-500/30 bg-cyan-50/90 px-3 py-2 text-xs text-cyan-950">
            Structured body is active: readers see body blocks instead of priority/secondary cue
            columns for this tab.
          </p>
        ) : null}

        <BulletListEditor
          title="Priority cues"
          items={activeTab.primaryPoints ?? []}
          onChange={(primaryPoints) =>
            updateActive({
              primaryPoints: primaryPoints.length > 0 ? primaryPoints : undefined,
            })
          }
          minItems={(activeTab.body?.length ?? 0) > 0 ? 0 : 1}
        />

        <BulletListEditor
          title="Secondary cues (optional)"
          items={activeTab.secondaryPoints ?? []}
          onChange={(secondaryPoints) =>
            updateActive({
              secondaryPoints: secondaryPoints.length > 0 ? secondaryPoints : undefined,
            })
          }
          minItems={0}
        />

        <HeroGuideBodyEditor
          blocks={activeTab.body ?? []}
          onChange={(body) =>
            updateActive({ body: body && body.length > 0 ? body : undefined })
          }
        />

        <LinksEditor
          links={activeTab.links ?? []}
          onChange={(links) => updateActive({ links: links.length > 0 ? links : undefined })}
        />
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
          <li key={`${title}-${index}`} className="flex gap-2">
            <textarea
              value={line}
              onChange={(event) => updateAt(index, event.currentTarget.value)}
              rows={2}
              className="min-h-[2.5rem] flex-1 rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
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
          <li key={`link-${index}`} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <input
              type="text"
              value={link.label}
              onChange={(event) => updateAt(index, { label: event.currentTarget.value })}
              placeholder="Label"
              className="rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
            />
            <input
              type="url"
              value={link.href}
              onChange={(event) => updateAt(index, { href: event.currentTarget.value })}
              placeholder="https://"
              className="rounded border border-rivals-light-300 px-3 py-2 text-sm text-rivals-ink"
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
  const byId = new Map(input.map((tab) => [tab.id, tab]));
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
      primaryPoints: ["First priority cue"],
    };
  });
}
