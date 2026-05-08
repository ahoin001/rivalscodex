import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const heroArtDir = new URL("../public/heroes/", import.meta.url);

const heroes = [
  {
    slug: "captain-america",
    label: "Captain America",
    start: "#0f3b88",
    end: "#00a0ff",
  },
  {
    slug: "scarlet-witch",
    label: "Scarlet Witch",
    start: "#671126",
    end: "#ff4655",
  },
  {
    slug: "rocket-raccoon",
    label: "Rocket Raccoon",
    start: "#06453e",
    end: "#00f5c8",
  },
];

function svgTemplate(width, height, { label, start, end }) {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
        <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.12)" />
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
      <rect width="${width}" height="${height}" fill="url(#dots)" />
      <polygon points="0,0 ${Math.floor(width * 0.62)},0 ${Math.floor(width * 0.4)},${height}" fill="rgba(10,11,20,0.25)" />
      <text x="${Math.floor(width * 0.06)}" y="${Math.floor(height * 0.82)}" fill="rgba(239,244,255,0.92)" font-size="${Math.floor(width * 0.065)}" font-family="Arial, Helvetica, sans-serif" font-weight="700">${label}</text>
    </svg>
  `;
}

async function generateVariant(hero, variant, width, height, quality) {
  const svg = Buffer.from(svgTemplate(width, height, hero));
  const outputPath = new URL(`${hero.slug}-${variant}.webp`, heroArtDir);

  await sharp(svg).webp({ quality }).toFile(fileURLToPath(outputPath));
}

async function main() {
  await mkdir(heroArtDir, { recursive: true });

  for (const hero of heroes) {
    await generateVariant(hero, "portrait", 720, 720, 58);
    await generateVariant(hero, "splash", 1280, 720, 60);
  }

  console.log("Generated optimized hero webp assets.");
}

await main();
