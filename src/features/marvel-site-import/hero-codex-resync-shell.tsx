import type { ReactNode } from "react";
import {
  HeroCodexResyncProvider,
} from "./hero-codex-resync-drawer";

type HeroCodexResyncShellProps = {
  heroSlug: string;
  heroName: string;
  children: ReactNode;
};

/** Dev-only wrapper that provides codex resync drawer state on hero detail pages. */
export function HeroCodexResyncShell({
  heroSlug,
  heroName,
  children,
}: HeroCodexResyncShellProps) {
  if (process.env.NODE_ENV !== "development") {
    return children;
  }

  return (
    <HeroCodexResyncProvider heroSlug={heroSlug} heroName={heroName}>
      {children}
    </HeroCodexResyncProvider>
  );
}
