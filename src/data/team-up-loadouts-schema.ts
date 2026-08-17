import { z } from "zod";
import { heroRoleSchema } from "./schema";

const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

export const teamUpLoadoutEntrySchema = z.object({
  ownerSlug: slugSchema,
  ownerName: z.string().min(1),
  ownerRole: heroRoleSchema,
  name: z.string().min(1).max(120),
  partnerSlug: slugSchema,
  partnerName: z.string().min(1),
  baseEffect: z.string().min(1).max(1200),
  enhancedEffect: z.string().min(1).max(1200),
  keybind: z.string().max(24).optional(),
  iconUrl: z.string().optional(),
  stats: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  sources: z.array(z.string().url()).min(1).max(8),
});

export const teamUpLoadoutCatalogSchema = z.object({
  season: z.string().min(1),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  loadouts: z.array(teamUpLoadoutEntrySchema).min(1),
});

export type TeamUpLoadoutEntry = z.infer<typeof teamUpLoadoutEntrySchema>;
export type TeamUpLoadoutCatalog = z.infer<typeof teamUpLoadoutCatalogSchema>;
