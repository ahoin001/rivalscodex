import { ClippedPanel, RivalsCta, RivalsInput } from "@/components/ui";
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
      tone="sheet"
      className="hero-stage-shell flex flex-col gap-4 p-4 transition-[box-shadow,transform] duration-[var(--motion-medium)] ease-[var(--ease-out-soft)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.22)] md:flex-row md:items-center md:justify-between"
    >
      <div className="flex flex-wrap gap-2">
        {heroRoleFilterOptions.map((option) => (
          <RivalsCta
            key={option}
            context="chrome"
            variant="brand"
            active={activeRole === option}
            onClick={() => onRoleChange(option)}
            className="min-w-24"
          >
            {option}
          </RivalsCta>
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
        <RivalsCta
          context="chrome"
          variant="brand"
          active={showFavoritesOnly}
          onClick={() => onFavoritesOnlyChange(!showFavoritesOnly)}
        >
          Favorites Only
        </RivalsCta>
      </div>
    </ClippedPanel>
  );
}
