"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  consumeHeroRouteTransitionForSlug,
  type HeroRouteTransitionPayload,
} from "@/features/heroes/transition/hero-route-transition";

type HeroRouteTransitionLayerProps = {
  heroSlug: string;
};

const roleClassByName: Record<HeroRouteTransitionPayload["role"], string> = {
  Vanguard: "text-rivals-vanguard",
  Duelist: "text-rivals-duelist",
  Strategist: "text-rivals-strategist",
};

export function HeroRouteTransitionLayer({ heroSlug }: HeroRouteTransitionLayerProps) {
  const [payload] = useState<HeroRouteTransitionPayload | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      return null;
    }
    return consumeHeroRouteTransitionForSlug(heroSlug);
  });
  const [dismissed, setDismissed] = useState(false);

  const style = useMemo(() => {
    if (!payload) return undefined;
    return {
      left: `${payload.rect.left}px`,
      top: `${payload.rect.top}px`,
      width: `${payload.rect.width}px`,
      height: `${payload.rect.height}px`,
    };
  }, [payload]);

  if (dismissed || !payload || !style) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      aria-hidden
    >
      <div
        style={style}
        className="hero-route-transition-card hero-route-transition-card-active absolute overflow-hidden rounded-xl border border-brand-gold/55 bg-rivals-ink shadow-[0_14px_44px_rgba(0,0,0,0.58)]"
        onAnimationEnd={() => setDismissed(true)}
      >
        <Image
          src={payload.portraitImage}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="font-display text-2xl font-extrabold uppercase italic text-white">
            {payload.name}
          </p>
          <p
            className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${roleClassByName[payload.role]}`}
          >
            {payload.role}
          </p>
        </div>
      </div>
    </div>
  );
}
