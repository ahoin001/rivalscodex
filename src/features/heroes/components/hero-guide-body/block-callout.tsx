"use client";

type CalloutVariant = "gameplan" | "macro" | "tip";

const VARIANT_TONES: Record<CalloutVariant | "default", string> = {
  gameplan: "border-rivals-ink/15 bg-rivals-light-200/90",
  macro: "border-cyan-500/35 bg-cyan-50/90",
  tip: "border-rivals-yellow-500/40 bg-rivals-yellow-50/80",
  default: "border-rivals-ink/15 bg-rivals-light-200/90",
};

export function BlockCallout({
  variant,
  title,
  body,
}: {
  variant?: CalloutVariant;
  title?: string;
  body: string;
}) {
  const tone = VARIANT_TONES[variant ?? "default"];

  return (
    <div className={`rounded border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${tone}`}>
      {title ? (
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rivals-ink-muted">
          {title}
        </p>
      ) : null}
      <p className={`text-sm leading-6 text-rivals-ink-soft sm:text-[15px] sm:leading-7 ${title ? "mt-2" : ""}`}>
        {body}
      </p>
    </div>
  );
}
