# RivalsCodex Design System

Marvel Rivals energetic dossier UI — gold ops chrome, clipped geometry, slanted display type, and role accents. Amplify wow; do not quiet into a generic dashboard.

HUD Assemble is the interaction layer: shared-element portrait morphs, clip-path ability/tab continuity, and user-started combo playback. Tony Stark is the *feel*, not a Jarvis overlay.

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

## Architecture layers

Keep concerns split so files stay small and reusable.

| Layer | Lives in | Owns |
|---|---|---|
| Tokens / motion | `src/app/globals.css`, `src/components/ui/motion.ts` | `--motion-*`, `--ease-*`. JS timing via `resolveMotionDurationMs` only |
| UI primitives | `src/components/ui` | Generic controls used in 2+ unrelated surfaces. No kit PNG chrome, no catalog parse, no route I/O |
| Feature compositions | `src/features/<domain>/components` | Screens that compose primitives. Feature-local helpers stay next to the feature |
| Adapters | `src/features/<domain>/*.ts`, `src/data` | JSON, schema, lookup, merge. UI never parses catalogs |

Reuse order: existing primitive → small new primitive → feature-local split.

**File caps:** UI files soft ~220 lines, hard ~320. One primary export per file. If a file mixes list + detail + view-model + motion + demo data, split before adding more. Do not dump hero-kit HUD into `components/ui`.

## Primitives

Import from `@/components/ui`.

- **Layout:** `RivalsPageShell`, `RivalsSectionHeader`, `RivalsFeatureSection`, `ClippedPanel`, `HudSection`
- **CTA:** Prefer `RivalsCta` (`context="chrome" | "lab"`). Legacy: `ClippedButton`, `RivalsBrandButton`, `RivalsClipAction`
- **Tabs / chips:** `RivalsTabBar` (chapter nav with gold underline), `RivalsClipSegment` (compact 2–n clip toggles), `RivalsPill`, `RivalsRoleBadge`, `RivalsKeyChip`
- **Content:** `StatRow`, `HudReadout`, `HudEmptyState`, `RivalsDataTableSection`, `RivalsHeroTitle`, `RivalsDisclosure`, `RivalsEditorField`
- **Motion helper:** `resolveMotionDurationMs` from `motion.ts` for JS-driven timing
- **Shared morphs:** `HeroPortraitTransition` from `@/features/heroes/transition` (`hero-portrait-${slug}`)
- **Hero-only:** `HeroPartnerLink` from `@/features/heroes/components` (portrait map + View Transition)

## Motion

Use CSS vars only:

- Durations: `--motion-instant|fast|medium|slow|stagger|exit`
- Easing: `--ease-out-soft` (arrivals), `--ease-out` (UI), `--ease-in-out` (on-screen morphs)

Rules:

- Pointer-driven morphs only. Keyboard tab/filter changes are instant (`RivalsTabBar` / `RivalsClipSegment` pass `source: "keyboard"`)
- No raw `duration-[Nms]`, no GSAP/Framer, no `transition-all`
- View Transition names live in `src/features/heroes/transition/`
- Do not animate search, role filters, favorites, or keyboard shortcuts
- Content must never stay at `opacity: 0` without a reduced-motion / no-JS fallback
- Cap scroll-reveal to major chapters
- Prefer transform/opacity/clip-path over layout thrash
- Respect `prefers-reduced-motion` (disable View Transitions and combo playback)
- Press feedback: `active:scale-[0.97]` at `--motion-fast`

## Hero detail IA

1. Splash (full-bleed art, giant name, jump rail: Abilities / Guide / Loadouts / Combos)
2. Abilities (immersive kit HUD)
3. Guide chapters: Gameplan / Kit / Loadouts / Combos / Matchups / Notes

Resources fold into Gameplan as a link rail. Legacy `resources` tabs migrate into overview.

## Checklist for new UI

1. Prefer tokens over raw hex
2. Prefer `RivalsCta` / existing primitives over one-off buttons
3. Extract to `components/ui` when a pattern appears in 2+ unrelated places; keep kit-only chrome in `features/heroes`
4. Keep role accents semantic; gold for global brand framing
5. Empty states use `HudEmptyState`; stat rows use `HudReadout` or `StatRow` with `tabular-nums`
6. Stay under the file cap; split subviews instead of growing a god component
