"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  HeroGuideBlock,
  HeroGuideTabContent,
  HeroGuideTabId,
} from "@/features/heroes/hero-guide-schema";
import { heroGuideTabsSchema } from "@/features/heroes/hero-guide-schema";
import { sanitizeHeroGuideTabsCandidate } from "@/features/heroes/hero-guide-sanitize";
import { publishHeroGuideTabsAction } from "@/features/heroes/actions/hero-guide-editorial-actions";

const LOCAL_TABS_KEY_PREFIX = "rivalscodex.guide-tabs.v1";
const AUTOSAVE_MS = 1500;

export type GuideSaveStatus = "idle" | "saving" | "saved" | "error" | "local";

export type GuidePublishResult =
  | { ok: true; scope: "local" | "remote" }
  | { ok: false; error: string };

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
  const router = useRouter();
  const [tabs, setTabs] = useState<HeroGuideTabContent[]>(initialTabs);
  const [saveStatus, setSaveStatus] = useState<GuideSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [combosEditMode, setCombosEditMode] = useState(false);
  const [editingComboBlockIndex, setEditingComboBlockIndex] = useState<number | null>(
    null,
  );

  const tabsRef = useRef(initialTabs);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingResaveRef = useRef(false);
  const executeSaveRef = useRef<
    () => Promise<GuidePublishResult>
  >(async () => ({ ok: false, error: "Save not initialized." }));

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const markSaved = useCallback((status: Exclude<GuideSaveStatus, "idle" | "saving">) => {
    setHasUnsavedChanges(false);
    setSaveStatus(status);
    if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    if (status === "saved" || status === "local") {
      savedFadeRef.current = setTimeout(() => {
        setSaveStatus((s) => (s === status ? "idle" : s));
      }, 3200);
    }
  }, []);

  const executeSave = useCallback(async (): Promise<GuidePublishResult> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const current = tabsRef.current;
    const parsed = heroGuideTabsSchema.safeParse(
      sanitizeHeroGuideTabsCandidate(current),
    );
    if (!parsed.success) {
      const error = parsed.error.issues.map((i) => i.message).join("; ");
      setSaveStatus("error");
      setSaveError(error);
      return { ok: false, error };
    }

    writeLocalTabs(heroSlug, parsed.data);

    if (!supabaseEnabled) {
      setSaveError(null);
      markSaved("local");
      return { ok: true, scope: "local" };
    }

    if (saveInFlightRef.current) {
      pendingResaveRef.current = true;
      return { ok: true, scope: "remote" };
    }

    saveInFlightRef.current = true;
    setSaveStatus("saving");
    setSaveError(null);

    const result = await publishHeroGuideTabsAction({
      heroSlug,
      tabs: parsed.data,
    });

    saveInFlightRef.current = false;

    if (!result.ok) {
      setSaveStatus("error");
      setSaveError(result.error);
      return { ok: false, error: result.error };
    }

    markSaved("saved");
    router.refresh();

    if (pendingResaveRef.current) {
      pendingResaveRef.current = false;
      return executeSaveRef.current();
    }

    return { ok: true, scope: "remote" };
  }, [heroSlug, supabaseEnabled, markSaved, router]);

  useEffect(() => {
    executeSaveRef.current = executeSave;
  }, [executeSave]);

  const scheduleSave = useCallback(() => {
    setHasUnsavedChanges(true);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void executeSave();
    }, AUTOSAVE_MS);
  }, [executeSave]);

  const publishNow = useCallback(async (): Promise<GuidePublishResult> => {
    return executeSave();
  }, [executeSave]);

  const updateTabs = useCallback(
    (updater: (current: HeroGuideTabContent[]) => HeroGuideTabContent[]) => {
      setTabs((current) => {
        const next = updater(current);
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

  const exitCombosEditMode = useCallback(async (): Promise<GuidePublishResult> => {
    const result = await publishNow();
    setEditingComboBlockIndex(null);
    setCombosEditMode(false);
    return result;
  }, [publishNow]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    };
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) {
      queueMicrotask(() => {
        const local = readLocalTabs(heroSlug);
        if (local) {
          setTabs(local);
        }
      });
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
    hasUnsavedChanges,
    isPublishing: saveStatus === "saving",
    publishNow,
    exitCombosEditMode,
    combosEditMode,
    setCombosEditMode,
    editingComboBlockIndex,
    setEditingComboBlockIndex,
    scheduleSave,
  };
}
