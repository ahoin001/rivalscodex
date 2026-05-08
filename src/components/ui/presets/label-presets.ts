import { HeroExternalResource } from "@/data/schema";

export const externalResourceTypeLabels: Record<
  HeroExternalResource["type"],
  string
> = {
  youtube: "Video",
  guide: "Guide",
  community: "Community",
};
