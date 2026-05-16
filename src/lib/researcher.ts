import Anthropic from "@anthropic-ai/sdk";
import { extractJsonObject } from "./json-extract";

// ============================================================================
// Shared Anthropic response parser.
//
// When Claude uses web search WITH CITATIONS, the answer is split across
// multiple `text` blocks — one per cited claim. We must concatenate all text
// blocks AFTER the last tool-use/tool-result block to reassemble the final
// answer. Taking only the last block (the old bug) loses ~95% of the response.
// ============================================================================

type AnyBlock = {
  type: string;
  text?: string;
  name?: string;
  input?: unknown;
  content?: unknown;
};

export type AnthropicParseResult = {
  finalText: string;
  searchCount: number;
  queries: string[];
  citations: { url: string; title: string }[];
};

export function parseAnthropicResponse(
  content: Anthropic.Messages.ContentBlock[]
): AnthropicParseResult {
  const blocks = content as unknown as AnyBlock[];

  let lastNonTextIdx = -1;
  const queries: string[] = [];
  const citations: { url: string; title: string }[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type !== "text") lastNonTextIdx = i;
    if (b.type === "server_tool_use" && b.name === "web_search") {
      const q = (b.input as { query?: string } | undefined)?.query;
      if (typeof q === "string") queries.push(q);
    } else if (b.type === "web_search_tool_result") {
      const results = Array.isArray(b.content) ? b.content : [];
      for (const r of results as Array<{
        type?: string;
        url?: string;
        title?: string;
      }>) {
        if (r?.type === "web_search_result" && r.url) {
          citations.push({ url: r.url, title: r.title ?? r.url });
        }
      }
    }
  }

  const finalTextParts: string[] = [];
  for (let i = lastNonTextIdx + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "text" && typeof b.text === "string") {
      finalTextParts.push(b.text);
    }
  }

  return {
    finalText: finalTextParts.join(""),
    searchCount: queries.length,
    queries,
    citations,
  };
}

const MODEL = "claude-opus-4-7";

export const SCHEMA_REFERENCE = `{
  "id": "kebab-case-from-name",                         // string, lowercase kebab-case
  "name": "Display Name",                                // string
  "birthYear": 1980,                                     // number | null
  "countryOfOrigin": "Sweden",                           // string
  "currentCountry": "Sweden",                            // string | null
  "imageUrl": null,                                      // string | null (URL to a headshot if easily found, else null)
  "archetypeArc": ["Student", "Founder"],                // ordered array of archetypes
  "confidence": "medium",                                // "high" | "medium" | "low"
  "education": [
    {
      "school": "KTH Royal Institute of Technology",
      "degree": "MSc Computer Science",                  // string | null
      "startYear": 2019,                                 // number | null
      "endYear": 2021,                                   // number | null
      "notes": null                                       // string | null
    }
  ],
  "careerSteps": [
    {
      "role": "Co-founder & CEO",
      "company": "Legora",
      "archetype": "Founder",                            // Student | Builder | Hustler | Founder | Investor | Operator | Other
      "startYear": 2023,                                 // number | null
      "endYear": null,                                   // number | null (null = ongoing)
      "estAgeStart": 23,                                 // number | null
      "estAgeEnd": null,                                 // number | null
      "estCompUsd": null,                                // number | [lowNum, highNum] | null
      "estCompConfidence": "low",                        // "high" | "medium" | "low"
      "keyDecisions": ["..."],                           // string[]
      "lessons": ["..."],                                // string[]
      "notes": "..."                                     // string | null
    }
  ],
  "outcomes": {
    "estNetWorthUsd": "100M+",                           // string | number | null. Buckets: "<1M" | "1-10M" | "10-100M" | "100M+" | "1B+"
    "exitEvents": [
      { "type": "acquisition", "year": 1998, "valueUsd": 49000000, "notes": "Viaweb → Yahoo!" }
    ],
    "currentStatus": "Free-text current role + influence."
  },
  "lessons": [
    { "lesson": "...", "source": "URL or 'inferred'" }   // source: string | null
  ],
  "sources": [
    { "title": "Wikipedia entry", "url": "https://...", "type": "article" }
    // type: "article" | "book" | "interview" | "podcast" | "biography" | "other"
    // AT LEAST ONE source required, ideally 3+
  ],
  "notes": "Era context + weighting guidance + caveats."  // string | null
}`;

