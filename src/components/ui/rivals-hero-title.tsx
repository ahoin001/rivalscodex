type RivalsHeroTitleProps = {
  name: string;
  subtitle?: string;
  description?: string;
  className?: string;
  size?: "md" | "lg" | "xl";
};

const sizeClass: Record<NonNullable<RivalsHeroTitleProps["size"]>, string> = {
  md: "text-[2.4rem] sm:text-[3.4rem] lg:text-[4.2rem]",
  lg: "text-[2.8rem] sm:text-[4.2rem] lg:text-[5.5rem]",
  xl: "text-[3.2rem] sm:text-[5rem] lg:text-[6.4rem]",
};

export function RivalsHeroTitle({
  name,
  subtitle,
  description,
  className = "",
  size = "lg",
}: RivalsHeroTitleProps) {
  const words = name.trim().split(/\s+/);

  return (
    <div className={`text-rivals-ink ${className}`.trim()}>
      <h1
        className={`slanted-title font-display font-extrabold uppercase italic leading-[0.86] ${sizeClass[size]}`}
      >
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className="block">
            {word}
          </span>
        ))}
      </h1>

      {subtitle ? (
        <p className="mt-4 inline-flex items-center bg-rivals-ink px-3 py-1 font-display text-xs italic uppercase tracking-[0.2em] text-white sm:text-sm">
          {subtitle}
        </p>
      ) : null}

      {description ? (
        <p className="mt-3 max-w-[44ch] text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7">
          {description}
        </p>
      ) : null}
    </div>
  );
}
