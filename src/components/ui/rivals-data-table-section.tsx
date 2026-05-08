import { ReactNode } from "react";
import { HudSection } from "@/components/ui/hud-section";

export type RivalsDataColumn = {
  key: string;
  label: string;
  className?: string;
};

type RivalsDataTableSectionProps<T> = {
  title: string;
  columns: RivalsDataColumn[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  renderCell: (row: T, columnKey: string, index: number) => ReactNode;
  renderMobile?: (row: T, index: number) => ReactNode;
  tone?: "primary" | "secondary";
  className?: string;
  emptyState?: ReactNode;
};

export function RivalsDataTableSection<T>({
  title,
  columns,
  rows,
  getRowKey,
  renderCell,
  renderMobile,
  tone = "primary",
  className = "",
  emptyState = "No data available.",
}: RivalsDataTableSectionProps<T>) {
  return (
    <HudSection title={title} tone={tone} className={className}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyState}</p>
      ) : (
        <>
          <div className="hidden md:block">
            <div
              className="grid gap-2 border-b border-brand-gold/35 pb-2 text-[11px] uppercase tracking-[0.16em] text-brand-gold/90"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
            >
              {columns.map((column) => (
                <span key={column.key} className={column.className}>
                  {column.label}
                </span>
              ))}
            </div>

            <div className="mt-2 space-y-2">
              {rows.map((row, index) => (
                <div
                  key={getRowKey(row, index)}
                  className="grid items-center gap-2 border border-white/10 bg-black/15 px-3 py-2 text-sm"
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                  }}
                >
                  {columns.map((column) => (
                    <div key={column.key} className={`min-w-0 ${column.className ?? ""}`.trim()}>
                      {renderCell(row, column.key, index)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            {rows.map((row, index) => (
              <article
                key={getRowKey(row, index)}
                className="clipped-edge border border-brand-gold/20 bg-black/20 p-3"
              >
                {renderMobile ? (
                  renderMobile(row, index)
                ) : (
                  <div className="space-y-2">
                    {columns.map((column) => (
                      <div
                        key={column.key}
                        className="flex items-start justify-between gap-3 border-b border-white/10 pb-1 last:border-b-0"
                      >
                        <span className="text-[11px] uppercase tracking-[0.16em] text-brand-gold/80">
                          {column.label}
                        </span>
                        <span className="text-right text-sm text-white">
                          {renderCell(row, column.key, index)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </HudSection>
  );
}
