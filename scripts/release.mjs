#!/usr/bin/env node
/**
 * Release helper: optional commit of dirty tree, push, semver bump (npm version),
 * push tags, then optional Vercel production deploy.
 *
 * Usage:
 *   node scripts/release.mjs --patch|--minor|--major [--dry-run] [--skip-vercel]
 *
 * Env:
 *   COMMIT_MESSAGE   Message for auto-commit when working tree is dirty (default: chore: sync before release)
 *   RELEASE_BRANCH   Expected branch name; warn if mismatch (default: main)
 *   VERCEL_TOKEN     If set with VERCEL_ORG_ID + VERCEL_PROJECT_ID, runs production deploy
 *   VERCEL_ORG_ID
 *   VERCEL_PROJECT_ID
 */

import { execSync, spawnSync } from "node:child_process";
import process from "node:process";

function sh(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", shell: true, ...opts });
}

function gitOutput(cmd) {
  return execSync(cmd, { encoding: "utf8", shell: true }).trim();
}

function parseArgs() {
  let bump = null;
  let dryRun = false;
  let skipVercel = false;
  for (const a of process.argv.slice(2)) {
    if (a === "--patch") bump = "patch";
    else if (a === "--minor") bump = "minor";
    else if (a === "--major") bump = "major";
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--skip-vercel") skipVercel = true;
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  if (!bump) {
    console.error(
      "Usage: node scripts/release.mjs --patch|--minor|--major [--dry-run] [--skip-vercel]",
    );
    process.exit(1);
  }
  return { bump, dryRun, skipVercel };
}

function isDirty() {
  return gitOutput("git status --porcelain").length > 0;
}

function main() {
  const { bump, dryRun, skipVercel } = parseArgs();
  const branch = gitOutput("git rev-parse --abbrev-ref HEAD");
  const releaseBranch = process.env.RELEASE_BRANCH || "main";
  const commitMsg =
    process.env.COMMIT_MESSAGE?.trim() || "chore: sync before release";

  if (branch !== releaseBranch && process.env.ALLOW_NON_MAIN_RELEASE !== "1") {
    console.error(
      `Refusing to release from branch "${branch}" (expected "${releaseBranch}"). Set ALLOW_NON_MAIN_RELEASE=1 to override.`,
    );
    process.exit(1);
  }

  console.log(`Release bump: ${bump} | branch: ${branch}${dryRun ? " | DRY RUN" : ""}`);

  if (dryRun) {
    console.log("[dry-run] Dirty:", isDirty() ? "yes" : "no");
    console.log("[dry-run] Would run: npm ci (in CI), commit if dirty, push, npm version, push --follow-tags");
    if (!skipVercel && process.env.VERCEL_TOKEN && process.env.VERCEL_ORG_ID && process.env.VERCEL_PROJECT_ID) {
      console.log("[dry-run] Would run: npx vercel deploy --prod");
    } else {
      console.log("[dry-run] Vercel deploy skipped (missing token/org/project or --skip-vercel)");
    }
    return;
  }

  if (isDirty()) {
    console.log("Working tree has changes; committing all tracked/untracked files…");
    sh("git add -A");
    sh(`git commit -m ${JSON.stringify(commitMsg)}`);
  } else {
    console.log("Working tree clean; skipping commit.");
  }

  try {
    sh(`git pull --rebase origin ${branch}`);
  } catch {
    console.warn("git pull --rebase failed (continuing if push still works).");
  }

  sh(`git push origin ${branch}`);

  sh(`npm version ${bump} -m "chore(release): %s"`);

  sh(`git push origin ${branch} --follow-tags`);

  if (
    !skipVercel &&
    process.env.VERCEL_TOKEN &&
    process.env.VERCEL_ORG_ID &&
    process.env.VERCEL_PROJECT_ID
  ) {
    console.log("Deploying to Vercel production…");
    const result = spawnSync(
      "npx",
      [
        "--yes",
        "vercel@latest",
        "deploy",
        "--prod",
        "--yes",
        "--token",
        process.env.VERCEL_TOKEN,
      ],
      {
        stdio: "inherit",
        env: { ...process.env },
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  } else {
    console.log(
      "Skipping Vercel CLI deploy (set VERCEL_TOKEN + VERCEL_ORG_ID + VERCEL_PROJECT_ID, or pass --skip-vercel). Push may still trigger Git-integrated hosting.",
    );
  }

  console.log("Release complete.");
}

main();
