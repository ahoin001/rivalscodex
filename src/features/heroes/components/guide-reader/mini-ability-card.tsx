"use client";

import { useState } from "react";
import Image from "next/image";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";

type MiniAbilityCardProps = {
  ability: ResolvedAbilityRef;
  tip?: string;
  className?: string;
};

export function MiniAbilityCard({
  ability,
  tip,
  className = "",
}: MiniAbilityCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group overflow-hidden rounded-lg border border-rivals-ink/10 bg-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-gold/30 hover:shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left sm:px-4"
      >
        {ability.iconUrl ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-brand-gold/25 bg-[#1a1f2e]">
            <Image
              src={ability.iconUrl}
              alt={ability.name}
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-rivals-ink/15 bg-rivals-light-200">
            <span className="text-[10px] font-bold uppercase text-rivals-ink-muted">
              {ability.name.slice(0, 2)}
            </span>
          </div>
        )}

        <span className="inline-flex h-5 items-center justify-center rounded border border-white/20 bg-rivals-light-200/80 px-1.5 text-[9px] font-bold uppercase tracking-wide text-rivals-ink-muted">
          {formatKeybindLabel(ability.keybind)}
        </span>

        <span className="min-w-0 flex-1 truncate font-display text-xs font-bold uppercase italic tracking-wide text-rivals-ink sm:text-sm">
          {ability.name}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          {ability.cooldownSeconds !== undefined && ability.cooldownSeconds > 0 ? (
            <span className="rounded border border-rivals-ink/10 bg-rivals-light-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-rivals-ink-muted">
              CD: {ability.cooldownSeconds}s
            </span>
          ) : null}
          {ability.damage ? (
            <span className="rounded border border-rivals-ink/10 bg-rivals-light-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-rivals-ink-muted">
              DMG: {ability.damage}
            </span>
          ) : null}
        </div>

        <span
          className={`shrink-0 text-xs text-rivals-ink-muted transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {tip && !expanded ? (
        <p className="border-t border-rivals-ink/6 px-3 py-2 text-xs leading-5 text-rivals-ink-soft sm:px-4 sm:text-[13px]">
          {tip}
        </p>
      ) : null}

      {/* Expandable full description */}
      <div
        className={`grid transition-[grid-template-rows] duration-[220ms] ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 border-t border-rivals-ink/8 px-3 pb-3 pt-2.5 sm:px-4">
            <p className="text-xs leading-5 text-rivals-ink-soft sm:text-[13px] sm:leading-6">
              {ability.description}
            </p>
            {tip ? (
              <div className="rounded border border-rivals-yellow-500/20 bg-rivals-yellow-500/8 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-rivals-yellow-700">
                  Tip
                </p>
                <p className="mt-1 text-xs leading-5 text-rivals-ink-soft">
                  {tip}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
