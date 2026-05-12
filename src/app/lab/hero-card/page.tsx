import { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import { HeroAbilitiesSection } from "@/features/heroes/components/hero-abilities-section";
import { LunaHeroCard } from "@/features/heroes/components/luna-hero-card";
import { DraftPreviewAuthBanner } from "@/features/heroes/components/draft-preview-auth-banner";
import { HeroGuideConsole } from "@/features/heroes/components/hero-guide-console";
import { HeroGuideAdminLink } from "@/features/heroes/components/hero-guide-admin-link";
import { LUNA_HERO_GUIDE_TABS } from "@/features/heroes/components/luna-data";
import { resolveHeroGuideTabs } from "@/features/heroes/hero-guide-content";
import abilitiesBackgroundImage from "../../../../rivals-assets/frames/abilities-section.jpg";
import { fetchMarvelRivalsHeroes } from "@/lib/api/marvel-rivals";

export const metadata: Metadata = {
  title: "Luna Snow Hero Detail Lab",
  description:
    "Reference-faithful Luna Snow hero detail recreation, used as a controlled sandbox for the Rivals visual system.",
};

const getCachedHeroes = cache(async () => fetchMarvelRivalsHeroes());
const LUNA_SLUG = "luna-snow";

type HeroCardLabPageProps = {
  searchParams?: Promise<{ preview?: string }> | { preview?: string };
};

function isLunaSnow(name: string | undefined): boolean {
  if (!name) return false;
  return name.toLowerCase().replace(/[^a-z]/g, "") === "lunasnow";
}

function toGuideScope(preview: string | undefined): "draft" | "published" {
  return preview === "draft" ? "draft" : "published";
}

export default async function HeroCardLabPage({ searchParams }: HeroCardLabPageProps) {
  let lunaHero = null;
  try {
    const heroes = await getCachedHeroes();
    lunaHero = heroes.find((hero) => isLunaSnow(hero.name)) ?? null;
  } catch {
    lunaHero = null;
  }

  const resolvedSearchParams = await Promise.resolve(searchParams);
  const wantsDraftPreview = resolvedSearchParams?.preview === "draft";
  const guideScope = toGuideScope(resolvedSearchParams?.preview);
  const loginNextPath = `/lab/hero-card${wantsDraftPreview ? "?preview=draft" : ""}`;
  const lunaGuideTabs = await resolveHeroGuideTabs({
    heroSlug: LUNA_SLUG,
    fallbackTabs: LUNA_HERO_GUIDE_TABS,
    scope: guideScope,
  });

  return (
    <div className="lab-light-theme min-h-screen">
      <DraftPreviewAuthBanner
        wantsDraftPreview={wantsDraftPreview}
        loginNextPath={loginNextPath}
      />
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
          <HeroAbilitiesSection hero={lunaHero} variant="immersive" />
        </div>
      </section>

      <HeroGuideConsole
        heroName="Luna Snow"
        subtitle="Seol Hee"
        tabs={lunaGuideTabs}
        defaultTabId="overview"
      />
      <HeroGuideAdminLink heroSlug={LUNA_SLUG} />
    </div>
  );
}
