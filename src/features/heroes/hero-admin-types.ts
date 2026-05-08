import type { Hero } from "@/data/schema";

export type HeroEditableSnapshot = {
  playstyle: Hero["playstyle"];
  combos: Hero["combos"];
  synergies: Hero["synergies"];
  externalResources: Hero["externalResources"];
};
