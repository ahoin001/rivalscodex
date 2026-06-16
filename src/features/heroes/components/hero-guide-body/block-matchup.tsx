"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroPortraitEntry } from "./types";
import { GuideClip } from "./guide-clip";

type Disposition = "target" | "even" | "threat";

const TONE: Record<
  Disposition,
  {
    shell: string;
    title: string;
    badge: string;
    accentBar: string;
    label: string;
  }
> = {
  target: {
    shell: "border-emerald-600/25 bg-emerald-50/40",
    title: "text-emerald-900/80",
    badge: "border-emerald-600/30 bg-emerald-100/60 text-emerald-800",
    accentBar: "bg-emerald-500",
    label: "Target",
  },
  even: {
    shell: "border-amber-500/30 bg-amber-50/40",
    title: "text-amber-900/80",
    badge: "border-amber-500/35 bg-amber-100/70 text-amber-800",
    accentBar: "bg-amber-500",
    label: "Even",
  },
  threat: {
    shell: "border-rose-500/30 bg-rose-50/45",
    title: "text-rose-900/80",
    badge: "border-rose-500/30 bg-rose-100/60 text-rose-800",
    accentBar: "bg-rose-500",
    label: "Threat",
  },
};

export function BlockMatchup({
  disposition,
  opponent,
  summary,
  clip,
  portrait,
}: {
  disposition: Disposition;
  opponent: string;
  summary: string;
  clip?: { label: string; href: string };
  portrait?: HeroPortraitEntry;
}) {
  const [expanded, setExpanded] = useState(false);
  const tone = TONE[disposition];

  return (
    <div className={`group overflow-hidden rounded border transition-all duration-200 hover:shadow-sm ${tone.shell}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {portrait ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-rivals-ink/10">
            <Image
              src={portrait.portraitUrl}
              alt={portrait.name}
              fill
              sizes="40px"
              className="object-cover"
            />
            <div className={`absolute bottom-0 left-0 h-0.5 w-full ${tone.accentBar}`} />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${tone.badge}`}>
              {tone.label}
            </span>
            <p className={`font-display text-sm font-bold uppercase italic tracking-wide ${tone.title}`}>
              {opponent}
            </p>
          </div>
          {/* Show the line-clamped preview only when collapsed; the expanded
              panel below renders the full version so we never paint the same
              text twice. */}
          {!expanded ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-rivals-ink-soft">
              {summary}
            </p>
          ) : null}
        </div>

        <span
          className={`shrink-0 text-rivals-ink-muted transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-[250ms] ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-rivals-ink/8 px-4 pb-4 pt-3">
            <p className="text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
              {summary}
            </p>

            {clip ? (
              <div className="max-w-lg">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-rivals-ink-muted">
                  Example clip
                </p>
                <GuideClip label={clip.label} href={clip.href} />
              </div>
            ) : null}

            {portrait ? (
              <Link
                href={`/heroes/${portrait.slug}`}
                className="inline-flex items-center gap-1.5 rounded border border-rivals-yellow-500/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rivals-yellow-700 transition-colors hover:bg-rivals-yellow-500/10"
              >
                View {portrait.name} guide
                <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
