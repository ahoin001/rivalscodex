import Image from "next/image";
import { Hero } from "@/data/schema";
import { FavoriteHeroButton } from "@/features/favorites/favorite-hero-button";
import { ResolvedHeroForm } from "@/features/heroes/hero-forms";
import { RIVALS_FRAMES } from "@/lib/rivals-assets-paths";

type HeroDetailShowcaseCardProps = {
  hero: Hero;
  activeForm: ResolvedHeroForm;
  hasTransformations: boolean;
};

export function HeroDetailShowcaseCard({
  hero,
  activeForm,
  hasTransformations,
}: HeroDetailShowcaseCardProps) {
  return (
    <section
      className="relative isolate w-full overflow-hidden border border-brand-gold/35 bg-[#d4dae7] shadow-[0_18px_45px_rgba(6,8,20,0.4)]"
      aria-label={`${hero.name} hero detail showcase`}
    >
      <div className="relative aspect-[16/9] w-full min-h-[360px] sm:min-h-[430px] lg:min-h-[560px]">
        <Image
          src={hero.frameImage ?? RIVALS_FRAMES.hero}
          alt="Marvel Rivals style hero frame"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-y-0 left-0 z-20 flex w-full items-start px-4 pb-4 pt-6 sm:px-7 sm:pt-10 lg:max-w-[54%] lg:px-12 lg:pt-14">
          <div className="w-full max-w-[640px] text-[#161925]">
            <div className="mb-5 sm:mb-7">
              <div className="mb-2 flex items-center gap-2 sm:gap-3">
                <div className="h-7 w-7 rounded-full border-2 border-[#1f2234] sm:h-9 sm:w-9" />
                <span className="font-display text-sm italic uppercase tracking-[0.14em] sm:text-base">
                  {activeForm.role}
                </span>
              </div>

              <h1 className="slanted-title font-display text-[2.45rem] uppercase leading-[0.86] text-[#141726] sm:text-[3.7rem] lg:text-[5.2rem]">
                <span>{hero.name}</span>
              </h1>
              {hero.stackLogoImage ? (
                <div className="mt-2 h-10 w-44">
                  <Image
                    src={hero.stackLogoImage}
                    alt={`${hero.name} logo`}
                    width={176}
                    height={40}
                    className="h-full w-auto object-contain"
                  />
                </div>
              ) : null}
            </div>

            <div className="ml-1 max-w-[560px] pr-[34%] sm:pr-[32%] lg:pr-0">
              <p className="mb-3 inline-flex bg-[#161925] px-3 py-1 font-display text-xs italic uppercase tracking-[0.16em] text-white sm:text-sm">
                {hasTransformations ? activeForm.name : "Combat Profile"}
              </p>
              <p className="max-w-[560px] text-xs leading-5 text-[#2e333d] sm:text-sm sm:leading-6 lg:text-base lg:leading-7">
                {activeForm.summary}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded border border-[#2e3547] bg-white/60 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#1b2333]">
                HP {activeForm.health}
              </span>
              <span className="rounded border border-[#2e3547] bg-white/60 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#1b2333]">
                Difficulty {hero.difficulty}/5
              </span>
            </div>

            <div className="mt-4 max-w-[240px]">
              <FavoriteHeroButton heroId={hero.id} />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-[-16%] right-[-18%] z-30 h-[210%] w-[125%] sm:bottom-[-20%] sm:right-[-24%] sm:h-[235%] sm:w-[120%] lg:bottom-[-24%] lg:right-[-22%] lg:h-[260%] lg:w-[92%]">
          <Image
            src={activeForm.portraitImage}
            alt={`${hero.name} ${activeForm.name} portrait`}
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 55vw, 42vw"
            className="object-contain object-bottom drop-shadow-[0_12px_26px_rgba(8,10,25,0.5)]"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[15] bg-gradient-to-r from-[#d8ddea]/40 via-transparent to-transparent sm:from-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#c3c9d8]/70 to-transparent sm:h-20" />
      </div>
    </section>
  );
}
