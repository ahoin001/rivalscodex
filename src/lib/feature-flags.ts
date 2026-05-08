import { isSupabaseEnabled } from "@/lib/supabase/env";

export const featureFlags = {
  enableExternalApis: process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_APIS === "true",
  preferApiContent: process.env.NEXT_PUBLIC_PREFER_API_CONTENT === "true",
  allowImageRecache: process.env.NEXT_PUBLIC_ALLOW_IMAGE_RECACHE === "true",
  enableDevAdminUi:
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_ADMIN_UI === "true",
  /** Curated hero copy from hub Supabase (`app_rivalscodex_v1.hero_editorial`, scope published). */
  enableSupabase: isSupabaseEnabled(),
};
