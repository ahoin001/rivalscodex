"use client";

import Image from "next/image";
import Link from "next/link";
import { HeroPortraitTransition } from "@/features/heroes/transition";

type HeroPartnerLinkProps = {
  slug: string;
  name: string;
  portraitUrl: string;
  label?: string;
  variant?: "row" | "chip";
  className?: string;
  frameClassName?: string;
  ariaLabel?: string;
};

export function HeroPartnerLink({
  slug,
  name,
  portraitUrl,
  label = "Partner",
  variant = "row",
  className = "",
  frameClassName = "",
  ariaLabel,
}: HeroPartnerLinkProps) {
  if (variant === "chip") {
    return (
      <Link
        href={`/heroes/${slug}`}
        className={`inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 ${className}`.trim()}
        aria-label={ariaLabel ?? name}
      >
        <HeroPortraitTransition slug={slug} className="relative block h-9 w-9 sm:h-10 sm:w-10">
          <span
            className={`relative block h-full w-full overflow-hidden rivals-clip-row bg-surface-input ${frameClassName}`.trim()}
          >
            <Image src={portraitUrl} alt="" fill sizes="40px" className="object-cover object-top" />
          </span>
        </HeroPortraitTransition>
      </Link>
    );
  }

  return (
    <Link
      href={`/heroes/${slug}`}
      className={`mt-4 flex items-center gap-3 border-t border-rivals-light-300 pt-3 transition-[transform] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 active:scale-[0.97] ${className}`.trim()}
      aria-label={ariaLabel ?? `${label}: ${name}`}
    >
      <HeroPortraitTransition slug={slug} className="relative h-12 w-12">
        <span className="relative block h-12 w-12 overflow-hidden rivals-clip-row bg-rivals-ink">
          <Image src={portraitUrl} alt="" fill sizes="48px" className="object-cover object-top" />
        </span>
      </HeroPortraitTransition>
      <span>
        <span className="block font-display text-[10px] font-bold uppercase tracking-[0.18em] text-rivals-ink-muted">
          {label}
        </span>
        <span className="font-display text-sm font-bold uppercase italic text-rivals-ink">
          {name}
        </span>
      </span>
    </Link>
  );
}
