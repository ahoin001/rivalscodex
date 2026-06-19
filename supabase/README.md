# Supabase migrations

Apply with the Supabase CLI (`supabase db push`) or run SQL manually in the dashboard SQL editor.

## Hero codex (HTML import + normalized tables)

RivalsCodex stores hero roster data in the dedicated schema `app_rivalscodex_v1`:

| Layer | Table | Writer |
| --- | --- | --- |
| Canonical JSON | `hero_codex` | `upsertHeroCodex()` (service role) |
| Forms | `hero_form` | same |
| Abilities | `hero_ability` | same |
| Asset registry | `hero_asset` | same (`bigserial` — needs sequence grant) |
| Import audit | `hero_import_log` | `logHeroImport()` (best-effort) |

**Import flow** (`POST /api/dev/marvel-site-import`):

1. Download/cache images under `public/rivals-assets/…`
2. Build or merge a validated `Hero` payload
3. `persistHero()` → `upsertHeroCodex()` using `SUPABASE_SERVICE_ROLE_KEY`
4. `revalidateHeroCodexCaches()` on success

Code lives in:

- `src/lib/supabase/hero-codex-repository.ts` — normalized upserts (forms → abilities → assets)
- `src/lib/supabase/hero-import-log-repository.ts` — import audit rows
- `src/app/api/dev/marvel-site-import/route.ts` — dev HTML import API

### Sequence permissions (required for import)

Tables with `bigserial` primary keys (`hero_asset`, `hero_import_log`) need **sequence** grants for `service_role`, not just table `INSERT`:

```sql
-- Applied by migration 20260528160000_grant_codex_sequence_permissions.sql
-- Grants USAGE, SELECT on every sequence in app_rivalscodex_v1 to service_role.
```

If import reports `permission denied for sequence hero_asset_id_seq`, run pending migrations or paste that migration into the SQL editor, then re-apply the hero.

### Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # server-only; never expose to the client
NEXT_PUBLIC_ENABLE_SUPABASE=true
```

Without the service role key, local files still write but Supabase sync returns an error.

For magic-link sign-in to `/admin/login`, add these **Redirect URLs** under Authentication → URL configuration (replace host/port as needed):

- `http://localhost:3000/auth/callback`
- `https://your-production-domain/auth/callback`

The login form sends `emailRedirectTo={origin}/auth/callback?next=...`.

## Hero guide editors (`is_guide_editor`)

After migration `20260509180000_add_profiles_is_guide_editor.sql`:

1. Ensure each staff user has a row in `public.profiles` with `id` = `auth.users.id`.
2. Grant edit access:

```sql
update public.profiles
set is_guide_editor = true
where id = '<user-uuid>';
```

In **development**, signed-in users can edit guides without this flag when `NEXT_PUBLIC_ALLOW_DEV_GUIDE_EDIT` is not set to `false`.
