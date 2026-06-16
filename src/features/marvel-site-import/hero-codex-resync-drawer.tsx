"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { RivalsClipAction } from "@/components/ui/rivals-clip-action";
import { MarvelHtmlImportPanel } from "./marvel-html-import-panel";

type HeroCodexResyncContextValue = {
  open: boolean;
  toggle: () => void;
  applySuccess: boolean;
};

const HeroCodexResyncContext =
  createContext<HeroCodexResyncContextValue | null>(null);

type HeroCodexResyncProviderProps = {
  heroSlug: string;
  heroName: string;
  children: ReactNode;
};

export function HeroCodexResyncProvider({
  heroSlug,
  heroName,
  children,
}: HeroCodexResyncProviderProps) {
  const [open, setOpen] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const router = useRouter();

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return next;
    });
    setApplySuccess(false);
  }, []);

  const handleApplySuccess = useCallback(() => {
    setApplySuccess(true);
    router.refresh();
    window.setTimeout(() => {
      setApplySuccess(false);
      setOpen(false);
    }, 1200);
  }, [router]);

  return (
    <HeroCodexResyncContext.Provider value={{ open, toggle, applySuccess }}>
      {children}
      <HeroCodexResyncPanel
        heroSlug={heroSlug}
        heroName={heroName}
        onApplySuccess={handleApplySuccess}
      />
    </HeroCodexResyncContext.Provider>
  );
}

export function HeroCodexResyncTrigger() {
  const ctx = useContext(HeroCodexResyncContext);
  if (!ctx) return null;

  const { open, toggle, applySuccess } = ctx;

  return (
    <RivalsClipAction
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="hero-codex-resync-panel"
      variant={open || applySuccess ? "gold-solid" : "surface"}
      className={`codex-resync-trigger transition-all duration-300 ${applySuccess ? "codex-resync-trigger-success" : ""}`}
    >
      <span aria-hidden className="text-sm leading-none">
        {applySuccess ? "✓" : "↻"}
      </span>
      {applySuccess ? "Synced" : open ? "Close sync" : "Sync from Marvel site"}
    </RivalsClipAction>
  );
}

type HeroCodexResyncPanelProps = {
  heroSlug: string;
  heroName: string;
  onApplySuccess: () => void;
};

function HeroCodexResyncPanel({
  heroSlug,
  heroName,
  onApplySuccess,
}: HeroCodexResyncPanelProps) {
  const ctx = useContext(HeroCodexResyncContext);
  const open = ctx?.open ?? false;
  const toggle = ctx?.toggle;

  useEffect(() => {
    if (!open || !toggle) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        toggle();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, toggle]);

  if (!ctx) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close codex sync panel"
        tabIndex={open ? 0 : -1}
        onClick={ctx.toggle}
        className={`fixed inset-0 z-[90] bg-rivals-ink/35 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id="hero-codex-resync-panel"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={`Sync ${heroName} from Marvel site`}
        className={`codex-resync-drawer-fixed fixed inset-x-0 top-0 z-[100] flex max-h-[min(82vh,860px)] flex-col px-4 pb-4 pt-[4.25rem] transition-[transform,opacity] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-6 lg:px-10 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div
          className={`codex-resync-panel mx-auto flex min-h-0 w-full max-w-[min(100%,1680px)] flex-1 flex-col overflow-hidden rounded border border-brand-gold/40 bg-[#111523]/97 shadow-[0_24px_64px_rgb(6_8_18/65%)] backdrop-blur-md ${
            open ? "codex-resync-panel-open" : ""
          }`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <MarvelHtmlImportPanel
              initialSlug={heroSlug}
              lockSlug
              variant="embedded"
              heroName={heroName}
              onApplySuccess={onApplySuccess}
            />
          </div>
        </div>
      </div>
    </>
  );
}
