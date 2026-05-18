"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { ComboStep, ComboModifier, ComboDifficulty, ComboResourceCost } from "@/data/schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { resolveAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";
import {
  getDifficultyTier,
  getModifierDescriptor,
} from "@/features/heroes/combo-display";

type ComboChainProps = {
  name: string;
  structuredSteps: ComboStep[];
  abilityLookup: Map<string, ResolvedAbilityRef>;
  difficulty?: ComboDifficulty;
  resourceCost?: ComboResourceCost;
  condition?: string;
  className?: string;
};

function StepConnector({ modifier }: { modifier?: ComboModifier }) {
  const descriptor = getModifierDescriptor(modifier);
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-1 sm:px-2">
      <span
        className={`font-display text-lg font-bold leading-none sm:text-xl ${descriptor.arrowClass}`}
        aria-hidden
      >
        {descriptor.symbol}
      </span>
      {descriptor.microLabel ? (
        <span className="text-[9px] uppercase tracking-[0.14em] text-white/50 sm:text-[10px]">
          {descriptor.microLabel}
        </span>
      ) : null}
    </div>
  );
}

function AbilityNode({
  resolved,
  resourceDelta,
}: {
  resolved: ResolvedAbilityRef;
  resourceDelta?: number;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5" style={{ minWidth: "4.5rem" }}>
      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-brand-gold/45 bg-[#1a1f2e] shadow-[0_0_8px_rgba(201,162,93,0.12)] transition-all duration-200 hover:border-brand-gold hover:shadow-[0_0_16px_rgba(201,162,93,0.25)] hover:-translate-y-0.5">
        {resolved.iconUrl ? (
          <Image
            src={resolved.iconUrl}
            alt={resolved.name}
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
          />
        ) : (
          <span className="text-[10px] font-bold uppercase text-white/60">
            {resolved.name.slice(0, 3)}
          </span>
        )}
      </div>

      <span className="max-w-[5rem] truncate text-center font-display text-[10px] uppercase leading-tight tracking-wide text-white/80 sm:text-[11px]">
        {resolved.name}
      </span>

      <span className="inline-flex h-5 items-center justify-center rounded border border-white/20 bg-white/8 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white/70 sm:text-[10px]">
        {formatKeybindLabel(resolved.keybind)}
      </span>

      {resourceDelta !== undefined && resourceDelta !== 0 ? (
        <span
          className={`text-[10px] font-bold tabular-nums ${
            resourceDelta > 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {resourceDelta > 0 ? "+" : ""}
          {resourceDelta}
        </span>
      ) : null}
    </div>
  );
}

function ActionNode({
  label,
  resourceDelta,
}: {
  label: string;
  resourceDelta?: number;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5" style={{ minWidth: "4.5rem" }}>
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-white/25 bg-[#1a1f2e]/60 transition-all duration-200 hover:border-white/40">
        <span className="px-1 text-center text-[9px] font-semibold uppercase leading-tight text-white/50">
          {label}
        </span>
      </div>

      <span className="max-w-[5rem] truncate text-center text-[10px] leading-tight text-white/50 sm:text-[11px]">
        {label}
      </span>

      <span className="h-5" />

      {resourceDelta !== undefined && resourceDelta !== 0 ? (
        <span
          className={`text-[10px] font-bold tabular-nums ${
            resourceDelta > 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {resourceDelta > 0 ? "+" : ""}
          {resourceDelta}
        </span>
      ) : null}
    </div>
  );
}

export function ComboChain({
  name,
  structuredSteps,
  abilityLookup,
  difficulty,
  resourceCost,
  condition,
  className = "",
}: ComboChainProps) {
  const resolvedSteps = useMemo(
    () =>
      structuredSteps.map((step, index) => ({
        step,
        resolved:
          step.kind === "ability"
            ? resolveAbilityRef(step.abilityRef, abilityLookup)
            : null,
        resourceDelta: resourceCost?.perStepDelta?.[index],
      })),
    [structuredSteps, abilityLookup, resourceCost],
  );

  const diffTier = getDifficultyTier(difficulty);
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={revealRef}
      className={`scroll-reveal overflow-hidden rounded-lg border border-white/12 bg-[#161b28]/95 shadow-[0_6px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className}`}
    >
      {/* Header band */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#1e2436]/80 px-4 py-2.5 sm:px-5">
        <h4 className="font-display text-sm font-extrabold uppercase italic tracking-wide text-white sm:text-base">
          {name}
        </h4>

        {diffTier ? (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${diffTier.darkClass}`}
          >
            {diffTier.label}
          </span>
        ) : null}

        {resourceCost ? (
          <span className="ml-auto rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">
            Requires {resourceCost.startingAmount} {resourceCost.resourceName}
          </span>
        ) : null}
      </div>

      {condition ? (
        <p className="border-b border-white/6 px-4 py-2 text-xs leading-5 text-white/50 sm:px-5">
          {condition}
        </p>
      ) : null}

      {/* Chain body with horizontal scroll on mobile */}
      <div className="relative">
        {/* Fade-out gradients for horizontal scroll */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#161b28] to-transparent sm:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#161b28] to-transparent sm:hidden" />

        <div
          className="stagger-children flex items-start gap-0 overflow-x-auto px-4 py-5 sm:flex-wrap sm:justify-center sm:gap-0 sm:overflow-x-visible sm:px-5 sm:py-6"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {resolvedSteps.map(({ step, resolved, resourceDelta }, index) => (
            <div
              key={index}
              className="flex shrink-0 items-start"
              style={{ scrollSnapAlign: "center" }}
            >
              {index > 0 ? (
                <StepConnector modifier={step.modifier} />
              ) : null}

              {step.kind === "ability" && resolved ? (
                <AbilityNode
                  resolved={resolved}
                  resourceDelta={resourceDelta}
                />
              ) : step.kind === "ability" ? (
                <ActionNode
                  label={step.abilityRef}
                  resourceDelta={resourceDelta}
                />
              ) : (
                <ActionNode
                  label={step.label}
                  resourceDelta={resourceDelta}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
