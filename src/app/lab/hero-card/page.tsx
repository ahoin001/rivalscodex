import { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { LunaAbilitiesSection } from "@/features/heroes/components/luna-abilities-section";
import { LunaHeroCard } from "@/features/heroes/components/luna-hero-card";
import { LunaHeroGuideConsole } from "@/features/heroes/components/luna-hero-guide-console";
import {
  LUNA_BASE_STATS,
  LUNA_HERO_GUIDE_TABS,
  buildLunaAbilitiesFromHero,
} from "@/features/heroes/components/luna-data";
import { fetchMarvelRivalsHeroes } from "@/lib/api/marvel-rivals";

export const metadata: Metadata = {
  title: "Luna Snow Hero Detail Lab",
  description:
    "Reference-faithful Luna Snow hero detail recreation, used as a controlled sandbox for the Rivals visual system.",
};

const getCachedHeroes = cache(async () => fetchMarvelRivalsHeroes());

function isLunaSnow(name: string | undefined): boolean {
  if (!name) return false;
  return name.toLowerCase().replace(/[^a-z]/g, "") === "lunasnow";
}

export default async function HeroCardLabPage() {
  let lunaHero = null;
  try {
    const heroes = await getCachedHeroes();
    lunaHero = heroes.find((hero) => isLunaSnow(hero.name)) ?? null;
  } catch {
    lunaHero = null;
  }

  const lunaAbilities = buildLunaAbilitiesFromHero(lunaHero);

  return (
    <div className="lab-light-theme min-h-screen">
      <main className="mx-auto w-full max-w-[1400px] px-3 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rivals-clip-tab inline-flex items-center gap-2 bg-rivals-ink px-4 py-2 font-display text-xs uppercase italic tracking-[0.18em] text-white transition-colors hover:bg-rivals-ink-soft"
          >
            <span aria-hidden>&larr;</span>
            Back To Home
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.32em] text-rivals-ink-muted sm:block">
            Design Sandbox · Luna Snow
          </p>
        </div>

        <header className="space-y-3 pb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-rivals-ink-muted">
            Hero Detail Recreation
          </p>
          <h1 className="slanted-title font-display text-[2.6rem] font-extrabold uppercase italic leading-[0.9] text-rivals-ink sm:text-[3.6rem] lg:text-[4.6rem]">
            <span>Luna Snow Hero Detail Lab</span>
          </h1>
          <div className="brand-divider max-w-3xl" />
          <p className="max-w-3xl text-sm leading-6 text-rivals-ink-soft sm:text-base sm:leading-7">
            Reference-faithful recreation of the Marvel Rivals hero detail page styled around the
            Luna Snow showcase. Site nav, more-heroes shortcut, page footer, and social rail are
            intentionally omitted.
          </p>
        </header>

        <div className="space-y-10">
          <LunaHeroCard />
          <LunaAbilitiesSection
            heroName="Luna Snow"
            heroSubtitle="Seol Hee"
            portraitImageUrl={lunaHero?.portraitImageUrl}
            abilities={lunaAbilities}
            baseStats={LUNA_BASE_STATS}
          />
          <LunaHeroGuideConsole
            heroName="Luna Snow"
            subtitle="Seol Hee"
            tabs={LUNA_HERO_GUIDE_TABS}
            defaultTabId="abilities"
          />
        </div>
      </main>
    </div>
  );
}
