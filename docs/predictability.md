# Predictability for readers and editors

Product defaults implemented in code and documented here so dev / staging / prod behave predictably.

## Draft preview (`?preview=draft`)

| Visitor | Hero guide tabs shown | Notes |
|--------|------------------------|--------|
| Signed in | Draft from Supabase when present | Draft reads opt out of static caching (`unstable_noStore` in [`resolveHeroGuideTabs`](../src/features/heroes/hero-guide-content.ts)). |
| Signed out | **Published** editorial (cached), not bundled JSON | Avoids anonymous users seeing unrelated fallback copy when sharing a draft URL. [`DraftPreviewAuthBanner`](../src/features/heroes/components/draft-preview-auth-banner.tsx) explains and links to sign-in. |
| `NEXT_PUBLIC_ENABLE_SUPABASE` off | Bundled hero JSON fallbacks | No DB; preview query does not change behavior meaningfully. |

## Published freshness after “Publish”

- **Target:** Live readers see updates shortly after publish (typically seconds), not only on a long TTL.
- **Mechanism:** [`publishHeroGuideTabsAction`](../src/features/heroes/actions/hero-guide-editorial-actions.ts) calls `updateTag(heroGuidePublishedTag(slug))` and `revalidatePath` for `/heroes/[slug]` and `/lab/hero-card`.
- **Cache TTL:** [`getCachedPublishedHeroGuideTabs`](../src/lib/supabase/hero-guide-cached.ts) uses `unstable_cache` with `HERO_GUIDE_PUBLISHED_CACHE_REVALIDATE_SECONDS` (900s) as a **fallback** window if tag-based invalidation is not in play; normal publishes should bust the tag immediately.

## Personal notes and favorites

- **Storage:** Browser **localStorage only** — no cross-device sync unless you add accounts + APIs later.
- **Favorites:** [`src/features/favorites/use-favorites.ts`](../src/features/favorites/use-favorites.ts) (`rivalscodex.favorites.v1`).
- **Notes:** [`src/features/heroes/use-hero-notes.ts`](../src/features/heroes/use-hero-notes.ts) (per-hero keys).

Logged-out users keep full access to public hero pages; personalization is optional and local.

## Guide editing concurrency

- **Policy:** **Last write wins.** Two editors saving the same hero overwrite the previous draft/published payload for that scope; there is no optimistic locking or version column.
- **UI:** Hint copy on the guide editor reminds editors of this behavior.

## Personal vs admin guide editing

| `NEXT_PUBLIC_GUIDE_EDIT_POLICY` | Reader experience | Saving |
|--------------------------------|-------------------|--------|
| `personal` (default) | Inline **Edit combos** on `/heroes/[slug]` Combos tab; route cards + combo builder | Debounced auto-save to **published** (~1.5s). Uses `SUPABASE_SERVICE_ROLE_KEY` on the server when set. |
| `admin` | No inline editor; use `/admin/guides` (login + `profiles.is_guide_editor` in production) | Draft + Publish buttons in admin UI |

When Supabase is off, personal-mode edits persist in **localStorage** only (`rivalscodex.guide-tabs.v1.{slug}`).

## Environment and feature flags

Keep **documented env vars** in [`.env.example`](../.env.example) aligned with each deployment. Summary:

| Flag / env | Purpose |
|------------|---------|
| `NEXT_PUBLIC_ENABLE_SUPABASE` | Enables Supabase reads (guides, editorial, etc.). When false, guide content uses bundled fallbacks. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server Supabase client. |
| `NEXT_PUBLIC_GUIDE_EDIT_POLICY` | `personal` (default) or `admin` — see [Personal vs admin guide editing](#personal-vs-admin-guide-editing). |
| `NEXT_PUBLIC_ALLOW_DEV_GUIDE_EDIT` | When `false` in development, guide edits require `profiles.is_guide_editor` like production (see [`guide-editor.ts`](../src/lib/auth/guide-editor.ts)). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; snapshot sync and privileged writes. Never expose to the client. |
| `SUPABASE_USE_ROSTER_SNAPSHOT` | Prefer Postgres roster snapshot over live HTTP when available. |
| `NEXT_PUBLIC_ENABLE_DEV_ADMIN_UI` | Dev-only UI gated in [`featureFlags`](../src/lib/feature-flags.ts). |
| `NEXT_PUBLIC_ENABLE_EXTERNAL_APIS` / `NEXT_PUBLIC_PREFER_API_CONTENT` | Optional external data paths. |

Central flag object: [`src/lib/feature-flags.ts`](../src/lib/feature-flags.ts).
