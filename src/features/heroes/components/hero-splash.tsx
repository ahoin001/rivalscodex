import Image from "next/image";
import { ClippedPanel, RivalsPill } from "@/components/ui";
import { Hero } from "@/data/schema";
import { ResolvedHeroForm } from "@/features/heroes/hero-forms";
import { roleColorClass } from "@/features/heroes/role-utils";

type HeroSplashProps = {
  hero: Hero;
  activeForm: ResolvedHeroForm;
  hasTransformations?: boolean;
};

export function HeroSplash({
  hero,
  activeForm,
  hasTransformations = false,
}: HeroSplashProps) {
  return (
    <ClippedPanel
      tone="gold"
      className="brand-glow relative overflow-hidden border border-brand-gold/35 p-4 md:p-5"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-brand-gold/15 via-brand-gold/3 to-transparent" />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-4">
          <div className="space-y-2 md:space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-brand-gold">
              Hero Dossier
            </p>
            <h1 className="slanted-title font-display text-[2.4rem] italic uppercase leading-[0.94] md:text-[4.1rem]">
              <span>{hero.name}</span>
            </h1>
            {hasTransformations && (
              <div className="flex flex-wrap items-center gap-2">
                <RivalsPill tone="brand">{activeForm.name}</RivalsPill>
                {activeForm.trigger ? <RivalsPill>{activeForm.trigger}</RivalsPill> : null}
              </div>
            )}
            <div className="brand-divider max-w-xl" />
            <p className="max-w-2xl text-[0.95rem] leading-6 text-muted-foreground md:text-base md:leading-7">
              {activeForm.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-1 text-xs font-semibold uppercase ${roleColorClass[activeForm.role]}`}
            >
              {activeForm.role}
            </span>
            <span className="rounded border border-brand-gold/60 bg-brand-gold/15 px-2 py-1 text-xs font-semibold uppercase text-brand-gold">
              HP {activeForm.health}
            </span>
            <span className="rounded border border-white/25 px-2 py-1 text-xs font-semibold uppercase text-white/80">
              Difficulty {hero.difficulty}/5
            </span>
          </div>
        </div>

        <div className="hidden lg:block" />
      </div>

      <div className="group relative mt-4 min-h-[20rem] w-full overflow-hidden clipped-edge border border-brand-gold/30 lg:min-h-[32rem]">
        <Image
          src={activeForm.splashImage}
          alt={`${hero.name} ${activeForm.name} splash art`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 72vw"
          quality={58}
          unoptimized
          className="object-contain object-bottom transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0a0b14]/42 via-transparent to-brand-gold/15" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-[#0a0b14] to-transparent" />
      </div>
    </ClippedPanel>
  );
}
