import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { HeroFormAbilitiesPanel } from "@/features/heroes/components/hero-form-abilities-panel";
import { HeroLabShowcaseCard } from "@/features/heroes/components/hero-lab-showcase-card";
import { DraftPreviewAuthBanner } from "@/features/heroes/components/draft-preview-auth-banner";
import { HeroGuideInlineShell } from "@/features/heroes/components/hero-guide-inline-shell";
import { HeroRouteTransitionLayer } from "@/features/heroes/components/hero-route-transition-layer";
import { getFullTabEditorHref } from "@/features/heroes/loaders/full-tab-editor-href";
import { HeroCodexResyncTrigger } from "@/features/marvel-site-import/hero-codex-resync-drawer";
import { HeroCodexResyncShell } from "@/features/marvel-site-import/hero-codex-resync-shell";
import { buildHeroGuideTabsFromHero, mapHeroToExternalHero } from "@/features/heroes/hero-lab-data";
import { resolveHeroGuideTabs } from "@/features/heroes/hero-guide-content";
import { getHeroBySlug, getHeroSlugs, getHeroes } from "@/lib/content-adapter";
import { buildComboAbilityLookup } from "@/features/heroes/combo-kit-abilities";
import { buildHeroPortraitEntries } from "@/features/heroes/hero-portrait-map";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { RIVALS_FRAMES } from "@/lib/rivals-assets-paths";

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
  const [{ tabs: guideTabs, editorialLoaded }, allHeroes] = await Promise.all([
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
    buildComboAbilityLookup(allAbilities).entries(),
  );
  const heroPortraits = buildHeroPortraitEntries(allHeroes);
  const fullTabEditorHref = await getFullTabEditorHref(hero.slug);

  return (
    <HeroCodexResyncShell heroSlug={hero.slug} heroName={hero.name}>
      <div className="hero-page-shell lab-light-theme min-h-screen">
        <HeroRouteTransitionLayer heroSlug={hero.slug} />
        <DraftPreviewAuthBanner
          wantsDraftPreview={wantsDraftPreview}
          loginNextPath={loginNextPath}
        />
        <section className="hero-stage-showcase w-full">
          <HeroLabShowcaseCard
            hero={hero}
            toolbarEnd={<HeroCodexResyncTrigger />}
          />
        </section>

        <HeroGuideInlineShell
          heroSlug={hero.slug}
          heroId={hero.id}
          heroName={hero.name}
          stackLogoUrl={hero.stackLogoImage}
          guideTabs={guideTabs}
          editorialLoaded={editorialLoaded}
          abilityEntries={abilityEntries}
          heroPortraits={heroPortraits}
          defaultTabId="overview"
          supabaseEnabled={isSupabaseEnabled()}
          fullTabEditorHref={fullTabEditorHref}
        />

        <section
          id="hero-codex-abilities"
          className="hero-stage-shell hero-stage-abilities relative isolate w-full overflow-hidden"
        >
          <Image
            src={RIVALS_FRAMES.abilitiesSection}
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
      </div>
    </HeroCodexResyncShell>
  );
}
