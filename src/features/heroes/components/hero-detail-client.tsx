"use client";

import { useMemo, useState } from "react";
import { Hero } from "@/data/schema";
import {
  getDefaultResolvedFormId,
  getResolvedHeroForms,
} from "@/features/heroes/hero-forms";
import { HeroFormSwitcher } from "@/features/heroes/components/hero-form-switcher";
import { HeroInfoTabs } from "@/features/heroes/components/hero-info-tabs";
import {
  buildIntelContentFromHero,
  HeroIntelConsole,
} from "@/features/heroes/components/hero-intel-console";
import { HeroSplash } from "@/features/heroes/components/hero-splash";
import { HeroStatsRail } from "@/features/heroes/components/hero-stats-rail";
import { featureFlags } from "@/lib/feature-flags";

type HeroDetailClientProps = {
  hero: Hero;
};

export function HeroDetailClient({ hero }: HeroDetailClientProps) {
  const forms = useMemo(() => getResolvedHeroForms(hero), [hero]);
  const [activeFormId, setActiveFormId] = useState(() => getDefaultResolvedFormId(hero));
  const activeForm = forms.find((form) => form.id === activeFormId) ?? forms[0];
  const hasTransformations = forms.length > 1;

  return (
    <>
      <HeroFormSwitcher
        forms={forms}
        activeFormId={activeForm.id}
        onFormChange={setActiveFormId}
      />
      <section className="grid gap-5 lg:grid-cols-[1.45fr_0.72fr] lg:items-start">
        <HeroSplash hero={hero} activeForm={activeForm} hasTransformations={hasTransformations} />
        <HeroStatsRail hero={hero} activeForm={activeForm} />
      </section>
      <HeroInfoTabs hero={hero} activeForm={activeForm} forms={forms} />
      {featureFlags.enableDevAdminUi && (
        <HeroIntelConsole
          heroName={hero.name}
          initialContent={buildIntelContentFromHero(hero)}
          allowAdminTools
        />
      )}
    </>
  );
}
