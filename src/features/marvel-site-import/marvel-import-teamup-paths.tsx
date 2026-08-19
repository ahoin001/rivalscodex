"use client";

import { useMemo } from "react";
import { ClippedButton } from "@/components/ui/clipped-button";
import { RivalsInput } from "@/components/ui/rivals-input";
import { HelpTooltip, Tooltip } from "@/components/ui/tooltip";
import { MarvelAbilitySkeletonList } from "./marvel-ability-skeleton-list";
import type {
  MarvelImportAbility,
  MarvelImportTeamUpPath,
} from "./marvel-import-types";

type Props = {
  heroSlug: string;
  paths: MarvelImportTeamUpPath[];
  onPasteHtmlChange: (pathIndex: number, html: string) => void;
  onParsePartner: (pathIndex: number) => void;
  onPartnerNameChange: (pathIndex: number, name: string) => void;
  onAbilityChange: (
    pathIndex: number,
    abilityIndex: number,
    patch: Partial<MarvelImportAbility>,
  ) => void;
  onParseDetail: (pathIndex: number, abilityIndex: number, html: string) => void;
  onClearDetail: (pathIndex: number, abilityIndex: number) => void;
};

const CHIP = {
  pending: "border-brand-gold/40 bg-brand-gold-muted/40 text-brand-gold",
  captured: "border-strategist/50 bg-strategist/10 text-strategist",
};

export function MarvelImportTeamUpPaths({
  heroSlug,
  paths,
  onPasteHtmlChange,
  onParsePartner,
  onPartnerNameChange,
  onAbilityChange,
  onParseDetail,
  onClearDetail,
}: Props) {
  if (paths.length === 0) return null;

  return (
    <section className="space-y-3 border border-brand-gold/30 bg-[#111523]/40 p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-gold">
          Team-Up partners
          <HelpTooltip
            maxWidth="28rem"
            content={
              <>
                The official site only renders <strong>one</strong> partner path at a
                time. Base and Enhanced both appear for the selected character —
                the missing piece is the other portrait, not the other effect
                heading. Click an empty{" "}
                <span className="font-mono">.lx-hero</span> portrait on{" "}
                <span className="font-mono">marvelrivals.com</span>, wait for the
                list name/icon to swap, copy the same{" "}
                <span className="font-mono">.abilties-wrap</span>, paste it into
                that slot, then <strong>Parse this partner</strong>. Portrait alts
                are empty — type the partner name if the parser did not infer it
                from &quot;When teaming up with…&quot;.
              </>
            }
          />
        </p>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {paths.filter((path) => path.abilities.length > 0).length}/{paths.length}{" "}
          captured
        </span>
      </header>

      <div className="space-y-3">
        {paths.map((path, pathIndex) => (
          <PartnerPathCard
            key={path.partnerIndex}
            heroSlug={heroSlug}
            path={path}
            pathIndex={pathIndex}
            onPasteHtmlChange={onPasteHtmlChange}
            onParsePartner={onParsePartner}
            onPartnerNameChange={onPartnerNameChange}
            onAbilityChange={onAbilityChange}
            onParseDetail={onParseDetail}
            onClearDetail={onClearDetail}
          />
        ))}
      </div>
    </section>
  );
}

