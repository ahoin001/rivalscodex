"use client";

import { useMemo } from "react";
import { ClippedButton } from "@/components/ui/clipped-button";
import { RivalsInput } from "@/components/ui/rivals-input";
import { HelpTooltip } from "@/components/ui/tooltip";
import { MarvelAbilitySkeletonList } from "./marvel-ability-skeleton-list";
import { MarvelImportTeamUpPaths } from "./marvel-import-teamup-paths";
import type {
  MarvelImportAbility,
  MarvelImportFormDraft,
} from "./marvel-import-types";

type Props = {
  heroSlug: string;
  /** This form's index in the parent's draft array (NOT siteFormIndex). */
  draftIndex: number;
  draft: MarvelImportFormDraft;
  /** True when there are 2+ form cards in the panel. Controls the default-radio + tab-portrait UI. */
  multiForm: boolean;
  onPasteHtmlChange: (draftIndex: number, html: string) => void;
  onParseForm: (draftIndex: number) => void;
  onLabelChange: (draftIndex: number, label: string) => void;
  onShortLabelChange: (draftIndex: number, value: string) => void;
  onIsDefaultChange: (draftIndex: number) => void;
  onAbilityChange: (
    draftIndex: number,
    abilityIndex: number,
    patch: Partial<MarvelImportAbility>,
  ) => void;
  onParseDetail: (draftIndex: number, abilityIndex: number, html: string) => void;
  onClearDetail: (draftIndex: number, abilityIndex: number) => void;
  onTeamUpPasteHtmlChange: (draftIndex: number, pathIndex: number, html: string) => void;
  onParseTeamUpPartner: (draftIndex: number, pathIndex: number) => void;
  onTeamUpPartnerNameChange: (draftIndex: number, pathIndex: number, name: string) => void;
  onTeamUpAbilityChange: (
    draftIndex: number,
    pathIndex: number,
    abilityIndex: number,
    patch: Partial<MarvelImportAbility>,
  ) => void;
  onParseTeamUpDetail: (
    draftIndex: number,
    pathIndex: number,
    abilityIndex: number,
    html: string,
  ) => void;
  onClearTeamUpDetail: (
    draftIndex: number,
    pathIndex: number,
    abilityIndex: number,
  ) => void;
};

