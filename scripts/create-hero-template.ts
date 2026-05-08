import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Args = {
  slug: string;
  name: string;
  role: "Vanguard" | "Duelist" | "Strategist";
};

function parseArg(flag: string): string | undefined {
  const directMatch = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (directMatch) {
    return directMatch.split("=")[1];
  }

  const flagIndex = process.argv.indexOf(flag);
  if (flagIndex !== -1) {
    return process.argv[flagIndex + 1];
  }

  return undefined;
}

function ensureArgs(): Args {
  const positionalArgs = process.argv.slice(2);
  const slug = parseArg("--slug") ?? positionalArgs[0];
  const name = parseArg("--name") ?? positionalArgs[1];
  const role = (parseArg("--role") ?? positionalArgs[2]) as
    | Args["role"]
    | undefined;

  if (!slug || !name || !role) {
    console.error(
      'Usage: npm run draft-hero -- --slug=hero-slug --name="Hero Name" --role=Vanguard',
    );
    process.exit(1);
  }

  if (!["Vanguard", "Duelist", "Strategist"].includes(role)) {
    console.error('Role must be one of: Vanguard, Duelist, Strategist');
    process.exit(1);
  }

  return { slug, name, role };
}

function createTemplate({ slug, name, role }: Args) {
  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    id: slug,
    slug,
    name,
    role,
    difficulty: 3,
    health: 600,
    portraitImage: `/heroes/${slug}-portrait.webp`,
    splashImage: `/heroes/${slug}-splash.webp`,
    summary: "Add one-sentence summary.",
    abilities: [
      {
        id: "ability-id",
        name: "Ability Name",
        keybind: "E",
        type: "Utility",
        description: "Describe this ability.",
        cooldownSeconds: 8,
      },
    ],
    combos: [],
    synergies: [],
    playstyle: {
      overview: "Add overview.",
      positioning: "Add positioning guidance.",
      targetPriority: ["Add target priority"],
      avoidPriority: ["Add avoid priority"],
    },
    externalResources: [],
    updatedAt: today,
  };

  const draftsDir = resolve(process.cwd(), "src/data/drafts");
  mkdirSync(draftsDir, { recursive: true });

  const outputPath = resolve(draftsDir, `${slug}.json`);
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Created draft hero file: ${outputPath}`);
}

createTemplate(ensureArgs());
