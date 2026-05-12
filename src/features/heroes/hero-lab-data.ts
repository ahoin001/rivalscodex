import type { Hero } from "@/data/schema";
import type { HeroGuideBlock, HeroGuideTabContent } from "@/features/heroes/hero-guide-schema";
import { getResolvedHeroForms } from "@/features/heroes/hero-forms";
import type { ExternalHero } from "@/lib/api/marvel-rivals";

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function mapHeroToExternalHero(hero: Hero): ExternalHero {
  const forms = getResolvedHeroForms(hero);
  return {
    id: hero.id,
    slug: hero.slug,
    name: hero.name,
    role: hero.role,
    summary: hero.summary,
    portraitImageUrl: hero.portraitImage,
    splashImageUrl: hero.splashImage,
    abilities: hero.abilities.map((ability) => ({
      name: ability.name,
      keybind: ability.keybind,
      type: ability.type,
      description: ability.description,
      damage: ability.damage,
      cooldownSeconds: ability.cooldownSeconds,
      iconUrl: ability.iconUrl ?? ability.videoUrl,
      category: ability.category,
      keybindIconUrl: ability.keybindIconUrl,
      stats: ability.stats,
      transformationId: ability.siteFormIndex !== undefined
        ? hero.forms?.find((f) => f.siteFormIndex === ability.siteFormIndex)?.id
        : undefined,
    })),
    transformations: forms.map((form) => ({
      id: form.id,
      name: form.shortLabel ?? form.name,
      iconUrl: form.portraitImage,
      health: String(form.health),
      movementSpeed: "6m/s",
    })),
  };
}

function buildCombosPrimary(hero: Hero): string[] {
  if (hero.combos.length > 0) {
    return hero.combos.slice(0, 4).map((combo) => {
      const firstStep = combo.steps[0] ?? "Open with your core ability chain.";
      return `${titleCase(combo.name)}: ${firstStep}`;
    });
  }

  return [
    "Open fights with your safest poke tool before hard committing cooldowns.",
    "Pair your displacement or control skill with ally burst windows.",
    "Rotate out after each high-value cast to preserve uptime.",
  ];
}

function buildSynergyPrimary(hero: Hero): string[] {
  if (hero.synergies.length > 0) {
    return hero.synergies.slice(0, 4).map((entry) => `${entry.hero}: ${entry.reason}`);
  }
  return [
    "Coordinate with your team on focus targets before each engage.",
    "Save one cooldown for peel when enemy dive pressure rises.",
    "Use objective timing to force favorable cooldown trades.",
  ];
}

function buildResourcePrimary(hero: Hero): string[] {
  if (hero.externalResources.length > 0) {
    return hero.externalResources.slice(0, 4).map((item) => item.title);
  }
  return [
    "Use API-synced hero data as baseline truth for ability specifics.",
    "Review one recent VOD and capture two repeatable decisions.",
    "Refresh your notes every patch to prevent stale habits.",
  ];
}

function buildCombosBody(hero: Hero): HeroGuideBlock[] | undefined {
  if (hero.combos.length === 0) {
    return undefined;
  }

  const comboBlocks: HeroGuideBlock[] = hero.combos.slice(0, 10).map((combo) => {
    const block: HeroGuideBlock = {
      type: "combo",
      name: titleCase(combo.name),
      steps: combo.steps,
    };
    if (combo.teamUp) {
      return { ...block, condition: `Team-Up: ${combo.teamUp}` };
    }
    return block;
  });

  if (hero.synergies.length > 0) {
    comboBlocks.push({
      type: "twoColumn",
      leftTitle: "Ally synergies",
      leftItems: hero.synergies.slice(0, 8).map((s) => `${s.hero}: ${s.reason}`),
      rightTitle: "Teamfight execution cues",
      rightItems: buildSynergyPrimary(hero).slice(0, 4),
    });
  }

  return comboBlocks;
}

