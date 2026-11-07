import { complete } from "../src/lib/llm.ts";
import {
  buildCompaniesBlock,
  buildDiagnoseUser,
  buildGraderSystem,
  buildGraderUser,
  buildSourcesBlock,
  DIAGNOSE_SYSTEM,
  extractJsonText,
  normalizeForQuoteCheck,
} from "../src/lib/prompts.ts";
import {
  type Chunk,
  loadPrinciples,
  retrieveChunks,
  retrieveCompanies,
} from "../src/lib/retrieval.ts";
import {
  type AnalyzeResponse,
  AnalyzerOutput,
  Diagnosis,
  type FormInput,
} from "../src/lib/schema.ts";

// Find quotes the model claims but that don't appear verbatim in the sources.
function findVerbatimViolations(output: AnalyzerOutput, chunks: Chunk[]): string[] {
  const haystack = normalizeForQuoteCheck(chunks.map((c) => c.text).join("\n"));
  const violations: string[] = [];
  for (const section of output.sections) {
    for (const src of section.sources) {
      const needle = normalizeForQuoteCheck(src.quote);
      if (needle.length > 0 && !haystack.includes(needle)) {
        violations.push(`[${section.key}] not verbatim in sources: "${src.quote.slice(0, 80)}…"`);
      }
    }
  }
  return violations;
}

export async function analyze(form: FormInput): Promise<AnalyzeResponse> {
  // ---------- STEP 1: DIAGNOSE ----------
  const diagRaw = await complete({
    system: DIAGNOSE_SYSTEM,
    prompt: buildDiagnoseUser(form),
  });
  const diagParsed = Diagnosis.safeParse(JSON.parse(extractJsonText(diagRaw)));
  if (!diagParsed.success) {
    throw new Error(`Diagnosis failed schema: ${JSON.stringify(diagParsed.error.flatten())}`);
  }
  const diagnosis = diagParsed.data;

  // ---------- STEP 2: RETRIEVE (local) ----------
  const query = [
    form.idea ?? "",
    form.problem,
    form.solution,
    form.progress,
    form.doubts,
    diagnosis.load_bearing_risk,
    diagnosis.keywords.join(" "),
  ].join(" ");

  const [chunks, companies, principles] = await Promise.all([
    retrieveChunks(query, 10),
    retrieveCompanies(query, 6),
    loadPrinciples(),
  ]);

  // ---------- STEP 3: GRADE + VERDICT (with repair loop) ----------
  const baseSystem = buildGraderSystem(principles);
  const userMessage = buildGraderUser(
    form,
    diagnosis,
    buildSourcesBlock(chunks),
    buildCompaniesBlock(companies),
  );

  let lastError: string | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const system = lastError
      ? `${baseSystem}\n\nPREVIOUS ATTEMPT FAILED:\n${lastError}\nFix it. Every quote must be VERBATIM from SOURCES; if none fits, use "sources": []. Output ONLY the JSON object.`
      : baseSystem;

    const raw = await complete({ system, prompt: userMessage });

    let json: unknown;
    try {
      json = JSON.parse(extractJsonText(raw));
    } catch {
      lastError = "Output was not valid JSON. Return only the JSON object, no prose, no fences.";
      continue;
    }

    // The model occasionally returns one or two extra items. Clamp the
    // bounded arrays to schema limits rather than discarding a whole (slow,
    // otherwise-valid) analysis over a count overflow.
    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      if (Array.isArray(obj.next_steps)) obj.next_steps = obj.next_steps.slice(0, 3);
      if (Array.isArray(obj.comparables)) obj.comparables = obj.comparables.slice(0, 3);
      if (Array.isArray(obj.sections)) {
        for (const s of obj.sections) {
          if (s && typeof s === "object") {
            const sec = s as Record<string, unknown>;
            if (Array.isArray(sec.sources)) sec.sources = sec.sources.slice(0, 2);
          }
        }
      }
    }

    const parsed = AnalyzerOutput.safeParse(json);
    if (!parsed.success) {
      lastError = `Output failed schema validation: ${JSON.stringify(parsed.error.flatten())}`;
      continue;
    }

    const violations = findVerbatimViolations(parsed.data, chunks);
    if (violations.length > 0) {
      lastError = `Hallucinated quotes — must be VERBATIM in SOURCES:\n${violations.join("\n")}`;
      continue;
    }

    return {
      output: parsed.data,
      meta: {
        diagnosis,
        sources_used: Array.from(new Set(chunks.map((c) => c.source))),
        attempt,
      },
    };
  }

  throw new Error(`Analyzer failed after 2 attempts. Last error: ${lastError}`);
}
