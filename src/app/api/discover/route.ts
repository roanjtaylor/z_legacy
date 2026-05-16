import { NextRequest, NextResponse } from "next/server";
import { discoverPeople } from "@/lib/bulk-research";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: unknown = body?.query;
    const count: unknown = body?.count;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const requestedCount =
      typeof count === "number" && count > 0 && count <= 40
        ? Math.floor(count)
        : 15;

    const result = await discoverPeople(query.trim(), requestedCount);

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/discover] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
