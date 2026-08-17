import { NextResponse } from "next/server";
import { requestBodySchema } from "./schemas";
import { handleApplySkeleton } from "./handle-apply-skeleton";
import { handleApplyAbilityDetail } from "./handle-apply-ability-detail";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = requestBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.action === "apply-skeleton") {
    return handleApplySkeleton(parsed.data);
  }
  return handleApplyAbilityDetail(parsed.data);
}
