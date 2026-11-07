import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AnalyzeResponse, FormInput } from "../src/lib/schema.ts";

// Runs are persisted as one JSON file per analysis under data/runs/. This is
// the source of truth for history — the browser just renders what's on disk,
// so there's no export/import dance and nothing lives only in localStorage.
export interface Run {
  id: string;
  at: number; // epoch ms
  input: FormInput;
  result: AnalyzeResponse;
}

const DIR = join(process.cwd(), "data", "runs");
const ID_RE = /^[\w.-]+$/; // guard against path traversal in DELETE

async function ensureDir(): Promise<void> {
  await mkdir(DIR, { recursive: true });
}

export async function listRuns(): Promise<Run[]> {
  await ensureDir();
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
  const runs: Run[] = [];
  for (const f of files) {
    try {
      runs.push(JSON.parse(await readFile(join(DIR, f), "utf8")) as Run);
    } catch {
      // Skip a corrupt/half-written file rather than failing the whole list.
    }
  }
  return runs.sort((a, b) => b.at - a.at); // newest first
}

export async function saveRun(input: FormInput, result: AnalyzeResponse): Promise<Run> {
  await ensureDir();
  const at = Date.now();
  const id = `${at}-${Math.random().toString(36).slice(2, 8)}`;
  const run: Run = { id, at, input, result };
  await writeFile(join(DIR, `${id}.json`), JSON.stringify(run, null, 2), "utf8");
  return run;
}

export async function deleteRun(id: string): Promise<boolean> {
  if (!ID_RE.test(id)) return false;
  try {
    await unlink(join(DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}
