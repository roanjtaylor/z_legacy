import { NextRequest, NextResponse } from "next/server";
import { researchPerson } from "@/lib/researcher";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name: unknown = body?.name;
    const hint: unknown = body?.hint;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const result = await researchPerson(
      name.trim(),
      typeof hint === "string" && hint.trim() ? hint.trim() : undefined
    );

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/research] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
