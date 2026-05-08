const WATCH_BASE = "https://www.youtube.com/watch?v=";
const SHORT_BASE = "https://youtu.be/";

export function getYoutubeEmbedUrl(url: string): string | null {
  if (url.startsWith(WATCH_BASE)) {
    const id = url.replace(WATCH_BASE, "").split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (url.startsWith(SHORT_BASE)) {
    const id = url.replace(SHORT_BASE, "").split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  return null;
}
