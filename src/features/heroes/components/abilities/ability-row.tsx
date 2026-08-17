import Image from "next/image";
import { AbilityKeyDisplay } from "./ability-key-display";
import { abilityIconTintFilter, abilitySurfaceStyles } from "./ability-surface-styles";
import type { AbilityViewModel } from "./ability-view-model";

export function AbilityRow({
  ability,
  isActive,
  onTap,
}: {
  ability: AbilityViewModel;
  isActive: boolean;
  onTap: (abilityId: string) => void;
}) {
  return (
    <button
      type="button"
      data-ability-id={ability.id}
      aria-expanded={isActive}
      onClick={() => onTap(ability.id)}
      className={`group relative flex h-[3.5rem] w-full items-center text-left transition-[color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out-soft)] active:scale-[0.97] ${
        isActive ? "text-brand-gold" : "text-rivals-ink-soft hover:text-brand-gold"
      }`}
      style={{
        backgroundImage: abilitySurfaceStyles.rowBg,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
      }}
    >
      <span
        className={`pointer-events-none absolute inset-0 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } transition-opacity duration-[var(--motion-fast)]`}
        style={{
          backgroundImage: abilitySurfaceStyles.rowSelected,
          backgroundSize: "calc(100% + 0.8rem) calc(100% + 0.5rem)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
      <span className="relative z-[1] flex h-full w-[4.2rem] shrink-0 items-center justify-center text-xs font-semibold uppercase tracking-wide text-white">
        <AbilityKeyDisplay keyDisplay={ability.keyDisplay} />
      </span>
      <span className="relative z-[1] flex h-full w-[8.3rem] shrink-0 items-center justify-center">
        {ability.iconUrl ? (
          <Image
            src={ability.iconUrl}
            alt=""
            width={36}
            height={36}
            className="h-8 w-auto object-contain"
            style={{ filter: abilityIconTintFilter, opacity: 0.96 }}
          />
        ) : (
          <span className="h-8 w-8 rounded-full border border-muted-foreground/50 bg-rivals-light-300" />
        )}
      </span>
      <span className="relative z-[1] truncate px-3 text-[15px] font-semibold uppercase tracking-wide">
        {ability.name}
      </span>
    </button>
  );
}
