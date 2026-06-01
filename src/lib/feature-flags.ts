import {
  guideEditPolicy,
  inlineGuideEditEnabled,
  isAdminGuideEdit,
  isPersonalGuideEdit,
} from "@/lib/guide-edit-policy";
import { isSupabaseEnabled } from "@/lib/supabase/env";

export const featureFlags = {
  guideEditPolicy: guideEditPolicy(),
  isPersonalGuideEdit: isPersonalGuideEdit(),
  isAdminGuideEdit: isAdminGuideEdit(),
  inlineGuideEditEnabled: inlineGuideEditEnabled(),
  enableExternalApis: process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_APIS === "true",
  preferApiContent: process.env.NEXT_PUBLIC_PREFER_API_CONTENT === "true",
  allowImageRecache: process.env.NEXT_PUBLIC_ALLOW_IMAGE_RECACHE === "true",
  enableDevAdminUi:
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_ADMIN_UI === "true",
  /** Curated hero copy from hub Supabase (`app_rivalscodex_v1.hero_editorial`, scope published). */
  enableSupabase: isSupabaseEnabled(),
  /** Prefer freshly-synced Postgres roster snapshot over live Marvel Rivals HTTP on each request (when snapshot row is present and not stale). */
  useRosterSnapshot:
    isSupabaseEnabled() && process.env.SUPABASE_USE_ROSTER_SNAPSHOT !== "false",
};
