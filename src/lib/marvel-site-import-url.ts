/**
 * Remote image hosts approved for dev-only Marvel Rivals official asset import.
 * User-approved URLs from pasted HTML only; no unattended scraping.
 */
export function assertHttpsAllowedImageUrl(urlString: string): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only https: URLs are allowed.");
  }

  const host = url.hostname.toLowerCase();
  const allowed =
    host === "easebar.com" ||
    host.endsWith(".easebar.com") ||
    host === "marvelrivals.com" ||
    host.endsWith(".marvelrivals.com");

  if (!allowed) {
    throw new Error(`Image host not on allowlist: ${host}`);
  }
}
