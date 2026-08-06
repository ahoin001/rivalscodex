import Image from "next/image";
import { RivalsHeroTitle } from "@/components/ui";
import { RivalsClipAction } from "@/components/ui/rivals-clip-action";
import { RIVALS_FRAMES, RIVALS_LUNA } from "@/lib/rivals-assets-paths";

type LunaHeroCardProps = {
  className?: string;
};

const StrategistIcon = () => (
  <svg
    viewBox="0 0 64 64"
    aria-hidden
    className="h-8 w-8 text-rivals-vanguard sm:h-10 sm:w-10 lg:h-12 lg:w-12"
  >
    <g
      stroke="currentColor"
      strokeWidth="2.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="32" cy="32" r="22" />
      <circle cx="32" cy="32" r="14" />
      <path d="M32 4 L32 16" />
      <path d="M32 48 L32 60" />
      <path d="M4 32 L16 32" />
      <path d="M48 32 L60 32" />
      <path d="M14 14 L22 22" />
      <path d="M50 50 L42 42" />
      <path d="M14 50 L22 42" />
      <path d="M50 14 L42 22" />
    </g>
    <circle cx="32" cy="32" r="3" fill="currentColor" />
  </svg>
);

export function LunaHeroCard({ className = "" }: LunaHeroCardProps) {
  return (
    <section
      className={`relative isolate w-full overflow-hidden bg-rivals-light-100 ${className}`.trim()}
      aria-label="Luna Snow hero card"
    >
      {/* Aspect-ratio container: taller on mobile so text and hero both fit, wider on desktop. */}
      <div className="relative w-full aspect-[5/7] sm:aspect-[16/10] lg:aspect-[21/9] min-h-[520px] sm:min-h-[560px] lg:min-h-[600px] xl:min-h-[680px]">
        {/* Layer 1: Base frame */}
        <Image
          src={RIVALS_FRAMES.hero}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden
          className="object-cover object-center"
        />

        {/* Layer 2: Luna silhouette / geometric overlay (right half) */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden sm:block sm:w-[64%] lg:w-[58%] xl:w-[54%]"
          aria-hidden
        >
          <Image
            src={RIVALS_LUNA.frame}
            alt=""
            fill
            sizes="(max-width: 1024px) 64vw, 58vw"
            className="object-cover object-right"
          />
        </div>

        {/* Mobile-only thinner silhouette band so it doesn't dominate the screen */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 sm:hidden h-[68%]"
          aria-hidden
        >
          <Image
            src={RIVALS_LUNA.frame}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[60%_top]"
          />
        </div>

        {/* Top + side soft fade so frame doesn't compete with text */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[20%] bg-gradient-to-b from-rivals-light-50/90 via-rivals-light-100/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[40%] bg-gradient-to-r from-rivals-light-50/95 via-rivals-light-100/55 to-transparent sm:block"
          aria-hidden
        />

        {/* Top utility row moved into the hero section */}
        <div className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-7 sm:py-4 lg:px-10">
          <RivalsClipAction href="/" variant="surface">
            <span aria-hidden>&larr;</span>
            Back To Home
          </RivalsClipAction>
          <p className="hidden text-[11px] uppercase tracking-[0.28em] text-rivals-ink/70 sm:block">
            Design Sandbox · Luna Snow
          </p>
        </div>

        {/* Layer 3: Text content */}
        <div className="relative z-20 flex h-full w-full items-start px-5 pt-6 sm:items-center sm:px-10 sm:pt-0 lg:px-16 xl:px-24">
          <div className="w-full max-w-[58%] sm:max-w-[54%] lg:max-w-[58%] xl:max-w-[54%]">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="shrink-0">
                <StrategistIcon />
              </span>
              <span className="font-display text-base font-bold uppercase italic tracking-[0.22em] text-rivals-ink sm:text-lg lg:text-xl">
                Strategist
              </span>
            </div>

            <div className="mt-3 sm:mt-5 lg:mt-6">
              <RivalsHeroTitle
                name="Luna Snow"
                subtitle="Seol Hee"
                description="Equal parts pop star and Super Hero, Luna Snow pulls in a dazzling show with both her light and dark ice powers. The arena is her stage, where Seol Hee and her team orchestrate spectacular displays that earn her an ever-increasing number of fans and wins."
                size="xl"
                inlineName={false}
              />
            </div>
          </div>
        </div>

        {/* Layer 4: Foreground hero (large, dominant) */}
        <div
          className="
            pointer-events-none absolute z-30
            -bottom-[20%] right-[-42%] h-[172%] w-[150%]
            sm:-bottom-[26%] sm:right-[-34%] sm:h-[194%] sm:w-[126%]
            lg:-bottom-[33%] lg:right-[-20%] lg:h-[222%] lg:w-[98%]
            xl:-bottom-[36%] xl:right-[-16%] xl:h-[236%] xl:w-[90%]
          "
        >
          <Image
            src={RIVALS_LUNA.portrait}
            alt="Luna Snow full body art"
            fill
            priority
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 60vw, 52vw"
            className="object-contain object-bottom drop-shadow-[0_22px_40px_rgba(40,39,54,0.45)]"
          />
        </div>

        {/* Bottom subtle gradient to merge with page */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[35] h-12 bg-gradient-to-t from-rivals-light-200/85 via-rivals-light-100/30 to-transparent sm:h-16"
          aria-hidden
        />
      </div>
    </section>
  );
}
