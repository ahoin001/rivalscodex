"use client";

import { useMemo, useState } from "react";
import { Hero } from "@/data/schema";
import { HeroRoleFilter } from "@/components/ui/presets";
import { HeroCard } from "@/features/heroes/components/hero-card";
import { HeroGalleryControls } from "@/features/heroes/components/hero-gallery-controls";
import { useFavorites } from "@/features/favorites/use-favorites";

type HeroGalleryClientProps = {
  heroes: Hero[];
};

export function HeroGalleryClient({ heroes }: HeroGalleryClientProps) {
  const [activeRole, setActiveRole] = useState<HeroRoleFilter>("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [query, setQuery] = useState("");
  const { favoritesSet, hydrated, toggleFavorite } = useFavorites();

  const filteredHeroes = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    const base = heroes.filter((hero) => {
      const matchesRole = activeRole === "All" || hero.role === activeRole;
      const matchesFavorites = !showFavoritesOnly || favoritesSet.has(hero.id);
      const matchesQuery =
        loweredQuery.length === 0 ||
        hero.name.toLowerCase().includes(loweredQuery) ||
        hero.summary.toLowerCase().includes(loweredQuery);

      return matchesRole && matchesFavorites && matchesQuery;
    });

    return base.sort((a, b) => {
      const aFavorited = favoritesSet.has(a.id) ? 1 : 0;
      const bFavorited = favoritesSet.has(b.id) ? 1 : 0;
      return bFavorited - aFavorited;
    });
  }, [activeRole, favoritesSet, heroes, query, showFavoritesOnly]);

  return (
    <section className="space-y-6">
      <HeroGalleryControls
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        showFavoritesOnly={showFavoritesOnly}
        onFavoritesOnlyChange={setShowFavoritesOnly}
        query={query}
        onQueryChange={setQuery}
      />
      {!hydrated && (
        <p className="text-sm text-muted-foreground">Loading favorite heroes...</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredHeroes.map((hero, index) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            prioritizeImage={index < 4}
            isFavorite={favoritesSet.has(hero.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
