"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  HeroGuideBlock,
  HeroGuideTabContent,
  HeroGuideTabId,
} from "@/features/heroes/hero-guide-schema";
import { heroGuideTabsSchema } from "@/features/heroes/hero-guide-schema";
import { publishHeroGuideTabsAction } from "@/features/heroes/actions/hero-guide-editorial-actions";

const LOCAL_TABS_KEY_PREFIX = "rivalscodex.guide-tabs.v1";
const AUTOSAVE_MS = 1500;

export type GuideSaveStatus = "idle" | "saving" | "saved" | "error" | "local";

function localTabsKey(heroSlug: string): string {
  return `${LOCAL_TABS_KEY_PREFIX}.${heroSlug.toLowerCase()}`;
}

function readLocalTabs(heroSlug: string): HeroGuideTabContent[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localTabsKey(heroSlug));
    if (!raw) return null;
    const parsed = heroGuideTabsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeLocalTabs(heroSlug: string, tabs: HeroGuideTabContent[]): void {
  try {
    window.localStorage.setItem(localTabsKey(heroSlug), JSON.stringify(tabs));
  } catch {
    // ignore quota errors
  }
}

export function useHeroGuideEdit(input: {
  heroSlug: string;
  initialTabs: HeroGuideTabContent[];
  supabaseEnabled: boolean;
}) {
  const { heroSlug, initialTabs, supabaseEnabled } = input;
  const [tabs, setTabs] = useState<HeroGuideTabContent[]>(initialTabs);
  const [saveStatus, setSaveStatus] = useState<GuideSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [combosEditMode, setCombosEditMode] = useState(false);
  const [editingComboBlockIndex, setEditingComboBlockIndex] = useState<number | null>(
    null,
  );

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(async () => {
      const current = tabsRef.current;
      const parsed = heroGuideTabsSchema.safeParse(current);
      if (!parsed.success) {
        setSaveStatus("error");
        setSaveError(parsed.error.issues.map((i) => i.message).join("; "));
        return;
      }

      writeLocalTabs(heroSlug, parsed.data);

      if (!supabaseEnabled) {
        setSaveStatus("local");
        setSaveError(null);
        return;
      }

      setSaveStatus("saving");
      setSaveError(null);

      const result = await publishHeroGuideTabsAction({
        heroSlug,
        tabs: parsed.data,
      });

      if (!result.ok) {
        setSaveStatus("error");
        setSaveError(result.error);
        return;
      }

      setSaveStatus("saved");
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
      savedFadeRef.current = setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 2400);
    }, AUTOSAVE_MS);
  }, [heroSlug, supabaseEnabled]);

  const updateTabs = useCallback(
    (updater: (current: HeroGuideTabContent[]) => HeroGuideTabContent[]) => {
      setTabs((current) => {
        const next = updater(current);
        tabsRef.current = next;
        return next;
      });
      scheduleSave();
    },
    [scheduleSave],
  );

  const updateTab = useCallback(
    (tabId: HeroGuideTabId, patch: Partial<HeroGuideTabContent>) => {
      updateTabs((current) =>
        current.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab)),
      );
    },
    [updateTabs],
  );

  const updateTabBody = useCallback(
    (tabId: HeroGuideTabId, blocks: HeroGuideBlock[] | undefined) => {
      updateTab(tabId, {
        body: blocks && blocks.length > 0 ? blocks : undefined,
      });
    },
    [updateTab],
  );

  const updateCombosBody = useCallback(
    (blocks: HeroGuideBlock[] | undefined) => {
      updateTabBody("combos", blocks);
    },
    [updateTabBody],
  );

  const getCombosTab = useCallback((): HeroGuideTabContent | undefined => {
    return tabs.find((t) => t.id === "combos");
  }, [tabs]);

  const getCombosBlocks = useCallback((): HeroGuideBlock[] => {
    return getCombosTab()?.body ?? [];
  }, [getCombosTab]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    };
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) {
      const local = readLocalTabs(heroSlug);
      if (local) {
        setTabs(local);
      }
    }
  }, [heroSlug, supabaseEnabled]);

  return {
    heroSlug,
    tabs,
    setTabs: updateTabs,
    updateTab,
    updateTabBody,
    updateCombosBody,
    getCombosTab,
    getCombosBlocks,
    saveStatus,
    saveError,
    combosEditMode,
    setCombosEditMode,
    editingComboBlockIndex,
    setEditingComboBlockIndex,
    scheduleSave,
  };
}
