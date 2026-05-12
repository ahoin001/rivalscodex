import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/data/schema";
import { ClippedPanel } from "@/components/ui/clipped-panel";
import { roleColorClass } from "@/features/heroes/role-utils";

type HeroCardProps = {
  hero: Hero;
  prioritizeImage?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (heroId: string) => void;
};

export function HeroCard({
  hero,
  prioritizeImage = false,
  isFavorite,
  onToggleFavorite,
}: HeroCardProps) {
  return (
    <ClippedPanel
      tone="sheet"
      className="brand-glow overflow-hidden transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="group relative h-52 w-full overflow-hidden">
        <Image
          src={hero.portraitImage}
          alt={`${hero.name} portrait`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          quality={55}
          loading={prioritizeImage ? "eager" : "lazy"}
          fetchPriority={prioritizeImage ? "high" : "auto"}
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-gold/15" />
        <button
          type="button"
          onClick={() => onToggleFavorite(hero.id)}
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          className={`absolute right-3 top-3 rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide transition ${
            isFavorite
              ? "border-brand-gold bg-brand-gold text-rivals-ink"
              : "border-brand-gold/55 bg-background/85 text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-rivals-ink"
          }`}
        >
          {isFavorite ? "Favorited" : "Favorite"}
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="slanted-title font-display text-3xl italic uppercase leading-none">
            <span>{hero.name}</span>
          </h3>
          <span
            className={`rounded border px-2 py-1 text-xs font-semibold uppercase ${roleColorClass[hero.role]}`}
          >
            {hero.role}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{hero.summary}</p>
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
          <span>HP {hero.health}</span>
          <span>Difficulty {hero.difficulty}/5</span>
        </div>
        <Link
          href={`/heroes/${hero.slug}`}
          className="clipped-edge inline-flex w-full items-center justify-center border border-brand-gold/55 bg-brand-gold-muted px-4 py-2 text-sm font-semibold uppercase tracking-wide text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold hover:text-rivals-ink"
        >
          Open Dossier
        </Link>
      </div>
    </ClippedPanel>
  );
}
