import { ExternalHero } from "@/lib/api/marvel-rivals";
import { LunaAbility, LunaAbilityCategory } from "@/features/heroes/components/luna-abilities-section";
import type { HeroGuideTabContent as LunaHeroGuideTabContent } from "@/features/heroes/hero-guide-schema";

const LUNA_ABILITY_CATEGORY_BY_KEY: Array<{
  match: (key: string, name: string) => boolean;
  category: LunaAbilityCategory;
}> = [
  {
    match: (key) => key === "left click" || key === "lmb" || key === "right click" || key === "rmb",
    category: "Normal Attack",
  },
  {
    match: (_key, name) =>
      ["cryo heart", "smooth skate", "number one idol"].includes(name.toLowerCase()),
    category: "Passive",
  },
];

function inferCategory(rawKey: string | undefined, name: string): LunaAbilityCategory {
  const key = (rawKey ?? "").trim().toLowerCase();
  for (const rule of LUNA_ABILITY_CATEGORY_BY_KEY) {
    if (rule.match(key, name)) {
      return rule.category;
    }
  }
  return "Abilities";
}

function toKeyLabel(rawKey: string | undefined, name: string): string {
  const key = (rawKey ?? "").trim().toLowerCase();
  if (!key) {
    return inferCategory(rawKey, name) === "Passive" ? "PASSIVE" : "—";
  }
  if (key.includes("left click")) return "LMB";
  if (key.includes("right click")) return "RMB";
  if (key === "shift") return "SHIFT";
  if (["q", "e", "f", "c", "v"].includes(key)) return key.toUpperCase();
  if (key === "passive") return "PASSIVE";
  return rawKey?.toUpperCase() ?? "—";
}

