"use client";

import { useFavorites } from "@/features/favorites/use-favorites";

type FavoriteHeroButtonProps = {
  heroId: string;
};

export function FavoriteHeroButton({ heroId }: FavoriteHeroButtonProps) {
  const { favoritesSet, hydrated, toggleFavorite } = useFavorites();
  const isFavorite = favoritesSet.has(heroId);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(heroId)}
      disabled={!hydrated}
      className={`clipped-edge w-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-60 ${
        isFavorite
          ? "border-brand-gold bg-brand-gold text-[#11131e]"
          : "border-brand-gold/50 bg-brand-gold-muted text-brand-gold enabled:hover:border-brand-gold enabled:hover:bg-brand-gold enabled:hover:text-[#11131e]"
      }`}
    >
      {isFavorite ? "Favorited Hero" : "Add Favorite"}
    </button>
  );
}
