"use client";

import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import { LazyVideoEmbed } from "@/features/heroes/components/lazy-video-embed";
import { getYoutubeEmbedUrl } from "@/features/heroes/youtube";

export type HeroGuideBodyNavItem = {
  id: string;
  label: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getBlockLabel(block: HeroGuideBlock, index: number): string {
  switch (block.type) {
    case "callout":
      return block.title ?? `Callout ${index + 1}`;
    case "bullets":
      return block.title ?? `Key points ${index + 1}`;
    case "twoColumn":
      return `${block.leftTitle} / ${block.rightTitle}`;
    case "combo":
      return block.name;
    case "matchup":
      return `${block.disposition === "target" ? "Target" : "Threat"}: ${block.opponent}`;
    case "video":
      return block.title;
  }
}

export function buildHeroGuideBodyNavItems(
  blocks: HeroGuideBlock[],
  anchorPrefix: string,
): HeroGuideBodyNavItem[] {
  return blocks.map((block, index) => {
    const label = getBlockLabel(block, index);
    const labelSlug = slugify(label) || `${block.type}-${index + 1}`;
    return {
      id: `${anchorPrefix}-${index + 1}-${labelSlug}`,
      label,
    };
  });
}

function GuideClip({ label, href }: { label: string; href: string }) {
  const embedUrl = getYoutubeEmbedUrl(href);
  if (!embedUrl) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-rivals-ink underline decoration-rivals-yellow-600/80 underline-offset-2 hover:text-rivals-yellow-800"
      >
        {label}
        <span aria-hidden>→</span>
      </a>
    );
  }
  return <LazyVideoEmbed title={label} embedUrl={embedUrl} />;
}

function BlockCallout({
  variant,
  title,
  body,
}: {
  variant?: "gameplan" | "macro" | "tip";
  title?: string;
  body: string;
}) {
  const tone =
    variant === "macro"
      ? "border-cyan-500/35 bg-cyan-50/90"
      : variant === "tip"
        ? "border-rivals-yellow-500/40 bg-rivals-yellow-50/80"
        : "border-rivals-ink/15 bg-rivals-light-200/90";

  return (
    <div className={`rounded border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${tone}`}>
      {title ? (
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rivals-ink-muted">
          {title}
        </p>
      ) : null}
      <p className={`text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7 ${title ? "mt-2" : ""}`}>
        {body}
      </p>
    </div>
  );
}

function BlockBullets({ title, items }: { title?: string; items: string[] }) {
  return (
    <div>
      {title ? (
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rivals-ink-muted">
          {title}
        </p>
      ) : null}
      <ul
        className={`mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px] ${title ? "" : "mt-0"}`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function BlockTwoColumn({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
}: {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="rounded border border-emerald-600/20 bg-emerald-50/50 px-3 py-3 transition-all duration-200 hover:shadow-sm sm:px-4">
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-emerald-900/70">
          {leftTitle}
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
          {leftItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded border border-rose-500/25 bg-rose-50/50 px-3 py-3 transition-all duration-200 hover:shadow-sm sm:px-4">
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rose-900/70">
          {rightTitle}
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
          {rightItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BlockCombo({
  name,
  steps,
  condition,
  clip,
}: {
  name: string;
  steps: string[];
  condition?: string;
  clip?: { label: string; href: string };
}) {
  return (
    <div className="rounded border border-rivals-ink/12 bg-white/80 px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="font-display text-sm font-extrabold uppercase italic text-rivals-ink">{name}</p>
      {condition ? (
        <p className="mt-1 text-xs leading-5 text-rivals-ink-muted">{condition}</p>
      ) : null}
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {clip ? (
        <div className="mt-3 max-w-lg border-t border-rivals-light-300 pt-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-rivals-ink-muted">
            Example clip
          </p>
          <GuideClip label={clip.label} href={clip.href} />
        </div>
      ) : null}
    </div>
  );
}

function BlockMatchup({
  disposition,
  opponent,
  summary,
  clip,
}: {
  disposition: "target" | "threat";
  opponent: string;
  summary: string;
  clip?: { label: string; href: string };
}) {
  const isTarget = disposition === "target";
  const shell = isTarget
    ? "border-emerald-600/25 bg-emerald-50/40"
    : "border-rose-500/30 bg-rose-50/45";
  const badge = isTarget ? "text-emerald-900/80" : "text-rose-900/80";
  const badgeText = isTarget ? "Target" : "Threat";

  return (
    <div className={`rounded border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${shell}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`font-display text-xs font-bold uppercase italic tracking-wide ${badge}`}>
          {badgeText}: {opponent}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">{summary}</p>
      {clip ? (
        <div className="mt-3 max-w-lg">
          <GuideClip label={clip.label} href={clip.href} />
        </div>
      ) : null}
    </div>
  );
}

function BlockVideo({ title, watchUrl }: { title: string; watchUrl: string }) {
  return (
    <div>
      <p className="mb-2 font-display text-[11px] uppercase tracking-[0.18em] text-rivals-ink-muted">
        Video
      </p>
      <GuideClip label={title} href={watchUrl} />
    </div>
  );
}

export function HeroGuideBody({
  blocks,
  anchorPrefix,
}: {
  blocks: HeroGuideBlock[];
  anchorPrefix: string;
}) {
  const navItems = buildHeroGuideBodyNavItems(blocks, anchorPrefix);

  return (
    <div className="space-y-6 pb-1 sm:space-y-5">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        const navItem = navItems[index];
        switch (block.type) {
          case "callout":
            return (
              <section key={key} id={navItem.id} className="scroll-mt-28">
                <BlockCallout
                  variant={block.variant}
                  title={block.title}
                  body={block.body}
                />
              </section>
            );
          case "bullets":
            return (
              <section key={key} id={navItem.id} className="scroll-mt-28">
                <BlockBullets title={block.title} items={block.items} />
              </section>
            );
          case "twoColumn":
            return (
              <section key={key} id={navItem.id} className="scroll-mt-28">
                <BlockTwoColumn
                  leftTitle={block.leftTitle}
                  leftItems={block.leftItems}
                  rightTitle={block.rightTitle}
                  rightItems={block.rightItems}
                />
              </section>
            );
          case "combo":
            return (
              <section key={key} id={navItem.id} className="scroll-mt-28">
                <BlockCombo
                  name={block.name}
                  steps={block.steps}
                  condition={block.condition}
                  clip={block.clip}
                />
              </section>
            );
          case "matchup":
            return (
              <section key={key} id={navItem.id} className="scroll-mt-28">
                <BlockMatchup
                  disposition={block.disposition}
                  opponent={block.opponent}
                  summary={block.summary}
                  clip={block.clip}
                />
              </section>
            );
          case "video":
            return (
              <section key={key} id={navItem.id} className="scroll-mt-28">
                <BlockVideo title={block.title} watchUrl={block.watchUrl} />
              </section>
            );
        }
      })}
    </div>
  );
}
