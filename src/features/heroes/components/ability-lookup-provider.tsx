"use client";

import { type ReactNode, useMemo } from "react";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";

type AbilityLookupProviderProps = {
  entries: [string, ResolvedAbilityRef][];
  children: (lookup: Map<string, ResolvedAbilityRef>) => ReactNode;
};

/**
 * Maps can't cross the server→client boundary. This thin wrapper
 * accepts serializable [slug, ref][] entries from a server component
 * and hands the reconstituted Map to its render-prop children.
 */
export function AbilityLookupProvider({
  entries,
  children,
}: AbilityLookupProviderProps) {
  const lookup = useMemo(() => new Map(entries), [entries]);
  return <>{children(lookup)}</>;
}
