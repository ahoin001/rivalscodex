"use client";

export function GuideTabFallback({
  primaryPoints,
  secondaryPoints,
}: {
  primaryPoints?: string[];
  secondaryPoints?: string[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-rivals-light-300 bg-white/75 p-4">
        <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.2em] text-rivals-ink-muted">
          Priority cues
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
          {(primaryPoints ?? []).map((point) => (
            <li key={point} className="rivals-clip-row bg-rivals-light-100/70 px-3 py-2">
              {point}
            </li>
          ))}
        </ul>
      </div>
      {secondaryPoints && secondaryPoints.length > 0 ? (
        <div className="rounded-lg border border-rivals-light-300 bg-white/75 p-4">
          <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.2em] text-rivals-ink-muted">
            Supporting cues
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
            {secondaryPoints.map((point) => (
              <li key={point} className="rivals-clip-row bg-rivals-light-100/70 px-3 py-2">
                {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

