"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { RivalsTab, RivalsTabBar } from "@/components/ui";
import activeHeroFrameImage from "../../../../rivals-assets/frames/active-hero-frame.png";
import lunaStackLogoImage from "../../../../rivals-assets/heros/luna/luna-stack-logo.png";

export type LunaHeroGuideTabId =
  | "abilities"
  | "combos"
  | "playstyle"
  | "resources"
  | "notes";

export type LunaHeroGuideTabContent = {
  id: LunaHeroGuideTabId;
  label: string;
  summary: string;
  primaryPoints: string[];
  secondaryPoints?: string[];
  links?: Array<{ label: string; href: string }>;
};

type LunaHeroGuideConsoleProps = {
  heroName: string;
  subtitle?: string;
  tabs: LunaHeroGuideTabContent[];
  defaultTabId?: LunaHeroGuideTabId;
  className?: string;
};

export function LunaHeroGuideConsole({
  heroName,
  subtitle,
  tabs,
  defaultTabId,
  className = "",
}: LunaHeroGuideConsoleProps) {
  const initialTabId = defaultTabId ?? tabs[0]?.id;
  const [activeTabId, setActiveTabId] = useState<LunaHeroGuideTabId>(
    (initialTabId ?? "abilities") as LunaHeroGuideTabId,
  );

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  );

  const tabBarItems: RivalsTab[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
  }));

  if (!activeTab) {
    return null;
  }

  return (
    <section
      className={`relative w-full ${className}`.trim()}
      aria-label={`${heroName} hero guide`}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image
            src={activeHeroFrameImage}
            alt=""
            fill
            sizes="100vw"
            aria-hidden
            className="object-cover object-center opacity-95"
          />
        </div>

        <div className="relative grid gap-0 lg:grid-cols-[7fr_5fr]">
          <div className="flex flex-col gap-6 px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <header className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-rivals-ink-soft">
                Hero Guide
              </p>
              <h2 className="slanted-title font-display text-[2.8rem] font-extrabold uppercase italic leading-[0.9] text-rivals-ink sm:text-[4rem] lg:text-[5rem]">
                <span>{heroName}</span>
              </h2>
              {subtitle ? (
                <p className="inline-flex bg-rivals-ink px-3 py-1 font-display text-xs italic uppercase tracking-[0.22em] text-white">
                  {subtitle}
                </p>
              ) : null}
            </header>

            <RivalsTabBar
              tabs={tabBarItems}
              activeTabId={activeTabId}
              onChange={(tabId) => setActiveTabId(tabId as LunaHeroGuideTabId)}
            />

            <article className="rivals-clip-row bg-rivals-light-100/95 p-5 backdrop-blur sm:p-6">
              <header className="border-b border-rivals-light-300 pb-3">
                <h3 className="font-display text-2xl font-extrabold uppercase italic text-rivals-ink sm:text-3xl">
                  {activeTab.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7">
                  {activeTab.summary}
                </p>
              </header>

              <div className="grid gap-5 pt-4 sm:grid-cols-2">
                <div>
                  <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rivals-ink-muted">
                    Priority Cues
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
                    {activeTab.primaryPoints.map((point) => (
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

              {activeTab.links && activeTab.links.length > 0 ? (
                <footer className="mt-5 flex flex-wrap gap-2 border-t border-rivals-light-300 pt-4">
                  {activeTab.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-rivals-yellow-500 px-3 py-1.5 font-display text-xs uppercase italic tracking-[0.18em] text-rivals-ink transition-colors hover:bg-rivals-yellow-400"
                    >
                      <span>{link.label}</span>
                      <span aria-hidden>&rarr;</span>
                    </a>
                  ))}
                </footer>
              ) : null}
            </article>
          </div>

          <div className="relative h-72 sm:h-96 lg:h-auto">
            <Image
              src={lunaStackLogoImage}
              alt={`${heroName} stacked logo`}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain object-center lg:object-right"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rivals-light-100/30 via-transparent to-transparent lg:from-rivals-light-100/10" />
          </div>
        </div>
      </div>
    </section>
  );
}
