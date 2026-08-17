import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveCanonicalKeybindIcon } from "@/lib/marvel-keybind-icons";
import { assertHttpsAllowedImageUrl } from "@/lib/marvel-site-import-url";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role-client";

const HERO_ASSET_STORAGE_BUCKET =
  process.env.SUPABASE_HERO_ASSET_BUCKET?.trim() || "";

export type DownloadResult = {
  webPath: string;
  writtenFiles: string[];
  status: "written" | "refreshed" | "skipped";
};

export type AssetDownloadLedger = {
  writtenFiles: string[];
  refreshedFiles: string[];
  skippedCount: number;
};

async function fetchBinary(url: string, ms = 45_000): Promise<Buffer> {
  assertHttpsAllowedImageUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "RivalsCodex-dev-site-import/1.0" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function mirrorAssetToSupabaseStorage(
  relativePathParts: string[],
  buffer: Buffer,
): Promise<void> {
  if (!HERO_ASSET_STORAGE_BUCKET) return;
  const service = createSupabaseServiceRoleClient();
  if (!service) return;

  const storagePath = relativePathParts.join("/");
  const { error } = await service.storage
    .from(HERO_ASSET_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: "application/octet-stream",
    });

  if (error) {
    console.warn(
      `[hero-import] failed to mirror asset to storage bucket "${HERO_ASSET_STORAGE_BUCKET}"`,
      error.message,
    );
  }
}

async function downloadAssetWithCache(
  remoteUrl: string,
  relativePathParts: string[],
  forceRefresh = false,
): Promise<DownloadResult> {
  const projectRoot = process.cwd();
  const publicPath = path.join(projectRoot, "public", "rivals-assets", ...relativePathParts);
  const webPath = `/rivals-assets/${relativePathParts.join("/")}`;
  const relativeDiskPath = path.relative(projectRoot, publicPath);
  const existed = existsSync(publicPath);

  if (existed && !forceRefresh) {
    return { webPath, writtenFiles: [], status: "skipped" };
  }

  const buffer = await fetchBinary(remoteUrl);
  await mirrorAssetToSupabaseStorage(relativePathParts, buffer);
  await mkdir(path.dirname(publicPath), { recursive: true });
  await writeFile(publicPath, buffer);

  return {
    webPath,
    writtenFiles: [relativeDiskPath],
    status: existed ? "refreshed" : "written",
  };
}

function fileExtensionFromUrl(url: string, fallback = ".png"): string {
  try {
    const u = new URL(url);
    const base = u.pathname.split("/").pop() ?? "";
    const dot = base.lastIndexOf(".");
    if (dot >= 0 && dot < base.length - 1) {
      const ext = base.slice(dot).toLowerCase();
      if (/^\.(png|jpg|jpeg|webp|gif|svg)$/.test(ext)) return ext;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function recordAssetDownload(ledger: AssetDownloadLedger, result: DownloadResult) {
  if (result.status === "skipped") {
    ledger.skippedCount += 1;
    return;
  }
  if (result.status === "refreshed") {
    ledger.refreshedFiles.push(...result.writtenFiles);
    return;
  }
  ledger.writtenFiles.push(...result.writtenFiles);
}

export async function downloadKeybindIcon(
  url: string,
  ledger: AssetDownloadLedger,
  forceRefresh = false,
): Promise<string> {
  assertHttpsAllowedImageUrl(url);
  const canonical = resolveCanonicalKeybindIcon(url);
  const filename = canonical?.filename
    ?? (() => {
      const base = new URL(url).pathname.split("/").pop() ?? `keybind${fileExtensionFromUrl(url)}`;
      return base.replace(/[^a-zA-Z0-9._-]/g, "-");
    })();

  const result = await downloadAssetWithCache(url, ["icons", filename], forceRefresh);
  recordAssetDownload(ledger, result);
  return result.webPath;
}

export async function downloadAbilityIcon(
  url: string,
  slug: string,
  abilitySlug: string,
  ledger: AssetDownloadLedger,
  formId?: string,
  forceRefresh = false,
): Promise<string> {
  assertHttpsAllowedImageUrl(url);
  const ext = fileExtensionFromUrl(url);
  const filename = formId ? `${formId}-${abilitySlug}${ext}` : `${abilitySlug}${ext}`;
  const result = await downloadAssetWithCache(
    url,
    ["heros", slug, "icons", filename],
    forceRefresh,
  );
  recordAssetDownload(ledger, result);
  return result.webPath;
}

export async function downloadHeroAsset(
  url: string,
  slug: string,
  filename: string,
  ledger: AssetDownloadLedger,
  forceRefresh = false,
): Promise<void> {
  assertHttpsAllowedImageUrl(url);
  const result = await downloadAssetWithCache(
    url,
    ["heros", slug, filename],
    forceRefresh,
  );
  recordAssetDownload(ledger, result);
}

export async function downloadFormPortrait(
  url: string,
  slug: string,
  formId: string,
  ledger: AssetDownloadLedger,
  forceRefresh = false,
): Promise<string> {
  assertHttpsAllowedImageUrl(url);
  const ext = fileExtensionFromUrl(url);
  const result = await downloadAssetWithCache(
    url,
    ["heros", slug, "forms", `${formId}${ext}`],
    forceRefresh,
  );
  recordAssetDownload(ledger, result);
  return result.webPath;
}

