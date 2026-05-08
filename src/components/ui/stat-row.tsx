type StatRowProps = {
  label: string;
  value: string;
  showDivider?: boolean;
  accent?: boolean;
};

export function StatRow({
  label,
  value,
  showDivider = true,
  accent = false,
}: StatRowProps) {
  return (
    <div
      className={`flex items-center justify-between pb-2 ${
        showDivider ? "border-b border-white/14" : ""
      }`}
    >
      <span className={accent ? "text-brand-gold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
