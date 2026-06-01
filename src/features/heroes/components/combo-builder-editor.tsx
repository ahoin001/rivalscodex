"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { ComboStep, ComboModifier, ComboDifficulty } from "@/data/schema";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { slugifyAbilityName } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";
import {
  DIFFICULTY_TIERS,
  MODIFIER_DESCRIPTORS,
} from "@/features/heroes/combo-display";
import { AbilityTooltip } from "@/features/heroes/components/ability-tooltip";
import { ComboChain } from "@/features/heroes/components/combo-chain";

type ComboBuilderEditorProps = {
  block: Extract<HeroGuideBlock, { type: "combo" }>;
  abilityLookup: Map<string, ResolvedAbilityRef>;
  onReplace: (next: Extract<HeroGuideBlock, { type: "combo" }>) => void;
};

const MODIFIER_OPTIONS: { value: ComboModifier | ""; label: string }[] = [
  { value: "", label: "Normal →" },
  ...MODIFIER_DESCRIPTORS.map((m) => ({
    value: m.key as ComboModifier | "",
    label: m.authorLabel,
  })),
];

const DIFFICULTY_OPTIONS: { value: ComboDifficulty | ""; label: string }[] = [
  { value: "", label: "No difficulty tag" },
  ...DIFFICULTY_TIERS.map((t) => ({
    value: t.key as ComboDifficulty | "",
    label: t.label,
  })),
];

