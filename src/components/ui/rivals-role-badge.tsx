import { ReactNode } from "react";

export type RivalsRole = "Vanguard" | "Duelist" | "Strategist";

type RivalsRoleBadgeProps = {
  role: RivalsRole;
  icon?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass: Record<NonNullable<RivalsRoleBadgeProps["size"]>, string> = {
  sm: "text-[12px] tracking-[0.18em] gap-1.5",
  md: "text-sm tracking-[0.18em] gap-2 sm:text-base",
  lg: "text-base tracking-[0.2em] gap-2.5 sm:text-lg lg:text-xl",
};

const roleColor: Record<RivalsRole, string> = {
  Strategist: "text-rivals-strategist",
  Duelist: "text-rivals-duelist",
  Vanguard: "text-rivals-vanguard",
};

export function RivalsRoleBadge({
  role,
  icon,
  className = "",
  size = "md",
}: RivalsRoleBadgeProps) {
  return (
    <div
      className={`flex items-center font-display italic uppercase ${sizeClass[size]} ${className}`.trim()}
    >
      {icon ? <span className={`shrink-0 ${roleColor[role]}`}>{icon}</span> : null}
      <span className="text-rivals-ink">{role}</span>
    </div>
  );
}