function PartnerPathCard({
  heroSlug,
  path,
  pathIndex,
  onPasteHtmlChange,
  onParsePartner,
  onPartnerNameChange,
  onAbilityChange,
  onParseDetail,
  onClearDetail,
}: {
  heroSlug: string;
  path: MarvelImportTeamUpPath;
  pathIndex: number;
  onPasteHtmlChange: Props["onPasteHtmlChange"];
  onParsePartner: Props["onParsePartner"];
  onPartnerNameChange: Props["onPartnerNameChange"];
  onAbilityChange: Props["onAbilityChange"];
  onParseDetail: Props["onParseDetail"];
  onClearDetail: Props["onClearDetail"];
}) {
  const captured = path.abilities.length > 0;
  const duplicateNameKeys = useMemo(() => {
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const ability of path.abilities) {
      const key = ability.name.trim().toLowerCase();
      if (seen.has(key)) dup.add(key);
      else seen.add(key);
    }
    return dup;
  }, [path.abilities]);

  const chipHint = captured
    ? "This partner path is captured and will collapse into one Team-Up ability on Apply. Re-paste to refresh, or fill remaining Base/Enhanced detail rows below."
    : "Click this portrait on marvelrivals.com, wait for the Team-Up name/icon to change, copy the .abilties-wrap block, paste it here, then Parse this partner.";

  return (
    <article className="border border-brand-gold/30 bg-background/70">
      <header className="flex flex-wrap items-center gap-3 border-b border-brand-gold/25 px-3 py-2">
        {path.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={path.portraitUrl}
            alt={path.partnerName || `Team-Up partner ${path.partnerIndex + 1}`}
            className="h-10 w-10 rounded-full border border-brand-gold/40 bg-black object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-brand-gold/40 text-[10px] uppercase tracking-wide text-muted-foreground">
            {path.partnerIndex + 1}
          </div>
        )}

        <label className="flex min-w-[10rem] flex-1 flex-col gap-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span className="flex items-center gap-1.5">
            Partner name
            <HelpTooltip content="Official portrait alts are blank. Inferred from Enhanced copy (“When teaming up with…”) or the loadout catalog when the ability name matches. Edit freely." />
          </span>
          <RivalsInput
            value={path.partnerName ?? ""}
            onChange={(event) => onPartnerNameChange(pathIndex, event.target.value)}
            placeholder={`Partner ${path.partnerIndex + 1}`}
          />
        </label>

        <Tooltip content={chipHint} maxWidth="24rem">
          <span
            className={`cursor-help rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              captured ? CHIP.captured : CHIP.pending
            }`}
            tabIndex={0}
            role="status"
          >
            {captured ? "Partner captured" : "Partner pending"}
          </span>
        </Tooltip>
      </header>

      <div className="space-y-3 px-3 py-3">
        <label className="block space-y-1">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Paste this partner&apos;s HTML
            <HelpTooltip
              maxWidth="26rem"
              content={
                <>
                  On <span className="font-mono">marvelrivals.com</span>, click
                  this portrait in the Team-Up row, expand the surrounding{" "}
                  <span className="font-mono">.abilties-wrap</span> in DevTools,
                  and copy it. Paste here, then hit{" "}
                  <strong>Parse this partner</strong>. Kit abilities stay on the
                  form card — this slot only upserts this partner&apos;s Team-Up.
                </>
              }
            />
          </span>
          <textarea
            value={path.pasteHtml}
            onChange={(event) => onPasteHtmlChange(pathIndex, event.target.value)}
            rows={captured ? 3 : 5}
            spellCheck={false}
            className="w-full resize-y border border-brand-gold/35 bg-background/80 px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-brand-gold"
            placeholder='<div class="abilties-wrap">...</div>'
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <ClippedButton
            type="button"
            tone="brand"
            onClick={() => onParsePartner(pathIndex)}
            disabled={!path.pasteHtml.trim()}
          >
            Parse this partner
          </ClippedButton>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {captured
              ? `${path.abilities.filter((_, index) => {
                  const detail = path.details[index];
                  return detail && (detail.description || detail.stats.length > 0);
                }).length}/${path.abilities.length} with detail`
              : "Paste required"}
          </span>
        </div>

        {path.parseWarnings.length > 0 ? (
          <ul className="list-inside list-disc text-[11px] text-muted-foreground">
            {path.parseWarnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        ) : null}

        {captured ? (
          <MarvelAbilitySkeletonList
            heroSlug={heroSlug}
            abilities={path.abilities}
            details={path.details}
            detailMessages={path.detailMessages}
            duplicateNameKeys={duplicateNameKeys}
            emptyMessage="No Team-Up rows in this paste."
            onAbilityChange={(abilityIndex, patch) =>
              onAbilityChange(pathIndex, abilityIndex, patch)
            }
            onParseDetail={(abilityIndex, html) =>
              onParseDetail(pathIndex, abilityIndex, html)
            }
            onClearDetail={(abilityIndex) => onClearDetail(pathIndex, abilityIndex)}
          />
        ) : null}
      </div>
    </article>
  );
}
