import { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import { BlackWidowAbilitiesSection } from "@/features/heroes/components/black-widow-abilities-section";
import { LunaHeroCard } from "@/features/heroes/components/luna-hero-card";
import { LunaHeroGuideConsole } from "@/features/heroes/components/luna-hero-guide-console";
import { LUNA_HERO_GUIDE_TABS } from "@/features/heroes/components/luna-data";
import abilitiesBackgroundImage from "../../../../rivals-assets/frames/abilities-section.jpg";
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

  return (
    <div className="lab-light-theme min-h-screen">
      {/* Hero card is edge-to-edge for maximum impact */}
      <section className="w-full">
        <LunaHeroCard />
      </section>

      <section className="relative isolate w-full overflow-hidden">
        <Image
          src={abilitiesBackgroundImage}
          alt=""
          fill
          priority={false}
          sizes="100vw"
          aria-hidden
          className="object-cover object-center"
        />
        <div className="relative mx-auto w-full max-w-[min(100%,1680px)] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <BlackWidowAbilitiesSection hero={lunaHero} variant="immersive" />
        </div>
      </section>

      <LunaHeroGuideConsole
        heroName="Luna Snow"
        subtitle="Seol Hee"
        tabs={LUNA_HERO_GUIDE_TABS}
        defaultTabId="abilities"
      />
    </div>
  );
}
