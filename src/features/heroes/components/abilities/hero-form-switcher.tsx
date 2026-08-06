"use client";

import { ClippedButton, RivalsPill } from "@/components/ui";
import { ResolvedHeroForm } from "@/features/heroes/hero-forms";

type HeroFormSwitcherProps = {
  forms: ResolvedHeroForm[];
  activeFormId: string;
  onFormChange: (formId: string) => void;
};

export function HeroFormSwitcher({
  forms,
  activeFormId,
  onFormChange,
}: HeroFormSwitcherProps) {
  if (forms.length <= 1) {
    return null;
  }

  return (
    <section className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">Transformation Forms</p>
      <div className="hidden flex-wrap gap-2 md:flex">
        {forms.map((form) => {
          const isActive = form.id === activeFormId;
          return (
            <ClippedButton
              key={form.id}
              active={isActive}
              tone="brand"
              className="flex items-center gap-2"
              onClick={() => onFormChange(form.id)}
            >
              {form.shortLabel ?? form.name}
              <RivalsPill>{`HP ${form.health}`}</RivalsPill>
            </ClippedButton>
          );
        })}
      </div>
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {forms.map((form) => {
            const isActive = form.id === activeFormId;
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => onFormChange(form.id)}
                className={`shrink-0 rounded border px-3 py-2 text-left ${
                  isActive
                    ? "border-brand-gold bg-brand-gold text-[#10131f]"
                    : "border-brand-gold/45 bg-brand-gold-muted text-brand-gold"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {form.shortLabel ?? form.name}
                </p>
                <p className="text-[11px] uppercase tracking-wide opacity-90">{`HP ${form.health}`}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
