import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import { itemsToLines, linesToItems } from "./block-editor-meta";

export function CalloutFields({
  block,
  onReplace,
}: {
  block: Extract<HeroGuideBlock, { type: "callout" }>;
  onReplace: (next: HeroGuideBlock) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Variant</span>
        <select
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.variant ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            onReplace({
              ...block,
              variant: value === "" ? undefined : (value as "gameplan" | "macro" | "tip"),
            });
          }}
        >
          <option value="">Default</option>
          <option value="gameplan">Gameplan</option>
          <option value="macro">Macro</option>
          <option value="tip">Tip</option>
        </select>
      </label>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Title (optional)</span>
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.title ?? ""}
          onChange={(event) =>
            onReplace({
              ...block,
              title: event.target.value ? event.target.value : undefined,
            })
          }
        />
      </label>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Body</span>
        <textarea
          rows={3}
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.body}
          onChange={(event) => onReplace({ ...block, body: event.target.value })}
        />
      </label>
    </div>
  );
}

export function BulletsFields({
  block,
  onReplace,
}: {
  block: Extract<HeroGuideBlock, { type: "bullets" }>;
  onReplace: (next: HeroGuideBlock) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Title (optional)</span>
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.title ?? ""}
          onChange={(event) =>
            onReplace({
              ...block,
              title: event.target.value ? event.target.value : undefined,
            })
          }
        />
      </label>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Items (one per line)</span>
        <textarea
          rows={4}
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm font-mono"
          value={itemsToLines(block.items)}
          onChange={(event) => onReplace({ ...block, items: linesToItems(event.target.value) })}
        />
      </label>
    </div>
  );
}

export function TwoColumnFields({
  block,
  onReplace,
}: {
  block: Extract<HeroGuideBlock, { type: "twoColumn" }>;
  onReplace: (next: HeroGuideBlock) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-2">
        <input
          className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.leftTitle}
          onChange={(event) => onReplace({ ...block, leftTitle: event.target.value })}
          placeholder="Left title"
        />
        <textarea
          rows={4}
          className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm font-mono"
          value={itemsToLines(block.leftItems)}
          onChange={(event) =>
            onReplace({ ...block, leftItems: linesToItems(event.target.value) })
          }
          placeholder="Left items, one per line"
        />
      </div>
      <div className="space-y-2">
        <input
          className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.rightTitle}
          onChange={(event) => onReplace({ ...block, rightTitle: event.target.value })}
          placeholder="Right title"
        />
        <textarea
          rows={4}
          className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm font-mono"
          value={itemsToLines(block.rightItems)}
          onChange={(event) =>
            onReplace({ ...block, rightItems: linesToItems(event.target.value) })
          }
          placeholder="Right items, one per line"
        />
      </div>
    </div>
  );
}
