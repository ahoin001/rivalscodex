import { NextResponse } from "next/server";
import type { Hero, HeroAbility, HeroForm } from "@/data/schema";
import { heroSchema } from "@/data/schema";
import { overlayCatalogTeamUpAbilities } from "@/features/heroes/team-up-loadouts";
import { heroAssetPaths as buildHeroAssetPaths } from "@/lib/rivals-assets-paths";
import type { ApplySkeletonBody } from "./schemas";
import {
  downloadFormPortrait,
  downloadHeroAsset,
  type AssetDownloadLedger,
} from "./assets";
import { buildAbilitiesFromInput } from "./ability-records";
import {
  buildNewHeroFromTemplate,
  findExistingHero,
  healthFromBaseStatRows,
  logHeroImportEvent,
  persistHero,
  todayIsoDate,
} from "./persist";

function mergeWithExisting(
  newRecord: HeroAbility,
  existingAbility: HeroAbility | undefined,
): HeroAbility {
  if (!existingAbility) return newRecord;
  const recordHasFreshDescription =
    newRecord.description !== "Ability description pending detail capture.";
  const recordHasFreshStats = (newRecord.stats?.length ?? 0) > 0;
  return {
    ...existingAbility,
    ...newRecord,
    description: recordHasFreshDescription
      ? newRecord.description
      : existingAbility.description ?? newRecord.description,
    damage: newRecord.damage ?? existingAbility.damage,
    cooldownSeconds: newRecord.cooldownSeconds ?? existingAbility.cooldownSeconds,
    stats: recordHasFreshStats ? newRecord.stats : existingAbility.stats ?? newRecord.stats,
  };
}

