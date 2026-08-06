# RivalsCodex Design System

Marvel Rivals energetic dossier UI — gold ops chrome, clipped geometry, slanted display type, and role accents. Amplify wow; do not quiet into a generic dashboard.

## Surfaces

| Surface | Tokens / classes | Use when |
|---|---|---|
| Dark chrome | `--background`, `--panel`, `glass-panel`, `HudSection` | Nav, data bands, tactical panels |
| Spotlight / lab | `--surface-spotlight-*`, `.lab-light-theme`, `.sheet-panel` | Gallery spotlight, hero guide sheets |
| HUD panels | `--surface-hud`, `--surface-input` | Dark clipped panels and inputs |
| Brand gold | `--brand-gold*`, `--rivals-yellow-*` | Framing, CTAs, dividers, glow |

## Identity (do not dilute)

- Gold Ops gold (`#c9a25d` family)
- Clipped geometry (`.clipped-edge`, `.rivals-clip-tab`, `.rivals-clip-row` via `--clip-*`)
- Slanted display titles (`.slanted-title` + Barlow Condensed italic uppercase)
- Role triad: Vanguard cyan / Duelist red / Strategist teal (`--vanguard` / `--duelist` / `--strategist`; lab aliases `--rivals-*` point to the same values)
- Brand glow / divider / pulse for emphasis
- Dark chrome ↔ light spotlight contrast

## Primitives

Import from `@/components/ui`.

- **Layout:** `RivalsPageShell`, `RivalsSectionHeader`, `RivalsFeatureSection`, `ClippedPanel`, `HudSection`
- **CTA:** Prefer `RivalsCta` (`context="chrome" | "lab"`). Legacy: `ClippedButton`, `RivalsBrandButton`, `RivalsClipAction`
- **Tabs / chips:** `RivalsTabBar`, `RivalsPill`, `RivalsRoleBadge`, `RivalsKeyChip`
- **Content:** `StatRow`, `RivalsDataTableSection`, `RivalsHeroTitle`, `RivalsDisclosure`, `RivalsEditorField`
- **Motion helper:** `resolveMotionDurationMs` from `motion.ts` for JS-driven timing

## Motion

Use CSS vars only:

- Durations: `--motion-instant|fast|medium|slow|stagger`
- Easing: `--ease-out-soft`, `--ease-out`, `--ease-in`, `--ease-in-out`

Rules:

- Content must never stay at `opacity: 0` without a reduced-motion / no-JS fallback
- Cap scroll-reveal to major chapters
- Prefer transform/opacity over layout thrash
- Respect `prefers-reduced-motion`

## Hero detail IA

1. Splash (full-bleed art, giant name, jump rail)
2. Abilities
3. Guide chapters (Overview / Combos / Matchups / Resources)

## Checklist for new UI

1. Prefer tokens over raw hex
2. Prefer `RivalsCta` / existing primitives over one-off buttons
3. Extract to `components/ui` when a pattern appears in 2+ places
4. Keep role accents semantic; gold for global brand framing
