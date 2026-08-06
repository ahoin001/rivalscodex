import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { RivalsHeroTitle } from "@/components/ui";
import { RivalsClipAction } from "@/components/ui/rivals-clip-action";
import type { Hero } from "@/data/schema";
import { RIVALS_FRAMES } from "@/lib/rivals-assets-paths";

export type AdjacentHeroLink = {
  slug: string;
  name: string;
};

type HeroLabShowcaseCardProps = {
  hero: Hero;
  className?: string;
  toolbarEnd?: ReactNode;
  previousHero?: AdjacentHeroLink | null;
  nextHero?: AdjacentHeroLink | null;
};

const roleColorByName: Record<Hero["role"], string> = {
  Vanguard: "text-rivals-vanguard",
  Duelist: "text-rivals-duelist",
  Strategist: "text-rivals-strategist",
};

const CHAPTER_RAIL = [
  { href: "#hero-codex-abilities", label: "Abilities" },
  { href: "#hero-guide", label: "Guide" },
  { href: "#hero-guide", label: "Combos", hashHint: "combos" as const },
] as const;

export function HeroLabShowcaseCard({
  hero,
  className = "",
  toolbarEnd,
  previousHero = null,
  nextHero = null,
}: HeroLabShowcaseCardProps) {
  const foregroundSrc = hero.splashImage;
  const frameSrc = hero.frameImage;
  const stackLogoSrc = hero.stackLogoImage;

  return (
    <section
      className={`hero-stage-shell hero-stage-showcase relative isolate w-full overflow-hidden bg-rivals-light-100 ${className}`.trim()}
      aria-label={`${hero.name} hero card`}
    >
      <div className="relative min-h-[560px] w-full aspect-[5/7] sm:min-h-[600px] sm:aspect-[16/10] lg:min-h-[640px] lg:aspect-[21/9] xl:min-h-[720px]">
        <Image
          src={RIVALS_FRAMES.hero}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden
          className="object-cover object-center"
        />

        {frameSrc ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden sm:block sm:w-[64%] lg:w-[58%] xl:w-[54%]">
            <Image
              src={frameSrc}
              alt=""
              fill
              sizes="(max-width: 1024px) 64vw, 58vw"
              className="object-cover object-right"
            />
          </div>
        ) : null}

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[14%] bg-gradient-to-b from-rivals-light-50/90 via-rivals-light-100/35 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[42%] bg-gradient-to-r from-rivals-light-50/95 via-rivals-light-100/60 to-transparent sm:block"
          aria-hidden
        />

        <div className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-7 sm:py-4 lg:px-10">
          <RivalsClipAction href="/" variant="surface">
            <span aria-hidden>&larr;</span>
            Back To Home
          </RivalsClipAction>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {previousHero ? (
              <RivalsClipAction
                href={`/heroes/${previousHero.slug}`}
                variant="gold-outline"
                size="sm"
                aria-label={`Previous hero: ${previousHero.name}`}
              >
                <span aria-hidden>&lsaquo;</span>
                <span className="hidden sm:inline">{previousHero.name}</span>
              </RivalsClipAction>
            ) : null}
            {nextHero ? (
              <RivalsClipAction
                href={`/heroes/${nextHero.slug}`}
                variant="gold-outline"
                size="sm"
                aria-label={`Next hero: ${nextHero.name}`}
              >
                <span className="hidden sm:inline">{nextHero.name}</span>
                <span aria-hidden>&rsaquo;</span>
              </RivalsClipAction>
            ) : null}
            {toolbarEnd}
          </div>
        </div>

        <div className="relative z-20 flex h-full w-full items-start px-5 pt-6 sm:items-center sm:px-10 sm:pt-0 lg:px-16 xl:px-24">
          <div className="w-full max-w-[88%] space-y-5 sm:max-w-[56%] lg:max-w-[52%]">
            <div className="flex items-center gap-3 sm:gap-4">
              <span
                className={`font-display text-lg font-bold uppercase italic tracking-[0.24em] ${roleColorByName[hero.role] ?? "text-rivals-ink"}`}
              >
                {hero.role}
              </span>
            </div>

            <div className="mt-1 sm:mt-2">
              <RivalsHeroTitle
                name={hero.name}
                description={hero.summary}
                size="xl"
                inlineName={false}
              />
            </div>

            {stackLogoSrc ? (
              <div className="hidden h-10 w-40 sm:block lg:h-12 lg:w-52">
                <Image
                  src={stackLogoSrc}
                  alt={`${hero.name} logo`}
                  width={208}
                  height={48}
                  className="h-full w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                />
              </div>
            ) : null}

            <nav
              aria-label="Hero chapters"
              className="flex flex-wrap gap-2 pt-1"
            >
              {CHAPTER_RAIL.map((chapter) => (
                <Link
                  key={`${chapter.label}-${chapter.href}`}
                  href={
                    "hashHint" in chapter && chapter.hashHint
                      ? `?tab=${chapter.hashHint}#hero-guide`
                      : chapter.href
                  }
                  className="rivals-clip-tab inline-flex min-h-10 items-center border border-brand-gold/55 bg-white/90 px-4 py-2 font-display text-[11px] font-bold uppercase italic tracking-[0.16em] text-rivals-ink shadow-[0_2px_12px_rgb(26_29_38/12%)] transition-[transform,background-color,border-color] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-brand-gold hover:bg-rivals-yellow-500 active:scale-[0.985]"
                >
                  {chapter.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div
          className="
            pointer-events-none absolute z-30
            top-14 right-0 bottom-0
            w-[76%] sm:top-16 sm:w-[62%] lg:w-[54%] xl:w-[50%]
          "
          id="hero-showcase-transition-target"
        >
          <Image
            src={foregroundSrc}
            alt={`${hero.name} full body art`}
            fill
            priority
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 58vw, 50vw"
            className="object-contain object-bottom object-right drop-shadow-[0_22px_40px_rgba(40,39,54,0.45)]"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[35] h-12 bg-gradient-to-t from-rivals-light-200/85 via-rivals-light-100/30 to-transparent sm:h-16"
          aria-hidden
        />
      </div>
    </section>
  );
}
