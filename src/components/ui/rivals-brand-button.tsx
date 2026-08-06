import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { RivalsCta, type RivalsCtaSize, type RivalsCtaVariant } from "@/components/ui/rivals-cta";

type Variant = Extract<RivalsCtaVariant, "primary" | "outline" | "ghost" | "ink">;
type Size = RivalsCtaSize;

type RivalsBrandButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>;

/** @deprecated Prefer `RivalsCta` with `context="lab"`. Kept as a thin wrapper. */
export function RivalsBrandButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: RivalsBrandButtonProps) {
  return (
    <RivalsCta context="lab" variant={variant} size={size} className={className} {...props}>
      {children}
    </RivalsCta>
  );
}
