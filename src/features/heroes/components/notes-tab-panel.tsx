"use client";

import { useHeroNotes } from "@/features/heroes/use-hero-notes";

export function NotesTabPanel({
  heroId,
  heroName,
}: {
  heroId: string;
  heroName: string;
}) {
  const { notes, setNotes, clearNotes, hydrated } = useHeroNotes(heroId);

  return (
    <div className="rounded-lg border border-rivals-ink/20 bg-rivals-ink p-4 text-white sm:p-5">
      <p className="font-display text-[11px] font-bold uppercase italic tracking-[0.18em] text-brand-gold">
        Personal notes
      </p>
      <p className="mt-2 text-sm leading-6 text-white/75 sm:text-[15px]">
        Saved to this browser for {heroName}. Keep short reminders for matchup prep and execution.
      </p>

      <label className="mt-3 block">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          placeholder={`Write your ${heroName} notes...`}
          rows={9}
          className="w-full rounded border border-white/20 bg-[#111523] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-brand-gold/70"
        />
      </label>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-white/60">
        <span>{hydrated ? "Autosaved locally" : "Loading saved notes..."}</span>
        <span>{notes.length} chars</span>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={clearNotes}
          className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80 hover:bg-white/10"
        >
          Clear notes
        </button>
      </div>
    </div>
  );
}

