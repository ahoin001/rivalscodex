# Patch Day Content Workflow

1. Create a starting draft:
   - `npm run draft-hero -- hero-slug "Hero Name" Vanguard`
   - You can also use flags: `--slug`, `--name`, `--role`.
2. Generate local art placeholders:
   - `npm run generate-hero-images`
3. Merge the draft in `src/data/drafts/<slug>.json` into `src/data/heroes.json`.
4. Run `npm run validate-content`.
5. Run `npm run lint` and `npm run build`.
6. Verify hero card and detail page render in `npm run dev`.
7. (Optional but recommended) refresh offline fallback from canonical codex:
   - `npm run snapshot:codex`

## Fast Update Checklist

- Update changed stats (health, cooldowns, damage).
- Update combo steps and target/avoid guidance.
- Refresh at least one external resource if needed.
- Set `updatedAt` with current patch date.
- Ensure hero IDs/slugs are unique.
- Keep images within budget:
  - Portrait <= 300 KB
  - Splash <= 500 KB

## API Safety

- Keep `NEXT_PUBLIC_ENABLE_EXTERNAL_APIS=false` for deterministic builds.
- Keep `NEXT_PUBLIC_PREFER_API_CONTENT=false` until dry-run sync checks pass.
- Run `npm run sync:heroes:dry-run` before any API-backed promotion.
- Enable API enrichment only after content validation passes.

## Validation Rules Enforced

- Schema correctness for hero data and optional fields.
- Duplicate detection for:
  - hero `id`
  - hero `slug`
  - hero name
  - per-hero ability IDs
- Required tactical guidance:
  - at least one `targetPriority`
  - at least one `avoidPriority`
- Media checks:
  - image file exists under `public`
  - image file size budgets
