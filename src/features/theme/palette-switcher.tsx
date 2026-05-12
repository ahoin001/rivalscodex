"use client";

import {
  subscribePaletteStore,
  getPaletteSnapshot,
  persistAndApplyPalette,
} from "@/features/theme/palette-store";
import {
  applyPaletteToDocument,
  isPaletteId,
  PALETTE_OPTIONS,
  type PaletteId,
} from "@/features/theme/palette-constants";
import { useEffect, useSyncExternalStore, type ChangeEvent } from "react";

export function PaletteSwitcher() {
  const paletteId = useSyncExternalStore(
    subscribePaletteStore,
    getPaletteSnapshot,
    (): PaletteId => "default",
  );

  useEffect(() => {
    applyPaletteToDocument(paletteId);
  }, [paletteId]);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value;
    if (!isPaletteId(next)) {
      return;
    }

    persistAndApplyPalette(next);
  };

  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline">
        Palette
      </span>
      <select
        value={paletteId}
        onChange={handleChange}
        suppressHydrationWarning
        aria-label="Color palette"
        className="max-w-[9.5rem] cursor-pointer rounded border border-brand-gold/45 bg-panel/90 py-1.5 pl-2 pr-6 text-[11px] font-medium uppercase tracking-wide text-foreground shadow-sm outline-none backdrop-blur-sm focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/40 sm:max-w-[11rem] sm:text-xs"
      >
        {PALETTE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
