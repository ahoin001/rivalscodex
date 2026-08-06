import { PropsWithChildren } from "react";

type HudSectionProps = PropsWithChildren<{
  title: string;
  className?: string;
  tone?: "primary" | "secondary";
  titleSize?: "sm" | "md" | "lg";
}>;

const toneClassMap = {
  primary: "border-brand-gold/30 bg-surface-hud/90",
  secondary: "border-brand-gold/20 bg-surface-hud/85",
} as const;

const titleClassMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

export function HudSection({
  title,
  className = "",
  tone = "primary",
  titleSize = "md",
  children,
}: HudSectionProps) {
  return (
    <section
      className={`clipped-edge border p-4 ${toneClassMap[tone]} ${className}`.trim()}
    >
      <h3
        className={`slanted-title font-display italic uppercase ${titleClassMap[titleSize]}`}
      >
        <span>{title}</span>
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
