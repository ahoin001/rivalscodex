import { z } from "zod";

/**
 * Storage decision:
 * - Near-term: Supabase-backed editorial JSON (`hero_editorial.content.heroGuideTabs`)
 * - Future: CMS can write into the same normalized shape.
 */
export const HERO_GUIDE_CONTENT_STRATEGY = "supabase-editorial-v1" as const;

export const HERO_GUIDE_TAB_ORDER = [
  "overview",
  "abilities",
  "combos",
  "playstyle",
  "resources",
  "notes",
] as const;

export const heroGuideTabIdSchema = z.enum(HERO_GUIDE_TAB_ORDER);

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
    condition: z.string().trim().max(500).optional(),
    clip: heroGuideClipSchema.optional(),
  }),
  z.object({
    type: z.literal("matchup"),
    disposition: z.enum(["target", "threat"]),
    opponent: z.string().trim().min(1).max(80),
    summary: z.string().trim().min(1).max(800),
    clip: heroGuideClipSchema.optional(),
  }),
  z.object({
    type: z.literal("video"),
    title: z.string().trim().min(1).max(160),
    watchUrl: z.string().trim().url(),
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
