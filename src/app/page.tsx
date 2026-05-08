import { Metadata } from "next";
import Link from "next/link";
import {
  ClippedButton,
  RivalsFeatureSection,
  RivalsPill,
  RivalsPageShell,
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

export default async function Home() {
  const heroes = await getHeroes();

  return (
    <RivalsPageShell className="space-y-8 py-7 lg:py-12">
      <RivalsSectionHeader
        eyebrow="Marvel Rivals In-Game Dossier"
        title="RivalsCodex"
        description="Fast hero reference for loading-screen prep: abilities, combo recipes, matchup targets, and curated learning resources."
      />

      <RivalsFeatureSection
        eyebrow="Core Section"
        title="Hero Database"
        description="Browse role-sorted hero dossiers with favorites, matchup guidance, and quick tactical reads before every match."
        media={
          <div className="space-y-2">
            <RivalsPill tone="brand">Content System</RivalsPill>
            <p className="text-sm leading-6 text-muted-foreground">
              Every hero section follows shared Rivals UI primitives, so adding
              new cards, tactical panels, or media blocks stays consistent.
            </p>
            <div className="border-t border-brand-gold/40 pt-2 text-xs uppercase tracking-wide text-brand-gold/90">
              Uniform Layout · Reusable Components · Fast Iteration
            </div>
          </div>
        }
      >
        <HeroGalleryClient heroes={heroes} />
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
