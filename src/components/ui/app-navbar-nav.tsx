"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryLinks = [
  { href: "/", label: "Heroes", match: (path: string) => path === "/" || path.startsWith("/heroes") },
];

export function AppNavbarNav() {
  const pathname = usePathname();

  return (
    <>
      {primaryLinks.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded border border-brand-gold bg-brand-gold/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-gold shadow-[inset_0_0_0_1px_rgb(var(--brand-gold-rgb)/50%)]"
                : "rounded border border-brand-gold/45 bg-brand-gold-muted px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold hover:text-background"
            }
          >
            {link.label}
          </Link>
        );
      })}
      {process.env.NODE_ENV === "development" ? (
        <>
          <DevNavLink href="/lab/hero-card" label="Hero Card Lab" pathname={pathname} />
          <DevNavLink href="/dev/endpoints" label="Endpoint Testing" pathname={pathname} />
          <DevNavLink href="/dev/marvel-html-import" label="Site Import" pathname={pathname} />
        </>
      ) : null}
    </>
  );
}

function DevNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded border border-brand-gold/55 bg-brand-gold/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-foreground shadow-[inset_0_0_0_1px_rgb(var(--brand-gold-rgb)/35%)]"
          : "rounded border border-panel-border px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:border-brand-gold/45 hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
