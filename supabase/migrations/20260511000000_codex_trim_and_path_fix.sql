-- Cleans up `hero_codex` so it reflects the only two heroes that have been
-- successfully parsed end-to-end (Adam Warlock + Angela) and repairs the
-- legacy portraitImage/splashImage paths in their JSONB payloads so they
-- point at the canonical /rivals-assets tree.
--
-- Reversible: re-run the import panel for any hero you want to restore.

-- 1. Patch image paths for the two retained heroes. Idempotent: re-running
--    sets the same string values, so this is safe to apply twice.
update app_rivalscodex_v1.hero_codex
set payload = jsonb_set(
       jsonb_set(payload, '{portraitImage}', to_jsonb('/rivals-assets/heros/' || hero_slug || '/' || hero_slug || '.png')),
       '{splashImage}',
       to_jsonb('/rivals-assets/heros/' || hero_slug || '/' || hero_slug || '.png'))
where hero_slug in ('adam-warlock', 'angela');

-- 2. Remove every other hero from the codex. The repo seed (src/data/heroes.json)
--    has also been trimmed to match, so any future import is the source of truth.
delete from app_rivalscodex_v1.hero_codex
where hero_slug not in ('adam-warlock', 'angela');