export function MarvelImportFormCard({
  heroSlug,
  draftIndex,
  draft,
  multiForm,
  onPasteHtmlChange,
  onParseForm,
  onLabelChange,
  onShortLabelChange,
  onIsDefaultChange,
  onAbilityChange,
  onParseDetail,
  onClearDetail,
  onTeamUpPasteHtmlChange,
  onParseTeamUpPartner,
  onTeamUpPartnerNameChange,
  onTeamUpAbilityChange,
  onParseTeamUpDetail,
  onClearTeamUpDetail,
}: Props) {
  const counts = useMemo(() => {
    const total = draft.abilities.length;
    const captured = draft.abilities.reduce((acc, _ability, index) => {
      const detail = draft.details[index];
      return detail && (detail.description || detail.stats.length > 0) ? acc + 1 : acc;
    }, 0);
    return { total, captured };
  }, [draft.abilities, draft.details]);

  const duplicateNameKeys = useMemo(() => {
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const ability of draft.abilities) {
      const k = ability.name.trim().toLowerCase();
      if (seen.has(k)) dup.add(k);
      else seen.add(k);
    }
    return dup;
  }, [draft.abilities]);

  const handleParse = () => onParseForm(draftIndex);
  const isEmpty = draft.abilities.length === 0;

  return (
    <section
      className={`border border-brand-gold/35 bg-background/70 ${
        draft.isDefault && multiForm ? "shadow-[0_0_0_1px_rgba(243,193,99,0.35)]" : ""
      }`}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-brand-gold/25 px-3 py-2">
        {draft.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.portraitUrl}
            alt={`${draft.label} portrait`}
            className="h-12 w-12 rounded-full border border-brand-gold/40 bg-black object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-brand-gold/40 text-[10px] uppercase tracking-wide text-muted-foreground">
            {draft.siteFormIndex + 1}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex flex-col gap-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span className="flex items-center gap-1.5">
              Form label
              <HelpTooltip
                content={
                  <>
                    Display name used on the runtime form-tab strip (e.g.{" "}
                    <span className="font-mono">Light</span>,{" "}
                    <span className="font-mono">Darkchild</span>). Defaults to{" "}
                    <span className="font-mono">Form {draft.siteFormIndex + 1}</span> —
                    overwrite freely.
                  </>
                }
              />
            </span>
            <RivalsInput
              value={draft.label}
              onChange={(e) => onLabelChange(draftIndex, e.target.value)}
              className="min-w-[8rem]"
            />
          </label>

          <label className="flex flex-col gap-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span className="flex items-center gap-1.5">
              Short label
              <HelpTooltip content="Optional shorter label for tight UI surfaces (e.g. the tab strip on mobile). Leave blank to reuse the full label." />
            </span>
            <RivalsInput
              value={draft.shortLabel ?? ""}
              onChange={(e) => onShortLabelChange(draftIndex, e.target.value)}
              className="min-w-[6rem]"
              placeholder=""
            />
          </label>
        </div>

        {multiForm ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="radio"
              name={`${heroSlug}-default-form`}
              checked={draft.isDefault}
              onChange={() => onIsDefaultChange(draftIndex)}
              className="accent-brand-gold"
            />
            <span className="flex items-center gap-1.5">
              Default form
              <HelpTooltip content="Marks which form the hero detail page loads first. Mirrors `defaultFormId` on hero_codex and the `is_default` flag on hero_form." />
            </span>
          </label>
        ) : (
          <span className="rounded border border-brand-gold/30 bg-brand-gold-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-gold">
            Single form
          </span>
        )}
      </header>

      <div className="space-y-3 px-3 py-3">
        <label className="block space-y-1">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Paste this form&apos;s HTML
            <HelpTooltip
              content={
                <>
                  On{" "}
                  <span className="font-mono">marvelrivals.com</span>, click this
                  form&apos;s circular tab, expand the surrounding{" "}
                  <span className="font-mono">.abilties-wrap</span> div in DevTools,
                  and copy it. Paste the markup here, then hit{" "}
                  <strong>Parse this form</strong>. The first form is already parsed
                  from the top-level paste — only the remaining cards need pastes of
                  their own.{" "}
                </>
              }
            />
          </span>
          <textarea
            value={draft.pasteHtml}
            onChange={(e) => onPasteHtmlChange(draftIndex, e.target.value)}
            rows={isEmpty ? 6 : 3}
            spellCheck={false}
            className="w-full resize-y border border-brand-gold/35 bg-background/80 px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-brand-gold"
            placeholder='<div class="abilties-wrap">...</div>'
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <ClippedButton
            type="button"
            tone="brand"
            onClick={handleParse}
            disabled={!draft.pasteHtml.trim()}
          >
            Parse this form
          </ClippedButton>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {isEmpty
              ? "Paste required"
              : `${counts.captured}/${counts.total} with detail`}
          </span>
        </div>

        {draft.parseWarnings.length > 0 ? (
          <div className="rounded border border-brand-gold/40 bg-brand-gold-muted/40 px-3 py-2 text-xs text-brand-gold">
            <p className="text-[10px] font-semibold uppercase tracking-wide">
              Parse notes ({draft.label})
            </p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {draft.parseWarnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {draft.baseStatRows.length > 0 ? (
          <div className="space-y-2 rounded border border-brand-gold/25 bg-[#111523]/50 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-gold">
              {draft.label} base stats ({draft.baseStatRows.length})
              <HelpTooltip content="Verbatim label/value rows from this form's .abilties-r.jcsx panel. A HEALTH row with a numeric value also updates this form's `health` field on the hero_form row." />
            </p>
            <dl className="grid gap-2 text-[11px] sm:grid-cols-2">
              {draft.baseStatRows.map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className="flex justify-between gap-3 border-b border-white/5 pb-1"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-mono text-white">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <MarvelAbilitySkeletonList
          heroSlug={heroSlug}
          abilities={draft.abilities}
          details={draft.details}
          detailMessages={draft.detailMessages}
          duplicateNameKeys={duplicateNameKeys}
          onAbilityChange={(abilityIndex, patch) =>
            onAbilityChange(draftIndex, abilityIndex, patch)
          }
          onParseDetail={(abilityIndex, html) =>
            onParseDetail(draftIndex, abilityIndex, html)
          }
          onClearDetail={(abilityIndex) => onClearDetail(draftIndex, abilityIndex)}
        />

        <MarvelImportTeamUpPaths
          heroSlug={heroSlug}
          paths={draft.teamUpPaths ?? []}
          onPasteHtmlChange={(pathIndex, html) =>
            onTeamUpPasteHtmlChange(draftIndex, pathIndex, html)
          }
          onParsePartner={(pathIndex) => onParseTeamUpPartner(draftIndex, pathIndex)}
          onPartnerNameChange={(pathIndex, name) =>
            onTeamUpPartnerNameChange(draftIndex, pathIndex, name)
          }
          onAbilityChange={(pathIndex, abilityIndex, patch) =>
            onTeamUpAbilityChange(draftIndex, pathIndex, abilityIndex, patch)
          }
          onParseDetail={(pathIndex, abilityIndex, html) =>
            onParseTeamUpDetail(draftIndex, pathIndex, abilityIndex, html)
          }
          onClearDetail={(pathIndex, abilityIndex) =>
            onClearTeamUpDetail(draftIndex, pathIndex, abilityIndex)
          }
        />
      </div>
    </section>
  );
}
