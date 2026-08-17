"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";

type KeybindOverlayProps = {
  abilityLookup: Map<string, ResolvedAbilityRef>;
  heroName: string;
};

const KEY_LAYOUT = [
  { key: "Q", wide: false },
  { key: "W", wide: false },
  { key: "E", wide: false },
  { key: "F", wide: false },
  { key: "SHIFT", wide: true },
  { key: "SPACE", wide: true },
  { key: "LMB", wide: false },
  { key: "RMB", wide: false },
] as const;

export function KeybindOverlay({ abilityLookup, heroName }: KeybindOverlayProps) {
  const [open, setOpen] = useState(false);

  const keybindMap = useMemo(() => {
    const map = new Map<string, ResolvedAbilityRef>();
    for (const ref of abilityLookup.values()) {
      const normalized = formatKeybindLabel(ref.keybind);
      if (!map.has(normalized)) {
        map.set(normalized, ref);
      }
    }
    return map;
  }, [abilityLookup]);

  // Lock body scroll, close on Escape while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 border border-brand-gold/40 bg-brand-gold-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-gold transition-[color,background-color,border-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] hover:border-brand-gold hover:bg-brand-gold hover:text-ink-on-gold active:scale-[0.97]"
      >
        <span className="text-sm" aria-hidden>⌨</span>
        Keybinds
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${heroName} keybinds`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="relative mx-4 w-full max-w-lg fade-slide-in clipped-edge border border-white/15 bg-surface-input/98 p-6 shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close keybind overlay"
              className="absolute right-3 top-3 rounded p-1 text-white/50 transition-colors hover:text-white"
            >
              ✕
            </button>

            <h3 className="font-display text-lg font-extrabold uppercase italic text-white">
              {heroName} Keybinds
            </h3>

            <div className="mt-5 grid grid-cols-6 gap-2">
              {KEY_LAYOUT.map((keyDef) => {
                const ability = keybindMap.get(keyDef.key);
                return (
                  <div
                    key={keyDef.key}
                    className={`flex flex-col items-center gap-1 border p-2 transition-[background-color,border-color] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] ${
                      ability
                        ? "border-brand-gold/30 bg-surface-hud"
                        : "border-white/8 bg-white/3"
                    } ${keyDef.wide ? "col-span-2" : ""}`}
                  >
                    <span className="text-[10px] font-bold uppercase text-white/40">
                      {keyDef.key}
                    </span>
                    {ability ? (
                      <>
                        {ability.iconUrl ? (
                          <Image
                            src={ability.iconUrl}
                            alt={ability.name}
                            width={28}
                            height={28}
                            className="h-7 w-7 object-contain"
                          />
                        ) : null}
                        <span className="max-w-full truncate text-center text-[8px] font-semibold uppercase text-white/70">
                          {ability.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] text-white/20">—</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-1.5">
              {Array.from(keybindMap.entries())
                .filter(([key]) => !KEY_LAYOUT.some((k) => k.key === key))
                .map(([key, ability]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded border border-white/8 bg-white/3 px-3 py-1.5"
                  >
                    <span className="w-12 text-[10px] font-bold uppercase text-white/40">
                      {key}
                    </span>
                    {ability.iconUrl ? (
                      <Image
                        src={ability.iconUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain"
                      />
                    ) : null}
                    <span className="text-xs font-semibold text-white/70">
                      {ability.name}
                    </span>
                  </div>
                ))}
            </div>

            <p className="mt-4 text-center text-[10px] text-white/30">
              Press Esc or click the backdrop to close
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
