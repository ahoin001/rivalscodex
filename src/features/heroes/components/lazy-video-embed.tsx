"use client";

import { useState } from "react";

type LazyVideoEmbedProps = {
  title: string;
  embedUrl: string;
};

export function LazyVideoEmbed({ title, embedUrl }: LazyVideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="clipped-edge border border-brand-gold/30 bg-[#101524]/90 p-3">
      {!isLoaded ? (
        <button
          type="button"
          onClick={() => setIsLoaded(true)}
          className="w-full border border-brand-gold/45 bg-brand-gold-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold hover:text-[#11131e]"
        >
          Load Video Preview
        </button>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          className="h-52 w-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </div>
  );
}