const RESEARCHER_SYSTEM = `You are career-mapper's research agent. Your job: produce a STRUCTURED JSON RECORD for a person worth studying for career patterns — usually a founder, investor, or operator in technology.

You have web search available. USE IT — make 3-8 searches as needed. Search Wikipedia, company sites, interviews, news, VC portfolio pages, podcasts, Sifted/TechCrunch/Sifted/Atomico. Verify facts before writing.

## OUTPUT SCHEMA (output EXACTLY this shape — every field required, use null for unknown)

\`\`\`json
${SCHEMA_REFERENCE}
\`\`\`

## GUIDELINES

- **Don't hallucinate.** If birth year unknown after searching, use null. If comp unknown, null. Lower the 'confidence' field when data is sparse.
- **Cite sources.** 'sources' MUST contain at least 1 URL. Every entry in 'lessons' should have a source. Use the actual URLs from web search results.
- **Career steps chronological.** Earliest to latest. 3-7 steps usually right. Don't over-fragment.
- **Archetype taxonomy.**
  - **Student** — formal education (school/uni/PhD)
  - **Builder** — IC engineer / consultant / freelance technical work
  - **Hustler** — VC analyst/associate, accelerator, BD, sales-led
  - **Founder** — building own company as CEO/co-founder
  - **Investor** — full-time investor (partner, fund manager). Angel-on-the-side doesn't count — keep them in their primary role.
  - **Operator** — senior exec at a company they did NOT found (CEO/COO/President)
  - **Other** — use sparingly (writer, academic, gap year)
- **Recency in 'notes'.**
  - Pre-2005 founder: caveat that tactical timing is era-specific (pre-cloud, pre-mobile, pre-AI).
  - Post-2018: these lessons are most directly applicable to the current AI-revolution era.
- **Confidence.**
  - high = primary sources + well-known person
  - medium = some sources but biographical gaps
  - low = mostly inferred / sparse public information
- **id.** Lowercase kebab-case from the person's name. Examples: "max-junestrand", "patrick-collison", "demis-hassabis".
- **estAgeStart / estAgeEnd.** Compute from (year - birthYear) when both known. Else null.

## TONE

- Sober, factual. No hype. No "visionary genius" language.
- Lessons should be specific to this person, not generic platitudes.
- For European founders especially: note European-specific context (education-heavy paths, smaller exits, government grants, etc.) if relevant.

## OUTPUT FORMAT

Output ONLY the JSON object. Start with \`{\`. End with \`}\`. After the closing \`}\`, STOP — do not add notes, caveats, summaries, apologies, or commentary of any kind. Trailing prose breaks the parser.`;

export type ResearchResult = {
  draft: unknown;
  reasoning: string;
  searchCount: number;
  searchQueries: string[];
  citations: { url: string; title: string }[];
};

export async function researchPerson(
  name: string,
  hint?: string
): Promise<ResearchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local."
    );
  }
  const client = new Anthropic({ apiKey });

  const userMessage = hint?.trim()
    ? `Research: ${name}\n\nHint from user: ${hint}`
    : `Research: ${name}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 8,
      },
    ] as Anthropic.Messages.ToolUnion[],
    system: RESEARCHER_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const { finalText, searchCount, queries, citations } = parseAnthropicResponse(
    response.content
  );

  if (!finalText.trim()) {
    throw new Error(
      `Claude returned no final text block. stop_reason=${response.stop_reason}, blocks=${response.content.length}, searches=${searchCount}.`
    );
  }

  const draft = extractJsonObject(finalText);

  return {
    draft,
    reasoning: `stop_reason=${response.stop_reason}\n\nsearches: ${queries.join(" | ")}\n\nfinal text (first 500): ${finalText.slice(0, 500)}`,
    searchCount,
    searchQueries: queries,
    citations,
  };
}
