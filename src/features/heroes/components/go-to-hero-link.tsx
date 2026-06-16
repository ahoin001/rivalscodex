import { RivalsClipAction } from "@/components/ui/rivals-clip-action";

type GoToHeroLinkProps = {
  heroSlug: string;
  heroName: string;
  className?: string;
};

export function GoToHeroLink({
  heroSlug,
  heroName,
  className = "",
}: GoToHeroLinkProps) {
  return (
    <RivalsClipAction
      href={`/heroes/${heroSlug}`}
      variant="gold-outline"
      className={className}
    >
      Go to {heroName}
    </RivalsClipAction>
  );
}
