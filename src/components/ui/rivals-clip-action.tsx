import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type RivalsClipActionVariant = "surface" | "gold-outline" | "gold-solid";
export type RivalsClipActionSize = "sm" | "md";

const sizeClass: Record<RivalsClipActionSize, string> = {
  sm: "min-h-10 px-4 py-2 text-[11px] tracking-[0.18em]",
  md: "min-h-11 px-4 py-2 text-xs tracking-[0.18em] sm:text-sm",
};

const variantClass: Record<RivalsClipActionVariant, string> = {
  surface:
    "border border-brand-gold/70 bg-white/95 text-rivals-ink shadow-[0_2px_10px_rgb(26_29_38/12%)] hover:border-brand-gold hover:bg-rivals-yellow-500 hover:text-rivals-ink",
  "gold-outline":
    "border border-brand-gold/55 bg-transparent text-brand-gold hover:border-brand-gold hover:bg-rivals-yellow-500 hover:text-rivals-ink",
  "gold-solid":
    "border border-brand-gold bg-rivals-yellow-500 text-rivals-ink shadow-[0_2px_10px_rgb(26_29_38/12%)] hover:bg-rivals-yellow-400 hover:text-rivals-ink",
};

const baseClass =
  "rivals-clip-tab inline-flex shrink-0 items-center justify-center gap-2 font-display font-bold uppercase italic transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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

function buildClassName(
  variant: RivalsClipActionVariant,
  size: RivalsClipActionSize,
  className: string,
) {
  return `${baseClass} ${sizeClass[size]} ${variantClass[variant]} ${className}`.trim();
}

export function RivalsClipAction({
  variant = "surface",
  size = "sm",
  className = "",
  children,
  ...props
}: RivalsClipActionProps) {
  const classes = buildClassName(variant, size, className);

  if ("href" in props && props.href) {
    const { href, ...linkRest } = props as RivalsClipActionLinkProps;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as RivalsClipActionButtonProps;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}

export function rivalsClipActionClass(
  variant: RivalsClipActionVariant = "surface",
  size: RivalsClipActionSize = "sm",
  className = "",
) {
  return buildClassName(variant, size, className);
}
