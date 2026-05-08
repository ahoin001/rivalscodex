type RivalsKeyChipProps = {
  keyLabel: string;
  className?: string;
  size?: "sm" | "md";
  tone?: "ink" | "yellow" | "muted";
};

const sizeClass: Record<NonNullable<RivalsKeyChipProps["size"]>, string> = {
  sm: "h-6 min-w-[2.4rem] px-2 text-[10px]",
  md: "h-7 min-w-[3rem] px-2.5 text-[11px]",
};

const toneClass: Record<NonNullable<RivalsKeyChipProps["tone"]>, string> = {
  ink: "bg-rivals-ink text-white",
  yellow: "bg-rivals-yellow-500 text-rivals-ink",
  muted: "bg-rivals-light-300 text-rivals-ink",
};

export function RivalsKeyChip({
  keyLabel,
  className = "",
  size = "md",
  tone = "ink",
}: RivalsKeyChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-display font-bold uppercase italic tracking-wide ${sizeClass[size]} ${toneClass[tone]} ${className}`.trim()}
      style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
    >
      {keyLabel}
    </span>
  );
}
