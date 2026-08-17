import { type ReactNode } from "react";
import { HudReadout } from "@/components/ui";
import { AbilityKeyDisplay } from "./ability-key-display";
import { abilitySurfaceStyles } from "./ability-surface-styles";
import { formatStatLabel, type AbilityViewModel } from "./ability-view-model";

export const detailPanelShellPanelClass =
  "relative flex h-[31.2rem] flex-col overflow-hidden border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

export const detailPanelShellImmersiveClass =
  "relative flex flex-col overflow-hidden border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] md:min-h-[28rem] lg:min-h-0 lg:h-full";

export const detailPanelShellInlineClass =
  "relative flex flex-col overflow-hidden border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

const detailHeaderBandClass =
  "shrink-0 border-b-2 border-rivals-ink/20 bg-rivals-light-100 px-5 pb-4 pt-[1.125rem] sm:px-7 sm:pb-5 sm:pt-6";

const detailBodyBandClass =
  "min-h-0 flex-1 overflow-visible bg-surface-hud px-4 pb-5 pt-3 sm:px-6 sm:pb-7 sm:pt-4 md:overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-brand-gold [&::-webkit-scrollbar-track]:bg-muted-foreground/35 [&::-webkit-scrollbar-track]:bg-no-repeat [&::-webkit-scrollbar-track]:bg-center [&::-webkit-scrollbar-track]:bg-cover";

export function PanelCornerAccent() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 z-[2] h-3 w-12 bg-brand-gold"
      style={{ clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
    />
  );
}

function DetailKeyChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-6 min-w-[3.4rem] shrink-0 items-center justify-center bg-center bg-cover px-2 text-[11px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundImage: abilitySurfaceStyles.keyPnl }}
    >
      {children}
    </span>
  );
}

type AbilityDetailProps = {
  panelMode: "base" | "ability";
  selectedAbility: AbilityViewModel | undefined;
  healthValue: string;
  movementSpeedValue: string;
};

export function AbilityDetail({
  panelMode,
  selectedAbility,
  healthValue,
  movementSpeedValue,
}: AbilityDetailProps) {
  const isBase = panelMode === "base" || !selectedAbility;

  return (
    <div className="hud-detail-crossfade">
      {isBase ? (
        <>
          <header className={detailHeaderBandClass}>
            <h4 className="font-display text-2xl italic uppercase leading-none text-ink-on-gold drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-3xl md:text-[2.15rem]">
              Base Stats
            </h4>
            <div className="mt-3 flex items-start gap-4 sm:mt-4 sm:gap-5">
              <DetailKeyChip>—</DetailKeyChip>
              <p className="min-h-0 flex-1 text-sm leading-snug text-rivals-ink-soft">
                Core survivability and mobility for this hero form. Values track the live data feed
                when available.
              </p>
            </div>
          </header>
          <div className={detailBodyBandClass}>
            <HudReadout label="Health" value={healthValue} />
            <HudReadout label="Movement Speed" value={movementSpeedValue} showDivider={false} />
          </div>
        </>
      ) : (
        <>
          <header className={detailHeaderBandClass}>
            <h4 className="font-display text-2xl italic uppercase leading-[1.05] text-ink-on-gold drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-3xl md:text-[2.15rem]">
              {selectedAbility.name}
            </h4>
            <div className="mt-3 flex items-start gap-4 sm:mt-4 sm:gap-5">
              <DetailKeyChip>
                <AbilityKeyDisplay keyDisplay={selectedAbility.keyDisplay} />
              </DetailKeyChip>
              <p className="min-h-0 flex-1 text-sm leading-snug text-rivals-ink-soft sm:leading-relaxed">
                {selectedAbility.description}
              </p>
            </div>
          </header>
          <div className={detailBodyBandClass}>
            {selectedAbility.fields.map((field, index) => (
              <HudReadout
                key={`${selectedAbility.id}-${field.label}`}
                label={formatStatLabel(field.label)}
                value={field.value}
                prose={field.prose}
                showDivider={index < selectedAbility.fields.length - 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
