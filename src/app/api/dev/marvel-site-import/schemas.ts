import { z } from "zod";

export const abilityDetailStatInputSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});

export const abilityInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  keybind: z.string().optional(),
  keybindText: z.string().optional(),
  keybindIconUrl: z.string().url().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  siteOrder: z.number().int().optional().nullable(),
  siteFormIndex: z.number().int().optional().nullable(),
  description: z.string().optional(),
  stats: z.array(abilityDetailStatInputSchema).optional(),
  partnerName: z.string().optional(),
  partnerIndex: z.number().int().optional().nullable(),
});

export const heroImageUrlsSchema = z
  .object({
    frame: z.string().optional(),
    heroImage: z.string().optional(),
    stackLogo: z.string().optional(),
  })
  .default({});

export const baseStatRowInputSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});

export const formInputSchema = z.object({
  formId: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  shortLabel: z.string().optional(),
  siteFormIndex: z.number().int(),
  isDefault: z.boolean(),
  portraitUrl: z.string().url().optional().nullable(),
  baseStatRows: z.array(baseStatRowInputSchema).optional(),
  abilities: z.array(abilityInputSchema).default([]),
});

export const applySkeletonBodySchema = z
  .object({
    action: z.literal("apply-skeleton"),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    role: z.enum(["Vanguard", "Duelist", "Strategist"]),
    name: z.string().min(1),
    realName: z.string().optional(),
    summary: z.string().min(1),
    downloadAssets: z.boolean().optional().default(true),
    forceRefreshAssets: z.boolean().optional().default(false),
    urls: heroImageUrlsSchema,
    abilities: z.array(abilityInputSchema).default([]),
    baseStatRows: z.array(baseStatRowInputSchema).optional(),
    forms: z.array(formInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.downloadAssets) return;
    const entries: [string, string | undefined][] = [
      ["frame", data.urls.frame],
      ["heroImage", data.urls.heroImage],
      ["stackLogo", data.urls.stackLogo],
    ];
    for (const [key, value] of entries) {
      if (!value?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `urls.${key} is required when downloadAssets is true.`,
          path: ["urls", key],
        });
        continue;
      }
      try {
        void new URL(value);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid URL.",
          path: ["urls", key],
        });
      }
    }

    if (data.forms && data.forms.length > 0) {
      const defaults = data.forms.filter((form) => form.isDefault);
      if (defaults.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `forms[] must include exactly one entry with isDefault: true (got ${defaults.length}).`,
          path: ["forms"],
        });
      }
      const seenIds = new Set<string>();
      for (let i = 0; i < data.forms.length; i++) {
        const form = data.forms[i];
        if (seenIds.has(form.formId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `forms[${i}].formId "${form.formId}" is duplicated.`,
            path: ["forms", i, "formId"],
          });
        }
        seenIds.add(form.formId);
        if (form.abilities.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `forms[${i}] ("${form.label}") has no abilities — paste required.`,
            path: ["forms", i, "abilities"],
          });
        }
      }
    }
  });

export const applyAbilityDetailBodySchema = z.object({
  action: z.literal("apply-ability-detail"),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  abilityName: z.string().min(1),
  description: z.string().optional(),
  stats: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string(),
      }),
    )
    .default([]),
});

export const requestBodySchema = z.discriminatedUnion("action", [
  applySkeletonBodySchema,
  applyAbilityDetailBodySchema,
]);

export type AbilityInput = z.infer<typeof abilityInputSchema>;
export type ApplySkeletonBody = z.infer<typeof applySkeletonBodySchema>;
export type ApplyAbilityDetailBody = z.infer<typeof applyAbilityDetailBodySchema>;
