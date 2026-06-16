"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClippedButton } from "@/components/ui/clipped-button";
import { RivalsInput } from "@/components/ui/rivals-input";
import { HelpTooltip } from "@/components/ui/tooltip";
import type { HeroRole } from "@/data/schema";
import {
  normalizeMarvelSlug,
  parseMarvelOfficialAbilityDetail,
  parseMarvelOfficialForm,
  parseMarvelOfficialHeroHtml,
  splitConcatenatedAbiltiesWraps,
  titleCaseHeroName,
} from "@/lib/marvel-official-html";
import { MarvelImportFormCard } from "./marvel-import-form-card";
import {
  type MarvelImportAbility,
  type MarvelImportAbilityDetail,
  type MarvelImportFormDraft,
  toImportAbility,
} from "./marvel-import-types";

const ROLE_OPTIONS: HeroRole[] = ["Vanguard", "Duelist", "Strategist"];

type HeroHeaderState = {
  slug: string;
  role: HeroRole;
  name: string;
  realName: string;
  summary: string;
  urlFrame: string;
  urlHero: string;
  urlStack: string;
};

const emptyHeader = (initialSlug = ""): HeroHeaderState => ({
  slug: initialSlug,
  role: "Duelist",
  name: "",
  realName: "",
  summary: "",
  urlFrame: "",
  urlHero: "",
  urlStack: "",
});

const BASE_FORM_ID = "base";

export type MarvelHtmlImportPanelProps = {
  initialSlug?: string;
  lockSlug?: boolean;
  variant?: "standalone" | "embedded";
  heroName?: string;
  onApplySuccess?: () => void;
};

function baseFormDraftFor(siteFormIndex: number): MarvelImportFormDraft {
  return {
    formId: `form-${siteFormIndex + 1}`,
    label: `Form ${siteFormIndex + 1}`,
    siteFormIndex,
    isDefault: false,
    abilities: [],
    details: {},
    detailMessages: {},
    baseStatRows: [],
    pasteHtml: "",
    parseWarnings: [],
  };
}

function singleBaseDraft(): MarvelImportFormDraft {
  return {
    formId: BASE_FORM_ID,
    label: "Base",
    siteFormIndex: 0,
    isDefault: true,
    abilities: [],
    details: {},
    detailMessages: {},
    baseStatRows: [],
    pasteHtml: "",
    parseWarnings: [],
  };
}

