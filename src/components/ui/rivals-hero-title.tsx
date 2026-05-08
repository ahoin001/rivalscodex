type RivalsHeroTitleProps = {
  name: string;
  subtitle?: string;
  description?: string;
  className?: string;
  size?: "md" | "lg" | "xl";
  /**
   * When true (default), the name renders as a single line that can naturally
   * wrap on narrow viewports. When false, each whitespace-separated word is
   * forced onto its own row using stacked headings (used when the design calls
   * for explicit per-word stacking like the reference layout).
   */
  inlineName?: boolean;
};

const sizeClass: Record<NonNullable<RivalsHeroTitleProps["size"]>, string> = {
  md: "text-[2.2rem] sm:text-[3.2rem] lg:text-[4rem]",
  lg: "text-[2.6rem] sm:text-[4rem] lg:text-[5.2rem]",
  xl: "text-[3rem] sm:text-[4.6rem] lg:text-[6.2rem] xl:text-[7rem]",
};

export function RivalsHeroTitle({
  name,
  subtitle,
  description,
  className = "",
  size = "lg",
  inlineName = true,
}: RivalsHeroTitleProps) {
  return (
    <div className={`text-rivals-ink ${className}`.trim()}>
      {inlineName ? (
        <h1
          className={`slanted-title font-display font-extrabold uppercase italic leading-[0.86] tracking-tight ${sizeClass[size]}`}
        >
          <span>{name}</span>
        </h1>
      ) : (
        <div className="space-y-1">
          {name
            .trim()
            .split(/\s+/)
            .map((word, index) => (
              <h1
                key={`${word}-${index}`}
                className={`slanted-title font-display font-extrabold uppercase italic leading-[0.86] tracking-tight ${sizeClass[size]}`}
              >
                <span>{word}</span>
              </h1>
            ))}
        </div>
      )}

      {subtitle ? (
        <p className="mt-4 inline-flex items-center bg-rivals-ink px-3 py-1 font-display text-[11px] italic uppercase tracking-[0.22em] text-white sm:text-xs">
          {subtitle}
        </p>
      ) : null}

      {description ? (
        <p className="mt-3 max-w-[46ch] text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7">
          {description}
        </p>
      ) : null}
    </div>
  );
}
