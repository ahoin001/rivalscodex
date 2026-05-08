import {
  ClippedPanel,
  HudSection,
  StatRow,
} from "@/components/ui";
import { Hero } from "@/data/schema";
import { FavoriteHeroButton } from "@/features/favorites/favorite-hero-button";

type HeroStatsRailProps = {
  hero: Hero;
};

export function HeroStatsRail({ hero }: HeroStatsRailProps) {
  return (
    <ClippedPanel
      tone="gold"
      className="brand-glow h-fit border border-brand-gold/35 p-4"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">
        Tactical Readout
      </p>
      <h2 className="mt-2 font-display text-4xl italic uppercase leading-none">
        Base Stats
      </h2>
      <div className="mt-3 space-y-2 border-t border-brand-gold/45 pt-3 text-sm">
        <StatRow label="Health" value={`${hero.health}`} />
        <StatRow label="Role" value={hero.role} />
        <StatRow label="Difficulty" value={`${hero.difficulty}/5`} />
        <StatRow label="Updated" value={hero.updatedAt} showDivider={false} />
      </div>

      {hero.resource && (
        <HudSection
          title={`Resource: ${hero.resource.name}`}
          tone="primary"
          titleSize="sm"
          className="mt-4 bg-brand-gold-muted"
        >
          <p className="text-sm text-muted-foreground">{hero.resource.description}</p>
        </HudSection>
      )}

      <div className="mt-4">
        <FavoriteHeroButton heroId={hero.id} />
      </div>
    </ClippedPanel>
  );
}
