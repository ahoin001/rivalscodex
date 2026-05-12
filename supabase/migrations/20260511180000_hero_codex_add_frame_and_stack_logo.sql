-- Promote hero frame + stack-logo image paths into the hero_codex schema so
-- the codex is the single source of truth for every per-hero asset. The
-- generated static-import overlay is being removed; runtime components read
-- these fields directly off the Hero payload.

alter table app_rivalscodex_v1.hero_codex
  add column if not exists frame_image text,
  add column if not exists stack_logo_image text;

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
  return new;
end;
$$;

-- Backfill payload JSONB for existing rows by deriving the conventional
-- `/rivals-assets/heros/<slug>/<slug>-{frame,stack-logo}.png` paths when the
-- field is missing. The trigger then promotes them into the new columns.
update app_rivalscodex_v1.hero_codex
set payload = payload
  || jsonb_build_object(
       'frameImage',
       coalesce(
         nullif(payload->>'frameImage', ''),
         '/rivals-assets/heros/' || hero_slug || '/' || hero_slug || '-frame.png'
       ),
       'stackLogoImage',
       coalesce(
         nullif(payload->>'stackLogoImage', ''),
         '/rivals-assets/heros/' || hero_slug || '/' || hero_slug || '-stack-logo.png'
       )
     );

-- Mirror the new asset paths into the normalized hero_asset registry so the
-- table reflects everything in the payload.
insert into app_rivalscodex_v1.hero_asset (hero_slug, asset_kind, asset_key, web_path)
select
  hero_slug,
  'hero-frame',
  'frame',
  frame_image
from app_rivalscodex_v1.hero_codex
where frame_image is not null and frame_image <> ''
on conflict (hero_slug, asset_kind, asset_key) do update
set web_path = excluded.web_path;

insert into app_rivalscodex_v1.hero_asset (hero_slug, asset_kind, asset_key, web_path)
select
  hero_slug,
  'hero-stack-logo',
  'stack-logo',
  stack_logo_image
from app_rivalscodex_v1.hero_codex
where stack_logo_image is not null and stack_logo_image <> ''
on conflict (hero_slug, asset_kind, asset_key) do update
set web_path = excluded.web_path;
