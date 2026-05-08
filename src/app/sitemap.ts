import { MetadataRoute } from "next";
import { getHeroSlugs } from "@/lib/content-adapter";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://rivalscodex.com";
  const heroSlugs = await getHeroSlugs();

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    ...heroSlugs.map((slug) => ({
      url: `${baseUrl}/heroes/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
