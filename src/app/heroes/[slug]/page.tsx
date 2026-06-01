import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { HeroFormAbilitiesPanel } from "@/features/heroes/components/hero-form-abilities-panel";
import { HeroLabShowcaseCard } from "@/features/heroes/components/hero-lab-showcase-card";
import { DraftPreviewAuthBanner } from "@/features/heroes/components/draft-preview-auth-banner";
import { HeroGuideInlineShell } from "@/features/heroes/components/hero-guide-inline-shell";
import { HeroGuideAdminLink } from "@/features/heroes/components/hero-guide-admin-link";
import { buildHeroGuideTabsFromHero, mapHeroToExternalHero } from "@/features/heroes/hero-lab-data";
import { resolveHeroGuideTabs } from "@/features/heroes/hero-guide-content";
import { getHeroBySlug, getHeroSlugs, getHeroes } from "@/lib/content-adapter";
import { buildAbilityLookup } from "@/features/heroes/ability-lookup";
import { buildHeroPortraitEntries } from "@/features/heroes/hero-portrait-map";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import abilitiesBackgroundImage from "../../../../rivals-assets/frames/abilities-section.jpg";

type HeroPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ preview?: string }> | { preview?: string };
};

export async function generateStaticParams() {
  const slugs = await getHeroSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: HeroPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    return {
      title: "Hero Not Found",
    };
  }

  return {
    title: `${hero.name} Guide`,
    description: `${hero.name} ${hero.role} guide with abilities, combos, and matchup priorities for Marvel Rivals.`,
    openGraph: {
      title: `${hero.name} Guide`,
      description: hero.summary,
      images: [{ url: hero.splashImage }],
    },
  };
}

export default async function HeroPage({ params, searchParams }: HeroPageProps) {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    notFound();
  }

  const heroAsExternal = mapHeroToExternalHero(hero);
  const fallbackGuideTabs = buildHeroGuideTabsFromHero(hero);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const wantsDraftPreview = resolvedSearchParams?.preview === "draft";
  const guideScope = wantsDraftPreview ? "draft" : "published";
  const loginNextPath = `/heroes/${hero.slug}${wantsDraftPreview ? "?preview=draft" : ""}`;
  const [guideTabs, allHeroes] = await Promise.all([
    resolveHeroGuideTabs({
      heroSlug: hero.slug,
      fallbackTabs: fallbackGuideTabs,
      scope: guideScope,
    }),
    getHeroes(),
  ]);

  const allAbilities = hero.forms
    ? hero.forms.flatMap((f) => f.abilities)
    : hero.abilities;
  const abilityEntries = Array.from(
    buildAbilityLookup(allAbilities).entries(),
  );
  const heroPortraits = buildHeroPortraitEntries(allHeroes);

  return (
    <div className="lab-light-theme min-h-screen">
      <DraftPreviewAuthBanner
        wantsDraftPreview={wantsDraftPreview}
        loginNextPath={loginNextPath}
      />
      <section className="w-full">
        <HeroLabShowcaseCard hero={hero} />
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
          <HeroFormAbilitiesPanel
            hero={hero}
            heroAsExternal={heroAsExternal}
            stackLogoUrl={hero.stackLogoImage}
            variant="immersive"
          />
        </div>
      </section>

      <HeroGuideInlineShell
        heroSlug={hero.slug}
        heroName={hero.name}
        stackLogoUrl={hero.stackLogoImage}
        guideTabs={guideTabs}
        abilityEntries={abilityEntries}
        heroPortraits={heroPortraits}
        defaultTabId="overview"
        supabaseEnabled={isSupabaseEnabled()}
      />
      <HeroGuideAdminLink heroSlug={hero.slug} />
    </div>
  );
}
