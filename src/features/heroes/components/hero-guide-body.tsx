"use client";

import { type ReactNode, useMemo, useState } from "react";
import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import { DIFFICULTY_TIERS } from "@/features/heroes/combo-display";
import {
  buildHeroGuideBodyNavItems,
  buildPortraitLookup,
  findPortraitByOpponent,
  type HeroGuideBodyNavItem,
  type HeroPortraitEntry,
} from "./hero-guide-body/types";
import { BlockCallout } from "./hero-guide-body/block-callout";
import { BlockBullets } from "./hero-guide-body/block-bullets";
import { BlockTwoColumn } from "./hero-guide-body/block-two-column";
import { BlockCombo } from "./hero-guide-body/block-combo";
import { BlockMatchup } from "./hero-guide-body/block-matchup";
import { BlockVideo } from "./hero-guide-body/block-video";
import {
  ComboFilterPills,
  DifficultyGroupHeader,
} from "./hero-guide-body/combo-groups";

// Re-export public types and helpers so existing callers don't break.
export type { HeroGuideBodyNavItem, HeroPortraitEntry };
export { buildHeroGuideBodyNavItems };

type ComboBlock = Extract<HeroGuideBlock, { type: "combo" }>;

type IndexedComboBlock = {
  block: ComboBlock;
  index: number;
};

/**
 * Section wrapper applied to every rendered block. Adds the scroll anchor
 * + the reveal-on-scroll animation hook. Pulled out so each block-render
 * site stays tiny and consistent.
 */
function GuideSection({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-reveal scroll-mt-28">
      {children}
    </section>
  );
}

type HeroGuideBodyProps = {
  blocks: HeroGuideBlock[];
  anchorPrefix: string;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  heroPortraits?: HeroPortraitEntry[];
};

export function HeroGuideBody({
  blocks,
  anchorPrefix,
  abilityLookup,
  heroPortraits,
}: HeroGuideBodyProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const navItems = useMemo(
    () => buildHeroGuideBodyNavItems(blocks, anchorPrefix),
    [blocks, anchorPrefix],
  );

  const portraitLookup = useMemo(
    () => buildPortraitLookup(heroPortraits),
    [heroPortraits],
  );

  // Compute combo grouping once per blocks change. `groupedCombos` is null
  // unless there are ≥2 tagged combos -- below that threshold we render
  // each combo inline like the other block types so single-combo tabs
  // don't pick up an unnecessary section header.
  const comboMeta = useMemo(() => {
    const indexed: IndexedComboBlock[] = [];
    blocks.forEach((block, index) => {
      if (block.type === "combo") indexed.push({ block, index });
    });

    const taggedCount = indexed.filter((c) => c.block.difficulty).length;
    const hasDifficultyTags = taggedCount >= 2;

    if (!hasDifficultyTags) {
      return {
        hasDifficultyTags: false,
        renderedComboIndices: new Set<number>(),
        availableDifficulties: new Set<string>(),
        groups: null,
        untagged: [] as IndexedComboBlock[],
      };
    }

    const availableDifficulties = new Set<string>();
    for (const c of indexed) {
      if (c.block.difficulty) availableDifficulties.add(c.block.difficulty);
    }

    const groups = DIFFICULTY_TIERS
      .filter((tier) => availableDifficulties.has(tier.key))
      .map((tier) => ({
        tier,
        combos: indexed.filter((c) => c.block.difficulty === tier.key),
      }));

    const untagged = indexed.filter((c) => !c.block.difficulty);
    const renderedComboIndices = new Set<number>(indexed.map((c) => c.index));

    return {
      hasDifficultyTags: true,
      renderedComboIndices,
      availableDifficulties,
      groups,
      untagged,
    };
  }, [blocks]);

  const renderBlock = (block: HeroGuideBlock, index: number): ReactNode => {
    const navItem = navItems[index];

    switch (block.type) {
      case "callout":
        return (
          <GuideSection id={navItem.id}>
            <BlockCallout variant={block.variant} title={block.title} body={block.body} />
          </GuideSection>
        );
      case "bullets":
        return (
          <GuideSection id={navItem.id}>
            <BlockBullets title={block.title} items={block.items} />
          </GuideSection>
        );
      case "twoColumn":
        return (
          <GuideSection id={navItem.id}>
            <BlockTwoColumn
              leftTitle={block.leftTitle}
              leftItems={block.leftItems}
              rightTitle={block.rightTitle}
              rightItems={block.rightItems}
            />
          </GuideSection>
        );
      case "combo":
        return (
          <GuideSection id={navItem.id}>
            <BlockCombo block={block} abilityLookup={abilityLookup} clip={block.clip} />
          </GuideSection>
        );
      case "matchup":
        return (
          <GuideSection id={navItem.id}>
            <BlockMatchup
              disposition={block.disposition}
              opponent={block.opponent}
              summary={block.summary}
              clip={block.clip}
              portrait={findPortraitByOpponent(portraitLookup, block.opponent)}
            />
          </GuideSection>
        );
      case "video":
        return (
          <GuideSection id={navItem.id}>
            <BlockVideo title={block.title} watchUrl={block.watchUrl} />
          </GuideSection>
        );
    }
  };

  let comboGroupInserted = false;

  return (
    <div className="space-y-6 pb-1 sm:space-y-5">
      {blocks.map((block, index) => {
        // When difficulty tags are present, all combo blocks render together
        // inside a single grouped section in place of the first combo block.
        if (comboMeta.hasDifficultyTags && comboMeta.renderedComboIndices.has(index)) {
          if (comboGroupInserted) return null;
          comboGroupInserted = true;

          return (
            <div key="combo-groups" className="space-y-6">
              <ComboFilterPills
                active={difficultyFilter}
                onChange={setDifficultyFilter}
                availableDifficulties={comboMeta.availableDifficulties}
              />

              {comboMeta.groups?.map(({ tier, combos }) => {
                if (difficultyFilter !== "all" && difficultyFilter !== tier.key) {
                  return null;
                }
                if (combos.length === 0) return null;
                return (
                  <div key={tier.key} className="scroll-reveal space-y-4">
                    <DifficultyGroupHeader label={tier.label} className={tier.lightClass} />
                    {combos.map(({ block: comboBlock, index: comboIndex }) => (
                      <div key={`combo-${comboIndex}`}>
                        {renderBlock(comboBlock, comboIndex)}
                      </div>
                    ))}
                  </div>
                );
              })}

              {comboMeta.untagged.length > 0 && difficultyFilter === "all"
                ? comboMeta.untagged.map(({ block: comboBlock, index: comboIndex }) => (
                    <div key={`combo-untagged-${comboIndex}`}>
                      {renderBlock(comboBlock, comboIndex)}
                    </div>
                  ))
                : null}
            </div>
          );
        }

        return <div key={`block-${index}-${block.type}`}>{renderBlock(block, index)}</div>;
      })}
    </div>
  );
}
