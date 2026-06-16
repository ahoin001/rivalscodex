import Link from "next/link";
import { getHeroes } from "@/lib/content-adapter";

export default async function AdminGuidesIndexPage() {
  const heroes = await getHeroes();
  const sorted = [...heroes].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold uppercase italic text-rivals-ink">
        Hero guides
      </h1>
      <p className="mt-2 text-sm text-rivals-ink-soft">
        Choose a hero to edit tabbed guide content. Publish to push changes live immediately.
      </p>
      <ul className="mt-8 divide-y divide-rivals-light-300 rounded border border-rivals-light-300 bg-white">
        {sorted.map((hero) => (
          <li key={hero.slug}>
            <Link
              href={`/admin/guides/${hero.slug}`}
              className="flex items-center justify-between px-4 py-3 text-rivals-ink transition-colors hover:bg-rivals-light-100"
            >
              <span className="font-medium">{hero.name}</span>
              <span className="text-xs uppercase tracking-wide text-rivals-ink-muted">
                {hero.role}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
