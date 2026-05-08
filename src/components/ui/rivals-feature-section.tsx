import { PropsWithChildren, ReactNode } from "react";
import { ClippedPanel } from "@/components/ui/clipped-panel";

type RivalsFeatureSectionProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  media?: ReactNode;
  actions?: ReactNode;
  reverse?: boolean;
  className?: string;
  contentClassName?: string;
  mediaClassName?: string;
}>;

export function RivalsFeatureSection({
  eyebrow,
  title,
  description,
  media,
  actions,
  reverse = false,
  className = "",
  contentClassName = "",
  mediaClassName = "",
  children,
}: RivalsFeatureSectionProps) {
  const gridClass = media
    ? "grid gap-4 lg:grid-cols-[1.35fr_0.8fr] lg:items-start"
    : "space-y-4";

  return (
    <section className={className}>
      <div className={gridClass}>
        <ClippedPanel
          tone="gold"
          className={`border border-brand-gold/35 p-4 md:p-5 ${
            reverse && media ? "lg:order-2" : ""
          } ${contentClassName}`.trim()}
        >
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold md:text-xs">
              {eyebrow}
            </p>
          )}
          <h2 className="slanted-title mt-2 font-display text-4xl italic uppercase leading-[0.94] md:text-5xl">
            <span>{title}</span>
          </h2>
          <div className="brand-divider mt-3" />
          {description && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          )}
          <div className="mt-4">{children}</div>
          {actions && <div className="mt-4">{actions}</div>}
        </ClippedPanel>

        {media && (
          <ClippedPanel
            tone="gold"
            className={`border border-brand-gold/35 p-4 ${
              reverse ? "lg:order-1" : ""
            } ${mediaClassName}`.trim()}
          >
            {media}
          </ClippedPanel>
        )}
      </div>
    </section>
  );
}
