"use client";

import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { RivalsTab, RivalsTabBar } from "@/components/ui";
import type {
  HeroGuideTabContent,
  HeroGuideTabId,
} from "@/features/heroes/hero-guide-schema";
import {
  buildHeroGuideBodyNavItems,
  HeroGuideBody,
  type HeroPortraitEntry,
} from "@/features/heroes/components/hero-guide-body";
import { CombosTabPanel } from "@/features/heroes/components/combos-tab-panel";
import { MatchupsTabPanel } from "@/features/heroes/components/matchups-tab-panel";
import { KitTabPanel } from "@/features/heroes/components/kit-tab-panel";
import { NotesTabPanel } from "@/features/heroes/components/notes-tab-panel";
import { GuideTabFallback } from "@/features/heroes/components/guide-tab-fallback";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { useOptionalAbilityLookup } from "@/features/heroes/components/ability-lookup-provider";
import { RIVALS_LUNA } from "@/lib/rivals-assets-paths";
import { HeroGuideFullEditorLink } from "@/features/heroes/components/hero-guide-full-editor-link";
import { scrollTargetIntoPanel } from "@/features/heroes/components/guide-panel-scroll";

type HeroGuideConsoleProps = {
  heroId: string;
  heroName: string;
  /** Per-hero stack-logo backdrop URL from the codex. Falls back to the Luna chrome asset. */
  stackLogoUrl?: string;
  subtitle?: string;
  tabs: HeroGuideTabContent[];
  defaultTabId?: HeroGuideTabId;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  heroPortraits?: HeroPortraitEntry[];
  className?: string;
  /** When set, shows “Open full tab editor” in the guide section header. */
  fullTabEditorHref?: string | null;
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

const GUIDE_SECTION_NAV_CHIP =
  "inline-flex min-h-9 items-center rounded-full border border-rivals-light-300 bg-white/70 px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-rivals-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-rivals-yellow-500/55 hover:text-rivals-ink";

function GuideSectionNav({
  items,
  scrollContainerRef,
  topLabel = "Top",
  onScrollTop,
  variant,
}: {
  items: { id: string; label: string }[];
  scrollContainerRef: RefObject<HTMLElement | null>;
  topLabel?: string;
  onScrollTop: () => void;
  variant: "mobile" | "desktop";
}) {
  const scrollToSection = useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      scrollTargetIntoPanel(target, {
        container: scrollContainerRef.current,
        offset: 48,
        behavior: "smooth",
      });
    },
    [scrollContainerRef],
  );

  if (variant === "mobile") {
    return (
      <details className="group mb-3 rounded-lg border border-rivals-light-300/80 bg-white/65 px-3 py-2 sm:hidden">
        <summary className="cursor-pointer list-none font-display text-[11px] font-bold uppercase italic tracking-[0.18em] text-rivals-ink-muted">
          Jump to section
        </summary>
        <div className="mt-2 grid gap-1.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="rounded px-2 py-1.5 text-left text-xs font-semibold text-rivals-ink-soft transition-colors hover:bg-rivals-light-200 hover:text-rivals-ink"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onScrollTop}
            className="rounded px-2 py-1.5 text-left text-xs font-semibold text-rivals-ink-soft transition-colors hover:bg-rivals-light-200 hover:text-rivals-ink"
          >
            {topLabel === "Top" ? "Back to top" : topLabel}
          </button>
        </div>
      </details>
    );
  }

  return (
    <div className="mb-3 hidden sm:block sm:sticky sm:top-0 sm:z-10 sm:border-b sm:border-rivals-light-300/70 sm:bg-rivals-light-100/95 sm:pb-3 sm:pt-1 sm:backdrop-blur">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={GUIDE_SECTION_NAV_CHIP}
          >
            {item.label}
          </button>
        ))}
        <button type="button" onClick={onScrollTop} className={GUIDE_SECTION_NAV_CHIP}>
          {topLabel}
        </button>
      </div>
    </div>
  );
}

const GUIDE_TAB_SHORT_LABELS: Record<HeroGuideTabId, string> = {
  overview: "Overview",
  abilities: "Kit",
  combos: "Combos",
  matchups: "Matchups",
  resources: "Resources",
  notes: "Notes",
};

