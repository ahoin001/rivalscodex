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

export function ComboFilterPills({
  active,
  onChange,
  availableDifficulties,
}: {
  active: string;
  onChange: (value: string) => void;
  availableDifficulties: Set<string>;
}) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-2 sm:hidden"
      style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
    >
      <FilterPill
        active={active === "all"}
        onClick={() => onChange("all")}
        activeClass="border-brand-gold bg-brand-gold/15 text-brand-gold"
      >
        All
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
