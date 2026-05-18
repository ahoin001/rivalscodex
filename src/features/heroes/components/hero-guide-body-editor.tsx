"use client";

import { useCallback } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { ComboBuilderEditor } from "@/features/heroes/components/combo-builder-editor";

type HeroGuideBodyEditorProps = {
  blocks: HeroGuideBlock[];
  onChange: (next: HeroGuideBlock[] | undefined) => void;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
};

function linesToItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function itemsToLines(items: string[]): string {
  return items.join("\n");
}

export function HeroGuideBodyEditor({ blocks, onChange, abilityLookup }: HeroGuideBodyEditorProps) {
  const replaceAt = useCallback(
    (index: number, block: HeroGuideBlock) => {
      const next = blocks.map((b, i) => (i === index ? block : b));
      onChange(next.length > 0 ? next : undefined);
    },
    [blocks, onChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      const next = blocks.filter((_, i) => i !== index);
      onChange(next.length > 0 ? next : undefined);
    },
    [blocks, onChange],
  );

  const append = useCallback(
    (block: HeroGuideBlock) => {
      onChange([...blocks, block]);
    },
    [blocks, onChange],
  );

  const move = useCallback(
    (index: number, dir: -1 | 1) => {
      const j = index + dir;
      if (j < 0 || j >= blocks.length) return;
      const next = [...blocks];
      [next[index], next[j]] = [next[j], next[index]];
      onChange(next);
    },
    [blocks, onChange],
  );

  return (
    <div className="space-y-3 rounded border border-rivals-light-300 bg-rivals-light-100/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-muted">
          Structured body (optional)
        </span>
        <div className="flex flex-wrap gap-1.5">
          <MiniAdd label="+ Callout" onClick={() => append({ type: "callout", body: "Short callout text." })} />
          <MiniAdd label="+ Bullets" onClick={() => append({ type: "bullets", items: ["First item"] })} />
          <MiniAdd
            label="+ Two columns"
            onClick={() =>
              append({
                type: "twoColumn",
                leftTitle: "Left column",
                leftItems: ["Point A"],
                rightTitle: "Right column",
                rightItems: ["Point B"],
              })
            }
          />
          <MiniAdd
            label="+ Combo"
            onClick={() =>
              append({
                type: "combo",
                name: "Combo name",
                steps: ["Step 1"],
              })
            }
          />
          <MiniAdd
            label="+ Matchup"
            onClick={() =>
              append({
                type: "matchup",
                disposition: "target",
                opponent: "Hero name",
                summary: "One or two sentences on how you exploit or survive this matchup.",
              })
            }
          />
          <MiniAdd
            label="+ Video"
            onClick={() =>
              append({
                type: "video",
                title: "Clip title",
                watchUrl: "https://www.youtube.com/watch?v=",
              })
            }
          />
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-rivals-ink-muted">
        When the structured body has at least one block, the live guide shows these sections instead of
        priority/secondary cue columns (summary and links still appear).
      </p>

      {blocks.length === 0 ? (
        <p className="text-xs italic text-rivals-ink-muted">No blocks yet — add one or rely on priority cues only.</p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((block, index) => (
            <li
              key={`block-${index}-${block.type}`}
              className="rounded border border-rivals-light-300 bg-white px-3 py-2"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-[11px] font-bold uppercase italic text-rivals-ink">
                  {block.type}
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="rounded border border-rivals-light-300 px-2 py-0.5 text-[10px] uppercase text-rivals-ink-soft hover:bg-rivals-light-100"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="rounded border border-rivals-light-300 px-2 py-0.5 text-[10px] uppercase text-rivals-ink-soft hover:bg-rivals-light-100"
                    onClick={() => move(index, 1)}
                    disabled={index === blocks.length - 1}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="rounded border border-rose-200 px-2 py-0.5 text-[10px] uppercase text-rose-800 hover:bg-rose-50"
                    onClick={() => removeAt(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <BlockFields block={block} onReplace={(next) => replaceAt(index, next)} abilityLookup={abilityLookup} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MiniAdd({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-rivals-light-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rivals-ink hover:bg-rivals-yellow-200"
    >
      {label}
    </button>
  );
}

function BlockFields({
  block,
  onReplace,
  abilityLookup,
}: {
  block: HeroGuideBlock;
  onReplace: (next: HeroGuideBlock) => void;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
}) {
  switch (block.type) {
    case "callout":
      return (
        <div className="grid gap-2">
          <label className="grid gap-1 text-[11px]">
            <span className="text-rivals-ink-muted">Variant</span>
            <select
              className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
              value={block.variant ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onReplace({
                  ...block,
                  variant: v === "" ? undefined : (v as "gameplan" | "macro" | "tip"),
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
              onChange={(e) =>
                onReplace({
                  ...block,
                  title: e.target.value ? e.target.value : undefined,
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
              onChange={(e) => onReplace({ ...block, body: e.target.value })}
            />
          </label>
        </div>
      );
    case "bullets":
      return (
        <div className="grid gap-2">
          <label className="grid gap-1 text-[11px]">
            <span className="text-rivals-ink-muted">Title (optional)</span>
            <input
              className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
              value={block.title ?? ""}
              onChange={(e) =>
                onReplace({
                  ...block,
                  title: e.target.value ? e.target.value : undefined,
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
              onChange={(e) => onReplace({ ...block, items: linesToItems(e.target.value) })}
            />
          </label>
        </div>
      );
    case "twoColumn":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-2">
            <input
              className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm"
              value={block.leftTitle}
              onChange={(e) => onReplace({ ...block, leftTitle: e.target.value })}
              placeholder="Left title"
            />
            <textarea
              rows={4}
              className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm font-mono"
              value={itemsToLines(block.leftItems)}
              onChange={(e) => onReplace({ ...block, leftItems: linesToItems(e.target.value) })}
              placeholder="Left items, one per line"
            />
          </div>
          <div className="space-y-2">
            <input
              className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm"
              value={block.rightTitle}
              onChange={(e) => onReplace({ ...block, rightTitle: e.target.value })}
              placeholder="Right title"
            />
            <textarea
              rows={4}
              className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm font-mono"
              value={itemsToLines(block.rightItems)}
              onChange={(e) => onReplace({ ...block, rightItems: linesToItems(e.target.value) })}
              placeholder="Right items, one per line"
            />
          </div>
        </div>
      );
    case "combo":
      if (abilityLookup && abilityLookup.size > 0) {
        return (
          <ComboBuilderEditor
            block={block}
            abilityLookup={abilityLookup}
            onReplace={(next) => onReplace(next)}
          />
        );
      }
      return (
        <div className="grid gap-2">
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.name}
            onChange={(e) => onReplace({ ...block, name: e.target.value })}
            placeholder="Combo name"
          />
          <label className="grid gap-1 text-[11px]">
            <span className="text-rivals-ink-muted">Steps (one per line)</span>
            <textarea
              rows={4}
              className="rounded border border-rivals-light-300 px-2 py-1 text-sm font-mono"
              value={itemsToLines(block.steps)}
              onChange={(e) => onReplace({ ...block, steps: linesToItems(e.target.value) })}
            />
          </label>
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.condition ?? ""}
            onChange={(e) =>
              onReplace({
                ...block,
                condition: e.target.value.trim() ? e.target.value : undefined,
              })
            }
            placeholder="Condition / team-up note (optional)"
          />
          <p className="text-[10px] uppercase tracking-wide text-rivals-ink-muted">Clip (optional, YouTube)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
              value={block.clip?.label ?? ""}
              onChange={(e) => {
                const label = e.target.value.trim();
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
              onChange={(e) => {
                const href = e.target.value.trim();
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
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
        </div>
      );
    case "matchup":
      return (
        <div className="grid gap-2">
          <select
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.disposition}
            onChange={(e) =>
              onReplace({ ...block, disposition: e.target.value as "target" | "threat" })
            }
          >
            <option value="target">Target (favorable focus)</option>
            <option value="threat">Threat (respect / counterplay)</option>
          </select>
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.opponent}
            onChange={(e) => onReplace({ ...block, opponent: e.target.value })}
            placeholder="Opponent hero name"
          />
          <textarea
            rows={3}
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.summary}
            onChange={(e) => onReplace({ ...block, summary: e.target.value })}
            placeholder="Summary / counterplay"
          />
          <p className="text-[10px] uppercase tracking-wide text-rivals-ink-muted">Clip (optional, YouTube)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
              value={block.clip?.label ?? ""}
              onChange={(e) => {
                const label = e.target.value.trim();
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
              onChange={(e) => {
                const href = e.target.value.trim();
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
    case "video":
      return (
        <div className="grid gap-2">
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.title}
            onChange={(e) => onReplace({ ...block, title: e.target.value })}
            placeholder="Title shown above player"
          />
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.watchUrl}
            onChange={(e) => onReplace({ ...block, watchUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
          />
        </div>
      );
    default:
      return null;
  }
}
