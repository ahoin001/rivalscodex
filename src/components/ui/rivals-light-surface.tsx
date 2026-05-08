import { CSSProperties, PropsWithChildren } from "react";

type RivalsLightSurfaceProps = PropsWithChildren<{
  className?: string;
  tone?: "neutral" | "yellow" | "ink";
  bordered?: boolean;
  style?: CSSProperties;
}>;

const toneClass: Record<NonNullable<RivalsLightSurfaceProps["tone"]>, string> = {
  neutral: "bg-rivals-light-100 text-rivals-ink",
  yellow: "bg-rivals-yellow-500 text-rivals-ink",
  ink: "bg-rivals-ink text-rivals-light-100",
};

export function RivalsLightSurface({
  children,
  className = "",
  tone = "neutral",
  bordered = false,
  style,
}: RivalsLightSurfaceProps) {
  return (
    <section
      className={`relative overflow-hidden ${toneClass[tone]} ${
        bordered ? "border border-rivals-ink/15" : ""
      } ${className}`.trim()}
      style={style}
    >
      {children}
    </section>
  );
}
