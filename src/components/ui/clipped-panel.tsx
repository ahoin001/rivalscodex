import { PropsWithChildren } from "react";

type ClippedPanelProps = PropsWithChildren<{
  className?: string;
  tone?: "default" | "gold";
}>;

export function ClippedPanel({
  children,
  className = "",
  tone = "default",
}: ClippedPanelProps) {
  return (
    <section
      className={`glass-panel clipped-edge ${tone === "gold" ? "glass-panel-gold" : ""} ${className}`.trim()}
    >
      {children}
    </section>
  );
}
