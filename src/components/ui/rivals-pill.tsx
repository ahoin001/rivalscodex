import { PropsWithChildren } from "react";

type RivalsPillProps = PropsWithChildren<{
  className?: string;
  tone?: "default" | "brand";
}>;

export function RivalsPill({
  children,
  className = "",
  tone = "default",
}: RivalsPillProps) {
  const toneClass =
    tone === "brand"
      ? "border-brand-gold/40 bg-brand-gold-muted text-brand-gold"
      : "border-white/20 text-muted-foreground";

  return (
    <span
      className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${toneClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
