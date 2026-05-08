import { RivalsPill } from "@/components/ui";
import { HeroAbility } from "@/data/schema";

type AbilityCardProps = {
  ability: HeroAbility;
};

export function AbilityCard({ ability }: AbilityCardProps) {
  return (
    <article className="clipped-edge border border-brand-gold/28 bg-[#121726]/90 p-4">
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center border border-brand-gold/60 bg-brand-gold-muted text-xs font-bold text-brand-gold">
          {ability.keybind}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold/85">
            {ability.type}
          </p>
          <h3 className="slanted-title font-display text-2xl italic uppercase leading-none">
            <span>{ability.name}</span>
          </h3>
        </div>
        <RivalsPill>Ability</RivalsPill>
      </div>
      <p className="text-sm text-muted-foreground">{ability.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-white/75">
        {ability.damage && (
          <RivalsPill tone="brand">Damage {ability.damage}</RivalsPill>
        )}
        {ability.cooldownSeconds !== undefined && ability.cooldownSeconds > 0 && (
          <RivalsPill>Cooldown {ability.cooldownSeconds}s</RivalsPill>
        )}
        {ability.videoUrl && (
          <a
            href={ability.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-brand-gold/40 px-2 py-1 text-brand-gold hover:bg-brand-gold hover:text-[#10131e]"
          >
            Clip
          </a>
        )}
      </div>
    </article>
  );
}
