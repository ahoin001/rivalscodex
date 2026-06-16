# Guide editing architecture

This document defines the **single source of truth** for hero guide content (tabs, combo blocks, publish flow). See also [predictability.md](./predictability.md) for env flags and reader behavior.

## Canonical store

| Layer | Location |
|-------|----------|
| Schema | [`src/features/heroes/hero-guide-schema.ts`](../src/features/heroes/hero-guide-schema.ts) |
| Sanitize (write/read recovery) | [`src/features/heroes/hero-guide-sanitize.ts`](../src/features/heroes/hero-guide-sanitize.ts) |
| Supabase JSON | `hero_editorial.content.heroGuideTabs` |
| Dossier fallback | [`buildHeroGuideTabsFromHero`](../src/features/heroes/hero-lab-data.ts) — fills missing tabs only |

## Writers (full 6-tab payload)

Both paths call the same server actions and schema:

| Writer | Scope on save | UI |
|--------|---------------|-----|
| Admin [`HeroGuideEditor`](../src/features/heroes/components/hero-guide-editor.tsx) | **Publish** → `published`; Save draft → `draft` | `/admin/guides/[slug]` |
| Inline [`useHeroGuideEdit`](../src/features/heroes/hooks/use-hero-guide-edit.ts) | Auto + **Publish** → `published` | Hero page Combos tab (personal policy) |

**Important:** Live readers always see `published` unless signed in with `?preview=draft`.

## Readers

```
resolveHeroGuideTabs → mergeHeroGuideTabsWithFallback → HeroGuideConsole → HeroGuideBody
```

- Combos render from **`combos` tab `body[]`** blocks with `type: "combo"`.
- Priority/secondary cues show only when `body` is empty.

## Combo blocks

- Author with [`ComboBlockEditor`](../src/features/heroes/components/combo-editor/combo-block-editor.tsx) (shared admin + inline).
- Persist `structuredSteps` + derived `steps[]`.
- Optional fields (`clip`, etc.) are sanitized before write to avoid whole-guide parse failure.

## Deprecated / do not use for guide combos

- Legacy [`hero-info-tabs`](../src/features/heroes/components/hero-info-tabs.tsx) editorial publish (`hero.combos` snapshot) — merges with existing content and must **not** clobber `heroGuideTabs`.
- Dossier `hero.combos` alone — fallback only, not the live guide editor target.

## Personal vs admin policy

| `NEXT_PUBLIC_GUIDE_EDIT_POLICY` | Behavior |
|---------------------------------|----------|
| `personal` (default) | Inline edit on hero page; admin optional; last write wins on all 6 tabs |
| `admin` | No inline edit; gated `/admin/guides` |

## Verification checklist

1. Admin: add combo → **Publish** (not Save draft only).
2. Supabase: `content.heroGuideTabs` → `combos.body[]` contains `{ type: "combo", structuredSteps: [...] }`.
3. Hero page `/heroes/[slug]`: combo cards visible without `?preview=draft`.
4. Inline: Edit combos → builder → Publish → hard refresh matches admin data.
5. Server log: no `hero guide tabs parse failed` (or recovered via sanitize).

## Component library (combo editor)

| Module | Role |
|--------|------|
| `combo-editor/combo-block-editor.tsx` | Shared shell (admin + inline) |
| `combo-editor/combo-builder-editor.tsx` | Orchestrator |
| `combo-editor/combo-ability-palette.tsx` | Ability grid + tooltips |
| `combo-editor/combo-step-list.tsx` | Chain step rows |
| `combo-editor/combo-builder-metadata.tsx` | Name, difficulty, clip, etc. |
| `components/ui/rivals-disclosure.tsx` | Animated collapsible sections |
| `components/ui/rivals-editor-field.tsx` | Light-theme form fields |

Motion tokens: `--motion-*` in [`globals.css`](../src/app/globals.css); utilities `.collapse-grid`, `.panel-enter`, `.editor-disclosure`.
