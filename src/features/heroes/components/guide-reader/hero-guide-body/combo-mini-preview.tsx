"use client";

import Image from "next/image";
import type { ComboStep } from "@/data/schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { resolveAbilityRef } from "@/features/heroes/ability-lookup";
import { AbilityTooltip } from "@/features/heroes/components/ability-tooltip";

const PREVIEW_COUNT = 4;

export function ComboMiniPreview({
  structuredSteps,
  abilityLookup,
}: {
  structuredSteps: ComboStep[];
  abilityLookup: Map<string, ResolvedAbilityRef>;
}) {
  const preview = structuredSteps.slice(0, PREVIEW_COUNT);
  const overflow = structuredSteps.length - PREVIEW_COUNT;

  return (
    <div className="flex items-center gap-1.5">
      {preview.map((step, index) => {
        if (step.kind === "action") {
          const repeatCount = step.repeat && step.repeat > 1 ? step.repeat : 1;
          return (
            <div
              key={`mini-action-${index}`}
              className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-rivals-ink/20 bg-rivals-light-100 px-0.5 pt-0.5"
            >
              {repeatCount > 1 ? (
                <span className="pointer-events-none absolute -right-2 -top-2 z-10 flex h-4 min-w-4 items-center justify-center rounded-full border border-brand-gold/55 bg-white px-0.5 text-[8px] font-bold text-brand-gold shadow-sm">
                  ×{repeatCount}
                </span>
              ) : null}
              <span className="line-clamp-2 text-center text-[8px] font-semibold uppercase leading-tight text-rivals-ink-muted">
                {step.label}
              </span>
            </div>
          );
        }

        const resolved = resolveAbilityRef(step.abilityRef, abilityLookup);
        const repeatCount = step.repeat && step.repeat > 1 ? step.repeat : 1;
        if (!resolved) {
          return (
            <div
              key={`mini-missing-${index}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-rivals-ink/15 bg-rivals-light-200 text-[8px] text-rivals-ink-muted"
            >
              ?
            </div>
          );
        }

        return (
          <AbilityTooltip key={`mini-${index}-${step.abilityRef}`} ability={resolved}>
            <div className="flex w-11 shrink-0 flex-col items-center gap-0.5 pt-0.5">
              <div className="relative">
                {repeatCount > 1 ? (
                  <span className="pointer-events-none absolute -right-2 -top-2 z-10 flex h-4 min-w-4 items-center justify-center rounded-full border border-brand-gold/55 bg-white px-0.5 text-[8px] font-bold text-brand-gold shadow-sm">
                    ×{repeatCount}
                  </span>
                ) : null}
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md border border-brand-gold/35 bg-white shadow-sm">
                  {resolved.iconUrl ? (
                    <Image
                      src={resolved.iconUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <span className="text-[9px] font-bold uppercase text-rivals-ink-muted">
                      {resolved.name.slice(0, 2)}
                    </span>
                  )}
                </div>
              </div>
              <span className="line-clamp-2 max-w-[2.75rem] text-center text-[9px] leading-tight text-rivals-ink-soft">
                {resolved.name}
              </span>
            </div>
          </AbilityTooltip>
        );
      })}
      {overflow > 0 ? (
        <span className="shrink-0 rounded-full border border-rivals-light-300 bg-white px-2 py-1 text-[10px] font-bold text-rivals-ink-muted">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