export function buildLunaAbilitiesFromHero(hero: ExternalHero | null | undefined): LunaAbility[] {
  if (!hero?.abilities || hero.abilities.length === 0) {
    return LUNA_FALLBACK_ABILITIES;
  }

  const seen = new Set<string>();

  const abilities = hero.abilities
    .filter((ability) => {
      const dedupeKey = ability.name.trim().toLowerCase();
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    })
    .map((ability) => {
      const stats: LunaAbility["stats"] = [];
      if (ability.keybind) stats.push({ label: "Key", value: ability.keybind.toUpperCase() });
      if (ability.type) stats.push({ label: "Type", value: ability.type });
      if (ability.damage) stats.push({ label: "Damage", value: ability.damage });
      if (ability.cooldownSeconds && ability.cooldownSeconds > 0) {
        stats.push({ label: "Cooldown", value: `${ability.cooldownSeconds}s` });
      }
      if (ability.additionalFields) {
        for (const [label, value] of Object.entries(ability.additionalFields)) {
          if (!value || value.trim().length === 0) continue;
          if (label.toLowerCase() === "key" || label.toLowerCase() === "hotkey") continue;
          stats.push({ label, value });
        }
      }

      return {
        id: `${ability.name}-${ability.keybind ?? "passive"}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
        name: ability.name,
        keyLabel: toKeyLabel(ability.keybind, ability.name),
        category: inferCategory(ability.keybind, ability.name),
        description:
          ability.description ?? "No description available for this ability yet.",
        stats: stats.length > 0 ? stats : [{ label: "Type", value: ability.type ?? "Ability" }],
      } satisfies LunaAbility;
    });

  return abilities.length > 0 ? abilities : LUNA_FALLBACK_ABILITIES;
}

export const LUNA_FALLBACK_ABILITIES: LunaAbility[] = [
  {
    id: "light-and-dark-ice",
    name: "Light & Dark Ice",
    keyLabel: "LMB",
    category: "Normal Attack",
    description:
      "Fire alternating beams of light and dark ice that damage enemies or heal allies.",
    stats: [
      { label: "Key", value: "LMB" },
      { label: "Casting", value: "Hold to fire continuously" },
      { label: "Healing", value: "Switches when targeting allies" },
      { label: "Range", value: "Up to 30m" },
    ],
  },
  {
    id: "fate-of-both-worlds",
    name: "Fate of Both Worlds",
    keyLabel: "Q",
    category: "Abilities",
    description:
      "Unleash a finale that empowers allies in range with massive sustained healing or damage.",
    stats: [
      { label: "Key", value: "Q" },
      { label: "Casting", value: "Channeled aura around Luna" },
      { label: "Duration", value: "12s" },
      { label: "Special Effect", value: "Empowers allied damage and healing" },
    ],
  },
  {
    id: "ice-arts",
    name: "Ice Arts",
    keyLabel: "SHIFT",
    category: "Abilities",
    description:
      "Fire ice shards for a short duration, damaging enemies or healing allies while restoring her own Health.",
    stats: [
      { label: "Key", value: "SHIFT" },
      { label: "Casting", value: "Single-cast spell field that pierces through enemies" },
      { label: "Special Effect", value: "Replace the previous Light & Dark Ice cast" },
      { label: "Damage", value: "50 damage per round" },
      { label: "Healing Amount", value: "75 health per round" },
      { label: "Range", value: "A cylindrical spell field with a radius of 1m and a height of 40m" },
      { label: "Fire Rate", value: "1.43 rounds per second" },
      { label: "Duration", value: "6s" },
    ],
  },
  {
    id: "share-the-stage",
    name: "Share the Stage",
    keyLabel: "E",
    category: "Abilities",
    description:
      "Boost a designated ally with a powerful melody, increasing their performance for a short duration.",
    stats: [
      { label: "Key", value: "E" },
      { label: "Casting", value: "Targeted ally buff" },
      { label: "Duration", value: "12s" },
      { label: "Cooldown", value: "20s" },
    ],
  },
  {
    id: "absolute-zero",
    name: "Absolute Zero",
    keyLabel: "RMB",
    category: "Abilities",
    description: "Throw a frostbomb that detonates and freezes any enemy caught in the area.",
    stats: [
      { label: "Key", value: "RMB" },
      { label: "Casting", value: "Projectile" },
      { label: "Special Effect", value: "Freezes enemies on impact" },
      { label: "Cooldown", value: "12s" },
    ],
  },
  {
    id: "cryo-heart",
    name: "Cryo Heart",
    keyLabel: "PASSIVE",
    category: "Passive",
    description:
      "Generates a thin frost shield while standing still that absorbs incoming damage.",
    stats: [
      { label: "Type", value: "Passive" },
      { label: "Special Effect", value: "Personal frost shield" },
    ],
  },
  {
    id: "smooth-skate",
    name: "Smooth Skate",
    keyLabel: "PASSIVE",
    category: "Passive",
    description:
      "Glide across surfaces with ice-skating mobility, increasing movement speed in combat.",
    stats: [
      { label: "Type", value: "Passive" },
      { label: "Movement Speed", value: "+2m/s while skating" },
    ],
  },
  {
    id: "number-one-idol",
    name: "Number One Idol",
    keyLabel: "F",
    category: "Passive",
    description:
      "Team-up upgrade. Activates a duet performance that empowers Luna and her partner.",
    stats: [
      { label: "Type", value: "Team-Up Passive" },
      { label: "Special Effect", value: "Empowers a partnered ally" },
    ],
  },
];

export const LUNA_BASE_STATS: Array<{ label: string; value: string }> = [
  { label: "Health", value: "250" },
  { label: "Movement Speed", value: "6m/s" },
  { label: "Role", value: "Strategist" },
  { label: "Difficulty", value: "3 / 5" },
];

export const LUNA_HERO_GUIDE_TABS: LunaHeroGuideTabContent[] = [
  {
    id: "overview",
    label: "Overview & Playstyle",
    summary: "Luna Snow · Strategist · Difficulty 3 / 5",
    body: [
      {
        type: "strengthsWeaknesses",
        strengths: [
          {
            title: "Reliable AoE tempo control with Ice Arts",
            detail:
              "Ice Arts creates recurring space denial through chokes and payload lanes. When paired with Smooth Skate repositioning, Luna can pulse damage and healing without hard-committing to duels.",
          },
          {
            title: "Fight-winning burst setup via Absolute Zero",
            detail:
              "Absolute Zero converts slow or cornered targets into guaranteed focus windows. Call the follow-up hero before throwing so your team layers burst the instant freeze confirms.",
          },
          {
            title: "Carry amplification with Share the Stage",
            detail:
              "Share the Stage lets Luna delegate damage spikes to a duelist or hitscan who already has angle. Rotate the buff target when their cooldowns spike or they lose line-of-sight.",
          },
        ],
        weaknesses: [
          {
            title: "Punished by long-range hitscan angles",
            detail:
              "Luna wins on controlled sightlines. Open high-ground snipers force awkward skating routes and can delete her before she completes a freeze confirm.",
          },
          {
            title: "Ultimate-dependent peel windows",
            detail:
              "When Absolute Zero or Fate of Both Worlds are down, Luna relies on team spacing. Dive tanks that body-block angles can stall her tempo until cooldowns return.",
          },
          {
            title: "Low solo kill pressure without coordination",
            detail:
              "Most of Luna's value is setup, not finish. Without a called focus target or follow-up burst, she can lose extended trades against self-sufficient duelists.",
          },
        ],
      },
      {
        type: "callout",
        variant: "gameplan",
        title: "Win condition",
        body: "Control tempo with Ice Arts pulses, amplify one decisive carry with Share the Stage, and convert freezes into coordinated burst so the team snowballs objectives.",
      },
      {
        type: "callout",
        variant: "macro",
        title: "Default posture",
        body: "Stay just behind your frontline with skating exits queued. Prioritize denying flank angles with Ice Arts before committing damage, then reset cover after burst sequences to keep your healing economy intact.",
      },
      {
        type: "twoColumn",
        leftTitle: "High-value targets",
        leftItems: [
          "Isolated duelists overextended without peel.",
          "Supports channeling ults without reposition options.",
        ],
        rightTitle: "Threats to respect",
        rightItems: [
          "Long-range snipers that collapse your LOS pockets.",
          "Dive tanks that can body-block Absolute Zero angles.",
        ],
      },
      {
        type: "bullets",
        title: "60-second checklist",
        items: [
          "Pre-skate to the next angle before the fight starts; do not skate in reaction to surprise flank audio.",
          "Pick one damage buddy for Share the Stage each fight—rotate the target when their cooldowns spike.",
          "Bank Absolute Zero for peel or confirmed follow-up, not for solo poke damage.",
        ],
      },
    ],
  },
  {
    id: "abilities",
    label: "Kit & Mechanics",
    summary:
      "Anchor your fight on Ice Arts pulses, then use Share the Stage to amplify a damage carry whenever the team needs to snowball.",
    body: [
      {
        type: "abilityTip",
        abilityRef: "absolute-zero",
        title: "Freeze confirm discipline",
        body: "Use Absolute Zero after enemy mobility is committed. Call your focus target before throwing so your team layers burst the instant freeze lands.",
        tags: ["confirm", "teamplay"],
      },
      {
        type: "abilityTip",
        abilityRef: "ice-arts",
        title: "Tempo reset pattern",
        body: "Pulse Ice Arts through choke lanes, then immediately reposition to cover with Smooth Skate. This keeps pressure high without overexposing your support angle.",
        tags: ["positioning", "tempo"],
      },
      {
        type: "abilityTip",
        abilityRef: "share-the-stage",
        title: "Carry rotation logic",
        body: "Choose one carry for Share the Stage per fight. Rotate only when that carry spends burst cooldowns or loses line-of-sight.",
        tags: ["targeting", "macro"],
      },
    ],
  },
  {
    id: "combos",
    label: "Combos",
    summary:
      "Convert displacement and freeze windows into reliable burst with allies who excel at decisive follow-up.",
    body: [
      {
        type: "combo",
        name: "Absolute Zero → focus fire",
        steps: [
          "Throw Absolute Zero on a slowed or cornered target.",
          "Call the hero name you want to layer burst with.",
          "Layer Fate of Both Worlds or a duelist dive once the freeze confirms.",
        ],
        condition: "Best when enemy mobility cooldowns are already spent.",
      },
      {
        type: "combo",
        name: "Ice Arts → space denial",
        steps: [
          "Pulse Ice Arts through choke or payload corridor.",
          "Swap Light & Dark taps to heal chip while keeping pressure.",
          "Skate reset behind cover before the enemy line advances.",
        ],
      },
      {
        type: "twoColumn",
        leftTitle: "Synergy spikes",
        leftItems: [
          "Iron Man / Black Widow: Absolute Zero into instant burst windows.",
          "Dive duelists: Share the Stage during backline overload attempts.",
        ],
        rightTitle: "Ult cadence",
        rightItems: [
          "Stagger Fate of Both Worlds with another major ult for longer pressure.",
          "Avoid stacking every ult on the same 2-second window unless it is a forced end.",
        ],
      },
    ],
  },
  {
    id: "matchups",
    label: "Matchups",
    summary:
      "Quickly scan favorable, even, and dangerous opponents before queueing.",
    body: [
      {
        type: "matchup",
        disposition: "target",
        opponent: "Flank duelists",
        summary:
          "Track their mobility cooldowns; when empty, Absolute Zero plus a called burst window deletes their tempo.",
      },
      {
        type: "matchup",
        disposition: "even",
        opponent: "Brawl tanks",
        summary:
          "This is execution-sensitive. Keep line-of-sight discipline and save one peel cooldown for their second engage wave.",
      },
      {
        type: "matchup",
        disposition: "threat",
        opponent: "High-ground hitscan",
        summary:
          "Do not ego-skate into open sightlines. Approach from vertical cover or force them to reposition before committing Fate.",
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    summary:
      "Curated guide stack: short-form mechanics drills, structured matchup notes, and macro VOD references.",
    primaryPoints: [
      "Bookmark concise mechanics clips for warm-up consistency.",
      "Track 3 problematic matchups per patch with execution counter notes.",
      "Refresh resources after every balance update to avoid outdated tactics.",
    ],
    secondaryPoints: [
      "Prefer guides with explicit decision criteria, not just montage cuts.",
      "Review at least one high-rank Luna POV per session for macro reads.",
    ],
    links: [
      { label: "Marvel Rivals API", href: "https://marvelrivalsapi.com/" },
      { label: "Official Hero Page", href: "https://www.marvelrivals.com/heros/" },
    ],
  },
  {
    id: "notes",
    label: "Personal Notes",
    summary:
      "Player-managed reminders for this hero: comfort picks, anti-tilt rules, and execution cues per match.",
  },
];
