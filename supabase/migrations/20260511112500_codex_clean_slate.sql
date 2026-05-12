-- Clean-slate codex architecture hardening:
-- - Promote hero scalar fields for queryability.
-- - Normalize abilities and assets.
-- - Add deterministic import audit log.
-- - Ensure editor profile flag exists for policy consistency.

alter table public.profiles
  add column if not exists is_guide_editor boolean not null default false;

alter table app_rivalscodex_v1.hero_codex
  add column if not exists hero_name text,
  add column if not exists hero_role text,
  add column if not exists hero_real_name text,
  add column if not exists hero_difficulty integer,
  add column if not exists hero_health integer,
  add column if not exists portrait_image text,
  add column if not exists splash_image text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hero_codex_payload_slug_matches_pk'
      and conrelid = 'app_rivalscodex_v1.hero_codex'::regclass
  ) then
    alter table app_rivalscodex_v1.hero_codex
      add constraint hero_codex_payload_slug_matches_pk
      check (coalesce(payload->>'slug', '') = hero_slug);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hero_codex_payload_abilities_array'
      and conrelid = 'app_rivalscodex_v1.hero_codex'::regclass
  ) then
    alter table app_rivalscodex_v1.hero_codex
      add constraint hero_codex_payload_abilities_array
      check (
        jsonb_typeof(payload->'abilities') = 'array'
        and jsonb_array_length(payload->'abilities') > 0
      );
  end if;
end $$;

create or replace function app_rivalscodex_v1.sync_hero_codex_promoted_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.hero_name := nullif(new.payload->>'name', '');
  new.hero_role := nullif(new.payload->>'role', '');
  new.hero_real_name := nullif(new.payload->>'realName', '');
  new.hero_difficulty := nullif(new.payload->>'difficulty', '')::integer;
  new.hero_health := nullif(new.payload->>'health', '')::integer;
  new.portrait_image := nullif(new.payload->>'portraitImage', '');
  new.splash_image := nullif(new.payload->>'splashImage', '');
  return new;
end;
$$;

drop trigger if exists hero_codex_sync_promoted_columns
  on app_rivalscodex_v1.hero_codex;
create trigger hero_codex_sync_promoted_columns
  before insert or update on app_rivalscodex_v1.hero_codex
  for each row execute function app_rivalscodex_v1.sync_hero_codex_promoted_columns();

update app_rivalscodex_v1.hero_codex
set payload = payload;

create index if not exists hero_codex_role_idx
  on app_rivalscodex_v1.hero_codex (hero_role);
create index if not exists hero_codex_name_idx
  on app_rivalscodex_v1.hero_codex (hero_name);

