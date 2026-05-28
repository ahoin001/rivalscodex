import Image from "next/image";
import Link from "next/link";
import { Hero, HeroRole } from "@/data/schema";
import { ClippedPanel } from "@/components/ui/clipped-panel";
import { roleColorClass } from "@/features/heroes/role-utils";

type HeroCardProps = {
  hero: Hero;
  prioritizeImage?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (heroId: string) => void;
};

const roleAccentBar: Record<HeroRole, string> = {
  Vanguard: "bg-vanguard",
  Duelist: "bg-duelist",
  Strategist: "bg-strategist",
};

function DifficultyPips({ value }: { value: number }) {
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`Difficulty ${value} of 5`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
        Diff
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${
              index < value ? "bg-brand-gold shadow-[0_0_6px_rgb(var(--brand-gold-rgb)/80%)]" : "bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function FavoriteStarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-4 w-4 transition ${filled ? "fill-brand-gold text-brand-gold" : "fill-transparent text-brand-gold"}`}
    >
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        d="M12 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 14.9l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L12 2.5z"
      />
    </svg>
  );
}

export function HeroCard({
  hero,
  prioritizeImage = false,
  isFavorite,
  onToggleFavorite,
}: HeroCardProps) {
  const href = `/heroes/${hero.slug}`;

  return (
    <article className="group relative">
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`View ${hero.name} dossier`}
      >
        <ClippedPanel
          tone="sheet"
          className="brand-glow relative overflow-hidden transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_0_1px_rgb(var(--brand-gold-rgb)/55%),0_16px_40px_rgb(6_8_18/55%),0_0_42px_rgb(var(--brand-gold-rgb)/28%)]"
        >
        <span
          className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-1 ${roleAccentBar[hero.role]}`}
          aria-hidden
        />

        <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5]">
          <Image
            src={hero.portraitImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            quality={60}
            loading={prioritizeImage ? "eager" : "lazy"}
            fetchPriority={prioritizeImage ? "high" : "auto"}
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/55 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-gold/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute right-3 top-14 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/35 text-brand-gold opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h12M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 space-y-2.5 p-4 pt-16">
            <div className="flex items-end justify-between gap-3">
              <h3 className="slanted-title font-display text-[1.85rem] italic uppercase leading-[0.92] text-white drop-shadow-sm sm:text-[2rem]">
                <span>{hero.name}</span>
              </h3>
              <span
                className={`shrink-0 rounded border bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-sm ${roleColorClass[hero.role]}`}
              >
                {hero.role}
              </span>
            </div>

            <div className="brand-divider opacity-80" />

            <div className="flex items-center justify-between gap-3 text-white">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                  HP
                </span>
                <span className="font-display text-xl italic leading-none text-brand-gold">
                  {hero.health}
                </span>
              </div>
              <DifficultyPips value={hero.difficulty} />
            </div>
          </div>
        </div>
        </ClippedPanel>
      </Link>

      <button
        type="button"
        onClick={() => onToggleFavorite(hero.id)}
        aria-label={isFavorite ? `Remove ${hero.name} from favorites` : `Add ${hero.name} to favorites`}
        aria-pressed={isFavorite}
        className={`absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition ${
          isFavorite
            ? "border-brand-gold bg-brand-gold/95 shadow-[0_0_14px_rgb(var(--brand-gold-rgb)/50%)]"
            : "border-white/25 bg-black/45 hover:border-brand-gold hover:bg-black/65"
        }`}
      >
        <FavoriteStarIcon filled={isFavorite} />
      </button>
    </article>
  );
}
