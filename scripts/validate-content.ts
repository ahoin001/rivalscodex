import { statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import heroes from "../src/data/heroes.json";
import { Hero, heroesSchema } from "../src/data/schema";

function pushIfDuplicate(values: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) {
      errors.push(`Duplicate ${label} found: "${value}".`);
    }
    seen.add(value);
  });
}

function checkImageHealth(pathValue: string, label: string, errors: string[]) {
  const absolute = resolve(process.cwd(), `public${pathValue}`);
  try {
    const result = statSync(absolute);
    const maxBytes = label === "splashImage" ? 500_000 : 300_000;
    if (result.size > maxBytes) {
      errors.push(
        `${pathValue}: ${label} exceeds ${Math.round(maxBytes / 1000)} KB budget.`,
      );
    }
  } catch {
    errors.push(`${pathValue}: ${label} file does not exist in public directory.`);
  }
}

export function collectContentHealthErrors(heroesData: Hero[]): string[] {
  const errors: string[] = [];
  pushIfDuplicate(
    heroesData.map((hero) => hero.id),
    "hero id",
    errors,
  );
  pushIfDuplicate(
    heroesData.map((hero) => hero.slug),
    "hero slug",
    errors,
  );
  pushIfDuplicate(
    heroesData.map((hero) => hero.name.toLowerCase()),
    "hero name",
    errors,
  );

  heroesData.forEach((hero) => {
    checkImageHealth(hero.portraitImage, "portraitImage", errors);
    checkImageHealth(hero.splashImage, "splashImage", errors);

    pushIfDuplicate(
      hero.abilities.map((ability) => ability.id),
      `${hero.name} ability id`,
      errors,
    );

    if (
      hero.abilities.some(
        (ability) =>
          ability.damage === undefined && ability.cooldownSeconds === undefined,
      )
    ) {
      errors.push(
        `${hero.name}: each ability should include damage, cooldown, or both.`,
      );
    }

    if (hero.externalResources.length > 0) {
      const badLink = hero.externalResources.find((resource) => !resource.url.startsWith("https://"));
      if (badLink) {
        errors.push(`${hero.name}: resource "${badLink.title}" must use HTTPS.`);
      }
    }

    if (
      hero.playstyle.targetPriority.length === 0 ||
      hero.playstyle.avoidPriority.length === 0
    ) {
      errors.push(
        `${hero.name}: include at least one "who to target" and one "who to avoid" entry.`,
      );
    }
  });

  return errors;
}

export function validateHeroesData(input: unknown): Hero[] {
  const parsed = heroesSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      `Content validation failed: ${JSON.stringify(parsed.error.format())}`,
    );
  }
  return parsed.data;
}

function main() {
  const heroesData = validateHeroesData(heroes);
  const errors = collectContentHealthErrors(heroesData);

  if (errors.length > 0) {
    console.error("Content health checks failed:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Validated ${heroesData.length} heroes successfully.`);
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
