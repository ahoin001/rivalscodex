type LazyVideoEmbedProps = {
  title: string;
  embedUrl: string;
  variant?: "light" | "dark";
  size?: "default" | "compact";
};

const shellClass: Record<"light" | "dark", Record<"default" | "compact", string>> = {
  light: {
    default:
      "overflow-hidden rounded-lg border border-rivals-light-300 bg-white p-2 shadow-sm sm:p-3",
    compact:
      "overflow-hidden rounded-md border border-rivals-light-300/90 bg-rivals-light-50/50 p-1.5 shadow-sm",
  },
  dark: {
    default:
      "clipped-edge overflow-hidden rounded-lg border border-brand-gold/25 bg-[#101524]/90 p-3 shadow-[0_8px_26px_rgba(3,8,20,0.45)]",
    compact:
      "overflow-hidden rounded-md border border-brand-gold/25 bg-[#101524]/90 p-2 shadow-md",
  },
};

export function LazyVideoEmbed({
  title,
  embedUrl,
  variant = "dark",
  size = "default",
}: LazyVideoEmbedProps) {
  return (
    <div className={shellClass[variant][size]}>
      <iframe
        src={embedUrl}
        title={title}
        className="aspect-video w-full rounded-sm"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
