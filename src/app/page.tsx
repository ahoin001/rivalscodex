import { Metadata } from "next";
import Link from "next/link";
import {
  ClippedButton,
  RivalsFeatureSection,
  RivalsPill,
  RivalsSectionHeader,
} from "@/components/ui";
import { HeroGalleryClient } from "@/features/heroes/components/hero-gallery-client";
import { DevApiPanel } from "@/features/dev-api/components/dev-api-panel";
import { getHeroes } from "@/lib/content-adapter";

export const metadata: Metadata = {
  title: "Hero Gallery",
  description:
    "Browse Marvel Rivals hero dossiers with role filters, favorites, and in-match quick-reference guides.",
};

const HOME_INNER = "mx-auto w-full max-w-[min(100%,1680px)] px-4 sm:px-6 lg:px-10";

export default async function Home() {
  const heroes = await getHeroes();

  return (
    <div className="min-h-screen">
      <section className="page-spotlight-band w-full py-10 md:py-14 lg:py-16">
        <div className={HOME_INNER}>
          <RivalsSectionHeader
            eyebrow="Marvel Rivals In-Game Dossier"
            title="RivalsCodex"
            description="Fast hero reference for loading-screen prep: abilities, combo recipes, matchup targets, and curated learning resources."
          />
        </div>
      </section>

      <section className="page-data-band w-full py-8 lg:py-12">
        <div className={`${HOME_INNER} space-y-8`}>
          <RivalsFeatureSection
            variant="flat"
            eyebrow="Core Section"
            title="Hero Codex"
            description="Browse the heroes we have fully parsed and indexed in our codex. New heroes appear here as soon as they're imported via the dev tools."
          >
            <HeroGalleryClient heroes={heroes} />
          </RivalsFeatureSection>

          {process.env.NODE_ENV === "development" ? (
            <RivalsFeatureSection
              variant="flat"
              eyebrow="Core Section"
              title="Dev Endpoint Panel"
              description="Organize and test Marvel Rivals heroes endpoints in a secure local-only workflow."
              media={
                <div className="space-y-2">
                  <RivalsPill tone="brand">Dev Tools</RivalsPill>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Requests run through server routes so the API key never reaches the client while
                    you iterate on endpoint behavior.
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
        </div>
      </section>
    </div>
  );
}
