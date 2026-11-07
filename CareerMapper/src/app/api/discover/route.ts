import { NextRequest, NextResponse } from "next/server";
import { discoverPeople } from "@/lib/bulk-research";
import { getPeople } from "@/lib/corpus";
import { ERAS, type Era } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const ERA_DESCRIPTIONS: Record<Era, string> = {
  "pre-pc": "the Pre-PC era (pre-1980 — mainframe / industrial)",
  pc: "the PC era (1980–1994 — personal computers, early software)",
  web: "the Web / dot-com era (1995–2006 — the web, dot-com, early SaaS)",
  "mobile-cloud":
    "the Mobile + Cloud era (2007–2018 — iPhone, AWS, mobile-first SaaS)",
  "ai-revolution":
    "the AI-revolution era (2019–present — transformers, GPT, frontier labs)",
};

function isEra(x: unknown): x is Era {
  return (
    typeof x === "string" && ERAS.some((e) => e.id === x)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eras: unknown = body?.eras;
    const count: unknown = body?.count;

    if (!Array.isArray(eras) || eras.length === 0 || !eras.every(isEra)) {
      return NextResponse.json(
        { error: "eras must be a non-empty array of valid era ids" },
        { status: 400 }
      );
    }

    const requestedCount =
      typeof count === "number" && count > 0 && count <= 40
        ? Math.floor(count)
        : 15;

    const eraPhrases = eras.map((e) => ERA_DESCRIPTIONS[e]).join(" and ");
    const query = `Under-known successful founders, investors, or operators whose flagship work is in ${eraPhrases}. Prioritize founders whose paths offer learnable, replicable patterns for someone planning their career today.`;

    const existing = await getPeople();
    const excludeNames = existing.map((p) => p.name);

    const result = await discoverPeople(query, requestedCount, excludeNames);

    // Belt-and-suspenders: filter any echoes of existing names client-side too.
    const excludeSet = new Set(
      excludeNames.map((n) => n.toLowerCase().trim())
    );
    const filtered = result.names.filter(
      (n) => !excludeSet.has(n.name.toLowerCase().trim())
    );

    return NextResponse.json({
      ...result,
      names: filtered,
      excludedCount: excludeNames.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/discover] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
