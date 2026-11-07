import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { pool, researchPersonLight } from "@/lib/bulk-research";
import { invalidateCorpusCache } from "@/lib/corpus";
import { PersonSchema, slugify } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 600;

const PEOPLE_DIR = join(process.cwd(), "data", "people");
const CONCURRENCY = 3;

type BatchItem = { name: string; hint?: string };

type BatchResult = {
  name: string;
  ok: boolean;
  id?: string;
  path?: string;
  skipped?: boolean;
  reason?: string;
  searchCount?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const itemsRaw: unknown = body?.items;
    const overwrite = Boolean(body?.overwrite);

    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      );
    }
    if (itemsRaw.length > 30) {
      return NextResponse.json(
        { error: "batch limited to 30 items per call" },
        { status: 400 }
      );
    }

    const items: BatchItem[] = itemsRaw
      .filter(
        (it): it is { name: string; hint?: string } =>
          typeof it === "object" &&
          it !== null &&
          typeof (it as { name?: unknown }).name === "string"
      )
      .map((it) => ({
        name: (it.name as string).trim(),
        hint:
          typeof (it as { hint?: unknown }).hint === "string"
            ? ((it as { hint?: string }).hint as string).trim()
            : undefined,
      }))
      .filter((it) => it.name);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "no valid items in batch" },
        { status: 400 }
      );
    }

    await mkdir(PEOPLE_DIR, { recursive: true });

    const results = await pool<BatchItem, BatchResult>(
      items,
      CONCURRENCY,
      async ({ name, hint }) => {
        try {
          const { draft, searchCount } = await researchPersonLight(name, hint);

          // Normalize id if missing
          const draftObj = draft as Record<string, unknown>;
          if (!draftObj.id && typeof draftObj.name === "string") {
            draftObj.id = slugify(draftObj.name);
          }

          const parsed = PersonSchema.safeParse(draftObj);
          if (!parsed.success) {
            return {
              name,
              ok: false,
              reason: `Schema validation: ${parsed.error.issues
                .slice(0, 3)
                .map(
                  (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
                )
                .join("; ")}`,
              searchCount,
            };
          }

          const person = parsed.data;
          const filename = `${person.id}.json`;
          const filepath = join(PEOPLE_DIR, filename);

          if (!overwrite) {
            try {
              await access(filepath, constants.F_OK);
              return {
                name,
                ok: false,
                skipped: true,
                reason: "File already exists (pass overwrite: true to replace)",
                id: person.id,
                searchCount,
              };
            } catch {
              // doesn't exist, proceed
            }
          }

          await writeFile(
            filepath,
            JSON.stringify(person, null, 2) + "\n",
            "utf-8"
          );

          return {
            name,
            ok: true,
            id: person.id,
            path: `data/people/${filename}`,
            searchCount,
          };
        } catch (err) {
          return {
            name,
            ok: false,
            reason: err instanceof Error ? err.message : String(err),
          };
        }
      }
    );

    invalidateCorpusCache();

    const ok = results.filter((r) => r.ok).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.ok && !r.skipped).length;

    return NextResponse.json({
      results,
      summary: { ok, skipped, failed, total: results.length },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/research-batch] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
