"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RivalsTab, RivalsTabBar } from "@/components/ui";
import type {
  HeroGuideTabContent,
  HeroGuideTabId,
} from "@/features/heroes/hero-guide-schema";
import {
  buildHeroGuideBodyNavItems,
  HeroGuideBody,
} from "@/features/heroes/components/hero-guide-body";
import lunaStackLogoImage from "../../../../rivals-assets/heros/luna/luna-stack-logo.png";

type HeroGuideConsoleProps = {
  heroName: string;
  /** Per-hero stack-logo backdrop URL from the codex. Falls back to the Luna chrome asset. */
  stackLogoUrl?: string;
  subtitle?: string;
  tabs: HeroGuideTabContent[];
  defaultTabId?: HeroGuideTabId;
  className?: string;
};

/** Alpha mask: soft left edge into art, soften far right so emblem doesn’t glare behind copy. */
const stackBackdropMaskStyle: CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 5%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.42) 82%, transparent 100%)",
  maskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 5%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.42) 82%, transparent 100%)",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

export function HeroGuideConsole({
  heroName,
  stackLogoUrl,
  subtitle,
  tabs,
  defaultTabId,
  className = "",
}: HeroGuideConsoleProps) {
  const initialTabId = defaultTabId ?? tabs[0]?.id;
  const [activeTabId, setActiveTabId] = useState<HeroGuideTabId>(
    (initialTabId ?? "abilities") as HeroGuideTabId,
  );
  const [contentVisible, setContentVisible] = useState(true);

  const backdropImage = stackLogoUrl ?? lunaStackLogoImage;
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const heroGuideTopId = `${heroName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-guide-top`;
  const bodyAnchorPrefix = `${heroName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${activeTabId}`;
  const bodyNavItems = useMemo(
    () => (activeTab.body ? buildHeroGuideBodyNavItems(activeTab.body, bodyAnchorPrefix) : []),
    [activeTab.body, bodyAnchorPrefix],
  );

  const tabBarItems: RivalsTab[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
  }));

  useEffect(() => {
    setContentVisible(false);
    const frame = requestAnimationFrame(() => setContentVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [activeTabId]);

  if (!activeTab) {
    return null;
  }

  return (
    <section
      id={heroGuideTopId}
      className={`relative isolate w-full overflow-hidden border-b border-black/40 bg-black pb-[max(4rem,env(safe-area-inset-bottom))] sm:pb-20 ${className}`.trim()}
      aria-label={`${heroName} hero guide`}
    >
      {/* Feathered stack art: subdued + masked so typography stays dominant */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <div
          className="absolute inset-0 opacity-[0.48]"
          style={stackBackdropMaskStyle}
          aria-hidden
        >
          <Image
            src={backdropImage}
            alt=""
            fill
            sizes="100vw"
            priority={false}
            aria-hidden
            className="object-cover object-[72%_center] sm:object-right"
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-r from-black from-[8%] via-transparent via-[55%] to-black/30"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/55 sm:from-black/30 sm:to-black/40"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[min(100%,1680px)] flex-col gap-6 px-4 pt-5 pb-0 sm:min-h-[30rem] sm:gap-8 sm:px-8 sm:pt-6 lg:min-h-[32rem] lg:gap-10 lg:px-12 lg:pt-7">
        <header className="space-y-3 drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]">
          <p className="text-[11px] uppercase tracking-[0.36em] text-white/75 sm:text-xs">
            Hero Guide
          </p>
          <h2 className="slanted-title max-w-[18ch] font-display text-[clamp(2.2rem,12vw,4.25rem)] font-extrabold uppercase italic leading-[0.94] text-white sm:leading-[0.9]">
            <span>{heroName}</span>
          </h2>
          {subtitle ? (
            <p className="inline-flex border border-cyan-400/35 bg-black/45 px-3 py-1.5 font-display text-[11px] italic uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm sm:text-xs">
              {subtitle}
            </p>
          ) : null}
        </header>

        <RivalsTabBar
          tabs={tabBarItems}
          activeTabId={activeTabId}
          onChange={(tabId) => setActiveTabId(tabId as HeroGuideTabId)}
          className="-mx-1 px-1 sm:mx-0 sm:px-0"
        />

        {/* Fixed-height shell: tab switches swap body inside scroll region so outer layout doesn’t jump */}
        <article
          className="rivals-clip-row flex flex-col rounded-xl border border-white/15 bg-rivals-light-100/96 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.26)] backdrop-blur-sm sm:min-h-[min(58vh,38rem)] sm:rounded-none sm:p-6 sm:shadow-[0_12px_48px_rgba(0,0,0,0.35)] lg:min-h-[min(52vh,40rem)]"
          aria-live="polite"
        >
          <header className="shrink-0 border-b border-rivals-light-300 pb-3">
            <h3 className="font-display text-[1.65rem] font-extrabold uppercase italic leading-tight text-rivals-ink sm:text-3xl">
              {activeTab.label}
            </h3>
            <p className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7">
              {activeTab.summary}
            </p>
          </header>

          <div
            className={`flex min-h-0 flex-1 flex-col overflow-visible pt-4 transition-[opacity,transform] duration-300 ease-out sm:overflow-y-auto sm:overscroll-contain sm:[-webkit-overflow-scrolling:touch] ${
              contentVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            } scroll-smooth`}
          >
            {bodyNavItems.length > 0 ? (
              <>
                <details className="group mb-3 rounded-lg border border-rivals-light-300/80 bg-white/65 px-3 py-2 sm:hidden">
                  <summary className="cursor-pointer list-none font-display text-[11px] font-bold uppercase italic tracking-[0.18em] text-rivals-ink-muted">
                    Jump to section
                  </summary>
                  <div className="mt-2 grid gap-1.5">
                    {bodyNavItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="rounded px-2 py-1.5 text-xs font-semibold text-rivals-ink-soft transition-colors hover:bg-rivals-light-200 hover:text-rivals-ink"
                      >
                        {item.label}
                      </a>
                    ))}
                    <a
                      href={`#${heroGuideTopId}`}
                      className="rounded px-2 py-1.5 text-xs font-semibold text-rivals-ink-soft transition-colors hover:bg-rivals-light-200 hover:text-rivals-ink"
                    >
                      Back to top
                    </a>
                  </div>
                </details>

                <div className="mb-3 hidden sm:block sm:sticky sm:top-0 sm:z-10 sm:border-b sm:border-rivals-light-300/70 sm:bg-rivals-light-100/95 sm:pb-3 sm:pt-1 sm:backdrop-blur">
                  <div className="flex flex-wrap gap-1.5">
                    {bodyNavItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="inline-flex min-h-9 items-center rounded-full border border-rivals-light-300 bg-white/70 px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-rivals-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-rivals-yellow-500/55 hover:text-rivals-ink"
                      >
                        {item.label}
                      </a>
                    ))}
                    <a
                      href={`#${heroGuideTopId}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-rivals-light-300 bg-white/70 px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-rivals-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-rivals-yellow-500/55 hover:text-rivals-ink"
                    >
                      Top
                    </a>
                  </div>
                </div>
              </>
            ) : null}

            {activeTab.body && activeTab.body.length > 0 ? (
              <HeroGuideBody blocks={activeTab.body} anchorPrefix={bodyAnchorPrefix} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rivals-ink-muted">
                    Priority Cues
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
                    {(activeTab.primaryPoints ?? []).map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                {activeTab.secondaryPoints && activeTab.secondaryPoints.length > 0 ? (
                  <div>
                    <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rivals-ink-muted">
                      Secondary Cues
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
                      {activeTab.secondaryPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab.links && activeTab.links.length > 0 ? (
              <footer className="mt-auto flex flex-wrap gap-2.5 border-t border-rivals-light-300 pt-4">
                {activeTab.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-rivals-yellow-500 px-3.5 py-2 font-display text-xs uppercase italic tracking-[0.16em] text-rivals-ink transition-colors hover:bg-rivals-yellow-400"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden>&rarr;</span>
                  </a>
                ))}
              </footer>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
