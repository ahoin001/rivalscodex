import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";
import type { HeroPortraitEntry } from "@/features/heroes/components/hero-guide-body";
import { ComboBlockEditor } from "@/features/heroes/components/combo-editor";
import { AbilityTipFields, StrengthsWeaknessesFields, VideoFields } from "./block-kit-fields";
import { LoadoutFields, MatchupFields } from "./block-matchup-loadout-fields";
import { BulletsFields, CalloutFields, TwoColumnFields } from "./block-text-fields";

export function BlockFields({
  block,
  onReplace,
  abilityLookup,
  heroRoster,
}: {
  block: HeroGuideBlock;
  onReplace: (next: HeroGuideBlock) => void;
  abilityLookup?: Map<string, ResolvedAbilityRef>;
  heroRoster?: HeroPortraitEntry[];
}) {
  switch (block.type) {
    case "callout":
      return <CalloutFields block={block} onReplace={onReplace} />;
    case "bullets":
      return <BulletsFields block={block} onReplace={onReplace} />;
    case "twoColumn":
      return <TwoColumnFields block={block} onReplace={onReplace} />;
    case "combo":
      return (
        <ComboBlockEditor
          block={block}
          abilityLookup={abilityLookup}
          onReplace={(next) => onReplace(next)}
        />
      );
    case "matchup":
      return <MatchupFields block={block} onReplace={onReplace} heroRoster={heroRoster} />;
    case "abilityTip":
      return <AbilityTipFields block={block} onReplace={onReplace} />;
    case "video":
      return <VideoFields block={block} onReplace={onReplace} />;
    case "strengthsWeaknesses":
      return <StrengthsWeaknessesFields block={block} onReplace={onReplace} />;
    case "loadout":
      return <LoadoutFields block={block} onReplace={onReplace} />;
    default:
      return null;
  }
}
