# RivalsCodex

RivalsCodex is a Next.js hero reference for **Marvel Rivals** — a fast in-match codex for abilities, combo routes, playstyle notes, and role filters. Hero dossier data lives in Supabase (and assets on disk); **tabbed hero guides** (combos, overview, playstyle, etc.) are edited in the browser and stored as editorial content.

---

## Quick start

```bash
npm install
cp .env.example .env
# Required for heroes + guide editing (see Environment setup below)
npm run dev
```

Open `http://localhost:3000` for the gallery.

---

## How to add a new hero (HTML scraper)

This is the primary workflow for bringing a hero into the codex. It uses the **Marvel Site HTML Import** dev tool to parse official [marvelrivals.com](https://www.marvelrivals.com) hero pages, download images, and upsert the hero into Supabase.

### Prerequisites

1. **Development server only** — the import UI is not available in production builds.
2. **Supabase configured** in `.env`:
   ```env
   NEXT_PUBLIC_ENABLE_SUPABASE=true
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run `npm run dev`.

Without Supabase, the app cannot load or save codex heroes (`getHeroes` reads from the `hero_codex` tables).

### Step 1 — Open the import tool

Go to **`http://localhost:3000/dev/marvel-html-import`**

(From the home page in dev, you can also use the **Dev Endpoint Panel** section → related dev links.)

### Step 2 — Copy HTML from the official site

1. Open the hero on **marvelrivals.com** (e.g. `https://www.marvelrivals.com/en-us/heroes/daredevil` — use the live URL pattern on the site).
2. Open **DevTools** (F12) → **Elements**.
3. Select the hero section markup (the parser expects the official page structure: hero header, `.abilties-wrap`, ability rows, etc.).
4. **Copy outer HTML** of the relevant container (or a large subtree that includes hero name, intro, images, and abilities).

**Tip:** For the first pass, copy a broad chunk of the hero page inner content. The tool’s **Parse HTML** button extracts slug, role, name, summary, image URLs, and the ability skeleton for the active form.

### Step 3 — Parse and review

1. Paste into **“Paste hero HTML from marvelrivals.com”**.
2. Click **Parse HTML**.
3. Review **Preview — edit before apply**:
   - **Slug** — lowercase hyphenated id (e.g. `daredevil`). Used in URLs `/heroes/[slug]` and asset folder `public/rivals-assets/heros/<slug>/`.
   - **Role** — Vanguard / Duelist / Strategist.
   - **Hero name** — display name on cards and headers.
   - **Real name** — optional.
   - **Summary** — short bio (keep to ~1–2 sentences for gallery cards).
   - **Frame / hero / stack logo URLs** — parsed from the page; required if **Download images** is checked.

Fix anything the parser got wrong before applying.

### Step 4 — Ability details (recommended)

The initial parse captures **ability skeletons** (name, keybind, category, icon URL). For full dossier quality, add **per-ability detail**:

1. On marvelrivals.com, **click an ability** to open its detail panel.
2. In DevTools, copy the **`.abilties-r.jnsx`** block for that ability.
3. In the import UI, find that ability in the form card → paste into its detail editor → **Parse detail**.
4. Repeat for each ability you care about (description + stat rows).

The footer shows **`X/Y abilities with detail`** — aim for all core kit abilities before Apply.

### Step 5 — Multi-form heroes (Magik, Hulk, Jeff, etc.)

If the hero has **form tabs** on the official site:

1. The first **Parse HTML** only fills the **active** form card.
2. Additional **Form** cards appear as placeholders.
3. For each other form: click that form’s **circular tab** on marvelrivals.com → copy its **`.abilties-wrap`** block → paste into that card → **Parse this form**.
4. Mark exactly one form as **Default form** (loads first on the hero page).

### Step 6 — Apply

1. Leave **Download images** enabled unless files already exist on disk (writes to `public/rivals-assets/heros/<slug>/` and `.../icons/`).
2. After a game patch, check **Replace existing images** to overwrite PNGs already on disk.
3. Click **Apply**.

One round-trip will:

- Download missing hero/frame/stack/ability images
- Upsert **`hero_codex`**, **`hero_form`**, **`hero_ability`**, and **`hero_asset`** in Supabase
- Revalidate caches so the hero shows up immediately

Success message looks like: `Created hero.` or `Updated hero.` with ability/form counts and `Supabase ok.`

### Step 7 — Verify

1. **Home gallery** — `http://localhost:3000/` — hero should appear in **Hero Codex**.
2. **Hero page** — `http://localhost:3000/heroes/<slug>` — showcase, abilities panel, and guide tabs (guide content starts from auto-generated fallbacks until you edit it).

### Re-sync an existing hero (dev)

On any hero page in development (`/heroes/[slug]`), use **Sync from Marvel site** in the top toolbar. Paste fresh HTML from marvelrivals.com, parse, and apply — the slug is locked to the current hero. Enable **Replace existing images** when official art or ability icons changed.

The standalone import tool at `/dev/marvel-html-import` still works for adding new heroes.

### Optional — Snapshot to JSON

To backup codex rows into the repo:

```bash
npm run snapshot:codex
```

Writes `src/data/heroes.json` from Supabase (requires service role key).

### Alternative — Manual JSON draft

If you cannot use the scraper:

```bash
npm run draft-hero -- hero-slug "Hero Name" Vanguard
npm run generate-hero-images
# merge src/data/drafts/<slug>.json into src/data/heroes.json
npm run validate-content
```

See [`docs/content-workflow.md`](docs/content-workflow.md). You still need Supabase codex rows for the live app unless you change the content adapter.

---

## How to edit that hero’s page

A hero page has two layers:

| Layer | What it is | Where it’s stored |
|-------|------------|-------------------|
| **Dossier** | Abilities, stats, images, playstyle in JSON shape | Supabase codex (from scraper **Apply**) |
| **Guide** | Tabbed content: combos, overview, playstyle notes, etc. | Supabase `hero_editorial` → `heroGuideTabs` |

Re-importing HTML updates the **dossier**. Combo notation and guide copy are edited separately below.

### A. Update dossier / abilities (re-scrape)

If patch changes abilities or art:

1. Repeat [How to add a new hero](#how-to-add-a-new-hero-html-scraper) with the **same slug**.
2. **Apply** again — it **updates** the existing codex row and refreshes assets.

### B. Edit the hero guide (combos, overview, …)

Guide editing is controlled by `NEXT_PUBLIC_GUIDE_EDIT_POLICY` (default: **`personal`**).

#### Personal mode (default — no login)

1. Open **`/heroes/<slug>`** (e.g. `/heroes/daredevil`).
2. Scroll to the **Hero Guide** section and pick a tab.

**Combos (inline editor)**

1. Open **Combos & Synergies**.
2. Click **Edit combos**.
3. **+ Add combo** or **Edit** on a route card.
4. In the **combo builder**:
   - Click abilities from the **palette** (requires dossier abilities from import).
   - Set step **modifiers** (tap, hold, cancel, …).
   - Set **name**, **difficulty**, **tags** (e.g. `275`, `Burst`), **condition**, **notes**, optional **YouTube clip**.
5. Wait ~1.5s — **Saved** pill (bottom-right). Changes go to **published** editorial.

**Other tabs (overview, playstyle, …)**

- Use **Open full tab editor** at the bottom of the guide (when Supabase is on) → `/admin/guides/<slug>`.
- Or go directly to **`/admin/guides`** → select the hero → edit any tab → **Save draft** / **Publish**.

#### Admin mode (when sharing the site publicly)

Set in `.env`:

```env
NEXT_PUBLIC_GUIDE_EDIT_POLICY=admin
```

- No inline **Edit combos** on hero pages.
- All guide editing via **`/admin/guides`** (login required).
- **Save draft** → preview at `/heroes/<slug>?preview=draft` while signed in.
- **Publish** → live for all readers.

**Editor access:** `/admin/login` — in production set `profiles.is_guide_editor = true` on your Supabase user.

### Guide edit requirements

```env
NEXT_PUBLIC_ENABLE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # personal mode auto-save without login
```

If Supabase is off, guide edits save to **localStorage only** in that browser (`rivalscodex.guide-tabs.v1.<slug>`).

### Combo block reference

| Field | Purpose |
|-------|---------|
| `name` | Route title (e.g. “275 Burst”) |
| `structuredSteps` | Icon chain from combo builder |
| `difficulty` | `bread-and-butter`, `intermediate`, `advanced`, `team` |
| `tags` | Up to 4 filter chips (e.g. `275`, `Overtime`) |
| `condition` | Short prereq line |
| `notes` | Longer combo commentary |
| `clip` | Optional YouTube embed |

---

## What the app does

| Area | Route | Description |
|------|--------|-------------|
| **Hero gallery** | `/` | Browse indexed heroes with role filters, search, and favorites. |
| **Hero page** | `/heroes/[slug]` | Showcase, abilities panel, **Hero Guide** tabs. Dev: **Sync from Marvel site** drawer for re-scrapes. |
| **HTML import (dev)** | `/dev/marvel-html-import` | Scrape marvelrivals.com → codex. |
| **Admin guides** | `/admin/guides` | Full tab editor for guide content. |
| **Design lab** | `/lab/hero-card` | Layout sandbox. |
| **Dev API** | `/dev/endpoints` | Test Marvel Rivals API routes (dev only). |

### Reader features

- Structured **combo chains** with icons, keybinds, modifiers, difficulty/tags, clips.
- **Combo route cards** — collapsed preview, expand for full notation; filter by tier/tag.
- **Ability tooltips** — hover (desktop) / tap (mobile).
- **Favorites** — localStorage (`rivalscodex.favorites.v1`).

---

## Asset layout

All runtime and UI assets live under **`public/rivals-assets/`** (served at `/rivals-assets/...`):

| Path | Contents |
|------|----------|
| `public/rivals-assets/heros/<slug>/` | Scraped hero portraits, frames, stack logos, form art, ability icons |
| `public/rivals-assets/frames/` | Shared UI frames (hero showcase, abilities background) |
| `public/rivals-assets/icons/` | Shared keybind icons (LMB, RMB, etc.) |

Canonical URL helpers: [`src/lib/rivals-assets-paths.ts`](src/lib/rivals-assets-paths.ts). Design reference PNGs are in [`docs/design-reference/`](docs/design-reference/).

---

## Core scripts

- `npm run dev` — local development (required for HTML import)
- `npm run build` / `npm run start` — production
- `npm run lint` — ESLint
- `npm run draft-hero -- hero-slug "Hero Name" Vanguard` — manual JSON draft
- `npm run generate-hero-images` — placeholder `.webp` art
- `npm run validate-content` — schema checks
- `npm run snapshot:codex` — Supabase codex → `src/data/heroes.json`
- `npm run sync:heroes:dry-run` / `npm run sync:heroes` — optional API sync
- `npm run lighthouse:ci` — Lighthouse CI

---

## Environment setup

Copy [`.env.example`](.env.example) to `.env`.

### Required for add-hero + guide editing

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_ENABLE_SUPABASE` | `true` — codex + editorial |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client/server key |
| `SUPABASE_SERVICE_ROLE_KEY` | Import **Apply**, personal-mode guide saves |

### Guide policy

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GUIDE_EDIT_POLICY` | `personal` (default) or `admin` |
| `NEXT_PUBLIC_ALLOW_DEV_GUIDE_EDIT` | Set `false` to require `is_guide_editor` in dev |

### Optional

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_ENABLE_EXTERNAL_APIS` / `NEXT_PUBLIC_PREFER_API_CONTENT` | Marvel Rivals API enrichment |
| `MARVEL_RIVALS_API_KEY` | Live roster / sync |
| `SUPABASE_USE_ROSTER_SNAPSHOT` | Prefer Postgres roster snapshot |

---

## UI & docs

- Shared UI: `src/components/ui/index.ts`
- Patch-day checklist: [`docs/content-workflow.md`](docs/content-workflow.md)
- Draft preview & publish: [`docs/predictability.md`](docs/predictability.md)
- UI patterns: [`docs/ui-patterns.md`](docs/ui-patterns.md)
- API rollout: [`docs/api-rollout-runbook.md`](docs/api-rollout-runbook.md)
