import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { getPeople, getProfile } from "@/lib/corpus";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: unknown = body?.question;
    const focusPersonId: unknown = body?.focusPersonId;

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    const [people, profile] = await Promise.all([getPeople(), getProfile()]);

    const answer = await askClaude({
      question,
      people,
      profile,
      focusPersonId:
        typeof focusPersonId === "string" && focusPersonId.trim()
          ? focusPersonId
          : undefined,
    });

    return NextResponse.json({ answer });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/ask] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