export function HeroGuideConsole({
  heroId,
  heroName,
  stackLogoUrl,
  subtitle,
  tabs,
  defaultTabId,
  abilityLookup: abilityLookupProp,
  heroPortraits,
  className = "",
  fullTabEditorHref = null,
}: HeroGuideConsoleProps) {
  const optionalAbilityLookup = useOptionalAbilityLookup();
  const abilityLookup = abilityLookupProp ?? optionalAbilityLookup;
  const initialTabId = defaultTabId ?? tabs[0]?.id;
  const [activeTabId, setActiveTabId] = useState<HeroGuideTabId>(
    (initialTabId ?? "overview") as HeroGuideTabId,
  );

  const backdropImage = stackLogoUrl ?? RIVALS_LUNA.stackLogo;
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const heroSlugLike = useMemo(
    () => heroName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    [heroName],
  );
  const heroGuideTopId = `${heroSlugLike}-guide-top`;
  const tabListIdBase = `${heroSlugLike}-guide-tabs`;
  const activePanelId = `${tabListIdBase}-panel`;
  const activeTabButtonId = `${tabListIdBase}-tab-${activeTabId}`;
  const bodyAnchorPrefix = `${heroSlugLike}-${activeTabId}`;
  const bodyNavItems = useMemo(
    () => (activeTab.body ? buildHeroGuideBodyNavItems(activeTab.body, bodyAnchorPrefix) : []),
    [activeTab.body, bodyAnchorPrefix],
  );

  const tabBarItems: RivalsTab[] = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        shortLabel: GUIDE_TAB_SHORT_LABELS[tab.id],
      })),
    [tabs],
  );

  // Parallax: write transform directly to the backdrop via ref + rAF.
  // Using setState here would re-render the entire console on every
  // scroll frame, which is wasteful and stutters on lower-end machines.
  const sectionRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const scrollPanelToTop = useCallback(() => {
    tabScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const showGenericSectionNav =
    bodyNavItems.length > 0 && activeTabId !== "combos";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let rafId = 0;
    let queued = false;

    const apply = () => {
      queued = false;
      const section = sectionRef.current;
      const backdrop = backdropRef.current;
      if (!section || !backdrop) return;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewH) return;
      const progress = -rect.top / (rect.height + viewH);
      backdrop.style.transform = `translate3d(0, ${progress * 40}px, 0)`;
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      rafId = requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!activeTab) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      id={heroGuideTopId}
      className={`relative isolate w-full overflow-hidden border-b border-black/40 bg-black pb-[max(4rem,env(safe-area-inset-bottom))] sm:pb-20 ${className}`.trim()}
      aria-label={`${heroName} hero guide`}
    >
      {/* Feathered stack art: subdued + masked so typography stays dominant.
          Transform is mutated directly by the parallax effect below — DO NOT
          drive this with React state or you'll re-render every scroll frame. */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <div
          ref={backdropRef}
          className="absolute inset-0 opacity-[0.48] will-change-transform"
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
        <header className="flex flex-wrap items-start justify-between gap-3 drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]">
          <div className="min-w-0 space-y-3">
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
          </div>
          {fullTabEditorHref ? (
            <HeroGuideFullEditorLink href={fullTabEditorHref} className="mt-1" />
          ) : null}
        </header>

        <RivalsTabBar
          tabs={tabBarItems}
          activeTabId={activeTabId}
          onChange={(tabId) => setActiveTabId(tabId as HeroGuideTabId)}
          idBase={tabListIdBase}
          getPanelId={() => activePanelId}
          className="-mx-1 px-1 sm:mx-0 sm:px-0"
        />

        {/* Fixed-height shell: tab switches swap body inside scroll region so outer layout doesn’t jump */}
        <article
          className="clip-reveal rivals-clip-row flex flex-col rounded-xl border border-white/15 bg-rivals-light-100/96 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.26)] backdrop-blur-sm sm:min-h-[min(58vh,38rem)] sm:rounded-none sm:p-6 sm:shadow-[0_12px_48px_rgba(0,0,0,0.35)] lg:min-h-[min(52vh,40rem)]"
          aria-live="polite"
          role="tabpanel"
          id={activePanelId}
          aria-labelledby={activeTabButtonId}
        >
          <header className="shrink-0 border-b border-rivals-light-300 pb-3">
            <h3 className="font-display text-[1.65rem] font-extrabold uppercase italic leading-tight text-rivals-ink sm:text-3xl">
              {activeTab.label}
            </h3>
            {activeTab.id !== "notes" ? (
              <p className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7">
                {activeTab.summary}
              </p>
            ) : null}
          </header>

          <div
            ref={tabScrollRef}
            key={activeTabId}
            className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pt-4 sm:overflow-y-auto sm:overscroll-contain sm:[-webkit-overflow-scrolling:touch] scroll-smooth ${
              "tab-enter"
            }`}
          >
            {showGenericSectionNav ? (
              <>
                <GuideSectionNav
                  items={bodyNavItems}
                  scrollContainerRef={tabScrollRef}
                  onScrollTop={scrollPanelToTop}
                  variant="mobile"
                />
                <GuideSectionNav
                  items={bodyNavItems}
                  scrollContainerRef={tabScrollRef}
                  onScrollTop={scrollPanelToTop}
                  variant="desktop"
                />
              </>
            ) : null}

            {activeTabId === "combos" ? (
                <CombosTabPanel
                  bodyBlocks={activeTab.body ?? []}
                  anchorPrefix={bodyAnchorPrefix}
                  heroPortraits={heroPortraits}
                  scrollContainerRef={tabScrollRef}
                />
              ) : activeTabId === "notes" ? (
                <NotesTabPanel heroId={heroId} heroName={heroName} />
              ) : activeTabId === "matchups" ? (
                <MatchupsTabPanel blocks={activeTab.body ?? []} heroPortraits={heroPortraits} />
              ) : activeTabId === "abilities" ? (
                <KitTabPanel
                  blocks={activeTab.body ?? []}
                  abilityLookup={abilityLookup}
                  primaryPoints={activeTab.primaryPoints}
                  secondaryPoints={activeTab.secondaryPoints}
                />
              ) : activeTab.body && activeTab.body.length > 0 ? (
                <HeroGuideBody
                  blocks={activeTab.body}
                  anchorPrefix={bodyAnchorPrefix}
                  abilityLookup={abilityLookup}
                  heroPortraits={heroPortraits}
                />
              ) : (
              <GuideTabFallback
                primaryPoints={activeTab.primaryPoints}
                secondaryPoints={activeTab.secondaryPoints}
              />
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
