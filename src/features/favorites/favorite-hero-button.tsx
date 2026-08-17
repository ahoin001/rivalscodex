"use client";

import { RivalsCta } from "@/components/ui";
import { useFavorites } from "@/features/favorites/use-favorites";

type FavoriteHeroButtonProps = {
  heroId: string;
};

export function FavoriteHeroButton({ heroId }: FavoriteHeroButtonProps) {
  const { favoritesSet, hydrated, toggleFavorite } = useFavorites();
  const isFavorite = favoritesSet.has(heroId);

  return (
    <RivalsCta
      context="chrome"
      variant="brand"
      active={isFavorite}
      disabled={!hydrated}
      onClick={() => toggleFavorite(heroId)}
      className="w-full"
    >
      {isFavorite ? "Favorited Hero" : "Add Favorite"}
    </RivalsCta>
  );
}
