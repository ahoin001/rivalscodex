type RivalsSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function RivalsSectionHeader({
  eyebrow,
  title,
  description,
  className = "",
}: RivalsSectionHeaderProps) {
  return (
    <header className={`space-y-3 ${className}`.trim()}>
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold md:text-xs">
          {eyebrow}
        </p>
      )}
      <h1 className="slanted-title font-display text-[2.7rem] italic uppercase leading-[0.95] md:text-[4.25rem]">
        <span>{title}</span>
      </h1>
      <div className="brand-divider max-w-3xl" />
      {description && (
        <p className="max-w-3xl text-[0.95rem] leading-6 text-muted-foreground md:text-[1.02rem] md:leading-7">
          {description}
        </p>
      )}
    </header>
  );
}
