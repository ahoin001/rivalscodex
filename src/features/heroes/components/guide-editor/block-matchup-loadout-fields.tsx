import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { HeroOpponentPicker } from "@/features/heroes/components/hero-opponent-picker";

export function MatchupFields({
  block,
  onReplace,
  heroRoster,
}: {
  block: Extract<HeroGuideBlock, { type: "matchup" }>;
  onReplace: (next: HeroGuideBlock) => void;
  heroRoster?: HeroPortraitEntry[];
}) {
  return (
    <div className="grid gap-2">
      <select
        className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
        value={block.disposition}
        onChange={(event) =>
          onReplace({
            ...block,
            disposition: event.target.value as "target" | "even" | "threat",
          })
        }
      >
        <option value="target">Target (favorable focus)</option>
        <option value="even">Even (skill matchup)</option>
        <option value="threat">Threat (respect / counterplay)</option>
      </select>
      <HeroOpponentPicker
        value={block.opponent}
        heroes={heroRoster ?? []}
        onChange={(opponent) => onReplace({ ...block, opponent })}
      />
      <textarea
        rows={3}
        className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
        value={block.summary}
        onChange={(event) => onReplace({ ...block, summary: event.target.value })}
        placeholder="Summary / counterplay"
      />
      <p className="text-[10px] uppercase tracking-wide text-rivals-ink-muted">
        Clip (optional, YouTube)
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.clip?.label ?? ""}
          onChange={(event) => {
            const label = event.target.value.trim();
            const href = block.clip?.href?.trim() ?? "";
            if (!href) {
              onReplace({ ...block, clip: undefined });
              return;
            }
            onReplace({
              ...block,
              clip: { label: label || "Watch clip", href },
            });
          }}
          placeholder="Clip label (optional)"
        />
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.clip?.href ?? ""}
          onChange={(event) => {
            const href = event.target.value.trim();
            const label = block.clip?.label?.trim() ?? "";
            if (!href) {
              onReplace({ ...block, clip: undefined });
              return;
            }
            onReplace({
              ...block,
              clip: { label: label || "Watch clip", href },
            });
          }}
          placeholder="YouTube watch URL"
        />
      </div>
    </div>
  );
}

export function LoadoutFields({
  block,
  onReplace,
}: {
  block: Extract<HeroGuideBlock, { type: "loadout" }>;
  onReplace: (next: HeroGuideBlock) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Loadout name</span>
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.name}
          onChange={(event) => onReplace({ ...block, name: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Base effect</span>
        <textarea
          rows={3}
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.baseEffect}
          onChange={(event) => onReplace({ ...block, baseEffect: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Enhanced effect (optional)</span>
        <textarea
          rows={3}
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.enhancedEffect ?? ""}
          onChange={(event) =>
            onReplace({
              ...block,
              enhancedEffect: event.target.value.trim() ? event.target.value : undefined,
            })
          }
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-[11px]">
          <span className="text-rivals-ink-muted">Partner slug</span>
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.partnerSlug ?? ""}
            onChange={(event) =>
              onReplace({
                ...block,
                partnerSlug: event.target.value.trim() ? event.target.value : undefined,
              })
            }
          />
        </label>
        <label className="grid gap-1 text-[11px]">
          <span className="text-rivals-ink-muted">Partner name</span>
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.partnerName ?? ""}
            onChange={(event) =>
              onReplace({
                ...block,
                partnerName: event.target.value.trim() ? event.target.value : undefined,
              })
            }
          />
        </label>
      </div>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">When to pick</span>
        <textarea
          rows={2}
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.whenToPick ?? ""}
          onChange={(event) =>
            onReplace({
              ...block,
              whenToPick: event.target.value.trim() ? event.target.value : undefined,
            })
          }
        />
      </label>
      <label className="flex items-center gap-2 text-[11px] text-rivals-ink-soft">
        <input
          type="checkbox"
          checked={Boolean(block.soloQueueDefault)}
          onChange={(event) => onReplace({ ...block, soloQueueDefault: event.target.checked })}
        />
        Solo-queue default
      </label>
    </div>
  );
}