export function ComboBuilderEditor({
  block,
  abilityLookup,
  onReplace,
}: ComboBuilderEditorProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [showRawJson, setShowRawJson] = useState(false);

  const abilities = useMemo(
    () => Array.from(abilityLookup.entries()),
    [abilityLookup],
  );

  const filteredAbilities = useMemo(() => {
    if (!searchFilter.trim()) return abilities;
    const lower = searchFilter.toLowerCase();
    return abilities.filter(
      ([, ref]) =>
        ref.name.toLowerCase().includes(lower) ||
        ref.keybind.toLowerCase().includes(lower),
    );
  }, [abilities, searchFilter]);

  const steps = block.structuredSteps ?? [];

  const updateSteps = useCallback(
    (next: ComboStep[]) => {
      const textSteps = next.map((s) =>
        s.kind === "ability" ? s.abilityRef : s.label,
      );
      onReplace({
        ...block,
        structuredSteps: next.length > 0 ? next : undefined,
        steps: textSteps.length > 0 ? textSteps : block.steps,
      });
    },
    [block, onReplace],
  );

  const addAbilityStep = useCallback(
    (slug: string) => {
      const newStep: ComboStep = { kind: "ability", abilityRef: slug };
      updateSteps([...steps, newStep]);
    },
    [steps, updateSteps],
  );

  const addActionStep = useCallback(() => {
    const newStep: ComboStep = { kind: "action", label: "action" };
    updateSteps([...steps, newStep]);
  }, [steps, updateSteps]);

  const removeStep = useCallback(
    (index: number) => {
      updateSteps(steps.filter((_, i) => i !== index));
    },
    [steps, updateSteps],
  );

  const updateStepModifier = useCallback(
    (index: number, modifier: ComboModifier | undefined) => {
      updateSteps(
        steps.map((s, i) =>
          i === index ? { ...s, modifier } : s,
        ),
      );
    },
    [steps, updateSteps],
  );

  const updateActionLabel = useCallback(
    (index: number, label: string) => {
      updateSteps(
        steps.map((s, i) =>
          i === index && s.kind === "action" ? { ...s, label } : s,
        ),
      );
    },
    [steps, updateSteps],
  );

  const moveStep = useCallback(
    (index: number, dir: -1 | 1) => {
      const j = index + dir;
      if (j < 0 || j >= steps.length) return;
      const next = [...steps];
      [next[index], next[j]] = [next[j], next[index]];
      updateSteps(next);
    },
    [steps, updateSteps],
  );

  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-[11px]">
          <span className="text-rivals-ink-muted">Combo name</span>
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.name}
            onChange={(e) => onReplace({ ...block, name: e.target.value })}
            placeholder="Combo name"
          />
        </label>
        <label className="grid gap-1 text-[11px]">
          <span className="text-rivals-ink-muted">Difficulty</span>
          <select
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.difficulty ?? ""}
            onChange={(e) =>
              onReplace({
                ...block,
                difficulty: e.target.value
                  ? (e.target.value as ComboDifficulty)
                  : undefined,
              })
            }
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        className="w-full rounded border border-rivals-light-300 px-2 py-1 text-sm"
        value={block.condition ?? ""}
        onChange={(e) =>
          onReplace({
            ...block,
            condition: e.target.value.trim() ? e.target.value : undefined,
          })
        }
        placeholder="Condition / prereq (short, optional)"
      />

      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Tags (comma-separated, max 4)</span>
        <input
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={(block.tags ?? []).join(", ")}
          onChange={(e) => {
            const tags = e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
              .slice(0, 4);
            onReplace({
              ...block,
              tags: tags.length > 0 ? tags : undefined,
            });
          }}
          placeholder="275, Burst, Anti-dive"
        />
      </label>

      <label className="grid gap-1 text-[11px]">
        <span className="text-rivals-ink-muted">Notes (optional)</span>
        <textarea
          rows={2}
          className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
          value={block.notes ?? ""}
          onChange={(e) =>
            onReplace({
              ...block,
              notes: e.target.value.trim() ? e.target.value : undefined,
            })
          }
          placeholder="When to use this route, matchup context, etc."
        />
      </label>

      {/* Resource cost */}
      <details className="rounded border border-rivals-light-300 bg-rivals-light-50 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
          Resource cost (optional)
        </summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.resourceCost?.resourceName ?? ""}
            onChange={(e) => {
              const name = e.target.value.trim();
              if (!name) {
                onReplace({ ...block, resourceCost: undefined });
                return;
              }
              onReplace({
                ...block,
                resourceCost: {
                  resourceName: name,
                  startingAmount: block.resourceCost?.startingAmount ?? 0,
                  perStepDelta: block.resourceCost?.perStepDelta,
                },
              });
            }}
            placeholder="Resource name (e.g. Fortune)"
          />
          <input
            type="number"
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm"
            value={block.resourceCost?.startingAmount ?? ""}
            onChange={(e) => {
              const amount = parseInt(e.target.value, 10);
              if (isNaN(amount) || !block.resourceCost?.resourceName) return;
              onReplace({
                ...block,
                resourceCost: {
                  ...block.resourceCost,
                  resourceName: block.resourceCost.resourceName,
                  startingAmount: amount,
                },
              });
            }}
            placeholder="Starting amount"
          />
          <input
            className="rounded border border-rivals-light-300 px-2 py-1 text-sm font-mono"
            value={
              block.resourceCost?.perStepDelta?.join(", ") ?? ""
            }
            onChange={(e) => {
              const vals = e.target.value
                .split(",")
                .map((v) => parseInt(v.trim(), 10))
                .filter((v) => !isNaN(v));
              if (!block.resourceCost?.resourceName) return;
              onReplace({
                ...block,
                resourceCost: {
                  ...block.resourceCost,
                  resourceName: block.resourceCost.resourceName,
                  startingAmount: block.resourceCost.startingAmount,
                  perStepDelta: vals.length > 0 ? vals : undefined,
                },
              });
            }}
            placeholder="Per-step deltas (e.g. 300, -200, -150)"
          />
        </div>
      </details>

      {/* Ability palette */}
      <div className="rounded border border-rivals-light-300 bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
            Ability palette
          </span>
          <input
            type="search"
            className="w-40 rounded border border-rivals-light-300 px-2 py-0.5 text-xs"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search abilities..."
          />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
          {filteredAbilities.map(([slug, ref]) => (
            <AbilityTooltip key={slug} ability={ref}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  addAbilityStep(slug);
                }}
                className="flex w-full flex-col items-center gap-1 rounded border border-rivals-light-300 bg-rivals-light-50 p-2 text-center transition-all hover:-translate-y-0.5 hover:border-brand-gold/40 hover:shadow-sm"
              >
                {ref.iconUrl ? (
                  <Image
                    src={ref.iconUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-rivals-light-200 text-[8px] font-bold uppercase text-rivals-ink-muted">
                    {ref.name.slice(0, 3)}
                  </div>
                )}
                <span className="text-[9px] font-semibold uppercase leading-tight text-rivals-ink-soft">
                  {formatKeybindLabel(ref.keybind)}
                </span>
                <span className="max-w-full truncate text-[9px] leading-tight text-rivals-ink-muted">
                  {ref.name}
                </span>
              </button>
            </AbilityTooltip>
          ))}
        </div>
        <button
          type="button"
          onClick={addActionStep}
          className="mt-2 rounded border border-dashed border-rivals-light-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-rivals-ink-muted hover:bg-rivals-light-100"
        >
          + Add freeform action
        </button>
      </div>

      {/* Chain editor */}
      {steps.length > 0 ? (
        <div className="space-y-2 rounded border border-rivals-light-300 bg-white p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
            Combo chain ({steps.length} steps)
          </span>
          <div className="space-y-1.5">
            {steps.map((step, index) => {
              const ref =
                step.kind === "ability"
                  ? abilityLookup.get(
                      slugifyAbilityName(step.abilityRef),
                    ) ?? abilityLookup.get(step.abilityRef)
                  : null;

              return (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded border border-rivals-light-200 bg-rivals-light-50 px-2 py-1.5"
                >
                  <span className="w-5 shrink-0 text-center text-[10px] font-bold text-rivals-ink-muted">
                    {index + 1}
                  </span>

                  {step.kind === "ability" && ref ? (
                    <div className="flex items-center gap-1.5">
                      {ref.iconUrl ? (
                        <Image
                          src={ref.iconUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain"
                        />
                      ) : null}
                      <span className="text-xs font-semibold text-rivals-ink">
                        {ref.name}
                      </span>
                      <span className="text-[9px] text-rivals-ink-muted">
                        [{formatKeybindLabel(ref.keybind)}]
                      </span>
                    </div>
                  ) : step.kind === "action" ? (
                    <input
                      className="w-32 rounded border border-rivals-light-300 px-1.5 py-0.5 text-xs"
                      value={step.label}
                      onChange={(e) =>
                        updateActionLabel(index, e.target.value)
                      }
                      placeholder="Action label"
                    />
                  ) : step.kind === "ability" ? (
                    <span className="text-xs italic text-rivals-ink-muted">
                      (unresolved: {step.abilityRef})
                    </span>
                  ) : null}

                  {index > 0 ? (
                    <select
                      className="ml-auto rounded border border-rivals-light-300 px-1 py-0.5 text-[10px]"
                      value={step.modifier ?? ""}
                      onChange={(e) =>
                        updateStepModifier(
                          index,
                          e.target.value
                            ? (e.target.value as ComboModifier)
                            : undefined,
                        )
                      }
                    >
                      {MODIFIER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="ml-auto text-[9px] text-rivals-ink-muted">
                      start
                    </span>
                  )}

                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      className="rounded px-1 py-0.5 text-[9px] text-rivals-ink-soft hover:bg-rivals-light-200 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 1)}
                      disabled={index === steps.length - 1}
                      className="rounded px-1 py-0.5 text-[9px] text-rivals-ink-soft hover:bg-rivals-light-200 disabled:opacity-30"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="rounded px-1 py-0.5 text-[9px] text-rose-600 hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Live preview */}
      {steps.length > 0 ? (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
            Live preview
          </span>
          <ComboChain
            name={block.name || "Unnamed combo"}
            structuredSteps={steps}
            abilityLookup={abilityLookup}
            difficulty={block.difficulty}
            resourceCost={block.resourceCost}
            condition={block.condition}
            notes={block.notes}
          />
        </div>
      ) : null}

      {/* Clip */}
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-wide text-rivals-ink-muted">
          Clip (optional, YouTube)
        </p>
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
            placeholder="Clip label"
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

      {/* Raw JSON toggle */}
      <details
        open={showRawJson}
        onToggle={(e) =>
          setShowRawJson((e.target as HTMLDetailsElement).open)
        }
      >
        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
          Show raw JSON
        </summary>
        <pre className="mt-1 max-h-40 overflow-auto rounded border border-rivals-light-300 bg-rivals-light-50 p-2 font-mono text-[10px] leading-relaxed text-rivals-ink-soft">
          {JSON.stringify(block, null, 2)}
        </pre>
      </details>

      {/* Legacy text steps */}
      <details className="rounded border border-rivals-light-300 bg-rivals-light-50 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-rivals-ink-muted">
          Fallback text steps
        </summary>
        <p className="mt-1 text-[10px] text-rivals-ink-muted">
          Auto-populated from structured steps. Edit only if you need pure-text fallback for heroes without icons.
        </p>
        <textarea
          rows={3}
          className="mt-1 w-full rounded border border-rivals-light-300 px-2 py-1 text-xs font-mono"
          value={block.steps.join("\n")}
          onChange={(e) => {
            const lines = e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l.length > 0);
            onReplace({ ...block, steps: lines.length > 0 ? lines : ["Step 1"] });
          }}
        />
      </details>
    </div>
  );
}
