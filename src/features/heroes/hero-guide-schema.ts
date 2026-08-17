import { z } from "zod";

import {
  comboStepSchema,
  comboDifficultySchema,
} from "@/data/schema";

/**
 * Storage decision:
 * - Near-term: Supabase-backed editorial JSON (`hero_editorial.content.heroGuideTabs`)
 * - Future: CMS can write into the same normalized shape.
 */
export const HERO_GUIDE_CONTENT_STRATEGY = "supabase-editorial-v1" as const;

export const HERO_GUIDE_TAB_ORDER = [
  "overview",
  "abilities",
  "loadouts",
  "combos",
  "matchups",
  "notes",
] as const;

export const HERO_GUIDE_LEGACY_TAB_IDS = ["resources"] as const;

export const heroGuideTabIdSchema = z.enum([
  ...HERO_GUIDE_TAB_ORDER,
  ...HERO_GUIDE_LEGACY_TAB_IDS,
]);

export type HeroGuideTabId = z.infer<typeof heroGuideTabIdSchema>;

export const heroGuideLinkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  href: z.string().trim().url(),
});

/** YouTube (or other) watch URL + short label for lazy embeds in the guide body. */
export const heroGuideClipSchema = z.object({
  label: z.string().trim().min(1).max(120),
  href: z.string().trim().url(),
});

export type HeroGuideClip = z.infer<typeof heroGuideClipSchema>;

export const heroGuideProConItemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  detail: z.string().trim().max(900).optional(),
});

export type HeroGuideProConItem = z.infer<typeof heroGuideProConItemSchema>;

export const heroGuideBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("callout"),
    variant: z.enum(["gameplan", "macro", "tip"]).optional(),
    title: z.string().trim().max(120).optional(),
    body: z.string().trim().min(1).max(2400),
  }),
  z.object({
    type: z.literal("bullets"),
    title: z.string().trim().max(120).optional(),
    items: z.array(z.string().trim().min(1).max(500)).min(1).max(16),
  }),
  z.object({
    type: z.literal("twoColumn"),
    leftTitle: z.string().trim().min(1).max(80),
    leftItems: z.array(z.string().trim().min(1).max(500)).min(1).max(12),
    rightTitle: z.string().trim().min(1).max(80),
    rightItems: z.array(z.string().trim().min(1).max(500)).min(1).max(12),
  }),
  z.object({
    type: z.literal("combo"),
    name: z.string().trim().min(1).max(120),
    steps: z.array(z.string().trim().min(1).max(400)).min(1).max(12),
    structuredSteps: z.array(comboStepSchema).optional(),
    difficulty: comboDifficultySchema.optional(),
    tags: z.array(z.string().trim().min(1).max(24)).max(4).optional(),
    notes: z.string().trim().max(800).optional(),
    resourceCost: z.object({
      resourceName: z.string().trim().min(1).max(60),
      startingAmount: z.number(),
      perStepDelta: z.array(z.number()).optional(),
    }).optional(),
    condition: z.string().trim().max(500).optional(),
    clip: heroGuideClipSchema.optional(),
  }),
  z.object({
    type: z.literal("abilityTip"),
    abilityRef: z.string().trim().min(1).max(120),
    title: z.string().trim().max(120).optional(),
    body: z.string().trim().min(1).max(1200),
    clip: heroGuideClipSchema.optional(),
    tags: z.array(z.string().trim().min(1).max(24)).max(4).optional(),
  }),
  z.object({
    type: z.literal("matchup"),
    disposition: z.enum(["target", "even", "threat"]),
    opponent: z.string().trim().min(1).max(80),
    summary: z.string().trim().min(1).max(800),
    clip: heroGuideClipSchema.optional(),
  }),
  z.object({
    type: z.literal("video"),
    title: z.string().trim().min(1).max(160),
    watchUrl: z.string().trim().url(),
    /** Short note above the embed — what this video helps with. */
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    type: z.literal("strengthsWeaknesses"),
    title: z.string().trim().max(120).optional(),
    strengths: z.array(heroGuideProConItemSchema).min(1).max(8),
    weaknesses: z.array(heroGuideProConItemSchema).min(1).max(8),
  }),
  z.object({
    type: z.literal("loadout"),
    name: z.string().trim().min(1).max(120),
    baseEffect: z.string().trim().min(1).max(1200),
    enhancedEffect: z.string().trim().max(1200).optional(),
    partnerSlug: z.string().trim().max(80).optional(),
    partnerName: z.string().trim().max(80).optional(),
    whenToPick: z.string().trim().max(500).optional(),
    soloQueueDefault: z.boolean().optional(),
  }),
]);

export type HeroGuideBlock = z.infer<typeof heroGuideBlockSchema>;

export const heroGuideTabContentSchema = z
  .object({
    id: heroGuideTabIdSchema,
    label: z.string().trim().min(1).max(80),
    summary: z.string().trim().min(1).max(2400),
    primaryPoints: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
    secondaryPoints: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
    links: z.array(heroGuideLinkSchema).max(12).optional(),
    body: z.array(heroGuideBlockSchema).max(32).optional(),
  })
  .superRefine((tab, ctx) => {
    if (
      tab.id === "notes" ||
      tab.id === "abilities" ||
      tab.id === "matchups" ||
      tab.id === "loadouts"
    ) {
      return;
    }
    const primaryLen = tab.primaryPoints?.length ?? 0;
    const bodyLen = tab.body?.length ?? 0;
    if (primaryLen < 1 && bodyLen < 1) {
      ctx.addIssue({
        code: "custom",
        message: `Tab "${tab.id}": add at least one priority cue or one structured body block.`,
        path: ["primaryPoints"],
      });
    }
  });

export type HeroGuideTabContent = z.infer<typeof heroGuideTabContentSchema>;

export const heroGuideTabsSchema = z
  .array(heroGuideTabContentSchema)
  .min(1)
  .max(20)
  .superRefine((tabs, ctx) => {
    const seen = new Set<string>();
    tabs.forEach((tab, index) => {
      if (seen.has(tab.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate tab id "${tab.id}" at index ${index}.`,
        });
      }
      seen.add(tab.id);
    });
  });
