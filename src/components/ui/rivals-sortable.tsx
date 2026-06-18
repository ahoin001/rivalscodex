"use client";

import { useCallback, useState, type ButtonHTMLAttributes, type DragEvent, type HTMLAttributes } from "react";

const DRAG_MIME = "application/x-rivals-sortable-index";

type UseSortableDragOptions = {
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export function useSortableDrag({ onReorder }: UseSortableDragOptions) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const clearDrag = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const getHandleProps = useCallback(
    (index: number): ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: "button",
      draggable: true,
      "aria-label": "Drag to reorder",
      onDragStart: (event: DragEvent<HTMLButtonElement>) => {
        setDragIndex(index);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(DRAG_MIME, String(index));
        if (event.currentTarget.parentElement) {
          event.dataTransfer.setDragImage(event.currentTarget.parentElement, 24, 20);
        }
      },
      onDragEnd: clearDrag,
    }),
    [clearDrag],
  );

  const getItemProps = useCallback(
    (index: number): HTMLAttributes<HTMLElement> => ({
      onDragOver: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (dragIndex !== null && dragIndex !== index) {
          setOverIndex(index);
        }
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        const related = event.relatedTarget as Node | null;
        if (!related || !event.currentTarget.contains(related)) {
          setOverIndex((current) => (current === index ? null : current));
        }
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData(DRAG_MIME);
        const from = dragIndex ?? parseInt(raw, 10);
        if (!Number.isNaN(from) && from !== index) {
          onReorder(from, index);
        }
        clearDrag();
      },
    }),
    [clearDrag, dragIndex, onReorder],
  );

  const isDragging = dragIndex !== null;

  const itemClassName = useCallback(
    (index: number, base = "") => {
      const dragging = dragIndex === index;
      const over = overIndex === index && dragIndex !== null && dragIndex !== index;
      return [
        base,
        dragging ? "opacity-55" : "",
        over ? "ring-2 ring-brand-gold/45 ring-offset-1" : "",
      ]
        .filter(Boolean)
        .join(" ");
    },
    [dragIndex, overIndex],
  );

  return {
    isDragging,
    getHandleProps,
    getItemProps,
    itemClassName,
  };
}

type SortableDragHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SortableDragHandle({ className = "", ...props }: SortableDragHandleProps) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 cursor-grab touch-none flex-col items-center justify-center gap-0.5 rounded border border-transparent px-1 py-1 text-rivals-ink-muted transition-colors hover:border-rivals-light-300 hover:bg-rivals-light-100 hover:text-rivals-ink active:cursor-grabbing ${className}`.trim()}
      {...props}
    >
      <span className="flex gap-0.5" aria-hidden>
        <span className="h-1 w-1 rounded-full bg-current" />
        <span className="h-1 w-1 rounded-full bg-current" />
      </span>
      <span className="flex gap-0.5" aria-hidden>
        <span className="h-1 w-1 rounded-full bg-current" />
        <span className="h-1 w-1 rounded-full bg-current" />
      </span>
      <span className="flex gap-0.5" aria-hidden>
        <span className="h-1 w-1 rounded-full bg-current" />
        <span className="h-1 w-1 rounded-full bg-current" />
      </span>
    </button>
  );
}
