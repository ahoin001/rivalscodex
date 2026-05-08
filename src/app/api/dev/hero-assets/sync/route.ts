import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const { stdout, stderr } = await execFileAsync("npm", ["run", "sync:hero-assets"], {
      cwd: process.cwd(),
    });

    return NextResponse.json({
      ok: true,
      message: "Hero asset overrides synced.",
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "Unknown script execution error.";

    return NextResponse.json(
      {
        ok: false,
        error: details,
      },
      { status: 500 },
    );
  }
}
