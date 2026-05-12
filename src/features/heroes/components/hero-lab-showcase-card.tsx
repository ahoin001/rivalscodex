import Image from "next/image";
import Link from "next/link";
import { RivalsHeroTitle } from "@/components/ui";
import type { Hero } from "@/data/schema";
import heroFrameImage from "../../../../rivals-assets/frames/hero-frame.jpg";

type HeroLabShowcaseCardProps = {
  hero: Hero;
  className?: string;
};

const roleColorByName: Record<Hero["role"], string> = {
  Vanguard: "text-rivals-vanguard",
  Duelist: "text-rivals-duelist",
  Strategist: "text-rivals-strategist",
};

export function HeroLabShowcaseCard({ hero, className = "" }: HeroLabShowcaseCardProps) {
  const foregroundSrc = hero.splashImage;
  const frameSrc = hero.frameImage;
  const stackLogoSrc = hero.stackLogoImage;

  return (
    <section
      className={`relative isolate w-full overflow-hidden bg-rivals-light-100 ${className}`.trim()}
      aria-label={`${hero.name} hero card`}
    >
      <div className="relative min-h-[520px] w-full aspect-[5/7] sm:min-h-[560px] sm:aspect-[16/10] lg:min-h-[600px] lg:aspect-[21/9] xl:min-h-[680px]">
        <Image
          src={heroFrameImage}
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
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[20%] bg-gradient-to-b from-rivals-light-50/90 via-rivals-light-100/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[42%] bg-gradient-to-r from-rivals-light-50/95 via-rivals-light-100/60 to-transparent sm:block"
          aria-hidden
        />

        <div className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-7 sm:py-4 lg:px-10">
          <Link
            href="/"
            className="rivals-clip-tab inline-flex items-center gap-2 bg-rivals-ink/92 px-4 py-2 font-display text-[11px] uppercase italic tracking-[0.18em] text-white transition-colors hover:bg-rivals-ink-soft"
          >
            <span aria-hidden>&larr;</span>
            Back To Home
          </Link>
          <p className="hidden text-[11px] uppercase tracking-[0.28em] text-rivals-ink/70 sm:block">
            Hero Detail
          </p>
        </div>

        <div className="relative z-20 flex h-full w-full items-start px-5 pt-6 sm:items-center sm:px-10 sm:pt-0 lg:px-16 xl:px-24">
          <div className="w-full max-w-[62%] sm:max-w-[56%] lg:max-w-[60%] xl:max-w-[56%]">
            <div className="flex items-center gap-3 sm:gap-4">
              <span
                className={`font-display text-lg font-bold uppercase italic tracking-[0.24em] ${roleColorByName[hero.role] ?? "text-rivals-ink"}`}
              >
                {hero.role}
              </span>
            </div>

            <div className="mt-3 sm:mt-5 lg:mt-6">
              <RivalsHeroTitle
                name={hero.name}
                description={hero.summary}
                size="xl"
                inlineName={false}
              />
            </div>

            {stackLogoSrc ? (
              <div className="mt-4 hidden h-10 w-40 sm:block lg:h-12 lg:w-52">
                <Image
                  src={stackLogoSrc}
                  alt={`${hero.name} logo`}
                  width={208}
                  height={48}
                  className="h-full w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="
            pointer-events-none absolute z-30
            -bottom-[18%] right-[-36%] h-[164%] w-[140%]
            sm:-bottom-[25%] sm:right-[-28%] sm:h-[188%] sm:w-[118%]
            lg:-bottom-[31%] lg:right-[-18%] lg:h-[214%] lg:w-[92%]
            xl:-bottom-[35%] xl:right-[-14%] xl:h-[230%] xl:w-[86%]
          "
        >
          <Image
            src={foregroundSrc}
            alt={`${hero.name} full body art`}
            fill
            priority
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 58vw, 50vw"
            className="object-contain object-bottom drop-shadow-[0_22px_40px_rgba(40,39,54,0.45)]"
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

