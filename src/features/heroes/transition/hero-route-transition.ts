export type HeroRouteTransitionPayload = {
  slug: string;
  name: string;
  portraitImage: string;
  role: "Vanguard" | "Duelist" | "Strategist";
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  createdAt: number;
};

const HERO_ROUTE_TRANSITION_KEY = "rivalscodex.route-transition.v1";
const HERO_ROUTE_TRANSITION_MAX_AGE_MS = 2500;

export function saveHeroRouteTransition(
  payload: Omit<HeroRouteTransitionPayload, "createdAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    const withTimestamp: HeroRouteTransitionPayload = {
      ...payload,
      createdAt: Date.now(),
    };
    window.sessionStorage.setItem(
      HERO_ROUTE_TRANSITION_KEY,
      JSON.stringify(withTimestamp),
    );
  } catch {
    // Ignore storage failures; transition gracefully falls back.
  }
}

export function consumeHeroRouteTransitionForSlug(
  slug: string,
): HeroRouteTransitionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(HERO_ROUTE_TRANSITION_KEY);
    window.sessionStorage.removeItem(HERO_ROUTE_TRANSITION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as HeroRouteTransitionPayload;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.slug !== slug) return null;
    if (Date.now() - parsed.createdAt > HERO_ROUTE_TRANSITION_MAX_AGE_MS) {
      return null;
    }
    if (
      typeof parsed.rect?.left !== "number" ||
      typeof parsed.rect?.top !== "number" ||
      typeof parsed.rect?.width !== "number" ||
      typeof parsed.rect?.height !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
