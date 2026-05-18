"use client";

export function BlockTwoColumn({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
}: {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Column tone="target" title={leftTitle} items={leftItems} />
      <Column tone="threat" title={rightTitle} items={rightItems} />
    </div>
  );
}

const TONE_STYLES = {
  target: {
    shell: "border-emerald-600/20 bg-emerald-50/50",
    title: "text-emerald-900/70",
  },
  threat: {
    shell: "border-rose-500/25 bg-rose-50/50",
    title: "text-rose-900/70",
  },
} as const;

function Column({
  tone,
  title,
  items,
}: {
  tone: keyof typeof TONE_STYLES;
  title: string;
  items: string[];
}) {
  const s = TONE_STYLES[tone];
  return (
    <div className={`rounded border ${s.shell} px-3 py-3 transition-all duration-200 hover:shadow-sm sm:px-4`}>
      <p className={`font-display text-[11px] uppercase tracking-[0.22em] ${s.title}`}>
        {title}
      </p>
      <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6 text-rivals-ink-soft sm:text-[15px]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
