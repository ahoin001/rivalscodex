"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import type { ResolvedAbilityRef } from "@/features/heroes/ability-lookup";

type AbilityLookupContextValue = Map<string, ResolvedAbilityRef>;

const AbilityLookupContext = createContext<AbilityLookupContextValue | null>(
  null,
);

type AbilityLookupProviderProps = {
  entries: [string, ResolvedAbilityRef][];
  children: ReactNode;
};

/**
 * Maps can't cross the server→client boundary. This thin wrapper
 * accepts serializable [slug, ref][] entries from a server component
 * and exposes the reconstituted Map via context.
 */
export function AbilityLookupProvider({
  entries,
  children,
}: AbilityLookupProviderProps) {
  const lookup = useMemo(() => new Map(entries), [entries]);

  return (
    <AbilityLookupContext.Provider value={lookup}>
      {children}
    </AbilityLookupContext.Provider>
  );
}

export function useAbilityLookup(): AbilityLookupContextValue {
  const lookup = useContext(AbilityLookupContext);
  if (!lookup) {
    throw new Error("useAbilityLookup must be used within AbilityLookupProvider");
  }
  return lookup;
}

/** Returns context lookup when inside a provider; otherwise undefined. */
export function useOptionalAbilityLookup(): AbilityLookupContextValue | undefined {
  return useContext(AbilityLookupContext) ?? undefined;
}
