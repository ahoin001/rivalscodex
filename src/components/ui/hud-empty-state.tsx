import type { ReactNode } from "react";
import { ClippedPanel } from "@/components/ui/clipped-panel";

type HudEmptyStateProps = {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
  tone?: "sheet" | "default";
};

export function HudEmptyState({
  eyebrow = "No intel",
  title,
  children,
  className = "",
  tone = "sheet",
}: HudEmptyStateProps) {
  return (
    <ClippedPanel tone={tone} className={`p-5 ${className}`.trim()}>
      <p className="font-display text-[10px] font-bold uppercase italic tracking-[0.28em] text-brand-gold">
        {eyebrow}
      </p>
      <h4 className="mt-2 font-display text-sm font-extrabold uppercase italic tracking-wide text-rivals-ink">
        {title}
      </h4>
      <div className="mt-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">{children}</div>
    </ClippedPanel>
  );
}
