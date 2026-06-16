"use client";

import { useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "rivalscodex.favorites.v1";

function loadInitialFavorites(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setFavorites(loadInitialFavorites());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const toggleFavorite = (heroId: string) => {
    setFavorites((current) =>
      current.includes(heroId)
        ? current.filter((entry) => entry !== heroId)
        : [...current, heroId],
    );
  };

  return {
    favorites,
    favoritesSet,
    hydrated,
    toggleFavorite,
  };
}
