# API Rollout Runbook

## Feature Flags

- `NEXT_PUBLIC_ENABLE_EXTERNAL_APIS=true`: enables external API integration.
- `NEXT_PUBLIC_PREFER_API_CONTENT=true`: enables API-primary content reads with local fallback.
- `NEXT_PUBLIC_ALLOW_IMAGE_RECACHE=true|false`: allows image overwrite during sync.

## Required Secrets / Config

- `MARVEL_RIVALS_API_KEY`
- `MARVEL_RIVALS_API_BASE_URL` (default `https://marvelrivalsapi.com/api/v1`)
- `MARVEL_RIVALS_TIMEOUT_MS`
- `MARVEL_RIVALS_RETRY_COUNT`
- `MARVEL_RIVALS_CACHE_TTL_SECONDS`
- `SYNC_HERO_COUNT_DELTA_RATIO`

## Operations

- Manual dry run:
  - `npm run sync:heroes:dry-run`
- Manual promote:
  - `npm run sync:heroes`
- Validate promoted content:
  - `npm run validate-content`
  - `npm run lint`
  - `npm run build`

## Rollout Sequence

1. Development:
   - Set API flags on locally.
   - Run dry-run sync and validate.
2. Preview/Staging:
   - Enable workflow with dry-run only.
   - Confirm repeated successful validations.
3. Production Canary:
   - Trigger manual promote in low-traffic window.
   - Watch sync logs and app behavior.
4. Full Production:
   - Keep scheduled dry-run.
   - Use manual promote once candidate quality is confirmed.

## Rollback Triggers

Switch to local fallback immediately when any of these occur:

- External API auth/timeout failures spike.
- Candidate data fails schema or health checks.
- Hero count delta exceeds threshold (`SYNC_HERO_COUNT_DELTA_RATIO`).
- Missing critical fields in abilities/hero summary.

## Rollback Procedure

1. Set `NEXT_PUBLIC_PREFER_API_CONTENT=false`.
2. Redeploy application.
3. Confirm app reads from local `src/data/heroes.json`.
4. Review sync logs and staged candidate at `src/data/.staged/heroes.candidate.json`.

## Observability Pointers

`sync-heroes.ts` emits structured JSON logs with:

- `type=sync_log`, levels `info|warn|error`, and reason buckets.
- `type=metric` for:
  - `sync_success`
  - `sync_failure`
  - `external_hero_count`
  - `candidate_hero_count`
  - `image_cache_miss`
