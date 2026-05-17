import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { invalidateCorpusCache } from "@/lib/corpus";
import { ResearchLinksSchema } from "@/lib/schema";

export const runtime = "nodejs";

const PEOPLE_DIR = join(process.cwd(), "data", "people");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body?.id;
    const links = body?.researchLinks;

    if (typeof id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const parsed = ResearchLinksSchema.safeParse(links);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid researchLinks", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const filepath = join(PEOPLE_DIR, `${id}.json`);
    const raw = await readFile(filepath, "utf-8");
    const data = JSON.parse(raw);
    data.researchLinks = parsed.data;

    await writeFile(filepath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    invalidateCorpusCache();

    return NextResponse.json({ saved: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/curate] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
