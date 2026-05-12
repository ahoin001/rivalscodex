import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Hero,
  type HeroAbility,
  type HeroForm,
  heroSchema,
  heroesSchema,
} from "@/data/schema";
import { RIVALSCODEX_APP_SCHEMA } from "@/lib/supabase/constants";

const TABLE = "hero_codex";
const ABILITY_TABLE = "hero_ability";
const ASSET_TABLE = "hero_asset";
const FORM_TABLE = "hero_form";

const BASE_FORM_ID = "base";

type CodexRow = {
  hero_slug: string;
  payload: unknown;
  source: string | null;
  parsed_at: string | null;
  updated_at: string | null;
};

type AbilityRow = {
  ability_id: string;
  hero_slug: string;
  form_id: string | null;
  site_form_index: number | null;
  site_order: number | null;
  category: string | null;
  name: string;
  keybind: string | null;
  description: string | null;
  damage: string | null;
  cooldown_seconds: number | null;
  icon_url: string | null;
  keybind_icon_url: string | null;
  stats: unknown;
};

type FormRow = {
  hero_slug: string;
  form_id: string;
  name: string;
  short_label: string | null;
  site_form_index: number | null;
  health: number | null;
  portrait_image: string | null;
  is_default: boolean;
  sort_order: number;
  base_stat_rows: unknown;
};

function logCodexWarn(message: string, error?: { message?: string } | null) {
  console.warn(`[supabase] hero_codex ${message}`, error?.message ?? error ?? "");
}

function abilityFromRow(row: AbilityRow): HeroAbility {
  const normalizedStats = Array.isArray(row.stats)
    ? row.stats.filter(
      (item): item is { label: string; value: string } =>
        typeof item === "object"
        && item !== null
        && typeof (item as { label?: unknown }).label === "string"
        && typeof (item as { value?: unknown }).value === "string",
    )
    : undefined;

  return {
    id: row.ability_id,
    name: row.name,
    keybind: row.keybind ?? "Passive",
    type: row.category ?? "Ability",
    description: row.description ?? "",
    damage: row.damage ?? undefined,
    cooldownSeconds: row.cooldown_seconds ?? undefined,
    category: row.category ?? undefined,
    iconUrl: row.icon_url ?? undefined,
    keybindIconUrl: row.keybind_icon_url ?? undefined,
    stats: normalizedStats,
    siteOrder: row.site_order ?? undefined,
    siteFormIndex: row.site_form_index ?? undefined,
  };
}

