# Supabase migrations

Apply with the Supabase CLI (`supabase db push`) or run SQL manually in the dashboard SQL editor.

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
