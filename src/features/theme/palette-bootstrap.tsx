"use client";

import { useLayoutEffect } from "react";
import { applyPaletteToDocument } from "@/features/theme/palette-constants";
import { getPaletteSnapshot } from "@/features/theme/palette-store";

/**
 * Applies stored palette on the client before paint (no inline <script> — React 19
 * rejects script tags in component trees and they caused html hydration mismatches).
 */
export function PaletteBootstrap() {
  useLayoutEffect(() => {
    applyPaletteToDocument(getPaletteSnapshot());
  }, []);

  return null;
}
