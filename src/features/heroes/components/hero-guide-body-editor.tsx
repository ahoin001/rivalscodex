"use client";

import { useCallback, useState } from "react";
import type { HeroGuideBlock, HeroGuideTabId } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { canUseBlockOnTab } from "@/features/heroes/hero-guide-blocks/registry";
import { ComboBlockEditor } from "@/features/heroes/components/combo-editor";

type HeroGuideBodyEditorProps = {
  tabId: HeroGuideTabId;
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

function blockTypeChipClass(block: HeroGuideBlock): string {
  switch (block.type) {
    case "combo":
      return "border-brand-gold/45 bg-brand-gold-muted/50 text-rivals-ink";
    case "matchup":
      if (block.disposition === "threat") {
        return "border-rose-300/70 bg-rose-50/80 text-rose-950";
      }
      if (block.disposition === "even") {
        return "border-amber-300/70 bg-amber-50/80 text-amber-950";
      }
      return "border-emerald-300/70 bg-emerald-50/80 text-emerald-950";
    case "abilityTip":
      return "border-cyan-300/70 bg-cyan-50/80 text-cyan-950";
    case "video":
      return "border-violet-300/70 bg-violet-50/80 text-violet-950";
    case "strengthsWeaknesses":
      return "border-[#1a2030]/20 bg-gradient-to-r from-emerald-50/80 via-rivals-light-100 to-rose-50/80 text-rivals-ink";
    default:
      return "border-rivals-light-300 bg-rivals-light-100 text-rivals-ink";
  }
}

function blockPreview(block: HeroGuideBlock): string {
  switch (block.type) {
    case "callout":
      return block.title ?? block.body;
    case "bullets":
      return block.items[0] ?? "Bullet list";
    case "twoColumn":
      return `${block.leftTitle} / ${block.rightTitle}`;
    case "combo":
      return `${block.name} (${block.steps.length} steps)`;
    case "matchup":
      return `${block.disposition}: ${block.opponent}`;
    case "abilityTip":
      return block.title ?? block.abilityRef;
    case "video":
      return block.title;
    case "strengthsWeaknesses":
      return `${block.strengths.length} strengths · ${block.weaknesses.length} weaknesses`;
  }
}

export function HeroGuideBodyEditor({ tabId, blocks, onChange, abilityLookup }: HeroGuideBodyEditorProps) {
  const isCombosTab = tabId === "combos";
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    isCombosTab && blocks.length > 0 ? 0 : null,
  );
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

  const isBlockExpanded = (index: number) =>
    isCombosTab ? expandedIndex === index : (expandedMap[index] ?? false);

  const toggleBlockExpanded = (index: number) => {
    if (isCombosTab) {
      setExpandedIndex((current) => (current === index ? null : index));
      return;
    }
    setExpandedMap((current) => ({ ...current, [index]: !current[index] }));
  };
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
      const next = [...blocks, block];
      onChange(next);
      if (isCombosTab && block.type === "combo") {
        setExpandedIndex(next.length - 1);
      }
    },
    [blocks, isCombosTab, onChange],
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
    <div className="min-w-0 space-y-3 overflow-hidden rounded-lg border border-rivals-light-300 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rivals-light-200 pb-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-display text-sm font-bold uppercase italic tracking-wide text-rivals-ink">
            {isCombosTab ? "Combos" : "Structured body"}
          </h3>
          <p className="max-w-prose text-[11px] leading-relaxed text-rivals-ink-muted">
            {isCombosTab
              ? "Each combo is its own card — expand one at a time to edit the chain."
              : "When present, these blocks replace priority/secondary cue columns on the live page."}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {canUseBlockOnTab(tabId, "callout") ? (
            <>
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
            </>
          ) : null}
          {canUseBlockOnTab(tabId, "strengthsWeaknesses") ? (
            <MiniAdd
              label="+ Pros & cons"
              onClick={() =>
                append({
                  type: "strengthsWeaknesses",
                  strengths: [
                    {
                      title: "Core strength headline",
                      detail: "Explain why this matters in real fights and when it spikes.",
                    },
                  ],
                  weaknesses: [
                    {
                      title: "Main limitation",
                      detail: "Explain how opponents punish this and what to watch for.",
                    },
                  ],
                })
              }
            />
          ) : null}
          {canUseBlockOnTab(tabId, "abilityTip") ? (
            <MiniAdd
              label="+ Ability tip"
              onClick={() =>
                append({
                  type: "abilityTip",
                  abilityRef: "ability-ref",
                  title: "Mechanic title",
                  body: "Explain the interaction, cancel window, and when to use it.",
                })
              }
            />
          ) : null}
          {canUseBlockOnTab(tabId, "combo") ? (
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
          ) : null}
          {canUseBlockOnTab(tabId, "matchup") ? (
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
          ) : null}
          {canUseBlockOnTab(tabId, "video") ? (
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
          ) : null}
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-rivals-light-300 bg-rivals-light-50 px-4 py-6 text-center text-xs leading-relaxed text-rivals-ink-muted">
          {isCombosTab
            ? "No combos yet — add one to build structured routes for this hero."
            : "No blocks yet — add one or rely on priority cues only."}
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block, index) => {
            const open = isBlockExpanded(index);
            const isCombo = block.type === "combo";

            return (
              <li
                key={`block-${index}-${block.type}`}
                className={`min-w-0 overflow-hidden rounded-lg border bg-rivals-light-50/50 ${
                  isCombo && open
                    ? "border-brand-gold/35 shadow-sm"
                    : "border-rivals-light-300"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleBlockExpanded(index)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={open}
                  >
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 font-display text-[10px] font-bold uppercase italic tracking-wide ${blockTypeChipClass(block)}`}
                    >
                      {block.type}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold text-rivals-ink">
                      {blockPreview(block)}
                    </span>
                    <span
                      className={`ml-auto shrink-0 text-[10px] text-rivals-ink-muted transition-transform duration-[var(--motion-medium)] ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    >
                      ▼
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    <BlockAction label="Up" onClick={() => move(index, -1)} disabled={index === 0} />
                    <BlockAction
                      label="Down"
                      onClick={() => move(index, 1)}
                      disabled={index === blocks.length - 1}
                    />
                    <BlockAction label="Delete" onClick={() => removeAt(index)} danger />
                  </div>
                </div>
                {open ? (
                  <div className="border-t border-rivals-light-300/80 bg-white px-3 py-3">
                    <BlockFields
                      block={block}
                      onReplace={(next) => replaceAt(index, next)}
                      abilityLookup={abilityLookup}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BlockAction({
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide disabled:opacity-35 ${
        danger
          ? "text-rose-800 hover:bg-rose-50"
          : "text-rivals-ink-soft hover:bg-rivals-light-100"
      }`}
    >
      {label}
    </button>
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
      return (
        <ComboBlockEditor
          block={block}
          abilityLookup={abilityLookup}
          onReplace={(next) => onReplace(next)}
        />
      );
    case "matchup":
      return (
        <div className="grid gap-2">
          <select
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.disposition}
            onChange={(e) =>
              onReplace({ ...block, disposition: e.target.value as "target" | "even" | "threat" })
            }
          >
            <option value="target">Target (favorable focus)</option>
            <option value="even">Even (skill matchup)</option>
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
    case "abilityTip":
      return (
        <div className="grid gap-2">
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.abilityRef}
            onChange={(e) => onReplace({ ...block, abilityRef: e.target.value })}
            placeholder="Ability reference slug or name"
          />
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.title ?? ""}
            onChange={(e) => onReplace({ ...block, title: e.target.value || undefined })}
            placeholder="Title (optional)"
          />
          <textarea
            rows={4}
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.body}
            onChange={(e) => onReplace({ ...block, body: e.target.value })}
            placeholder="Mechanic explanation"
          />
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={(block.tags ?? []).join(", ")}
            onChange={(e) =>
              onReplace({
                ...block,
                tags: e.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Tags (comma separated)"
          />
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
    case "strengthsWeaknesses":
      return (
        <div className="grid gap-4">
          <label className="grid gap-1 text-[11px]">
            <span className="text-rivals-ink-muted">Module title (optional)</span>
            <input
              className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
              value={block.title ?? ""}
              onChange={(e) => onReplace({ ...block, title: e.target.value || undefined })}
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
    default:
      return null;
  }
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
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2 rounded border border-rivals-light-300 bg-rivals-light-50/70 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[11px] font-bold uppercase italic text-rivals-ink">{label}</p>
        <button
          type="button"
          className="rounded border border-rivals-light-300 px-2 py-0.5 text-[10px] uppercase text-rivals-ink-soft hover:bg-white"
          onClick={() => onChange([...items, { title: "New point", detail: "Add detail for hover/tap reveal." }])}
        >
          + Row
        </button>
      </div>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="grid gap-1.5 rounded border border-rivals-light-300 bg-white p-2">
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={item.title}
            onChange={(e) => updateAt(index, { title: e.target.value })}
            placeholder="Short summary (shown in the grid)"
          />
          <textarea
            rows={3}
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={item.detail ?? ""}
            onChange={(e) => updateAt(index, { detail: e.target.value || undefined })}
            placeholder="Longer explanation (hover/tap tooltip)"
          />
          <button
            type="button"
            disabled={items.length <= 1}
            className="justify-self-start rounded border border-rose-200 px-2 py-0.5 text-[10px] uppercase text-rose-800 disabled:opacity-40"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove row
          </button>
        </div>
      ))}
    </div>
  );
}
