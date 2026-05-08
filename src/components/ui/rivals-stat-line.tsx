import { ReactNode } from "react";

type RivalsStatLineProps = {
  label: string;
  value: ReactNode;
  className?: string;
  showDivider?: boolean;
};

export function RivalsStatLine({
  label,
  value,
  className = "",
  showDivider = true,
}: RivalsStatLineProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-1 py-2 ${
        showDivider ? "border-b border-rivals-light-300" : ""
      } ${className}`.trim()}
    >
      <span className="font-display text-xs font-semibold uppercase italic tracking-[0.18em] text-rivals-ink-soft sm:text-[13px]">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-rivals-ink sm:text-[15px]">
        {value}
      </span>
    </div>
  );
}
