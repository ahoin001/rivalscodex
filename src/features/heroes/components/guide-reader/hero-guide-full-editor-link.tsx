import { RivalsClipAction } from "@/components/ui/rivals-clip-action";

type HeroGuideFullEditorLinkProps = {
  href: string;
  className?: string;
};

export function HeroGuideFullEditorLink({
  href,
  className = "",
}: HeroGuideFullEditorLinkProps) {
  return (
    <RivalsClipAction href={href} variant="surface" className={className}>
      <span aria-hidden className="text-sm leading-none">
        ↗
      </span>
      Open full tab editor
    </RivalsClipAction>
  );
}
