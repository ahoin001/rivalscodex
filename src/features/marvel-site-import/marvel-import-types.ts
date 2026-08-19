import type {
  MarvelSiteAbility,
  MarvelSiteAbilityStat,
} from "@/lib/marvel-official-html";

/** UI-side ability shape; mirrors `MarvelSiteAbility` but allows in-place edits. */
export type MarvelImportAbility = Omit<MarvelSiteAbility, "siteOrder"> & {
  siteOrder: number | null;
};

export type MarvelImportAbilityDetail = {
  description: string;
  stats: MarvelSiteAbilityStat[];
};

export function toImportAbility(ability: MarvelSiteAbility): MarvelImportAbility {
  return { ...ability };
}

export function isImportTeamUpAbility(
  ability: Pick<MarvelImportAbility, "category" | "teamUpVariant">,
): boolean {
  if (ability.teamUpVariant) return true;
  const haystack = (ability.category ?? "").toLowerCase();
  return haystack.includes("team-up") || haystack.includes("team up");
}

/**
 * One Team-Up partner path. The site only renders the selected `.lx-hero`;
 * remaining portraits need their own paste after the operator switches.
 */
export type MarvelImportTeamUpPath = {
  partnerIndex: number;
  portraitUrl?: string;
  /** Editable; inferred from detail copy or the loadout catalog. */
  partnerName?: string;
  pasteHtml: string;
  abilities: MarvelImportAbility[];
  details: Record<number, MarvelImportAbilityDetail | undefined>;
  detailMessages: Record<number, string | undefined>;
  parseWarnings: string[];
};

/**
 * One form in the multi-form import flow. Single-form heroes still pass through
 * here with a synthetic `formId: 'base'` entry — the panel collapses that case
 * to the legacy single-form POST shape before sending.
 */
export type MarvelImportFormDraft = {
  /** Stable slug for the form (e.g. `form-1`, `darkchild`). */
  formId: string;
  /** Display label shown on the runtime form-tab strip. */
  label: string;
  /** Optional short label for compact UI surfaces. */
  shortLabel?: string;
  /** `data-type` on the form's `xt-wrap > a` tab. 0 for single-form heroes. */
  siteFormIndex: number;
  /** Form portrait badge URL (from `.xt-wrap > a > img`). */
  portraitUrl?: string;
  /** Exactly one form must carry `isDefault: true` when there is more than one form. */
  isDefault: boolean;
  /** Per-form kit skeleton (Team-Ups live on `teamUpPaths`). */
  abilities: MarvelImportAbility[];
  /** Per-ability detail state keyed by the ability's index in `abilities`. */
  details: Record<number, MarvelImportAbilityDetail | undefined>;
  /** Per-row hint/error message keyed by ability index. */
  detailMessages: Record<number, string | undefined>;
  /** Per-form base stats from the form's `.abilties-r.jcsx` panel. */
  baseStatRows: MarvelSiteAbilityStat[];
  /** Persistent paste-box content so the user can edit/re-parse without retyping. */
  pasteHtml: string;
  /** Parse warnings surfaced under the card after the latest parse. */
  parseWarnings: string[];
  /** One slot per `.lx-hero` portrait. Empty when the paste had no Team-Up switcher. */
  teamUpPaths: MarvelImportTeamUpPath[];
};
