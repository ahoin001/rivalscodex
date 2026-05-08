"use client";

import { useCallback, useMemo, useState } from "react";
import type { Hero } from "@/data/schema";
import type { HeroEditableSnapshot } from "@/features/heroes/hero-admin-types";

export type { HeroEditableSnapshot } from "@/features/heroes/hero-admin-types";

function cloneEditable(hero: Hero): HeroEditableSnapshot {
  return {
    playstyle: {
      ...hero.playstyle,
      targetPriority: [...hero.playstyle.targetPriority],
      avoidPriority: [...hero.playstyle.avoidPriority],
    },
    combos: hero.combos.map((combo) => ({
      ...combo,
      steps: [...combo.steps],
    })),
    synergies: hero.synergies.map((entry) => ({ ...entry })),
    externalResources: hero.externalResources.map((entry) => ({ ...entry })),
  };
}

export function useHeroAdminDraft(hero: Hero) {
  const [draft, setDraft] = useState<HeroEditableSnapshot | null>(null);

  const beginEdit = useCallback(() => {
    setDraft(cloneEditable(hero));
  }, [hero]);

  const cancelEdit = useCallback(() => {
    setDraft(null);
  }, []);

  const resetToHero = useCallback(() => {
    setDraft(cloneEditable(hero));
  }, [hero]);

  const displayHero: Hero = useMemo(() => {
    if (!draft) {
      return hero;
    }
    return {
      ...hero,
      playstyle: draft.playstyle,
      combos: draft.combos,
      synergies: draft.synergies,
      externalResources: draft.externalResources,
    };
  }, [draft, hero]);

  const copyPatchJson = useCallback(async () => {
    if (!draft) {
      return false;
    }
    const patch = {
      slug: hero.slug,
      id: hero.id,
      playstyle: draft.playstyle,
      combos: draft.combos,
      synergies: draft.synergies,
      externalResources: draft.externalResources,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(patch, null, 2));
      return true;
    } catch {
      return false;
    }
  }, [draft, hero.id, hero.slug]);

  const updateDraft = useCallback(
    (updater: (current: HeroEditableSnapshot) => HeroEditableSnapshot) => {
      setDraft((current) => (current ? updater(current) : null));
    },
    [],
  );

  return {
    draft,
    setDraft,
    displayHero,
    isEditing: draft !== null,
    beginEdit,
    cancelEdit,
    resetToHero,
    copyPatchJson,
    updateDraft,
  };
}
