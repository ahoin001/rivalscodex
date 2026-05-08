import { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import {
  ClippedButton,
  RivalsFeatureSection,
  RivalsPill,
  RivalsPageShell,
  RivalsSectionHeader,
} from "@/components/ui";
import { ExternalHeroGalleryClient } from "@/features/heroes/components/external-hero-gallery-client";
import { HeroGalleryClient } from "@/features/heroes/components/hero-gallery-client";
import { DevApiPanel } from "@/features/dev-api/components/dev-api-panel";
import { fetchMarvelRivalsHeroes } from "@/lib/api/marvel-rivals";
import { getHeroes } from "@/lib/content-adapter";

export const metadata: Metadata = {
  title: "Hero Gallery",
  description:
    "Browse Marvel Rivals hero dossiers with role filters, favorites, and in-match quick-reference guides.",
};

const getCachedExternalHeroes = cache(async () => fetchMarvelRivalsHeroes());

export default async function Home() {
  const [heroes, externalHeroes] = await Promise.all([
    getHeroes(),
    getCachedExternalHeroes(),
  ]);

  const hasExternalRoster = externalHeroes.length > 0;
  const localSlugs = heroes.map((hero) => hero.slug);

  return (
    <RivalsPageShell className="space-y-8 py-7 lg:py-12">
      <RivalsSectionHeader
        eyebrow="Marvel Rivals In-Game Dossier"
        title="RivalsCodex"
        description="Fast hero reference for loading-screen prep: abilities, combo recipes, matchup targets, and curated learning resources."
      />

      <RivalsFeatureSection
        eyebrow="Core Section"
        title={hasExternalRoster ? "Hero Directory" : "Hero Database"}
        description={
          hasExternalRoster
            ? "Browse the full Marvel Rivals roster with cached API data, premium card navigation, and fast filtering."
            : "Browse role-sorted hero dossiers with favorites, matchup guidance, and quick tactical reads before every match."
        }
      >
        {hasExternalRoster ? (
          <ExternalHeroGalleryClient heroes={externalHeroes} availableLocalSlugs={localSlugs} />
        ) : (
          <HeroGalleryClient heroes={heroes} />
        )}
      </RivalsFeatureSection>

      {process.env.NODE_ENV === "development" ? (
        <RivalsFeatureSection
          eyebrow="Core Section"
          title="Dev Endpoint Panel"
          description="Organize and test Marvel Rivals heroes endpoints in a secure local-only workflow."
          media={
            <div className="space-y-2">
              <RivalsPill tone="brand">Dev Tools</RivalsPill>
              <p className="text-sm leading-6 text-muted-foreground">
                Requests run through server routes so the API key never reaches
                the client while you iterate on endpoint behavior.
              </p>
              <div className="border-t border-brand-gold/40 pt-2 text-xs uppercase tracking-wide text-brand-gold/90">
                Local Only · Secure Key Handling · Endpoint Validation
              </div>
              <div className="pt-2">
                <Link href="/dev/endpoints">
                  <ClippedButton tone="brand" className="w-full md:w-auto">
                    Open Dedicated Endpoint Page
                  </ClippedButton>
                </Link>
              </div>
            </div>
          }
        >
          <DevApiPanel />
        </RivalsFeatureSection>
      ) : null}
    </RivalsPageShell>
  );
}
