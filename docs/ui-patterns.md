# Rivals UI Patterns

Use these primitives to keep styling and behavior uniform across new pages and sections.

## Import Surface

Import from one place:

- `src/components/ui/index.ts`

Example:

```tsx
import { ClippedPanel, HudSection, RivalsCta, RivalsSectionHeader } from "@/components/ui";
```

Canonical design rules also live in [`DESIGN.md`](../DESIGN.md).

## Architecture layers

| Layer | Lives in | Owns |
|---|---|---|
| Tokens / motion | `src/app/globals.css`, `src/components/ui/motion.ts` | Duration/easing CSS vars; JS reads them via `resolveMotionDurationMs` |
| UI primitives | `src/components/ui` | Generic controls. No kit PNG chrome, no catalog parse, no route I/O |
| Feature compositions | `src/features/<domain>/components` | Screens that compose primitives. Split list/detail/hooks into sibling files |
| Adapters | `src/features/<domain>/*.ts`, `src/data` | Schema, lookup, merge. UI never parses catalogs |

**File caps:** UI files soft ~220 lines, hard ~320. One primary export per file. Split before mixing list + detail + view-model + motion + demo data.

**Reuse order:** existing primitive → small new primitive → feature-local split.

## Layout Patterns

- `RivalsPageShell`
  - Page container with canonical max width and responsive padding.
- `RivalsSectionHeader`
  - Standardized eyebrow/title/divider/description block for hero and gallery pages.
- `RivalsFeatureSection`
  - Reusable content-section template with standardized title block, content area, optional media rail, optional actions, and reversible two-column layout.
- `RivalsDataTableSection`
  - Reusable data table section with standardized desktop table headers/rows and built-in mobile fallback cards.
- `ClippedPanel`
  - Shared clipped/glass container.
  - `tone="default"` for neutral surfaces.
  - `tone="gold"` for brand-highlighted surfaces.

## Content Patterns

- `HudSection`
  - Reusable section shell for tactical panels.
  - `tone="primary"` for stronger emphasis.
  - `tone="secondary"` for supporting sections.
- `StatRow`
  - Standard label/value row for any stat list.
- `HudReadout`
  - Technical HUD label/value row with `tabular-nums` (`tone="chrome" | "lab"`).
- `HudEmptyState`
  - Clipped “NO INTEL” empty panel for missing guide chapters.
- `RivalsPill`
  - Reusable metadata chip for tags, status, and stat badges.
- `RivalsCta`
  - Preferred CTA: `context="chrome"` (dark HUD) or `context="lab"` (light dossier).
  - Supports `href` for link buttons. Prefer this for new work.
- `ClippedButton` / `RivalsBrandButton` / `RivalsClipAction`
  - Legacy wrappers over `RivalsCta` — still fine at call sites; do not extend further.
- `RivalsTabBar`, `RivalsClipSegment`, `RivalsRoleBadge`, `RivalsHeroTitle`
  - `RivalsTabBar` is chapter navigation (gold underline). `RivalsClipSegment` is a compact 2–n clip toggle (Base/Enhanced, matchup filters). Do not fake chapter tabs for tiny segments.
- `RivalsInput`
  - Standardized input field with brand focus and placeholder behavior.

## Theme Rules

- Use tokenized colors (`brand-gold`, `muted-foreground`, role colors) from `src/app/globals.css`.
- Use shared motion tokens (`--motion-*`, `--ease-*`) and runtime helpers from `src/components/ui/motion.ts` for any JS-driven timing. No raw `duration-[Nms]`, no GSAP/Framer, no `transition-all`.
- Prefer primitives over raw utility duplication.
- If adding a repeated pattern in 2+ unrelated places, extract a `ui` component before expanding feature code. Hero-kit PNG chrome and catalog overlay stay in `features/heroes`.
- Keep role accents semantically tied to hero role; use gold as global brand framing.
- Keep repeated table/row definitions in a shared preset registry (`src/components/ui/presets/*`) so columns and stat layouts can be edited from one place.

## HUD Assemble

Shared-element morphs and clip-path continuity live on the Rivals materials — not a Jarvis overlay.

