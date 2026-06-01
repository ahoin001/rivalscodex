"use client";

import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { formatKeybindLabel } from "@/features/heroes/keybind-display";

type AbilityTooltipProps = {
  ability: ResolvedAbilityRef;
  /** Delay (ms) before the tooltip appears on hover-capable devices. */
  hoverDelayMs?: number;
  children: ReactNode;
};

function usePrefersCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return coarse;
}

function AbilityTooltipContent({
  ability,
  position,
}: {
  ability: ResolvedAbilityRef;
  position: { x: number; y: number };
}) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[9999] w-72 -translate-x-1/2 -translate-y-full fade-slide-in rounded-lg border border-white/15 bg-[#161b28]/98 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-start gap-3">
        {ability.iconUrl ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-brand-gold/30 bg-[#1a1f2e]">
            <Image
              src={ability.iconUrl}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center rounded border border-white/20 bg-white/8 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white/70">
              {formatKeybindLabel(ability.keybind)}
            </span>
            <span className="truncate font-display text-xs font-bold uppercase italic text-white">
              {ability.name}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-white/65">{ability.description}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {ability.damage ? (
          <span className="rounded border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300">
            DMG {ability.damage}
          </span>
        ) : null}
        {ability.cooldownSeconds !== undefined && ability.cooldownSeconds > 0 ? (
          <span className="rounded border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-300">
            CD {ability.cooldownSeconds}s
          </span>
        ) : null}
        <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-white/50">
          {ability.type}
        </span>
      </div>

      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/15 bg-[#161b28]/98" />
    </div>
  );
}

export function AbilityTooltip({
  ability,
  hoverDelayMs = 200,
  children,
}: AbilityTooltipProps) {
  const coarsePointer = usePrefersCoarsePointer();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }, []);

  const clearPendingTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const close = useCallback(() => {
    clearPendingTimer();
    setVisible(false);
  }, [clearPendingTimer]);

  const showHover = useCallback(() => {
    if (coarsePointer) return;
    clearPendingTimer();
    timeoutRef.current = setTimeout(() => {
      open();
    }, hoverDelayMs);
  }, [coarsePointer, clearPendingTimer, open, hoverDelayMs]);

  const hideHover = useCallback(() => {
    if (coarsePointer) return;
    close();
  }, [coarsePointer, close]);

  const toggleTap = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      if (!coarsePointer) return;
      if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) {
        return;
      }
      setVisible((v) => {
        if (v) return false;
        updatePosition();
        return true;
      });
    },
    [coarsePointer, updatePosition],
  );

  useEffect(() => clearPendingTimer, [clearPendingTimer]);

  useEffect(() => {
    if (!visible || !coarsePointer) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visible, coarsePointer, close]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showHover}
        onMouseLeave={hideHover}
        onFocus={showHover}
        onBlur={hideHover}
        onClick={toggleTap}
        aria-expanded={coarsePointer ? visible : undefined}
        className="inline-flex"
      >
        {children}
      </span>

      {visible && typeof document !== "undefined"
        ? createPortal(
            <AbilityTooltipContent ability={ability} position={position} />,
            document.body,
          )
        : null}
    </>
  );
}
