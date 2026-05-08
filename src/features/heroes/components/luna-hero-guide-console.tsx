"use client";

import { type CSSProperties, useMemo, useState } from "react";
import Image from "next/image";
import { RivalsTab, RivalsTabBar } from "@/components/ui";
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
      className={`relative isolate w-full overflow-hidden border-b border-black/40 bg-black pb-16 sm:pb-20 ${className}`.trim()}
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
            src={lunaStackLogoImage}
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

      <div className="relative z-10 mx-auto flex min-h-[26rem] w-full max-w-[min(100%,1680px)] flex-col gap-7 px-5 pt-5 pb-0 sm:min-h-[30rem] sm:gap-8 sm:px-8 sm:pt-6 lg:min-h-[32rem] lg:gap-10 lg:px-12 lg:pt-7">
        <header className="space-y-3 drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]">
          <p className="text-[11px] uppercase tracking-[0.36em] text-white/75 sm:text-xs">
            Hero Guide
          </p>
          <h2 className="slanted-title font-display text-[2.6rem] font-extrabold uppercase italic leading-[0.9] text-white sm:text-[3.6rem] lg:text-[4.25rem]">
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
          onChange={(tabId) => setActiveTabId(tabId as LunaHeroGuideTabId)}
        />

        <article className="rivals-clip-row border border-white/12 bg-rivals-light-100/96 p-5 shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6">
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
    </section>
  );
}
