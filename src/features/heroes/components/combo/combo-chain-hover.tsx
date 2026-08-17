"use client";

import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export function HoverTip({
  tip,
  children,
  variant = "label",
}: {
  tip: string;
  children: ReactNode;
  variant?: "label" | "step";
}) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, []);

  const open = useCallback(() => {
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const close = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(open, 180);
  }, [open]);

  const onClick = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      setVisible((v) => {
        if (v) return false;
        updatePosition();
        return true;
      });
    },
    [updatePosition],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={close}
        onFocus={onMouseEnter}
        onBlur={close}
        onClick={onClick}
        className="relative inline-flex"
      >
        {children}
      </span>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              className={
                variant === "step"
                  ? "pointer-events-none fixed z-[9999] w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-cyan-400/30 bg-[#161b28]/98 px-3 py-2 text-[11px] leading-4 text-cyan-100 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                  : "pointer-events-none fixed z-[9999] max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-white/15 bg-[#161b28]/98 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              }
              style={{ left: position.x, top: position.y }}
            >
              {variant === "step" ? (
                <>
                  <span className="font-bold uppercase tracking-wide">Step tip · </span>
                  {tip}
                </>
              ) : (
                tip
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function StepOnlyTip({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <HoverTip tip={tip} variant="step">
      {children}
    </HoverTip>
  );
}
