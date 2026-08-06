"use client";

import { GuideClip } from "./guide-clip";

export function BlockVideo({
  title,
  watchUrl,
  note,
  layout = "grid",
}: {
  title: string;
  watchUrl: string;
  /** Shown above the thumbnail — what this video is helpful for. */
  note?: string;
  /** `grid` = compact card for resources grids; `inline` = minimal embed in other tabs. */
  layout?: "grid" | "inline";
}) {
  if (layout === "inline") {
    return (
      <div>
        <p className="mb-2 font-display text-[11px] uppercase tracking-[0.18em] text-rivals-ink-muted">
          Video
        </p>
        {note ? (
          <p className="mb-2 text-sm leading-6 text-rivals-ink-soft">{note}</p>
        ) : null}
        <GuideClip label={title} href={watchUrl} variant="light" size="compact" />
      </div>
    );
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-rivals-light-300/90 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <header className="border-b border-rivals-light-300/70 px-3 py-2.5 sm:px-3.5">
        <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-rivals-ink-muted">
          Video
        </p>
        <h4 className="mt-0.5 line-clamp-2 font-display text-sm font-extrabold uppercase italic leading-snug text-rivals-ink">
          {title}
        </h4>
      </header>

      {note ? (
        <div className="border-b border-brand-gold/15 bg-brand-gold-muted/25 px-3 py-2 sm:px-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rivals-ink-muted">
            Why watch
          </p>
          <p className="mt-0.5 text-xs leading-5 text-rivals-ink-soft sm:text-[13px] sm:leading-6">
            {note}
          </p>
        </div>
      ) : null}

      <div className="mt-auto p-2 sm:p-2.5">
        <GuideClip label={title} href={watchUrl} variant="light" size="compact" />
      </div>
    </article>
  );
}
