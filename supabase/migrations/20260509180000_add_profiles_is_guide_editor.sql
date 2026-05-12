-- Grants hero guide editorial access in production (see supabase/README.md).
-- Requires public.profiles(id uuid PK referencing auth.users), standard Supabase pattern.

alter table public.profiles
  add column if not exists is_guide_editor boolean not null default false;

comment on column public.profiles.is_guide_editor is
  'When true, user may save/publish hero guide drafts via RivalsCodex admin (non-dev environments).';
