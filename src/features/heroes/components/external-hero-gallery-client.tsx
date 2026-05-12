"use client";

import Image from "next/image";
import Link from "next/link";
import { MouseEventHandler, useMemo, useState } from "react";
import { ClippedButton, ClippedPanel, RivalsInput, RivalsPill } from "@/components/ui";
import { ExternalHero } from "@/lib/api/marvel-rivals";

type ExternalHeroGalleryClientProps = {
  heroes: ExternalHero[];
  availableLocalSlugs: string[];
};

type AttackTypeFilter = "All" | string;
type RoleFilter = "All" | string;

function normalizeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ExternalHeroGalleryClient({
  heroes,
  availableLocalSlugs,
}: ExternalHeroGalleryClientProps) {
  const [activeRole, setActiveRole] = useState<RoleFilter>("All");
  const [activeAttackType, setActiveAttackType] = useState<AttackTypeFilter>("All");
  const [query, setQuery] = useState("");

  const roleOptions = useMemo(() => {
    const roles = Array.from(
      new Set(
        heroes
          .map((hero) => hero.role?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return ["All", ...roles];
  }, [heroes]);

  const attackTypeOptions = useMemo(() => {
    const attackTypes = Array.from(
      new Set(
        heroes
          .map((hero) => hero.attackType?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return ["All", ...attackTypes];
  }, [heroes]);

  const filteredHeroes = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return heroes
      .filter((hero) => {
        const matchesRole = activeRole === "All" || hero.role === activeRole;
        const matchesAttackType =
          activeAttackType === "All" || hero.attackType === activeAttackType;
        const matchesQuery =
          loweredQuery.length === 0 ||
          hero.name.toLowerCase().includes(loweredQuery) ||
          (hero.summary ?? "").toLowerCase().includes(loweredQuery);

        return matchesRole && matchesAttackType && matchesQuery;
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [activeAttackType, activeRole, heroes, query]);

  const localSlugSet = useMemo(() => new Set(availableLocalSlugs), [availableLocalSlugs]);
  const hasActiveFilters = activeRole !== "All" || activeAttackType !== "All" || query.length > 0;

  const resetFilters = () => {
    setActiveRole("All");
    setActiveAttackType("All");
    setQuery("");
  };

  return (
    <section className="space-y-6">
      <ClippedPanel
        tone="sheet"
        className="space-y-4 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.16em] text-brand-gold">
            Filter Heroes
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span>{`${filteredHeroes.length} shown`}</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="border border-brand-gold/35 px-2 py-1 text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Role
            </p>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((option) => (
                <ClippedButton
                  key={option}
                  active={activeRole === option}
                  onClick={() => setActiveRole(option)}
                  tone="brand"
                  className="min-w-24"
                >
                  {option}
                </ClippedButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Attack Type
            </p>
            <div className="flex flex-wrap gap-2">
              {attackTypeOptions.map((option) => (
                <ClippedButton
                  key={option}
                  active={activeAttackType === option}
                  onClick={() => setActiveAttackType(option)}
                  tone="brand"
                  className="min-w-24"
                >
                  {option}
                </ClippedButton>
              ))}
            </div>
          </div>
        </div>

        <label className="block text-xs uppercase tracking-wide text-muted-foreground">
          Search
          <RivalsInput
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Hero name or profile"
            className="mt-1 w-full md:max-w-sm"
          />
        </label>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {activeRole !== "All" && (
              <button
                type="button"
                onClick={() => setActiveRole("All")}
                className="rounded border border-brand-gold/35 px-2 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10"
              >
                {`Role: ${activeRole} ×`}
              </button>
            )}
            {activeAttackType !== "All" && (
              <button
                type="button"
                onClick={() => setActiveAttackType("All")}
                className="rounded border border-brand-gold/35 px-2 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10"
              >
                {`Attack: ${activeAttackType} ×`}
              </button>
            )}
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded border border-brand-gold/35 px-2 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold/10"
              >
                {`Search: ${query} ×`}
              </button>
            )}
          </div>
        )}
      </ClippedPanel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filteredHeroes.map((hero, index) => {
          const slug = hero.slug ?? normalizeSlug(hero.name);
          return (
            <div
              key={hero.id ?? hero.name}
              className={index % 2 === 1 ? "xl:translate-y-4 2xl:translate-y-5" : ""}
            >
              <ExternalHeroCard
                hero={hero}
                slug={slug}
                hasLocalDossier={localSlugSet.has(slug)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExternalHeroCard({
  hero,
  slug,
  hasLocalDossier,
}: {
  hero: ExternalHero;
  slug: string;
  hasLocalDossier: boolean;
}) {
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0 });

  const onMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 8;
    const rotateX = (0.5 - y) * 6;
    setTiltStyle({ rotateX, rotateY });
  };

  const onMouseLeave = () => {
    setTiltStyle({ rotateX: 0, rotateY: 0 });
  };

  return (
    <ClippedPanel
      tone="sheet"
      className="brand-glow h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex h-full flex-col space-y-2 p-3">
        <div className="flex min-h-8 items-start justify-between gap-2">
          <RivalsPill tone="brand">{hero.role ?? "Unknown Role"}</RivalsPill>
          <RivalsPill>{hero.attackType ?? "Unspecified"}</RivalsPill>
        </div>

        <div
          className="group relative aspect-[0.78] w-full overflow-hidden rounded border border-brand-gold/30 bg-[radial-gradient(circle_at_center,#1b2233_0%,#101522_74%)]"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{ perspective: "900px" }}
        >
          {hero.portraitImageUrl ? (
            <div
              className="absolute inset-0 transition-transform duration-150 will-change-transform"
              style={{
                transform: `rotateX(${tiltStyle.rotateX}deg) rotateY(${tiltStyle.rotateY}deg) translateY(-6px) scale(1.08)`,
                transformStyle: "preserve-3d",
              }}
            >
              <Image
                src={hero.portraitImageUrl}
                alt={`${hero.name} portrait`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
                className="object-contain object-bottom drop-shadow-[0_16px_26px_rgba(4,6,16,0.7)] transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-muted-foreground">
              Portrait unavailable
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
          <div className="pointer-events-none absolute inset-0 border border-white/5" />
        </div>

        <h3 className="slanted-title min-h-[4.4rem] font-display text-[2rem] italic uppercase leading-[0.9]">
          <span className="line-clamp-2">{hero.name}</span>
        </h3>

        <div className="mt-auto">
          <Link
            href={`/heroes/${slug}`}
            className="clipped-edge inline-flex w-full items-center justify-center border border-brand-gold/55 bg-brand-gold-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold hover:text-rivals-ink"
          >
            {hasLocalDossier ? "Open Dossier" : "Open Hero"}
          </Link>
        </div>
      </div>
    </ClippedPanel>
  );
}
