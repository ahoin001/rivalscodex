"use client";

import type { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

type ScrollRevealSectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
};

/** Section wrapper that applies the shared scroll-reveal animation when in view. */
export function ScrollRevealSection({ id, className = "", children }: ScrollRevealSectionProps) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} id={id} className={`scroll-reveal ${className}`.trim()}>
      {children}
    </section>
  );
}
