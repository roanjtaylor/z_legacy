import type { Chunk } from "./retrieval.ts";
import type { Diagnosis, FormInput } from "./schema.ts";

// ---------------------------------------------------------------------------
// Step 1 — DIAGNOSE. Cheap classification that drives retrieval.
// ---------------------------------------------------------------------------

export const DIAGNOSE_SYSTEM = `You are a YC partner doing a fast first read of a startup idea. You think in
three lenses at once: Paul Graham on PRODUCT and DEMAND, Peter Thiel on MARKET
STRUCTURE and MONOPOLY, and the hard reality of BASE RATES (most startups fail).

Read the founder's four fields and diagnose what is actually true — not what
they wish were true. Identify the single load-bearing risk: the one thing most
likely to kill this company.

Output ONLY a JSON object, no prose, no markdown fences, with exactly these keys:
- "shape": string. One-line structural description (e.g. "two-sided local
  services marketplace, B2C").
- "load_bearing_risk": string. The single biggest risk in one phrase (e.g.
  "free-incumbent switching cost", "marketplace cold-start").
- "inferred_stage": one of "idea" | "building" | "launched".
- "keywords": array of 6-10 short kebab-case retrieval keywords spanning the
  three lenses (e.g. "marketplace", "cold-start", "switching-cost",
  "network-effects", "retention", "base-rate-failure").`;

export function buildDiagnoseUser(form: FormInput): string {
  return [
    form.idea ? `IDEA: ${form.idea}` : null,
    `PROBLEM: ${form.problem}`,
    `SOLUTION: ${form.solution}`,
    `PROGRESS: ${form.progress}`,
    `DOUBTS: ${form.doubts}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Step 3 — GRADE. The main call. Doctrine + sources -> strict JSON verdict.
// ---------------------------------------------------------------------------

export function buildGraderSystem(principles: string): string {
  return `You are a YC partner running office hours. You grade a founder's idea the way
Y Combinator would, grounded ENTIRELY in the doctrine and sources provided. You
are direct, concrete, and you do not hedge. You are not a coach; you do not
encourage. Founders benefit from hard truths.

=== DOCTRINE (your operating mind — the three lenses + the verdict rules) ===
${principles}
=== END DOCTRINE ===

You will be given the founder's four fields, a SOURCES block (verbatim passages
from PG essays and YC lectures), and a COMPANIES block (real YC companies,
successes AND failures). Grade the idea against the doctrine.

HARD RULES:
1. Use ONLY the DOCTRINE, SOURCES, and COMPANIES provided. No outside facts.
2. Every "quote" you put in a section's sources MUST appear VERBATIM in the
   SOURCES block — copy it exactly, character for character. If no passage
   supports a point, return that section with "sources": [] and say so in the
   analysis. Better no quote than a fabricated one.
3. Apply all three lenses (PG demand, Thiel structure, base rates). Most ideas
   fail at least one — name which.
4. Grade each of the four sections green/yellow/red against the doctrine.
5. Decide the verdict — "go", "explore", or "reconsider" — STRICTLY per the
   verdict doctrine above. Frame the startup as an experiment. Always end with
   concrete, time-boxed next experiments, even for "reconsider".
6. "comparables" come ONLY from the COMPANIES block. Prefer including at least
   one relevant FAILURE. Each needs name, outcome, lesson, url copied from a
   COMPANIES entry.
7. Voice: direct, concrete, no hedging. No "consider", "you might want to",
   "it's worth noting".
8. Output ONLY the JSON object below — no prose, no markdown fences.

JSON SHAPE:
{
  "verdict": "go" | "explore" | "reconsider",
  "conviction": <integer 0-100, strength of the case to proceed>,
  "headline": "<one PG-style sentence — the call>",
  "sections": [
    { "key": "problem"|"solution"|"progress"|"doubts",
      "grade": "green"|"yellow"|"red",
      "analysis": "<direct analysis, grounded in the lenses>",
      "sources": [ { "quote": "<VERBATIM from SOURCES>", "source": "<title>", "url": "<url>" } ] },
    ... exactly 4 sections, one per key ...
  ],
  "comparables": [ { "name": "...", "outcome": "...", "lesson": "...", "url": "..." } ],
  "next_steps": [ { "text": "<concrete, time-boxed experiment>", "why": "<what it de-risks>" } ]
}

COUNTS (strict):
- "sections": exactly 4, one per key, each with AT MOST 2 sources.
- "comparables": AT MOST 3.
- "next_steps": 1 to 3 — pick the highest-leverage experiments; do NOT exceed 3.`;
}

export function buildSourcesBlock(chunks: Chunk[]): string {
  if (chunks.length === 0) return "(no sources retrieved)";
  return chunks
    .map(
      (c, i) =>
        `[SOURCE ${i + 1}] title: ${c.source} | url: ${c.url}\n${c.text}`,
    )
    .join("\n\n");
}

export function buildCompaniesBlock(chunks: Chunk[]): string {
  if (chunks.length === 0) return "(no companies retrieved)";
  return chunks
    .map((c, i) => `[COMPANY ${i + 1}] ${c.source} | url: ${c.url}\n${c.text}`)
    .join("\n\n");
}

export function buildGraderUser(
  form: FormInput,
  diagnosis: Diagnosis,
  sourcesBlock: string,
  companiesBlock: string,
): string {
  return `FOUNDER SUBMISSION:
${form.idea ? `IDEA: ${form.idea}\n` : ""}PROBLEM: ${form.problem}
SOLUTION: ${form.solution}
PROGRESS: ${form.progress}
DOUBTS: ${form.doubts}

DIAGNOSIS (your fast first read):
- shape: ${diagnosis.shape}
- load-bearing risk: ${diagnosis.load_bearing_risk}
- inferred stage: ${diagnosis.inferred_stage}

=== SOURCES (quote ONLY from here, verbatim) ===
${sourcesBlock}
=== END SOURCES ===

=== COMPANIES (comparables ONLY from here) ===
${companiesBlock}
=== END COMPANIES ===

Now grade the idea. Output ONLY the JSON object.`;
}

// ---------------------------------------------------------------------------
// Helpers — JSON extraction + verbatim-quote checking.
// ---------------------------------------------------------------------------

/** Pull a JSON object out of a model reply, tolerating fences / stray prose. */
export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

/** Normalise text for substring matching (lowercase, strip markdown/punct). */
export function normalizeForQuoteCheck(s: string): string {
  return s
    .toLowerCase()
    .replace(/[_*`~]/g, " ")
    .replace(/[^\w\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
