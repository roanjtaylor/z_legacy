import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { invalidateCorpusCache } from "@/lib/corpus";
import { PersonSchema, slugify } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const PEOPLE_DIR = join(process.cwd(), "data", "people");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const person = body?.person;
    const overwrite = Boolean(body?.overwrite);

    if (!person || typeof person !== "object") {
      return NextResponse.json(
        { error: "person object is required" },
        { status: 400 }
      );
    }

    // If id missing, derive from name
    if (!person.id && typeof person.name === "string") {
      person.id = slugify(person.name);
    }

    // Validate
    const parsed = PersonSchema.safeParse(person);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Schema validation failed",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const validPerson = parsed.data;
    const filename = `${validPerson.id}.json`;
    const filepath = join(PEOPLE_DIR, filename);

    await mkdir(PEOPLE_DIR, { recursive: true });

    if (!overwrite) {
      try {
        await access(filepath, constants.F_OK);
        return NextResponse.json(
          {
            error: `File already exists: ${filename}. Pass overwrite: true to replace.`,
          },
          { status: 409 }
        );
      } catch {
        // doesn't exist — proceed
      }
    }

    await writeFile(
      filepath,
      JSON.stringify(validPerson, null, 2) + "\n",
      "utf-8"
    );

    invalidateCorpusCache();

    return NextResponse.json({
      saved: true,
      path: `data/people/${filename}`,
      id: validPerson.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/persons] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
