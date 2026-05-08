import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "outline" | "ghost" | "ink";
type Size = "sm" | "md" | "lg";

type RivalsBrandButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>;

const variantClass: Record<Variant, string> = {
  primary:
    "bg-rivals-yellow-500 text-rivals-ink hover:bg-rivals-yellow-400 active:bg-rivals-yellow-600",
  outline:
    "border border-rivals-ink/35 bg-transparent text-rivals-ink hover:border-rivals-ink/65",
  ghost:
    "bg-rivals-light-200 text-rivals-ink hover:bg-rivals-light-300 hover:text-rivals-ink",
  ink: "bg-rivals-ink text-rivals-light-100 hover:bg-rivals-ink-soft",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2 text-xs sm:text-sm",
  lg: "px-5 py-2.5 text-sm sm:text-base",
};

export function RivalsBrandButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: RivalsBrandButtonProps) {
  return (
    <button
      type="button"
      className={`rivals-clip-tab inline-flex items-center justify-center gap-2 font-display font-semibold uppercase italic tracking-[0.18em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
        variantClass[variant]
      } ${sizeClass[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