- **Portrait morph:** wrap gallery and splash art with `HeroPortraitTransition` (`hero-portrait-${slug}`). Names live in `src/features/heroes/transition/`.
- **Pointer only:** tab/filter morphs run on pointer. Keyboard tab changes must stay instant (`RivalsTabBar` / `RivalsClipSegment` pass `source: "keyboard"`).
- **Loadout primitive:** `type: "loadout"` blocks belong on the Loadouts chapter only (`canUseBlockOnTab`). Empty chapters use `HudEmptyState`.
- **Combo playback:** user-started, skippable, never autoplay; `prefersHudAssembleMotion()` gates Play.
- Ban `transition-all` and `--ease-in` on UI primitives. Specify transform/opacity/color/clip-path.
- `prefers-reduced-motion`: disable View Transitions and playback; keep color/opacity status.

## Preset Naming Conventions

- File names: use focused `kebab-case` modules ending in `-presets.ts` (for example `table-presets.ts`, `filter-presets.ts`, `label-presets.ts`).
- Export style: export `const` values for options/maps/column arrays and `type` aliases for shared unions (for example `HeroRoleFilter`).
- Constant names: prefer descriptive plural names for collections (`heroRoleFilterOptions`, `abilityMatrixColumns`) and `*Labels` suffix for display maps.
- Import path: consume presets from `@/components/ui/presets` so feature code never depends on individual preset file paths.
- Growth rule: if a preset file starts mixing unrelated concerns, split it into another `*-presets.ts` module and re-export it via `src/components/ui/presets/index.ts`.

## New Section Checklist

1. Wrap page with `RivalsPageShell`.
2. Add section heading via `RivalsSectionHeader` or `HudSection`.
3. Prefer `RivalsFeatureSection` when a section needs both main content and an optional side media/context panel.
4. Use `ClippedPanel`/`HudSection` for containers (avoid ad-hoc border/bg combinations).
5. Use `StatRow` and `RivalsPill` instead of one-off rows/chips.
6. Use `RivalsDataTableSection` for repeated row/column data (abilities, stats tables, etc.).
7. Use `RivalsCta` and `RivalsInput` for controls.
8. Use `HudEmptyState` for missing editorial chapters and `HudReadout` for kit/combo stats.
9. Shared portrait morphs: wrap gallery and splash art with `HeroPortraitTransition`.
10. Keyboard tab changes must skip clip-reveal (`onChange(id, "keyboard")`).
11. Run `npm run lint` and `npm run build`.

## UI PR Checklist

- Confirm repeated table columns, filter options, and label maps are centralized in `src/components/ui/presets/*`.
- Confirm feature components import presets from `@/components/ui/presets` rather than local ad-hoc arrays/maps.
- If you introduced a new reusable preset concern, add a focused `*-presets.ts` file and re-export it through `src/components/ui/presets/index.ts`.
- If you intentionally kept a value local, document why it is one-off and not suitable for preset extraction.

## Feature Section Example

```tsx
<RivalsFeatureSection
  eyebrow="Core Section"
  title="Hero Database"
  description="High-value hero intel with consistent visuals."
  media={<RivalsPill tone="brand">Content System</RivalsPill>}
>
  <HeroGalleryClient heroes={heroes} />
</RivalsFeatureSection>
```

## Data Table Example

```tsx
<RivalsDataTableSection
  title="Abilities Matrix"
  columns={[
    { key: "keybind", label: "Key" },
    { key: "name", label: "Ability" },
    { key: "type", label: "Type" },
  ]}
  rows={hero.abilities}
  getRowKey={(ability) => ability.id}
  renderCell={(ability, key) => {
    if (key === "keybind") return ability.keybind;
    if (key === "name") return ability.name;
    return <RivalsPill tone="brand">{ability.type}</RivalsPill>;
  }}
  renderMobile={(ability) => <AbilityCard ability={ability} />}
/>
```

## Preset Registry Example

```ts
// src/components/ui/presets/table-presets.ts
export const abilityMatrixColumns = [
  { key: "keybind", label: "Key" },
  { key: "name", label: "Ability" },
  { key: "type", label: "Type" },
  { key: "stats", label: "Stats" },
];
```

```ts
// src/components/ui/presets/filter-presets.ts
export const heroRoleFilterOptions = ["All", "Vanguard", "Duelist", "Strategist"];
```

```ts
// src/components/ui/presets/label-presets.ts
export const externalResourceTypeLabels = {
  youtube: "Video",
  guide: "Guide",
  community: "Community",
};
```
