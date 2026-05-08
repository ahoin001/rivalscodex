# RivalsCodex

RivalsCodex is a Next.js App Router hero reference for Marvel Rivals with a JSON-first content model, favorites persistence, and API-ready enrichment adapters.

## Core Scripts

- `npm run dev` - start local development server.
- `npm run build` - create production build.
- `npm run start` - run production build locally.
- `npm run lint` - run ESLint checks.
- `npm run generate-hero-images` - generate optimized local `.webp` hero art.
- `npm run draft-hero -- hero-slug "Hero Name" Vanguard` - create a hero draft JSON in `src/data/drafts`.
- `npm run validate-content` - validate hero JSON schema and content health checks.
- `npm run sync:heroes:dry-run` - fetch API data, validate, and stage candidate without promoting.
- `npm run sync:heroes` - fetch API data, validate, stage, and promote candidate to `src/data/heroes.json`.
- `npm run lighthouse:ci` - run Lighthouse CI assertions against key routes.

## Content Workflow

1. Update hero data in `src/data/heroes.json` (or start from `src/data/hero.template.json`).
2. Run `npm run validate-content`.
3. Run `npm run lint && npm run build`.

## UI System

- Use shared UI primitives from `src/components/ui/index.ts`.
- Pattern guide for creating uniform sections: `docs/ui-patterns.md`.

## Environment Setup

Copy `.env.example` to `.env.local` and configure keys only when needed:

- `NEXT_PUBLIC_ENABLE_EXTERNAL_APIS`
- `NEXT_PUBLIC_PREFER_API_CONTENT`
- `NEXT_PUBLIC_ALLOW_IMAGE_RECACHE`
- `MARVEL_RIVALS_API_KEY`
- `MARVEL_RIVALS_TIMEOUT_MS`
- `MARVEL_RIVALS_RETRY_COUNT`
- `MARVEL_RIVALS_CACHE_TTL_SECONDS`
- `YOUTUBE_API_KEY`
- `YOUTUBE_CACHE_TTL_SECONDS`
- `SYNC_HERO_COUNT_DELTA_RATIO`

When API flags are off, curated JSON remains the canonical source of truth.

## API Rollout

- Operational runbook: `docs/api-rollout-runbook.md`
- Scheduled + manual sync workflow: `.github/workflows/sync-heroes.yml`
