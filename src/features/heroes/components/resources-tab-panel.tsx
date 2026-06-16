"use client";

import type { HeroGuideBlock, HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { buildHeroGuideBodyNavItems } from "@/features/heroes/components/hero-guide-body";
import { BlockBullets } from "@/features/heroes/components/hero-guide-body/block-bullets";
import { BlockCallout } from "@/features/heroes/components/hero-guide-body/block-callout";
import { BlockTwoColumn } from "@/features/heroes/components/hero-guide-body/block-two-column";
import { BlockVideo } from "@/features/heroes/components/hero-guide-body/block-video";
import { GuideTabFallback } from "@/features/heroes/components/guide-tab-fallback";
import { ScrollRevealSection } from "@/features/heroes/components/scroll-reveal-section";

type ResourcesTabPanelProps = {
  tab: HeroGuideTabContent;
  anchorPrefix: string;
};

function ResourceLinksGrid({
  links,
}: {
  links: NonNullable<HeroGuideTabContent["links"]>;
}) {
  return (
    <ScrollRevealSection className="scroll-mt-28">
      <div className="rounded-lg border border-rivals-light-300/80 bg-white/75 p-4 sm:p-5">
        <h4 className="font-display text-[11px] font-bold uppercase italic tracking-[0.2em] text-rivals-ink-muted">
          External links
        </h4>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group flex min-h-11 items-center justify-between gap-3 rounded-lg border border-rivals-light-300 bg-rivals-light-50/80 px-3 py-2.5 text-sm font-semibold text-rivals-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-rivals-yellow-500/55 hover:bg-white hover:shadow-sm"
              >
                <span className="min-w-0 truncate">{link.label}</span>
                <span
                  className="shrink-0 font-display text-xs uppercase tracking-wide text-rivals-yellow-700 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </ScrollRevealSection>
  );
}

function renderResourceBlock(block: HeroGuideBlock) {
  switch (block.type) {
    case "callout":
      return (
        <BlockCallout variant={block.variant} title={block.title} body={block.body} />
      );
    case "bullets":
      return <BlockBullets title={block.title} items={block.items} />;
    case "twoColumn":
      return (
        <BlockTwoColumn
          leftTitle={block.leftTitle}
          leftItems={block.leftItems}
          rightTitle={block.rightTitle}
          rightItems={block.rightItems}
        />
      );
    case "video":
      return (
        <BlockVideo
          title={block.title}
          watchUrl={block.watchUrl}
          note={block.note}
          layout="grid"
        />
      );
    default:
      return null;
  }
}

/** Responsive grid columns for 1–6+ resource videos. */
function resourceVideoGridClass(count: number): string {
  if (count <= 1) {
    return "grid grid-cols-1 gap-4 max-w-md";
  }
  if (count === 2) {
    return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  }
  if (count <= 4) {
    return "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2";
  }
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
}

export function ResourcesTabPanel({ tab, anchorPrefix }: ResourcesTabPanelProps) {
  const blocks = tab.body ?? [];
  const resourceBlocks = blocks.filter(
    (block): block is Extract<HeroGuideBlock, { type: "callout" | "bullets" | "twoColumn" | "video" }> =>
      block.type === "callout" ||
      block.type === "bullets" ||
      block.type === "twoColumn" ||
      block.type === "video",
  );

  const navItems = buildHeroGuideBodyNavItems(resourceBlocks, anchorPrefix);
  const hasCues =
    (tab.primaryPoints?.length ?? 0) > 0 || (tab.secondaryPoints?.length ?? 0) > 0;
  const hasBlocks = resourceBlocks.length > 0;
  const hasLinks = (tab.links?.length ?? 0) > 0;

  const videos = resourceBlocks.filter((b) => b.type === "video");
  const nonVideos = resourceBlocks.filter((b) => b.type !== "video");

  if (!hasBlocks && !hasCues && !hasLinks) {
    return (
      <GuideTabFallback
        primaryPoints={tab.primaryPoints}
        secondaryPoints={tab.secondaryPoints}
      />
    );
  }

  return (
    <div className="space-y-6 pb-1 sm:space-y-7">
      {hasCues ? (
        <ScrollRevealSection className="scroll-mt-28">
          <GuideTabFallback
            primaryPoints={tab.primaryPoints}
            secondaryPoints={tab.secondaryPoints}
          />
        </ScrollRevealSection>
      ) : null}

      {videos.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-display text-[11px] font-bold uppercase italic tracking-[0.2em] text-rivals-ink-muted">
            {videos.length === 1 ? "Featured video" : `Videos (${videos.length})`}
          </h4>
          <div className={resourceVideoGridClass(videos.length)}>
            {videos.map((block) => {
              const blockIndex = resourceBlocks.indexOf(block);
              const navItem = navItems[blockIndex];
              return (
                <ScrollRevealSection
                  key={`resource-video-${blockIndex}`}
                  id={navItem?.id}
                  className="scroll-mt-28"
                >
                  {renderResourceBlock(block)}
                </ScrollRevealSection>
              );
            })}
          </div>
        </div>
      ) : null}

      {nonVideos.length > 0 ? (
        <div className="space-y-4">
          {nonVideos.map((block) => {
            const blockIndex = resourceBlocks.indexOf(block);
            const navItem = navItems[blockIndex];
            return (
              <ScrollRevealSection
                key={`resource-block-${blockIndex}-${block.type}`}
                id={navItem?.id}
                className="scroll-mt-28"
              >
                {renderResourceBlock(block)}
              </ScrollRevealSection>
            );
          })}
        </div>
      ) : null}

      {hasLinks ? <ResourceLinksGrid links={tab.links!} /> : null}
    </div>
  );
}
