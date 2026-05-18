"use client";

import { GuideClip } from "./guide-clip";

export function BlockVideo({ title, watchUrl }: { title: string; watchUrl: string }) {
  return (
    <div>
      <p className="mb-2 font-display text-[11px] uppercase tracking-[0.18em] text-rivals-ink-muted">
        Video
      </p>
      <GuideClip label={title} href={watchUrl} />
    </div>
  );
}
