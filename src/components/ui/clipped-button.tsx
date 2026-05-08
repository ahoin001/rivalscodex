import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ClippedButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    tone?: "default" | "brand";
  }
>;

export function ClippedButton({
  children,
  active = false,
  tone = "default",
  className = "",
  ...props
}: ClippedButtonProps) {
  const defaultClasses = active
    ? "bg-white/20 text-white"
    : "bg-white/6 text-muted-foreground hover:bg-white/12 hover:text-white";
  const brandClasses = active
    ? "border-brand-gold bg-brand-gold text-[#10131f]"
    : "border-brand-gold/50 bg-brand-gold-muted text-brand-gold hover:border-brand-gold hover:bg-brand-gold/90 hover:text-[#10131f]";

  return (
    <button
      className={`clipped-edge border border-panel-border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
        tone === "brand" ? brandClasses : defaultClasses
      } ${className}`.trim()}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
