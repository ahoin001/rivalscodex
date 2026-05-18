"use client";

import { LazyVideoEmbed } from "@/features/heroes/components/lazy-video-embed";
import { getYoutubeEmbedUrl } from "@/features/heroes/youtube";

/**
 * Renders a YouTube clip embed when the URL parses cleanly, falling back
 * to an underlined external link otherwise. Used by every block that
 * accepts an optional `clip` (combo, matchup, video).
 */
export function GuideClip({ label, href }: { label: string; href: string }) {
  const embedUrl = getYoutubeEmbedUrl(href);
  if (!embedUrl) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-rivals-ink underline decoration-rivals-yellow-600/80 underline-offset-2 hover:text-rivals-yellow-800"
      >
        {label}
        <span aria-hidden>→</span>
      </a>
    );
  }
  return <LazyVideoEmbed title={label} embedUrl={embedUrl} />;
}
