import { RivalsDataColumn } from "@/components/ui/rivals-data-table-section";

export const abilityMatrixColumns: RivalsDataColumn[] = [
  { key: "keybind", label: "Key" },
  { key: "name", label: "Ability" },
  { key: "type", label: "Type" },
  { key: "stats", label: "Stats" },
];

export const baseStatRowsPreset = [
  { key: "health", label: "Health" },
  { key: "role", label: "Role" },
  { key: "difficulty", label: "Difficulty" },
  { key: "updatedAt", label: "Updated" },
] as const;
