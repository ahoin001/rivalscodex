import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import {
  RivalsCta,
  rivalsCtaClassName,
  type RivalsCtaSize,
} from "@/components/ui/rivals-cta";

export type RivalsClipActionVariant = "surface" | "gold-outline" | "gold-solid";
export type RivalsClipActionSize = Extract<RivalsCtaSize, "sm" | "md">;

type RivalsClipActionSharedProps = {
  variant?: RivalsClipActionVariant;
  size?: RivalsClipActionSize;
  className?: string;
  children: ReactNode;
};

type RivalsClipActionButtonProps = RivalsClipActionSharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type RivalsClipActionLinkProps = RivalsClipActionSharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type RivalsClipActionProps =
  | RivalsClipActionButtonProps
  | RivalsClipActionLinkProps;

/** @deprecated Prefer `RivalsCta`. Kept as a thin wrapper for existing call sites. */
export function rivalsClipActionClass(
  variant: RivalsClipActionVariant = "surface",
  size: RivalsClipActionSize = "sm",
  className = "",
) {
  return rivalsCtaClassName({
    context: "lab",
    variant,
    size,
    className,
  });
}

export function RivalsClipAction({
  variant = "surface",
  size = "sm",
  className = "",
  children,
  ...props
}: RivalsClipActionProps) {
  if ("href" in props && props.href) {
    const { href, ...linkRest } = props as RivalsClipActionLinkProps;
    return (
      <RivalsCta
        context="lab"
        variant={variant}
        size={size}
        className={className}
        href={href}
        {...linkRest}
      >
        {children}
      </RivalsCta>
    );
  }

  const buttonProps = props as RivalsClipActionButtonProps;
  return (
    <RivalsCta
      context="lab"
      variant={variant}
      size={size}
      className={className}
      {...buttonProps}
    >
      {children}
    </RivalsCta>
  );
}
