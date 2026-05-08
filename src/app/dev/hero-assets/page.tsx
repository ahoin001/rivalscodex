import Link from "next/link";
import { notFound } from "next/navigation";
import { RivalsFeatureSection, RivalsPageShell, RivalsSectionHeader } from "@/components/ui";
import { HeroAssetsSyncPanel } from "@/features/dev-api/components/hero-assets-sync-panel";

export default function DevHeroAssetsPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <RivalsPageShell className="space-y-8 py-7 lg:py-12">
      <RivalsSectionHeader
        eyebrow="Developer Toolkit"
        title="Hero Asset Sync"
        description="Refresh generated hero showcase overrides from local rivals-assets hero folders."
      />

      <div>
        <Link
          href="/"
          className="inline-flex w-fit border border-brand-gold/45 bg-brand-gold-muted px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-[#10131e]"
        >
          Back To Home
        </Link>
      </div>

      <RivalsFeatureSection
        eyebrow="Dev Only"
        title="Generate Hero Frame and Portrait Overrides"
        description="Uses `[hero-slug].png` and `[hero-slug]-frame.png` to keep showcase assets aligned as hero folders are updated."
      >
        <HeroAssetsSyncPanel />
      </RivalsFeatureSection>
    </RivalsPageShell>
  );
}
