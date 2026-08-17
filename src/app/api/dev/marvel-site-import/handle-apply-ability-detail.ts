import { NextResponse } from "next/server";
import type { Hero, HeroAbility } from "@/data/schema";
import { heroSchema } from "@/data/schema";
import type { ApplyAbilityDetailBody } from "./schemas";
import { applyKnownStatLabels } from "./ability-records";
import {
  findExistingHero,
  logHeroImportEvent,
  persistHero,
  todayIsoDate,
} from "./persist";

export async function handleApplyAbilityDetail(
  body: ApplyAbilityDetailBody,
): Promise<Response> {
  const existingLookup = await findExistingHero(body.slug);
  if (!existingLookup.hero) {
    return NextResponse.json(
      { error: `No hero with slug "${body.slug}". Apply the skeleton first.` },
      { status: 404 },
    );
  }

  const hero = existingLookup.hero;
  const matchName = (ability: HeroAbility) =>
    ability.name.toLowerCase() === body.abilityName.toLowerCase();
  const abilityIdx = hero.abilities.findIndex(matchName);
  let matchingFormIdx = -1;
  let matchingFormAbilityIdx = -1;
  if (abilityIdx === -1 && hero.forms) {
    for (let formIndex = 0; formIndex < hero.forms.length; formIndex++) {
      const idx = hero.forms[formIndex].abilities.findIndex(matchName);
      if (idx !== -1) {
        matchingFormIdx = formIndex;
        matchingFormAbilityIdx = idx;
        break;
      }
    }
  }
  if (abilityIdx === -1 && matchingFormIdx === -1) {
    return NextResponse.json(
      {
        error: `No ability "${body.abilityName}" on "${body.slug}". Refresh the skeleton first.`,
      },
      { status: 404 },
    );
  }

  const mergeAbility = (ability: HeroAbility): HeroAbility =>
    applyKnownStatLabels(
      {
        ...ability,
        description: body.description?.trim() || ability.description,
      },
      body.stats,
    );

  let newHero: Hero;
  let merged: HeroAbility;
  if (abilityIdx !== -1) {
    merged = mergeAbility(hero.abilities[abilityIdx]!);
    const mergedAbility = merged;
    newHero = {
      ...hero,
      abilities: hero.abilities.map((ability, index) =>
        index === abilityIdx ? mergedAbility : ability,
      ),
      forms: hero.forms?.map((form) =>
        form.id === hero.defaultFormId
          ? {
              ...form,
              abilities: form.abilities.map((ability) =>
                matchName(ability) ? mergedAbility : ability,
              ),
            }
          : form,
      ),
      updatedAt: todayIsoDate(),
    };
  } else {
    const targetForm = hero.forms![matchingFormIdx];
    merged = mergeAbility(targetForm.abilities[matchingFormAbilityIdx]);
    const mergedAbility = merged;
    newHero = {
      ...hero,
      abilities: hero.abilities,
      forms: hero.forms!.map((form, formIndex) =>
        formIndex === matchingFormIdx
          ? {
              ...form,
              abilities: form.abilities.map((ability, abilityIndex) =>
                abilityIndex === matchingFormAbilityIdx ? mergedAbility : ability,
              ),
            }
          : form,
      ),
      updatedAt: todayIsoDate(),
    };
  }

  const validation = heroSchema.safeParse(newHero);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Hero payload failed schema validation after detail merge.",
        details: validation.error.flatten(),
      },
      { status: 400 },
    );
  }

  const persist = await persistHero(validation.data);

  await logHeroImportEvent({
    slug: body.slug,
    action: "apply-ability-detail",
    ok: persist.supabaseStatus === "ok",
    details: {
      existingSource: existingLookup.source,
      abilityName: merged.name,
      statsCount: merged.stats?.length ?? 0,
      supabaseStatus: persist.supabaseStatus,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: body.slug,
    abilityName: merged.name,
    statsCount: merged.stats?.length ?? 0,
    supabase: { status: persist.supabaseStatus, error: persist.supabaseError },
    message: "Ability detail merged.",
  });
}
