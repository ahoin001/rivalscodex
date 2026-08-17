import { ViewTransition } from "react";
import type { ReactNode } from "react";
import { HUD_ASSEMBLE_SHARE, heroPortraitTransitionName } from "./names";

type HeroPortraitTransitionProps = {
  slug: string;
  children: ReactNode;
  className?: string;
};

export function HeroPortraitTransition({
  slug,
  children,
  className = "absolute inset-0",
}: HeroPortraitTransitionProps) {
  return (
    <ViewTransition name={heroPortraitTransitionName(slug)} share={HUD_ASSEMBLE_SHARE} default="none">
      <span className={`block ${className}`.trim()}>{children}</span>
    </ViewTransition>
  );
}
