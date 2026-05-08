import { promises as fs } from "node:fs";
import path from "node:path";

type HeroAssetFiles = {
  portrait?: string;
  frame?: string;
  logo?: string;
  stackLogo?: string;
};

function toIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

async function main() {
  const projectRoot = process.cwd();
  const herosDir = path.join(projectRoot, "rivals-assets", "heros");
  const outputFile = path.join(
    projectRoot,
    "src",
    "features",
    "heroes",
    "hero-asset-overrides.generated.ts",
  );

  const entries = await fs.readdir(herosDir, { withFileTypes: true });
  const folders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  const imports: string[] = ['import { StaticImageData } from "next/image";'];
  const records: string[] = [];

  for (const folder of folders) {
    const folderPath = path.join(herosDir, folder);
    const files = await fs.readdir(folderPath);
    const fileSet = new Set(files);
    const slug = folder.toLowerCase();
    const assetFiles: HeroAssetFiles = {};

    const portraitFile = `${slug}.png`;
    const frameFile = `${slug}-frame.png`;
    const logoFile = `${slug}-logo.png`;
    const stackLogoFile = `${slug}-stack-logo.png`;

    if (fileSet.has(portraitFile)) {
      assetFiles.portrait = portraitFile;
    }
    if (fileSet.has(frameFile)) {
      assetFiles.frame = frameFile;
    }
    if (fileSet.has(logoFile)) {
      assetFiles.logo = logoFile;
    }
    if (fileSet.has(stackLogoFile)) {
      assetFiles.stackLogo = stackLogoFile;
    }

    const keys = Object.keys(assetFiles) as Array<keyof HeroAssetFiles>;
    if (keys.length === 0) {
      continue;
    }

    const valueLines: string[] = [];
    for (const key of keys) {
      const file = assetFiles[key];
      if (!file) {
        continue;
      }

      const varName = `${toIdentifier(slug)}_${key}`;
      const importPath = `../../../rivals-assets/heros/${folder}/${file}`;
      imports.push(`import ${varName} from "${importPath}";`);
      valueLines.push(`${key}: ${varName}`);
    }

    records.push(`  "${slug}": { ${valueLines.join(", ")} },`);
  }

  const body = `${imports.join("\n")}

export type HeroAssetOverride = {
  portrait?: StaticImageData;
  frame?: StaticImageData;
  logo?: StaticImageData;
  stackLogo?: StaticImageData;
};

export const generatedHeroAssetOverrides: Record<string, HeroAssetOverride> = {
${records.join("\n")}
};
`;

  await fs.writeFile(outputFile, body, "utf8");
  console.log(`Generated hero asset overrides: ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
