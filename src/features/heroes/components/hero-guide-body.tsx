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
import { ComboRouteCard } from "./hero-guide-body/combo-route-card";
import { BlockAbilityTip } from "./hero-guide-body/block-ability-tip";
import { BlockMatchup } from "./hero-guide-body/block-matchup";
import { BlockVideo } from "./hero-guide-body/block-video";
import { BlockStrengthsWeaknesses } from "./hero-guide-body/block-strengths-weaknesses";
import {
  ComboFilterPills,
  DifficultyGroupHeader,
  TagFilterPills,
} from "./hero-guide-body/combo-groups";

export type { HeroGuideBodyNavItem, HeroPortraitEntry };
export { buildHeroGuideBodyNavItems };

type ComboBlock = Extract<HeroGuideBlock, { type: "combo" }>;

type IndexedComboBlock = {
  block: ComboBlock;
  index: number;
};

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

type HeroGuideBodyProps = {
  blocks: HeroGuideBlock[];
  anchorPrefix: string;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  heroPortraits?: HeroPortraitEntry[];
  comboEditMode?: boolean;
  editingComboBlockIndex?: number | null;
  onComboBlockReplace?: (index: number, next: ComboBlock) => void;
  onComboBlockDuplicate?: (index: number) => void;
  onComboBlockDelete?: (index: number) => void;
  onComboBlockMove?: (index: number, dir: -1 | 1) => void;
  onComboStartEdit?: (index: number) => void;
  onComboStopEdit?: () => void;
};