function buildPlaystyleBody(hero: Hero): HeroGuideBlock[] {
  const blocks: HeroGuideBlock[] = [
    {
      type: "callout",
      variant: "gameplan",
      title: "Positioning anchor",
      body:
        hero.playstyle.positioning.trim() ||
        hero.playstyle.overview ||
        `Anchor ${hero.name} with clear sightlines and an escape plan every fight.`,
    },
  ];

  const targets = hero.playstyle.targetPriority;
  const avoids = hero.playstyle.avoidPriority;

  if (targets.length >= 1 && avoids.length >= 1) {
    blocks.push({
      type: "twoColumn",
      leftTitle: "High-value targets",
      leftItems: targets.slice(0, 8),
      rightTitle: "Threats to respect",
      rightItems: avoids.slice(0, 8),
    });
  } else if (targets.length >= 1) {
    blocks.push({
      type: "bullets",
      title: "High-value targets",
      items: targets.slice(0, 10),
    });
  } else if (avoids.length >= 1) {
    blocks.push({
      type: "bullets",
      title: "Threats to respect",
      items: avoids.slice(0, 10),
    });
  }

  return blocks;
}

export function buildHeroGuideTabsFromHero(hero: Hero): HeroGuideTabContent[] {
  const externalLinks = hero.externalResources
    .slice(0, 8)
    .map((resource) => ({ label: resource.title, href: resource.url }));

  const combosBody = buildCombosBody(hero);
  const playstyleBody = buildPlaystyleBody(hero);

  return [
    {
      id: "overview",
      label: "Overview",
      summary: `${hero.name} · ${hero.role} · Difficulty ${hero.difficulty}/5`,
      body: [
        {
          type: "callout",
          variant: "gameplan",
          title: "At a glance",
          body: hero.summary,
        },
        {
          type: "bullets",
          title: "Before you queue",
          items: [
            `${hero.playstyle.overview.length > 320 ? `${hero.playstyle.overview.slice(0, 320)}…` : hero.playstyle.overview}`,
            "Use Abilities for raw tooltips; use Combos and Playstyle for how to deploy the kit in matches.",
            "Editors can attach short YouTube clips to combo rows in the admin guide for motion-heavy sequences.",
          ],
        },
      ],
    },
    {
      id: "abilities",
      label: "Abilities",
      summary: hero.summary,
      primaryPoints:
        hero.abilities.length > 0
          ? hero.abilities.slice(0, 5).map((ability) => {
              const key = ability.keybind ? `${ability.keybind} - ` : "";
              return `${key}${ability.name}: ${ability.description}`;
            })
          : [
              "No detailed ability breakdown is available yet; rely on baseline API descriptors.",
            ],
      secondaryPoints: [
        `Role focus: ${hero.role}`,
        `Difficulty: ${hero.difficulty}/5`,
      ],
    },
    {
      id: "combos",
      label: "Combos & Synergies",
      summary:
        "Use curated opener chains and team-up timing to secure reliable fight conversions.",
      ...(combosBody
        ? { body: combosBody }
        : {
            primaryPoints: buildCombosPrimary(hero),
            secondaryPoints: buildSynergyPrimary(hero).slice(0, 3),
          }),
    },
    {
      id: "playstyle",
      label: "Playstyle Guide",
      summary: hero.playstyle.overview,
      body: playstyleBody,
    },
    {
      id: "resources",
      label: "Resources",
      summary:
        "Reference videos, patch-aware notes, and tactical sources for continuing hero mastery.",
      primaryPoints: buildResourcePrimary(hero),
      secondaryPoints: [
        "Cross-check major build or strategy shifts each patch.",
        "Capture your own short post-match notes to reinforce execution.",
      ],
      links: externalLinks.length > 0 ? externalLinks : undefined,
    },
    {
      id: "notes",
      label: "Personal Notes",
      summary:
        "Maintain player-specific reminders for matchup prep, consistency checks, and post-game review.",
      primaryPoints: [
        "Write a short pre-match plan before queue pop.",
        "Track two mistakes and one win condition after each game.",
        "Keep note entries concise enough to scan quickly.",
      ],
      secondaryPoints: [
        "Retire outdated notes after balance updates.",
        "Translate notes into simple in-game callouts.",
      ],
    },
  ];
}
