import Image from "next/image";
import type { ComboModifier } from "@/data/schema";
import type { ComboChainTheme } from "@/features/heroes/components/combo-chain-theme";
import { getCancelHoverLabel, getModifierDescriptor, isCancelModifier } from "@/features/heroes/combo-display";
import type { CancelTargetPreview } from "./combo-chain-types";
import { HoverTip } from "./combo-chain-hover";

export function OrStepConnector({ theme }: { theme: ComboChainTheme }) {
  return (
    <div className="flex shrink-0 items-center justify-center px-1 sm:px-1.5" aria-hidden>
      <span
        className={`rounded-full border px-2 py-0.5 font-display text-[9px] font-bold uppercase italic tracking-[0.18em] sm:text-[10px] ${theme.orConnector}`}
      >
        Or
      </span>
    </div>
  );
}

export function ForkStemConnector({ theme }: { theme: ComboChainTheme }) {
  return (
    <div className="flex shrink-0 items-center justify-center px-1 sm:px-1.5" aria-hidden>
      <span className={`font-display text-lg font-bold leading-none sm:text-xl ${theme.forkStem}`}>
        ⤵
      </span>
    </div>
  );
}

export function StepConnector({
  modifier,
  theme,
  cancelTarget,
}: {
  modifier?: ComboModifier;
  theme: ComboChainTheme;
  cancelTarget?: CancelTargetPreview;
}) {
  if (modifier === "or") {
    return <OrStepConnector theme={theme} />;
  }

  const descriptor = getModifierDescriptor(modifier);
  const showCancelPreview = isCancelModifier(modifier) && cancelTarget !== undefined;

  const connector = (
    <div className="flex shrink-0 items-center justify-center gap-0.5 px-0.5 sm:px-1">
      <span
        className={`font-display text-lg font-bold leading-none sm:text-xl ${descriptor.arrowClass}`}
        aria-hidden
      >
        {descriptor.symbol}
      </span>
      {showCancelPreview && cancelTarget.iconUrl ? (
        <div
          className={`relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white/95 sm:h-8 sm:w-8 ${
            modifier === "animation-cancel"
              ? "border-rose-400/60"
              : modifier === "dash-cancel"
                ? "border-sky-400/60"
                : "border-emerald-400/60"
          }`}
        >
          <Image
            src={cancelTarget.iconUrl}
            alt=""
            width={28}
            height={28}
            className="h-6 w-6 object-contain sm:h-7 sm:w-7"
          />
        </div>
      ) : null}
    </div>
  );

  if (showCancelPreview) {
    return (
      <HoverTip tip={getCancelHoverLabel(modifier!, cancelTarget.name)}>{connector}</HoverTip>
    );
  }

  return connector;
}

export function RepeatBadge({ count, theme }: { count: number; theme: ComboChainTheme }) {
  if (count <= 1) return null;
  return (
    <span
      className={`pointer-events-none absolute -right-2 -top-2 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[9px] font-bold tabular-nums ${theme.repeatBadge}`}
    >
      ×{count}
    </span>
  );
}

export function StepTipBadge({ theme }: { theme: ComboChainTheme }) {
  return (
    <span
      className={`pointer-events-none absolute -left-2 -top-2 z-20 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${theme.stepTipBadge}`}
      aria-hidden
    >
      i
    </span>
  );
}
