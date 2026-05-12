-- Canonical hero data parsed from marvelrivals.com, written by the dev import route
-- (POST /api/dev/marvel-site-import). One row per hero; payload follows the runtime
-- `heroSchema` shape in src/data/schema.ts.
--
-- This row replaces the Marvel Rivals API as the primary roster source in
-- src/lib/content-adapter.ts. Editorial overlays live in app_rivalscodex_v1.hero_editorial
-- (unchanged) and are merged on top of the codex payload at read time.

create table if not exists app_rivalscodex_v1.hero_codex (
  hero_slug  text primary key,
  payload    jsonb not null,
  source     text  not null default 'marvel-official-html',
  parsed_at  timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hero_codex_updated_at_idx
  on app_rivalscodex_v1.hero_codex (updated_at desc);

comment on table app_rivalscodex_v1.hero_codex is
  'Canonical hero records parsed from marvelrivals.com via the dev HTML import flow.';
comment on column app_rivalscodex_v1.hero_codex.payload is
  'Full Hero JSON (id, slug, name, role, abilities[], etc.) matching src/data/schema.ts heroSchema.';
comment on column app_rivalscodex_v1.hero_codex.source is
  'How the row was produced: "marvel-official-html" (default), "manual", etc.';

alter table app_rivalscodex_v1.hero_codex enable row level security;

drop policy if exists hero_codex_read on app_rivalscodex_v1.hero_codex;
create policy hero_codex_read
  on app_rivalscodex_v1.hero_codex
  for select
  using (true);

-- Writes are intentionally service-role only (no INSERT/UPDATE/DELETE policy for anon/auth).

-- Table grants mirror the existing hero_editorial pattern so PostgREST exposes reads
-- to anon/authenticated. Writes still gated by RLS (no policies for those roles).
grant select on table app_rivalscodex_v1.hero_codex to anon;
grant select on table app_rivalscodex_v1.hero_codex to authenticated;
grant select, insert, update, delete on table app_rivalscodex_v1.hero_codex to service_role;

create or replace function app_rivalscodex_v1.set_hero_codex_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hero_codex_set_updated_at on app_rivalscodex_v1.hero_codex;
create trigger hero_codex_set_updated_at
  before update on app_rivalscodex_v1.hero_codex
  for each row execute function app_rivalscodex_v1.set_hero_codex_updated_at();
