"use client";

import { useEffect, useRef } from "react";

type UseScrollRevealOptions = {
  /** IntersectionObserver `threshold`; defaults to 0.15. */
  threshold?: number;
  /** IntersectionObserver `rootMargin`; defaults to "0px". */
  rootMargin?: string;
  /** When `true`, the element stays observed; default unobserves on reveal. */
  repeat?: boolean;
};

/**
 * Attach an `IntersectionObserver` to the target ref. When the element
 * enters the viewport the `revealed` class is added, which drives the
 * `scroll-reveal` transition defined in `globals.css`.
 *
 * The hook accepts only primitive options so the effect deps stay stable
 * across renders — passing an object literal (e.g. `{}`) into a hook with
 * `[options]` would cause the observer to be rebuilt every render. We
 * destructure the primitives instead.
 *
 * Respects `prefers-reduced-motion: reduce`: when set, the class is
 * applied immediately and no observer is created.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.15,
  rootMargin = "0px",
  repeat = false,
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      node.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            if (!repeat) observer.unobserve(entry.target);
          } else if (repeat) {
            entry.target.classList.remove("revealed");
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, repeat]);

  return ref;
}