export function HeroGuideBody({
  blocks,
  anchorPrefix,
  abilityLookup,
  heroPortraits,
  comboEditMode = false,
  editingComboBlockIndex = null,
  onComboBlockReplace,
  onComboBlockDuplicate,
  onComboBlockDelete,
  onComboBlockMove,
  onComboStartEdit,
  onComboStopEdit,
}: HeroGuideBodyProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const navItems = useMemo(
    () => buildHeroGuideBodyNavItems(blocks, anchorPrefix),
    [blocks, anchorPrefix],
  );

  const portraitLookup = useMemo(
    () => buildPortraitLookup(heroPortraits),
    [heroPortraits],
  );

  const comboMeta = useMemo(() => {
    const indexed: IndexedComboBlock[] = [];
    blocks.forEach((block, index) => {
      if (block.type === "combo") indexed.push({ block, index });
    });

    const taggedDifficultyCount = indexed.filter((c) => c.block.difficulty).length;
    const hasDifficultyTags = taggedDifficultyCount >= 2;

    const availableDifficulties = new Set<string>();
    const availableTags = new Set<string>();
    for (const c of indexed) {
      if (c.block.difficulty) availableDifficulties.add(c.block.difficulty);
      for (const tag of c.block.tags ?? []) {
        availableTags.add(tag);
      }
    }

    const groups = hasDifficultyTags
      ? DIFFICULTY_TIERS.filter((tier) => availableDifficulties.has(tier.key)).map(
          (tier) => ({
            tier,
            combos: indexed.filter((c) => c.block.difficulty === tier.key),
          }),
        )
      : null;

    const untagged = indexed.filter((c) => !c.block.difficulty);
    const renderedComboIndices = hasDifficultyTags
      ? new Set<number>(indexed.map((c) => c.index))
      : new Set<number>();

    const comboOnlyIndices = indexed.map((c) => c.index);
    const comboCount = indexed.length;

    return {
      indexed,
      hasDifficultyTags,
      renderedComboIndices,
      availableDifficulties,
      availableTags,
      groups,
      untagged,
      comboOnlyIndices,
      comboCount,
    };
  }, [blocks]);

  const renderComboBlock = (block: ComboBlock, index: number): ReactNode => {
    const navItem = navItems[index];
    const useRouteCard = !!abilityLookup;

    const comboOnlyPos = comboMeta.comboOnlyIndices.indexOf(index);
    const canMoveUp = comboOnlyPos > 0;
    const canMoveDown = comboOnlyPos >= 0 && comboOnlyPos < comboMeta.comboCount - 1;

    const card = useRouteCard ? (
      <ComboRouteCard
        block={block}
        blockIndex={index}
        abilityLookup={abilityLookup}
        editMode={comboEditMode}
        isEditing={editingComboBlockIndex === index}
        onStartEdit={() => onComboStartEdit?.(index)}
        onStopEdit={onComboStopEdit}
        onReplace={(next) => onComboBlockReplace?.(index, next)}
        onDuplicate={() => onComboBlockDuplicate?.(index)}
        onDelete={() => onComboBlockDelete?.(index)}
        onMove={(dir) => onComboBlockMove?.(index, dir)}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        comboIndex={comboOnlyPos >= 0 ? comboOnlyPos : 0}
        totalCombos={comboMeta.comboCount}
      />
    ) : (
      <BlockCombo block={block} abilityLookup={abilityLookup} clip={block.clip} />
    );

    return <GuideSection id={navItem.id}>{card}</GuideSection>;
  };

  const renderBlock = (block: HeroGuideBlock, index: number): ReactNode => {
    if (block.type === "combo") {
      return renderComboBlock(block, index);
    }

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
      case "abilityTip":
        return (
          <GuideSection id={navItem.id}>
            <BlockAbilityTip block={block} abilityLookup={abilityLookup} />
          </GuideSection>
        );
      case "video":
        return (
          <GuideSection id={navItem.id}>
            <BlockVideo title={block.title} watchUrl={block.watchUrl} />
          </GuideSection>
        );
      case "strengthsWeaknesses":
        return (
          <GuideSection id={navItem.id}>
            <BlockStrengthsWeaknesses
              title={block.title}
              strengths={block.strengths}
              weaknesses={block.weaknesses}
            />
          </GuideSection>
        );
    }
  };

  const filterCombo = (entry: IndexedComboBlock) =>
    comboPassesFilters(entry.block, difficultyFilter, tagFilter);

  return (
    <div className="space-y-6 pb-1 sm:space-y-5">
      {comboMeta.indexed.length >= 2 && !comboEditMode ? (
        <div className="space-y-2 rounded-lg border border-rivals-light-300/80 bg-rivals-light-50/60 px-3 py-2">
          <ComboFilterPills
            active={difficultyFilter}
            onChange={setDifficultyFilter}
            availableDifficulties={comboMeta.availableDifficulties}
          />
          <TagFilterPills
            active={tagFilter}
            onChange={setTagFilter}
            availableTags={comboMeta.availableTags}
          />
        </div>
      ) : null}

      {comboMeta.hasDifficultyTags ? (
        <div key="combo-groups" className="space-y-6">
          {comboMeta.groups?.map(({ tier, combos }) => {
            const visible = combos.filter(filterCombo);
            if (visible.length === 0) return null;
            return (
              <div key={tier.key} className="scroll-reveal space-y-4">
                <DifficultyGroupHeader label={tier.label} className={tier.lightClass} />
                {visible.map(({ block: comboBlock, index: comboIndex }) => (
                  <div key={`combo-${comboIndex}`}>
                    {renderComboBlock(comboBlock, comboIndex)}
                  </div>
                ))}
              </div>
            );
          })}

          {comboMeta.untagged.filter(filterCombo).map(({ block: comboBlock, index: comboIndex }) => (
            <div key={`combo-untagged-${comboIndex}`}>
              {renderComboBlock(comboBlock, comboIndex)}
            </div>
          ))}
        </div>
      ) : null}

      {blocks.map((block, index) => {
        if (block.type === "combo" && comboMeta.hasDifficultyTags) {
          return null;
        }

        if (block.type === "combo" && !filterCombo({ block, index })) {
          return null;
        }

        return <div key={`block-${index}-${block.type}`}>{renderBlock(block, index)}</div>;
      })}
    </div>
  );
}
