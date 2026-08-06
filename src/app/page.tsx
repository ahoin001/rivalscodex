import { Metadata } from "next";
import Link from "next/link";
import {
  ClippedButton,
  RivalsFeatureSection,
  RivalsPill,
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
      <section className="page-spotlight-band relative w-full overflow-hidden py-8 md:py-10 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 20%, rgb(var(--brand-gold-rgb)/18%), transparent 55%)",
          }}
        />
        <div className={`${HOME_INNER} relative space-y-6`}>
          <header className="max-w-3xl space-y-3">
            <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.28em] text-brand-gold">
              Marvel Rivals · In-Game Dossier
            </p>
            <h1 className="slanted-title font-display text-5xl font-black uppercase italic leading-[0.9] text-rivals-ink sm:text-6xl lg:text-7xl">
              <span>RivalsCodex</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-rivals-ink-muted sm:text-base">
              Fast hero reference for loading-screen prep — abilities, combo recipes, and
              matchup priorities.
            </p>
          </header>

          <HeroGalleryClient heroes={heroes} />
        </div>
      </section>

      {process.env.NODE_ENV === "development" ? (
        <section className="page-data-band w-full py-8 lg:py-12">
          <div className={HOME_INNER}>
            <RivalsFeatureSection
              variant="flat"
              eyebrow="Dev Only"
              title="Endpoint Panel"
              description="Local Marvel Rivals endpoint testing — never ships to production UI."
              media={
                <div className="space-y-2">
                  <RivalsPill tone="brand">Dev Tools</RivalsPill>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Requests run through server routes so the API key never reaches the client.
                  </p>
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
          </div>
        </section>
      ) : null}
    </div>
  );
}
