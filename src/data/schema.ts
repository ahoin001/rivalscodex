import { z } from "zod";

export const heroRoleSchema = z.enum(["Vanguard", "Duelist", "Strategist"]);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/**
 * Web-relative image path served by Next.js from /public. Hero assets are
 * imported into `/rivals-assets/heros/<slug>/...` and referenced exclusively
 * by web path — there is no more build-time static-import overlay.
 */
const localHeroImageSchema = z
  .string()
  .regex(/^\/rivals-assets\/[\w./-]+\.(webp|png|jpg|jpeg|gif|svg)$/i);
const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

const abilityStatSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const abilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  keybind: z.string(),
  type: z.string(),
  description: z.string(),
  damage: z.string().optional(),
  cooldownSeconds: z.number().nonnegative().optional(),
  videoUrl: z.string().url().optional(),
  /** Site grouping (e.g. "Normal Attack", "Abilities", "Team-Up Abilities", "Passive"). */
  category: z.string().optional(),
  /** Web-relative path or absolute URL to ability art (e.g. `/rivals-assets/heros/<slug>/icons/<ability>.png`). */
  iconUrl: z.string().optional(),
  /** Web-relative path or absolute URL to the shared keybind icon (e.g. `/rivals-assets/icons/LMB-icon.png`). */
  keybindIconUrl: z.string().optional(),
  /** Ordered key/value stat rows captured from the site's detail panel. */
  stats: z.array(abilityStatSchema).optional(),
  /** Site's `<li data-type>` value; lets us match later detail captures back to the skeleton row. */
  siteOrder: z.number().int().optional(),
  /**
   * `data-type` on the parent `xt-wrap > a` tab for multi-form heroes (Magik,
   * Bruce Banner, Jeff, etc.). Same value across forms identifies shared
   * abilities (team-ups) so the runtime can de-dupe the tab switcher.
   */
  siteFormIndex: z.number().int().optional(),
});

export const comboModifierSchema = z.enum([
  "tap",
  "hold",
  "buffer",
  "animation-cancel",
  "dash-cancel",
  "jump-cancel",
  "melee-weave",
  "instant",
]);

export type ComboModifier = z.infer<typeof comboModifierSchema>;

export const comboStepSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ability"),
    abilityRef: z.string(),
    modifier: comboModifierSchema.optional(),
  }),
  z.object({
    kind: z.literal("action"),
    label: z.string().max(60),
    modifier: comboModifierSchema.optional(),
  }),
]);

export type ComboStep = z.infer<typeof comboStepSchema>;

export const comboDifficultySchema = z.enum([
  "bread-and-butter",
  "intermediate",
  "advanced",
  "team",
]);

export type ComboDifficulty = z.infer<typeof comboDifficultySchema>;

const comboResourceCostSchema = z.object({
  resourceName: z.string(),
  startingAmount: z.number(),
  perStepDelta: z.array(z.number()).optional(),
});

export type ComboResourceCost = z.infer<typeof comboResourceCostSchema>;

const comboSchema = z.object({
  id: z.string(),
  name: z.string(),
  steps: z.array(z.string()).min(1),
  structuredSteps: z.array(comboStepSchema).optional(),
  difficulty: comboDifficultySchema.optional(),
  resourceCost: comboResourceCostSchema.optional(),
  teamUp: z.string().optional(),
});

const synergySchema = z.object({
  hero: z.string(),
  reason: z.string(),
});

const externalResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(["youtube", "guide", "community"]),
});

const playstyleSchema = z.object({
  overview: z.string(),
  positioning: z.string(),
  targetPriority: z.array(z.string()).default([]),
  avoidPriority: z.array(z.string()).default([]),
});

const heroResourceSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const heroFormSchema = z.object({
  id: slugSchema,
  name: z.string(),
  shortLabel: z.string().optional(),
  trigger: z.string().optional(),
  role: heroRoleSchema.optional(),
  health: z.number().int().positive(),
  summary: z.string().optional(),
  resource: heroResourceSchema.optional(),
  portraitImage: localHeroImageSchema.optional(),
  splashImage: localHeroImageSchema.optional(),
  /** `data-type` value on the form's `xt-wrap > a` tab; mirrors what the official site uses. */
  siteFormIndex: z.number().int().optional(),
  /** Ordered key/value rows from the form's `.abilties-r.jcsx` Base Stats panel. */
  baseStatRows: z.array(abilityStatSchema).optional(),
  abilities: z.array(abilitySchema).min(1),
});

export const heroSchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  name: z.string(),
  /** Canonical civilian / secondary name from official site (optional). */
  realName: z.string().optional(),
  role: heroRoleSchema,
  difficulty: z.number().int().min(1).max(5),
  health: z.number().int().positive(),
  portraitImage: localHeroImageSchema,
  splashImage: localHeroImageSchema,
  /** Optional gold-frame overlay used by the hero detail showcase. */
  frameImage: localHeroImageSchema.optional(),
  /** Optional wide stack-logo wordmark used in the abilities + guide headers. */
  stackLogoImage: localHeroImageSchema.optional(),
  summary: z.string(),
  resource: heroResourceSchema.optional(),
  abilities: z.array(abilitySchema).min(1),
  combos: z.array(comboSchema).default([]),
  synergies: z.array(synergySchema).default([]),
  playstyle: playstyleSchema,
  externalResources: z.array(externalResourceSchema).default([]),
  /** Verbatim label/value rows from the official site Base Stats panel (marvelrivals.com). */
  baseStatRows: z.array(abilityStatSchema).optional(),
  forms: z.array(heroFormSchema).min(1).optional(),
  defaultFormId: slugSchema.optional(),
  updatedAt: isoDateSchema,
}).superRefine((hero, context) => {
  if (!hero.forms || hero.forms.length === 0) {
    // Single-form heroes can carry a `defaultFormId` hint pointing at the
    // synthetic 'base' row in `hero_form`. We don't validate it against
    // `forms` because that array is intentionally absent for these rows —
    // the runtime read path collapses them into a single-form view.
    return;
  }

  if (!hero.defaultFormId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "defaultFormId is required when forms[] is non-empty.",
      path: ["defaultFormId"],
    });
    return;
  }

  const hasDefaultForm = hero.forms.some((form) => form.id === hero.defaultFormId);
  if (!hasDefaultForm) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "defaultFormId must match one of the provided form ids.",
      path: ["defaultFormId"],
    });
  }
});

export const heroesSchema = z.array(heroSchema).min(1);

export type HeroRole = z.infer<typeof heroRoleSchema>;
export type Hero = z.infer<typeof heroSchema>;
export type HeroForm = z.infer<typeof heroFormSchema>;
export type HeroAbility = Hero["abilities"][number];
export type HeroAbilityStat = z.infer<typeof abilityStatSchema>;
export type HeroCombo = Hero["combos"][number];
export type HeroExternalResource = Hero["externalResources"][number];
