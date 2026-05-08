"use client";

type FormContextBadgeProps = {
  label: string;
  tone?: "active" | "global" | "secondary";
};

const toneClassMap: Record<NonNullable<FormContextBadgeProps["tone"]>, string> = {
  active: "border-brand-gold/50 bg-brand-gold-muted text-brand-gold",
  global: "border-white/20 text-muted-foreground",
  secondary: "border-brand-gold/25 bg-[#131728] text-white/80",
};

export function FormContextBadge({
  label,
  tone = "global",
}: FormContextBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
}
