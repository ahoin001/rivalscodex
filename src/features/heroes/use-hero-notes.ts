"use client";

import { useEffect, useState } from "react";

const HERO_NOTES_KEY_PREFIX = "rivalscodex.hero-notes.v1";

type UseHeroNotesResult = {
  notes: string;
  setNotes: (value: string) => void;
  clearNotes: () => void;
  hydrated: boolean;
};

function getStorageKey(heroId: string): string {
  return `${HERO_NOTES_KEY_PREFIX}.${heroId}`;
}

export function useHeroNotes(heroId: string): UseHeroNotesResult {
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(getStorageKey(heroId));
      if (stored !== null) {
        queueMicrotask(() => {
          setNotes(stored);
        });
      }
    } catch {
      // Ignore storage read errors and fall back to empty notes.
    } finally {
      queueMicrotask(() => {
        setHydrated(true);
      });
    }
  }, [heroId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(getStorageKey(heroId), notes);
    } catch {
      // Ignore storage write errors.
    }
  }, [heroId, hydrated, notes]);

  const clearNotes = () => {
    setNotes("");
  };

  return {
    notes,
    setNotes,
    clearNotes,
    hydrated,
  };
}
