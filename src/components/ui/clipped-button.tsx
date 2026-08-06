import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { RivalsCta } from "@/components/ui/rivals-cta";

type ClippedButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    tone?: "default" | "brand";
  }
>;

/** @deprecated Prefer `RivalsCta` with `context="chrome"`. Kept as a thin wrapper. */
export function ClippedButton({
  children,
  active = false,
  tone = "default",
  className = "",
  ...props
}: ClippedButtonProps) {
  return (
    <RivalsCta
      context="chrome"
      variant={tone === "brand" ? "brand" : "default"}
      active={active}
      className={className}
      {...props}
    >
      {children}
    </RivalsCta>
  );
}
