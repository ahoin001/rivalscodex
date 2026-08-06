"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import { HeroGuideBody } from "@/features/heroes/components/hero-guide-body";
import { useOptionalAbilityLookup } from "@/features/heroes/components/ability-lookup-provider";
import { ComboShowcaseCard } from "@/features/heroes/components/hero-guide-body/combo-showcase-card";
import {
  ComboFilterPills,
  TagFilterPills,
} from "@/features/heroes/components/hero-guide-body/combo-groups";
import { getDifficultyTier } from "@/features/heroes/combo-display";
import { scrollTargetIntoPanel } from "@/features/heroes/components/guide-panel-scroll";
import { buildHeroGuideBodyNavItems } from "@/features/heroes/components/hero-guide-body/types";

type ComboBlock = Extract<HeroGuideBlock, { type: "combo" }>;

type IndexedCombo = {
  block: ComboBlock;
  blockIndex: number;
  sectionId: string;
};

type CombosReaderPanelProps = {
  bodyBlocks: HeroGuideBlock[];
  anchorPrefix: string;
};

function comboPassesFilters(
  block: ComboBlock,
  difficultyFilter: string,
  tagFilter: string,
): boolean {
  if (difficultyFilter !== "all" && block.difficulty !== difficultyFilter) {
    return false;
  }
  if (tagFilter !== "all") {
    const tags = block.tags ?? [];
    if (!tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function getComboStepCount(block: ComboBlock): number {
  if (block.structuredSteps && block.structuredSteps.length > 0) {
    return block.structuredSteps.length;
  }
  return block.steps.length;
}

const pickerChipBase =
  "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-[0.12em] transition-all duration-[var(--motion-fast)] ease-[var(--ease-out-soft)]";

function ComboPickerChip({
  combo,
  active,
  onSelect,
}: {
  combo: IndexedCombo;
  active: boolean;
  onSelect: () => void;
}) {
  const tier = getDifficultyTier(combo.block.difficulty);
  const stepCount = getComboStepCount(combo.block);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`${pickerChipBase} ${
        active
          ? "border-brand-gold/55 bg-brand-gold/15 text-rivals-ink shadow-sm"
          : "border-rivals-light-300 bg-white/80 text-rivals-ink-soft hover:-translate-y-0.5 hover:border-rivals-yellow-500/55 hover:text-rivals-ink"
      }`}
      style={{ scrollSnapAlign: "start" }}
    >
      <span className="max-w-[14ch] truncate">{combo.block.name}</span>
      {tier ? (
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${tier.lightClass}`}
        >
          {tier.label}
        </span>
      ) : null}
      <span className="text-[9px] tabular-nums text-rivals-ink-muted">{stepCount} steps</span>
    </button>
  );
}

export function CombosReaderPanel({
  bodyBlocks,
  anchorPrefix,
}: CombosReaderPanelProps) {
  const abilityLookup = useOptionalAbilityLookup();
  const cardRefs = useRef(new Map<number, HTMLElement>());

  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [showAllMobile, setShowAllMobile] = useState(false);

  const navItems = useMemo(
    () => buildHeroGuideBodyNavItems(bodyBlocks, anchorPrefix),
    [bodyBlocks, anchorPrefix],
  );

  const nonComboBlocks = useMemo(
    () => bodyBlocks.filter((b) => b.type !== "combo"),
    [bodyBlocks],
  );

  const indexedCombos = useMemo((): IndexedCombo[] => {
    const combos: IndexedCombo[] = [];
    bodyBlocks.forEach((block, blockIndex) => {
      if (block.type !== "combo") return;
      combos.push({
        block,
        blockIndex,
        sectionId: navItems[blockIndex]?.id ?? `${anchorPrefix}-combo-${blockIndex}`,
      });
    });
    return combos;
  }, [bodyBlocks, navItems, anchorPrefix]);

  const filteredCombos = useMemo(
    () =>
      indexedCombos.filter(({ block }) =>
        comboPassesFilters(block, difficultyFilter, tagFilter),
      ),
    [indexedCombos, difficultyFilter, tagFilter],
  );

  const availableDifficulties = useMemo(() => {
    const set = new Set<string>();
    for (const { block } of indexedCombos) {
      if (block.difficulty) set.add(block.difficulty);
    }
    return set;
  }, [indexedCombos]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const { block } of indexedCombos) {
      for (const tag of block.tags ?? []) set.add(tag);
    }
    return set;
  }, [indexedCombos]);

  const activeBlockIndex =
    selectedBlockIndex !== null &&
    filteredCombos.some((c) => c.blockIndex === selectedBlockIndex)
      ? selectedBlockIndex
      : (filteredCombos[0]?.blockIndex ?? null);

  const scrollToCombo = useCallback(
    (blockIndex: number) => {
      setSelectedBlockIndex(blockIndex);
      const node = cardRefs.current.get(blockIndex);
      if (!node) return;
      scrollTargetIntoPanel(node, {
        offset: 80,
        behavior: "smooth",
      });
    },
    [],
  );

  const setCardRef = useCallback((blockIndex: number, node: HTMLElement | null) => {
    if (node) {
      cardRefs.current.set(blockIndex, node);
    } else {
      cardRefs.current.delete(blockIndex);
    }
  }, []);

  if (indexedCombos.length === 0) {
    return (
      <div className="space-y-6">
        {nonComboBlocks.length > 0 ? (
          <HeroGuideBody
            blocks={nonComboBlocks}
            anchorPrefix={anchorPrefix}
            abilityLookup={abilityLookup}
          />
        ) : null}
        <div className="rounded-lg border border-dashed border-rivals-light-300 bg-white/70 px-6 py-10 text-center">
          <p className="font-display text-sm font-bold uppercase italic text-rivals-ink">
            No combo routes yet
          </p>
          <p className="mt-2 text-xs leading-relaxed text-rivals-ink-soft">
            Combo routes for this hero will appear here once published.
          </p>
        </div>
      </div>
    );
  }

  const showSideIndex = filteredCombos.length >= 5;

  return (
    <div className="space-y-5 pb-1 sm:space-y-6">
      {nonComboBlocks.length > 0 ? (
        <HeroGuideBody
          blocks={nonComboBlocks}
          anchorPrefix={anchorPrefix}
          abilityLookup={abilityLookup}
        />
      ) : null}

      {indexedCombos.length >= 2 ? (
        <div className="space-y-2 rounded-lg border border-rivals-light-300/80 bg-rivals-light-50/60 px-3 py-2">
          <ComboFilterPills
            active={difficultyFilter}
            onChange={setDifficultyFilter}
            availableDifficulties={availableDifficulties}
          />
          <TagFilterPills
            active={tagFilter}
            onChange={setTagFilter}
            availableTags={availableTags}
          />
        </div>
      ) : null}

      {filteredCombos.length === 0 ? (
        <p className="rounded-lg border border-rivals-light-300 bg-white/70 px-4 py-6 text-center text-sm text-rivals-ink-soft">
          No combos match the current filters.
        </p>
      ) : (
        <>
          {filteredCombos.length > 1 ? (
            <div className="sticky top-0 z-10 -mx-1 space-y-2 border-b border-rivals-light-300/70 bg-rivals-light-100/95 px-1 pb-3 pt-1 backdrop-blur md:hidden sm:mx-0 sm:px-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[10px] font-bold uppercase italic tracking-[0.18em] text-rivals-ink-muted">
                  Combo routes
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllMobile((v) => !v)}
                  className="text-[10px] font-semibold uppercase tracking-wide text-brand-gold underline-offset-2 hover:underline"
                >
                  {showAllMobile ? "Single view" : "Show all"}
                </button>
              </div>

              <div
                className="flex gap-1.5 overflow-x-auto pb-0.5"
                style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                role="tablist"
                aria-label="Combo routes"
              >
                {filteredCombos.map((combo) => (
                  <ComboPickerChip
                    key={combo.blockIndex}
                    combo={combo}
                    active={activeBlockIndex === combo.blockIndex}
                    onSelect={() => setSelectedBlockIndex(combo.blockIndex)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div
            className={
              showSideIndex
                ? "flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-start lg:gap-8"
                : "flex flex-col gap-6 sm:gap-8"
            }
          >
            {showSideIndex ? (
              <nav
                className="hidden shrink-0 lg:block lg:w-44 xl:w-52"
                aria-label="Combo index"
              >
                <ul className="sticky top-16 space-y-1">
                  {filteredCombos.map((combo) => (
                    <li key={combo.blockIndex}>
                      <button
                        type="button"
                        onClick={() => scrollToCombo(combo.blockIndex)}
                        className={`w-full rounded-md px-2 py-2 text-left text-[11px] font-semibold leading-snug transition-colors ${
                          activeBlockIndex === combo.blockIndex
                            ? "bg-brand-gold/15 text-rivals-ink"
                            : "text-rivals-ink-soft hover:bg-rivals-light-200 hover:text-rivals-ink"
                        }`}
                      >
                        {combo.block.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <div
              className={`min-w-0 flex flex-col gap-6 sm:gap-8 ${showSideIndex ? "flex-1" : "w-full"}`}
            >
              {filteredCombos.map((combo) => {
                const isMobileSingle =
                  !showAllMobile &&
                  activeBlockIndex !== null &&
                  combo.blockIndex !== activeBlockIndex;

                return (
                  <div
                    key={combo.blockIndex}
                    className={isMobileSingle ? "hidden md:block" : undefined}
                  >
                    <ComboShowcaseCard
                      block={combo.block}
                      abilityLookup={abilityLookup}
                      sectionId={combo.sectionId}
                      sectionRef={(node) => setCardRef(combo.blockIndex, node)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