export async function handleApplySkeleton(body: ApplySkeletonBody): Promise<Response> {
  const ledger: AssetDownloadLedger = {
    writtenFiles: [],
    refreshedFiles: [],
    skippedCount: 0,
  };
  const warnings: string[] = [];
  const forceRefresh = body.forceRefreshAssets ?? false;

  const existingLookup = await findExistingHero(body.slug);
  const existing: Hero | undefined = existingLookup.hero;
  if (existingLookup.warning) {
    warnings.push(existingLookup.warning);
  }

  const codexAssetPaths = buildHeroAssetPaths(body.slug);

  if (body.downloadAssets) {
    const pairs: { url: string; filename: string }[] = [
      { url: body.urls.frame!, filename: `${body.slug}-frame.png` },
      { url: body.urls.heroImage!, filename: `${body.slug}.png` },
      { url: body.urls.stackLogo!, filename: `${body.slug}-stack-logo.png` },
    ];
    for (const { url, filename } of pairs) {
      try {
        await downloadHeroAsset(url, body.slug, filename, ledger, forceRefresh);
      } catch (error) {
        return NextResponse.json(
          {
            error: `Failed to download ${filename}: ${
              error instanceof Error ? error.message : "unknown"
            }`,
          },
          { status: 400 },
        );
      }
    }
  }

  const baseHero: Hero = existing
    ? {
        ...existing,
        name: body.name,
        role: body.role,
        realName: body.realName?.trim() || undefined,
        summary: body.summary,
        portraitImage: codexAssetPaths.portraitImage,
        splashImage: codexAssetPaths.splashImage,
        frameImage: codexAssetPaths.frameImage,
        stackLogoImage: codexAssetPaths.stackLogoImage,
        updatedAt: todayIsoDate(),
      }
    : await buildNewHeroFromTemplate(body.slug, {
        name: body.name,
        role: body.role,
        summary: body.summary,
        realName: body.realName,
      });

  let heroForms: HeroForm[] | undefined;
  let heroDefaultFormId: string | undefined;
  let newAbilities: HeroAbility[];

  if (body.forms && body.forms.length > 0) {
    const builtForms: HeroForm[] = [];
    for (const formInput of body.forms) {
      let portraitImage: string | undefined;
      if (formInput.portraitUrl && body.downloadAssets) {
        try {
          portraitImage = await downloadFormPortrait(
            formInput.portraitUrl,
            body.slug,
            formInput.formId,
            ledger,
            forceRefresh,
          );
        } catch (error) {
          warnings.push(
            `Failed to download portrait for form "${formInput.label}": ${
              error instanceof Error ? error.message : "unknown"
            }`,
          );
        }
      }

      const formAbilitiesRaw = await buildAbilitiesFromInput({
        heroSlug: body.slug,
        formId: formInput.formId,
        abilityInputs: formInput.abilities,
        ledger,
        warnings,
        forceRefresh,
      });

      const formAbilities = formAbilitiesRaw.map((record) =>
        mergeWithExisting(
          record,
          existing?.forms?.find((form) => form.id === formInput.formId)?.abilities.find(
            (ability) => ability.id === record.id,
          ) ?? existing?.abilities.find((ability) => ability.id === record.id),
        ),
      );

      const rows = formInput.baseStatRows;
      const derivedHealth =
        rows && rows.length > 0 ? healthFromBaseStatRows(rows) : undefined;

      builtForms.push({
        id: formInput.formId,
        name: formInput.label,
        shortLabel: formInput.shortLabel,
        siteFormIndex: formInput.siteFormIndex,
        portraitImage: portraitImage as HeroForm["portraitImage"],
        health: derivedHealth ?? baseHero.health,
        baseStatRows: rows && rows.length > 0 ? rows : undefined,
        abilities: formAbilities,
      });
    }

    const defaultForm =
      builtForms.find((_, index) => body.forms![index].isDefault) ?? builtForms[0];
    heroForms = builtForms;
    heroDefaultFormId = defaultForm.id;
    newAbilities = defaultForm.abilities;
  } else {
    const built = await buildAbilitiesFromInput({
      heroSlug: body.slug,
      abilityInputs: body.abilities,
      ledger,
      warnings,
      forceRefresh,
    });
    newAbilities = built.map((record) =>
      mergeWithExisting(
        record,
        existing?.abilities.find((ability) => ability.id === record.id),
      ),
    );
  }

  const attachCatalogTeamUps = (abilities: HeroAbility[]) =>
    overlayCatalogTeamUpAbilities(abilities, body.slug, body.role);

  if (heroForms) {
    heroForms = heroForms.map((form) => ({
      ...form,
      abilities: attachCatalogTeamUps(form.abilities),
    }));
    const defaultForm =
      heroForms.find((form) => form.id === heroDefaultFormId) ?? heroForms[0];
    newAbilities = defaultForm.abilities;
  }

  const finalAbilities = attachCatalogTeamUps(
    newAbilities.length > 0 ? newAbilities : baseHero.abilities,
  );
  let merged: Hero = {
    ...baseHero,
    abilities: finalAbilities,
    forms: heroForms,
    defaultFormId: heroDefaultFormId,
  };

  if (!heroForms) {
    const rows = body.baseStatRows;
    if (rows && rows.length > 0) {
      merged = { ...merged, baseStatRows: rows };
      const derivedHealth = healthFromBaseStatRows(rows);
      if (derivedHealth !== undefined) {
        merged = { ...merged, health: derivedHealth };
      }
    }
  } else {
    const defaultForm = heroForms.find((form) => form.id === heroDefaultFormId);
    if (defaultForm) {
      merged = { ...merged, health: defaultForm.health };
    }
    if (merged.baseStatRows) {
      merged = { ...merged, baseStatRows: undefined };
    }
  }

  const validation = heroSchema.safeParse(merged);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Hero payload failed schema validation.",
        details: validation.error.flatten(),
      },
      { status: 400 },
    );
  }

  const persist = await persistHero(validation.data);
  const allAbilities = validation.data.forms
    ? validation.data.forms.flatMap((form) => form.abilities)
    : validation.data.abilities;
  const detailsCount = allAbilities.filter((ability) => (ability.stats?.length ?? 0) > 0).length;
  const formsCount = validation.data.forms?.length ?? 0;

  await logHeroImportEvent({
    slug: body.slug,
    action: "apply-skeleton",
    ok: persist.supabaseStatus === "ok",
    details: {
      existingSource: existingLookup.source,
      formsCount,
      abilitiesCount: allAbilities.length,
      abilityDetailsCount: detailsCount,
      baseStatRowsCount: validation.data.baseStatRows?.length ?? 0,
      writtenFilesCount: ledger.writtenFiles.length,
      refreshedFilesCount: ledger.refreshedFiles.length,
      skippedFilesCount: ledger.skippedCount,
      warnings,
      supabaseStatus: persist.supabaseStatus,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: body.slug,
    created: !existing,
    formsCount,
    abilitiesCount: allAbilities.length,
    abilityDetailsCount: detailsCount,
    baseStatRowsCount: validation.data.baseStatRows?.length ?? 0,
    downloadAssets: body.downloadAssets,
    forceRefreshAssets: body.forceRefreshAssets ?? false,
    writtenFiles: ledger.writtenFiles,
    refreshedFiles: ledger.refreshedFiles,
    skippedFilesCount: ledger.skippedCount,
    warnings,
    supabase: { status: persist.supabaseStatus, error: persist.supabaseError },
    message: "Hero codex written.",
  });
}
