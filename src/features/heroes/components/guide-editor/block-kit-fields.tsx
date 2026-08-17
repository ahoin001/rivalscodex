import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";

export function AbilityTipFields({
  block,
  onReplace,
}: {
  block: Extract<HeroGuideBlock, { type: "abilityTip" }>;
  onReplace: (next: HeroGuideBlock) => void;
}) {
  return (
    <div className="grid gap-2">
      <input
        className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
        value={block.abilityRef}
        onChange={(event) => onReplace({ ...block, abilityRef: event.target.value })}
        placeholder="Ability reference slug or name"
      />
      <input
        className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
        value={block.title ?? ""}
        onChange={(event) => onReplace({ ...block, title: event.target.value || undefined })}
        placeholder="Title (optional)"
      />
      <textarea
        rows={4}
        className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
        value={block.body}
        onChange={(event) => onReplace({ ...block, body: event.target.value })}
        placeholder="Mechanic explanation"
      />
      <input
        className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
        value={(block.tags ?? []).join(", ")}
        onChange={(event) =>
          onReplace({
            ...block,
            tags: event.target.value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          })
        }
        placeholder="Tags (comma separated)"
      />
    </div>
  );
}

export function VideoFields({
  block,
  onReplace,
}: {
  block: Extract<HeroGuideBlock, { type: "video" }>;
  onReplace: (next: HeroGuideBlock) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Title</span>
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.title}
          onChange={(event) => onReplace({ ...block, title: event.target.value })}
          placeholder="Title shown on the card"
        />
      </label>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Why watch (note above thumbnail)</span>
        <textarea
          rows={3}
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.note ?? ""}
          onChange={(event) =>
            onReplace({
              ...block,
              note: event.target.value.trim() ? event.target.value : undefined,
            })
          }
          placeholder="e.g. Beginner combo routes with explanations for each step"
        />
      </label>
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Watch URL</span>
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.watchUrl}
          onChange={(event) => onReplace({ ...block, watchUrl: event.target.value })}
          placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
        />
      </label>
    </div>
  );
}

function ProConListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Array<{ title: string; detail?: string }>;
  onChange: (next: Array<{ title: string; detail?: string }>) => void;
}) {
  const updateAt = (index: number, patch: Partial<{ title: string; detail?: string }>) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2 rounded border border-rivals-light-300 bg-rivals-light-50/70 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[11px] font-bold uppercase italic text-rivals-ink">{label}</p>
        <button
          type="button"
          className="rounded border border-rivals-light-300 px-2 py-0.5 text-[10px] uppercase text-rivals-ink-soft hover:bg-white"
          onClick={() =>
            onChange([...items, { title: "New point", detail: "Add detail for hover/tap reveal." }])
          }
        >
          + Row
        </button>
      </div>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="grid gap-1.5 rounded border border-rivals-light-300 bg-white p-2">
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={item.title}
            onChange={(event) => updateAt(index, { title: event.target.value })}
            placeholder="Short summary (shown in the grid)"
          />
          <textarea
            rows={3}
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={item.detail ?? ""}
            onChange={(event) => updateAt(index, { detail: event.target.value || undefined })}
            placeholder="Longer explanation (hover/tap tooltip)"
          />
          <button
            type="button"
            disabled={items.length <= 1}
            className="justify-self-start rounded border border-rose-200 px-2 py-0.5 text-[10px] uppercase text-rose-800 disabled:opacity-40"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            Remove row
          </button>
        </div>
      ))}
    </div>
  );
}

export function StrengthsWeaknessesFields({
  block,
  onReplace,
}: {
  block: Extract<HeroGuideBlock, { type: "strengthsWeaknesses" }>;
  onReplace: (next: HeroGuideBlock) => void;
}) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Module title (optional)</span>
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.title ?? ""}
          onChange={(event) => onReplace({ ...block, title: event.target.value || undefined })}
          placeholder="Strengths & Weaknesses"
        />
      </label>
      <ProConListEditor
        label="Strengths"
        items={block.strengths}
        onChange={(strengths) => onReplace({ ...block, strengths })}
      />
      <ProConListEditor
        label="Weaknesses"
        items={block.weaknesses}
        onChange={(weaknesses) => onReplace({ ...block, weaknesses })}
      />
    </div>
  );
}