create table if not exists app_rivalscodex_v1.hero_ability (
  ability_id text primary key,
  hero_slug text not null references app_rivalscodex_v1.hero_codex(hero_slug) on delete cascade,
  site_order integer,
  category text,
  name text not null,
  keybind text,
  description text,
  damage text,
  cooldown_seconds numeric,
  icon_url text,
  keybind_icon_url text,
  stats jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists hero_ability_hero_slug_idx
  on app_rivalscodex_v1.hero_ability (hero_slug);
create index if not exists hero_ability_hero_slug_site_order_idx
  on app_rivalscodex_v1.hero_ability (hero_slug, site_order);

create or replace function app_rivalscodex_v1.set_hero_ability_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hero_ability_set_updated_at on app_rivalscodex_v1.hero_ability;
create trigger hero_ability_set_updated_at
  before update on app_rivalscodex_v1.hero_ability
  for each row execute function app_rivalscodex_v1.set_hero_ability_updated_at();

with ability_seed as (
  select
    ability.value->>'id' as ability_id,
    hc.hero_slug,
    nullif(ability.value->>'siteOrder', '')::integer as site_order,
    nullif(ability.value->>'category', '') as category,
    ability.value->>'name' as name,
    ability.value->>'keybind' as keybind,
    ability.value->>'description' as description,
    nullif(ability.value->>'damage', '') as damage,
    nullif(ability.value->>'cooldownSeconds', '')::numeric as cooldown_seconds,
    nullif(ability.value->>'iconUrl', '') as icon_url,
    nullif(ability.value->>'keybindIconUrl', '') as keybind_icon_url,
    coalesce(ability.value->'stats', '[]'::jsonb) as stats
  from app_rivalscodex_v1.hero_codex hc
  cross join lateral jsonb_array_elements(hc.payload->'abilities') as ability(value)
  where ability.value ? 'id'
),
ability_ranked as (
  select
    *,
    row_number() over (
      partition by ability_id
      order by site_order nulls last, hero_slug
    ) as rn
  from ability_seed
)
insert into app_rivalscodex_v1.hero_ability (
  ability_id,
  hero_slug,
  site_order,
  category,
  name,
  keybind,
  description,
  damage,
  cooldown_seconds,
  icon_url,
  keybind_icon_url,
  stats
)
select
  ability_id,
  hero_slug,
  site_order,
  category,
  name,
  keybind,
  description,
  damage,
  cooldown_seconds,
  icon_url,
  keybind_icon_url,
  stats
from ability_ranked
where rn = 1
on conflict (ability_id) do update
set
  hero_slug = excluded.hero_slug,
  site_order = excluded.site_order,
  category = excluded.category,
  name = excluded.name,
  keybind = excluded.keybind,
  description = excluded.description,
  damage = excluded.damage,
  cooldown_seconds = excluded.cooldown_seconds,
  icon_url = excluded.icon_url,
  keybind_icon_url = excluded.keybind_icon_url,
  stats = excluded.stats,
  updated_at = now();

alter table app_rivalscodex_v1.hero_ability enable row level security;
drop policy if exists hero_ability_read on app_rivalscodex_v1.hero_ability;
create policy hero_ability_read
  on app_rivalscodex_v1.hero_ability
  for select
  using (true);

grant select on table app_rivalscodex_v1.hero_ability to anon;
grant select on table app_rivalscodex_v1.hero_ability to authenticated;
grant select, insert, update, delete on table app_rivalscodex_v1.hero_ability to service_role;

create table if not exists app_rivalscodex_v1.hero_asset (
  id bigserial primary key,
  hero_slug text not null references app_rivalscodex_v1.hero_codex(hero_slug) on delete cascade,
  asset_kind text not null,
  asset_key text not null,
  web_path text not null,
  remote_url text,
  bytes integer,
  fetched_at timestamptz not null default now(),
  unique (hero_slug, asset_kind, asset_key)
);

create index if not exists hero_asset_hero_slug_idx
  on app_rivalscodex_v1.hero_asset (hero_slug);
create index if not exists hero_asset_kind_idx
  on app_rivalscodex_v1.hero_asset (asset_kind);

insert into app_rivalscodex_v1.hero_asset (hero_slug, asset_kind, asset_key, web_path)
select
  hero_slug,
  'hero-portrait',
  'portrait',
  portrait_image
from app_rivalscodex_v1.hero_codex
where portrait_image is not null and portrait_image <> ''
on conflict (hero_slug, asset_kind, asset_key) do update
set web_path = excluded.web_path;

insert into app_rivalscodex_v1.hero_asset (hero_slug, asset_kind, asset_key, web_path)
select
  hero_slug,
  'hero-splash',
  'splash',
  splash_image
from app_rivalscodex_v1.hero_codex
where splash_image is not null and splash_image <> ''
on conflict (hero_slug, asset_kind, asset_key) do update
set web_path = excluded.web_path;

with ability_icon_seed as (
  select
    hc.hero_slug,
    'ability-icon'::text as asset_kind,
    ability.value->>'id' as asset_key,
    ability.value->>'iconUrl' as web_path
  from app_rivalscodex_v1.hero_codex hc
  cross join lateral jsonb_array_elements(hc.payload->'abilities') as ability(value)
  where ability.value ? 'id'
    and coalesce(ability.value->>'iconUrl', '') <> ''
),
ability_icon_dedup as (
  select distinct on (hero_slug, asset_kind, asset_key)
    hero_slug, asset_kind, asset_key, web_path
  from ability_icon_seed
)
insert into app_rivalscodex_v1.hero_asset (hero_slug, asset_kind, asset_key, web_path)
select hero_slug, asset_kind, asset_key, web_path
from ability_icon_dedup
on conflict (hero_slug, asset_kind, asset_key) do update
set web_path = excluded.web_path;

with keybind_icon_seed as (
  select
    hc.hero_slug,
    'keybind-icon'::text as asset_kind,
    ability.value->>'id' as asset_key,
    ability.value->>'keybindIconUrl' as web_path
  from app_rivalscodex_v1.hero_codex hc
  cross join lateral jsonb_array_elements(hc.payload->'abilities') as ability(value)
  where ability.value ? 'id'
    and coalesce(ability.value->>'keybindIconUrl', '') <> ''
),
keybind_icon_dedup as (
  select distinct on (hero_slug, asset_kind, asset_key)
    hero_slug, asset_kind, asset_key, web_path
  from keybind_icon_seed
)
insert into app_rivalscodex_v1.hero_asset (hero_slug, asset_kind, asset_key, web_path)
select hero_slug, asset_kind, asset_key, web_path
from keybind_icon_dedup
on conflict (hero_slug, asset_kind, asset_key) do update
set web_path = excluded.web_path;

alter table app_rivalscodex_v1.hero_asset enable row level security;
drop policy if exists hero_asset_read on app_rivalscodex_v1.hero_asset;
create policy hero_asset_read
  on app_rivalscodex_v1.hero_asset
  for select
  using (true);

grant select on table app_rivalscodex_v1.hero_asset to anon;
grant select on table app_rivalscodex_v1.hero_asset to authenticated;
grant select, insert, update, delete on table app_rivalscodex_v1.hero_asset to service_role;

create table if not exists app_rivalscodex_v1.hero_import_log (
  id bigserial primary key,
  hero_slug text not null,
  action text not null,
  ok boolean not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hero_import_log_slug_created_idx
  on app_rivalscodex_v1.hero_import_log (hero_slug, created_at desc);

alter table app_rivalscodex_v1.hero_import_log enable row level security;
drop policy if exists hero_import_log_service_only on app_rivalscodex_v1.hero_import_log;
create policy hero_import_log_service_only
  on app_rivalscodex_v1.hero_import_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update, delete on table app_rivalscodex_v1.hero_import_log to service_role;
