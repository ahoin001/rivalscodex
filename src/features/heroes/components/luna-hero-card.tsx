import Image from "next/image";
import { RivalsHeroTitle, RivalsRoleBadge } from "@/components/ui";
import heroFrameImage from "../../../../rivals-assets/frames/hero-frame.jpg";
import lunaFrameImage from "../../../../rivals-assets/heros/luna/luna-frame.png";
import lunaImage from "../../../../rivals-assets/heros/luna/luna.png";

type LunaHeroCardProps = {
  className?: string;
};

const StrategistIcon = () => (
  <svg
    viewBox="0 0 64 64"
    width="32"
    height="32"
    aria-hidden
    className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9"
  >
    <g
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="32" cy="32" r="22" />
      <circle cx="32" cy="32" r="14" />
      <path d="M32 6 L32 18" />
      <path d="M32 46 L32 58" />
      <path d="M6 32 L18 32" />
      <path d="M46 32 L58 32" />
    </g>
    <circle cx="32" cy="32" r="3" fill="currentColor" />
  </svg>
);

export function LunaHeroCard({ className = "" }: LunaHeroCardProps) {
  return (
    <section
      className={`relative isolate w-full overflow-hidden border border-rivals-light-300 bg-rivals-light-100 shadow-[0_18px_40px_rgba(40,39,54,0.18)] ${className}`.trim()}
      aria-label="Luna Snow hero card recreation"
    >
      <div className="relative aspect-[16/9] w-full min-h-[420px] sm:min-h-[500px] lg:min-h-[600px]">
        <Image
          src={heroFrameImage}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden
          className="object-cover object-center"
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[58%] sm:block">
          <Image
            src={lunaFrameImage}
            alt=""
            fill
            sizes="60vw"
            aria-hidden
            className="object-cover object-right"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[18%] bg-gradient-to-b from-rivals-light-50/80 via-rivals-light-100/30 to-transparent" />

        <div className="relative z-20 flex h-full w-full items-start px-5 pt-6 sm:px-10 sm:pt-12 lg:px-16 lg:pt-16">
          <div className="w-full max-w-[58%] lg:max-w-[52%]">
            <RivalsRoleBadge
              role="Strategist"
              size="lg"
              icon={
                <span className="text-rivals-strategist">
                  <StrategistIcon />
                </span>
              }
            />

            <div className="mt-4 sm:mt-6">
              <RivalsHeroTitle
                name="Luna Snow"
                subtitle="Seol Hee"
                description="Equal parts pop star and Super Hero, Luna Snow pulls in a dazzling show with both her light and dark ice powers. The arena is her stage, where Seol Hee and her team orchestrate spectacular displays that earn her an ever-increasing number of fans and wins."
                size="xl"
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-[-6%] z-30 h-[96%] w-[60%] sm:right-[-2%] sm:h-[100%] sm:w-[52%] lg:right-[2%] lg:h-[104%] lg:w-[44%]">
          <Image
            src={lunaImage}
            alt="Luna Snow full body art"
            fill
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 50vw, 44vw"
            className="object-contain object-bottom drop-shadow-[0_18px_28px_rgba(40,39,54,0.4)]"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[35] h-12 bg-gradient-to-t from-rivals-light-200/85 via-rivals-light-100/30 to-transparent sm:h-14" />
      </div>
    </section>
  );
}
