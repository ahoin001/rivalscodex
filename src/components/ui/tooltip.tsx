import type { CSSProperties, PropsWithChildren, ReactNode } from "react";

type TooltipPlacement = "top" | "bottom";

type TooltipProps = PropsWithChildren<{
  /** Tooltip body. Strings render compactly; `ReactNode` enables richer hints. */
  content: ReactNode;
  /** Vertical placement of the bubble relative to the trigger. Defaults to `top`. */
  placement?: TooltipPlacement;
  /** Maximum bubble width in CSS units. Defaults to `18rem`. */
  maxWidth?: string;
  /** Wrapping element className for layout tuning at call sites. */
  className?: string;
}>;

/**
 * Lightweight, dependency-free tooltip.
 *
 * Reveals on `hover`, `focus-within`, or `aria-describedby`-based programmatic
 * focus. No portals, no JS state, no layout shift — the bubble is absolutely
 * positioned and `pointer-events: none` until shown so it never traps clicks.
 * Use for short hints; reach for a modal or popover for anything interactive.
 */
export function Tooltip({
  children,
  content,
  placement = "top",
  maxWidth = "18rem",
  className = "",
}: TooltipProps) {
  const placementClass =
    placement === "top"
      ? "bottom-[calc(100%+0.45rem)]"
      : "top-[calc(100%+0.45rem)]";

  const arrowClass =
    placement === "top"
      ? "bottom-[-0.3rem] border-t-[#1f2533]"
      : "top-[-0.3rem] border-b-[#1f2533]";

  const arrowStyle: CSSProperties =
    placement === "top"
      ? {
          borderLeft: "0.3rem solid transparent",
          borderRight: "0.3rem solid transparent",
          borderTop: "0.3rem solid currentColor",
          color: "#1f2533",
        }
      : {
          borderLeft: "0.3rem solid transparent",
          borderRight: "0.3rem solid transparent",
          borderBottom: "0.3rem solid currentColor",
          color: "#1f2533",
        };

  return (
    <span
      className={`group/tooltip relative inline-flex ${className}`.trim()}
      data-tooltip-host
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 ${placementClass} translate-y-1 whitespace-normal border border-[#3a4256] bg-[#1f2533] px-2.5 py-1.5 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 group-hover/tooltip:translate-y-0 group-focus-within/tooltip:translate-y-0`}
        style={{ maxWidth }}
      >
        {content}
        <span
          aria-hidden
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${arrowClass}`}
          style={arrowStyle}
        />
      </span>
    </span>
  );
}

/**
 * Inline help indicator — a circular `?` button bound to a tooltip. Use to
 * annotate form fields whose label alone isn't enough.
 */
export function HelpTooltip({
  content,
  placement = "top",
  maxWidth,
  label = "Help",
}: {
  content: ReactNode;
  placement?: TooltipPlacement;
  maxWidth?: string;
  label?: string;
}) {
  return (
    <Tooltip content={content} placement={placement} maxWidth={maxWidth}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-brand-gold/45 bg-brand-gold-muted/40 text-[10px] font-bold leading-none text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold hover:text-[#10131f] focus-visible:border-brand-gold focus-visible:bg-brand-gold focus-visible:text-[#10131f] focus-visible:outline-none"
      >
        ?
      </button>
    </Tooltip>
  );
}
