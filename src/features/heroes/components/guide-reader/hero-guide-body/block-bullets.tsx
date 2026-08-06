"use client";

export function BlockBullets({
  title,
  items,
}: {
  title?: string;
  items: string[];
}) {
  return (
    <div>
      {title ? (
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-rivals-ink-muted">
          {title}
        </p>
      ) : null}
      <ul
        className={`mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px] ${title ? "" : "mt-0"}`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
