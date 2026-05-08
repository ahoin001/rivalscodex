import Image from "next/image";
import frameImage from "../../../../rivals-assets/frames/hero-frame.jpg";
import widowSiloImage from "../../../../rivals-assets/heros/black widow/widow-silo.png";
import widowImage from "../../../../hero-frames/widow.png";

type BlackWidowHeroCardProps = {
  className?: string;
};

export function BlackWidowHeroCard({ className = "" }: BlackWidowHeroCardProps) {
  return (
    <section
      className={`relative isolate w-full overflow-hidden border border-brand-gold/35 bg-[#d4dae7] shadow-[0_18px_45px_rgba(6,8,20,0.4)] ${className}`.trim()}
      aria-label="Black Widow hero card recreation"
    >
      <div className="relative aspect-[16/9] w-full min-h-[360px] sm:min-h-[430px] lg:min-h-[560px]">
        <Image
          src={frameImage}
          alt="Marvel Rivals style hero frame"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <Image
          src={widowSiloImage}
          alt=""
          fill
          sizes="100vw"
          aria-hidden
          className="pointer-events-none object-cover object-center"
        />

        <div className="absolute inset-y-0 left-0 z-20 flex w-full items-start px-4 pb-4 pt-6 sm:px-7 sm:pt-10 lg:max-w-[52%] lg:px-12 lg:pt-14 xl:max-w-[48%]">
          <div className="w-full max-w-[620px] text-[#161925]">
            <div className="relative mb-5 sm:mb-7">
              <div className="mb-2 flex items-center gap-2 sm:gap-3">
                <div className="h-7 w-7 rounded-full border-2 border-[#1f2234] sm:h-9 sm:w-9" />
                <span className="font-display text-sm italic uppercase tracking-[0.14em] sm:text-base">
                  Duelist
                </span>
              </div>

              <h1 className="slanted-title font-display text-[2.45rem] uppercase leading-[0.86] text-[#141726] sm:text-[3.7rem] lg:text-[5.6rem]">
                <span>Black</span>
                <br />
                <span>Widow</span>
              </h1>
            </div>

            <div className="ml-1 max-w-[560px] pr-[34%] sm:pr-[32%] lg:pr-0">
              <p className="mb-3 inline-flex bg-[#161925] px-3 py-1 font-display text-xs italic uppercase tracking-[0.16em] text-white sm:text-sm">
                Natasha Romanova
              </p>
              <p className="max-w-[560px] text-xs leading-5 text-[#2e333d] sm:text-sm sm:leading-6 lg:text-base lg:leading-7">
                Natasha Romanova is the world&apos;s most elite spy in any era. Her mastery of the
                sniper rifle eliminates targets from afar, while her shock batons neutralize
                close-range threats. Black Widow is locked, loaded, and ready to deliver a fatal
                bite!
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-[-10%] right-[-14%] z-30 h-[150%] w-[110%] sm:bottom-[-12%] sm:right-[-18%] sm:h-[170%] sm:w-[105%] lg:bottom-[-16%] lg:right-[-20%] lg:h-[190%] lg:w-[78%]">
          <Image
            src={widowImage}
            alt="Black Widow full body art"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 70vw"
            className="object-contain object-bottom drop-shadow-[0_12px_26px_rgba(8,10,25,0.5)]"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[15] bg-gradient-to-r from-[#d8ddea]/40 via-transparent to-transparent sm:from-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#c3c9d8]/70 to-transparent sm:h-20" />
      </div>
    </section>
  );
}
