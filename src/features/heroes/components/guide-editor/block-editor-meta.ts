import type { HeroGuideBlock } from "@/features/heroes/hero-guide-schema";

export function linesToItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function itemsToLines(items: string[]): string {
  return items.join("\n");
}

export function blockTypeChipClass(block: HeroGuideBlock): string {
  switch (block.type) {
    case "combo":
      return "border-brand-gold/45 bg-brand-gold-muted/50 text-rivals-ink";
    case "matchup":
      if (block.disposition === "threat") {
        return "border-rose-300/70 bg-rose-50/80 text-rose-950";
      }
      if (block.disposition === "even") {
        return "border-amber-300/70 bg-amber-50/80 text-amber-950";
      }
      return "border-emerald-300/70 bg-emerald-50/80 text-emerald-950";
    case "abilityTip":
      return "border-cyan-300/70 bg-cyan-50/80 text-cyan-950";
    case "video":
      return "border-violet-300/70 bg-violet-50/80 text-violet-950";
    case "strengthsWeaknesses":
      return "border-[#1a2030]/20 bg-gradient-to-r from-emerald-50/80 via-rivals-light-100 to-rose-50/80 text-rivals-ink";
    case "loadout":
      return "border-brand-gold/45 bg-brand-gold-muted/40 text-rivals-ink";
    default:
      return "border-rivals-light-300 bg-rivals-light-100 text-rivals-ink";
  }
}

export function blockPreview(block: HeroGuideBlock): string {
  switch (block.type) {
    case "callout":
      return block.title ?? block.body;
    case "bullets":
      return block.items[0] ?? "Bullet list";
    case "twoColumn":
      return `${block.leftTitle} / ${block.rightTitle}`;
    case "combo":
      return `${block.name} (${block.steps.length} steps)`;
    case "matchup":
      return `${block.disposition}: ${block.opponent}`;
    case "abilityTip":
      return block.title ?? block.abilityRef;
    case "video":
      return block.note
        ? `${block.title} — ${block.note.length > 48 ? `${block.note.slice(0, 48)}…` : block.note}`
        : block.title;
    case "strengthsWeaknesses":
      return `${block.strengths.length} strengths · ${block.weaknesses.length} weaknesses`;
    case "loadout":
      return block.soloQueueDefault ? `${block.name} (solo default)` : block.name;
  }
}
