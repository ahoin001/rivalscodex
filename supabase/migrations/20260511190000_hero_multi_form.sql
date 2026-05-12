-- Multi-form hero codex: add a normalized hero_form table, scope abilities to
-- forms, and backfill existing single-form heroes (Angela, Daredevil) with a
-- synthetic 'base' form so every ability row carries form_id even before the
-- importer learns to write forms[].

alter table app_rivalscodex_v1.hero_codex
  add column if not exists default_form_id text;

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
  new.frame_image := nullif(new.payload->>'frameImage', '');
  new.stack_logo_image := nullif(new.payload->>'stackLogoImage', '');
  new.default_form_id := nullif(new.payload->>'defaultFormId', '');
  return new;
end;
$$;

create table if not exists app_rivalscodex_v1.hero_form (
  hero_slug text not null references app_rivalscodex_v1.hero_codex(hero_slug) on delete cascade,
  form_id text not null,
  name text not null,
  short_label text,
  site_form_index integer,
  health integer,
  portrait_image text,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  base_stat_rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (hero_slug, form_id)
);

create index if not exists hero_form_hero_slug_idx
  on app_rivalscodex_v1.hero_form (hero_slug);
create index if not exists hero_form_hero_slug_sort_order_idx
  on app_rivalscodex_v1.hero_form (hero_slug, sort_order);

create or replace function app_rivalscodex_v1.set_hero_form_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hero_form_set_updated_at on app_rivalscodex_v1.hero_form;
create trigger hero_form_set_updated_at
  before update on app_rivalscodex_v1.hero_form
  for each row execute function app_rivalscodex_v1.set_hero_form_updated_at();

alter table app_rivalscodex_v1.hero_form enable row level security;
drop policy if exists hero_form_read on app_rivalscodex_v1.hero_form;
create policy hero_form_read
  on app_rivalscodex_v1.hero_form
  for select
  using (true);

grant select on table app_rivalscodex_v1.hero_form to anon;
grant select on table app_rivalscodex_v1.hero_form to authenticated;
grant select, insert, update, delete on table app_rivalscodex_v1.hero_form to service_role;

alter table app_rivalscodex_v1.hero_ability
  add column if not exists form_id text,
  add column if not exists site_form_index integer;

create index if not exists hero_ability_hero_slug_form_id_idx
  on app_rivalscodex_v1.hero_ability (hero_slug, form_id);

-- Backfill: every existing hero gets a synthetic 'base' form row mirrored from
-- the codex payload, and every existing ability row is stamped with that
-- form_id so the table has full referential integrity once the FK lands.
insert into app_rivalscodex_v1.hero_form (
  hero_slug,
  form_id,
  name,
  short_label,
  site_form_index,
  health,
  portrait_image,
  is_default,
  sort_order,
  base_stat_rows
)
select
  hc.hero_slug,
  'base' as form_id,
  coalesce(hc.hero_name, hc.hero_slug) as name,
  null::text as short_label,
  0 as site_form_index,
  hc.hero_health,
  hc.portrait_image,
  true as is_default,
  0 as sort_order,
  coalesce(hc.payload->'baseStatRows', '[]'::jsonb) as base_stat_rows
from app_rivalscodex_v1.hero_codex hc
on conflict (hero_slug, form_id) do update
set
  name = excluded.name,
  health = excluded.health,
  portrait_image = excluded.portrait_image,
  is_default = excluded.is_default,
  base_stat_rows = excluded.base_stat_rows,
  updated_at = now();

update app_rivalscodex_v1.hero_ability
set
  form_id = coalesce(form_id, 'base'),
  site_form_index = coalesce(site_form_index, 0)
where form_id is null;

-- Mirror defaultFormId='base' into the payload so the promoted column stays in
-- sync after the trigger lands. Existing heroes pre-date multi-form support.
update app_rivalscodex_v1.hero_codex hc
set payload = hc.payload || jsonb_build_object('defaultFormId', 'base')
where coalesce(hc.payload->>'defaultFormId', '') = '';

-- Now lock the form_id column down with a real FK and not-null constraint so
-- every ability is anchored to a form. Done after the backfill so the
-- migration is safe to re-run against partially-migrated data.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hero_ability_form_fk'
      and conrelid = 'app_rivalscodex_v1.hero_ability'::regclass
  ) then
    alter table app_rivalscodex_v1.hero_ability
      add constraint hero_ability_form_fk
      foreign key (hero_slug, form_id)
      references app_rivalscodex_v1.hero_form (hero_slug, form_id)
      on delete cascade;
  end if;
end $$;

alter table app_rivalscodex_v1.hero_ability
  alter column form_id set not null;
