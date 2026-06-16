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

function buildStrengthsWeaknessesBlock(hero: Hero): HeroGuideBlock {
  const overview = hero.playstyle.overview.trim();
  const positioning = hero.playstyle.positioning.trim();
  const detailFromPlaystyle = (topic: string) => {
    const source = positioning || overview;
    if (!source) return `How ${hero.name} leverages ${topic.toLowerCase()} in teamfights.`;
    return source.length > 900 ? `${source.slice(0, 897)}…` : source;
  };

  const strengths =
    hero.playstyle.targetPriority.length > 0
      ? hero.playstyle.targetPriority.slice(0, 4).map((title) => ({
          title,
          detail: detailFromPlaystyle(title),
        }))
      : [
          {
            title: `${hero.role} teamfight value`,
            detail: overview || `${hero.name} contributes through ${hero.role.toLowerCase()} positioning and cooldown timing.`,
          },
          {
            title: "Clear win-condition spikes",
            detail: detailFromPlaystyle("decisive fight windows"),
          },
        ];

  const weaknesses =
    hero.playstyle.avoidPriority.length > 0
      ? hero.playstyle.avoidPriority.slice(0, 4).map((title) => ({
          title,
          detail: `Respect this matchup angle — adjust spacing and save a defensive cooldown when ${title.toLowerCase()} is active.`,
        }))
      : [
          {
            title: "Cooldown downtime windows",
            detail:
              positioning ||
              "Between major abilities, avoid hard commits and play for reset angles instead of extended duels.",
          },
          {
            title: "Overextension without peel",
            detail: overview
              ? `When peel is missing, ${hero.name}'s plan breaks down quickly — track flank audio before pushing.`
              : "Track flank routes and avoid chasing kills without team confirmation.",
          },
        ];

  return {
    type: "strengthsWeaknesses",
    strengths,
    weaknesses,
  };
}

function buildOverviewPlaystyleBody(hero: Hero): HeroGuideBlock[] {
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
  const overviewPlaystyleBody = buildOverviewPlaystyleBody(hero);

  return [
    {
      id: "overview",
      label: "Overview & Playstyle",
      summary: `${hero.name} · ${hero.role} · Difficulty ${hero.difficulty}/5`,
      body: [
        buildStrengthsWeaknessesBlock(hero),
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
            "Use Kit & Mechanics for ability tech, then Combos for execution routes.",
            "Editors can attach short YouTube clips to combo rows in the admin guide for motion-heavy sequences.",
          ],
        },
        ...overviewPlaystyleBody,
      ],
    },
    {
      id: "abilities",
      label: "Kit & Mechanics",
      summary:
        "Review practical ability interactions, cancels, and usage cues. Full codex details are available above.",
      body: [],
    },
    {
      id: "combos",
      label: "Combos",
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
      id: "matchups",
      label: "Matchups",
      summary:
        "Track favorable, even, and dangerous matchups with short counterplay explanations.",
      body: [],
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
        "Player-specific reminders, queue prep, and post-match review notes are saved locally.",
    },
  ];
}
