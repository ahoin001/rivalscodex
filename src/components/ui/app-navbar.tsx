import Link from "next/link";

const navLinks = [
  { href: "/", label: "Heroes" },
  { href: "/lab/hero-card", label: "Hero Card Lab" },
];

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-gold/25 bg-[#0a0d16]/92 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="font-display text-2xl uppercase tracking-wide text-white">
          RivalsCodex
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded border border-brand-gold/45 bg-brand-gold-muted px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold hover:text-[#10131f]"
            >
              {link.label}
            </Link>
          ))}
          {process.env.NODE_ENV === "development" ? (
            <>
              <Link
                href="/dev/endpoints"
                className="rounded border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/85 transition hover:border-white/55 hover:text-white"
              >
                Endpoint Testing
              </Link>
              <Link
                href="/dev/hero-assets"
                className="rounded border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/85 transition hover:border-white/55 hover:text-white"
              >
                Hero Assets
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
