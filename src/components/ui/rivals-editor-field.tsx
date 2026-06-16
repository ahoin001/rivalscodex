"use client";

import type { ReactNode } from "react";

type RivalsEditorFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function RivalsEditorField({
  label,
  children,
  className = "",
}: RivalsEditorFieldProps) {
  return (
    <label className={`grid min-w-0 gap-1 text-[11px] ${className}`.trim()}>
      <span className="font-semibold uppercase tracking-wide text-rivals-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function editorInputClass(extra = ""): string {
  return `w-full min-w-0 rounded border border-rivals-light-300 px-2 py-1 text-sm text-rivals-ink ${extra}`.trim();
}