async function fetchAbilitiesForSlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<AbilityRow[]> {
  const { data, error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(ABILITY_TABLE)
    .select(
      "ability_id,hero_slug,form_id,site_form_index,site_order,category,name,keybind,description,damage,cooldown_seconds,icon_url,keybind_icon_url,stats",
    )
    .eq("hero_slug", slug)
    .order("form_id", { ascending: true })
    .order("site_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    logCodexWarn(`ability read for "${slug}" failed`, error);
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) {
    throw new Error(`Ability read for "${slug}" returned non-array data.`);
  }

  return data as AbilityRow[];
}

async function fetchFormsForSlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<FormRow[]> {
  const { data, error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(FORM_TABLE)
    .select(
      "hero_slug,form_id,name,short_label,site_form_index,health,portrait_image,is_default,sort_order,base_stat_rows",
    )
    .eq("hero_slug", slug)
    .order("sort_order", { ascending: true })
    .order("form_id", { ascending: true });

  if (error) {
    logCodexWarn(`form read for "${slug}" failed`, error);
    throw new Error(error.message);
  }
  return Array.isArray(data) ? (data as FormRow[]) : [];
}

function baseStatRowsFromJson(value: unknown): HeroForm["baseStatRows"] {
  if (!Array.isArray(value)) return undefined;
  const rows = value.filter(
    (item): item is { label: string; value: string } =>
      typeof item === "object"
      && item !== null
      && typeof (item as { label?: unknown }).label === "string"
      && typeof (item as { value?: unknown }).value === "string",
  );
  return rows.length > 0 ? rows : undefined;
}

/**
 * Hydrate a codex payload with the normalized abilities + forms tables. Throws
 * when the codex row exists but the ability rows are missing — the codex is the
 * single source of truth and partial state is a bug worth surfacing.
 */
async function hydrateHeroWithNormalizedRows(
  supabase: SupabaseClient,
  hero: Hero,
): Promise<Hero> {
  const [abilityRows, formRows] = await Promise.all([
    fetchAbilitiesForSlug(supabase, hero.slug),
    fetchFormsForSlug(supabase, hero.slug),
  ]);

  if (abilityRows.length === 0) {
    throw new Error(`No normalized abilities found for "${hero.slug}".`);
  }

  const abilitiesByFormId = new Map<string, HeroAbility[]>();
  for (const row of abilityRows) {
    const key = row.form_id ?? BASE_FORM_ID;
    const list = abilitiesByFormId.get(key) ?? [];
    list.push(abilityFromRow(row));
    abilitiesByFormId.set(key, list);
  }

  // Heroes imported before the multi-form migration have a single 'base' form
  // row. We still emit them as `forms[]` only when the hero is multi-form
  // (more than the synthetic base) so single-form heroes' payloads stay flat.
  const multiForm = formRows.length > 1
    || (formRows.length === 1 && formRows[0].form_id !== BASE_FORM_ID);

  let forms: HeroForm[] | undefined;
  let defaultFormId: string | undefined;

  if (multiForm) {
    forms = formRows.map((row) => {
      const abilities = abilitiesByFormId.get(row.form_id) ?? [];
      const form: HeroForm = {
        id: row.form_id,
        name: row.name,
        shortLabel: row.short_label ?? undefined,
        health: row.health ?? hero.health,
        portraitImage: (row.portrait_image as HeroForm["portraitImage"]) ?? undefined,
        siteFormIndex: row.site_form_index ?? undefined,
        baseStatRows: baseStatRowsFromJson(row.base_stat_rows),
        abilities: abilities.length > 0 ? abilities : hero.abilities,
      };
      return form;
    });
    const defaultRow = formRows.find((r) => r.is_default) ?? formRows[0];
    defaultFormId = defaultRow.form_id;
  }

  const defaultAbilities = defaultFormId
    ? abilitiesByFormId.get(defaultFormId) ?? abilityRows.map(abilityFromRow)
    : abilityRows.map(abilityFromRow);

  return {
    ...hero,
    abilities: defaultAbilities,
    forms,
    defaultFormId,
  };
}

/**
 * Reads every codex row and returns a list of validated Hero records.
 * Returns `null` when the table is unavailable or empty so callers can fall back.
 */
export async function fetchHeroCodexAll(
  supabase: SupabaseClient,
): Promise<Hero[] | null> {
  const { data, error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(TABLE)
    .select("hero_slug,payload,source,parsed_at,updated_at");

  if (error) {
    logCodexWarn("select all failed", error);
    return null;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const heroes: Hero[] = [];
  for (const row of data as CodexRow[]) {
    const parsed = heroSchema.safeParse(row.payload);
    if (parsed.success) {
      heroes.push(await hydrateHeroWithNormalizedRows(supabase, parsed.data));
    } else {
      logCodexWarn(
        `payload for "${row.hero_slug}" failed validation; skipping`,
        { message: parsed.error.issues.map((i) => i.message).join("; ") },
      );
    }
  }

  if (heroes.length === 0) {
    return null;
  }

  const validated = heroesSchema.safeParse(heroes);
  return validated.success ? validated.data : heroes;
}

export async function fetchHeroCodexBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Hero | null> {
  const { data, error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(TABLE)
    .select("hero_slug,payload,source,parsed_at,updated_at")
    .eq("hero_slug", slug)
    .maybeSingle();

  if (error) {
    logCodexWarn(`select by slug "${slug}" failed`, error);
    return null;
  }

  if (!data?.payload) return null;

  const parsed = heroSchema.safeParse(data.payload);
  if (!parsed.success) {
    logCodexWarn(`payload for "${slug}" failed validation`, {
      message: parsed.error.issues.map((i) => i.message).join("; "),
    });
    return null;
  }
  return hydrateHeroWithNormalizedRows(supabase, parsed.data);
}

export type UpsertHeroCodexInput = {
  slug: string;
  payload: Hero;
  source?: string;
};

type AbilityWriteRow = {
  ability_id: string;
  hero_slug: string;
  form_id: string;
  site_form_index: number | null;
  site_order: number | null;
  category: string | null;
  name: string;
  keybind: string;
  description: string;
  damage: string | null;
  cooldown_seconds: number | null;
  icon_url: string | null;
  keybind_icon_url: string | null;
  stats: HeroAbility["stats"];
};

function abilityToWriteRow(
  hero: Hero,
  formId: string,
  ability: HeroAbility,
): AbilityWriteRow {
  return {
    ability_id: ability.id,
    hero_slug: hero.slug,
    form_id: formId,
    site_form_index: ability.siteFormIndex ?? null,
    site_order: ability.siteOrder ?? null,
    category: ability.category ?? ability.type ?? null,
    name: ability.name,
    keybind: ability.keybind,
    description: ability.description,
    damage: ability.damage ?? null,
    cooldown_seconds: ability.cooldownSeconds ?? null,
    icon_url: ability.iconUrl ?? null,
    keybind_icon_url: ability.keybindIconUrl ?? null,
    stats: ability.stats ?? [],
  };
}

/**
 * Build the full `(form_id → abilities)` map that should land in
 * `hero_ability`. Single-form heroes get a synthetic `base` form so the table
 * always carries `form_id` (matches the FK introduced in the multi-form
 * migration).
 */
function abilityWriteRowsForHero(hero: Hero): AbilityWriteRow[] {
  if (hero.forms && hero.forms.length > 0) {
    const rows: AbilityWriteRow[] = [];
    const seenIds = new Set<string>();
    for (const form of hero.forms) {
      for (const ability of form.abilities) {
        if (seenIds.has(ability.id)) continue;
        rows.push(abilityToWriteRow(hero, form.id, ability));
        seenIds.add(ability.id);
      }
    }
    return rows;
  }
  return hero.abilities.map((ability) =>
    abilityToWriteRow(hero, BASE_FORM_ID, ability),
  );
}

type FormWriteRow = {
  hero_slug: string;
  form_id: string;
  name: string;
  short_label: string | null;
  site_form_index: number | null;
  health: number | null;
  portrait_image: string | null;
  is_default: boolean;
  sort_order: number;
  base_stat_rows: HeroForm["baseStatRows"];
};

function formWriteRowsForHero(hero: Hero): FormWriteRow[] {
  if (hero.forms && hero.forms.length > 0) {
    return hero.forms.map((form, index) => ({
      hero_slug: hero.slug,
      form_id: form.id,
      name: form.name,
      short_label: form.shortLabel ?? null,
      site_form_index: form.siteFormIndex ?? null,
      health: form.health,
      portrait_image: form.portraitImage ?? null,
      is_default: form.id === hero.defaultFormId,
      sort_order: index,
      base_stat_rows: form.baseStatRows ?? [],
    }));
  }
  return [
    {
      hero_slug: hero.slug,
      form_id: BASE_FORM_ID,
      name: hero.name,
      short_label: null,
      site_form_index: 0,
      health: hero.health,
      portrait_image: hero.portraitImage,
      is_default: true,
      sort_order: 0,
      base_stat_rows: hero.baseStatRows ?? [],
    },
  ];
}

function mapAssetRows(hero: Hero) {
  const rows: Array<{
    hero_slug: string;
    asset_kind: string;
    asset_key: string;
    web_path: string;
  }> = [];

  const heroAssets: Array<{ kind: string; key: string; path?: string }> = [
    { kind: "hero-portrait", key: "portrait", path: hero.portraitImage },
    { kind: "hero-splash", key: "splash", path: hero.splashImage },
    { kind: "hero-frame", key: "frame", path: hero.frameImage },
    { kind: "hero-stack-logo", key: "stack-logo", path: hero.stackLogoImage },
  ];

  for (const asset of heroAssets) {
    if (!asset.path) continue;
    rows.push({
      hero_slug: hero.slug,
      asset_kind: asset.kind,
      asset_key: asset.key,
      web_path: asset.path,
    });
  }

  for (const ability of hero.abilities) {
    if (ability.iconUrl) {
      rows.push({
        hero_slug: hero.slug,
        asset_kind: "ability-icon",
        asset_key: ability.id,
        web_path: ability.iconUrl,
      });
    }
    if (ability.keybindIconUrl) {
      rows.push({
        hero_slug: hero.slug,
        asset_kind: "keybind-icon",
        asset_key: ability.id,
        web_path: ability.keybindIconUrl,
      });
    }
  }

  return rows;
}

async function upsertNormalizedForms(
  supabase: SupabaseClient,
  hero: Hero,
): Promise<void> {
  const rows = formWriteRowsForHero(hero);
  if (rows.length === 0) return;

  const validFormIds = new Set(rows.map((r) => r.form_id));

  // Drop forms that no longer exist on this hero (e.g. someone re-imported with
  // a different `defaultFormId` or fewer transformations). We can't just rely
  // on upsert because the new payload might shrink the set of forms.
  const { data: existingFormRows, error: existingFormsError } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(FORM_TABLE)
    .select("form_id")
    .eq("hero_slug", hero.slug);
  if (existingFormsError) {
    throw new Error(existingFormsError.message);
  }
  const stale = (existingFormRows ?? [])
    .map((r) => (r as { form_id: string }).form_id)
    .filter((id) => !validFormIds.has(id));

  if (stale.length > 0) {
    // Cascade FK on hero_ability(form_id) takes care of the matching ability rows.
    const { error: deleteStaleError } = await supabase
      .schema(RIVALSCODEX_APP_SCHEMA)
      .from(FORM_TABLE)
      .delete()
      .eq("hero_slug", hero.slug)
      .in("form_id", stale);
    if (deleteStaleError) {
      throw new Error(deleteStaleError.message);
    }
  }

  const { error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(FORM_TABLE)
    .upsert(rows, { onConflict: "hero_slug,form_id" });

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertNormalizedAbilities(
  supabase: SupabaseClient,
  hero: Hero,
): Promise<void> {
  const rows = abilityWriteRowsForHero(hero);
  if (rows.length === 0) return;

  // Delete by (hero_slug, form_id) so we don't strand abilities for forms that
  // shrank between imports.
  const { error: deleteError } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(ABILITY_TABLE)
    .delete()
    .eq("hero_slug", hero.slug);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(ABILITY_TABLE)
    .upsert(rows, { onConflict: "ability_id" });

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertNormalizedAssets(
  supabase: SupabaseClient,
  hero: Hero,
): Promise<void> {
  const rows = mapAssetRows(hero);

  const { error: deleteError } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(ASSET_TABLE)
    .delete()
    .eq("hero_slug", hero.slug);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (rows.length === 0) return;

  const { error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(ASSET_TABLE)
    .upsert(rows, { onConflict: "hero_slug,asset_kind,asset_key" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertHeroCodex(
  supabase: SupabaseClient,
  input: UpsertHeroCodexInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = heroSchema.safeParse(input.payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  const { error } = await supabase
    .schema(RIVALSCODEX_APP_SCHEMA)
    .from(TABLE)
    .upsert(
      {
        hero_slug: input.slug,
        payload: parsed.data,
        hero_name: parsed.data.name,
        hero_role: parsed.data.role,
        hero_real_name: parsed.data.realName ?? null,
        hero_difficulty: parsed.data.difficulty,
        hero_health: parsed.data.health,
        portrait_image: parsed.data.portraitImage,
        splash_image: parsed.data.splashImage,
        frame_image: parsed.data.frameImage ?? null,
        stack_logo_image: parsed.data.stackLogoImage ?? null,
        default_form_id: parsed.data.defaultFormId ?? null,
        source: input.source ?? "marvel-official-html",
        parsed_at: new Date().toISOString(),
      },
      { onConflict: "hero_slug" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  try {
    // Order matters: hero_ability.form_id has a FK to hero_form(hero_slug, form_id).
    await upsertNormalizedForms(supabase, parsed.data);
    await upsertNormalizedAbilities(supabase, parsed.data);
    await upsertNormalizedAssets(supabase, parsed.data);
  } catch (normalizedError) {
    return {
      ok: false,
      error: normalizedError instanceof Error
        ? normalizedError.message
        : "Failed to upsert normalized codex rows.",
    };
  }

  return { ok: true };
}
