import { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { RivalsFeatureSection, RivalsPageShell, RivalsSectionHeader } from "@/components/ui";
import { BlackWidowAbilitiesSection } from "@/features/heroes/components/black-widow-abilities-section";
import { BlackWidowHeroCard } from "@/features/heroes/components/black-widow-hero-card";
import { HeroIntelConsole } from "@/features/heroes/components/hero-intel-console";
import { fetchMarvelRivalsHeroes } from "@/lib/api/marvel-rivals";
import { featureFlags } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Hero Card Lab",
  description:
    "Isolated playground for recreating Marvel Rivals hero card presentation and responsive behavior.",
};

const getCachedHeroes = cache(async () => fetchMarvelRivalsHeroes());

const blackWidowIntelContent = [
  {
    id: "abilities",
    label: "Abilities",
    summary:
      "Understand each cooldown in practical fight order: entry tools first, control second, and damage conversion last.",
    primaryPoints: [
      "Track SHIFT and E as primary tempo tools for safe engagement windows.",
      "Use ability sequencing to force enemy movement before committing damage.",
      "Anchor ult timing around forced movement and team follow-up.",
    ],
    secondaryPoints: [
      "Keep one defensive option available when scouting enemy flank paths.",
      "Prioritize consistency over max-risk highlight routes in ranked matches.",
    ],
    links: [],
  },
  {
    id: "combos",
    label: "Combos & Synergies",
    summary:
      "Convert short setup windows into reliable burst by chaining mobility, disruption, and precision follow-up.",
    primaryPoints: [
      "Open with displacement or movement denial, then convert with scoped burst.",
      "Call team focus targets before your second action to secure confirms.",
      "Use team-up cooldowns as explicit combo amplifiers, not random extras.",
    ],
    secondaryPoints: [
      "Plan one low-risk combo route for neutral fights and one commit route for decisive pushes.",
      "Avoid over-layering CC with teammates; stagger for longer total control.",
    ],
    links: [],
  },
  {
    id: "playstyle",
    label: "Playstyle Guide",
    summary:
      "Operate as a controlled skirmisher: gather info, create angle pressure, and punish isolated targets quickly.",
    primaryPoints: [
      "Maintain lateral off-angles instead of deep flanks when cooldowns are down.",
      "Reset to cover after every burst cycle to preserve health economy.",
      "Use positioning discipline to keep line-of-sight on your supports.",
    ],
    secondaryPoints: [
      "Start fights with information-first peeks before committing movement tools.",
      "Rotate early to objective lanes where your range profile has advantage.",
    ],
    links: [],
  },
  {
    id: "resources",
    label: "Resources",
    summary:
      "Treat learning material as a structured stack: mechanics drills, matchup reviews, then macro VODs.",
    primaryPoints: [
      "Save one short drill clip per key mechanic for warm-up consistency.",
      "Track matchup notes against top 3 problematic heroes each patch.",
      "Tag resources by patch so outdated guides are easy to retire.",
    ],
    secondaryPoints: [
      "Prefer concise resources that include decision criteria, not only montages.",
      "Review at least one high-rank POV after balance changes.",
    ],
    links: [
      {
        label: "Official Marvel Rivals API",
        href: "https://marvelrivalsapi.com/",
      },
    ],
  },
  {
    id: "notes",
    label: "Personal Notes",
    summary:
      "Store your own reminders for this hero: comfort picks, anti-tilt rules, and match-specific execution cues.",
    primaryPoints: [
      "Write one pre-fight checklist for consistency under pressure.",
      "Capture 2-3 mistakes after each session while memory is fresh.",
      "Record custom callout language your stack understands quickly.",
    ],
    secondaryPoints: [
      "Keep notes short enough to scan during queue downtime.",
      "Retire stale notes every patch to avoid outdated habits.",
    ],
    links: [],
  },
] as const;

export default async function HeroCardLabPage() {
  const heroes = await getCachedHeroes();
  const blackWidowHero =
    heroes.find(
      (hero) => hero.name.toLowerCase().replace(/[^a-z]/g, "") === "blackwidow",
    ) ??
    null;

  return (
    <RivalsPageShell className="space-y-8 py-7 lg:py-12">
      <RivalsSectionHeader
        eyebrow="Design Sandbox"
        title="Black Widow Hero Card Lab"
        description="Reference-faithful recreation area for hero framing, typography hierarchy, and responsive hero presentation."
      />

      <div>
        <Link
          href="/"
          className="inline-flex w-fit border border-brand-gold/45 bg-brand-gold-muted px-3 py-1 text-xs uppercase tracking-wide text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-[#10131e]"
        >
          Back To Home
        </Link>
      </div>

      <RivalsFeatureSection
        eyebrow="Isolated Area"
        title="Hero Presentation Prototype"
        description="This section intentionally focuses on the frame, hero prominence, and text composition while omitting right-side control widgets."
      >
        <BlackWidowHeroCard />
      </RivalsFeatureSection>

      <RivalsFeatureSection
        eyebrow="Ability Sandbox"
        title="Black Widow Abilities Prototype"
        description="API-fed abilities module inspired by the main Rivals layout, with hover detail states and cached endpoint data."
      >
        <BlackWidowAbilitiesSection hero={blackWidowHero} />
      </RivalsFeatureSection>

      <RivalsFeatureSection
        eyebrow="Hero Data Console"
        title="Premium Player Intel Surface"
        description="Reimagined high-signal reading area for quick hero mastery, with a built-in admin editing flow."
      >
        <HeroIntelConsole
          heroName="Black Widow"
          initialContent={[...blackWidowIntelContent]}
          allowAdminTools={featureFlags.enableDevAdminUi}
        />
      </RivalsFeatureSection>
    </RivalsPageShell>
  );
}
