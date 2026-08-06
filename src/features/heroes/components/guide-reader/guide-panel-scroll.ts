export type ScrollTargetIntoPanelOptions = {
  container?: HTMLElement | null;
  offset?: number;
  behavior?: ScrollBehavior;
};

function isScrollableOverflow(value: string): boolean {
  return value === "auto" || value === "scroll" || value === "overlay";
}

/** Walk ancestors to find the nearest vertically scrollable container. */
export function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;

  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    if (isScrollableOverflow(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

/**
 * Scroll a target into view, preferring the document scroll unless a real
 * nested scroll container wraps the target (overflow + overflowed content).
 */
export function scrollTargetIntoPanel(
  target: HTMLElement | null,
  options: ScrollTargetIntoPanelOptions = {},
): void {
  if (!target || typeof window === "undefined") return;

  const { offset = 48, behavior = "smooth" } = options;
  let container = options.container ?? findScrollContainer(target);

  if (container && container.scrollHeight <= container.clientHeight + 1) {
    container = null;
  }

  if (!container) {
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior,
    });
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    container.scrollTop + (targetRect.top - containerRect.top) - offset;

  container.scrollTo({
    top: Math.max(0, nextTop),
    behavior,
  });
}