export function MarvelHtmlImportPanel({
  initialSlug = "",
  lockSlug = false,
  variant = "standalone",
  heroName,
  onApplySuccess,
}: MarvelHtmlImportPanelProps = {}) {
  const isEmbedded = variant === "embedded";
  const [html, setHtml] = useState("");
  const [header, setHeader] = useState<HeroHeaderState>(() => emptyHeader(initialSlug));
  const [warnings, setWarnings] = useState<string[]>([]);
  const [downloadAssets, setDownloadAssets] = useState(true);
  const [forceRefreshAssets, setForceRefreshAssets] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [drafts, setDrafts] = useState<MarvelImportFormDraft[]>([singleBaseDraft()]);
  const [parsedOnce, setParsedOnce] = useState(false);

  useEffect(() => {
    if (!initialSlug) return;
    queueMicrotask(() => {
      setHeader((prev) => ({
        ...prev,
        slug: prev.slug || initialSlug,
      }));
    });
  }, [initialSlug]);

  const multiForm = drafts.length > 1;
  const heroSlug = header.slug || "hero";

  /**
   * Apply an open detail block to the first ability in `abilities` whose
   * normalized name matches. Duplicate-name rows still need a manual paste —
   * we can't disambiguate from a single open block.
   */
  const applyOpenDetail = useCallback(
    (
      abilities: MarvelImportAbility[],
      openDetail: { name: string | null; description: string | null; stats: MarvelImportAbilityDetail["stats"] } | null,
    ): { details: MarvelImportFormDraft["details"]; messages: MarvelImportFormDraft["detailMessages"] } => {
      if (!openDetail?.name) {
        return { details: {}, messages: {} };
      }
      const target = openDetail.name.trim().toLowerCase();
      const idx = abilities.findIndex(
        (a) => a.name.trim().toLowerCase() === target,
      );
      if (idx === -1) {
        return { details: {}, messages: {} };
      }
      return {
        details: {
          [idx]: {
            description: openDetail.description ?? "",
            stats: openDetail.stats,
          },
        },
        messages: {},
      };
    },
    [],
  );

  const handleParse = useCallback(() => {
    setStatus(null);
    setWarnings([]);

    const heroResult = parseMarvelOfficialHeroHtml(html);
    const formResult = parseMarvelOfficialForm(html);

    const slug =
      heroResult.suggestedSlug ||
      (heroResult.codeNameRaw
        ? normalizeMarvelSlug(heroResult.codeNameRaw)
        : "");

    setHeader((prev) => ({
      slug: lockSlug ? prev.slug.trim() || initialSlug || slug : slug,
      role: heroResult.role ?? "Duelist",
      name:
        heroResult.name ??
        (heroResult.codeNameRaw
          ? titleCaseHeroName(heroResult.codeNameRaw)
          : ""),
      realName: heroResult.realName ?? "",
      summary: heroResult.intro ?? "",
      urlFrame: heroResult.urls.frame ?? "",
      urlHero: heroResult.urls.heroImage ?? "",
      urlStack: heroResult.urls.stackLogo ?? "",
    }));

    const parsedAbilities = formResult.abilities.map(toImportAbility);
    const openDetailRollup = applyOpenDetail(parsedAbilities, formResult.openDetail);

    if (formResult.availableForms.length === 0) {
      // Single-form hero — keep the legacy 'base' form.
      const draft: MarvelImportFormDraft = {
        ...singleBaseDraft(),
        pasteHtml: html,
        abilities: parsedAbilities,
        details: openDetailRollup.details,
        detailMessages: openDetailRollup.messages,
        baseStatRows: formResult.baseStats?.stats ?? [],
        parseWarnings: formResult.warnings,
      };
      setDrafts([draft]);
    } else {
      // Multi-form hero: produce one draft per `.xt-wrap > a`. The active form
      // already has its abilities parsed; the rest are empty placeholders.
      const activeIndex = formResult.siteFormIndex ?? 0;
      const sorted = [...formResult.availableForms].sort(
        (a, b) => a.siteFormIndex - b.siteFormIndex,
      );
      const nextDrafts: MarvelImportFormDraft[] = sorted.map((available) => {
        const isActive = available.siteFormIndex === activeIndex;
        const draft: MarvelImportFormDraft = {
          ...baseFormDraftFor(available.siteFormIndex),
          portraitUrl: available.portraitUrl ?? undefined,
          isDefault: isActive,
        };
        if (isActive) {
          draft.pasteHtml = html;
          draft.abilities = parsedAbilities;
          draft.details = openDetailRollup.details;
          draft.detailMessages = openDetailRollup.messages;
          draft.baseStatRows = formResult.baseStats?.stats ?? [];
          draft.parseWarnings = formResult.warnings;
        }
        return draft;
      });
      setDrafts(nextDrafts);
    }

    const combinedWarnings = [...heroResult.warnings, ...formResult.warnings];
    if (formResult.hasConcatenatedForms) {
      combinedWarnings.push(
        `Detected ${
          splitConcatenatedAbiltiesWraps(html).length
        } .abilties-wrap blocks in the master paste. Only the first form was parsed — paste the other forms' markup into their cards below.`,
      );
    }
    setWarnings(combinedWarnings);
    setParsedOnce(true);
  }, [html, applyOpenDetail, initialSlug, lockSlug]);

  const updateDraft = useCallback(
    (draftIndex: number, patch: Partial<MarvelImportFormDraft>) => {
      setDrafts((prev) =>
        prev.map((draft, i) => (i === draftIndex ? { ...draft, ...patch } : draft)),
      );
    },
    [],
  );

  const handlePasteHtmlChange = useCallback(
    (draftIndex: number, value: string) => {
      updateDraft(draftIndex, { pasteHtml: value });
    },
    [updateDraft],
  );

  const handleParseForm = useCallback(
    (draftIndex: number) => {
      setDrafts((prev) =>
        prev.map((draft, i) => {
          if (i !== draftIndex) return draft;
          const result = parseMarvelOfficialForm(draft.pasteHtml);
          const parsedAbilities = result.abilities.map(toImportAbility);
          const rollup = applyOpenDetail(parsedAbilities, result.openDetail);
          const warningsForCard = result.warnings.slice();
          if (result.hasConcatenatedForms) {
            warningsForCard.push(
              `This paste contains ${
                splitConcatenatedAbiltiesWraps(draft.pasteHtml).length
              } .abilties-wrap blocks. Only the first was parsed — split forms into separate cards.`,
            );
          }
          return {
            ...draft,
            // Keep the existing siteFormIndex but adopt the parsed result's
            // values when they're more specific.
            siteFormIndex:
              result.siteFormIndex !== null
                ? result.siteFormIndex
                : draft.siteFormIndex,
            portraitUrl: result.formPortrait ?? draft.portraitUrl,
            abilities: parsedAbilities,
            details: rollup.details,
            detailMessages: rollup.messages,
            baseStatRows: result.baseStats?.stats ?? [],
            parseWarnings: warningsForCard,
          };
        }),
      );
    },
    [applyOpenDetail],
  );

  const handleLabelChange = useCallback(
    (draftIndex: number, value: string) => {
      updateDraft(draftIndex, { label: value });
    },
    [updateDraft],
  );

  const handleShortLabelChange = useCallback(
    (draftIndex: number, value: string) => {
      const trimmed = value.trim();
      updateDraft(draftIndex, { shortLabel: trimmed.length > 0 ? value : undefined });
    },
    [updateDraft],
  );

  const handleIsDefaultChange = useCallback((draftIndex: number) => {
    setDrafts((prev) =>
      prev.map((draft, i) => ({ ...draft, isDefault: i === draftIndex })),
    );
  }, []);

  const handleAbilityChange = useCallback(
    (draftIndex: number, abilityIndex: number, patch: Partial<MarvelImportAbility>) => {
      setDrafts((prev) =>
        prev.map((draft, i) =>
          i === draftIndex
            ? {
                ...draft,
                abilities: draft.abilities.map((ability, j) =>
                  j === abilityIndex ? { ...ability, ...patch } : ability,
                ),
              }
            : draft,
        ),
      );
    },
    [],
  );

  const handleParseDetail = useCallback(
    (draftIndex: number, abilityIndex: number, detailHtml: string) => {
      const parsed = parseMarvelOfficialAbilityDetail(detailHtml);
      const merged: MarvelImportAbilityDetail = {
        description: parsed.description ?? "",
        stats: parsed.stats,
      };
      setDrafts((prev) =>
        prev.map((draft, i) =>
          i === draftIndex
            ? {
                ...draft,
                details: { ...draft.details, [abilityIndex]: merged },
                detailMessages: {
                  ...draft.detailMessages,
                  [abilityIndex]:
                    parsed.warnings.length > 0
                      ? parsed.warnings.join(" ")
                      : `Parsed ${parsed.stats.length} stat rows.`,
                },
              }
            : draft,
        ),
      );
    },
    [],
  );

  const handleClearDetail = useCallback(
    (draftIndex: number, abilityIndex: number) => {
      setDrafts((prev) =>
        prev.map((draft, i) => {
          if (i !== draftIndex) return draft;
          const details = { ...draft.details };
          const messages = { ...draft.detailMessages };
          delete details[abilityIndex];
          delete messages[abilityIndex];
          return { ...draft, details, detailMessages: messages };
        }),
      );
    },
    [],
  );

  const totalsAcrossForms = useMemo(() => {
    let total = 0;
    let captured = 0;
    for (const draft of drafts) {
      total += draft.abilities.length;
      for (let i = 0; i < draft.abilities.length; i++) {
        const detail = draft.details[i];
        if (detail && (detail.description || detail.stats.length > 0)) {
          captured += 1;
        }
      }
    }
    return { total, captured };
  }, [drafts]);

  const draftsReady = drafts.every((d) => d.abilities.length > 0);
  const defaultCount = drafts.filter((d) => d.isDefault).length;

  const handleApply = useCallback(async () => {
    setStatus(null);
    setPending(true);

    try {
      const useFormsPath =
        drafts.length > 1 ||
        (drafts.length === 1 && drafts[0].formId !== BASE_FORM_ID);

      const baseBody = {
        action: "apply-skeleton" as const,
        slug: header.slug.trim(),
        role: header.role,
        name: header.name.trim(),
        realName: header.realName.trim() || undefined,
        summary: header.summary.trim(),
        downloadAssets,
        forceRefreshAssets: downloadAssets ? forceRefreshAssets : false,
        urls: {
          frame: header.urlFrame.trim() || undefined,
          heroImage: header.urlHero.trim() || undefined,
          stackLogo: header.urlStack.trim() || undefined,
        },
      };

      const mapAbilities = (draft: MarvelImportFormDraft) =>
        draft.abilities.map((ability, abilityIndex) => {
          const detail = draft.details[abilityIndex];
          return {
            name: ability.name,
            category: ability.category,
            keybind: ability.keybind ?? undefined,
            keybindText: ability.keybindText ?? undefined,
            keybindIconUrl: ability.keybindIconUrl ?? undefined,
            iconUrl: ability.iconUrl ?? undefined,
            siteOrder: ability.siteOrder ?? undefined,
            siteFormIndex: draft.siteFormIndex,
            ...(detail?.description?.trim()
              ? { description: detail.description.trim() }
              : {}),
            ...(detail?.stats?.length ? { stats: detail.stats } : {}),
          };
        });

      const body = useFormsPath
        ? {
            ...baseBody,
            // Top-level abilities still required by the schema; mirror the
            // default form to satisfy it without writing twice.
            abilities: mapAbilities(
              drafts.find((d) => d.isDefault) ?? drafts[0],
            ),
            forms: drafts.map((draft) => ({
              formId: draft.formId,
              label: draft.label.trim() || `Form ${draft.siteFormIndex + 1}`,
              shortLabel: draft.shortLabel?.trim() || undefined,
              siteFormIndex: draft.siteFormIndex,
              isDefault: draft.isDefault,
              portraitUrl: draft.portraitUrl,
              ...(draft.baseStatRows.length > 0
                ? { baseStatRows: draft.baseStatRows }
                : {}),
              abilities: mapAbilities(draft),
            })),
          }
        : {
            ...baseBody,
            abilities: mapAbilities(drafts[0]),
            ...(drafts[0].baseStatRows.length > 0
              ? { baseStatRows: drafts[0].baseStatRows }
              : {}),
          };

      const response = await fetch("/api/dev/marvel-site-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        writtenFiles?: string[];
        refreshedFiles?: string[];
        skippedFilesCount?: number;
        created?: boolean;
        formsCount?: number;
        abilitiesCount?: number;
        abilityDetailsCount?: number;
        supabase?: { status: string; error?: string };
        warnings?: string[];
      };

      if (!response.ok) {
        setStatus({
          ok: false,
          message: data.error ?? `Request failed (${response.status}).`,
        });
        return;
      }

      const formsNote =
        typeof data.formsCount === "number" && data.formsCount > 0
          ? ` Forms: ${data.formsCount}.`
          : "";
      const writtenCount = data.writtenFiles?.length ?? 0;
      const refreshedCount = data.refreshedFiles?.length ?? 0;
      const skippedCount = data.skippedFilesCount ?? 0;
      const fileNote =
        writtenCount > 0
          ? ` Wrote ${writtenCount} file(s).`
          : refreshedCount > 0
          ? ` Refreshed ${refreshedCount} file(s).`
          : skippedCount > 0
          ? ` ${skippedCount} file(s) cached (unchanged).`
          : data.writtenFiles
          ? " No new files (cached)."
          : "";
      const abilitiesNote =
        typeof data.abilitiesCount === "number"
          ? ` Abilities: ${data.abilitiesCount}` +
            (typeof data.abilityDetailsCount === "number"
              ? ` (${data.abilityDetailsCount} with detail).`
              : ".")
          : "";
      const supabaseNote =
        data.supabase?.status === "error"
          ? ` Supabase: ${data.supabase.error}`
          : data.supabase?.status === "ok"
          ? " Supabase ok."
          : "";

      setStatus({
        ok: true,
        message: `${data.created ? "Created hero." : "Updated hero."}${formsNote}${abilitiesNote}${fileNote}${supabaseNote}`,
      });

      if (data.warnings?.length) {
        setWarnings((prev) => [...prev, ...data.warnings!]);
      }

      onApplySuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Apply failed.";
      setStatus({ ok: false, message });
    } finally {
      setPending(false);
    }
  }, [
    drafts,
    downloadAssets,
    forceRefreshAssets,
    header,
    onApplySuccess,
  ]);

  const copyParsedJson = useCallback(() => {
    void navigator.clipboard.writeText(
      JSON.stringify(
        {
          slug: header.slug,
          role: header.role,
          name: header.name,
          realName: header.realName || undefined,
          summary: header.summary,
          urls: {
            frame: header.urlFrame || null,
            heroImage: header.urlHero || null,
            stackLogo: header.urlStack || null,
          },
          forms: drafts.map((draft) => ({
            formId: draft.formId,
            label: draft.label,
            shortLabel: draft.shortLabel,
            siteFormIndex: draft.siteFormIndex,
            isDefault: draft.isDefault,
            portraitUrl: draft.portraitUrl,
            baseStatRows: draft.baseStatRows,
            abilities: draft.abilities.map((ability, index) => ({
              ...ability,
              detail: draft.details[index],
            })),
          })),
        },
        null,
        2,
      ),
    );
    setStatus({ ok: true, message: "Copied JSON to clipboard." });
  }, [drafts, header]);

  return (
    <div className={`relative ${isEmbedded ? "space-y-5" : "space-y-8"} ${pending ? "codex-resync-pending" : ""}`}>
      {isEmbedded ? (
        <div className="tab-enter flex flex-wrap items-center gap-3 border-b border-brand-gold/25 pb-3">
          <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.2em] text-brand-gold">
            Codex resync
          </p>
          {heroName ? (
            <span className="text-xs text-muted-foreground">{heroName}</span>
          ) : null}
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
            Paste → Parse → Apply
          </span>
        </div>
      ) : null}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
          <span>Paste hero HTML from marvelrivals.com</span>
          <HelpTooltip
            content={
              <>
                Open the hero&apos;s official page on{" "}
                <span className="font-mono">marvelrivals.com</span>, copy the
                surrounding HTML, and paste it here. The parser fills in the hero
                header AND populates the first form card below. For multi-form
                heroes (Magik, Bruce Banner, Jeff, etc.) the additional form cards
                start empty — click the form&apos;s circular tab on the site, copy its{" "}
                <span className="font-mono">.abilties-wrap</span> block, and paste
                it into its card.
              </>
            }
          />
        </label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full resize-y border border-brand-gold/35 bg-background/80 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-brand-gold"
          placeholder="<div class=&quot;hero-nick&quot;>...</div>"
        />
        <div className="flex flex-wrap gap-2">
          <ClippedButton type="button" tone="brand" onClick={handleParse}>
            Parse HTML
          </ClippedButton>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded border border-brand-gold/40 bg-brand-gold-muted/40 px-3 py-2 text-sm text-brand-gold">
          <p className="text-[11px] font-semibold uppercase tracking-wide">Parse notes</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {warnings.map((warning, i) => (
              <li key={`${warning}-${i}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gold">
          Preview — edit before apply
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              Slug
              <HelpTooltip content="Lowercase, hyphen-separated identifier. Used as the codex primary key and as the folder name under public/rivals-assets/heros/<slug>/. Must match ^[a-z0-9-]+$." />
            </span>
            <RivalsInput
              value={header.slug}
              onChange={(e) => setHeader((f) => ({ ...f, slug: e.target.value }))}
              placeholder="gambit"
              autoComplete="off"
              readOnly={lockSlug}
              disabled={lockSlug}
              className={lockSlug ? "opacity-80" : undefined}
            />
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              Role
              <HelpTooltip content="Vanguard, Duelist, or Strategist. Drives detail-page styling and gallery filter behavior." />
            </span>
            <select
              value={header.role}
              onChange={(e) =>
                setHeader((f) => ({ ...f, role: e.target.value as HeroRole }))
              }
              className="w-full border border-brand-gold/45 bg-[#111523]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Hero name (display)
            <HelpTooltip content="Title-cased display name shown across the app (gallery cards, dossier headers, abilities section). Edit if the parser miscapitalized." />
          </span>
          <RivalsInput
            value={header.name}
            onChange={(e) => setHeader((f) => ({ ...f, name: e.target.value }))}
          />
        </label>

        <label className="block space-y-1">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Real name
            <HelpTooltip content="Optional civilian identity from the official site (e.g. Adam Warlock / 'Him'). Leave blank if the site doesn't list one." />
          </span>
          <RivalsInput
            value={header.realName}
            onChange={(e) => setHeader((f) => ({ ...f, realName: e.target.value }))}
          />
        </label>

        <label className="block space-y-1">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Summary / intro
            <HelpTooltip content="The hero's official short-form bio. Renders on the gallery cards and the detail dossier. Trim aggressively — anything past ~2 sentences looks bloated in the card grid." />
          </span>
          <textarea
            value={header.summary}
            onChange={(e) => setHeader((f) => ({ ...f, summary: e.target.value }))}
            rows={5}
            className="w-full resize-y border border-brand-gold/45 bg-[#111523]/90 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold"
          />
        </label>

        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          Image URLs
          <HelpTooltip
            content={
              <>
                Marvel CDN URLs that the importer will download when &quot;Download images&quot;
                is checked. The frame is the gold border, the hero art is the full-body
                portrait, and the stack logo is the wide wordmark used in headers.
                Files land at{" "}
                <span className="font-mono">
                  public/rivals-assets/heros/&lt;slug&gt;/&lt;slug&gt;-(frame|.png|stack-logo).png
                </span>
                .
              </>
            }
          />
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Frame (.jyImg first img)</span>
          <RivalsInput
            value={header.urlFrame}
            onChange={(e) => setHeader((f) => ({ ...f, urlFrame: e.target.value }))}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Hero art (.jyImg second img)</span>
          <RivalsInput
            value={header.urlHero}
            onChange={(e) => setHeader((f) => ({ ...f, urlHero: e.target.value }))}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Stack logo (.icon-hz)</span>
          <RivalsInput
            value={header.urlStack}
            onChange={(e) => setHeader((f) => ({ ...f, urlStack: e.target.value }))}
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={downloadAssets}
            onChange={(e) => setDownloadAssets(e.target.checked)}
            className="accent-brand-gold"
          />
          <span className="flex items-center gap-1.5">
            Download images into{" "}
            <code className="font-mono text-[11px]">public/rivals-assets/heros/&lt;slug&gt;/</code>{" "}
            and ability icons under{" "}
            <code className="font-mono text-[11px]">.../icons/</code>
            <HelpTooltip content="Disable only when the files are already on disk and you just want to refresh the codex row. Files that already exist are reused unless Replace existing images is checked." />
          </span>
        </label>

        <label
          className={`flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-opacity duration-200 ${
            downloadAssets ? "opacity-100" : "pointer-events-none opacity-40"
          }`}
        >
          <input
            type="checkbox"
            checked={forceRefreshAssets}
            onChange={(e) => setForceRefreshAssets(e.target.checked)}
            disabled={!downloadAssets}
            className="accent-brand-gold"
          />
          <span className="flex items-center gap-1.5">
            Replace existing images
            <HelpTooltip content="When checked, overwrites PNGs already on disk — use after a game patch updates hero art or ability icons." />
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <ClippedButton
            type="button"
            tone="brand"
            onClick={handleApply}
            disabled={
              pending ||
              !header.slug.trim() ||
              !header.summary.trim() ||
              !draftsReady ||
              (multiForm && defaultCount !== 1)
            }
          >
            {pending ? "Applying…" : multiForm ? `Apply (${drafts.length} forms)` : "Apply"}
          </ClippedButton>
          <HelpTooltip
            content={
              <>
                Single action: downloads any missing images, writes / updates the{" "}
                <span className="font-mono">hero_codex</span> row plus its{" "}
                <span className="font-mono">hero_form</span>,{" "}
                <span className="font-mono">hero_ability</span>, and{" "}
                <span className="font-mono">hero_asset</span> children, and
                revalidates the cache. Every captured ability detail across every
                form is included automatically.
              </>
            }
          />
          <ClippedButton type="button" tone="brand" onClick={copyParsedJson}>
            Copy JSON
          </ClippedButton>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {totalsAcrossForms.captured}/{totalsAcrossForms.total} abilities with detail
            {multiForm ? ` · ${drafts.length} forms` : ""}
          </span>
        </div>

        {status ? (
          <p
            className={`tab-enter text-sm ${status.ok ? "text-strategist" : "text-duelist"}`}
            role="status"
          >
            {status.message}
          </p>
        ) : null}

        <div className={`space-y-4 ${parsedOnce ? "codex-resync-stagger" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-gold">
              Forms
              <HelpTooltip
                content={
                  <>
                    Single-form heroes render exactly one card (
                    <span className="font-mono">Base</span>). Multi-form heroes
                    surface one card per{" "}
                    <span className="font-mono">.xt-wrap &gt; a</span> tab — the
                    parser auto-creates placeholders for the forms you haven&apos;t
                    pasted yet so you know what&apos;s missing.
                  </>
                }
              />
            </p>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {drafts.length} card{drafts.length === 1 ? "" : "s"}
            </span>
          </div>
          {drafts.map((draft, index) => (
            <div
              key={`${draft.formId}-${draft.siteFormIndex}`}
              className="codex-resync-form-card"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <MarvelImportFormCard
                draftIndex={index}
                draft={draft}
                heroSlug={heroSlug}
                multiForm={multiForm}
                onPasteHtmlChange={handlePasteHtmlChange}
                onParseForm={handleParseForm}
                onLabelChange={handleLabelChange}
                onShortLabelChange={handleShortLabelChange}
                onIsDefaultChange={handleIsDefaultChange}
                onAbilityChange={handleAbilityChange}
                onParseDetail={handleParseDetail}
                onClearDetail={handleClearDetail}
              />
            </div>
          ))}
        </div>

        {!isEmbedded ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Dev-only: a single <code className="font-mono text-[11px]">POST /api/dev/marvel-site-import</code>{" "}
          upserts the hero into <code className="font-mono text-[11px]">app_rivalscodex_v1.hero_codex</code>{" "}
          (plus its normalized <code className="font-mono text-[11px]">hero_form</code>,{" "}
          <code className="font-mono text-[11px]">hero_ability</code>, and{" "}
          <code className="font-mono text-[11px]">hero_asset</code> children) and writes any new
          images into <code className="font-mono text-[11px]">public/rivals-assets/</code>. The
          codex is the only runtime source of truth — there is no separate asset-sync step.
        </p>
        ) : null}
      </div>
    </div>
  );
}
