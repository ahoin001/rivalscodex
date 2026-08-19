"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { MarvelAbilityDetailEditor } from "./marvel-ability-detail-editor";
import type {
  MarvelImportAbility,
  MarvelImportAbilityDetail,
} from "./marvel-import-types";

type Props = {
  heroSlug: string;
  abilities: MarvelImportAbility[];
  /** Detail state keyed by ability array index. */
  details: Record<number, MarvelImportAbilityDetail | undefined>;
  /** Per-row hint/error message keyed by ability array index. */
  detailMessages: Record<number, string | undefined>;
  /** Lowercased ability names that appear more than once in this hero — surfaced as a tooltip hint so users know to keep their detail captures separated by row. */
  duplicateNameKeys: Set<string>;
  emptyMessage?: string;
  onAbilityChange: (index: number, patch: Partial<MarvelImportAbility>) => void;
  onParseDetail: (abilityIndex: number, html: string) => void;
  onClearDetail: (abilityIndex: number) => void;
};

type ChipKind = "idle" | "captured" | "duplicate-idle";

const STATUS_CHIP: Record<ChipKind, string> = {
  idle: "border-brand-gold/40 bg-brand-gold-muted/40 text-brand-gold",
  captured: "border-strategist/50 bg-strategist/10 text-strategist",
  "duplicate-idle": "border-duelist/45 bg-duelist/10 text-duelist",
};

const CHIP_LABEL: Record<ChipKind, string> = {
  idle: "Detail pending",
  captured: "Detail captured",
  "duplicate-idle": "Duplicate name · paste this row's detail",
};

const CHIP_HINT: Record<ChipKind, string> = {
  idle:
    "Click this ability on marvelrivals.com, copy the .abilties-r.jnsx block, paste it into the editor below, then click Parse detail.",
  captured:
    "Detail is ready and will ship with the next Apply. Edit by re-pasting and Parse detail again, or click Clear to drop it.",
  "duplicate-idle":
    "This hero has another ability with the same display name. Each row keeps its own detail — paste THIS row's .abilties-r.jnsx block here (the one matching this row's keybind).",
};

const TEAM_UP_CHIP_HINT: Record<ChipKind, string> = {
  idle:
    "One .jnsx paste usually contains both Base Effect and Enhanced Effect. Paste it here — both variant rows fill when the labels are present. Click Enhanced on the site only if the stat rows differ.",
  captured:
    "This variant's copy is captured. Re-paste the .jnsx block to refresh both Base and Enhanced rows, or Clear to drop this row.",
  "duplicate-idle":
    "Base and Enhanced share this display name. Paste the open .jnsx block once — the parser splits Base Effect / Enhanced Effect onto the matching rows.",
};

export function MarvelAbilitySkeletonList({
  heroSlug,
  abilities,
  details,
  detailMessages,
  duplicateNameKeys,
  emptyMessage,
  onAbilityChange,
  onParseDetail,
  onClearDetail,
}: Props) {
  if (abilities.length === 0) {
    return (
      <div className="rounded border border-brand-gold/30 bg-background/60 px-3 py-4 text-xs text-muted-foreground">
        {emptyMessage ?? "No abilities detected yet. Paste hero HTML above and click Parse."}
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {abilities.map((ability, index) => {
        const detail = details[index];
        const hasDetail = Boolean(detail && (detail.description || detail.stats.length > 0));
        const isDuplicate = duplicateNameKeys.has(ability.name.trim().toLowerCase());
        const isTeamUp = Boolean(ability.teamUpVariant);
        const chipKey: ChipKind = hasDetail
          ? "captured"
          : isDuplicate
          ? "duplicate-idle"
          : "idle";
        const categoryLabel = ability.teamUpVariant
          ? `Team-Up · ${ability.teamUpVariant === "enhanced" ? "Enhanced" : "Base"}`
          : (ability.category ?? "Ability");

        return (
          <li
            key={`${ability.name}-${index}`}
            className="border border-brand-gold/35 bg-background/70"
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-brand-gold/25 px-3 py-2">
              {ability.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ability.iconUrl}
                  alt={ability.name}
                  className="h-10 w-10 border border-brand-gold/30 bg-black object-contain"
                />
              ) : (
                <div className="h-10 w-10 border border-dashed border-brand-gold/30" />
              )}

              <div className="flex flex-1 flex-wrap items-center gap-2">
                <span className="rounded border border-brand-gold/40 bg-brand-gold-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-gold">
                  {categoryLabel}
                </span>
                <input
                  value={ability.name}
                  onChange={(e) => onAbilityChange(index, { name: e.target.value })}
                  className="min-w-[10rem] flex-1 border border-brand-gold/30 bg-[#111523]/80 px-2 py-1 text-sm font-semibold uppercase tracking-wide text-white outline-none focus:border-brand-gold"
                />
                <div className="flex items-center gap-1">
                  {ability.keybindIconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ability.keybindIconUrl}
                      alt={ability.keybind ?? "keybind"}
                      className="h-6 w-6 border border-brand-gold/30 bg-black object-contain"
                    />
                  ) : null}
                  <input
                    value={ability.keybind ?? ""}
                    onChange={(e) =>
                      onAbilityChange(index, { keybind: e.target.value })
                    }
                    placeholder="Q / LMB / Passive"
                    className="w-24 border border-brand-gold/30 bg-[#111523]/80 px-2 py-1 text-xs uppercase tracking-wide text-white outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <Tooltip content={(isTeamUp ? TEAM_UP_CHIP_HINT : CHIP_HINT)[chipKey]} maxWidth="22rem">
                <span
                  className={`cursor-help rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CHIP[chipKey]}`}
                  tabIndex={0}
                  role="status"
                >
                  {CHIP_LABEL[chipKey]}
                </span>
              </Tooltip>
            </div>

            <div className="px-3 py-3">
              <MarvelAbilityDetailEditor
                heroSlug={heroSlug}
                ability={ability}
                detail={detail}
                message={detailMessages[index]}
                onParse={(html) => onParseDetail(index, html)}
                onClear={() => onClearDetail(index)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
