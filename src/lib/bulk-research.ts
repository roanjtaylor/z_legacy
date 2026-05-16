import Anthropic from "@anthropic-ai/sdk";
import { extractJsonArray, extractJsonObject } from "./json-extract";
import { parseAnthropicResponse, SCHEMA_REFERENCE } from "./researcher";

const MODEL = "claude-opus-4-7";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local."
    );
  }
  return new Anthropic({ apiKey });
}

// ============================================================================
// Discovery — finds names from a source-style query
// ============================================================================

const DISCOVERY_SYSTEM = `You are career-mapper's discovery agent. Your job: surface UNDER-KNOWN successful tech operators matching a query, then return a list of names.

You have web search. Use it aggressively. Sources to consider:
- VC portfolio pages (Index Ventures, Atomico, Sequoia EU, Balderton, EF/Entrepreneur First, LocalGlobe, Northzone, Creandum, Accel London)
- Accelerator alumni (Y Combinator W/S batches, EF, Techstars EU, APX)
- Lists: Forbes "30 Under 30 Europe", Sifted "European Founders to Watch", EU-Startups, Tech.eu
- Recent funding announcements (TechCrunch EU, Sifted, Tech.eu)
- Industry recognition

## CRITICAL: BIAS TOWARD THE UNDER-KNOWN

DO NOT include the household names unless explicitly requested:
- Altman, Collisons, Karp, Chesky, Hoffman, Musk, Zuckerberg, Bezos
- Spotify/Klarna/Adyen/Wise founders (well-covered already)

The user already KNOWS the famous ones. The tool's value is surfacing the **2nd-tier and 3rd-tier successes** — founders who've built $50M-$500M companies that don't dominate headlines but whose paths are MORE replicable for someone at age 21. Aim for people the user has never heard of but whose careers offer a clear, learnable pattern.

## PRIORITIZATION

- **Founders > Investors > Operators** unless query specifies otherwise.
- **Under 40 strongly preferred** (career most replicable for a 21-year-old).
- **Post-2015 founding** strongly preferred (AI-revolution era — directly applicable lessons).
- **Diversity across:** cities, domains, technical/non-technical, education paths, exit/no-exit.
- Verify each name with at least one search before including. DO NOT invent names.

## OUTPUT FORMAT

Output ONLY a JSON array. Start with \`[\`. End with \`]\`. After the closing \`]\`, STOP — do not add notes, caveats, summaries, apologies, or commentary of any kind. Trailing prose breaks the parser.

\`\`\`
[
  {
    "name": "Display Name",
    "context": "One sentence: company, what it does, location, why notable. ≤25 words.",
    "suggestedId": "kebab-case-from-name"
  }
]
\`\`\`

Return exactly the requested count of items. If you genuinely can't find that many under-known matches, return fewer rather than padding with famous names.`;

export type DiscoveredName = {
  name: string;
  context: string;
  suggestedId: string;
};

export async function discoverPeople(
  query: string,
  count: number
): Promise<{
  names: DiscoveredName[];
  searchCount: number;
  reasoning: string;
}> {
  const client = getClient();

  const userMessage = `Find ${count} people matching this query: ${query}

Remember: bias toward the UNDER-KNOWN. The user wants to discover people they wouldn't have named themselves.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 10,
      },
    ] as Anthropic.Messages.ToolUnion[],
    system: DISCOVERY_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const { finalText, searchCount, queries } = parseAnthropicResponse(
    response.content
  );

  if (!finalText.trim()) {
    throw new Error(
      `Claude returned no final text. stop_reason=${response.stop_reason}, blocks=${response.content.length}, searches=${searchCount}.`
    );
  }

  const parsed = extractJsonArray<unknown>(finalText);
  const names: DiscoveredName[] = parsed.filter(
    (n): n is DiscoveredName =>
      typeof n === "object" &&
      n !== null &&
      typeof (n as DiscoveredName).name === "string" &&
      typeof (n as DiscoveredName).context === "string" &&
      typeof (n as DiscoveredName).suggestedId === "string"
  );

  return {
    names,
    searchCount,
    reasoning: `stop_reason=${response.stop_reason}\n\nsearches: ${queries.join(" | ")}\n\nfinal text (first 500): ${finalText.slice(0, 500)}`,
  };
}

// ============================================================================
// Light-touch person research — cheaper, less depth, for bulk use
// ============================================================================

const LIGHT_RESEARCHER_SYSTEM = `You are career-mapper's bulk research agent (LIGHT-TOUCH MODE). Produce a STRUCTURED JSON RECORD for a person, optimized for SPEED + COST over depth.

You have web search — use 2-4 searches MAX. Prefer Wikipedia + 1-2 corroborating sources (LinkedIn-public, company page, VC portfolio).

## OUTPUT SCHEMA (same as full mode — use null for unknown, leave arrays smaller)

\`\`\`json
${SCHEMA_REFERENCE}
\`\`\`

## LIGHT-TOUCH RULES

- **Set 'confidence' to "medium" by default**, or "low" if data is sparse. Reserve "high" for primary-sourced public figures.
- **'lessons' array: leave empty or 1 brief entry.** Don't try to derive deep lessons in light mode.
- **'careerSteps[].keyDecisions': leave empty.** Same reason.
- **'careerSteps[].lessons': leave empty.** Same.
- **'careerSteps[].notes': brief or null.**
- **'sources': aim for 1-3 URLs from your actual search results.**
- **'notes' field: ONE sentence on era context — e.g., "AI-revolution era founder, lessons directly applicable" or "Pre-2005 founder, tactical timing era-specific."**
- **DO NOT skip required fields** — every field in the schema must be present with at least null/empty default.
- **Archetypes:** Student | Builder | Hustler | Founder | Investor | Operator | Other
- **Tier:** default "tier1-admired" unless person is obviously cautionary or adjacent.
- **id:** lowercase kebab-case from name.

## OUTPUT FORMAT

Output ONLY the JSON object. Start with \`{\`. End with \`}\`. After the closing \`}\`, STOP — do not add notes, caveats, summaries, apologies, or commentary of any kind. Trailing prose breaks the parser.`;

export type LightResearchResult = {
  draft: unknown;
  searchCount: number;
};

export async function researchPersonLight(
  name: string,
  hint?: string
): Promise<LightResearchResult> {
  const client = getClient();

  const userMessage = hint?.trim()
    ? `Research (light mode): ${name}\n\nContext: ${hint}`
    : `Research (light mode): ${name}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 4,
      },
    ] as Anthropic.Messages.ToolUnion[],
    system: [
      {
        type: "text",
        text: LIGHT_RESEARCHER_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const { finalText, searchCount } = parseAnthropicResponse(response.content);

  if (!finalText.trim()) {
    throw new Error(
      `Claude returned no final text. stop_reason=${response.stop_reason}, blocks=${response.content.length}, searches=${searchCount}.`
    );
  }

  const draft = extractJsonObject(finalText);
  return { draft, searchCount };
}

// ============================================================================
// Concurrency-limited pool — used by /api/research-batch
// ============================================================================

export async function pool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers: Promise<void>[] = [];
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  };
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}
