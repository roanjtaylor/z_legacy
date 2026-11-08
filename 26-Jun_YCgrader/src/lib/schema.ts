import { z } from "zod";

// ---------------------------------------------------------------------------
// Input — the four plain founder fields (plus an optional one-line summary).
// ---------------------------------------------------------------------------

export const FormInput = z.object({
  idea: z.string().min(1).max(280).optional(), // optional one-line summary
  problem: z.string().min(1).max(3000), // What problem? Who has it, how badly?
  solution: z.string().min(1).max(3000), // What are you building?
  progress: z.string().min(1).max(3000), // What have you done / learned / built?
  doubts: z.string().min(1).max(3000), // Biggest risks / fears?
});
export type FormInput = z.infer<typeof FormInput>;

export const SECTION_KEYS = ["problem", "solution", "progress", "doubts"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

// ---------------------------------------------------------------------------
// Diagnosis — cheap first-pass classification that drives retrieval.
// ---------------------------------------------------------------------------

export const Diagnosis = z.object({
  shape: z.string().min(1).max(280), // one-line structural description
  load_bearing_risk: z.string().min(1).max(280), // the single biggest risk
  inferred_stage: z.enum(["idea", "building", "launched"]),
  keywords: z.array(z.string().min(1).max(60)).min(1).max(12),
});
export type Diagnosis = z.infer<typeof Diagnosis>;

// ---------------------------------------------------------------------------
// Output — the graded report.
// ---------------------------------------------------------------------------

// Three-way verdict. `explore` = promising but the load-bearing risk is
// untested; run the named experiment. See content/principles/verdict-doctrine.md
export const Verdict = z.enum(["go", "explore", "reconsider"]);
export type Verdict = z.infer<typeof Verdict>;

export const Grade = z.enum(["green", "yellow", "red"]);
export type Grade = z.infer<typeof Grade>;

export const Source = z.object({
  quote: z.string().min(1), // VERBATIM from a retrieved source
  source: z.string().min(1), // title, e.g. "How to Get Startup Ideas"
  url: z.string().min(1),
});
export type Source = z.infer<typeof Source>;

export const Section = z.object({
  key: z.enum(SECTION_KEYS),
  grade: Grade,
  analysis: z.string().min(1), // direct, PG-voice, no hedging
  sources: z.array(Source).max(2),
});
export type Section = z.infer<typeof Section>;

export const Comparable = z.object({
  name: z.string().min(1),
  outcome: z.string().min(1), // active | acquired | public | dead
  lesson: z.string().min(1),
  url: z.string().min(1),
});
export type Comparable = z.infer<typeof Comparable>;

export const NextStep = z.object({
  text: z.string().min(1), // concrete, time-boxed experiment
  why: z.string().min(1), // what it tests / de-risks
});
export type NextStep = z.infer<typeof NextStep>;

export const AnalyzerOutput = z.object({
  verdict: Verdict,
  conviction: z.number().int().min(0).max(100), // strength of the case to proceed
  headline: z.string().min(1).max(280), // one PG-style sentence — the call
  sections: z.array(Section).length(4),
  comparables: z.array(Comparable).max(3),
  next_steps: z.array(NextStep).min(1).max(3),
});
export type AnalyzerOutput = z.infer<typeof AnalyzerOutput>;

// What POST /api/analyze returns to the client.
export const AnalyzeResponse = z.object({
  output: AnalyzerOutput,
  meta: z.object({
    diagnosis: Diagnosis,
    sources_used: z.array(z.string()),
    attempt: z.number().int(),
  }),
});
export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;

// ---------------------------------------------------------------------------
// Curated YC company record (content/yc-companies/companies.json).
// ---------------------------------------------------------------------------

export const Company = z.object({
  name: z.string().min(1),
  batch: z.string().min(1),
  outcome: z.enum(["active", "acquired", "public", "dead"]),
  one_liner: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  what_they_did: z.string().min(1),
  lesson: z.string().min(1),
  url: z.string().min(1),
});
export type Company = z.infer<typeof Company>;
