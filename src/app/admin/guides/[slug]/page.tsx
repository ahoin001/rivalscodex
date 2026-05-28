import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroGuideEditor } from "@/features/heroes/components/hero-guide-editor";
import { loadHeroGuideEditorState } from "@/features/heroes/loaders/hero-guide-editor-load";
import { buildAbilityLookup } from "@/features/heroes/ability-lookup";
import { AbilityLookupProvider } from "@/features/heroes/components/ability-lookup-provider";

type AdminGuideEditPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminGuideEditPage({ params }: AdminGuideEditPageProps) {
  const { slug } = await params;
  const state = await loadHeroGuideEditorState(slug);

  if (!state) {
    notFound();
  }

  const allAbilities = state.hero.forms
    ? state.hero.forms.flatMap((f) => f.abilities)
    : state.hero.abilities;

  const abilityEntries = Array.from(
    buildAbilityLookup(allAbilities).entries(),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/guides"
        className="text-xs font-semibold uppercase tracking-wide text-rivals-ink-soft underline hover:text-rivals-ink"
      >
        All heroes
      </Link>
      <div className="mt-6 rounded border border-rivals-light-300 bg-white p-4 sm:p-6">
        <AbilityLookupProvider entries={abilityEntries}>
          <HeroGuideEditor
            heroSlug={state.hero.slug}
            heroName={state.hero.name}
            initialTabs={state.initialTabs}
            publishedTabs={state.publishedTabs}
          />
        </AbilityLookupProvider>
      </div>
    </div>
  );
}
