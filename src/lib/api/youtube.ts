import { z } from "zod";
import { externalProviderConfig } from "@/lib/external-provider-config";

const youtubeItemSchema = z.object({
  id: z.object({
    videoId: z.string(),
  }),
  snippet: z.object({
    title: z.string(),
  }),
});

const youtubeResponseSchema = z.object({
  items: z.array(youtubeItemSchema),
});

export type YoutubeVideo = {
  title: string;
  url: string;
};

export async function fetchYoutubeGuides(
  query: string,
  maxResults = 3,
): Promise<YoutubeVideo[]> {
  const apiKey = externalProviderConfig.youtube.apiKey;
  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    order: "relevance",
    maxResults: String(maxResults),
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    {
      next: {
        revalidate: externalProviderConfig.youtube.cacheTtlSeconds,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`YouTube API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const parsed = youtubeResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  return parsed.data.items.map((item) => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}
