import { ClippedButton, ClippedPanel, RivalsInput } from "@/components/ui";
import {
  HeroRoleFilter,
  heroRoleFilterOptions,
} from "@/components/ui/presets";

type HeroGalleryControlsProps = {
  activeRole: HeroRoleFilter;
  onRoleChange: (role: HeroRoleFilter) => void;
  showFavoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  query: string;
  onQueryChange: (value: string) => void;
};

export function HeroGalleryControls({
  activeRole,
  onRoleChange,
  showFavoritesOnly,
  onFavoritesOnlyChange,
  query,
  onQueryChange,
}: HeroGalleryControlsProps) {
  return (
    <ClippedPanel
      tone="gold"
      className="border border-brand-gold/35 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex flex-wrap gap-2">
        {heroRoleFilterOptions.map((option) => (
          <ClippedButton
            key={option}
            active={activeRole === option}
            onClick={() => onRoleChange(option)}
            className="min-w-24"
            tone="brand"
          >
            {option}
          </ClippedButton>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">
          Search
          <RivalsInput
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Hero or keyword"
            className="mt-1 sm:w-52"
          />
        </label>
        <ClippedButton
          active={showFavoritesOnly}
          onClick={() => onFavoritesOnlyChange(!showFavoritesOnly)}
          tone="brand"
        >
          Favorites Only
        </ClippedButton>
      </div>
    </ClippedPanel>
  );
}
