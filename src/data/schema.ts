import { z } from "zod";

export const heroRoleSchema = z.enum(["Vanguard", "Duelist", "Strategist"]);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localHeroImageSchema = z.string().regex(/^\/heroes\/[\w-]+\.webp$/);
const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

const abilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  keybind: z.string(),
  type: z.string(),
  description: z.string(),
  damage: z.string().optional(),
  cooldownSeconds: z.number().nonnegative().optional(),
  videoUrl: z.string().url().optional(),
});

const comboSchema = z.object({
  id: z.string(),
  name: z.string(),
  steps: z.array(z.string()).min(1),
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
  abilities: z.array(abilitySchema).min(1),
});

export const heroSchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  name: z.string(),
  role: heroRoleSchema,
  difficulty: z.number().int().min(1).max(5),
  health: z.number().int().positive(),
  portraitImage: localHeroImageSchema,
  splashImage: localHeroImageSchema,
  summary: z.string(),
  resource: heroResourceSchema.optional(),
  abilities: z.array(abilitySchema).min(1),
  combos: z.array(comboSchema).default([]),
  synergies: z.array(synergySchema).default([]),
  playstyle: playstyleSchema,
  externalResources: z.array(externalResourceSchema).default([]),
  forms: z.array(heroFormSchema).min(1).optional(),
  defaultFormId: slugSchema.optional(),
  updatedAt: isoDateSchema,
}).superRefine((hero, context) => {
  if (!hero.forms || !hero.defaultFormId) {
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
export type HeroCombo = Hero["combos"][number];
export type HeroExternalResource = Hero["externalResources"][number];
