import { HeroRole } from "@/data/schema";

export type HeroRoleFilter = HeroRole | "All";

export const heroRoleFilterOptions: HeroRoleFilter[] = [
  "All",
  "Vanguard",
  "Duelist",
  "Strategist",
];
