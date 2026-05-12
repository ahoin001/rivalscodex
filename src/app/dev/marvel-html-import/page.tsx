import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RivalsFeatureSection,
  RivalsPageShell,
  RivalsSectionHeader,
} from "@/components/ui";
import { MarvelHtmlImportPanel } from "@/features/marvel-site-import/marvel-html-import-panel";

export default function MarvelHtmlImportPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <RivalsPageShell className="space-y-8 py-7 lg:py-12">
      <RivalsSectionHeader
        eyebrow="Developer Toolkit"
        title="Marvel Site HTML Import"
        description="Paste official Marvel Rivals hero page HTML, preview the extracted role, names, intro, image URLs, and ability skeletons, optionally capture per-ability detail, then click Apply once. A single round-trip downloads any missing images, upserts the hero codex row, and revalidates the cache."
      />

      <div>
        <Link
          href="/"
          className="inline-flex w-fit border border-brand-gold/45 bg-brand-gold-muted px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-background"
        >
          Back To Home
        </Link>
      </div>

      <RivalsFeatureSection eyebrow="Dev Only" title="Parse and upsert" variant="flat">
        <MarvelHtmlImportPanel />
      </RivalsFeatureSection>
    </RivalsPageShell>
  );
}
