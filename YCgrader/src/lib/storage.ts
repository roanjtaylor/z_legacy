import type { AnalyzeResponse, FormInput } from "./schema.ts";

// History lives in server-side files (data/runs/), not the browser. These are
// thin wrappers over the /api/runs endpoints; the analysis itself is saved by
// the server when POST /api/analyze succeeds.
export interface Run {
  id: string;
  at: number; // epoch ms
  input: FormInput;
  result: AnalyzeResponse;
}

export async function fetchRuns(): Promise<Run[]> {
  const res = await fetch("/api/runs");
  if (!res.ok) return [];
  const json = (await res.json()) as { runs?: Run[] };
  return json.runs ?? [];
}

export async function deleteRun(id: string): Promise<void> {
  await fetch(`/api/runs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
