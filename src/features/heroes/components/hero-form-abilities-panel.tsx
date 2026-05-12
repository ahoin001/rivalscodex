"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Hero } from "@/data/schema";
import {
  getDefaultResolvedFormId,
  getResolvedHeroForms,
  type ResolvedHeroForm,
} from "@/features/heroes/hero-forms";
import { HeroAbilitiesSection } from "@/features/heroes/components/hero-abilities-section";
import type { ExternalAbility, ExternalHero } from "@/lib/api/marvel-rivals";

type HeroFormAbilitiesPanelProps = {
  hero: Hero;
  /** Pre-mapped external hero so we don't re-derive playstyle/synergies per render. */
  heroAsExternal: ExternalHero;
  stackLogoUrl?: string;
  variant?: "panel" | "immersive";
};

/**
 * Convert a resolved form's abilities into the `ExternalAbility[]` shape that
 * `HeroAbilitiesSection` consumes via its `abilities` override prop.
 */
function formAbilitiesToExternal(form: ResolvedHeroForm): ExternalAbility[] {
  return form.abilities.map((ability) => ({
    name: ability.name,
    keybind: ability.keybind,
    type: ability.type,
    description: ability.description,
    damage: ability.damage,
    cooldownSeconds: ability.cooldownSeconds,
    iconUrl: ability.iconUrl ?? ability.videoUrl,
    category: ability.category,
    keybindIconUrl: ability.keybindIconUrl,
    stats: ability.stats,
    transformationId: form.id,
  }));
}

function formToTransformation(form: ResolvedHeroForm) {
  return {
    id: form.id,
    name: form.shortLabel ?? form.name,
    iconUrl: form.portraitImage,
    health: String(form.health),
    movementSpeed: "6m/s",
  };
}

/**
 * Wraps `HeroAbilitiesSection` with a `.xt-wrap`-style form tab strip. Single-
 * form heroes pass through unchanged (no tabs rendered). Form switches keep
 * the section mounted and just swap its `abilities` + `transformations` props,
 * with a brief opacity crossfade keyed off the active form id.
 */
export function HeroFormAbilitiesPanel({
  hero,
  heroAsExternal,
  stackLogoUrl,
  variant = "immersive",
}: HeroFormAbilitiesPanelProps) {
  const forms = useMemo(() => getResolvedHeroForms(hero), [hero]);
  const [activeFormId, setActiveFormId] = useState(() =>
    getDefaultResolvedFormId(hero),
  );
  const activeForm = forms.find((form) => form.id === activeFormId) ?? forms[0];

  const externalAbilities = useMemo(
    () => formAbilitiesToExternal(activeForm),
    [activeForm],
  );
  const externalTransformations = useMemo(
    () => [formToTransformation(activeForm)],
    [activeForm],
  );

  const showTabs = forms.length > 1;

  return (
    <div className="w-full">
      {showTabs ? (
        <nav
          aria-label={`${hero.name} forms`}
          className="mb-4 flex w-full justify-center sm:mb-6"
        >
          <ul className="flex max-w-full snap-x snap-mandatory items-center gap-3 overflow-x-auto px-1 pb-2 sm:gap-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-brand-gold/70 [&::-webkit-scrollbar-track]:bg-white/10">
            {forms.map((form) => {
              const isActive = form.id === activeFormId;
              return (
                <li key={form.id} className="snap-center">
                  <button
                    type="button"
                    onClick={() => setActiveFormId(form.id)}
                    aria-pressed={isActive}
                    aria-label={`Switch to ${form.name}`}
                    className={`group flex w-[5.5rem] flex-col items-center gap-1.5 transition sm:w-24 ${
                      isActive ? "text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    <span
                      className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border bg-black/70 transition-shadow sm:h-16 sm:w-16 ${
                        isActive
                          ? "border-brand-gold shadow-[0_0_0_2px_rgba(243,193,99,0.55),0_4px_18px_rgba(243,193,99,0.35)]"
                          : "border-white/35 group-hover:border-brand-gold/70"
                      }`}
                    >
                      {form.portraitImage ? (
                        <Image
                          src={form.portraitImage}
                          alt=""
                          width={72}
                          height={72}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-base italic uppercase">
                          {(form.shortLabel ?? form.name).charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="max-w-[5.5rem] truncate text-center text-[10px] font-semibold uppercase tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:max-w-[6rem] sm:text-[11px]">
                      {form.shortLabel ?? form.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {/*
        Keying off the active form id remounts the section, which gives us a
        free 150ms opacity crossfade via the inline animation below. The
        remount also resets the section's "selected ability" state — desired
        behavior, since each form has its own ability set.
      */}
      <div
        key={activeForm.id}
        className="hero-form-fade"
        style={{
          animation: "hero-form-fade 150ms ease-out both",
        }}
      >
        <HeroAbilitiesSection
          hero={heroAsExternal}
          stackLogoUrl={stackLogoUrl}
          abilities={externalAbilities}
          transformations={externalTransformations}
          variant={variant}
        />
      </div>
      <style jsx>{`
        @keyframes hero-form-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
