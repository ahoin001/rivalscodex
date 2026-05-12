import Link from "next/link";
import { AppNavbarNav } from "@/components/ui/app-navbar-nav";
import { PaletteSwitcher } from "@/features/theme/palette-switcher";

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-gold/25 bg-background/92 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link
          href="/"
          className="font-display text-2xl uppercase tracking-wide text-foreground"
        >
          RivalsCodex
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <PaletteSwitcher />
          <AppNavbarNav />
        </div>
      </nav>
    </header>
  );
}
