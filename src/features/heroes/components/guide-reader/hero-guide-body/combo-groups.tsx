"use client";

import { DIFFICULTY_TIERS } from "@/features/heroes/combo-display";

export function DifficultyGroupHeader({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-t border-b-2 px-4 py-2 ${className}`}>
      <span className="font-display text-xs font-extrabold uppercase italic tracking-[0.16em]">
        {label}
      </span>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  activeClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
        active
          ? activeClass
          : "border-rivals-light-300 text-rivals-ink-muted hover:border-rivals-ink/20"
      }`}
      style={{ scrollSnapAlign: "start" }}
    >
      {children}
    </button>
  );
}

function FilterRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-2"
      style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}

export function ComboFilterPills({
  active,
  onChange,
  availableDifficulties,
}: {
  active: string;
  onChange: (value: string) => void;
  availableDifficulties: Set<string>;
}) {
  if (availableDifficulties.size === 0) return null;

  return (
    <FilterRow>
      <FilterPill
        active={active === "all"}
        onClick={() => onChange("all")}
        activeClass="border-brand-gold bg-brand-gold/15 text-brand-gold"
      >
        All tiers
      </FilterPill>
      {DIFFICULTY_TIERS.filter((t) => availableDifficulties.has(t.key)).map((tier) => (
        <FilterPill
          key={tier.key}
          active={active === tier.key}
          onClick={() => onChange(tier.key)}
          activeClass={tier.lightClass}
        >
          {tier.label}
        </FilterPill>
      ))}
    </FilterRow>
  );
}

export function TagFilterPills({
  active,
  onChange,
  availableTags,
}: {
  active: string;
  onChange: (value: string) => void;
  availableTags: Set<string>;
}) {
  if (availableTags.size < 2) return null;

  const sorted = Array.from(availableTags).sort((a, b) => a.localeCompare(b));

  return (
    <FilterRow>
      <FilterPill
        active={active === "all"}
        onClick={() => onChange("all")}
        activeClass="border-brand-gold bg-brand-gold/15 text-brand-gold"
      >
        All tags
      </FilterPill>
      {sorted.map((tag) => (
        <FilterPill
          key={tag}
          active={active === tag}
          onClick={() => onChange(tag)}
          activeClass="border-rivals-ink/25 bg-rivals-light-200 text-rivals-ink"
        >
          {tag}
        </FilterPill>
      ))}
    </FilterRow>
  );
}
