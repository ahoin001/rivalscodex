"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { HeroGuideProConItem } from "@/features/heroes/hero-guide-schema";

type ProConKind = "strength" | "weakness";

type BlockStrengthsWeaknessesProps = {
  title?: string;
  strengths: HeroGuideProConItem[];
  weaknesses: HeroGuideProConItem[];
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

function ProConIcon({ kind }: { kind: ProConKind }) {
  const isStrength = kind === "strength";

  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        isStrength
          ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-300"
          : "border-rose-400/45 bg-rose-500/15 text-rose-300"
      }`}
      aria-hidden
    >
      {isStrength ? (
        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none">
          <path
            d="M3 3 9 9M9 3 3 9"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

function DetailPopover({
  kind,
  item,
  position,
}: {
  kind: ProConKind;
  item: HeroGuideProConItem;
  position: { x: number; y: number };
}) {
  const isStrength = kind === "strength";

  return (
    <div
      role="tooltip"
      className="fade-slide-in pointer-events-none fixed z-[9999] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-full rounded-lg border border-white/12 bg-[#121726]/98 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
      style={{ left: position.x, top: position.y }}
    >
      <p
        className={`font-display text-[10px] font-bold uppercase italic tracking-[0.18em] ${
          isStrength ? "text-emerald-300/90" : "text-rose-300/90"
        }`}
      >
        {isStrength ? "Strength" : "Weakness"}
      </p>
      <p className="mt-1 font-display text-sm font-extrabold uppercase italic leading-snug text-white">
        {item.title}
      </p>
      {item.detail ? (
        <p className="mt-2 text-[12px] leading-5 text-white/72">{item.detail}</p>
      ) : null}
      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/12 bg-[#121726]/98" />
    </div>
  );
}

function ProConRow({ kind, item }: { kind: ProConKind; item: HeroGuideProConItem }) {
  const coarsePointer = usePrefersCoarsePointer();
  const hasDetail = Boolean(item.detail?.trim());
  const [expanded, setExpanded] = useState(false);
  const [hoverVisible, setHoverVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  }, []);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const openHover = useCallback(() => {
    if (!hasDetail || coarsePointer) return;
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setHoverVisible(true);
    }, 180);
  }, [hasDetail, coarsePointer, clearTimer, updatePosition]);

  const closeHover = useCallback(() => {
    clearTimer();
    setHoverVisible(false);
  }, [clearTimer]);

  const toggleExpand = useCallback(() => {
    if (!hasDetail || !coarsePointer) return;
    setExpanded((value) => !value);
  }, [hasDetail, coarsePointer]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!hasDetail) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (coarsePointer) {
          toggleExpand();
        } else {
          updatePosition();
          setHoverVisible((value) => !value);
        }
      }
      if (event.key === "Escape") {
        setExpanded(false);
        setHoverVisible(false);
      }
    },
    [hasDetail, coarsePointer, toggleExpand, updatePosition],
  );

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!expanded || !coarsePointer) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target)) return;
      setExpanded(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, coarsePointer]);

  const isStrength = kind === "strength";
  const interactive = hasDetail;

  return (
    <li className="min-w-0">
      <div
        ref={triggerRef}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={interactive ? (coarsePointer ? expanded : hoverVisible) : undefined}
        onMouseEnter={openHover}
        onMouseLeave={closeHover}
        onFocus={openHover}
        onBlur={closeHover}
        onClick={toggleExpand}
        onKeyDown={onKeyDown}
        className={`group/row flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors duration-150 ${
          interactive
            ? "cursor-help hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
            : ""
        }`}
      >
        <ProConIcon kind={kind} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-white/92 sm:text-[15px] sm:leading-6">
            {item.title}
          </p>
          {interactive ? (
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 transition-colors group-hover/row:text-brand-gold/75 group-focus-visible/row:text-brand-gold/75 sm:hidden">
              Tap for details
            </p>
          ) : null}
          {interactive ? (
            <p className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 transition-colors group-hover/row:text-brand-gold/75 group-focus-visible/row:text-brand-gold/75 sm:block">
              Hover for details
            </p>
          ) : null}
        </div>
        {interactive ? (
          <span
            className={`mt-1 hidden h-1.5 w-1.5 shrink-0 rounded-full sm:inline-block ${
              isStrength ? "bg-emerald-400/70" : "bg-rose-400/70"
            }`}
            aria-hidden
          />
        ) : null}
      </div>

      {coarsePointer && expanded && item.detail ? (
        <div className="panel-enter mx-2 mb-1 rounded-md border border-white/10 bg-black/35 px-3 py-2.5">
          <p className="text-[12px] leading-5 text-white/75">{item.detail}</p>
        </div>
      ) : null}

      {!coarsePointer && hoverVisible && item.detail && typeof document !== "undefined"
        ? createPortal(
            <DetailPopover kind={kind} item={item} position={position} />,
            document.body,
          )
        : null}
    </li>
  );
}

function ProConColumn({
  kind,
  label,
  items,
}: {
  kind: ProConKind;
  label: string;
  items: HeroGuideProConItem[];
}) {
  const isStrength = kind === "strength";

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`h-px flex-1 ${
            isStrength ? "bg-gradient-to-r from-transparent to-emerald-400/40" : "bg-gradient-to-r from-transparent to-rose-400/40"
          }`}
          aria-hidden
        />
        <p
          className={`font-display text-[11px] font-extrabold uppercase italic tracking-[0.2em] ${
            isStrength ? "text-emerald-300/90" : "text-rose-300/90"
          }`}
        >
          {label}
        </p>
        <span
          className={`h-px flex-1 ${
            isStrength ? "bg-gradient-to-l from-transparent to-emerald-400/40" : "bg-gradient-to-l from-transparent to-rose-400/40"
          }`}
          aria-hidden
        />
      </div>
      <ul className="space-y-0.5">
        {items.map((item, index) => (
          <ProConRow key={`${kind}-${item.title}-${index}`} kind={kind} item={item} />
        ))}
      </ul>
    </div>
  );
}

export function BlockStrengthsWeaknesses({
  title,
  strengths,
  weaknesses,
}: BlockStrengthsWeaknessesProps) {
  const heading = title?.trim() || "Strengths & Weaknesses";

  return (
    <article className="rivals-clip-row relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0f1219] via-[#141a28] to-[#171f30] shadow-[0_10px_36px_rgba(0,0,0,0.35)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,93,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/12 to-transparent md:block"
        aria-hidden
      />

      <header className="relative border-b border-white/10 px-4 py-3.5 sm:px-5">
        <p className="font-display text-[10px] font-bold uppercase italic tracking-[0.28em] text-brand-gold/85">
          Quick read
        </p>
        <h4 className="slanted-title mt-1 font-display text-xl font-extrabold uppercase italic leading-tight text-white sm:text-2xl">
          <span>{heading}</span>
        </h4>
        <p className="mt-1.5 text-[11px] leading-5 text-white/45">
          Scan the summary, then hover or tap any row with extra context for the full explanation.
        </p>
      </header>

      <div className="relative grid gap-5 p-4 sm:p-5 md:grid-cols-2 md:gap-6">
        <ProConColumn kind="strength" label="Strengths" items={strengths} />
        <ProConColumn kind="weakness" label="Weaknesses" items={weaknesses} />
      </div>
    </article>
  );
}
