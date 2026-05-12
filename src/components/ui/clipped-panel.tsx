import { PropsWithChildren } from "react";

type ClippedPanelProps = PropsWithChildren<{
  className?: string;
  /** `sheet` = opaque light panel for dark “data” contexts (hero gallery, filters). */
  tone?: "default" | "gold" | "sheet";
}>;

export function ClippedPanel({
  children,
  className = "",
  tone = "default",
}: ClippedPanelProps) {
  const surfaceClass =
    tone === "sheet"
      ? "sheet-panel"
      : `glass-panel ${tone === "gold" ? "glass-panel-gold" : ""}`;

  return (
    <section className={`clipped-edge ${surfaceClass} ${className}`.trim()}>{children}</section>
  );
}
