"use client";

import { useState } from "react";
import { ClippedButton } from "@/components/ui/clipped-button";
import { HelpTooltip } from "@/components/ui/tooltip";
import type {
  MarvelImportAbility,
  MarvelImportAbilityDetail,
} from "./marvel-import-types";

type Props = {
  heroSlug: string;
  ability: MarvelImportAbility;
  detail: MarvelImportAbilityDetail | undefined;
  message?: string;
  onParse: (html: string) => void;
  onClear: () => void;
};

export function MarvelAbilityDetailEditor({
  heroSlug,
  ability,
  detail,
  message,
  onParse,
  onClear,
}: Props) {
  const [expanded, setExpanded] = useState(Boolean(detail));
  const [html, setHtml] = useState("");

  const hasParsed = Boolean(detail && (detail.description || detail.stats.length > 0));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-semibold uppercase tracking-wide text-brand-gold hover:text-brand-gold/80"
        >
          {expanded ? "Hide detail editor" : "Paste detail HTML"}
        </button>
        <div className="flex items-center gap-2">
          <HelpTooltip
            content={
              <>
                Paste the <span className="font-mono">.abilties-r.jnsx</span> block
                for this ability from <span className="font-mono">marvelrivals.com/{heroSlug}</span>.
                Use <strong>Parse detail</strong> to preview it locally; the parsed
                data ships automatically with the next <strong>Apply</strong> on the
                main form. No per-ability save is needed.
              </>
            }
          />
          {hasParsed ? (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] uppercase tracking-wide text-muted-foreground hover:text-duelist"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="space-y-2">
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={`Paste the .abilties-r.jnsx block for "${ability.name}" from marvelrivals.com/${heroSlug}`}
            className="w-full resize-y border border-brand-gold/30 bg-background/80 px-2 py-1 font-mono text-[11px] text-foreground outline-none focus:border-brand-gold"
          />
          <div className="flex flex-wrap gap-2">
            <ClippedButton
              type="button"
              tone="brand"
              onClick={() => onParse(html)}
              disabled={!html.trim()}
            >
              Parse detail
            </ClippedButton>
          </div>
        </div>
      ) : null}

      {hasParsed ? (
        <div className="space-y-2 border border-brand-gold/25 bg-background/60 p-2">
          {detail?.description ? (
            <p className="text-xs text-muted-foreground">
              <span className="mr-1 text-[10px] uppercase tracking-wide text-brand-gold">
                Description
              </span>
              {detail.description}
            </p>
          ) : null}
          {detail && detail.stats.length > 0 ? (
            <table className="w-full table-fixed text-[11px]">
              <tbody>
                {detail.stats.map((stat, i) => (
                  <tr key={`${stat.label}-${i}`} className="border-t border-brand-gold/15 first:border-t-0">
                    <td className="w-1/2 px-1 py-1 text-[10px] uppercase tracking-wide text-brand-gold">
                      {stat.label}
                    </td>
                    <td className="px-1 py-1 text-muted-foreground">{stat.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="text-[11px] text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
