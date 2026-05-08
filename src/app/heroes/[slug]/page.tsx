import { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RivalsPageShell } from "@/components/ui";
import { HeroSplash } from "@/features/heroes/components/hero-splash";
import { HeroStatsRail } from "@/features/heroes/components/hero-stats-rail";
import { getHeroBySlug, getHeroSlugs } from "@/lib/content-adapter";

const HeroInfoTabs = dynamic(
  () =>
    import("@/features/heroes/components/hero-info-tabs").then(
      (module) => module.HeroInfoTabs,
    ),
  {
    loading: () => (
      <section className="glass-panel clipped-edge p-4 text-sm text-muted-foreground">
        Loading hero modules...
      </section>
    ),
  },
);

type HeroPageProps = {
  params: Promise<{
    slug: string;
  }>;
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

export default async function HeroPage({ params }: HeroPageProps) {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    notFound();
  }

  return (
    <RivalsPageShell className="flex flex-col gap-6">
      <Link
        href="/"
        className="inline-flex w-fit border border-brand-gold/45 bg-brand-gold-muted px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-[#10131e]"
      >
        Back To Gallery
      </Link>
      <section className="grid gap-5 lg:grid-cols-[1.45fr_0.72fr] lg:items-start">
        <HeroSplash hero={hero} />
        <HeroStatsRail hero={hero} />
      </section>
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">
          Combat Intelligence
        </p>
        <div className="brand-divider" />
      </section>
      <HeroInfoTabs hero={hero} />
    </RivalsPageShell>
  );
}
