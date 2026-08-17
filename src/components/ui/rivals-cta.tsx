import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/**
 * Unified clipped CTA for chrome (dark HUD) and lab (light dossier) contexts.
 * Prefer this over inventing one-off buttons. Legacy wrappers remain for back-compat.
 */
export type RivalsCtaContext = "chrome" | "lab";
export type RivalsCtaVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "ink"
  | "surface"
  | "gold-outline"
  | "gold-solid"
  | "default"
  | "brand";
export type RivalsCtaSize = "sm" | "md" | "lg";

type SharedProps = {
  context?: RivalsCtaContext;
  variant?: RivalsCtaVariant;
  size?: RivalsCtaSize;
  className?: string;
  children: ReactNode;
  active?: boolean;
};

type ButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type RivalsCtaProps = ButtonProps | LinkProps;

const motionClass =
  "transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/45 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const labSize: Record<RivalsCtaSize, string> = {
  sm: "min-h-10 px-3 py-1.5 text-[11px] tracking-[0.18em]",
  md: "min-h-11 px-4 py-2 text-xs tracking-[0.18em] sm:text-sm",
  lg: "min-h-12 px-5 py-2.5 text-sm tracking-[0.18em] sm:text-base",
};

const chromeSize: Record<RivalsCtaSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

function labVariantClass(variant: RivalsCtaVariant): string {
  switch (variant) {
    case "outline":
      return "border border-rivals-ink/35 bg-transparent text-rivals-ink hover:border-rivals-ink/65";
    case "ghost":
      return "bg-rivals-light-200 text-rivals-ink hover:bg-rivals-light-300";
    case "ink":
      return "bg-rivals-ink text-rivals-light-100 hover:bg-rivals-ink-soft";
    case "surface":
      return "border border-brand-gold/70 bg-white/95 text-rivals-ink shadow-[0_2px_10px_rgb(26_29_38/12%)] hover:border-brand-gold hover:bg-rivals-yellow-500";
    case "gold-outline":
      return "border border-brand-gold/55 bg-transparent text-brand-gold hover:border-brand-gold hover:bg-rivals-yellow-500 hover:text-rivals-ink";
    case "gold-solid":
    case "primary":
    case "brand":
    default:
      return "border border-brand-gold bg-rivals-yellow-500 text-ink-on-gold hover:bg-rivals-yellow-400";
  }
}

function chromeVariantClass(variant: RivalsCtaVariant, active: boolean): string {
  if (variant === "brand" || variant === "primary" || variant === "gold-solid") {
    return active
      ? "border-brand-gold bg-brand-gold text-ink-on-gold"
      : "border-brand-gold/50 bg-brand-gold-muted text-brand-gold hover:border-brand-gold hover:bg-brand-gold/90 hover:text-ink-on-gold";
  }
  return active
    ? "bg-white/20 text-white border-panel-border"
    : "bg-white/6 text-muted-foreground border-panel-border hover:bg-white/12 hover:text-white";
}

function resolveContext(
  context: RivalsCtaContext | undefined,
  variant: RivalsCtaVariant,
): RivalsCtaContext {
  if (context) return context;
  if (
    variant === "default" ||
    variant === "brand" ||
    variant === "surface" ||
    variant === "gold-outline" ||
    variant === "gold-solid"
  ) {
    return variant === "default" || variant === "brand" ? "chrome" : "lab";
  }
  return "lab";
}

export function rivalsCtaClassName({
  context,
  variant = "primary",
  size = "md",
  active = false,
  className = "",
}: Pick<SharedProps, "context" | "variant" | "size" | "active" | "className">) {
  const resolved = resolveContext(context, variant);
  if (resolved === "chrome") {
    return `clipped-edge inline-flex items-center justify-center gap-2 border font-semibold uppercase tracking-wide ${motionClass} focus-visible:ring-offset-background ${chromeSize[size]} ${chromeVariantClass(variant, active)} ${className}`.trim();
  }
  return `rivals-clip-tab inline-flex shrink-0 items-center justify-center gap-2 font-display font-bold uppercase italic ${motionClass} focus-visible:ring-offset-2 ${labSize[size]} ${labVariantClass(variant)} ${className}`.trim();
}

export function RivalsCta({
  context,
  variant = "primary",
  size = "md",
  active = false,
  className = "",
  children,
  ...props
}: RivalsCtaProps) {
  const classes = rivalsCtaClassName({ context, variant, size, active, className });

  if ("href" in props && props.href) {
    const { href, ...linkRest } = props as LinkProps;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonProps;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
